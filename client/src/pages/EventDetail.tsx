import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DecisionModal } from '@/components/DecisionModal';
import { SeverityChip } from '@/components/SeverityChip';
import { useEvent, useEventActions } from '@/hooks/useApi';

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
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
      <div className="p-12 flex flex-col items-center justify-center min-h-[400px] text-slate-500 space-y-3">
        <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Loading event details & evidence...</p>
      </div>
    );
  }

  if (query.isError || !event) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 shadow-sm space-y-3">
          <div className="font-heading font-bold text-lg">Unable to locate event record</div>
          <p className="text-sm text-red-600">The requested event {eventId} does not exist or could not be loaded.</p>
          <Link
            to="/desktop"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 text-red-800 text-xs font-bold hover:bg-red-200 transition-colors"
          >
            &larr; Return to Triage Queue
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
    <div className="p-6 lg:p-8 eds-canvas min-h-full space-y-6 fade-in">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
        <Link to="/desktop" className="text-teal-700 hover:text-teal-800 hover:underline">
          My Activities
        </Link>
        <span>/</span>
        <span className="text-slate-700">Drift Event {event.eventId}</span>
      </div>

      {/* Hero Header Card */}
      <div className="eds-card p-6 border-slate-200 bg-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-heading font-extrabold text-slate-900 tracking-tight">
                {event.policyId}
              </h1>
              <SeverityChip severity={event.severity} />
              <span className="chip chip-open">
                {event.status.replace(/_/g, ' ')}
              </span>
              {event.portfolioBreach && (
                <span className="chip chip-high animate-pulse">
                  Appetite Breach
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-2">
              <span>Event ID: <strong className="font-mono text-slate-700">{event.eventId}</strong></span>
              <span>&bull;</span>
              <span>Rule Engine Version: <strong className="font-mono text-slate-700">{event.ruleVersion.slice(0, 10)}</strong></span>
            </p>
          </div>

          {/* Confidence Meter Box */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-right min-w-[160px]">
            <div className="eds-label text-[11px]">Entity Match Confidence</div>
            <div className="text-2xl font-heading font-extrabold text-slate-900 mt-0.5">
              {Math.round(event.confidence * 100)}%
            </div>
            <div className="w-full h-2 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-400 to-cyan-500 rounded-full"
                style={{ width: `${Math.round(event.confidence * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Warning Banners */}
      {event.portfolioBreach && (
        <div className="rounded-xl border border-red-300 bg-gradient-to-r from-red-50 to-orange-50 p-4 shadow-sm flex items-start gap-3.5">
          <div className="p-2 rounded-lg bg-red-100 text-red-600 flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-red-900">
              Regional Flood Risk Appetite Breach Warning (Rule R6)
            </h3>
            <p className="text-xs text-red-700 mt-0.5 leading-relaxed">
              Accepting this exposure will push regional flood-zone concentration past the carrier&apos;s 20.00% appetite cap in South-East. Senior underwriter referral or treaty notification required.
            </p>
          </div>
        </div>
      )}

      {event.verifyFirst && (
        <div className="rounded-xl border border-slate-300 bg-slate-100 p-4 shadow-sm flex items-start gap-3.5">
          <div className="p-2 rounded-lg bg-slate-200 text-slate-700 flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Verify Entity Match Before Final Decision
            </h3>
            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
              Match confidence is below the automatic resolution threshold (75%). Verify building permit and parcel records with the broker prior to accepting.
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Comparison & Rules vs. Decision Controls */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.6fr] gap-6">
        {/* Left Column: Side-by-Side Comparison & Rules */}
        <div className="space-y-6">
          {/* Side-by-Side Snapshot Comparison Card */}
          <section className="eds-card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <div>
                <h2 className="font-heading font-bold text-base text-slate-900">
                  Risk Snapshot Comparison
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Last Reviewed Baseline vs. Ingested Candidate State
                </p>
              </div>
              {tivDelta > 0 && (
                <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  +{formatMoney(tivDelta)} (+{tivPct}%)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
              {/* Before Column */}
              <div className="p-6 bg-white space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Baseline Snapshot (Before)
                  </span>
                  <span className="text-xs font-bold text-slate-500 font-mono">BIND</span>
                </div>
                <div>
                  <div className="text-xs text-slate-400 font-semibold uppercase">Total TIV</div>
                  <div className="text-2xl font-heading font-extrabold text-slate-900 mt-0.5">
                    {formatMoney(event.before.totalTiv)}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="text-xs font-bold text-slate-600 uppercase">
                    Locations ({event.before.locations.length})
                  </div>
                  {event.before.locations.map((loc) => (
                    <div
                      key={loc.locationId}
                      className="p-3 rounded-lg border border-slate-200/90 bg-slate-50/50 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{loc.addressLine}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                          {loc.locationId}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Flood Zone: <strong>{loc.floodZone}</strong> (Score {loc.floodScore})</span>
                        <span className="font-semibold text-slate-800">{formatMoney(loc.tiv)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* After Column */}
              <div className="p-6 bg-teal-50/20 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-teal-100">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-800">
                    Candidate Snapshot (After)
                  </span>
                  <span className="text-xs font-bold text-teal-700 px-2 py-0.5 rounded bg-teal-100/70">
                    PROPOSED
                  </span>
                </div>
                <div>
                  <div className="text-xs text-teal-700 font-semibold uppercase">Candidate Total TIV</div>
                  <div className="text-2xl font-heading font-extrabold text-teal-900 mt-0.5">
                    {formatMoney(event.after.totalTiv)}
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="text-xs font-bold text-teal-900 uppercase">
                    Locations ({event.after.locations.length})
                  </div>
                  {event.after.locations.map((loc) => {
                    const beforeLoc = event.before.locations.find((b) => b.locationId === loc.locationId);
                    const isNew = !beforeLoc;
                    const isTivChanged = beforeLoc && beforeLoc.tiv !== loc.tiv;
                    const isFloodChanged = beforeLoc && (beforeLoc.floodZone !== loc.floodZone || beforeLoc.floodScore !== loc.floodScore);

                    return (
                      <div
                        key={loc.locationId}
                        className={`p-3 rounded-lg border space-y-1.5 transition-all ${
                          isNew
                            ? 'border-teal-400 bg-white shadow-sm ring-1 ring-teal-300'
                            : isTivChanged || isFloodChanged
                              ? 'border-amber-400 bg-amber-50/40'
                              : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900">{loc.addressLine}</span>
                          <div className="flex items-center gap-1">
                            {isNew && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-600 text-white shadow-sm">
                                NEW FACILITY
                              </span>
                            )}
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                              {loc.locationId}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-600">
                          <span className={isFloodChanged ? 'text-red-700 font-bold' : ''}>
                            Flood Zone: <strong>{loc.floodZone}</strong> (Score {loc.floodScore})
                          </span>
                          <span className={`font-semibold ${isNew || isTivChanged ? 'text-teal-700 text-sm font-bold' : 'text-slate-800'}`}>
                            {formatMoney(loc.tiv)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Rule Breakdown Card */}
          <section className="eds-card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
              <div>
                <h2 className="font-heading font-bold text-base text-slate-900">
                  Materiality Rule Breakdown
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Deterministic rules evaluated against active <code className="font-mono text-slate-700">rules.yaml</code>
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-navy-900 text-white shadow-sm">
                Score: {event.score} pts
              </span>
            </div>

            <table className="eds-table">
              <thead>
                <tr>
                  <th>Rule ID</th>
                  <th>Points</th>
                  <th>Explainable Underwriting Rationale</th>
                </tr>
              </thead>
              <tbody>
                {event.ruleBreakdown.map((rule) => (
                  <tr key={rule.ruleId}>
                    <td>
                      <span className="font-mono text-xs font-bold text-navy-900 bg-slate-100 px-2 py-1 rounded">
                        {rule.ruleId}
                      </span>
                    </td>
                    <td>
                      <span className="font-heading font-extrabold text-sm text-teal-700">
                        +{rule.points}
                      </span>
                    </td>
                    <td>
                      <p className="text-slate-800 text-xs font-medium leading-relaxed">
                        {rule.reason}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Why It Matters Callout */}
            <div className="p-6 bg-gradient-to-r from-slate-50 to-teal-50/30 border-t border-slate-200 space-y-2">
              <span className="eds-label text-teal-800">Why this matters</span>
              <p className="text-sm text-slate-800 font-medium leading-relaxed">
                {event.whyItMatters}
              </p>
              <div className="pt-2 text-xs text-slate-600 font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-500" />
                <span>Recommended Action:</span>
                <span className="text-navy-900 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                  {event.recommendedAction}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Sticky Action Bar & Provenance */}
        <aside className="space-y-6">
          {/* Action Decision Box */}
          <section className="eds-card p-6 space-y-4 sticky top-20">
            <div>
              <span className="eds-label">Underwriter Decision Terminal</span>
              <h3 className="font-heading font-bold text-lg text-slate-900 mt-1">
                Workflow Actions
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Current State: <strong className="text-navy-900">{event.status.replace(/_/g, ' ')}</strong>
              </p>
            </div>

            <div className="space-y-2.5 pt-2">
              {canStartReview && (
                <button
                  type="button"
                  onClick={() => actions.review.mutate(eventId)}
                  disabled={actions.review.isPending}
                  className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-navy-900 text-white hover:bg-navy-800 transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actions.review.isPending ? 'Starting...' : 'Open & Start Review'}
                </button>
              )}

              {canDecide && (
                <>
                  <button
                    type="button"
                    onClick={() => setModal('ACCEPT')}
                    className="w-full py-3 px-4 text-xs font-bold rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white hover:opacity-95 transition-all shadow-glow flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Accept Exposure (Create REVIEWED Snapshot)
                  </button>

                  <button
                    type="button"
                    onClick={() => setModal('REQUEST_INFO')}
                    className="w-full py-2.5 px-4 text-xs font-bold rounded-xl border border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100 transition-all flex items-center justify-center gap-2"
                  >
                    Request Information From Broker
                  </button>

                  <button
                    type="button"
                    onClick={() => setModal('DISMISS')}
                    className="w-full py-2 px-4 text-xs font-bold rounded-xl border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                  >
                    Dismiss Drift Event
                  </button>
                </>
              )}

              {canReopen && (
                <button
                  type="button"
                  onClick={() => actions.reopen.mutate(eventId)}
                  disabled={actions.reopen.isPending}
                  className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-navy-900 text-white hover:bg-navy-800 transition-all disabled:opacity-50"
                >
                  {actions.reopen.isPending ? 'Reopening...' : 'Reopen In-Review State'}
                </button>
              )}

              {event.status === 'CLOSED' && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-1">
                  <span className="text-xs font-bold text-slate-800">Lifecycle Concluded</span>
                  <p className="text-[11px] text-slate-500">
                    This drift event has been reviewed and closed with an audited snapshot.
                  </p>
                </div>
              )}
            </div>

            {(actions.review.error || actions.reopen.error || actions.decide.error) && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
                {(actions.review.error || actions.reopen.error || actions.decide.error)?.message}
              </div>
            )}
          </section>

          {/* Evidence Provenance Card */}
          <section className="eds-card p-6 space-y-3">
            <span className="eds-label">Signal Provenance</span>
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Ingested Signals</span>
                <span className="font-bold text-slate-800">{event.signalIds.length} source records</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Materiality Threshold</span>
                <span className="font-bold text-teal-700">{event.score} &ge; 5 pts (HIGH)</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500 font-medium">Aggregate Cap Status</span>
                <span className={`font-bold ${event.portfolioBreach ? 'text-red-600' : 'text-emerald-700'}`}>
                  {event.portfolioBreach ? 'Breach Cross' : 'Within Appetite'}
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