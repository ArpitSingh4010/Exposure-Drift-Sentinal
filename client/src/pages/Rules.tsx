import React, { useState } from 'react';
import { useRules } from '@/hooks/useApi';

const RULE_DESCRIPTIONS: Record<string, { name: string; description: string; points: string; badge: string }> = {
  R1_TIV_INCREASE: {
    name: 'TIV Increase',
    description: 'Total insured value on the policy increases by a material percentage against baseline snapshot.',
    points: '10–25% -> 3 pts, >=25% -> 5 pts',
    badge: 'Exposure Growth',
  },
  R2_NEW_LOCATION: {
    name: 'New Location Discovered',
    description: 'A previously unknown commercial facility or warehouse address is added to the policy schedule.',
    points: '+3 pts',
    badge: 'Schedule Expansion',
  },
  R3_HIGH_FLOOD_ZONE: {
    name: 'High Flood Hazard Zone',
    description: 'A facility is newly in, or re-mapped into, a high-hazard FEMA flood zone (A, AE, V).',
    points: '+5 pts',
    badge: 'Catastrophe Hazard',
  },
  R4_FLOOD_SCORE_WORSENED: {
    name: 'Flood Score Worsened',
    description: 'Numerical flood risk score worsens by 2 or more points (on a 1-10 severity scale).',
    points: '+3 pts',
    badge: 'Hazard Deterioration',
  },
  R5_COMBINED_ESCALATION: {
    name: 'Combined Escalation Override',
    description: 'Both New Location (R2) and High Flood Zone (R3) fire together — unconditionally forces severity to HIGH.',
    points: 'FORCE HIGH',
    badge: 'Compound Risk',
  },
  R6_PORTFOLIO_BREACH: {
    name: 'Portfolio Concentration Breach',
    description: 'Regional aggregate flood-zone TIV share crosses the 20.00% risk appetite cap.',
    points: 'Breach Flag',
    badge: 'Appetite Gate',
  },
};

const SEVERITY_INFO = [
  { level: 'HIGH', minScore: '>= 5 pts', color: 'chip-high', sla: '2 Business Days', action: 'Review exposure and consider re-rating or treaty referral' },
  { level: 'MEDIUM', minScore: '3–4 pts', color: 'chip-medium', sla: '5 Business Days', action: 'Review at next opportunity and request information if needed' },
  { level: 'LOW', minScore: '1–2 pts', color: 'chip-low', sla: '10 Business Days', action: 'Note for policy renewal' },
];

export function Rules(): React.ReactElement {
  const query = useRules();
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

  return (
    <div className="p-6 lg:p-8 space-y-6 fade-in max-w-7xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-heading font-semibold text-slate-900 tracking-tight">
            Rules Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Deterministic underwriting thresholds and materiality scoring tiers configured in server/rules.yaml.
          </p>
        </div>

        <div className="text-right">
          <div className="text-[11px] font-medium text-slate-500 uppercase">Version SHA-256</div>
          <div className="font-mono text-xs font-semibold text-slate-800 mt-0.5 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
            {query.data.version.slice(0, 16)}...
          </div>
        </div>
      </div>

      {/* Rule Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Object.entries(RULE_DESCRIPTIONS).map(([ruleId, info]) => (
          <div
            key={ruleId}
            className="eds-card p-5 space-y-3 hover:border-teal-400 transition-all shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                  {info.badge}
                </span>
                <h3 className="font-heading font-bold text-base text-slate-900 mt-1">
                  {info.name}
                </h3>
              </div>
              <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-teal-50 text-teal-800 border border-teal-200 flex-shrink-0">
                {info.points}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {info.description}
            </p>

            <div className="pt-2 border-t border-slate-100 font-mono text-[11px] font-bold text-slate-400">
              ID: {ruleId}
            </div>
          </div>
        ))}
      </div>

      {/* Severity Tiers */}
      <section className="eds-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <h2 className="font-heading font-bold text-base text-slate-900">
            Severity Scoring Tiers & Underwriter SLAs
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sum of rule points determines the activity severity and due-date escalation window.
          </p>
        </div>

        <table className="eds-table">
          <thead>
            <tr>
              <th>Severity Tier</th>
              <th>Score Threshold</th>
              <th>Underwriter SLA</th>
              <th>Standard Guidewire PolicyCenter Action</th>
            </tr>
          </thead>
          <tbody>
            {SEVERITY_INFO.map((sev) => (
              <tr key={sev.level} className="cursor-default">
                <td>
                  <span className={`chip ${sev.color}`}>{sev.level}</span>
                </td>
                <td className="font-mono font-bold text-xs text-slate-800">
                  {sev.minScore}
                </td>
                <td className="text-xs font-semibold text-slate-700">
                  {sev.sla}
                </td>
                <td className="text-xs text-slate-700">
                  {sev.action}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Raw YAML Configuration */}
      <section className="eds-card overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="font-mono text-xs font-semibold text-slate-700">
            server/rules.yaml (Active Configuration)
          </span>
          <button
            onClick={handleCopy}
            className="px-2.5 py-1 rounded text-xs font-medium border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <pre className="p-5 font-mono text-xs text-slate-700 bg-slate-50/50 leading-relaxed overflow-x-auto whitespace-pre-wrap">
          {query.data.yamlText}
        </pre>
      </section>
    </div>
  );
}
