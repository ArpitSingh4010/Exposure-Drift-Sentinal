/**
 * Multi-hazard seed data: product catalogue, demo policies & accounts,
 * and deterministic hazard baseline assignments.
 *
 * All bands and scores are illustrative / synthetic demo values.
 */

import type { HazardId } from '../services/hazards/index.js';
import type { DeductibleType } from '../models/Product.js';

// ── 1. Product Catalogue (9 Products) ──────────────────────────────────────

export interface SeedProduct {
  productCode: string;
  name: string;
  lineOfBusiness: 'Commercial Property';
  primaryHazard: HazardId | null;
  monitoredHazards: HazardId[];
  coverages: Array<{ code: string; name: string }>;
  deductible: { type: DeductibleType; value: number };
  waitingPeriodDays?: number;
  notes?: string;
}

export const PRODUCT_CATALOGUE: SeedProduct[] = [
  {
    productCode: 'CP-BASE',
    name: 'Commercial Property, base all-risk',
    lineOfBusiness: 'Commercial Property',
    primaryHazard: null,
    monitoredHazards: [
      'flood',
      'earthquake',
      'tsunami',
      'cyclone',
      'wildfire',
      'landslide',
      'tornado',
      'severe_storm',
    ],
    coverages: [
      { code: 'BLD', name: 'Building' },
      { code: 'BPP', name: 'Business Personal Property' },
      { code: 'BI',  name: 'Business Income' },
    ],
    deductible: { type: 'flat', value: 10_000 },
    notes: 'All-risk base commercial property policy monitoring all 8 hazards.',
  },
  {
    productCode: 'CP-FLD',
    name: 'Commercial Flood Coverage',
    lineOfBusiness: 'Commercial Property',
    primaryHazard: 'flood',
    monitoredHazards: ['flood'],
    coverages: [
      { code: 'FLD-BLD', name: 'Building flood' },
      { code: 'FLD-CNT', name: 'Contents flood' },
      { code: 'FLD-BI',  name: 'Business income flood' },
    ],
    deductible: { type: 'flat', value: 25_000 },
    waitingPeriodDays: 30,
    notes: 'Dedicated flood coverage with mandatory 30-day waiting period.',
  },
  {
    productCode: 'CP-EQ',
    name: 'Commercial Earthquake Coverage',
    lineOfBusiness: 'Commercial Property',
    primaryHazard: 'earthquake',
    monitoredHazards: ['earthquake'],
    coverages: [
      { code: 'EQ-BLD', name: 'Building' },
      { code: 'EQ-CNT', name: 'Contents' },
      { code: 'EQ-SPR', name: 'Sprinkler leakage' },
    ],
    deductible: { type: 'pct_tiv', value: 0.05 },
    notes: 'Earthquake coverage with 5% location TIV deductible.',
  },
  {
    productCode: 'CP-TSU',
    name: 'Tsunami and Coastal Inundation Extension',
    lineOfBusiness: 'Commercial Property',
    primaryHazard: 'tsunami',
    monitoredHazards: ['tsunami'],
    coverages: [
      { code: 'TSU-BLD', name: 'Building' },
      { code: 'TSU-CNT', name: 'Contents' },
    ],
    deductible: { type: 'pct_tiv', value: 0.05 },
    notes: 'Coastal inundation extension with 5% location TIV deductible.',
  },
  {
    productCode: 'CP-WND',
    name: 'Named Storm and Hurricane Coverage',
    lineOfBusiness: 'Commercial Property',
    primaryHazard: 'cyclone',
    monitoredHazards: ['cyclone'],
    coverages: [
      { code: 'WND-BLD', name: 'Building' },
      { code: 'WND-CNT', name: 'Contents' },
      { code: 'WND-BI',  name: 'Business income' },
    ],
    deductible: { type: 'pct_tiv', value: 0.02 },
    notes: 'Named storm and hurricane coverage with 2% location TIV deductible.',
  },
  {
    productCode: 'CP-WLD',
    name: 'Wildfire Coverage',
    lineOfBusiness: 'Commercial Property',
    primaryHazard: 'wildfire',
    monitoredHazards: ['wildfire'],
    coverages: [
      { code: 'WLD-BLD', name: 'Building' },
      { code: 'WLD-CNT', name: 'Contents' },
      { code: 'WLD-DEB', name: 'Debris removal' },
    ],
    deductible: { type: 'pct_tiv', value: 0.02 },
    notes: 'Wildfire coverage with 2% location TIV deductible.',
  },
  {
    productCode: 'CP-LSL',
    name: 'Earth Movement and Landslide Extension',
    lineOfBusiness: 'Commercial Property',
    primaryHazard: 'landslide',
    monitoredHazards: ['landslide'],
    coverages: [
      { code: 'LSL-BLD', name: 'Building' },
      { code: 'LSL-CNT', name: 'Contents' },
    ],
    deductible: { type: 'pct_tiv', value: 0.05 },
    notes: 'Earth movement and landslide extension with 5% location TIV deductible.',
  },
  {
    productCode: 'CP-TOR',
    name: 'Tornado and Windstorm Coverage',
    lineOfBusiness: 'Commercial Property',
    primaryHazard: 'tornado',
    monitoredHazards: ['tornado'],
    coverages: [
      { code: 'TOR-BLD', name: 'Building' },
      { code: 'TOR-CNT', name: 'Contents' },
    ],
    deductible: { type: 'pct_tiv', value: 0.01 },
    notes: 'Tornado and convective windstorm coverage with 1% location TIV deductible.',
  },
  {
    productCode: 'CP-SCS',
    name: 'Severe Convective Storm Coverage',
    lineOfBusiness: 'Commercial Property',
    primaryHazard: 'severe_storm',
    monitoredHazards: ['severe_storm'],
    coverages: [
      { code: 'SCS-BLD', name: 'Building' },
      { code: 'SCS-CNT', name: 'Contents (hail, straight-line wind)' },
    ],
    deductible: { type: 'pct_tiv', value: 0.01 },
    notes: 'Severe convective storm coverage with 1% location TIV deductible.',
  },
];

