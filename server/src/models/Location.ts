import { Schema, model, Document } from 'mongoose';

export type FloodZone = 'X' | 'B' | 'A' | 'AE' | 'V';

/** Per-hazard reading stored on a location (non-flood hazards only). */
export interface LocationHazardReading {
  band: string;
  score: number; // 1-10
}

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
  /** Legacy flood fields — kept as-is for full backward compatibility. */
  floodZone: FloodZone;
  floodScore: number; // 1-10
  /**
   * Multi-hazard data for non-flood hazards (optional, added in multi-hazard phase).
   * String-keyed so runtime indexing with any HazardId string works without casts.
   * Validation of which hazards are valid is enforced at the service layer.
   */
  hazards?: Record<string, LocationHazardReading>;
}

const LocationHazardReadingSchema = new Schema<LocationHazardReading>(
  {
    band:  { type: String, required: true },
    score: { type: Number, min: 1, max: 10, required: true },
  },
  { _id: false },
);

const LocationSchema = new Schema<ILocation>(
  {
    locationId:   { type: String, required: true, unique: true, index: true },
    policyId:     { type: String, required: true, index: true },
    addressLine:  { type: String, required: true },
    city:         { type: String, required: true },
    postalCode:   { type: String, required: true },
    region:       { type: String, required: true },
    lat:          { type: Number, required: true },
    lon:          { type: Number, required: true },
    tiv:          { type: Number, required: true },
    construction: { type: String, required: true },
    occupancy:    { type: String, required: true },
    /** Legacy flood fields — do not remove. */
    floodZone:    { type: String, enum: ['X', 'B', 'A', 'AE', 'V'], required: true },
    floodScore:   { type: Number, min: 1, max: 10, required: true },
    /**
     * Non-flood hazard readings. Schema.Types.Mixed used so the key set can
     * expand without migrations; validation is in the application layer.
     */
    hazards: { type: Schema.Types.Mixed, required: false, default: undefined },
  },
  { timestamps: true },
);

/** Existing compound index for flood portfolio aggregation queries. */
LocationSchema.index({ floodZone: 1, region: 1 });
/** Index for non-flood hazard portfolio queries (hazard field inside the mixed map). */
LocationSchema.index({ policyId: 1, region: 1 });

export const Location = model<ILocation>('Location', LocationSchema);
