import React, { useState } from 'react';
import { useRules } from '@/hooks/useApi';

interface RuleCardData {
  id: string;
  simpleTitle: string;
  technicalCode: string;
  category: 'Property Value' | 'New Building' | 'Flood Hazard' | 'Combined Risk' | 'Company Limit';
  categoryColor: string;
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
    simpleTitle: 'Property Value Jump',
    technicalCode: 'R1_TIV_INCREASE',
    category: 'Property Value',
    categoryColor: 'bg-blue-100 text-blue-800 border-blue-200',
    oneLineSummary: 'The insured building or equipment became significantly more valuable than the policy states.',
    whatHappened: 'The business bought expensive equipment or expanded, so its property is now worth way more than what they initially told the insurance company.',
    triggerCondition: 'Value goes up by 10% to 25% (+3 points) or by 25%+ (+5 points). Changes under 10% are ignored as normal inflation.',
    points: '+3 or +5 points',
    severityText: 'Medium or High Alert',
    slaTime: 'Review in 2 to 5 days',
    whyItMatters: 'If a fire destroys the building today, the payout will be millions higher than what the company paid premiums for.',
    realWorldStory: 'Northwind Fabrication bought new robotic laser cutters. Tax records show their property value jumped from $2.8M to $4.2M (+49%).',
    underwriterNextStep: 'The underwriter updates the policy valuation and recalculates the premium so the customer is properly insured.',
  },
  {
    id: 'R2_NEW_LOCATION',
    simpleTitle: 'Unreported New Building',
    technicalCode: 'R2_NEW_LOCATION',
    category: 'New Building',
    categoryColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    oneLineSummary: 'A new facility or warehouse was discovered that isn’t listed on the insurance policy.',
    whatHappened: 'Public records (like building permits or property tax filings) reveal the company opened a new building, but forgot to tell their insurer.',
    triggerCondition: 'Any physical building address detected that is not on the bound policy location schedule.',
    points: '+3 points',
    severityText: 'Medium Alert',
    slaTime: 'Review in 5 days',
    whyItMatters: 'If an explosion or accident happens at this secret building, nobody knows what safety measures or hazards exist there.',
    realWorldStory: 'Permit filings in Savannah, GA show the policyholder just built a 3rd commercial warehouse at 900 Simulator Facility Way ($1.4M value).',
    underwriterNextStep: 'The underwriter inspects the building specs, confirms construction safety, and formally adds it to the policy.',
  },
  {
    id: 'R3_HIGH_FLOOD_ZONE',
    simpleTitle: 'Danger Flood Zone Mapped',
    technicalCode: 'R3_HIGH_FLOOD_ZONE',
    category: 'Flood Hazard',
    categoryColor: 'bg-purple-100 text-purple-800 border-purple-200',
    oneLineSummary: 'Government maps updated: the building is now located in a severe flood danger zone.',
    whatHappened: 'FEMA updated local flood maps, and the building moved from safe dry ground into a dangerous 100-year floodplain.',
    triggerCondition: 'Location is placed in high-hazard flood zones (Zone A, Zone AE, or coastal Zone V).',
    points: '+5 points',
    severityText: 'High Alert',
    slaTime: 'Review in 2 days',
    whyItMatters: 'The building is now at extreme risk of drowning in the next hurricane or heavy rainfall season.',
    realWorldStory: 'A warehouse originally sat in safe Zone X (dry ground). FEMA revised the river basin boundaries, and it is now inside dangerous Zone AE.',
    underwriterNextStep: 'The underwriter checks flood coverage limits, adds flood deductibles, and ensures required storm protections.',
  },
  {
    id: 'R4_FLOOD_SCORE_WORSENED',
    simpleTitle: 'Flood Risk Score Got Worse',
    technicalCode: 'R4_FLOOD_SCORE_WORSENED',
    category: 'Flood Hazard',
    categoryColor: 'bg-amber-100 text-amber-800 border-amber-200',
    oneLineSummary: 'Environmental risk worsened by 2 or more points on a 1–10 hazard scale.',
    whatHappened: 'Local conditions (like sea level rise or damaged seawalls) made the building more vulnerable to storm surge than when the policy was sold.',
    triggerCondition: 'The property’s flood risk score increases by 2 or more points on a 1 (safest) to 10 (most dangerous) scale.',
    points: '+3 points',
    severityText: 'Medium Alert',
    slaTime: 'Review in 5 days',
    whyItMatters: 'The risk has quietly crept upward since the policy started without any changes to the building itself.',
    realWorldStory: 'Coastal erosion removed nearby sand dunes, increasing the warehouse’s flood hazard score from 4/10 to 7/10.',
    underwriterNextStep: 'The underwriter requests an updated flood risk survey or requires storm barrier improvements.',
  },
  {
    id: 'R5_COMBINED_ESCALATION',
    simpleTitle: 'Double Trouble: New Building in Flood Zone',
    technicalCode: 'R5_COMBINED_ESCALATION',
    category: 'Combined Risk',
    categoryColor: 'bg-rose-100 text-rose-800 border-rose-200',
    oneLineSummary: 'Both Rule 2 and Rule 3 happened: an uninspected new building was placed in a severe flood zone!',
    whatHappened: 'This is the most dangerous combination: the customer added a brand-new facility, AND it sits directly in high-hazard flood waters.',
    triggerCondition: 'Both "New Location" (R2) AND "Danger Flood Zone" (R3) trigger on the same policy.',
    points: 'FORCES HIGH PRIORITY',
    severityText: 'Mandatory High Alert',
    slaTime: 'Urgent: 2 days (Senior Underwriter)',
    whyItMatters: 'A brand-new, unvetted property in harm’s way is a catastrophic risk for claims.',
    realWorldStory: 'The customer built a new warehouse on Savannah Highway, and it is situated directly inside flood Zone AE near the river.',
    underwriterNextStep: 'Automatically routed to Marcus Williams (Senior Underwriter) for urgent treaty review before claims happen.',
  },
  {
    id: 'R6_PORTFOLIO_BREACH',
    simpleTitle: 'Company Safe Limit Exceeded',
    technicalCode: 'R6_PORTFOLIO_BREACH',
    category: 'Company Limit',
    categoryColor: 'bg-red-100 text-red-800 border-red-200',
    oneLineSummary: 'The insurance company has too many flood-prone buildings in one region (exceeding 20%).',
    whatHappened: 'An insurer cannot put all its eggs in one basket. If too many insured buildings are concentrated in one coastal region, a single hurricane could bankrupt the insurer.',
    triggerCondition: 'Regional flood-zone property value exceeds 20.00% of the company’s entire national portfolio ($300M total).',
    points: 'Red Warning Flag',
    severityText: 'Portfolio Restriction',
    slaTime: 'Immediate Senior Sign-off',
    whyItMatters: 'Solvency and financial protection. Keeps the company safe against catastrophic storm events.',
    realWorldStory: 'So many coastal policies exist in Florida/Georgia that adding one more warehouse pushes the South-East region past its 20% safety cap.',
    underwriterNextStep: 'A red warning banner locks the region; no new policies can be bound in that territory without executive approval.',
  },
];

