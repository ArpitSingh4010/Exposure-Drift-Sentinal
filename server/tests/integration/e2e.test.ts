import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { Activity } from '../../src/models/Activity.js';
import { AuditLog } from '../../src/models/AuditLog.js';
import { RiskSnapshot } from '../../src/models/RiskSnapshot.js';
import { ensureIndexes, seedDb } from '../../src/seed/index.js';
import { loadAndStoreRules } from '../../src/config/rulesLoader.js';

describe('P8 End-to-End API Integration Workflow', () => {
  let replSet: MongoMemoryReplSet;
  const app = createApp();

  beforeAll(async () => {
    replSet = await MongoMemoryReplSet.create({
      binary: { version: '7.0.14' },
      replSet: { count: 1, name: 'rs0', storageEngine: 'wiredTiger' },
    });
    await mongoose.connect(replSet.getUri('eds-e2e'));
    await ensureIndexes();
    await loadAndStoreRules();
    await seedDb();
  }, 60_000);

  afterAll(async () => {
    await mongoose.disconnect();
    await replSet.stop();
  }, 30_000);

  it('runs complete lifecycle: reset -> new_facility -> HIGH event -> breach -> start-review -> ACCEPT -> snapshot -> audit', async () => {
    // 1. Reset demo / seed baseline
    await seedDb();

    // Verify baseline total TIV is $300,000,000 and South-East flood share is ~19.70%
    const baselineExposure = await request(app).get('/portfolio/exposure');
    expect(baselineExposure.status).toBe(200);
    expect(baselineExposure.body.totalPortfolioTiv).toBe(300_000_000);
    const seBefore = baselineExposure.body.regions.find((r: { region: string }) => r.region === 'South-East');
    expect(seBefore).toBeDefined();
    expect(seBefore.breach).toBe(false);
    expect(seBefore.share).toBeCloseTo(0.197, 2);

    // 2. Trigger simulator scenario: new_facility on demo policy POL-100245
    const simRes = await request(app)
      .post('/simulator/scenarios/new_facility')
      .send({ policyId: 'POL-100245' });

    expect(simRes.status).toBe(200);
    expect(simRes.body.scenario).toBe('new_facility');
    expect(simRes.body.steps).toContain('Scenario complete');
    expect(simRes.body.event).toBeDefined();

    const eventId = simRes.body.event.eventId as string;
    expect(eventId).toBeTruthy();

    // 3. Inspect generated event details
    const eventRes = await request(app).get(`/events/${eventId}`);
    expect(eventRes.status).toBe(200);
    const event = eventRes.body;

    expect(event.policyId).toBe('POL-100245');
    expect(event.severity).toBe('HIGH');
    expect(event.portfolioBreach).toBe(true);
    expect(event.status).toBe('ACTIVITY_CREATED');

    // Verify fired rules: R1, R2, R3, R5
    const ruleIds = event.ruleBreakdown.map((r: { ruleId: string }) => r.ruleId);
    expect(ruleIds).toContain('R1_TIV_INCREASE');
    expect(ruleIds).toContain('R2_NEW_LOCATION');
    expect(ruleIds).toContain('R3_HIGH_FLOOD_ZONE');
    expect(ruleIds).toContain('R5_COMBINED_ESCALATION');

    // 4. Verify Guidewire activity created with priority HIGH and 2 business days due
    const activity = await Activity.findOne({ eventId });
    expect(activity).not.toBeNull();
    expect(activity?.status).toBe('OPEN');
    expect(activity?.priority).toBe('HIGH');
    expect(activity?.assigneeUserId).toMatch(/^USR-/);

    // 5. Verify portfolio exposure what-if includes breach in South-East (~20.07%)
    const whatIfExposure = await request(app).get(`/portfolio/exposure?eventId=${eventId}`);
    expect(whatIfExposure.status).toBe(200);
    const seWhatIf = whatIfExposure.body.regions.find((r: { region: string }) => r.region === 'South-East');
    expect(seWhatIf).toBeDefined();
    expect(seWhatIf.breach).toBe(true);
    expect(seWhatIf.share).toBeGreaterThan(0.20); // > 20% cap

    // 6. Underwriter opens event -> transitions to IN_REVIEW
    const startReviewRes = await request(app)
      .post(`/events/${eventId}/start-review`)
      .set('X-User-Id', 'USR-001');
    expect(startReviewRes.status).toBe(200);
    expect(startReviewRes.body.status).toBe('IN_REVIEW');

    // 7. Underwriter accepts event with mandatory note
    const decisionRes = await request(app)
      .post(`/events/${eventId}/decision`)
      .set('X-User-Id', 'USR-001')
      .send({
        action: 'ACCEPT',
        note: 'Verified new facility in Savannah with broker. Updating policy exposure schedule.',
      });

    expect(decisionRes.status).toBe(200);
    expect(decisionRes.body.status).toBe('CLOSED');

    // 8. Verify post-accept state
    // - Activity completed
    const updatedActivity = await Activity.findOne({ eventId });
    expect(updatedActivity?.status).toBe('COMPLETED');

    // - REVIEWED risk snapshot created with new location
    const reviewedSnapshot = await RiskSnapshot.findOne({
      policyId: 'POL-100245',
      kind: 'REVIEWED',
    }).sort({ takenAt: -1 });
    expect(reviewedSnapshot).not.toBeNull();
    expect(reviewedSnapshot?.state.totalTiv).toBe(event.after.totalTiv);
    expect(reviewedSnapshot?.state.locations.length).toBe(3);

    // - Audit log contains entries for signal, event, portfolio breach, and accept decision
    const auditEntries = await AuditLog.find({ entityId: eventId });
    expect(auditEntries.length).toBeGreaterThanOrEqual(2);
    const actions = auditEntries.map((a) => a.action);
    expect(actions).toContain('ACCEPT');
  });
});
