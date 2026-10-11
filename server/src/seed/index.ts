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
  { userId: 'USR-001', name: 'Priya Sharma',    role: 'UNDERWRITER'        },
  { userId: 'USR-002', name: 'Marcus Williams', role: 'SENIOR_UNDERWRITER' },
  { userId: 'USR-003', name: 'Admin User',      role: 'ADMIN'              },
  { userId: 'USR-004', name: 'Aisha Patel',     role: 'UNDERWRITER'        },
  { userId: 'USR-005', name: 'Devon Torres',    role: 'UNDERWRITER'        },
] as const;

// ── Accounts ──────────────────────────────────────────────────────────────
const ACCOUNTS = [
  // Demo account
  {
    accountId: 'ACC-001',
    name: 'Northwind Fabrication',
    industry: 'Manufacturing',
    aliases: ['Northwind Fab', 'NW Fabrication LLC', 'Northwind Fabrications'],
  },
  // Ambiguous near-duplicates (tests confidence gate)
  {
    accountId: 'ACC-002',
    name: 'Acme Manufacturing',
    industry: 'Manufacturing',
    aliases: ['ACME Mfg Pvt Ltd', 'Acme Mfg.', 'ACME Manufacturing Corp'],
  },
  {
    accountId: 'ACC-003',
    name: 'Acme Industrial',
    industry: 'Manufacturing',
    aliases: ['Acme Industries', 'ACME Industrial LLC'],
  },
  {
    accountId: 'ACC-004',
    name: 'Ridgeline Properties',
    industry: 'Real Estate',
    aliases: ['Ridgeline Props', 'Ridgeline Real Estate Group'],
  },
  {
    accountId: 'ACC-005',
    name: 'BlueSky Logistics',
    industry: 'Logistics',
    aliases: ['Blue Sky Logistics LLC', 'BSL Inc'],
  },
  {
    accountId: 'ACC-006',
    name: 'Coastal Ventures',
    industry: 'Real Estate',
    aliases: ['Coastal Venture Group', 'CV Real Estate'],
  },
  {
    accountId: 'ACC-007',
    name: 'Heartland Foods',
    industry: 'Food & Beverage',
    aliases: ['Heartland Food Corp', 'HLF Industries'],
  },
  {
    accountId: 'ACC-008',
    name: 'Summit Tech',
    industry: 'Technology',
    aliases: ['Summit Technology Inc', 'SummitTech LLC'],
  },
  {
    accountId: 'ACC-009',
    name: 'Pacific Coast Properties',
    industry: 'Real Estate',
    aliases: ['Pacific Properties LLC', 'PCP Real Estate'],
  },
  // Pacific Properties LLC is also an alias of ACC-009 — near-match with ACC-010
  {
    accountId: 'ACC-010',
    name: 'Pacific Properties',
    industry: 'Real Estate',
    aliases: ['Pacific Property Group', 'PPG Inc'],
  },
  {
    accountId: 'ACC-011',
    name: 'Granite Industrial',
    industry: 'Manufacturing',
    aliases: ['Granite Industries', 'GI Corp'],
  },
  {
    accountId: 'ACC-012',
    name: 'Lakeside Warehousing',
    industry: 'Logistics',
    aliases: ['Lakeside Storage', 'LSW LLC'],
  },
  {
    accountId: 'ACC-013',
    name: 'Delta Chemicals',
    industry: 'Chemical',
    aliases: ['Delta Chemical Corp', 'DCC Industries'],
  },
  {
    accountId: 'ACC-014',
    name: 'Maplewood Construction',
    industry: 'Construction',
    aliases: ['Maplewood Builders', 'MWC LLC'],
  },
  {
    accountId: 'ACC-015',
    name: 'Ironside Steel',
    industry: 'Manufacturing',
    aliases: ['Ironside Steel Corp', 'ISS Inc'],
  },
  {
    accountId: 'ACC-016',
    name: 'Verde Farms',
    industry: 'Agriculture',
    aliases: ['Verde Agriculture', 'VF Holdings'],
  },
  {
    accountId: 'ACC-017',
    name: 'Crestview Hotels',
    industry: 'Hospitality',
    aliases: ['Crestview Hospitality Group', 'CVH LLC'],
  },
  {
    accountId: 'ACC-018',
    name: 'Apex Retail',
    industry: 'Retail',
    aliases: ['Apex Retail Group', 'ARG Inc'],
  },
  {
    accountId: 'ACC-019',
    name: 'Northern Lights Energy',
    industry: 'Energy',
    aliases: ['NL Energy Corp', 'Northern Lights Power'],
  },
  {
    accountId: 'ACC-020',
    name: 'Valleyview Medical',
    industry: 'Healthcare',
    aliases: ['Valleyview Health Systems', 'VVM Corp'],
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
const ALL_LOCS_BEFORE_CAL = [
  ...DEMO_LOCATIONS,
  ...ALL_FLOOD_LOCATIONS,
  ...SAFE_LOCATIONS,
];

// Scale non-SE-flood locations so the fixed SE flood total remains unchanged.
const protectedLocations = ALL_LOCS_BEFORE_CAL.filter(
  (location) =>
    location.region === 'South-East' && ['A', 'AE', 'V'].includes(location.floodZone),
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

const ALL_LOCATIONS: LocDef[] = [
  ...DEMO_LOCATIONS,
  ...ALL_FLOOD_LOCATIONS,
  ...SAFE_LOCATIONS,
];

// ── ensureIndexes ─────────────────────────────────────────────────────────

export async function ensureIndexes(): Promise<void> {
  await Promise.all([
    User.syncIndexes(),
    Account.syncIndexes(),
    Policy.syncIndexes(),
    Location.syncIndexes(),
    RiskSnapshot.syncIndexes(),
    FloodLookup.syncIndexes(),
    Signal.syncIndexes(),
    DriftEvent.syncIndexes(),
    Activity.syncIndexes(),
    Decision.syncIndexes(),
    RuleVersion.syncIndexes(),
    AuditLog.syncIndexes(),
    PortfolioConfig.syncIndexes(),
  ]);
}

// ── Main seed function ────────────────────────────────────────────────────

export async function seedDb(): Promise<void> {
  // ── 1. Delete all (not in a transaction per amendment #2) ──────────────
  await Promise.all([
    User.deleteMany({}),
    Account.deleteMany({}),
    Policy.deleteMany({}),
    Location.deleteMany({}),
    RiskSnapshot.deleteMany({}),
    FloodLookup.deleteMany({}),
    Signal.deleteMany({}),
    DriftEvent.deleteMany({}),
    Activity.deleteMany({}),
    Decision.deleteMany({}),
    RuleVersion.deleteMany({}),
    // AuditLog is append-only — reset is the one administrative exception.
    mongoose.connection.collection('auditlogs').deleteMany({}),
    PortfolioConfig.deleteMany({}),
  ]);

  // ── 2. Sync indexes (amendment #2) ─────────────────────────────────────
  await ensureIndexes();

  // ── 3. Insert base data ────────────────────────────────────────────────
  await User.insertMany(USERS);
  await Account.insertMany(ACCOUNTS);
  await FloodLookup.insertMany(FLOOD_LOOKUP);

  await PortfolioConfig.insertMany([
    { key: 'floodCap_default',    value: 0.20 },
    { key: 'floodCap_South-East', value: 0.20 },
    { key: 'floodCap_North-East', value: 0.20 },
    { key: 'floodCap_Midwest',    value: 0.20 },
    { key: 'floodCap_West',       value: 0.20 },
    { key: 'activityAssigneeIdx', value: 0    }, // round-robin counter
  ]);

  // ── 4. Insert policies ─────────────────────────────────────────────────
  await Policy.insertMany(
    POLICY_DEFS.map((p) => ({
      ...p,
      product: 'Commercial Property',
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

  // ── 7. Create BIND snapshots for every policy ──────────────────────────
  const allPolicies = await Policy.find().lean();
  for (const pol of allPolicies) {
    const locs = await Location.find({ policyId: pol.policyId }).lean();
    const snapLocs: SnapshotLocation[] = locs.map((l) => ({
      locationId: l.locationId,
      addressLine: l.addressLine,
      tiv: l.tiv,
      floodZone: l.floodZone,
      floodScore: l.floodScore,
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

  await loadAndStoreRules();
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
