import { Schema, model, Document } from 'mongoose';
import type { SnapshotState } from './RiskSnapshot.js';

export type DriftEventStatus =
  | 'NEW'
  | 'ACTIVITY_CREATED'
  | 'IN_REVIEW'
  | 'INFO_REQUESTED'
  | 'CLOSED';

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH';

/** Open statuses — used to compute isOpen and the partial unique index. */
export const OPEN_STATUSES: DriftEventStatus[] = [
  'NEW',
  'ACTIVITY_CREATED',
  'IN_REVIEW',
  'INFO_REQUESTED',
];

export interface RuleBreakdownEntry {
  ruleId: string;
  points: number;
  reason: string;
  evidenceRefs: string[];
}

export interface IDriftEvent extends Document {
  eventId: string;
  policyId: string;
  status: DriftEventStatus;
  severity: Severity;
  score: number;
  confidence: number;
  verifyFirst: boolean;
  portfolioBreach: boolean;
  /** Derived from status; drives the partial unique index. */
  isOpen: boolean;
  idempotencyKey: string;
  changes: Record<string, unknown>[];
  ruleBreakdown: RuleBreakdownEntry[];
  ruleVersion: string;
  before: SnapshotState;
  after: SnapshotState;
  signalIds: string[];
  recommendedAction: string;
  whyItMatters: string;
}

const RuleBreakdownEntrySchema = new Schema<RuleBreakdownEntry>(
  {
    ruleId: { type: String, required: true },
    points: { type: Number, required: true },
    reason: { type: String, required: true },
    evidenceRefs: { type: [String], default: [] },
  },
  { _id: false },
);

const DriftEventSchema = new Schema<IDriftEvent>(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    policyId: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ['NEW', 'ACTIVITY_CREATED', 'IN_REVIEW', 'INFO_REQUESTED', 'CLOSED'],
      required: true,
      default: 'NEW',
    },
    severity: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], required: true },
    score: { type: Number, required: true },
    confidence: { type: Number, required: true },
    verifyFirst: { type: Boolean, required: true, default: false },
    portfolioBreach: { type: Boolean, required: true, default: false },
    /**
     * isOpen is derived from status and stored as a field so MongoDB can
     * use it in a partialFilterExpression for the idempotency key index.
     * It is kept in sync by the pre-save hook below.
     * (Amendment #3)
     */
    isOpen: { type: Boolean, required: true, default: true },
    idempotencyKey: { type: String, required: true },
    changes: { type: Schema.Types.Mixed, default: [] },
    ruleBreakdown: { type: [RuleBreakdownEntrySchema], default: [] },
    ruleVersion: { type: String, required: true },
    before: { type: Schema.Types.Mixed, required: true },
    after: { type: Schema.Types.Mixed, required: true },
    signalIds: { type: [String], default: [] },
    recommendedAction: { type: String, required: true },
    whyItMatters: { type: String, required: true },
  },
  { timestamps: true },
);

/**
 * Keep isOpen in sync with status automatically.
 * This hook runs on save() and findOneAndUpdate() (when new: true).
 */
DriftEventSchema.pre('save', function (this: IDriftEvent, next) {
  this.isOpen = OPEN_STATUSES.includes(this.status as DriftEventStatus);
  next();
});

DriftEventSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() as Record<string, unknown> | null;
  if (update && '$set' in update) {
    const $set = update['$set'] as Record<string, unknown>;
    if (typeof $set['status'] === 'string') {
      $set['isOpen'] = OPEN_STATUSES.includes($set['status'] as DriftEventStatus);
    }
  }
  next();
});

/**
 * Unique partial index on idempotencyKey — only enforced when isOpen = true.
 * This means: at most one open event per idempotency key at a time.
 * A closed event does NOT block a new open event for the same key.
 * (Amendment #3, Spec Section 4)
 */
DriftEventSchema.index(
  { idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { isOpen: true },
    name: 'idempotencyKey_open_unique',
  },
);

/** For listing events by policy and status efficiently. */
DriftEventSchema.index({ policyId: 1, status: 1 });
DriftEventSchema.index({ status: 1, severity: 1 });

export const DriftEvent = model<IDriftEvent>('DriftEvent', DriftEventSchema);
