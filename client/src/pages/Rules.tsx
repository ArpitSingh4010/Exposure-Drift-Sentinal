import React, { useState } from 'react';
import { useRules } from '@/hooks/useApi';

interface RuleCardData {
  id: string;
  simpleTitle: string;
  technicalCode: string;
  category: string;
  oneLineSummary: string;
  whatHappened: string;
  triggerCondition: string;
  points: string;
  severityText: string;
  slaTime: string;
  whyItMatters: string;
  realWorldStory: string;
  underwriterNextStep: string;
}

const EASY_RULES: RuleCardData[] = [
  {
    id: 'R1_TIV_INCREASE',
    simpleTitle: 'Total Insured Value Drift',
    technicalCode: 'R1_TIV_INCREASE',
    category: 'Valuation',
    oneLineSummary: 'Insured property or equipment valuation increased materially over bound baseline.',
    whatHappened: 'Insured business expanded facilities or installed high-value machinery without an endorsement filing.',
    triggerCondition: 'TIV increases by 10% to 25% (+3 points) or by 25%+ (+5 points). Changes under 10% are suppressed.',
    points: '+3 or +5 pts',
    severityText: 'Medium / High',
    slaTime: '2 to 5 business days',
    whyItMatters: 'If a catastrophic loss occurs, claim payout exceeds the bound premium rating basis.',
    realWorldStory: 'Tax records indicate commercial property valuation expanded from $2.8M to $4.2M (+49%).',
    underwriterNextStep: 'Endorse policy schedule with updated valuation and premium adjustment.',
  },
  {
    id: 'R2_NEW_LOCATION',
    simpleTitle: 'Unscheduled Facility Discovered',
    technicalCode: 'R2_NEW_LOCATION',
    category: 'Location Schedule',
    oneLineSummary: 'Commercial facility address detected that is not scheduled on the active policy.',
    whatHappened: 'Municipal building filings or permit records reveal a newly operating facility under the insured entity.',
    triggerCondition: 'Any verified physical address detected that is absent from the bound schedule.',
    points: '+3 pts',
    severityText: 'Medium Alert',
    slaTime: '5 business days',
    whyItMatters: 'Unvetted structures lack risk survey, construction warranties, and safety audits.',
    realWorldStory: 'Permit filings in Savannah, GA indicate a 3rd commercial warehouse at 900 Simulator Facility Way ($1.4M TIV).',
    underwriterNextStep: 'Inspect construction safety classification and endorse to policy location schedule.',
  },
  {
    id: 'R3_HIGH_FLOOD_ZONE',
    simpleTitle: 'Peril High-Risk Band Entry',
    technicalCode: 'R3_HIGH_FLOOD_ZONE / R3_HAZARD_BAND',
    category: 'Hazard Re-mapping',
    oneLineSummary: 'A location entered a high-risk peril band monitored by its specific policy product.',
    whatHappened: 'Environmental geospatial update re-mapped facility into high-hazard flood (A/AE/V), seismic, wildfire, or cyclone band.',
    triggerCondition: 'Location enters high-risk band for any hazard covered by the policy product (+5 points per hazard).',
    points: '+5 pts per peril',
    severityText: 'High Alert',
    slaTime: '2 business days',
    whyItMatters: 'Facility is exposed to severe event severity during upcoming catastrophe season.',
    realWorldStory: 'Seismic fault revision places food processing facility into very_high earthquake hazard, triggering review on CP-EQ policy.',
    underwriterNextStep: 'Verify peril sub-limits, deductible adequacy, and physical mitigation requirements.',
  },
  {
    id: 'R4_FLOOD_SCORE_WORSENED',
    simpleTitle: 'Peril Risk Score Escalation',
    technicalCode: 'R4_FLOOD_SCORE_WORSENED / R4_HAZARD_SCORE',
    category: 'Hazard Re-mapping',
    oneLineSummary: 'Hazard vulnerability score worsened by 2 or more points on 1-10 index.',
    whatHappened: 'Local terrain, coastal, or engineering data increased the peril vulnerability index by >= 2 points.',
    triggerCondition: 'Monitored hazard score increases by 2 or more points on the 1-10 index.',
    points: '+3 pts',
    severityText: 'Medium Alert',
    slaTime: '5 business days',
    whyItMatters: 'Peril vulnerability has steadily accumulated without structure modifications.',
    realWorldStory: 'Coastal erosion increased port facility storm surge vulnerability score from 4/10 to 7/10 (+3).',
    underwriterNextStep: 'Request updated engineering survey or apply supplemental terms.',
  },
  {
    id: 'R5_COMBINED_ESCALATION',
    simpleTitle: 'Compound Escalation: New Facility in High-Risk Peril',
    technicalCode: 'R5_COMBINED_ESCALATION',
    category: 'Compound Risk',
    oneLineSummary: 'Both R2 and R3 triggered: an unscheduled facility was discovered directly in a high-risk peril band.',
    whatHappened: 'The policyholder added a new facility located directly inside a designated catastrophic hazard zone.',
    triggerCondition: 'Both Unscheduled Facility (R2) AND High-Risk Peril Band (R3) evaluate positive on same policy.',
    points: 'Forces HIGH',
    severityText: 'Mandatory High Alert',
    slaTime: '2 business days (Senior UW)',
    whyItMatters: 'Unvetted property in severe catastrophe zone represents immediate solvency risk.',
    realWorldStory: 'Unreported warehouse on Savannah Highway sits directly within FEMA flood Zone AE near tidal river.',
    underwriterNextStep: 'Automatically routed to Senior Underwriter for treaty review.',
  },
  {
    id: 'R6_PORTFOLIO_BREACH',
    simpleTitle: 'Regional Portfolio Concentration Breach',
    technicalCode: 'R6_PORTFOLIO_BREACH',
    category: 'Portfolio Appetite',
    oneLineSummary: 'Regional concentration of high-risk TIV exceeds designated portfolio appetite cap.',
    whatHappened: 'Aggregate high-risk TIV in territory exceeds risk appetite threshold (e.g. 20% for flood, 25% for earthquake).',
    triggerCondition: 'Territory high-risk TIV concentration exceeds peril appetite cap (% of total $300M portfolio).',
    points: 'Portfolio Breach Flag',
    severityText: 'Appetite Restriction',
    slaTime: 'Immediate Executive Sign-off',
    whyItMatters: 'Guards carrier solvency against correlated multi-policy catastrophe events.',
    realWorldStory: 'Adding Savannah facility pushes South-East flood share from 19.70% to 20.07%, crossing 20.00% cap.',
    underwriterNextStep: 'Restricts automatic binding authority in territory without treaty exception.',
  },
];

