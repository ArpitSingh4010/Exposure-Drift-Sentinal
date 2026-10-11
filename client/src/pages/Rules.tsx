import { useRules } from '@/hooks/useApi';

/** Descriptions for each rule ID — displayed alongside the raw YAML */
const RULE_DESCRIPTIONS: Record<string, { name: string; description: string; points: string }> = {
  R1_TIV_INCREASE: {
    name: 'TIV Increase',
    description: 'Total insured value on the policy increases by a material percentage.',
    points: '10–25% → 3 pts, ≥25% → 5 pts',
  },
  R2_NEW_LOCATION: {
    name: 'New Location',
    description: 'A previously unknown insured location is added to the policy.',
    points: '3 pts',
  },
  R3_HIGH_FLOOD_ZONE: {
    name: 'High Flood Zone',
    description: 'A location is newly in, or worsened into, a high-risk flood zone (A, AE, V).',
    points: '5 pts',
  },
  R4_FLOOD_SCORE_WORSENED: {
    name: 'Flood Score Worsened',
    description: 'Flood hazard score increases by 2 or more points.',
    points: '3 pts',
  },
  R5_COMBINED_ESCALATION: {
    name: 'Combined Escalation',
    description: 'Both a new location (R2) and a high flood zone (R3) fire together — forces severity to HIGH.',
    points: 'Force HIGH',
  },
  R6_PORTFOLIO_BREACH: {
    name: 'Portfolio Breach',
    description: 'Regional flood-zone TIV share exceeds the appetite cap. Evaluated by portfolio service.',
    points: 'Flag only',
  },
};

const SEVERITY_INFO = [
  { level: 'HIGH', minScore: '≥5', color: 'chip-high', action: 'Review exposure and consider re-rating or referral' },
  { level: 'MEDIUM', minScore: '3–4', color: 'chip-medium', action: 'Review at next opportunity and request information if needed' },
  { level: 'LOW', minScore: '1–2', color: 'chip-low', action: 'Note for renewal' },
];

export function Rules(): React.ReactElement {
  const query = useRules();

  if (query.isLoading) {
    return <div className="p-6 text-sm text-gray-500">Loading active rules…</div>;
  }
  if (query.isError || !query.data) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          Unable to load rules.
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 lg:p-6 fade-in space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest text-teal-700 font-semibold">Deterministic decision logic</p>
          <h1 className="text-2xl font-semibold text-navy-950 mt-1">Active Rules</h1>
          <p className="text-sm text-gray-500 mt-1">
            Read-only configuration loaded by the server at startup. All thresholds and scoring weights live here — no
            magic numbers in application code.
          </p>
        </div>
        <div className="text-right">
          <div className="eds-label">Content hash</div>
          <div className="font-mono text-xs text-navy-900 mt-1 bg-gray-100 px-2 py-1 rounded">
            {query.data.version.slice(0, 16)}…
          </div>
        </div>
      </div>

      {/* Rule cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {Object.entries(RULE_DESCRIPTIONS).map(([ruleId, info]) => (
          <div key={ruleId} className="eds-card p-4 hover:shadow-card-hover transition-shadow">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-mono text-xs text-teal-700 font-semibold">{ruleId}</div>
                <div className="text-sm font-semibold text-navy-950 mt-1">{info.name}</div>
              </div>
              <span className="chip chip-open text-xs flex-shrink-0">{info.points}</span>
            </div>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed">{info.description}</p>
          </div>
        ))}
      </section>

      {/* Severity mapping */}
      <section className="eds-card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Severity mapping</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Total score → severity → recommended action. R5 can force HIGH regardless of score.
          </p>
        </div>
        <table className="eds-table">
          <thead>
            <tr>
              <th>Severity</th>
              <th>Score range</th>
              <th>Recommended action</th>
            </tr>
          </thead>
          <tbody>
            {SEVERITY_INFO.map((sev) => (
              <tr key={sev.level} className="cursor-default">
                <td><span className={`chip ${sev.color}`}>{sev.level}</span></td>
                <td className="font-mono text-sm">{sev.minScore}</td>
                <td className="text-gray-700">{sev.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Raw YAML */}
      <section className="eds-card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Raw rules.yaml</h2>
          <span className="text-xs text-gray-500">Version {query.data.version.slice(0, 12)}</span>
        </div>
        <pre className="p-5 overflow-x-auto text-xs leading-6 font-mono text-gray-800 whitespace-pre-wrap bg-gray-50/50">
          {query.data.yamlText}
        </pre>
      </section>
    </div>
  );
}
