import { Schema, model, Document } from 'mongoose';

export type FloodZone = 'X' | 'B' | 'A' | 'AE' | 'V';

export interface ILocation extends Document {
  locationId: string;
  policyId: string;
  addressLine: string;
  city: string;
  postalCode: string;
  region: string;
  lat: number;
  lon: number;
  tiv: number;
  construction: string;
  occupancy: string;
  floodZone: FloodZone;
  floodScore: number; // 1-10
}

const LocationSchema = new Schema<ILocation>(
  {
    locationId: { type: String, required: true, unique: true, index: true },
    policyId: { type: String, required: true, index: true },
    addressLine: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, required: true },
    region: { type: String, required: true },
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
    tiv: { type: Number, required: true },
    construction: { type: String, required: true },
    occupancy: { type: String, required: true },
    floodZone: { type: String, enum: ['X', 'B', 'A', 'AE', 'V'], required: true },
    floodScore: { type: Number, min: 1, max: 10, required: true },
  },
  { timestamps: true },
);

/** Compound index for portfolio aggregation: filter by zone then group by region. */
LocationSchema.index({ floodZone: 1, region: 1 });

export const Location = model<ILocation>('Location', LocationSchema);
