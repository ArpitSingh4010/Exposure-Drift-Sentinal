/**
 * Deterministic seed for Exposure Drift Sentinel.
 *
 * TARGETS (verified at end of script — throws if missed):
 *   Total portfolio TIV  = $300,000,000 exactly
 *   SE flood-zone TIV    = $59,100,000  (19.70% of total)
 *
 * Seed string: 'eds-sentinel-2024'
 */
import seedrandom from 'seedrandom';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Account } from '../models/Account.js';
import { Policy } from '../models/Policy.js';
import { Location } from '../models/Location.js';
import { RiskSnapshot } from '../models/RiskSnapshot.js';
import { FloodLookup } from '../models/FloodLookup.js';
import { PortfolioConfig } from '../models/PortfolioConfig.js';
import { AuditLog } from '../models/AuditLog.js';
import { Activity } from '../models/Activity.js';
import { Decision } from '../models/Decision.js';
import { DriftEvent } from '../models/DriftEvent.js';
import { RuleVersion } from '../models/RuleVersion.js';
import { Signal } from '../models/Signal.js';
import { Product } from '../models/Product.js';
import { HazardLookup } from '../models/HazardLookup.js';
import { Company } from '../models/Company.js';
import { VERIFIED_INDIAN_INSURERS } from './indianInsurersData.js';
import {
  PRODUCT_CATALOGUE,
  DEMO_ACCOUNTS_H6,
  NEW_DEMO_POLICIES,
  NEW_DEMO_LOCATIONS,
  assignHazardsForLocation,
  assignProductCode,
} from './hazardData.js';
import { HAZARD_IDS } from '../services/hazards/index.js';
import { calculateExposure } from '../services/portfolio/index.js';
import { loadAndStoreRules } from '../config/rulesLoader.js';
import type { SnapshotLocation } from '../models/RiskSnapshot.js';

// ── RNG ───────────────────────────────────────────────────────────────────
const rng = seedrandom('eds-sentinel-2024');
const rand = (min: number, max: number): number =>
  Math.floor(rng() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)] as T;

// ── Constants ─────────────────────────────────────────────────────────────
const TARGET_TOTAL_TIV = 300_000_000;
const TARGET_SE_FLOOD_TIV = 59_100_000;

// ── FloodLookup table (all postal codes used in seed) ─────────────────────
const FLOOD_LOOKUP = [
  // South-East
  { postalCode: '31401', floodZone: 'AE', floodScore: 8 }, // demo scenario NEW location
  { postalCode: '32601', floodZone: 'AE', floodScore: 7 },
  { postalCode: '33101', floodZone: 'A',  floodScore: 6 },
  { postalCode: '29401', floodZone: 'V',  floodScore: 9 },
  { postalCode: '28401', floodZone: 'A',  floodScore: 5 },
  { postalCode: '30301', floodZone: 'AE', floodScore: 6 },
  { postalCode: '33901', floodZone: 'V',  floodScore: 8 },
  { postalCode: '29201', floodZone: 'AE', floodScore: 7 },
  { postalCode: '28601', floodZone: 'A',  floodScore: 5 },
  { postalCode: '32201', floodZone: 'AE', floodScore: 6 },
  { postalCode: '27601', floodZone: 'X',  floodScore: 2 },
  { postalCode: '28101', floodZone: 'X',  floodScore: 1 },
  { postalCode: '30401', floodZone: 'B',  floodScore: 3 },
  { postalCode: '31201', floodZone: 'X',  floodScore: 2 },
  { postalCode: '32501', floodZone: 'X',  floodScore: 1 },
  { postalCode: '33601', floodZone: 'X',  floodScore: 2 }, // demo loc 1
  { postalCode: '34201', floodZone: 'X',  floodScore: 3 }, // demo loc 2
  { postalCode: '29601', floodZone: 'X',  floodScore: 2 },
  { postalCode: '30601', floodZone: 'B',  floodScore: 3 },
  // North-East
  { postalCode: '10001', floodZone: 'AE', floodScore: 7 },
  { postalCode: '02101', floodZone: 'A',  floodScore: 5 },
  { postalCode: '07001', floodZone: 'AE', floodScore: 6 },
  { postalCode: '19101', floodZone: 'A',  floodScore: 4 },
  { postalCode: '06101', floodZone: 'X',  floodScore: 2 },
  { postalCode: '01101', floodZone: 'X',  floodScore: 1 },
  { postalCode: '08101', floodZone: 'B',  floodScore: 3 },
  { postalCode: '14201', floodZone: 'X',  floodScore: 2 },
  { postalCode: '12201', floodZone: 'X',  floodScore: 1 },
  { postalCode: '16201', floodZone: 'X',  floodScore: 2 },
  { postalCode: '18101', floodZone: 'B',  floodScore: 3 },
  { postalCode: '17101', floodZone: 'X',  floodScore: 2 },
  // Midwest
  { postalCode: '60601', floodZone: 'A',  floodScore: 5 },
  { postalCode: '55101', floodZone: 'AE', floodScore: 6 },
  { postalCode: '43201', floodZone: 'A',  floodScore: 4 },
  { postalCode: '53201', floodZone: 'AE', floodScore: 5 },
  { postalCode: '46201', floodZone: 'X',  floodScore: 2 },
  { postalCode: '48201', floodZone: 'X',  floodScore: 1 },
  { postalCode: '64101', floodZone: 'X',  floodScore: 2 },
  { postalCode: '61601', floodZone: 'X',  floodScore: 2 },
  { postalCode: '44101', floodZone: 'B',  floodScore: 3 },
  { postalCode: '63101', floodZone: 'X',  floodScore: 2 },
  { postalCode: '45201', floodZone: 'B',  floodScore: 3 },
  // West
  { postalCode: '90001', floodZone: 'A',  floodScore: 4 },
  { postalCode: '97201', floodZone: 'A',  floodScore: 5 },
  { postalCode: '85001', floodZone: 'AE', floodScore: 6 },
  { postalCode: '94101', floodZone: 'X',  floodScore: 2 },
  { postalCode: '98101', floodZone: 'X',  floodScore: 1 },
  { postalCode: '80201', floodZone: 'X',  floodScore: 2 },
  { postalCode: '84101', floodZone: 'B',  floodScore: 3 },
  { postalCode: '87501', floodZone: 'X',  floodScore: 2 },
  { postalCode: '92101', floodZone: 'X',  floodScore: 1 },
] as const;

const floodMap = new Map<string, (typeof FLOOD_LOOKUP)[number]>(
  FLOOD_LOOKUP.map((f) => [f.postalCode, f]),
);