// ── 2. Demo Accounts (7 accounts for the 7 new hazard demo policies) ──────

export const DEMO_ACCOUNTS_H6 = [
  { accountId: 'ACC-201', name: 'ICICI Lombard Seismic Risk Portfolio',     industry: 'Insurance / Catastrophe Risk', aliases: ['ICICI Lombard Earthquake Hub', 'ICICI Lombard Seismic Underwriting'] },
  { accountId: 'ACC-202', name: 'Tata AIG Coastal & Tsunami Inundation Hub', industry: 'Insurance / Marine & Coastal',   aliases: ['Tata AIG Coastal Inundation', 'TAGIC Tsunami Portfolio'] },
  { accountId: 'ACC-203', name: 'Bajaj Allianz Severe Cyclone Syndicate',    industry: 'Insurance / Windstorm Risk',   aliases: ['Bajaj Allianz Named Storm Hub', 'BAGIC Hurricane Division'] },
  { accountId: 'ACC-204', name: 'HDFC ERGO Wildfire Asset Protection Hub',   industry: 'Insurance / Agro & Forestry',  aliases: ['HDFC ERGO Wildfire Underwriting', 'HDFC ERGO Forestry Risk'] },
  { accountId: 'ACC-205', name: 'SBI General Landslide & Terrestrial Hub',   industry: 'Insurance / Earth Movement',   aliases: ['SBI General Landslide Division', 'SBIG Terrestrial Risk'] },
  { accountId: 'ACC-206', name: 'Reliance General Tornado & Windstorm Risk',  industry: 'Insurance / Convective Storm', aliases: ['Reliance General Tornado Hub', 'RGIC Windstorm Portfolio'] },
  { accountId: 'ACC-207', name: 'Liberty General Severe Convective Hub',      industry: 'Insurance / Severe Storm',     aliases: ['Liberty General Convective Storm', 'Liberty Severe Storm Portfolio'] },
];

// ── 3. 7 Demo Policies (Fixed IDs per docs/MULTIHAZARD_SPEC.md 5.3) ───────

export interface DemoPolicyDef {
  policyId: string;
  accountId: string;
  productCode: string;
  region: string;
  hazard: HazardId;
  premium: number;
  effectiveDate: string;
  expiryDate: string;
}

