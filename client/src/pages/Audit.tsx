import React, { useState } from 'react';
import { useAudit } from '@/hooks/useApi';

const ENTITY_TYPES = ['', 'DriftEvent', 'Activity', 'Signal', 'RiskSnapshot', 'PortfolioConfig'];

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
        <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Loading immutable audit stream...</p>
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-5 shadow-sm">
          Unable to load audit history.
        </div>
      </div>
    );
  }

  const entries = query.data ?? [];

  return (
    <div className="p-6 lg:p-8 space-y-6 fade-in max-w-7xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-heading font-semibold text-slate-900 tracking-tight">
            Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            System record of signal ingests, rule evaluations, underwriter decisions, and appetite breaches.
          </p>
        </div>

        <div className="text-right">
          <div className="text-[11px] font-medium text-slate-500 uppercase">Total Entries</div>
          <div className="text-2xl font-heading font-semibold text-slate-900">
            {entries.length}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <section className="eds-card p-5 bg-white flex flex-wrap gap-4 items-end justify-between">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="eds-label block mb-1 text-[11px]" htmlFor="audit-entity-type">
              Target Entity Type
            </label>
            <select
              id="audit-entity-type"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className="text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white focus:border-teal-500 outline-none"
            >
              <option value="">All Entity Types</option>
              {ENTITY_TYPES.filter(Boolean).map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="eds-label block mb-1 text-[11px]" htmlFor="audit-actor">
              Actor Filter
            </label>
            <input
              id="audit-actor"
              value={actor}
              onChange={(e) => setActor(e.target.value)}
              placeholder="e.g. USR-001 or system"
              className="text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg px-3 py-2 w-48 bg-slate-50 focus:bg-white focus:border-teal-500 outline-none"
            />
          </div>

          {(entityType || actor) && (
            <button
              type="button"
              onClick={() => { setEntityType(''); setActor(''); }}
              className="text-xs font-bold text-teal-700 hover:text-teal-900 pb-2"
            >
              Reset Filters
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
                <th>Entity Reference</th>
                <th>Details Payload</th>
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
                    <span className="font-semibold text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                      {entry.actor}
                    </span>
                  </td>
                  <td>
                    <span className={`chip ${actionChipClass(entry.action)}`}>
                      {entry.action}
                    </span>
                  </td>
                  <td>
                    <div className="text-[11px] text-slate-400 font-semibold">{entry.entityType}</div>
                    <div className="font-mono text-xs font-bold text-navy-950">{entry.entityId}</div>
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
