import React, { useState } from 'react';
import { useRules } from '@/hooks/useApi';

interface RuleSpec {
  id: string;
  name: string;
  category: 'Valuation' | 'Schedule' | 'Hazard' | 'Compound' | 'Appetite';
  badgeColor: string;
  summary: string;
  formula: string;
  parameters: Array<{ name: string; type: string; value: string }>;
  points: string;
  severityImpact: string;
  sla: string;
  example: string;
  guidewireAction: string;
}

const RULES_CATALOG: RuleSpec[] = [
  {
    id: 'R1_TIV_INCREASE',
    name: 'Total Insured Value (TIV) Growth',
    category: 'Valuation',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    summary: 'Detects significant or moderate inflationary drift in total property valuation against the active policy baseline.',
    formula: 'ΔTIV% = ((TIV_candidate - TIV_baseline) / TIV_baseline) × 100',
    parameters: [
      { name: 'Moderate Increase Tier', type: 'Range', value: '10.0% – 25.0% (+3 points)' },
      { name: 'Significant Increase Tier', type: 'Threshold', value: '≥ 25.0% (+5 points)' },
      { name: 'Immaterial Noise Floor', type: 'Cutoff', value: '< 10.0% (0 points / Suppressed)' },
    ],
    points: '+3 or +5 pts',
    severityImpact: 'Medium or High Severity',
    sla: '5 or 2 Business Days',
    example: 'Policy total TIV grows from $2,844,756 to $4,244,756 (+49.21%) → Triggers Significant tier (+5 pts).',
    guidewireAction: 'Verify building valuation schedule; recalculate premium basis or request statement of values.',
  },
  {
    id: 'R2_NEW_LOCATION',
    name: 'New Location Schedule Expansion',
    category: 'Schedule',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    summary: 'Fires when an external signal reveals a physical commercial building, warehouse, or facility not listed on the bound policy schedule.',
    formula: 'Location_ID ∉ Policy_Bound_Locations[]',
    parameters: [
      { name: 'Detection Mechanism', type: 'Diff', value: 'Permit & Tax Assessor parcel address cross-reference' },
      { name: 'Point Weight', type: 'Fixed', value: '+3 points' },
      { name: 'Default Status', type: 'State', value: 'Flagged as New Location' },
    ],
    points: '+3 pts',
    severityImpact: 'Medium Severity (or High if Combined)',
    sla: '5 Business Days',
    example: 'A 3rd facility at 900 Simulator Facility Way ($1.4M TIV) is detected via local municipal permit filings.',
    guidewireAction: 'Perform COPE (Construction, Occupancy, Protection, Exposure) inspection; bind location endorsement.',
  },
  {
    id: 'R3_HIGH_FLOOD_ZONE',
    name: 'FEMA High-Hazard Flood Zone',
    category: 'Hazard',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    summary: 'Triggered when any property is mapped into or updated to a Special Flood Hazard Area (SFHA: Zones A, AE, or V).',
    formula: 'Flood_Zone ∈ {"A", "AE", "V"}',
    parameters: [
      { name: 'High-Risk Zones', type: 'List', value: 'Zone A, Zone AE, Zone V (Coastal high-hazard)' },
      { name: 'Zone Severity Ranking', type: 'Ordering', value: 'X (Minimal) < B (Moderate) < A < AE < V' },
      { name: 'Point Weight', type: 'Fixed', value: '+5 points' },
    ],
    points: '+5 pts',
    severityImpact: 'High Severity',
    sla: '2 Business Days',
    example: 'Facility postal code 31401 re-mapped by FEMA flood revision from safe Zone X to high-hazard Zone AE (score 8).',
    guidewireAction: 'Verify flood sub-limits; ensure mandatory National Flood Insurance Program (NFIP) compliance.',
  },
  {
    id: 'R4_FLOOD_SCORE_WORSENED',
    name: 'Numerical Hazard Deterioration',
    category: 'Hazard',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    summary: 'Flags incremental environmental hazard deterioration where flood risk score increases by 2 or more points on a 1–10 scale.',
    formula: 'ΔFloodScore = (Score_candidate - Score_baseline) ≥ 2',
    parameters: [
      { name: 'Minimum Score Delta', type: 'Integer', value: '≥ 2 points' },
      { name: 'Scale Range', type: 'Integer Range', value: '1 (Lowest Risk) to 10 (Extreme Catastrophe Hazard)' },
      { name: 'Point Weight', type: 'Fixed', value: '+3 points' },
    ],
    points: '+3 pts',
    severityImpact: 'Medium Severity',
    sla: '5 Business Days',
    example: 'Coastal storm barrier degradation raises local flood vulnerability index from 3 to 6 (Δ = +3 pts).',
    guidewireAction: 'Review engineering reports and consider adding protective safeguards or higher deductibles.',
  },
  {
    id: 'R5_COMBINED_ESCALATION',
    name: 'Compound Catastrophe Risk Override',
    category: 'Compound',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    summary: 'Compound risk override rule: if a new location (R2) is added in a high-hazard flood zone (R3), immediately force severity to HIGH.',
    formula: 'Trigger(R2_NEW_LOCATION) ∧ Trigger(R3_HIGH_FLOOD_ZONE) → Force HIGH',
    parameters: [
      { name: 'Prerequisite Rules', type: 'Dependencies', value: 'R2_NEW_LOCATION AND R3_HIGH_FLOOD_ZONE' },
      { name: 'Override Severity', type: 'Enum', value: 'HIGH (Bypasses score threshold)' },
      { name: 'Senior Underwriter Gate', type: 'Flag', value: 'Routes to Senior Underwriter (USR-002)' },
    ],
    points: 'FORCE HIGH',
    severityImpact: 'Mandatory HIGH Severity',
    sla: '2 Business Days',
    example: 'New warehouse in Savannah GA is added ($1.4M TIV) in flood zone AE → R2 + R3 both trigger → Forces HIGH.',
    guidewireAction: 'Escalate to Senior Underwriter for treaty referral; re-rate policy prior to formal endorsement.',
  },
  {
    id: 'R6_PORTFOLIO_BREACH',
    name: 'Regional Appetite Concentration Breach',
    category: 'Appetite',
    badgeColor: 'bg-red-50 text-red-700 border-red-200',
    summary: 'Monitors the macro portfolio across territories against the carrier’s strict 20.00% catastrophe appetite limit.',
    formula: 'Regional_Flood_TIV / Total_Portfolio_TIV > 0.2000 (20.00%)',
    parameters: [
      { name: 'Max Appetite Cap', type: 'Percentage', value: '20.00% (Default per rules.yaml)' },
      { name: 'Monitored Territories', type: 'Regions', value: 'Midwest, North-East, South-East, West' },
      { name: 'Total Portfolio Basis', type: 'Fixed TIV', value: '$300,000,000 baseline' },
    ],
    points: 'Appetite Breach',
    severityImpact: 'Portfolio Restriction Flag',
    sla: 'Immediate Senior Sign-off',
    example: 'South-East flood TIV rises to $60.5M (20.17% of portfolio), exceeding the 20.00% cap ($59.1M).',
    guidewireAction: 'Restrict binding authority in the territory; treaty reinsurance notification required.',
  },
];