export const NEW_DEMO_POLICIES: DemoPolicyDef[] = [
  { policyId: 'POL-200101', accountId: 'ACC-201', productCode: 'CP-EQ',  region: 'West',       hazard: 'earthquake',   premium: 95_000, effectiveDate: '2025-01-01', expiryDate: '2026-01-01' },
  { policyId: 'POL-200102', accountId: 'ACC-202', productCode: 'CP-TSU', region: 'West',       hazard: 'tsunami',      premium: 88_000, effectiveDate: '2025-01-01', expiryDate: '2026-01-01' },
  { policyId: 'POL-200103', accountId: 'ACC-203', productCode: 'CP-WND', region: 'South-East',  hazard: 'cyclone',      premium: 105_000, effectiveDate: '2025-01-01', expiryDate: '2026-01-01' },
  { policyId: 'POL-200104', accountId: 'ACC-204', productCode: 'CP-WLD', region: 'West',       hazard: 'wildfire',     premium: 92_000, effectiveDate: '2025-01-01', expiryDate: '2026-01-01' },
  { policyId: 'POL-200105', accountId: 'ACC-205', productCode: 'CP-LSL', region: 'North-East', hazard: 'landslide',    premium: 78_000, effectiveDate: '2025-01-01', expiryDate: '2026-01-01' },
  { policyId: 'POL-200106', accountId: 'ACC-206', productCode: 'CP-TOR', region: 'Midwest',    hazard: 'tornado',      premium: 82_000, effectiveDate: '2025-01-01', expiryDate: '2026-01-01' },
  { policyId: 'POL-200107', accountId: 'ACC-207', productCode: 'CP-SCS', region: 'Midwest',    hazard: 'severe_storm', premium: 86_000, effectiveDate: '2025-01-01', expiryDate: '2026-01-01' },
];

export interface DemoLocDef {
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
  floodZone: 'X';
  floodScore: number;
  hazards: Record<string, { band: string; score: number }>;
}

