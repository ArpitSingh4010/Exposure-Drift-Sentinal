import { Schema, model, Document } from 'mongoose';

export type DecisionAction = 'ACCEPT' | 'DISMISS' | 'REQUEST_INFO';

export const DISMISS_REASON_CODES = [
  'not_material',
  'wrong_match',
  'already_known',
  'other',
] as const;
export type DismissReasonCode = (typeof DISMISS_REASON_CODES)[number];

export interface IDecision extends Document {
  decisionId: string;
  eventId: string;
  userId: string;
  action: DecisionAction;
  reasonCode?: DismissReasonCode;
  note: string;
  decidedAt: Date;
}

const DecisionSchema = new Schema<IDecision>(
  {
    decisionId: { type: String, required: true, unique: true, index: true },
    eventId: { type: String, required: true, index: true },
    userId: { type: String, required: true },
    action: { type: String, enum: ['ACCEPT', 'DISMISS', 'REQUEST_INFO'], required: true },
    reasonCode: {
      type: String,
      enum: ['not_material', 'wrong_match', 'already_known', 'other'],
      default: undefined,
    },
    note: { type: String, required: true },
    decidedAt: { type: Date, required: true, default: () => new Date() },
  },
  { timestamps: true },
);

export const Decision = model<IDecision>('Decision', DecisionSchema);