const SEVERITY_TIERS = [
  {
    level: 'HIGH',
    score: '≥ 5 Points (or R5 Override)',
    color: 'chip-high',
    sla: '2 Business Days',
    routing: 'Senior Underwriter (USR-002)',
    action: 'Review exposure immediately; re-rate policy terms or initiate treaty reinsurance referral.',
  },
  {
    level: 'MEDIUM',
    score: '3 – 4 Points',
    color: 'chip-medium',
    sla: '5 Business Days',
    routing: 'Assigned Underwriter',
    action: 'Review candidate state at next opportunity; request additional documentation if unverified.',
  },
  {
    level: 'LOW',
    score: '1 – 2 Points',
    color: 'chip-low',
    sla: '10 Business Days',
    routing: 'Assigned Underwriter',
    action: 'Record drift notes; queue for formal review during the annual policy renewal cycle.',
  },
  {
    level: 'IMMATERIAL',
    score: '0 Points',
    color: 'chip-verify',
    sla: 'None (Suppressed)',
    routing: 'System Filter',
    action: 'Suppressed as routine background noise; no Guidewire activity or ticket generated.',
  },
];

export function Rules(): React.ReactElement {
  const query = useRules();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);
  const [showRawYaml, setShowRawYaml] = useState(false);
  const [copied, setCopied] = useState(false);

  if (query.isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[400px] text-slate-500 space-y-3">
        <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Loading rules catalog...</p>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-5 shadow-sm">
          Unable to load active rule configuration.
        </div>
      </div>
    );
  }

  const handleCopy = () => {
    if (query.data?.yamlText) {
      void navigator.clipboard.writeText(query.data.yamlText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const filteredRules =
    selectedCategory === 'ALL'
      ? RULES_CATALOG
      : RULES_CATALOG.filter((r) => r.category.toUpperCase() === selectedCategory);

  const categories = ['ALL', 'VALUATION', 'SCHEDULE', 'HAZARD', 'COMPOUND', 'APPETITE'];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 fade-in max-w-7xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 uppercase tracking-wider">
              Governance & Compliance
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500 font-mono">v1.4 Deterministic</span>
          </div>
          <h1 className="text-2xl font-heading font-extrabold text-slate-900 tracking-tight mt-1">
            Underwriting Rules Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Objective, explainable materiality thresholds and scoring formulas applied to all real-world signals.
            Zero black-box models — every decision is fully auditable.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Config SHA-256
            </div>
            <div className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 mt-0.5">
              {query.data.version.slice(0, 16)}…
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all capitalize ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat === 'ALL' ? 'All Rules' : cat.toLowerCase()}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowRawYaml(!showRawYaml)}
          className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50/60 hover:bg-teal-100/60 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          {showRawYaml ? 'Hide Source YAML' : 'View Source YAML'}
        </button>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredRules.map((rule) => {
          const isExpanded = expandedRuleId === rule.id;

          return (
            <div
              key={rule.id}
              className={`eds-card p-6 space-y-4 transition-all border ${
                isExpanded ? 'border-teal-500 shadow-md ring-1 ring-teal-500/20' : 'hover:border-slate-300'
              }`}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {rule.id}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${rule.badgeColor}`}>
                      {rule.category}
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-base text-slate-900">
                    {rule.name}
                  </h3>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 block">
                    {rule.points}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">{rule.sla}</span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-600 leading-relaxed font-normal">
                {rule.summary}
              </p>

              {/* Formula & Criteria Bar */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Mathematical Trigger Formula
                </div>
                <div className="font-mono text-xs text-slate-800 font-semibold overflow-x-auto">
                  {rule.formula}
                </div>
              </div>

              {/* Example box */}
              <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-100 text-xs text-blue-900 space-y-1">
                <div className="font-bold text-[10px] uppercase text-blue-700 tracking-wider">
                  Real-World Scenario Example
                </div>
                <p className="text-slate-700 text-xs leading-normal">
                  {rule.example}
                </p>
              </div>

              {/* Collapsible Parameters Specification */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setExpandedRuleId(isExpanded ? null : rule.id)}
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-slate-900 py-1"
                >
                  <span>{isExpanded ? 'Hide Parameters & Guidewire Action' : 'View Parameters & Guidewire Action'}</span>
                  <svg
                    className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="pt-3 space-y-3 fade-in">
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Rule Threshold Parameters
                      </div>
                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white">
                        {rule.parameters.map((param, i) => (
                          <div key={i} className="flex justify-between items-center p-2 text-xs">
                            <span className="font-medium text-slate-600">{param.name}</span>
                            <span className="font-mono text-slate-900 font-bold">{param.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-emerald-50/60 border border-emerald-200 text-xs text-emerald-900">
                      <div className="font-bold text-[10px] uppercase tracking-wider text-emerald-800 mb-0.5">
                        Guidewire PolicyCenter Standard Action
                      </div>
                      <p className="text-slate-700 text-xs">
                        {rule.guidewireAction}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Severity Tiers & SLA Table */}
      <section className="eds-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <div>
            <h2 className="font-heading font-extrabold text-base text-slate-900">
              Severity Scoring Matrix & Underwriter SLAs
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Cumulative score of triggered rules maps deterministically to activity urgency and escalation deadlines.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded">
            Standard PolicyCenter SLAs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="eds-table min-w-[700px]">
            <thead>
              <tr>
                <th>Severity Tier</th>
                <th>Score Threshold</th>
                <th>SLA Due Date</th>
                <th>Assignment Routing</th>
                <th>Standard Action</th>
              </tr>
            </thead>
            <tbody>
              {SEVERITY_TIERS.map((tier) => (
                <tr key={tier.level} className="cursor-default">
                  <td>
                    <span className={`chip ${tier.color}`}>{tier.level}</span>
                  </td>
                  <td className="font-mono font-bold text-xs text-slate-800">
                    {tier.score}
                  </td>
                  <td className="text-xs font-semibold text-slate-700">
                    {tier.sla}
                  </td>
                  <td className="text-xs font-medium text-slate-600">
                    {tier.routing}
                  </td>
                  <td className="text-xs text-slate-700 max-w-sm">
                    {tier.action}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Optional Collapsible Source YAML Viewer */}
      {showRawYaml && (
        <section className="eds-card overflow-hidden slide-down">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-700">
                server/rules.yaml (Active Configuration)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                Source of Truth
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="px-3 py-1 rounded text-xs font-semibold border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
            >
              {copied ? 'Copied!' : 'Copy YAML'}
            </button>
          </div>

          <pre className="p-5 font-mono text-xs text-slate-800 bg-slate-50/70 leading-relaxed overflow-x-auto whitespace-pre-wrap">
            {query.data.yamlText}
          </pre>
        </section>
      )}
    </div>
  );
}
