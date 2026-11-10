/**
 * Per-hazard, per-postal-code lookup table.
 * Used to enrich HAZARD_UPDATE signals that arrive without explicit band/score.
 *
 * For flood, the legacy FloodLookup collection continues to be used.
 * This collection covers all 8 hazards (including flood rows for consistency).
 *
 * Collection #15 of 15.
 *
 * Data is synthetic / illustrative — not official hazard-authority data.
 */
import { Schema, model, Document } from 'mongoose';

export interface IHazardLookup extends Document {
  postalCode: string;
  /** HazardId — one of the 8 registered hazards. */
  hazard: string;
  band: string;
  score: number; // 1-10
}

const HazardLookupSchema = new Schema<IHazardLookup>(
  {
    postalCode: { type: String, required: true },
    hazard:     { type: String, required: true },
    band:       { type: String, required: true },
    score:      { type: Number, min: 1, max: 10, required: true },
  },
  { timestamps: true },
);

/** Unique compound index — one entry per (postalCode, hazard) pair. */
HazardLookupSchema.index({ postalCode: 1, hazard: 1 }, { unique: true });

export const HazardLookup = model<IHazardLookup>('HazardLookup', HazardLookupSchema);

