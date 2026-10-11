import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { ensureIndexes, seedDb } from '../../src/seed/index.js';

describe('P7 routes', () => {
  let replSet: MongoMemoryReplSet;
  const app = createApp();

  beforeAll(async () => {
    replSet = await MongoMemoryReplSet.create({ binary: { version: '7.0.14' }, replSet: { count: 1, name: 'rs0', storageEngine: 'wiredTiger' } });
    await mongoose.connect(replSet.getUri('eds-p7'));
    await ensureIndexes();
    await seedDb();
  }, 60_000);

  afterAll(async () => {
    await mongoose.disconnect();
    await replSet.stop();
  }, 30_000);

  it('serves rules, policy detail, simulator logs, and audit entries', async () => {
    const rules = await request(app).get('/rules');
    expect(rules.status).toBe(200);
    expect(rules.body.version).toHaveLength(64);
    expect(rules.body.yamlText).toContain('R1_TIV_INCREASE');

    const policies = await request(app).get('/policies?search=POL-100245');
    expect(policies.status).toBe(200);
    expect(policies.body[0].policyId).toBe('POL-100245');

    const detail = await request(app).get('/policies/POL-100245');
    expect(detail.status).toBe(200);
    expect(detail.body.locations).toHaveLength(2);

    const simulation = await request(app).post('/simulator/scenarios/new_facility').send({ policyId: 'POL-100245' });
    expect(simulation.status).toBe(200);
    expect(simulation.body.steps.at(-1)).toBe('Scenario complete');
    expect(simulation.body.event.severity).toBe('HIGH');

    const audit = await request(app).get('/audit?entityType=DRIFT_EVENT');
    expect(audit.status).toBe(200);
    expect(audit.body.some((entry: { action: string }) => entry.action === 'CREATE_EVENT')).toBe(true);
  });
});