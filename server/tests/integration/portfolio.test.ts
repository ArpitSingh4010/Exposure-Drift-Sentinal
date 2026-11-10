import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { AuditLog } from '../../src/models/AuditLog.js';
import { DriftEvent } from '../../src/models/DriftEvent.js';
import { Policy } from '../../src/models/Policy.js';
import { Product } from '../../src/models/Product.js';
import { Location } from '../../src/models/Location.js';
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
    if (replSet) await replSet.stop();
  }, 30_000);

  it('reports baseline exposure and event what-if breach', async () => {
    const baseline = await request(app).get('/portfolio/exposure');
    expect(baseline.status).toBe(200);
    expect(baseline.body.totalPortfolioTiv).toBe(300_000_000);
    expect(baseline.body.hazard).toBe('flood');
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

  it('reports exposure for requested hazard parameter', async () => {
    const response = await request(app).get('/portfolio/exposure?hazard=earthquake');
    expect(response.status).toBe(200);
    expect(response.body.hazard).toBe('earthquake');
    expect(response.body.regions).toBeDefined();
    expect(response.body.regions.length).toBeGreaterThan(0);
  });

  it('returns summary for all 8 hazards from GET /portfolio/summary', async () => {
    const response = await request(app).get('/portfolio/summary');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(8);

    const hazards = response.body.map((entry: { hazard: string }) => entry.hazard);
    expect(hazards).toEqual(
      expect.arrayContaining([
        'flood',
        'earthquake',
        'tsunami',
        'cyclone',
        'wildfire',
        'landslide',
        'tornado',
        'severe_storm',
      ]),
    );

    for (const item of response.body) {
      expect(item.worstRegion).toBeDefined();
      expect(typeof item.share).toBe('number');
      expect(typeof item.cap).toBe('number');
      expect(typeof item.headroom).toBe('number');
      expect(typeof item.breach).toBe('boolean');
      expect(['Within appetite', 'Over cap']).toContain(item.status);
    }
  });

  it('verifies seeded products and multi-hazard demo policies', async () => {
    // 9 products seeded
    const productCount = await Product.countDocuments();
    expect(productCount).toBe(9);

    // All policies have valid product codes
    const invalidPolicies = await Policy.countDocuments({
      productCode: {
        $nin: [
          'CP-BASE',
          'CP-FLD',
          'CP-EQ',
          'CP-TSU',
          'CP-WND',
          'CP-WLD',
          'CP-LSL',
          'CP-TOR',
          'CP-SCS',
        ],
      },
    });
    expect(invalidPolicies).toBe(0);

    // All 7 new demo policies exist
    const demoPolicyIds = [
      'POL-200101',
      'POL-200102',
      'POL-200103',
      'POL-200104',
      'POL-200105',
      'POL-200106',
      'POL-200107',
    ];
    for (const pid of demoPolicyIds) {
      const pol = await Policy.findOne({ policyId: pid }).lean();
      expect(pol).not.toBeNull();
      const locs = await Location.find({ policyId: pid }).lean();
      expect(locs).toHaveLength(2);
      const totalTiv = locs.reduce((sum, l) => sum + l.tiv, 0);
      expect(totalTiv).toBe(4_000_000);
    }
  });
});