import { Schema, model, Document } from 'mongoose';

export interface IRuleVersion extends Document {
  /**
   * SHA-256 hex digest of the rules.yaml content at the time this version was stored.
   * Used as the version key per amendment #10.
   */
  version: string;
  yamlText: string;
  createdAt: Date;
}

const RuleVersionSchema = new Schema<IRuleVersion>(
  {
    version: { type: String, required: true, unique: true, index: true },
    yamlText: { type: String, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
);

export const RuleVersion = model<IRuleVersion>('RuleVersion', RuleVersionSchema);
