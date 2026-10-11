import { Schema, model, Document } from 'mongoose';

export interface IAccount extends Document {
  accountId: string;
  name: string;
  industry: string;
  aliases: string[];
}

const AccountSchema = new Schema<IAccount>(
  {
    accountId: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    industry: { type: String, required: true },
    aliases: { type: [String], default: [] },
  },
  { timestamps: true },
);

/** Text index on name + aliases to support fuzzy search in entity resolution. */
AccountSchema.index({ name: 'text', aliases: 'text' });

export const Account = model<IAccount>('Account', AccountSchema);
