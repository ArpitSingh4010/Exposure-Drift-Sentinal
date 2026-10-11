import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { ensureIndexes, seedDb } from '../../src/seed/index.js';
import { DriftEvent } from '../../src/models/DriftEvent.js';

describe('POST /signals', () => {
  let replSet: MongoMemoryReplSet;
  const app = createApp();
  const newFacility = {
    type: 'PROPERTY_CHANGE',
    source: 'simulator',
    observedAt: '2026-10-11T00:00:00.000Z',
    policyId: 'POL-100245',
    payload: {
      change: 'NEW_LOCATION',
      addressLine: '900 Demo Facility Way',
      city: 'Savannah',
      postalCode: '31401',
      tiv: 1_400_000,
    },
  };

  beforeAll(async () => {
    replSet = await MongoMemoryReplSet.create({
      binary: { version: '7.0.14' },
      replSet: { count: 1, name: 'rs0', storageEngine: 'wiredTiger' },
    });
    await mongoose.connect(replSet.getUri('eds-test'));
    await ensureIndexes();
    await seedDb();
  }, 60_000);

  afterAll(async () => {
    await mongoose.disconnect();
    await replSet.stop();
  }, 30_000);

  it('creates a HIGH event and merges a duplicate signal', async () => {
    const first = await request(app).post('/signals').send(newFacility);
    expect(first.status).toBe(201);
    expect(first.body.event.severity).toBe('HIGH');
    expect(first.body.event.ruleBreakdown.map((entry: { ruleId: string }) => entry.ruleId)).toEqual(
      expect.arrayContaining(['R1_TIV_INCREASE', 'R2_NEW_LOCATION', 'R3_HIGH_FLOOD_ZONE', 'R5_COMBINED_ESCALATION']),
    );

    const second = await request(app).post('/signals').send(newFacility);
    expect(second.status).toBe(201);
    expect(second.body.event.eventId).toBe(first.body.event.eventId);
    expect(second.body.event.signalIds).toHaveLength(2);
  });

  it('allows a new event after the previous event is closed', async () => {
    await DriftEvent.updateOne(
      { eventId: 'missing' },
      { $set: { status: 'CLOSED' } },
    );
    const event = await DriftEvent.findOne({ policyId: 'POL-100245' }).exec();
    if (!event) throw new Error('Expected seeded signal event');
    event.status = 'CLOSED';
    await event.save();

    const response = await request(app).post('/signals').send(newFacility);
    expect(response.status).toBe(201);
    expect(response.body.event.eventId).not.toBe(event.eventId);
  });

  it('merges concurrent duplicate inserts through the unique open-event index', async () => {
    const concurrentFacility = {
      ...newFacility,
      payload: {
        ...newFacility.payload,
        addressLine: '901 Concurrent Facility Way',
      },
    };
    const responses = await Promise.all([
      request(app).post('/signals').send(concurrentFacility),
      request(app).post('/signals').send(concurrentFacility),
    ]);

    expect(responses[0]?.status).toBe(201);
    expect(responses[1]?.status).toBe(201);
    expect(responses[0]?.body.event.eventId).toBe(responses[1]?.body.event.eventId);
  });

  it('resolves a flood update by location id', async () => {
    const response = await request(app).post('/signals').send({
      type: 'FLOOD_UPDATE',
      source: 'simulator',
      observedAt: '2026-10-11T00:00:00.000Z',
      payload: {
        locationId: 'LOC-D0001',
        floodZone: 'AE',
        floodScore: 8,
      },
    });
    expect(response.status).toBe(201);
    expect(response.body.resolvedPolicyId).toBe('POL-100245');
  });
});