const SEVERITY_LEVELS = [
  {
    label: 'High Priority',
    points: '5+ pts',
    badgeClass: 'badge-high',
    sla: '2 Business Days',
    desc: 'Material risk expansion or compound hazard. Immediate senior review.',
  },
  {
    label: 'Medium Priority',
    points: '3–4 pts',
    badgeClass: 'badge-medium',
    sla: '5 Business Days',
    desc: 'Moderate valuation or single hazard shift. Standard underwriting queue.',
  },
  {
    label: 'Low Priority',
    points: '1–2 pts',
    badgeClass: 'badge-low',
    sla: '10 Business Days',
    desc: 'Minor location or peril adjustment. Evaluated at renewal cycle.',
  },
  {
    label: 'Immaterial Noise',
    points: '0 pts',
    badgeClass: 'badge-neutral',
    sla: 'Suppressed',
    desc: 'Sub-threshold change (<10% TIV). Filtered without creating review activities.',
  },
];

export function Rules(): React.ReactElement {
  const query = useRules();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [showRawYaml, setShowRawYaml] = useState(false);
  const [copied, setCopied] = useState(false);

  if (query.isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[360px] text-[#7A7A74] space-y-2">
        <div className="spinner" />
        <p className="text-xs">Loading deterministic rules configuration...</p>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="p-6 max-w-5xl">
        <div
          className="p-4 text-xs space-y-2"
          style={{
            backgroundColor: 'var(--risk-high-bg)',
            border: '1px solid var(--risk-high-border)',
            color: 'var(--risk-high-text)',
            borderRadius: '4px',
          }}
        >
          Unable to load active rule configuration from server rules.yaml.
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
      ? EASY_RULES
      : EASY_RULES.filter((r) => r.category.toUpperCase().replace(/\s+/g, '_') === selectedCategory);

  const filterTabs = [
    { id: 'ALL', label: 'All Rules (6)' },
    { id: 'VALUATION', label: 'Valuation' },
    { id: 'LOCATION_SCHEDULE', label: 'Location Schedule' },
    { id: 'HAZARD_RE-MAPPING', label: 'Hazard Re-mapping' },
    { id: 'COMPOUND_RISK', label: 'Compound Risk' },
    { id: 'PORTFOLIO_APPETITE', label: 'Portfolio Appetite' },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="badge badge-low text-[10px]">
              Engine v{query.data?.version ?? '1.0.0'}
            </span>
            <span className="text-xs text-[#A8A8A0]">·</span>
            <span className="text-xs text-[#7A7A74]">Deterministic Underwriting Rules</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-[#1A1A18]">
            Deterministic Drift Rule Specifications
          </h1>
          <p className="text-xs text-[#7A7A74] mt-0.5">
            Transparent scoring criteria used by Exposure Drift Sentinel to evaluate incoming external signals and triage underwriter tickets.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="btn btn-secondary text-xs"
          >
            {showTechnicalDetails ? 'Simple View' : 'Show Technical Codes'}
          </button>

          <button
            type="button"
            onClick={() => setShowRawYaml(!showRawYaml)}
            className="btn btn-secondary text-xs"
          >
            {showRawYaml ? 'Hide YAML' : 'View YAML'}
          </button>
        </div>
      </div>

      {/* SLA & Materiality Summary Strip */}
      <div
        className="p-4 rounded bg-white"
        style={{ border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <span className="text-xs font-semibold text-[#1A1A18]">
            Materiality Scoring & SLA Thresholds
          </span>
          <span className="text-[11px] text-[#7A7A74]">
            Evaluated deterministically on signal ingestion
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-3">
          {SEVERITY_LEVELS.map((level, i) => (
            <div
              key={i}
              className="p-3 rounded space-y-1"
              style={{
                backgroundColor: 'var(--surface-raised)',
                border: '1px solid var(--border)',
              }}
            >
              <div className="flex items-center justify-between">
                <span className={`badge ${level.badgeClass} text-[10px]`}>
                  {level.label}
                </span>
                <span className="font-mono text-xs font-semibold text-[#1A1A18] tabular-nums">
                  {level.points}
                </span>
              </div>
              <div className="text-xs font-medium text-[#1A1A18] pt-1">
                SLA: {level.sla}
              </div>
              <p className="text-[11px] text-[#7A7A74] leading-normal">
                {level.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="tab-list">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`tab-item text-xs ${selectedCategory === tab.id ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Rule Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredRules.map((rule) => (
          <div
            key={rule.id}
            className="panel p-5 bg-white space-y-3.5 flex flex-col justify-between"
          >
            <div className="space-y-3">
              {/* Header: Title & Badges */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge badge-neutral text-[10px]">
                      {rule.category}
                    </span>
                    {showTechnicalDetails && (
                      <span className="font-mono text-[10px] text-[#7A7A74] px-1.5 py-0.5 rounded bg-[#F2F1EE]">
                        {rule.technicalCode}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold tracking-tight text-[#1A1A18]">
                    {rule.simpleTitle}
                  </h3>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="badge badge-low text-xs font-mono font-medium">
                    {rule.points}
                  </span>
                  <div className="text-[10px] text-[#7A7A74] mt-0.5">{rule.slaTime}</div>
                </div>
              </div>

              {/* Summary */}
              <p className="text-xs text-[#4A4A45] leading-relaxed">
                {rule.oneLineSummary}
              </p>

              {/* Trigger & Rationale Box */}
              <div
                className="p-3 rounded space-y-2 text-xs"
                style={{
                  backgroundColor: 'var(--surface-raised)',
                  border: '1px solid var(--border)',
                }}
              >
                <div>
                  <span className="text-[10px] font-semibold text-[#7A7A74] uppercase tracking-wider block">
                    Trigger Condition
                  </span>
                  <p className="text-xs text-[#1A1A18] mt-0.5">
                    {rule.triggerCondition}
                  </p>
                </div>
                <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-[10px] font-semibold text-[#7A7A74] uppercase tracking-wider block">
                    Underwriting Exposure
                  </span>
                  <p className="text-xs text-[#4A4A45] mt-0.5">
                    {rule.whyItMatters}
                  </p>
                </div>
              </div>

              {/* Case Example */}
              <div className="text-xs text-[#7A7A74] leading-relaxed">
                <span className="font-semibold text-[#4A4A45]">Exemplar: </span>
                {rule.realWorldStory}
              </div>
            </div>

            {/* Action Required */}
            <div className="pt-2.5 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--border)' }}>
              <span className="text-[#7A7A74]">Prescribed Workflow:</span>
              <span className="font-medium text-[#2D6A4F]">{rule.underwriterNextStep}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Raw YAML Viewer */}
      {showRawYaml && (
        <section className="panel overflow-hidden bg-white">
          <div
            className="px-5 py-3 flex items-center justify-between border-b"
            style={{
              backgroundColor: 'var(--surface-raised)',
              borderColor: 'var(--border)',
            }}
          >
            <span className="font-mono text-xs font-semibold text-[#1A1A18]">
              server/rules.yaml (Active Configuration File)
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="btn btn-secondary text-xs"
            >
              {copied ? 'Copied' : 'Copy YAML'}
            </button>
          </div>

          <pre
            className="p-5 font-mono text-xs text-[#1A1A18] leading-relaxed overflow-x-auto whitespace-pre-wrap"
            style={{ backgroundColor: 'var(--surface-raised)' }}
          >
            {query.data.yamlText}
          </pre>
        </section>
      )}
    </div>
  );
}
