import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { AuditLog } from '../../src/models/AuditLog.js';
import { DriftEvent } from '../../src/models/DriftEvent.js';
import { ensureIndexes, seedDb } from '../../src/seed/index.js';

describe('GET /portfolio/exposure', () => {
  let replSet: MongoMemoryReplSet;
  const app = createApp();

  beforeAll(async () => {
    replSet = await MongoMemoryReplSet.create({
      binary: { version: '7.0.14' },
      replSet: { count: 1, name: 'rs0', storageEngine: 'wiredTiger' },
    });
    await mongoose.connect(replSet.getUri('eds-portfolio'));
    await ensureIndexes();
    await seedDb();
  }, 60_000);

  afterAll(async () => {
    await mongoose.disconnect();
    await replSet.stop();
  }, 30_000);

  it('reports baseline exposure and event what-if breach', async () => {
    const baseline = await request(app).get('/portfolio/exposure');
    expect(baseline.status).toBe(200);
    expect(baseline.body.totalPortfolioTiv).toBe(300_000_000);
    const baselineSouthEast = baseline.body.regions.find((region: { region: string }) => region.region === 'South-East');
    expect(baselineSouthEast.share).toBeCloseTo(0.197, 3);
    expect(baselineSouthEast.breach).toBe(false);

    const signal = await request(app).post('/signals').send({
      type: 'PROPERTY_CHANGE',
      source: 'portfolio-test',
      observedAt: '2026-10-11T00:00:00.000Z',
      policyId: 'POL-100245',
      payload: {
        change: 'NEW_LOCATION',
        addressLine: 'Portfolio Demo Facility',
        city: 'Savannah',
        postalCode: '31401',
        tiv: 1_400_000,
      },
    });
    expect(signal.status).toBe(201);
    const eventId = signal.body.event.eventId as string;

    const whatIf = await request(app).get(`/portfolio/exposure?eventId=${eventId}`);
    expect(whatIf.status).toBe(200);
    const whatIfSouthEast = whatIf.body.regions.find((region: { region: string }) => region.region === 'South-East');
    expect(whatIfSouthEast.share).toBeCloseTo(0.20073, 4);
    expect(whatIfSouthEast.breach).toBe(true);
    expect(await DriftEvent.findOne({ eventId }).then((event) => event?.portfolioBreach)).toBe(true);
    expect(await AuditLog.countDocuments({ entityId: eventId, action: 'PORTFOLIO_BREACH' })).toBe(1);
  });
});