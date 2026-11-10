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

  it('serves Guidewire PolicyCenter product-definitions endpoints', async () => {
    const listRes = await request(app).get('/pc/product-definitions');
    expect(listRes.status).toBe(200);
    expect(Array.isArray(listRes.body)).toBe(true);
    expect(listRes.body.length).toBe(9);

    const cpBase = listRes.body.find((p: { productCode: string }) => p.productCode === 'CP-BASE');
    expect(cpBase).toBeDefined();
    expect(cpBase.lineOfBusiness).toBe('Commercial Property');
    expect(cpBase.monitoredHazards).toHaveLength(8);

    const eqRes = await request(app).get('/pc/product-definitions/CP-EQ');
    expect(eqRes.status).toBe(200);
    expect(eqRes.body.productCode).toBe('CP-EQ');
    expect(eqRes.body.primaryHazard).toBe('earthquake');
    expect(eqRes.body.monitoredHazards).toEqual(['earthquake']);

    const notFound = await request(app).get('/pc/product-definitions/NON-EXISTENT');
    expect(notFound.status).toBe(404);
  });

  it('runs hazard_update scenario in simulator', async () => {
    const res = await request(app)
      .post('/simulator/scenarios/hazard_update')
      .send({ hazard: 'earthquake' });

    expect(res.status).toBe(200);
    expect(res.body.scenario).toBe('hazard_update');
    expect(res.body.policyId).toBe('POL-200101');
    expect(res.body.steps.at(-1)).toBe('Scenario complete');
    expect(res.body.signal.type).toBe('HAZARD_UPDATE');
    expect(res.body.signal.payload.hazard).toBe('earthquake');
    expect(res.body.event).toBeDefined();
    expect(res.body.event.severity).toBe('HIGH');
  });
});