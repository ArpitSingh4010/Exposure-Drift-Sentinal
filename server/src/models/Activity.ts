import { Schema, model, Document } from 'mongoose';

export type ActivityStatus = 'OPEN' | 'COMPLETED';
export type ActivityPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface IActivity extends Document {
  activityId: string;
  eventId: string;
  policyId: string;
  assigneeUserId: string;
  /** Senior underwriter flagged for HIGH severity events (amendment #6). */
  seniorFlag?: string;
  subject: string;
  description: string;
  priority: ActivityPriority;
  dueDate: Date;
  status: ActivityStatus;
  completedAt?: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    activityId: { type: String, required: true, unique: true, index: true },
    eventId: { type: String, required: true, index: true },
    policyId: { type: String, required: true, index: true },
    assigneeUserId: { type: String, required: true, index: true },
    seniorFlag: { type: String, default: undefined },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH'], required: true },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ['OPEN', 'COMPLETED'], required: true, default: 'OPEN' },
    completedAt: { type: Date, default: undefined },
  },
  { timestamps: true },
);

ActivitySchema.index({ assigneeUserId: 1, status: 1 });
ActivitySchema.index({ dueDate: 1, status: 1 });

export const Activity = model<IActivity>('Activity', ActivitySchema);
