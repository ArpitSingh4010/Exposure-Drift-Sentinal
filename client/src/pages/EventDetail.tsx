import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DecisionModal } from '@/components/DecisionModal';
import { SeverityChip } from '@/components/SeverityChip';
import { useEvent, useEventActions } from '@/hooks/useApi';
import type { SnapshotLocation } from '@/api/client';

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function renderHazardSummary(loc: SnapshotLocation): React.ReactNode {
  const items: string[] = [];
  if (loc.floodZone) {
    items.push(`Flood ${loc.floodZone} (score ${loc.floodScore ?? '-'})`);
  }
  if (loc.hazards) {
    for (const [hazard, reading] of Object.entries(loc.hazards)) {
      items.push(`${hazard}: ${reading.band} (${reading.score}/10)`);
    }
  }
  if (items.length === 0) return 'No hazard readings on record';
  return items.join(' · ');
}

export function EventDetail(): React.ReactElement {
  const { eventId = '' } = useParams();
  const query = useEvent(eventId);
  const actions = useEventActions();
  const [modal, setModal] = useState<'ACCEPT' | 'DISMISS' | 'REQUEST_INFO' | null>(null);
  const [actionError, setActionError] = useState('');
  const event = query.data;

  if (query.isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[360px] text-[#7A7A74] space-y-2">
        <div className="spinner" />
        <p className="text-xs">Loading event investigation workspace...</p>
      </div>
    );
  }

  if (query.isError || !event) {
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
          <div>Unable to find drift event <span className="font-mono font-semibold">{eventId}</span>.</div>
          <Link to="/desktop" className="text-[#2D6A4F] hover:underline font-medium block">
            Return to review queue
          </Link>
        </div>
      </div>
    );
  }

  const canStartReview = event.status === 'NEW' || event.status === 'ACTIVITY_CREATED';
  const canDecide = event.status === 'IN_REVIEW';
  const canReopen = event.status === 'INFO_REQUESTED';

  const confirmDecision = (body: {
    action: 'ACCEPT' | 'DISMISS' | 'REQUEST_INFO';
    reasonCode?: string;
    note: string;
  }) => {
    setActionError('');
    actions.decide.mutate(
      { eventId, body },
      {
        onSuccess: () => setModal(null),
        onError: (error) => setActionError(error.message),
      },
    );
  };

  const tivDelta = event.after.totalTiv - event.before.totalTiv;
  const tivPct =
    event.before.totalTiv > 0
      ? ((tivDelta / event.before.totalTiv) * 100).toFixed(1)
      : '0';

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#7A7A74]">
        <Link to="/desktop" className="hover:text-[#1A1A18] transition-colors">
          Review Queue
        </Link>
        <span>/</span>
        <span className="font-mono text-[#1A1A18] font-medium">{event.eventId}</span>
      </nav>

      {/* Investigation Header */}
      <div className="panel p-5 bg-white flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-semibold tracking-tight text-[#1A1A18]">
              {event.policyId}
            </h1>
            <SeverityChip severity={event.severity} />
            <span className="badge badge-neutral uppercase tracking-wider text-[10px]">
              {event.status.replace(/_/g, ' ')}
            </span>
            {event.portfolioBreach && (
              <span className="badge badge-high">
                Appetite Breach
              </span>
            )}
          </div>
          <p className="text-xs text-[#7A7A74] flex items-center gap-3">
            <span>Event: <strong className="font-mono text-[#4A4A45]">{event.eventId}</strong></span>
            <span>·</span>
            <span>Rule Engine: <span className="font-mono text-[#4A4A45]">{event.ruleVersion.slice(0, 8)}</span></span>
          </p>
        </div>

        {/* Confidence metric indicator */}
        <div
          className="px-4 py-2.5 text-right rounded"
          style={{
            backgroundColor: 'var(--surface-raised)',
            border: '1px solid var(--border)',
            minWidth: '130px',
          }}
        >
          <div className="text-[11px] font-medium text-[#7A7A74]">Match Confidence</div>
          <div className="text-lg font-semibold tracking-tight text-[#1A1A18] tabular-nums mt-0.5">
            {Math.round(event.confidence * 100)}%
          </div>
        </div>
      </div>

      {/* Notice Banners */}
      {event.portfolioBreach && (
        <div
          className="p-3.5 text-xs flex items-center justify-between"
          style={{
            backgroundColor: 'var(--risk-high-bg)',
            border: '1px solid var(--risk-high-border)',
            color: 'var(--risk-high-text)',
            borderRadius: '4px',
          }}
        >
          <div>
            <strong>Portfolio Appetite Breach:</strong> This drift change elevates regional hazard exposure beyond the established portfolio concentration cap.
          </div>
          <Link to="/portfolio" className="text-[11px] font-semibold underline hover:no-underline ml-4 whitespace-nowrap">
            Inspect Portfolio
          </Link>
        </div>
      )}

      {event.verifyFirst && (
        <div
          className="p-3.5 text-xs"
          style={{
            backgroundColor: 'var(--risk-med-bg)',
            border: '1px solid var(--risk-med-border)',
            color: 'var(--risk-med-text)',
            borderRadius: '4px',
          }}
        >
          <strong>Verify Match Before Review:</strong> Entity resolution confidence is below 75%. Confirm insured legal entity and geographic coordinates prior to accepting this snapshot.
        </div>
      )}

      {/* Main Grid: Comparison & Deterministic Rules (Left) + Action Terminal (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.6fr] gap-6 items-start">
        <div className="space-y-6">
          {/* Side-by-Side Comparison */}
          <section className="panel overflow-hidden bg-white">
            <div
              className="px-5 py-3 flex items-center justify-between"
              style={{
                backgroundColor: 'var(--surface-raised)',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div>
                <h2 className="text-xs font-semibold tracking-tight text-[#1A1A18]">
                  Risk Snapshot Comparison
                </h2>
                <p className="text-[11px] text-[#7A7A74]">
                  Bound baseline record vs. Ingested candidate state
                </p>
              </div>

              {tivDelta > 0 ? (
                <span className="badge badge-medium tabular-nums font-medium">
                  +{formatMoney(tivDelta)} (+{tivPct}%)
                </span>
              ) : tivDelta < 0 ? (
                <span className="badge badge-low tabular-nums font-medium">
                  {formatMoney(tivDelta)} ({tivPct}%)
                </span>
              ) : (
                <span className="badge badge-neutral text-[10px]">
                  Valuation unchanged (hazard shift only)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x" style={{ borderColor: 'var(--border)' }}>
              {/* Baseline (Before) */}
              <div className="p-5 space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-xs font-semibold text-[#4A4A45]">Baseline (Bound)</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F2F1EE] text-[#4A4A45]">
                    LATEST_BOUND
                  </span>
                </div>

                <div>
                  <div className="text-[11px] font-medium text-[#7A7A74]">Total Insured Value</div>
                  <div className="text-lg font-semibold text-[#1A1A18] tabular-nums mt-0.5">
                    {formatMoney(event.before.totalTiv)}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="text-[11px] font-medium text-[#7A7A74] flex justify-between">
                    <span>Locations ({event.before.locations.length})</span>
                  </div>
                  {event.before.locations.map((loc) => (
                    <div
                      key={loc.locationId}
                      className="p-3 rounded space-y-1"
                      style={{
                        backgroundColor: 'var(--surface-raised)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-[#1A1A18]">{loc.addressLine}</span>
                        <span className="font-mono text-[#7A7A74] text-[10px]">{loc.locationId}</span>
                      </div>
                      <div className="text-[11px] text-[#7A7A74]">
                        {renderHazardSummary(loc)}
                      </div>
                      <div className="text-xs font-medium text-[#1A1A18] tabular-nums pt-0.5">
                        {formatMoney(loc.tiv)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Candidate (After) */}
              <div className="p-5 space-y-3.5" style={{ backgroundColor: 'var(--surface-raised)' }}>
                <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-xs font-semibold text-[#1A1A18]">Candidate (Proposed)</span>
                  <span className="badge badge-low text-[10px]">
                    SIGNAL_PROPOSED
                  </span>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-[#7A7A74]">Candidate Total TIV</span>
                    {tivDelta === 0 && (
                      <span className="text-[10px] text-[#7A7A74]">No valuation drift</span>
                    )}
                  </div>
                  <div className="text-lg font-semibold text-[#1A1A18] tabular-nums mt-0.5">
                    {formatMoney(event.after.totalTiv)}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="text-[11px] font-medium text-[#7A7A74]">
                    Locations ({event.after.locations.length})
                  </div>
                  {event.after.locations.map((loc) => {
                    const beforeLoc = event.before.locations.find((b) => b.locationId === loc.locationId);
                    const isNew = !beforeLoc;
                    const isTivChanged = beforeLoc && beforeLoc.tiv !== loc.tiv;
                    const isHazardChanged = beforeLoc && (
                      beforeLoc.floodZone !== loc.floodZone ||
                      beforeLoc.floodScore !== loc.floodScore ||
                      JSON.stringify(beforeLoc.hazards) !== JSON.stringify(loc.hazards)
                    );

                    return (
                      <div
                        key={loc.locationId}
                        className="p-3 rounded space-y-1 bg-white"
                        style={{
                          border: isNew
                            ? '1px solid var(--green-border)'
                            : isTivChanged || isHazardChanged
                              ? '1px solid var(--risk-med-border)'
                              : '1px solid var(--border)',
                          backgroundColor: isNew
                            ? 'var(--green-subtle)'
                            : isTivChanged || isHazardChanged
                              ? 'var(--risk-med-bg)'
                              : '#ffffff',
                        }}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-[#1A1A18]">{loc.addressLine}</span>
                          <div className="flex items-center gap-1.5">
                            {isNew && (
                              <span className="badge badge-low text-[10px]">
                                New Location
                              </span>
                            )}
                            {isHazardChanged && (
                              <span className="badge badge-medium text-[10px]">
                                Hazard Shift
                              </span>
                            )}
                            {isTivChanged && (
                              <span className="badge badge-neutral text-[10px]">
                                TIV Drift
                              </span>
                            )}
                            <span className="font-mono text-[#7A7A74] text-[10px]">{loc.locationId}</span>
                          </div>
                        </div>
                        <div className="text-[11px] text-[#7A7A74]">
                          {renderHazardSummary(loc)}
                        </div>
                        <div className="text-xs font-semibold text-[#1A1A18] tabular-nums pt-0.5">
                          {formatMoney(loc.tiv)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Rule Breakdown Section */}
          <section className="panel overflow-hidden bg-white">
            <div
              className="px-5 py-3 flex items-center justify-between"
              style={{
                backgroundColor: 'var(--surface-raised)',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div>
                <h2 className="text-xs font-semibold tracking-tight text-[#1A1A18]">
                  Deterministic Rule Receipts
                </h2>
                <p className="text-[11px] text-[#7A7A74]">
                  Evaluated deterministically against server rules.yaml
                </p>
              </div>
              <span className="badge badge-neutral font-mono font-medium text-xs">
                Score: {event.score} pts
              </span>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>Rule ID</th>
                  <th style={{ width: '90px' }}>Impact</th>
                  <th>Evaluation Detail</th>
                </tr>
              </thead>
              <tbody>
                {event.ruleBreakdown.map((rule) => (
                  <tr key={rule.ruleId}>
                    <td className="font-mono text-xs font-medium text-[#1A1A18]">
                      {rule.ruleId}
                    </td>
                    <td className="font-medium text-[#2D6A4F] tabular-nums">
                      +{rule.points} pts
                    </td>
                    <td className="text-xs text-[#4A4A45] leading-relaxed">
                      {rule.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Underwriting assessment block */}
            <div
              className="p-5 space-y-2 border-t"
              style={{
                backgroundColor: 'var(--surface-raised)',
                borderColor: 'var(--border)',
              }}
            >
              <div className="text-[11px] font-semibold text-[#4A4A45] uppercase tracking-wider">
                Underwriting Assessment
              </div>
              <p className="text-xs text-[#4A4A45] leading-relaxed">
                {event.whyItMatters}
              </p>
              <div className="text-xs text-[#7A7A74] pt-1">
                Recommended Action: <strong className="text-[#1A1A18] font-medium">{event.recommendedAction}</strong>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Actions Terminal */}
        <aside className="space-y-6">
          <section className="panel p-5 bg-white space-y-4 sticky top-6">
            <div className="pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="text-[11px] font-medium text-[#7A7A74] uppercase tracking-wider">
                Action Terminal
              </div>
              <h3 className="text-sm font-semibold tracking-tight text-[#1A1A18] mt-1">
                Underwriting Decision
              </h3>
              <p className="text-xs text-[#7A7A74] mt-0.5">
                Current status: <strong className="text-[#1A1A18] font-medium capitalize">{event.status.replace(/_/g, ' ').toLowerCase()}</strong>
              </p>
            </div>

            <div className="space-y-2">
              {canStartReview && (
                <button
                  type="button"
                  onClick={() => actions.review.mutate(eventId)}
                  disabled={actions.review.isPending}
                  className="btn btn-primary w-full justify-center text-xs"
                >
                  {actions.review.isPending ? 'Starting Review...' : 'Open & Start Review'}
                </button>
              )}

              {canDecide && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setModal('ACCEPT')}
                    className="btn btn-primary w-full justify-center text-xs"
                  >
                    Accept Exposure (Create Snapshot)
                  </button>

                  <button
                    type="button"
                    onClick={() => setModal('REQUEST_INFO')}
                    className="btn btn-secondary w-full justify-center text-xs"
                  >
                    Request Information
                  </button>

                  <button
                    type="button"
                    onClick={() => setModal('DISMISS')}
                    className="btn btn-ghost w-full justify-center text-xs text-[#7A7A74] hover:text-[#B42318]"
                  >
                    Dismiss Event
                  </button>
                </div>
              )}

              {canReopen && (
                <button
                  type="button"
                  onClick={() => actions.reopen.mutate(eventId)}
                  disabled={actions.reopen.isPending}
                  className="btn btn-primary w-full justify-center text-xs"
                >
                  {actions.reopen.isPending ? 'Reopening...' : 'Reopen In-Review'}
                </button>
              )}

              {event.status === 'CLOSED' && (
                <div
                  className="p-3 text-center text-xs text-[#7A7A74] rounded"
                  style={{
                    backgroundColor: 'var(--surface-raised)',
                    border: '1px solid var(--border)',
                  }}
                >
                  Event closed and recorded in audit ledger.
                </div>
              )}
            </div>

            {(actions.review.error || actions.reopen.error || actions.decide.error) && (
              <div
                className="p-3 text-xs leading-relaxed rounded"
                style={{
                  backgroundColor: 'var(--risk-high-bg)',
                  color: 'var(--risk-high-text)',
                  border: '1px solid var(--risk-high-border)',
                }}
              >
                {(actions.review.error || actions.reopen.error || actions.decide.error)?.message}
              </div>
            )}

            {/* Signal Evidence metadata */}
            <div className="pt-3 border-t space-y-2 text-xs" style={{ borderColor: 'var(--border)' }}>
              <div className="text-[11px] font-medium text-[#7A7A74] uppercase tracking-wider mb-1">
                Signal Evidence
              </div>
              <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--border)' }}>
                <span className="text-[#7A7A74]">Ingested Signals</span>
                <span className="font-mono text-[#1A1A18] font-medium">{event.signalIds.length} source records</span>
              </div>
              <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--border)' }}>
                <span className="text-[#7A7A74]">Severity</span>
                <span className="font-medium text-[#1A1A18]">{event.severity}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#7A7A74]">Portfolio Status</span>
                <span className={`font-medium ${event.portfolioBreach ? 'text-[#B42318]' : 'text-[#2D6A4F]'}`}>
                  {event.portfolioBreach ? 'Cap Breach' : 'Within Cap'}
                </span>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {modal && (
        <DecisionModal
          action={modal}
          busy={actions.decide.isPending}
          error={actionError}
          onCancel={() => setModal(null)}
          onConfirm={confirmDecision}
        />
      )}
    </div>
  );
}