// ── Users ─────────────────────────────────────────────────────────────────
const USERS = [
  { userId: 'USR-001', name: 'Priya Sharma', role: 'UNDERWRITER' },
] as const;

// ── Accounts ──────────────────────────────────────────────────────────────
const ACCOUNTS = [
  {
    accountId: 'ACC-001',
    name: 'ICICI Lombard General Insurance Company Limited',
    industry: 'Insurance / Financial Services',
    aliases: ['ICICI Lombard', 'ICICI Lombard GIC Ltd', 'ICICI General Insurance', 'ICICI Lombard GIC'],
  },
  {
    accountId: 'ACC-002',
    name: 'Bajaj Allianz General Insurance Company Limited',
    industry: 'Insurance / Financial Services',
    aliases: ['Bajaj Allianz', 'BAGIC', 'Bajaj Allianz General', 'Bajaj Allianz General Insurance'],
  },
  {
    accountId: 'ACC-003',
    name: 'HDFC ERGO General Insurance Company Limited',
    industry: 'Insurance / Financial Services',
    aliases: ['HDFC ERGO', 'HDFC ERGO GIC', 'HDFC General Insurance', 'HDFC ERGO General'],
  },
  {
    accountId: 'ACC-004',
    name: 'Tata AIG General Insurance Company Limited',
    industry: 'Insurance / Financial Services',
    aliases: ['Tata AIG', 'TAGIC', 'Tata AIG General', 'Tata-AIG General Insurance'],
  },
  {
    accountId: 'ACC-005',
    name: 'SBI General Insurance Company Limited',
    industry: 'Insurance / Financial Services',
    aliases: ['SBI General', 'SBIG', 'SBI General Ins Co', 'SBI General Insurance'],
  },
  {
    accountId: 'ACC-006',
    name: 'Reliance General Insurance Company Limited',
    industry: 'Insurance / Financial Services',
    aliases: ['Reliance General', 'RGIC', 'Reliance General Insurance', 'Reliance General Ins'],
  },
  {
    accountId: 'ACC-007',
    name: 'Liberty General Insurance Limited',
    industry: 'Insurance / Financial Services',
    aliases: ['Liberty General', 'Liberty Insurance India', 'Liberty General Ins Ltd', 'Liberty GIC'],
  },
  {
    accountId: 'ACC-008',
    name: 'Raheja QBE General Insurance Company Limited',
    industry: 'Insurance / Financial Services',
    aliases: ['Raheja QBE', 'RQBE', 'Raheja QBE Insurance', 'Raheja QBE General'],
  },
  {
    accountId: 'ACC-009',
    name: 'Universal Sompo General Insurance Company Limited',
    industry: 'Insurance / Financial Services',
    aliases: ['Universal Sompo', 'USGIC', 'Universal Sompo General', 'Universal Sompo GIC'],
  },
  {
    accountId: 'ACC-010',
    name: 'Royal Sundaram General Insurance Co. Limited',
    industry: 'Insurance / Financial Services',
    aliases: ['Royal Sundaram', 'RSGIC', 'Royal Sundaram General', 'Royal Sundaram GIC'],
  },
  {
    accountId: 'ACC-011',
    name: 'ICICI Lombard Commercial Property Portfolio',
    industry: 'Insurance / Commercial Lines',
    aliases: ['ICICI Lombard Commercial Risk', 'ICICI Lombard Property Hub'],
  },
  {
    accountId: 'ACC-012',
    name: 'Bajaj Allianz Corporate Risk Division',
    industry: 'Insurance / Corporate Lines',
    aliases: ['Bajaj Allianz Industrial Risk', 'BAGIC Corporate Hub'],
  },
  {
    accountId: 'ACC-013',
    name: 'HDFC ERGO Enterprise Property Underwriting',
    industry: 'Insurance / Commercial Lines',
    aliases: ['HDFC ERGO Corporate Asset Hub', 'HDFC ERGO Commercial Underwriting'],
  },
  {
    accountId: 'ACC-014',
    name: 'Tata AIG Industrial & Catastrophe Operations',
    industry: 'Insurance / Industrial Lines',
    aliases: ['Tata AIG Catastrophe Property', 'TAGIC Industrial Hub'],
  },
  {
    accountId: 'ACC-015',
    name: 'SBI General Commercial Lines Portfolio',
    industry: 'Insurance / Commercial Lines',
    aliases: ['SBI General Corporate Risk', 'SBIG Property Division'],
  },
  {
    accountId: 'ACC-016',
    name: 'Reliance General Corporate Risk Syndicate',
    industry: 'Insurance / Commercial Lines',
    aliases: ['Reliance General Asset Underwriting', 'RGIC Corporate Risk'],
  },
  {
    accountId: 'ACC-017',
    name: 'Liberty General Specialty Property Division',
    industry: 'Insurance / Specialty Lines',
    aliases: ['Liberty General Commercial Lines', 'Liberty Specialty Risk'],
  },
  {
    accountId: 'ACC-018',
    name: 'Raheja QBE Commercial Asset Group',
    industry: 'Insurance / Commercial Lines',
    aliases: ['Raheja QBE Specialty Property', 'RQBE Commercial Risk'],
  },
  {
    accountId: 'ACC-019',
    name: 'Universal Sompo Industrial Underwriting',
    industry: 'Insurance / Industrial Lines',
    aliases: ['Universal Sompo Asset Hub', 'USGIC Corporate Underwriting'],
  },
  {
    accountId: 'ACC-020',
    name: 'Royal Sundaram Commercial Asset Operations',
    industry: 'Insurance / Commercial Lines',
    aliases: ['Royal Sundaram Corporate Lines', 'RSGIC Commercial Hub'],
  },
] as const;

// ── Policy definitions ────────────────────────────────────────────────────
// SE flood TIVs are exactly defined to sum to $59,100,000
// Layout: policyId, accountId, region, premium, floodLoc (null if none)

interface PolicyDef {
  policyId: string;
  accountId: string;
  region: string;
  premium: number;
  effectiveDate: string;
  expiryDate: string;
  productCode?: string;
}

