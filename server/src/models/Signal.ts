import { Schema, model, Document } from 'mongoose';

export type SignalType = 'PROPERTY_CHANGE' | 'FLOOD_UPDATE';
export type SignalResolutionStatus = 'RESOLVED' | 'UNMATCHED' | 'VERIFY_FIRST';

export interface ISignal extends Document {
  signalId: string;
  type: SignalType;
  source: string;
  observedAt: Date;
  receivedAt: Date;
  /** Raw payload — structure validated by Zod per type in the controller layer. */
  payload: Record<string, unknown>;
  provenance: string;
  resolutionStatus: SignalResolutionStatus;
  resolvedPolicyId: string | null;
  matchConfidence: number | null;
}

const SignalSchema = new Schema<ISignal>(
  {
    signalId: { type: String, required: true, unique: true, index: true },
    type: { type: String, enum: ['PROPERTY_CHANGE', 'FLOOD_UPDATE'], required: true },
    source: { type: String, required: true },
    observedAt: { type: Date, required: true },
    receivedAt: { type: Date, required: true, default: () => new Date() },
    payload: { type: Schema.Types.Mixed, required: true },
    provenance: { type: String, required: true },
    resolutionStatus: {
      type: String,
      enum: ['RESOLVED', 'UNMATCHED', 'VERIFY_FIRST'],
      required: true,
    },
    resolvedPolicyId: { type: String, default: null },
    matchConfidence: { type: Number, default: null },
  },
  { timestamps: true },
);

export const Signal = model<ISignal>('Signal', SignalSchema);
