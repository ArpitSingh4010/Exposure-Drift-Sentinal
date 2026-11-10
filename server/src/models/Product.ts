/**
 * Product catalogue — modelled on the concepts of Guidewire PolicyCenter's
 * product model (line of business, coverages, coverage terms, deductibles).
 * These are illustrative demo values, not official Guidewire products.
 *
 * Collection #14 of 15.
 */
import { Schema, model, Document } from 'mongoose';
import type { HazardId } from '../services/hazards/index.js';

export interface ProductCoverage {
  code: string;
  name: string;
}

export type DeductibleType = 'flat' | 'pct_tiv';

export interface IProduct extends Document {
  productCode: string;
  name: string;
  lineOfBusiness: 'Commercial Property';
  /** The single primary hazard this product is designed for, or null for all-risk. */
  primaryHazard: HazardId | null;
  /**
   * Which hazard IDs trigger review activities for policies on this product.
   * Property-change signals (new location, TIV change) always apply regardless.
   */
  monitoredHazards: HazardId[];
  coverages: ProductCoverage[];
  deductible: {
    type: DeductibleType;
    value: number;
  };
  /** Waiting period in days (e.g. 30 for flood). Absent means no waiting period. */
  waitingPeriodDays?: number;
  notes?: string;
}

const ProductCoverageSchema = new Schema<ProductCoverage>(
  {
    code: { type: String, required: true },
    name: { type: String, required: true },
  },
  { _id: false },
);

const DeductibleSchema = new Schema(
  {
    type:  { type: String, enum: ['flat', 'pct_tiv'], required: true },
    value: { type: Number, required: true },
  },
  { _id: false },
);

const ProductSchema = new Schema<IProduct>(
  {
    productCode:     { type: String, required: true, unique: true, index: true },
    name:            { type: String, required: true },
    lineOfBusiness:  { type: String, enum: ['Commercial Property'], required: true },
    primaryHazard:   { type: String, default: null },
    monitoredHazards:{ type: [String], required: true },
    coverages:       { type: [ProductCoverageSchema], required: true },
    deductible:      { type: DeductibleSchema, required: true },
    waitingPeriodDays: { type: Number },
    notes:             { type: String },
  },
  { timestamps: true },
);

export const Product = model<IProduct>('Product', ProductSchema);