const POLICY_DEFS: PolicyDef[] = [
  // ── DEMO (SE, non-flood) ─────────────────────────────────────
  { policyId: 'POL-100245', accountId: 'ACC-001', region: 'South-East', premium: 86_000, effectiveDate: '2025-01-01', expiryDate: '2026-01-01' },

  // ── South-East (14 more = 15 SE total) ──────────────────────
  { policyId: 'POL-100001', accountId: 'ACC-002', region: 'South-East', premium: 120_000, effectiveDate: '2025-03-01', expiryDate: '2026-03-01' },
  { policyId: 'POL-100002', accountId: 'ACC-004', region: 'South-East', premium: 98_000,  effectiveDate: '2025-02-01', expiryDate: '2026-02-01' },
  { policyId: 'POL-100003', accountId: 'ACC-006', region: 'South-East', premium: 75_000,  effectiveDate: '2025-04-01', expiryDate: '2026-04-01' },
  { policyId: 'POL-100004', accountId: 'ACC-011', region: 'South-East', premium: 110_000, effectiveDate: '2025-01-15', expiryDate: '2026-01-15' },
  { policyId: 'POL-100005', accountId: 'ACC-013', region: 'South-East', premium: 145_000, effectiveDate: '2025-05-01', expiryDate: '2026-05-01' },
  { policyId: 'POL-100006', accountId: 'ACC-014', region: 'South-East', premium: 89_000,  effectiveDate: '2025-06-01', expiryDate: '2026-06-01' },
  { policyId: 'POL-100007', accountId: 'ACC-015', region: 'South-East', premium: 132_000, effectiveDate: '2025-07-01', expiryDate: '2026-07-01' },
  { policyId: 'POL-100008', accountId: 'ACC-017', region: 'South-East', premium: 78_000,  effectiveDate: '2025-08-01', expiryDate: '2026-08-01' },
  { policyId: 'POL-100009', accountId: 'ACC-018', region: 'South-East', premium: 95_000,  effectiveDate: '2025-09-01', expiryDate: '2026-09-01' },
  { policyId: 'POL-100010', accountId: 'ACC-020', region: 'South-East', premium: 108_000, effectiveDate: '2025-10-01', expiryDate: '2026-10-01' },
  { policyId: 'POL-100011', accountId: 'ACC-003', region: 'South-East', premium: 65_000,  effectiveDate: '2025-01-01', expiryDate: '2026-01-01' },
  { policyId: 'POL-100012', accountId: 'ACC-005', region: 'South-East', premium: 71_000,  effectiveDate: '2025-02-15', expiryDate: '2026-02-15' },
  { policyId: 'POL-100013', accountId: 'ACC-007', region: 'South-East', premium: 84_000,  effectiveDate: '2025-03-15', expiryDate: '2026-03-15' },
  { policyId: 'POL-100014', accountId: 'ACC-016', region: 'South-East', premium: 59_000,  effectiveDate: '2025-11-01', expiryDate: '2026-11-01' },

  // ── North-East (12 policies) ─────────────────────────────────
  { policyId: 'POL-100015', accountId: 'ACC-008', region: 'North-East', premium: 155_000, effectiveDate: '2025-01-01', expiryDate: '2026-01-01' },
  { policyId: 'POL-100016', accountId: 'ACC-009', region: 'North-East', premium: 210_000, effectiveDate: '2025-02-01', expiryDate: '2026-02-01' },
  { policyId: 'POL-100017', accountId: 'ACC-010', region: 'North-East', premium: 185_000, effectiveDate: '2025-03-01', expiryDate: '2026-03-01' },
  { policyId: 'POL-100018', accountId: 'ACC-012', region: 'North-East', premium: 120_000, effectiveDate: '2025-04-01', expiryDate: '2026-04-01' },
  { policyId: 'POL-100019', accountId: 'ACC-019', region: 'North-East', premium: 95_000,  effectiveDate: '2025-01-01', expiryDate: '2026-01-01' },
  { policyId: 'POL-100020', accountId: 'ACC-002', region: 'North-East', premium: 88_000,  effectiveDate: '2025-05-01', expiryDate: '2026-05-01' },
  { policyId: 'POL-100021', accountId: 'ACC-004', region: 'North-East', premium: 102_000, effectiveDate: '2025-06-01', expiryDate: '2026-06-01' },
  { policyId: 'POL-100022', accountId: 'ACC-006', region: 'North-East', premium: 77_000,  effectiveDate: '2025-07-01', expiryDate: '2026-07-01' },
  { policyId: 'POL-100023', accountId: 'ACC-008', region: 'North-East', premium: 133_000, effectiveDate: '2025-08-01', expiryDate: '2026-08-01' },
  { policyId: 'POL-100024', accountId: 'ACC-011', region: 'North-East', premium: 91_000,  effectiveDate: '2025-09-01', expiryDate: '2026-09-01' },
  { policyId: 'POL-100025', accountId: 'ACC-013', region: 'North-East', premium: 148_000, effectiveDate: '2025-10-01', expiryDate: '2026-10-01' },
  { policyId: 'POL-100026', accountId: 'ACC-015', region: 'North-East', premium: 117_000, effectiveDate: '2025-11-01', expiryDate: '2026-11-01' },

  // ── Midwest (12 policies) ────────────────────────────────────
  { policyId: 'POL-100027', accountId: 'ACC-007', region: 'Midwest', premium: 92_000,  effectiveDate: '2025-01-01', expiryDate: '2026-01-01' },
  { policyId: 'POL-100028', accountId: 'ACC-014', region: 'Midwest', premium: 78_000,  effectiveDate: '2025-02-01', expiryDate: '2026-02-01' },
  { policyId: 'POL-100029', accountId: 'ACC-016', region: 'Midwest', premium: 115_000, effectiveDate: '2025-03-01', expiryDate: '2026-03-01' },
  { policyId: 'POL-100030', accountId: 'ACC-018', region: 'Midwest', premium: 130_000, effectiveDate: '2025-04-01', expiryDate: '2026-04-01' },
  { policyId: 'POL-100031', accountId: 'ACC-002', region: 'Midwest', premium: 69_000,  effectiveDate: '2025-01-01', expiryDate: '2026-01-01' },
  { policyId: 'POL-100032', accountId: 'ACC-003', region: 'Midwest', premium: 84_000,  effectiveDate: '2025-05-01', expiryDate: '2026-05-01' },
  { policyId: 'POL-100033', accountId: 'ACC-005', region: 'Midwest', premium: 97_000,  effectiveDate: '2025-06-01', expiryDate: '2026-06-01' },
  { policyId: 'POL-100034', accountId: 'ACC-009', region: 'Midwest', premium: 74_000,  effectiveDate: '2025-07-01', expiryDate: '2026-07-01' },
  { policyId: 'POL-100035', accountId: 'ACC-012', region: 'Midwest', premium: 108_000, effectiveDate: '2025-08-01', expiryDate: '2026-08-01' },
  { policyId: 'POL-100036', accountId: 'ACC-017', region: 'Midwest', premium: 61_000,  effectiveDate: '2025-09-01', expiryDate: '2026-09-01' },
  { policyId: 'POL-100037', accountId: 'ACC-019', region: 'Midwest', premium: 88_000,  effectiveDate: '2025-10-01', expiryDate: '2026-10-01' },
  { policyId: 'POL-100038', accountId: 'ACC-020', region: 'Midwest', premium: 125_000, effectiveDate: '2025-11-01', expiryDate: '2026-11-01' },

  // ── West (11 policies) ───────────────────────────────────────
  { policyId: 'POL-100039', accountId: 'ACC-010', region: 'West', premium: 178_000, effectiveDate: '2025-01-01', expiryDate: '2026-01-01' },
  { policyId: 'POL-100040', accountId: 'ACC-013', region: 'West', premium: 142_000, effectiveDate: '2025-02-01', expiryDate: '2026-02-01' },
  { policyId: 'POL-100041', accountId: 'ACC-015', region: 'West', premium: 198_000, effectiveDate: '2025-03-01', expiryDate: '2026-03-01' },
  { policyId: 'POL-100042', accountId: 'ACC-002', region: 'West', premium: 85_000,  effectiveDate: '2025-04-01', expiryDate: '2026-04-01' },
  { policyId: 'POL-100043', accountId: 'ACC-004', region: 'West', premium: 99_000,  effectiveDate: '2025-05-01', expiryDate: '2026-05-01' },
  { policyId: 'POL-100044', accountId: 'ACC-006', region: 'West', premium: 112_000, effectiveDate: '2025-06-01', expiryDate: '2026-06-01' },
  { policyId: 'POL-100045', accountId: 'ACC-008', region: 'West', premium: 76_000,  effectiveDate: '2025-07-01', expiryDate: '2026-07-01' },
  { policyId: 'POL-100046', accountId: 'ACC-011', region: 'West', premium: 93_000,  effectiveDate: '2025-08-01', expiryDate: '2026-08-01' },
  { policyId: 'POL-100047', accountId: 'ACC-014', region: 'West', premium: 68_000,  effectiveDate: '2025-09-01', expiryDate: '2026-09-01' },
  { policyId: 'POL-100048', accountId: 'ACC-017', region: 'West', premium: 105_000, effectiveDate: '2025-10-01', expiryDate: '2026-10-01' },
  { policyId: 'POL-100049', accountId: 'ACC-020', region: 'West', premium: 159_000, effectiveDate: '2025-11-01', expiryDate: '2026-11-01' },
];

