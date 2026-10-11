import { Schema, model, Document } from 'mongoose';
import type { FloodZone } from './Location.js';

export interface IFloodLookup extends Document {
  postalCode: string;
  floodZone: FloodZone;
  floodScore: number;
}

const FloodLookupSchema = new Schema<IFloodLookup>(
  {
    postalCode: { type: String, required: true, unique: true, index: true },
    floodZone: { type: String, enum: ['X', 'B', 'A', 'AE', 'V'], required: true },
    floodScore: { type: Number, min: 1, max: 10, required: true },
  },
  { timestamps: true },
);

export const FloodLookup = model<IFloodLookup>('FloodLookup', FloodLookupSchema);
