import { Schema, model, Document } from 'mongoose';
import type { FloodZone } from './Location.js';

/** A single location entry embedded inside a risk snapshot's state. */
export interface SnapshotLocation {
  locationId: string;
  addressLine: string;
  tiv: number;
  floodZone: FloodZone;
  floodScore: number;
}

/** The full state captured at snapshot time. */
export interface SnapshotState {
  locations: SnapshotLocation[];
  totalTiv: number;
}

export type SnapshotKind = 'BIND' | 'REVIEWED';

export interface IRiskSnapshot extends Document {
  policyId: string;
  takenAt: Date;
  kind: SnapshotKind;
  state: SnapshotState;
}

const SnapshotLocationSchema = new Schema<SnapshotLocation>(
  {
    locationId: { type: String, required: true },
    addressLine: { type: String, required: true },
    tiv: { type: Number, required: true },
    floodZone: { type: String, enum: ['X', 'B', 'A', 'AE', 'V'], required: true },
    floodScore: { type: Number, required: true },
  },
  { _id: false },
);

const SnapshotStateSchema = new Schema<SnapshotState>(
  {
    locations: { type: [SnapshotLocationSchema], required: true },
    totalTiv: { type: Number, required: true },
  },
  { _id: false },
);

const RiskSnapshotSchema = new Schema<IRiskSnapshot>(
  {
    policyId: { type: String, required: true, index: true },
    takenAt: { type: Date, required: true, default: () => new Date() },
    kind: { type: String, enum: ['BIND', 'REVIEWED'], required: true },
    state: { type: SnapshotStateSchema, required: true },
  },
  { timestamps: true },
);

/** For latest-by-takenAt-desc queries. */
RiskSnapshotSchema.index({ policyId: 1, takenAt: -1 });

export const RiskSnapshot = model<IRiskSnapshot>('RiskSnapshot', RiskSnapshotSchema);