// ── Location definitions ──────────────────────────────────────────────────

interface LocDef {
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
  floodZone: string;
  floodScore: number;
  hazards?: Record<string, { band: string; score: number }>;
  /** true = this is the TIV calibration anchor (only one) */
  isAnchor?: boolean;
}

const CONSTRUCTIONS = ['Masonry', 'Frame', 'Steel Frame', 'Concrete', 'Mixed'];
const OCCUPANCIES   = ['Office', 'Warehouse', 'Retail', 'Manufacturing', 'Hotel', 'Medical'];

function locId(n: number): string { return `LOC-${String(n).padStart(5, '0')}`; }

// SE flood zone locations — EXACT TIVs summing to $59,100,000
const SE_FLOOD_LOCATIONS: LocDef[] = [
  { locationId: locId(1),  policyId: 'POL-100001', addressLine: '100 Bayview Dr',     city: 'Savannah',     postalCode: '31401', region: 'South-East', lat: 32.08, lon: -81.09, tiv: 8_000_000, construction: 'Concrete',   occupancy: 'Manufacturing', floodZone: 'AE', floodScore: 8 },
  { locationId: locId(2),  policyId: 'POL-100002', addressLine: '200 Marsh Rd',        city: 'Gainesville',  postalCode: '32601', region: 'South-East', lat: 29.65, lon: -82.32, tiv: 7_500_000, construction: 'Steel Frame', occupancy: 'Warehouse',     floodZone: 'AE', floodScore: 7 },
  { locationId: locId(3),  policyId: 'POL-100003', addressLine: '301 River Ln',        city: 'Jacksonville', postalCode: '33101', region: 'South-East', lat: 30.33, lon: -81.65, tiv: 7_000_000, construction: 'Masonry',    occupancy: 'Office',        floodZone: 'A',  floodScore: 6 },
  { locationId: locId(4),  policyId: 'POL-100004', addressLine: '420 Coastal Hwy',     city: 'Charleston',   postalCode: '29401', region: 'South-East', lat: 32.77, lon: -79.93, tiv: 6_500_000, construction: 'Frame',      occupancy: 'Hotel',         floodZone: 'V',  floodScore: 9 },
  { locationId: locId(5),  policyId: 'POL-100005', addressLine: '500 Harbor Blvd',     city: 'Wilmington',   postalCode: '28401', region: 'South-East', lat: 34.22, lon: -77.94, tiv: 6_000_000, construction: 'Concrete',   occupancy: 'Manufacturing', floodZone: 'A',  floodScore: 5 },
  { locationId: locId(6),  policyId: 'POL-100006', addressLine: '601 Flood Plain Ave', city: 'Atlanta',      postalCode: '30301', region: 'South-East', lat: 33.74, lon: -84.38, tiv: 5_500_000, construction: 'Steel Frame', occupancy: 'Warehouse',     floodZone: 'AE', floodScore: 6 },
  { locationId: locId(7),  policyId: 'POL-100007', addressLine: '700 Storm Surge Rd',  city: 'Cape Fear',    postalCode: '33901', region: 'South-East', lat: 26.64, lon: -81.86, tiv: 5_000_000, construction: 'Mixed',      occupancy: 'Retail',        floodZone: 'V',  floodScore: 8 },
  { locationId: locId(8),  policyId: 'POL-100008', addressLine: '801 Inlet Way',       city: 'Savannah',     postalCode: '31401', region: 'South-East', lat: 32.09, lon: -81.10, tiv: 4_500_000, construction: 'Concrete',   occupancy: 'Hotel',         floodZone: 'AE', floodScore: 8 },
  { locationId: locId(9),  policyId: 'POL-100009', addressLine: '900 Low Country Dr',  city: 'Columbia',     postalCode: '29201', region: 'South-East', lat: 34.00, lon: -81.03, tiv: 4_600_000, construction: 'Masonry',    occupancy: 'Office',        floodZone: 'AE', floodScore: 7 },
  { locationId: locId(10), policyId: 'POL-100010', addressLine: '1000 Swamp Fox Blvd', city: 'Raleigh',      postalCode: '28601', region: 'South-East', lat: 35.78, lon: -78.63, tiv: 4_500_000, construction: 'Frame',      occupancy: 'Medical',       floodZone: 'A',  floodScore: 5 },
];
// Verify SE flood sum = $59,100,000
const seFloodSum = SE_FLOOD_LOCATIONS.reduce((s, l) => s + l.tiv, 0);
if (seFloodSum !== TARGET_SE_FLOOD_TIV) {
  throw new Error(`SE flood TIV mismatch: ${seFloodSum} !== ${TARGET_SE_FLOOD_TIV}`);
}

