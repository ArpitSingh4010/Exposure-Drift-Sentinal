import React, { useState } from 'react';
import { useAudit } from '@/hooks/useApi';

const ENTITY_TYPES = [
  { value: '', label: 'All entity types' },
  { value: 'DRIFT_EVENT', label: 'Drift Event' },
  { value: 'ACTIVITY', label: 'Activity' },
  { value: 'SIGNAL', label: 'Signal' },
  { value: 'RISK_SNAPSHOT', label: 'Risk Snapshot' },
  { value: 'PORTFOLIO_CONFIG', label: 'Portfolio Config' },
];

function actionChipClass(action: string): string {
  if (action.includes('BREACH')) return 'chip-high';
  if (action.includes('DECISION') || action.includes('ACCEPT')) return 'chip-medium';
  if (action.includes('CREATED') || action.includes('RECEIVED')) return 'chip-open';
  return 'chip-verify';
}

function DetailsSummary({ details }: { details: Record<string, unknown> }): React.ReactElement {
  if (!details || Object.keys(details).length === 0) {
    return <span className="text-slate-400 italic">—</span>;
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
      {items.length > 3 && <div className="text-slate-400 text-[10px]">+{items.length - 3} more</div>}
    </div>
  );
}

export function Audit(): React.ReactElement {
  const [entityType, setEntityType] = useState('');
  const [actor, setActor] = useState('');
  const query = useAudit({ entityType: entityType || undefined, actor: actor || undefined });

  if (query.isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[400px] text-slate-500 space-y-3">
        <div className="w-6 h-6 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium">Loading immutable audit stream...</p>
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-4 text-xs font-medium">
          Unable to load audit history.
        </div>
      </div>
    );
  }

  const entries = query.data ?? [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            Immutable Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Append-only system ledger recording signals, rule evaluations, underwriter decisions, and appetite breaches.
          </p>
        </div>

        <div className="text-right">
          <div className="text-xs font-medium text-slate-500">Total records</div>
          <div className="text-xl font-semibold text-slate-900 mt-0.5">
            {entries.length}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <section className="eds-card p-4 bg-white flex flex-wrap gap-4 items-end justify-between">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block mb-1 text-xs font-medium text-slate-700" htmlFor="audit-entity-type">
              Target entity type
            </label>
            <select
              id="audit-entity-type"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className="eds-select"
            >
              {ENTITY_TYPES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 text-xs font-medium text-slate-700" htmlFor="audit-actor">
              Actor filter
            </label>
            <input
              id="audit-actor"
              value={actor}
              onChange={(e) => setActor(e.target.value)}
              placeholder="e.g. USR-001 or system"
              className="eds-input w-48"
            />
          </div>

          {(entityType || actor) && (
            <button
              type="button"
              onClick={() => { setEntityType(''); setActor(''); }}
              className="text-xs text-blue-700 hover:text-blue-900 font-medium pb-2 cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>
      </section>

      {/* Audit Log Table */}
      <section className="eds-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="eds-table min-w-[880px]">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Entity reference</th>
                <th>Details payload</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => (
                <tr key={`${entry.ts}-${entry.entityId}-${entry.action}-${idx}`}>
                  <td className="text-xs font-mono text-slate-500 whitespace-nowrap">
                    {new Date(entry.ts).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>
                  <td>
                    <span className="text-xs font-medium text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                      {entry.actor}
                    </span>
                  </td>
                  <td>
                    <span className={`chip ${actionChipClass(entry.action)}`}>
                      {entry.action}
                    </span>
                  </td>
                  <td>
                    <div className="text-[11px] text-slate-400">{entry.entityType}</div>
                    <div className="font-mono text-xs font-semibold text-slate-900">{entry.entityId}</div>
                  </td>
                  <td className="text-xs text-slate-700 max-w-[340px]">
                    <DetailsSummary details={entry.details} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {entries.length === 0 && (
          <div className="p-12 text-center text-xs text-slate-500">
            No audit records match these criteria. Run a scenario in the Simulator to produce new events.
          </div>
        )}
      </section>
    </div>
  );
}
