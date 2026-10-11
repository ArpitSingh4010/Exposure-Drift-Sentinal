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
      <div className="p-8 flex flex-col items-center justify-center min-h-[300px] text-slate-500 space-y-2">
        <div className="w-5 h-5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium">Loading event detail...</p>
      </div>
    );
  }

  if (query.isError || !event) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-xs font-medium space-y-2">
          <div>Unable to find drift event {eventId}.</div>
          <Link to="/desktop" className="text-teal-700 underline font-semibold block">
            &larr; Return to review queue
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
    <div className="p-6 lg:p-8 space-y-6 fade-in max-w-7xl">
      {/* Clean Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/desktop" className="hover:text-slate-900 transition-colors">
          Activities
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">{event.eventId}</span>
      </div>

      {/* Header Card */}
      <div className="eds-card p-5 bg-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-heading font-semibold text-slate-900 tracking-tight">
                {event.policyId}
              </h1>
              <SeverityChip severity={event.severity} />
              <span className="chip chip-open">
                {event.status.replace(/_/g, ' ')}
              </span>
              {event.portfolioBreach && (
                <span className="chip chip-high">
                  Appetite Breach
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Drift Event <strong className="font-mono text-slate-700">{event.eventId}</strong> &bull; Rule Version <span className="font-mono text-slate-700">{event.ruleVersion.slice(0, 8)}</span>
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-right min-w-[140px]">
            <div className="text-[11px] font-medium text-slate-500 uppercase">Match Confidence</div>
            <div className="text-xl font-heading font-semibold text-slate-900 mt-0.5">
              {Math.round(event.confidence * 100)}%
            </div>
            <div className="w-full h-1 bg-slate-200 rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-slate-700 rounded-full"
                style={{ width: `${Math.round(event.confidence * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notice Banners */}
      {event.portfolioBreach && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-800">
          <strong className="font-semibold">Portfolio appetite breach:</strong> This change causes regional flood exposure in South-East to exceed the 20.00% cap.
        </div>
      )}

      {event.verifyFirst && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
          <strong className="font-semibold">Verify match before review:</strong> Entity resolution confidence is below 75%. Confirm insured name and location details prior to accepting.
        </div>
      )}

      {/* Main Grid: Comparison & Rules */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.6fr] gap-6">
        <div className="space-y-6">
          {/* Side-by-Side Comparison Card */}
          <section className="eds-card overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h2 className="font-heading font-semibold text-sm text-slate-900">
                  Risk Snapshot Comparison
                </h2>
                <p className="text-xs text-slate-500">
                  Baseline record vs. Candidate state
                </p>
              </div>
              {tivDelta > 0 && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  +{formatMoney(tivDelta)} (+{tivPct}%)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
              {/* Before Column */}
              <div className="p-5 bg-white space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-semibold uppercase text-slate-400">Baseline (Before)</span>
                  <span className="text-[11px] font-mono text-slate-500">BIND</span>
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium uppercase">Total TIV</div>
                  <div className="text-xl font-heading font-semibold text-slate-900 mt-0.5">
                    {formatMoney(event.before.totalTiv)}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="text-xs font-medium text-slate-500">
                    Locations ({event.before.locations.length})
                  </div>
                  {event.before.locations.map((loc) => (
                    <div
                      key={loc.locationId}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs font-medium text-slate-900">
                        <span>{loc.addressLine}</span>
                        <span className="font-mono text-slate-500 text-[10px]">{loc.locationId}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>Zone: {loc.floodZone} (Score {loc.floodScore})</span>
                        <span className="font-semibold text-slate-800">{formatMoney(loc.tiv)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* After Column */}
              <div className="p-5 bg-slate-50/40 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-semibold uppercase text-slate-700">Candidate (After)</span>
                  <span className="text-[11px] font-semibold text-slate-700 bg-slate-200 px-1.5 py-0.2 rounded">PROPOSED</span>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 font-medium uppercase">Candidate Total TIV</div>
                  <div className="text-xl font-heading font-semibold text-slate-900 mt-0.5">
                    {formatMoney(event.after.totalTiv)}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="text-xs font-medium text-slate-700">
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
                        className={`p-3 rounded-lg border space-y-1 ${
                          isNew
                            ? 'border-emerald-300 bg-emerald-50/30'
                            : isTivChanged || isFloodChanged
                              ? 'border-amber-300 bg-amber-50/30'
                              : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-medium text-slate-900">
                          <span className="font-semibold">{loc.addressLine}</span>
                          <div className="flex items-center gap-1">
                            {isNew && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                                New
                              </span>
                            )}
                            <span className="font-mono text-slate-500 text-[10px]">{loc.locationId}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-600">
                          <span>Zone: {loc.floodZone} (Score {loc.floodScore})</span>
                          <span className="font-semibold text-slate-900">{formatMoney(loc.tiv)}</span>
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
            <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h2 className="font-heading font-semibold text-sm text-slate-900">
                  Rule Evaluation
                </h2>
                <p className="text-xs text-slate-500">
                  Scored via rules.yaml thresholds
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-900 text-white">
                Score: {event.score} pts
              </span>
            </div>

            <table className="eds-table">
              <thead>
                <tr>
                  <th>Rule ID</th>
                  <th>Points</th>
                  <th>Evaluation Detail</th>
                </tr>
              </thead>
              <tbody>
                {event.ruleBreakdown.map((rule) => (
                  <tr key={rule.ruleId}>
                    <td>
                      <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                        {rule.ruleId}
                      </span>
                    </td>
                    <td>
                      <span className="font-semibold text-xs text-slate-900">
                        +{rule.points}
                      </span>
                    </td>
                    <td className="text-xs text-slate-700">
                      {rule.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-1.5">
              <div className="text-[11px] font-semibold uppercase text-slate-500">Underwriting Assessment</div>
              <p className="text-xs text-slate-800 leading-relaxed">
                {event.whyItMatters}
              </p>
              <div className="pt-1 text-xs text-slate-600">
                Recommended Action: <strong className="text-slate-900">{event.recommendedAction}</strong>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Actions */}
        <aside className="space-y-6">
          <section className="eds-card p-5 space-y-3.5 sticky top-20">
            <div>
              <div className="text-[11px] font-semibold uppercase text-slate-400">Action Terminal</div>
              <h3 className="font-heading font-semibold text-base text-slate-900 mt-1">
                Underwriter Review
              </h3>
              <p className="text-xs text-slate-500">
                State: <strong className="text-slate-800">{event.status.replace(/_/g, ' ')}</strong>
              </p>
            </div>

            <div className="space-y-2 pt-1">
              {canStartReview && (
                <button
                  type="button"
                  onClick={() => actions.review.mutate(eventId)}
                  disabled={actions.review.isPending}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {actions.review.isPending ? 'Starting...' : 'Open & Start Review'}
                </button>
              )}

              {canDecide && (
                <>
                  <button
                    type="button"
                    onClick={() => setModal('ACCEPT')}
                    className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                  >
                    Accept Exposure (Create Snapshot)
                  </button>

                  <button
                    type="button"
                    onClick={() => setModal('REQUEST_INFO')}
                    className="w-full py-2 px-3 text-xs font-semibold rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                  >
                    Request Information
                  </button>

                  <button
                    type="button"
                    onClick={() => setModal('DISMISS')}
                    className="w-full py-2 px-3 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-colors"
                  >
                    Dismiss Event
                  </button>
                </>
              )}

              {canReopen && (
                <button
                  type="button"
                  onClick={() => actions.reopen.mutate(eventId)}
                  disabled={actions.reopen.isPending}
                  className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  {actions.reopen.isPending ? 'Reopening...' : 'Reopen In-Review'}
                </button>
              )}

              {event.status === 'CLOSED' && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center text-xs text-slate-600">
                  Event closed and verified in audit trail.
                </div>
              )}
            </div>

            {(actions.review.error || actions.reopen.error || actions.decide.error) && (
              <div className="p-2.5 rounded bg-red-50 border border-red-200 text-xs text-red-700">
                {(actions.review.error || actions.reopen.error || actions.decide.error)?.message}
              </div>
            )}
          </section>

          {/* Evidence Card */}
          <section className="eds-card p-5 space-y-2.5 text-xs">
            <div className="text-[11px] font-semibold uppercase text-slate-400">Signal Evidence</div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Ingested Signals</span>
              <span className="font-semibold text-slate-800">{event.signalIds.length} source records</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Severity</span>
              <span className="font-semibold text-slate-800">{event.severity}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Portfolio Status</span>
              <span className={`font-semibold ${event.portfolioBreach ? 'text-red-600' : 'text-emerald-700'}`}>
                {event.portfolioBreach ? 'Cap Breach' : 'Within Cap'}
              </span>
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