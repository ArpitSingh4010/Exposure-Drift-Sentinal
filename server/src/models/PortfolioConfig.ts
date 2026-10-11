import { Schema, model, Document } from 'mongoose';

export interface IPortfolioConfig extends Document {
  key: string;
  value: unknown;
}

const PortfolioConfigSchema = new Schema<IPortfolioConfig>(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true },
);

export const PortfolioConfig = model<IPortfolioConfig>('PortfolioConfig', PortfolioConfigSchema);
