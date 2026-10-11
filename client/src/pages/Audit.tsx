import { useState } from 'react';
import { useAudit } from '@/hooks/useApi';

const ENTITY_TYPES = ['', 'DriftEvent', 'Activity', 'Signal', 'RiskSnapshot', 'PortfolioConfig'];
const ACTIONS = ['', 'SIGNAL_RECEIVED', 'EVENT_CREATED', 'EVENT_MERGED', 'ACTIVITY_CREATED', 'STATUS_CHANGED', 'DECISION', 'SNAPSHOT_CREATED', 'PORTFOLIO_BREACH', 'RESET_DEMO'];

export function Audit(): React.ReactElement {
  const [entityType, setEntityType] = useState('');
  const [actor, setActor] = useState('');
  const query = useAudit({ entityType: entityType || undefined, actor: actor || undefined });

  if (query.isLoading) {
    return <div className="p-6 text-sm text-gray-500">Loading audit history…</div>;
  }
  if (query.isError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          Unable to load audit history.
        </div>
      </div>
    );
  }

  const entries = query.data ?? [];

  return (
    <div className="p-5 lg:p-6 fade-in space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest text-teal-700 font-semibold">Append-only history</p>
          <h1 className="text-2xl font-semibold text-navy-950 mt-1">Audit Log</h1>
          <p className="text-sm text-gray-500 mt-1">
            Every signal, workflow transition, decision, and appetite breach. {entries.length} entries shown.
          </p>
        </div>
      </div>

      {/* Filters */}
      <section className="eds-card p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="eds-label block mb-1" htmlFor="audit-entity-type">Entity type</label>
          <select
            id="audit-entity-type"
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="text-sm border border-gray-300 rounded px-3 py-1.5 bg-white
                       focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none"
          >
            <option value="">All types</option>
            {ENTITY_TYPES.filter(Boolean).map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="eds-label block mb-1" htmlFor="audit-actor">Actor</label>
          <input
            id="audit-actor"
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            placeholder="Filter by actor…"
            className="text-sm border border-gray-300 rounded px-3 py-1.5 w-44
                       focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none"
          />
        </div>
        {(entityType || actor) && (
          <button
            type="button"
            onClick={() => { setEntityType(''); setActor(''); }}
            className="text-xs text-teal-700 hover:underline pb-1"
          >
            Clear filters
          </button>
        )}
      </section>

      {/* Table */}
      <section className="eds-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="eds-table min-w-[850px]">
            <thead>
              <tr>
                <th>Time</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => (
                <tr key={`${entry.ts}-${entry.entityId}-${entry.action}-${idx}`} className="cursor-default">
                  <td className="text-xs text-gray-500 whitespace-nowrap">
                    {new Date(entry.ts).toLocaleString('en-US', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
                    })}
                  </td>
                  <td className="text-sm">{entry.actor}</td>
                  <td>
                    <span className={`chip ${actionChipClass(entry.action)}`}>
                      {entry.action}
                    </span>
                  </td>
                  <td>
                    <div className="text-xs text-gray-500">{entry.entityType}</div>
                    <div className="font-mono text-xs text-navy-900">{entry.entityId}</div>
                  </td>
                  <td className="text-xs text-gray-600 max-w-[320px]">
                    <DetailsSummary details={entry.details} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {entries.length === 0 && (
          <div className="p-10 text-center text-sm text-gray-500">
            No audit entries match these filters. Run a scenario to generate audit history.
          </div>
        )}
      </section>
    </div>
  );
}

function actionChipClass(action: string): string {
  if (action.includes('BREACH')) return 'chip-high';
  if (action.includes('DECISION') || action.includes('ACCEPT')) return 'chip-medium';
  if (action.includes('CREATED') || action.includes('RECEIVED')) return 'chip-open';
  return 'chip-verify';
}

/** Render the most useful fields from the audit details object */
function DetailsSummary({ details }: { details: Record<string, unknown> }): React.ReactElement {
  if (!details || Object.keys(details).length === 0) {
    return <span className="text-gray-400 italic">—</span>;
  }
  const items: string[] = [];
  for (const [key, value] of Object.entries(details)) {
    if (value === null || value === undefined) continue;
    const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
    items.push(`${key}: ${str.length > 60 ? str.slice(0, 57) + '…' : str}`);
  }
  return (
    <div className="space-y-0.5">
      {items.slice(0, 3).map((item, idx) => (
        <div key={idx} className="truncate">{item}</div>
      ))}
      {items.length > 3 && <div className="text-gray-400">+{items.length - 3} more</div>}
    </div>
  );
}