export const NEW_DEMO_LOCATIONS: DemoLocDef[] = [
  // POL-200101 (Fault Line Foods - earthquake)
  {
    locationId: 'LOC-200101-1',
    policyId: 'POL-200101',
    addressLine: '100 Fault Line Rd',
    city: 'Los Angeles',
    postalCode: '90001',
    region: 'West',
    lat: 33.97,
    lon: -118.24,
    tiv: 2_000_000,
    construction: 'Concrete',
    occupancy: 'Manufacturing',
    floodZone: 'X',
    floodScore: 1,
    hazards: {
      earthquake:   { band: 'moderate', score: 3 },
      tsunami:      { band: 'none',     score: 1 },
      cyclone:      { band: 'low',      score: 1 },
      wildfire:     { band: 'low',      score: 2 },
      landslide:    { band: 'low',      score: 1 },
      tornado:      { band: 'low',      score: 1 },
      severe_storm: { band: 'low',      score: 2 },
    },
  },
  {
    locationId: 'LOC-200101-2',
    policyId: 'POL-200101',
    addressLine: '102 Seismograph Way',
    city: 'Pasadena',
    postalCode: '91101',
    region: 'West',
    lat: 34.14,
    lon: -118.14,
    tiv: 2_000_000,
    construction: 'Steel Frame',
    occupancy: 'Warehouse',
    floodZone: 'X',
    floodScore: 1,
    hazards: {
      earthquake:   { band: 'low',      score: 2 },
      tsunami:      { band: 'none',     score: 1 },
      cyclone:      { band: 'low',      score: 1 },
      wildfire:     { band: 'low',      score: 1 },
      landslide:    { band: 'low',      score: 1 },
      tornado:      { band: 'low',      score: 1 },
      severe_storm: { band: 'low',      score: 1 },
    },
  },

  // POL-200102 (Harbor Gate Logistics - tsunami)
  {
    locationId: 'LOC-200102-1',
    policyId: 'POL-200102',
    addressLine: '200 Coastal Access Rd',
    city: 'Long Beach',
    postalCode: '90802',
    region: 'West',
    lat: 33.77,
    lon: -118.19,
    tiv: 2_000_000,
    construction: 'Concrete',
    occupancy: 'Warehouse',
    floodZone: 'X',
    floodScore: 1,
    hazards: {
      earthquake:   { band: 'low',  score: 2 },
      tsunami:      { band: 'low',  score: 2 },
      cyclone:      { band: 'low',  score: 1 },
      wildfire:     { band: 'low',  score: 1 },
      landslide:    { band: 'low',  score: 1 },
      tornado:      { band: 'low',  score: 1 },
      severe_storm: { band: 'low',  score: 1 },
    },
  },
  {
    locationId: 'LOC-200102-2',
    policyId: 'POL-200102',
    addressLine: '202 Marine Gateway',
    city: 'San Pedro',
    postalCode: '90731',
    region: 'West',
    lat: 33.73,
    lon: -118.29,
    tiv: 2_000_000,
    construction: 'Steel Frame',
    occupancy: 'Office',
    floodZone: 'X',
    floodScore: 1,
    hazards: {
      earthquake:   { band: 'low',  score: 2 },
      tsunami:      { band: 'none', score: 1 },
      cyclone:      { band: 'low',  score: 1 },
      wildfire:     { band: 'low',  score: 1 },
      landslide:    { band: 'low',  score: 1 },
      tornado:      { band: 'low',  score: 1 },
      severe_storm: { band: 'low',  score: 1 },
    },
  },

  // POL-200103 (Gulf Crest Marine - cyclone)
  {
    locationId: 'LOC-200103-1',
    policyId: 'POL-200103',
    addressLine: '300 Harbor Island Way',
    city: 'Tampa',
    postalCode: '33602',
    region: 'South-East',
    lat: 27.95,
    lon: -82.45,
    tiv: 2_000_000,
    construction: 'Masonry',
    occupancy: 'Manufacturing',
    floodZone: 'X',
    floodScore: 1,
    hazards: {
      earthquake:   { band: 'low',      score: 1 },
      tsunami:      { band: 'low',      score: 1 },
      cyclone:      { band: 'moderate', score: 3 },
      wildfire:     { band: 'low',      score: 1 },
      landslide:    { band: 'low',      score: 1 },
      tornado:      { band: 'low',      score: 2 },
      severe_storm: { band: 'moderate', score: 3 },
    },
  },
  {
    locationId: 'LOC-200103-2',
    policyId: 'POL-200103',
    addressLine: '302 Bay Vista Blvd',
    city: 'Clearwater',
    postalCode: '33755',
    region: 'South-East',
    lat: 27.97,
    lon: -82.80,
    tiv: 2_000_000,
    construction: 'Concrete',
    occupancy: 'Warehouse',
    floodZone: 'X',
    floodScore: 1,
    hazards: {
      earthquake:   { band: 'low',  score: 1 },
      tsunami:      { band: 'none', score: 1 },
      cyclone:      { band: 'low',  score: 2 },
      wildfire:     { band: 'low',  score: 1 },
      landslide:    { band: 'low',  score: 1 },
      tornado:      { band: 'low',  score: 1 },
      severe_storm: { band: 'low',  score: 2 },
    },
  },

  // POL-200104 (Redwood Timber Works - wildfire)
  {
    locationId: 'LOC-200104-1',
    policyId: 'POL-200104',
    addressLine: '400 Timber Creek Rd',
    city: 'Redding',
    postalCode: '96001',
    region: 'West',
    lat: 40.58,
    lon: -122.39,
    tiv: 2_000_000,
    construction: 'Frame',
    occupancy: 'Manufacturing',
    floodZone: 'X',
    floodScore: 1,
    hazards: {
      earthquake:   { band: 'low',      score: 2 },
      tsunami:      { band: 'none',     score: 1 },
      cyclone:      { band: 'low',      score: 1 },
      wildfire:     { band: 'moderate', score: 3 },
      landslide:    { band: 'low',      score: 2 },
      tornado:      { band: 'low',      score: 1 },
      severe_storm: { band: 'low',      score: 1 },
    },
  },
  {
    locationId: 'LOC-200104-2',
    policyId: 'POL-200104',
    addressLine: '402 Forest Ridge Way',
    city: 'Eureka',
    postalCode: '95501',
    region: 'West',
    lat: 40.80,
    lon: -124.16,
    tiv: 2_000_000,
    construction: 'Mixed',
    occupancy: 'Warehouse',
    floodZone: 'X',
    floodScore: 1,
    hazards: {
      earthquake:   { band: 'moderate', score: 3 },
      tsunami:      { band: 'low',      score: 2 },
      cyclone:      { band: 'low',      score: 1 },
      wildfire:     { band: 'low',      score: 2 },
      landslide:    { band: 'low',      score: 1 },
      tornado:      { band: 'low',      score: 1 },
      severe_storm: { band: 'low',      score: 1 },
    },
  },

  // POL-200105 (Ridgeback Quarry - landslide)
  {
    locationId: 'LOC-200105-1',
    policyId: 'POL-200105',
    addressLine: '500 Quarry Mountain Rd',
    city: 'Albany',
    postalCode: '12207',
    region: 'North-East',
    lat: 42.65,
    lon: -73.75,
    tiv: 2_000_000,
    construction: 'Concrete',
    occupancy: 'Manufacturing',
    floodZone: 'X',
    floodScore: 1,
    hazards: {
      earthquake:   { band: 'low',      score: 1 },
      tsunami:      { band: 'none',     score: 1 },
      cyclone:      { band: 'low',      score: 1 },
      wildfire:     { band: 'low',      score: 1 },
      landslide:    { band: 'moderate', score: 3 },
      tornado:      { band: 'low',      score: 1 },
      severe_storm: { band: 'low',      score: 2 },
    },
  },
  {
    locationId: 'LOC-200105-2',
    policyId: 'POL-200105',
    addressLine: '502 Stone Cut Ave',
    city: 'Troy',
    postalCode: '12180',
    region: 'North-East',
    lat: 42.72,
    lon: -73.69,
    tiv: 2_000_000,
    construction: 'Masonry',
    occupancy: 'Office',
    floodZone: 'X',
    floodScore: 1,
    hazards: {
      earthquake:   { band: 'low',  score: 1 },
      tsunami:      { band: 'none', score: 1 },
      cyclone:      { band: 'low',  score: 1 },
      wildfire:     { band: 'low',  score: 1 },
      landslide:    { band: 'low',  score: 2 },
      tornado:      { band: 'low',  score: 1 },
      severe_storm: { band: 'low',  score: 1 },
    },
  },

  // POL-200106 (Prairie Grain Co-op - tornado)
  {
    locationId: 'LOC-200106-1',
    policyId: 'POL-200106',
    addressLine: '600 Prairie Silo Rd',
    city: 'Des Moines',
    postalCode: '50309',
    region: 'Midwest',
    lat: 41.58,
    lon: -93.62,
    tiv: 2_000_000,
    construction: 'Steel Frame',
    occupancy: 'Warehouse',
    floodZone: 'X',
    floodScore: 1,
    hazards: {
      earthquake:   { band: 'low',      score: 1 },
      tsunami:      { band: 'none',     score: 1 },
      cyclone:      { band: 'low',      score: 1 },
      wildfire:     { band: 'low',      score: 1 },
      landslide:    { band: 'low',      score: 1 },
      tornado:      { band: 'moderate', score: 3 },
      severe_storm: { band: 'moderate', score: 3 },
    },
  },
  {
    locationId: 'LOC-200106-2',
    policyId: 'POL-200106',
    addressLine: '602 Harvest Trail',
    city: 'Ames',
    postalCode: '50010',
    region: 'Midwest',
    lat: 42.03,
    lon: -93.63,
    tiv: 2_000_000,
    construction: 'Concrete',
    occupancy: 'Manufacturing',
    floodZone: 'X',
    floodScore: 1,
    hazards: {
      earthquake:   { band: 'low',  score: 1 },
      tsunami:      { band: 'none', score: 1 },
      cyclone:      { band: 'low',  score: 1 },
      wildfire:     { band: 'low',  score: 1 },
      landslide:    { band: 'low',  score: 1 },
      tornado:      { band: 'low',  score: 2 },
      severe_storm: { band: 'low',  score: 2 },
    },
  },

  // POL-200107 (Great Plains Packaging - severe_storm)
  {
    locationId: 'LOC-200107-1',
    policyId: 'POL-200107',
    addressLine: '700 Hail Ridge Expressway',
    city: 'Omaha',
    postalCode: '68102',
    region: 'Midwest',
    lat: 41.25,
    lon: -95.93,
    tiv: 2_000_000,
    construction: 'Concrete',
    occupancy: 'Manufacturing',
    floodZone: 'X',
    floodScore: 1,
    hazards: {
      earthquake:   { band: 'low',      score: 1 },
      tsunami:      { band: 'none',     score: 1 },
      cyclone:      { band: 'low',      score: 1 },
      wildfire:     { band: 'low',      score: 1 },
      landslide:    { band: 'low',      score: 1 },
      tornado:      { band: 'moderate', score: 3 },
      severe_storm: { band: 'moderate', score: 3 },
    },
  },
  {
    locationId: 'LOC-200107-2',
    policyId: 'POL-200107',
    addressLine: '702 Windward Loop',
    city: 'Lincoln',
    postalCode: '68508',
    region: 'Midwest',
    lat: 40.81,
    lon: -96.70,
    tiv: 2_000_000,
    construction: 'Steel Frame',
    occupancy: 'Warehouse',
    floodZone: 'X',
    floodScore: 1,
    hazards: {
      earthquake:   { band: 'low',  score: 1 },
      tsunami:      { band: 'none', score: 1 },
      cyclone:      { band: 'low',  score: 1 },
      wildfire:     { band: 'low',  score: 1 },
      landslide:    { band: 'low',  score: 1 },
      tornado:      { band: 'low',  score: 1 },
      severe_storm: { band: 'low',  score: 2 },
    },
  },
];

