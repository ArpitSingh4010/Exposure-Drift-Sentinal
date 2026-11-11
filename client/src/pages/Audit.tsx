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

function actionBadgeClass(action: string): string {
  if (action.includes('BREACH')) return 'badge-high';
  if (action.includes('DECISION') || action.includes('ACCEPT')) return 'badge-low';
  if (action.includes('DISMISS')) return 'badge-medium';
  if (action.includes('CREATED') || action.includes('RECEIVED')) return 'badge-neutral';
  return 'badge-neutral';
}

function DetailsSummary({ details }: { details: Record<string, unknown> }): React.ReactElement {
  if (!details || Object.keys(details).length === 0) {
    return <span className="text-[#A8A8A0] italic">—</span>;
  }
  const items: string[] = [];
  for (const [key, value] of Object.entries(details)) {
    if (value === null || value === undefined) continue;
    const str = typeof value === 'object' ? JSON.stringify(value) : String(value);
    items.push(`${key}: ${str.length > 55 ? str.slice(0, 52) + '…' : str}`);
  }
  return (
    <div className="space-y-0.5 text-xs text-[#4A4A45]">
      {items.slice(0, 3).map((item, idx) => (
        <div key={idx} className="truncate">{item}</div>
      ))}
      {items.length > 3 && <div className="text-[#7A7A74] text-[10px]">+{items.length - 3} more fields</div>}
    </div>
  );
}

export function Audit(): React.ReactElement {
  const [entityType, setEntityType] = useState('');
  const [actor, setActor] = useState('');
  const query = useAudit({ entityType: entityType || undefined, actor: actor || undefined });

  if (query.isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[360px] text-[#7A7A74] space-y-2">
        <div className="spinner" />
        <p className="text-xs">Loading immutable audit ledger...</p>
      </div>
    );
  }

  if (query.isError) {
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
          Unable to load immutable audit stream.
        </div>
      </div>
    );
  }

  const entries = query.data ?? [];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[#1A1A18]">
            Immutable Audit Ledger
          </h1>
          <p className="text-xs text-[#7A7A74] mt-0.5">
            Append-only system ledger recording external signals, rule evaluations, underwriter decisions, and appetite breaches.
          </p>
        </div>

        <div className="text-right">
          <div className="text-[11px] text-[#7A7A74]">Total Records</div>
          <div className="text-lg font-semibold text-[#1A1A18] tabular-nums mt-0.5">
            {entries.length}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="panel p-4 bg-white flex flex-wrap gap-4 items-end justify-between">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block mb-1 text-xs font-medium text-[#4A4A45]" htmlFor="audit-entity-type">
              Target Entity Type
            </label>
            <select
              id="audit-entity-type"
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className="field-select text-xs"
            >
              {ENTITY_TYPES.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 text-xs font-medium text-[#4A4A45]" htmlFor="audit-actor">
              Actor Identifier
            </label>
            <input
              id="audit-actor"
              value={actor}
              onChange={(e) => setActor(e.target.value)}
              placeholder="e.g. USR-001 or system"
              className="field-input w-48 text-xs font-mono"
            />
          </div>

          {(entityType || actor) && (
            <button
              type="button"
              onClick={() => { setEntityType(''); setActor(''); }}
              className="btn btn-ghost text-xs text-[#7A7A74] hover:text-[#1A1A18]"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Audit Log Table */}
      <section className="panel overflow-hidden bg-white">
        <div className="overflow-x-auto">
          <table className="data-table min-w-[860px]">
            <thead>
              <tr>
                <th style={{ width: '160px' }}>Timestamp</th>
                <th style={{ width: '110px' }}>Actor</th>
                <th style={{ width: '140px' }}>Action</th>
                <th style={{ width: '180px' }}>Entity Reference</th>
                <th>Details Payload</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, idx) => (
                <tr key={`${entry.ts}-${entry.entityId}-${entry.action}-${idx}`}>
                  <td className="font-mono text-xs text-[#7A7A74] tabular-nums whitespace-nowrap">
                    {new Date(entry.ts).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false,
                    })}
                  </td>
                  <td>
                    <span className="font-mono text-xs font-medium text-[#1A1A18] px-1.5 py-0.5 rounded bg-[#F2F1EE]">
                      {entry.actor}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${actionBadgeClass(entry.action)} text-[10px]`}>
                      {entry.action}
                    </span>
                  </td>
                  <td>
                    <div className="text-[10px] text-[#7A7A74] uppercase tracking-wider">{entry.entityType}</div>
                    <div className="font-mono text-xs font-semibold text-[#1A1A18]">{entry.entityId}</div>
                  </td>
                  <td className="max-w-[360px]">
                    <DetailsSummary details={entry.details} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {entries.length === 0 && (
          <div className="p-12 text-center text-xs text-[#7A7A74]">
            No audit records match these criteria. Run a scenario in the Simulator to generate new audit events.
          </div>
        )}
      </section>
    </div>
  );
}