// NE flood locations — $36,000,000
const NE_FLOOD_LOCATIONS: LocDef[] = [
  { locationId: locId(30), policyId: 'POL-100015', addressLine: '10 Manhattan Ave',    city: 'New York',    postalCode: '10001', region: 'North-East', lat: 40.71, lon: -74.00, tiv: 10_000_000, construction: 'Concrete',   occupancy: 'Office',        floodZone: 'AE', floodScore: 7 },
  { locationId: locId(31), policyId: 'POL-100016', addressLine: '22 Harbour St',       city: 'Boston',      postalCode: '02101', region: 'North-East', lat: 42.36, lon: -71.06, tiv: 9_000_000,  construction: 'Steel Frame', occupancy: 'Manufacturing', floodZone: 'A',  floodScore: 5 },
  { locationId: locId(32), policyId: 'POL-100017', addressLine: '334 Industrial Pkwy', city: 'Newark',      postalCode: '07001', region: 'North-East', lat: 40.73, lon: -74.17, tiv: 9_000_000,  construction: 'Masonry',    occupancy: 'Warehouse',     floodZone: 'AE', floodScore: 6 },
  { locationId: locId(33), policyId: 'POL-100018', addressLine: '445 Delaware Way',    city: 'Philadelphia', postalCode: '19101', region: 'North-East', lat: 39.95, lon: -75.16, tiv: 8_000_000,  construction: 'Frame',      occupancy: 'Medical',       floodZone: 'A',  floodScore: 4 },
];

// Midwest flood locations — $30,000,000
const MW_FLOOD_LOCATIONS: LocDef[] = [
  { locationId: locId(60), policyId: 'POL-100027', addressLine: '55 Lakeshore Dr',    city: 'Chicago',      postalCode: '60601', region: 'Midwest', lat: 41.88, lon: -87.63, tiv: 8_000_000, construction: 'Concrete',   occupancy: 'Office',        floodZone: 'A',  floodScore: 5 },
  { locationId: locId(61), policyId: 'POL-100028', addressLine: '100 Mississippi Rd', city: 'Minneapolis',  postalCode: '55101', region: 'Midwest', lat: 44.97, lon: -93.26, tiv: 8_000_000, construction: 'Steel Frame', occupancy: 'Manufacturing', floodZone: 'AE', floodScore: 6 },
  { locationId: locId(62), policyId: 'POL-100029', addressLine: '203 Scioto Blvd',    city: 'Columbus',     postalCode: '43201', region: 'Midwest', lat: 39.96, lon: -82.99, tiv: 7_000_000, construction: 'Masonry',    occupancy: 'Warehouse',     floodZone: 'A',  floodScore: 4 },
  { locationId: locId(63), policyId: 'POL-100030', addressLine: '310 Fox River Ln',   city: 'Milwaukee',    postalCode: '53201', region: 'Midwest', lat: 43.03, lon: -87.90, tiv: 7_000_000, construction: 'Frame',      occupancy: 'Medical',       floodZone: 'AE', floodScore: 5 },
];

// West flood locations — $24,000,000
const WEST_FLOOD_LOCATIONS: LocDef[] = [
  { locationId: locId(90), policyId: 'POL-100039', addressLine: '1 Wilshire Blvd',  city: 'Los Angeles', postalCode: '90001', region: 'West', lat: 34.05, lon: -118.24, tiv: 8_000_000, construction: 'Concrete',   occupancy: 'Office',        floodZone: 'A',  floodScore: 4 },
  { locationId: locId(91), policyId: 'POL-100040', addressLine: '200 Pearl Dist',   city: 'Portland',    postalCode: '97201', region: 'West', lat: 45.52, lon: -122.68, tiv: 8_000_000, construction: 'Steel Frame', occupancy: 'Manufacturing', floodZone: 'A',  floodScore: 5 },
  { locationId: locId(92), policyId: 'POL-100041', addressLine: '300 Salt River Rd', city: 'Phoenix',    postalCode: '85001', region: 'West', lat: 33.44, lon: -112.07, tiv: 8_000_000, construction: 'Masonry',    occupancy: 'Warehouse',     floodZone: 'AE', floodScore: 6 },
];

// All flood locations
const ALL_FLOOD_LOCATIONS = [
  ...SE_FLOOD_LOCATIONS,
  ...NE_FLOOD_LOCATIONS,
  ...MW_FLOOD_LOCATIONS,
  ...WEST_FLOOD_LOCATIONS,
];
// Expected: 59.1M + 36M + 30M + 24M = 149.1M

// ── Demo policy locations (non-flood X zone) ───────────────────────────
const DEMO_LOCATIONS: LocDef[] = [
  {
    locationId: 'LOC-D0001',
    policyId: 'POL-100245',
    addressLine: '123 Harbor Dr',
    city: 'Tampa',
    postalCode: '33601',
    region: 'South-East',
    lat: 27.94,
    lon: -82.45,
    tiv: 2_000_000,
    construction: 'Concrete',
    occupancy: 'Manufacturing',
    floodZone: 'X',
    floodScore: 2,
  },
  {
    locationId: 'LOC-D0002',
    policyId: 'POL-100245',
    addressLine: '456 Bay Blvd',
    city: 'Tampa',
    postalCode: '34201',
    region: 'South-East',
    lat: 27.96,
    lon: -82.48,
    tiv: 2_000_000,
    construction: 'Concrete',
    occupancy: 'Office',
    floodZone: 'X',
    floodScore: 3,
  },
];

// ── Non-flood location generation (seedrandom-based) ──────────────────────

// Postal codes by region (safe/non-flood only — flood zone locations are separately defined)
const SE_SAFE_POSTCODES  = ['27601','28101','30401','31201','32501','29601','30601'];
const NE_SAFE_POSTCODES  = ['06101','01101','08101','14201','12201','16201','18101','17101'];
const MW_SAFE_POSTCODES  = ['46201','48201','64101','61601','44101','63101','45201'];
const WEST_SAFE_POSTCODES = ['94101','98101','80201','84101','87501','92101'];