// ── 4. Deterministic Hazard Assignment for Locations ──────────────────────

export function assignHazardsForLocation(
  region: string,
  locIndex: number,
): Record<string, { band: string; score: number }> {
  // Controlled frequency of high-risk bands keeps the baseline regional share
  // well within appetite (<20%, below the 25% cap) for all hazards.
  const isHighRiskLoc = locIndex % 8 === 0;

  return {
    earthquake: {
      band: region === 'West' && isHighRiskLoc ? 'high' : locIndex % 2 === 0 ? 'moderate' : 'low',
      score: region === 'West' && isHighRiskLoc ? 7 : locIndex % 2 === 0 ? 3 : 1,
    },
    tsunami: {
      band: (region === 'West' || region === 'South-East') && isHighRiskLoc ? 'high' : locIndex % 3 === 0 ? 'moderate' : 'low',
      score: (region === 'West' || region === 'South-East') && isHighRiskLoc ? 7 : locIndex % 3 === 0 ? 3 : 1,
    },
    cyclone: {
      band: region === 'South-East' && isHighRiskLoc ? 'high' : locIndex % 2 === 0 ? 'moderate' : 'low',
      score: region === 'South-East' && isHighRiskLoc ? 7 : locIndex % 2 === 0 ? 4 : 2,
    },
    wildfire: {
      band: region === 'West' && isHighRiskLoc ? 'high' : locIndex % 2 === 0 ? 'moderate' : 'low',
      score: region === 'West' && isHighRiskLoc ? 7 : locIndex % 2 === 0 ? 3 : 2,
    },
    landslide: {
      band: (region === 'West' || region === 'North-East') && isHighRiskLoc ? 'high' : locIndex % 2 === 0 ? 'moderate' : 'low',
      score: (region === 'West' || region === 'North-East') && isHighRiskLoc ? 7 : locIndex % 2 === 0 ? 3 : 1,
    },
    tornado: {
      band: region === 'Midwest' && isHighRiskLoc ? 'high' : locIndex % 2 === 0 ? 'moderate' : 'low',
      score: region === 'Midwest' && isHighRiskLoc ? 7 : locIndex % 2 === 0 ? 3 : 2,
    },
    severe_storm: {
      band: (region === 'Midwest' || region === 'South-East') && isHighRiskLoc ? 'high' : locIndex % 2 === 0 ? 'moderate' : 'low',
      score: (region === 'Midwest' || region === 'South-East') && isHighRiskLoc ? 7 : locIndex % 2 === 0 ? 3 : 2,
    },
  };
}

// ── 5. Deterministic Policy Product Assignment ────────────────────────────

export function assignProductCode(policyId: string, region: string, index: number): string {
  // POL-100245 is the headline flood demo policy — MUST stay CP-BASE
  if (policyId === 'POL-100245') return 'CP-BASE';

  if (region === 'West') {
    if (index % 4 === 1) return 'CP-EQ';
    if (index % 4 === 2) return 'CP-WLD';
    if (index % 4 === 3) return 'CP-TSU';
    return 'CP-BASE';
  }

  if (region === 'Midwest') {
    if (index % 3 === 1) return 'CP-TOR';
    if (index % 3 === 2) return 'CP-SCS';
    return 'CP-BASE';
  }

  if (region === 'South-East') {
    if (index % 4 === 1) return 'CP-WND';
    if (index % 4 === 2) return 'CP-FLD';
    return 'CP-BASE';
  }

  if (region === 'North-East') {
    if (index % 3 === 1) return 'CP-LSL';
    return 'CP-BASE';
  }

  return 'CP-BASE';
}