const SIMPLE_SEVERITY_LEVELS = [
  {
    badge: 'High Priority (5+ points)',
    chipClass: 'chip-high',
    sla: 'Within 2 Business Days',
    meaning: 'Big risk change. Requires immediate attention and may escalate to a Senior Underwriter.',
  },
  {
    badge: 'Medium Priority (3–4 points)',
    chipClass: 'chip-medium',
    sla: 'Within 5 Business Days',
    meaning: 'Moderate change. Underwriter reviews it during their normal weekly review queue.',
  },
  {
    badge: 'Low Priority (1–2 points)',
    chipClass: 'chip-low',
    sla: 'Within 10 Business Days',
    meaning: 'Minor detail. Noted on the policy and checked during next year’s annual renewal.',
  },
  {
    badge: 'Ignored (0 points)',
    chipClass: 'chip-verify',
    sla: 'No action needed',
    meaning: 'Tiny change (under 10%). Filtered out as background noise so underwriters aren’t spammed.',
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
      ? EASY_RULES
      : EASY_RULES.filter((r) => r.category.toUpperCase().replace(/\s+/g, '_') === selectedCategory);

  const filterTabs = [
    { id: 'ALL', label: 'All 6 Rules' },
    { id: 'PROPERTY_VALUE', label: 'Property Value' },
    { id: 'NEW_BUILDING', label: 'New Buildings' },
    { id: 'FLOOD_HAZARD', label: 'Flood Hazard' },
    { id: 'COMBINED_RISK', label: 'Double Trouble' },
    { id: 'COMPANY_LIMIT', label: 'Company Safety Limits' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 fade-in max-w-7xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
              Plain English Guide
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500">How Sentinel Detects Risk</span>
          </div>
          <h1 className="text-2xl font-heading font-extrabold text-slate-900 tracking-tight mt-1">
            How the Rules Work
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            When a business changes in the real world, Sentinel checks these 6 simple rules to decide if an underwriter needs to be alerted.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
          >
            {showTechnicalDetails ? '👀 Simple View' : '⚙️ Show Technical Codes'}
          </button>

          <button
            type="button"
            onClick={() => setShowRawYaml(!showRawYaml)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 transition-colors"
          >
            {showRawYaml ? 'Hide YAML' : 'View YAML'}
          </button>
        </div>
      </div>

      {/* 30-Second Scoring Explainer Bar */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-navy-950 text-white shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">💡</span>
            <h2 className="font-heading font-bold text-sm text-white">
              How Scoring Works (In 30 Seconds)
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-medium hidden sm:block">
            Rules add points $\rightarrow$ Points determine urgency
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {SIMPLE_SEVERITY_LEVELS.map((level, i) => (
            <div key={i} className="p-3 rounded-xl bg-white/10 border border-white/10 space-y-1">
              <div className="flex items-center justify-between">
                <span className={`chip ${level.chipClass} text-[10px]`}>
                  {level.badge}
                </span>
              </div>
              <div className="text-[11px] font-bold text-teal-300">{level.sla}</div>
              <p className="text-[11px] text-slate-300 leading-normal font-normal">
                {level.meaning}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === tab.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 6 Easy-to-Understand Rule Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredRules.map((rule) => (
          <div
            key={rule.id}
            className="eds-card p-6 space-y-4 hover:border-teal-400 transition-all shadow-sm"
          >
            {/* Title & Badge */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${rule.categoryColor}`}>
                    {rule.category}
                  </span>
                  {showTechnicalDetails && (
                    <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                      {rule.technicalCode}
                    </span>
                  )}
                </div>
                <h3 className="font-heading font-extrabold text-base text-slate-900">
                  {rule.simpleTitle}
                </h3>
              </div>

              <div className="text-right flex-shrink-0">
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 block">
                  {rule.points}
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">{rule.slaTime}</span>
              </div>
            </div>

            {/* Quick summary */}
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              {rule.oneLineSummary}
            </p>

            {/* What happened & Why it matters in simple 2-box grid */}
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <span>❓</span> When does this trigger?
                </div>
                <p className="text-xs text-slate-700 leading-normal font-normal">
                  {rule.triggerCondition}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/70 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                  <span>⚠️</span> Why does the insurer care?
                </div>
                <p className="text-xs text-amber-900 leading-normal font-normal">
                  {rule.whyItMatters}
                </p>
              </div>
            </div>

            {/* Real World Example Story */}
            <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-200/70 space-y-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1">
                <span>📖</span> Real-World Example
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-normal">
                {rule.realWorldStory}
              </p>
            </div>

            {/* What the Underwriter does */}
            <div className="pt-2 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-600">
              <span className="text-teal-600 font-bold">Action:</span>
              <span className="text-slate-700">{rule.underwriterNextStep}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Raw YAML Viewer (Collapsible) */}
      {showRawYaml && (
        <section className="eds-card overflow-hidden slide-down">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-slate-700">
              server/rules.yaml (Active Configuration File)
            </span>
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