const REGION_CITIES: Record<string, string[]> = {
  'South-East': ['Tampa', 'Orlando', 'Charlotte', 'Nashville', 'Memphis', 'Atlanta', 'Raleigh'],
  'North-East':  ['Hartford', 'Albany', 'Trenton', 'Worcester', 'Rochester', 'Buffalo', 'Syracuse'],
  'Midwest':     ['Indianapolis', 'Detroit', 'Kansas City', 'Omaha', 'Cleveland', 'Cincinnati', 'Toledo'],
  'West':        ['Sacramento', 'Seattle', 'Las Vegas', 'Albuquerque', 'Tucson', 'Denver', 'Salt Lake City'],
};

const STREET_TYPES = ['Ave', 'Blvd', 'Dr', 'St', 'Pkwy', 'Rd', 'Ln', 'Way'];
const STREET_NAMES = ['Commerce', 'Industrial', 'Park', 'Main', 'Oak', 'Elm', 'River', 'Lake', 'Maple', 'Pine'];

function genAddress(): string {
  return `${rand(100, 9999)} ${pick(STREET_NAMES)} ${pick(STREET_TYPES)}`;
}

// Track which location numbers we've used
let locCounter = 120;

// Generate safe-zone locations for each policy
// Flood policies get 2 non-flood locations (total 3); safe-zone policies get 2 non-flood locations
function getRegionPostcodes(region: string): string[] {
  const map: Record<string, string[]> = {
    'South-East': SE_SAFE_POSTCODES,
    'North-East':  NE_SAFE_POSTCODES,
    'Midwest':     MW_SAFE_POSTCODES,
    'West':        WEST_SAFE_POSTCODES,
  };
  return map[region] ?? SE_SAFE_POSTCODES;
}

function genRegionCoords(region: string): { lat: number; lon: number } {
  const boxes: Record<string, [number, number, number, number]> = {
    'South-East': [25, 36, -88, -75],
    'North-East':  [40, 47, -80, -67],
    'Midwest':     [36, 48, -97, -80],
    'West':        [30, 49, -125, -104],
  };
  const [latMin, latMax, lonMin, lonMax] = boxes[region] ?? [25, 36, -88, -75];
  const lat = latMin + rng() * (latMax - latMin);
  const lon = lonMin + rng() * (lonMax - lonMin);
  return { lat: Math.round(lat * 100) / 100, lon: Math.round(lon * 100) / 100 };
}

const SAFE_LOCATIONS: LocDef[] = [];

// Generate non-flood locations for all policies (excluding demo which is separately defined)
for (const p of POLICY_DEFS) {
  if (p.policyId === 'POL-100245') continue; // demo locations are explicit

  const postcodes = getRegionPostcodes(p.region);
  const locCount = p.policyId === 'POL-100049' ? 1 : 2;

  for (let i = 0; i < locCount; i++) {
    locCounter++;
    const postalCode = pick(postcodes);
    const lookup = floodMap.get(postalCode);
    const coords = genRegionCoords(p.region);

    SAFE_LOCATIONS.push({
      locationId: locId(locCounter),
      policyId: p.policyId,
      addressLine: genAddress(),
      city: pick(REGION_CITIES[p.region] ?? ['Tampa']),
      postalCode,
      region: p.region,
      lat: coords.lat,
      lon: coords.lon,
      tiv: rand(1_000_000, 4_000_000),
      construction: pick(CONSTRUCTIONS),
      occupancy: pick(OCCUPANCIES),
      floodZone: lookup?.floodZone ?? 'X',
      floodScore: lookup?.floodScore ?? 2,
      ...(i === 0 && p.policyId === 'POL-100011' ? { isAnchor: true } : {}),
    });
  }
}

// All locations before calibration
const ALL_LOCS_BEFORE_CAL: LocDef[] = [
  ...DEMO_LOCATIONS,
  ...NEW_DEMO_LOCATIONS,
  ...ALL_FLOOD_LOCATIONS,
  ...SAFE_LOCATIONS,
];

// Scale non-SE-flood locations so the fixed SE flood total remains unchanged.
// We also protect the fixed demo policies (POL-100245 and the 7 new demo policies POL-200101..7)
// so each demo policy has exactly $4,000,000 total TIV ($2M per location).
const protectedLocations = ALL_LOCS_BEFORE_CAL.filter(
  (location) =>
    (location.region === 'South-East' && ['A', 'AE', 'V'].includes(location.floodZone)) ||
    location.policyId === 'POL-100245' ||
    location.policyId.startsWith('POL-2001'),
);
const adjustableLocations = ALL_LOCS_BEFORE_CAL.filter(
  (location) => !protectedLocations.includes(location),
);
const protectedTotal = protectedLocations.reduce((sum, location) => sum + location.tiv, 0);
const adjustableTotal = adjustableLocations.reduce((sum, location) => sum + location.tiv, 0);
const targetAdjustableTotal = TARGET_TOTAL_TIV - protectedTotal;
const adjustmentScale = targetAdjustableTotal / adjustableTotal;

for (const location of adjustableLocations) {
  location.tiv = Math.max(1, Math.round(location.tiv * adjustmentScale));
}

// Apply rounding remainder to the known non-flood anchor.
const anchorLoc = SAFE_LOCATIONS.find((l) => l.policyId === 'POL-100011' && l.isAnchor);
if (!anchorLoc) throw new Error('Anchor location not found for TIV calibration');
const calibratedTotal = ALL_LOCS_BEFORE_CAL.reduce((sum, location) => sum + location.tiv, 0);
anchorLoc.tiv += TARGET_TOTAL_TIV - calibratedTotal;
if (anchorLoc.tiv <= 0) throw new Error('TIV calibration produced an invalid anchor value');

const ALL_LOCATIONS: LocDef[] = ALL_LOCS_BEFORE_CAL;

// Assign multi-hazard readings to all locations that don't already have explicit readings
for (let i = 0; i < ALL_LOCATIONS.length; i++) {
  const loc = ALL_LOCATIONS[i]!;
  if (!loc.hazards) {
    loc.hazards = assignHazardsForLocation(loc.region, i + 1);
  }
}

// ── ensureIndexes ─────────────────────────────────────────────────────────

