import { Schema, model, Document } from 'mongoose';

export type PolicyStatus = 'IN_FORCE' | 'EXPIRED';

export interface IPolicy extends Document {
  policyId: string;
  accountId: string;
  product: 'Commercial Property';
  effectiveDate: Date;
  expiryDate: Date;
  premium: number;
  status: PolicyStatus;
  region: string;
}

const PolicySchema = new Schema<IPolicy>(
  {
    policyId: { type: String, required: true, unique: true, index: true },
    accountId: { type: String, required: true, index: true },
    product: { type: String, enum: ['Commercial Property'], default: 'Commercial Property' },
    effectiveDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    premium: { type: Number, required: true },
    status: { type: String, enum: ['IN_FORCE', 'EXPIRED'], required: true },
    region: { type: String, required: true },
  },
  { timestamps: true },
);

export const Policy = model<IPolicy>('Policy', PolicySchema);
