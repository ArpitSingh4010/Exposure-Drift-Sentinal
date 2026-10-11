import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { Activity } from '../../src/models/Activity.js';
import { AuditLog } from '../../src/models/AuditLog.js';
import { DriftEvent } from '../../src/models/DriftEvent.js';
import { RiskSnapshot } from '../../src/models/RiskSnapshot.js';
import { ensureIndexes, seedDb } from '../../src/seed/index.js';

describe('P4 event workflow', () => {
  let replSet: MongoMemoryReplSet;
  const app = createApp();

  beforeAll(async () => {
    replSet = await MongoMemoryReplSet.create({
      binary: { version: '7.0.14' },
      replSet: { count: 1, name: 'rs0', storageEngine: 'wiredTiger' },
    });
    await mongoose.connect(replSet.getUri('eds-events'));
    await ensureIndexes();
    await seedDb();
  }, 60_000);

  afterAll(async () => {
    await mongoose.disconnect();
    await replSet.stop();
  }, 30_000);

  async function createEvent(addressLine: string) {
    const response = await request(app).post('/signals').send({
      type: 'PROPERTY_CHANGE',
      source: 'p4-test',
      observedAt: '2026-10-11T00:00:00.000Z',
      policyId: 'POL-100245',
      payload: {
        change: 'NEW_LOCATION',
        addressLine,
        city: 'Savannah',
        postalCode: '31401',
        tiv: 1_400_000,
      },
    });
    expect(response.status).toBe(201);
    return response.body.event.eventId as string;
  }

  it('round-trips the mock adapter and completes an activity', async () => {
    const created = await request(app).post('/pc/policies/POL-100245/activities').send({
      eventId: 'EVT-ADAPTER',
      subject: 'Adapter test',
      description: 'Adapter test activity',
      priority: 'LOW',
      dueBusinessDays: 10,
    });
    expect(created.status).toBe(201);
    expect(created.body.assigneeUserId).toMatch(/^USR-/);
    expect(created.body.status).toBe('OPEN');

    const completed = await request(app)
      .post(`/pc/activities/${created.body.activityId}/complete`)
      .send({ outcome: 'DONE', note: 'Completed in test' });
    expect(completed.status).toBe(200);
    expect(completed.body.status).toBe('COMPLETED');
  });

  it('starts review idempotently and ACCEPT creates a reviewed snapshot', async () => {
    const eventId = await createEvent('P4 Accept Facility');
    const first = await request(app)
      .post(`/events/${eventId}/start-review`)
      .set('X-User-Id', 'USR-001');
    expect(first.status).toBe(200);
    expect(first.body.status).toBe('IN_REVIEW');

    const second = await request(app)
      .post(`/events/${eventId}/start-review`)
      .set('X-User-Id', 'USR-001');
    expect(second.status).toBe(200);
    expect(second.body.status).toBe('IN_REVIEW');

    const accepted = await request(app)
      .post(`/events/${eventId}/decision`)
      .set('X-User-Id', 'USR-001')
      .send({ action: 'ACCEPT', note: 'Reviewed and accepted' });
    expect(accepted.status).toBe(200);
    expect(accepted.body.status).toBe('CLOSED');
    expect(await RiskSnapshot.countDocuments({ policyId: 'POL-100245', kind: 'REVIEWED' })).toBe(1);
    expect(await Activity.countDocuments({ eventId, status: 'COMPLETED' })).toBe(1);
    expect(await AuditLog.countDocuments({ entityId: eventId })).toBeGreaterThanOrEqual(2);
  });

  it('supports REQUEST_INFO and reopen, while invalid decisions return 409', async () => {
    const eventId = await createEvent('P4 Info Facility');
    await request(app).post(`/events/${eventId}/start-review`).set('X-User-Id', 'USR-001');
    const info = await request(app)
      .post(`/events/${eventId}/decision`)
      .set('X-User-Id', 'USR-001')
      .send({ action: 'REQUEST_INFO', note: 'Need updated occupancy details' });
    expect(info.status).toBe(200);
    expect(info.body.status).toBe('INFO_REQUESTED');

    const reopened = await request(app)
      .post(`/events/${eventId}/reopen`)
      .set('X-User-Id', 'USR-001');
    expect(reopened.status).toBe(200);
    expect(reopened.body.status).toBe('IN_REVIEW');

    const invalid = await request(app)
      .post(`/events/${eventId}/decision`)
      .set('X-User-Id', 'USR-001')
      .send({ action: 'DISMISS', note: 'Missing reason code' });
    expect(invalid.status).toBe(400);
  });

  it('rejects a state-machine violation with 409', async () => {
    const eventId = await createEvent('P4 Invalid Facility');
    const response = await request(app)
      .post(`/events/${eventId}/decision`)
      .set('X-User-Id', 'USR-001')
      .send({ action: 'ACCEPT', note: 'Cannot accept before review' });
    expect(response.status).toBe(409);
    expect(await DriftEvent.findOne({ eventId }).then((event) => event?.status)).toBe('ACTIVITY_CREATED');
  });
});