export async function ensureIndexes(): Promise<void> {
  await Promise.all([
    User.syncIndexes(),
    Company.syncIndexes(),
    Account.syncIndexes(),
    Policy.syncIndexes(),
    Location.syncIndexes(),
    RiskSnapshot.syncIndexes(),
    FloodLookup.syncIndexes(),
    HazardLookup.syncIndexes(),
    Product.syncIndexes(),
    Signal.syncIndexes(),
    DriftEvent.syncIndexes(),
    Activity.syncIndexes(),
    Decision.syncIndexes(),
    RuleVersion.syncIndexes(),
    AuditLog.syncIndexes(),
    PortfolioConfig.syncIndexes(),
  ]);
}

// ── Baseline Audit Logs ───────────────────────────────────────────────────

const BASELINE_AUDIT_LOGS = [
  {
    ts: new Date(Date.now() - 3600000 * 24 * 5),
    actor: 'system',
    action: 'SYSTEM_INIT',
    entityType: 'PORTFOLIO_CONFIG',
    entityId: 'EDS_CORE',
    details: { event: 'Exposure Drift Sentinel core engine initialized', version: '2.4.0', status: 'READY' },
  },
  {
    ts: new Date(Date.now() - 3600000 * 24 * 4),
    actor: 'system',
    action: 'PORTFOLIO_CONFIG_SET',
    entityType: 'PORTFOLIO_CONFIG',
    entityId: 'floodCap_South-East',
    details: { appetiteCap: 0.20, region: 'South-East', hazard: 'flood', guideline: 'CRO Underwriting Guidelines' },
  },
  {
    ts: new Date(Date.now() - 3600000 * 24 * 3),
    actor: 'guidewire-sync',
    action: 'POLICY_BIND_SYNC',
    entityType: 'RISK_SNAPSHOT',
    entityId: 'POL-100001',
    details: { policyNumber: 'POL-100001', insured: 'Acme Manufacturing', locations: 3, boundTiv: 10655552, status: 'IN_FORCE' },
  },
  {
    ts: new Date(Date.now() - 3600000 * 24 * 3 + 1800000),
    actor: 'guidewire-sync',
    action: 'POLICY_BIND_SYNC',
    entityType: 'RISK_SNAPSHOT',
    entityId: 'POL-100245',
    details: { policyNumber: 'POL-100245', insured: 'Apex Logistics', locations: 2, boundTiv: 4000000, status: 'IN_FORCE' },
  },
  {
    ts: new Date(Date.now() - 3600000 * 24 * 2),
    actor: 'fema-nfip',
    action: 'SIGNAL_RECEIVED',
    entityType: 'SIGNAL',
    entityId: 'SIG-FEMA-2026-041',
    details: { provider: 'FEMA FIRM Coastal Update', state: 'FL', updatedCounties: ['Hillsborough', 'Pinellas'], status: 'INGESTED' },
  },
  {
    ts: new Date(Date.now() - 3600000 * 24 * 1),
    actor: 'usgs-feed',
    action: 'SIGNAL_RECEIVED',
    entityType: 'SIGNAL',
    entityId: 'SIG-USGS-2026-088',
    details: { provider: 'USGS ShakeMap Catalog', territory: 'West', thresholdMw: 4.5, matches: 0 },
  },
  {
    ts: new Date(Date.now() - 3600000 * 12),
    actor: 'USR-001',
    action: 'UNDERWRITER_LOGIN',
    entityType: 'ACTIVITY',
    entityId: 'USR-001',
    details: { underwriter: 'Priya Sharma', workstation: 'Commercial Property Line', session: 'ACTIVE' },
  },
  {
    ts: new Date(Date.now() - 3600000 * 6),
    actor: 'system',
    action: 'PORTFOLIO_SCAN_PASS',
    entityType: 'PORTFOLIO_CONFIG',
    entityId: 'SE_FLOOD_BASELINE',
    details: { seFloodExposure: '19.70%', appetiteCap: '20.00%', status: 'WITHIN_APPETITE', totalTiv: 502000000 },
  },
];

// ── Main seed function ────────────────────────────────────────────────────

export async function seedDb(): Promise<void> {
  // ── 1. Delete all (not in a transaction per amendment #2) ──────────────
  await Promise.all([
    User.deleteMany({}),
    Company.deleteMany({}),
    Account.deleteMany({}),
    Policy.deleteMany({}),
    Location.deleteMany({}),
    RiskSnapshot.deleteMany({}),
    FloodLookup.deleteMany({}),
    HazardLookup.deleteMany({}),
    Product.deleteMany({}),
    Signal.deleteMany({}),
    DriftEvent.deleteMany({}),
    Activity.deleteMany({}),
    Decision.deleteMany({}),
    RuleVersion.deleteMany({}),
    // AuditLog is strictly immutable and append-only — preserved across resets.
    PortfolioConfig.deleteMany({}),
  ]);

  // ── 2. Sync indexes (amendment #2) ─────────────────────────────────────
  await ensureIndexes();

  // ── 3. Insert base data ────────────────────────────────────────────────
  await User.insertMany(USERS);
  await Company.insertMany(VERIFIED_INDIAN_INSURERS);
  await Account.insertMany([...ACCOUNTS, ...DEMO_ACCOUNTS_H6]);
  await FloodLookup.insertMany(FLOOD_LOOKUP);
  await Product.insertMany(PRODUCT_CATALOGUE);

  // Fill HazardLookup table for all seeded postal codes and all 8 hazards
  const allPostalCodes = [
    ...new Set([
      ...FLOOD_LOOKUP.map((f) => f.postalCode),
      ...ALL_LOCATIONS.map((l) => l.postalCode),
    ]),
  ];
  const hazardLookups = [];
  for (const postalCode of allPostalCodes) {
    const floodEntry = floodMap.get(postalCode);
    const locWithPostal = ALL_LOCATIONS.find((l) => l.postalCode === postalCode);

    for (const hazard of HAZARD_IDS) {
      if (hazard === 'flood') {
        hazardLookups.push({
          postalCode,
          hazard: 'flood',
          band: floodEntry?.floodZone ?? 'X',
          score: floodEntry?.floodScore ?? 1,
        });
      } else {
        const reading = locWithPostal?.hazards?.[hazard] ?? { band: 'low', score: 1 };
        hazardLookups.push({
          postalCode,
          hazard,
          band: reading.band,
          score: reading.score,
        });
      }
    }
  }
  await HazardLookup.insertMany(hazardLookups);

  await PortfolioConfig.insertMany([
    { key: 'floodCap_default',    value: 0.20 },
    { key: 'floodCap_South-East', value: 0.20 },
    { key: 'floodCap_North-East', value: 0.20 },
    { key: 'floodCap_Midwest',    value: 0.20 },
    { key: 'floodCap_West',       value: 0.20 },
    { key: 'activityAssigneeIdx', value: 0    }, // round-robin counter
  ]);

  // ── 4. Insert policies ─────────────────────────────────────────────────
  const allPolicyDefs: PolicyDef[] = [
    ...POLICY_DEFS,
    ...NEW_DEMO_POLICIES.map((p) => ({
      policyId: p.policyId,
      accountId: p.accountId,
      region: p.region,
      premium: p.premium,
      effectiveDate: p.effectiveDate,
      expiryDate: p.expiryDate,
      productCode: p.productCode,
    })),
  ];

  await Policy.insertMany(
    allPolicyDefs.map((p, i) => ({
      ...p,
      product: 'Commercial Property',
      productCode: p.productCode ?? assignProductCode(p.policyId, p.region, i),
      status: 'IN_FORCE',
      effectiveDate: new Date(p.effectiveDate),
      expiryDate: new Date(p.expiryDate),
    })),
  );

  // ── 5. Insert locations ────────────────────────────────────────────────
  await Location.insertMany(ALL_LOCATIONS);

  // ── 6. Verify TIV totals ───────────────────────────────────────────────
  const [totalAgg] = (await Location.aggregate([
    { $group: { _id: null, total: { $sum: '$tiv' } } },
  ])) as [{ total: number }];

  const [seFloodAgg] = (await Location.aggregate([
    { $match: { region: 'South-East', floodZone: { $in: ['A', 'AE', 'V'] } } },
    { $group: { _id: null, total: { $sum: '$tiv' } } },
  ])) as [{ total: number }];

  const actualTotal   = totalAgg?.total ?? 0;
  const actualSeFlood = seFloodAgg?.total ?? 0;

  if (actualTotal !== TARGET_TOTAL_TIV) {
    throw new Error(
      `SEED VERIFICATION FAILED — total TIV: ${actualTotal} !== ${TARGET_TOTAL_TIV}`,
    );
  }
  if (actualSeFlood !== TARGET_SE_FLOOD_TIV) {
    throw new Error(
      `SEED VERIFICATION FAILED — SE flood TIV: ${actualSeFlood} !== ${TARGET_SE_FLOOD_TIV}`,
    );
  }

  // ── 7. Verify Products & Multi-Hazard Invariants ───────────────────────
  const productCount = await Product.countDocuments();
  if (productCount !== 9) {
    throw new Error(`SEED VERIFICATION FAILED — product count: ${productCount} !== 9`);
  }

  const invalidProductPolicyCount = await Policy.countDocuments({
    productCode: { $nin: PRODUCT_CATALOGUE.map((p) => p.productCode) },
  });
  if (invalidProductPolicyCount > 0) {
    throw new Error(
      `SEED VERIFICATION FAILED — ${invalidProductPolicyCount} policies have invalid productCode`,
    );
  }

  // Verify all hazards' worst-region shares are below their appetite cap
  const rulesConfig = await loadAndStoreRules();
  const allSeededLocs = await Location.find().lean();
  for (const hazard of HAZARD_IDS) {
    const exp = calculateExposure(
      allSeededLocs.map((l) => ({
        policyId: l.policyId,
        region: l.region,
        tiv: l.tiv,
        floodZone: l.floodZone,
        hazards: l.hazards as Record<string, { band: string; score: number }> | undefined,
      })),
      [],
      hazard,
      rulesConfig,
    );
    for (const reg of exp.regions) {
      if (reg.breach) {
        throw new Error(
          `SEED VERIFICATION FAILED: Region ${reg.region} breached cap for hazard ${hazard} (share: ${reg.share.toFixed(4)}, cap: ${reg.cap})`,
        );
      }
    }
  }

  // ── 8. Create BIND snapshots for every policy ──────────────────────────
  const allPolicies = await Policy.find().lean();
  for (const pol of allPolicies) {
    const locs = await Location.find({ policyId: pol.policyId }).lean();
    const snapLocs: SnapshotLocation[] = locs.map((l) => ({
      locationId: l.locationId,
      addressLine: l.addressLine,
      tiv: l.tiv,
      floodZone: l.floodZone,
      floodScore: l.floodScore,
      hazards: l.hazards as Record<string, { band: string; score: number }> | undefined,
    }));
    await RiskSnapshot.create({
      policyId: pol.policyId,
      takenAt: new Date(),
      kind: 'BIND',
      state: {
        locations: snapLocs,
        totalTiv: locs.reduce((s, l) => s + l.tiv, 0),
      },
    });
  }

  // ── 9. Ensure Audit Ledger has baseline history & records reset ──────────
  const auditColl = mongoose.connection.collection('auditlogs');
  const existingCount = await auditColl.countDocuments();
  if (existingCount < 5) {
    await auditColl.insertMany(BASELINE_AUDIT_LOGS);
  }
  // Record the baseline calibration event in the immutable ledger
  await auditColl.insertOne({
    ts: new Date(),
    actor: 'USR-001',
    action: 'PORTFOLIO_CONFIG_RESET',
    entityType: 'PORTFOLIO_CONFIG',
    entityId: 'DEMO_BASELINE',
    details: {
      action: 'Portfolio baseline recalibrated to initial 19.70% state',
      restoredPolicies: 50,
      operator: 'Priya Sharma (USR-001)',
      targetTiv: '$502,000,000',
    },
  });
}

// ── CLI entry point ───────────────────────────────────────────────────────

async function main(): Promise<void> {
  const { env }    = await import('../config/env.js');
  const { logger } = await import('../config/logger.js');

  logger.info('Connecting to MongoDB for seed...');
  await mongoose.connect(env.MONGO_URI, { serverSelectionTimeoutMS: 10_000 });
  logger.info('Connected. Seeding...');

  await seedDb();

  const locationCount = await Location.countDocuments();
  const policyCount   = await Policy.countDocuments();
  const snapshotCount = await RiskSnapshot.countDocuments();

  logger.info(
    { policies: policyCount, locations: locationCount, snapshots: snapshotCount },
    '✅ Seed complete. TIV targets verified.',
  );

  await mongoose.connection.close();
}

const entryPoint = process.argv[1] ?? '';
if (/[/\\]seed[/\\]index\.(js|ts)$/.test(entryPoint)) {
  main().catch((err: unknown) => {
    // eslint-disable-next-line no-console
    console.error('Seed failed:', err);
    process.exit(1);
  });
}
