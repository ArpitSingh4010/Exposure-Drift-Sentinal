import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DecisionModal } from '@/components/DecisionModal';
import { SeverityChip } from '@/components/SeverityChip';
import { useEvent, useEventActions } from '@/hooks/useApi';

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

export function EventDetail(): React.ReactElement {
  const { eventId = '' } = useParams();
  const query = useEvent(eventId);
  const actions = useEventActions();
  const [modal, setModal] = useState<'ACCEPT' | 'DISMISS' | 'REQUEST_INFO' | null>(null);
  const [actionError, setActionError] = useState('');
  const event = query.data;

  if (query.isLoading) return <div className="p-6 text-sm text-gray-500">Loading event detail...</div>;
  if (query.isError || !event) return <div className="p-6"><div className="bg-red-50 border border-red-200 text-red-700 rounded p-4">Unable to load this event.</div><Link to="/desktop" className="inline-block mt-4 text-sm text-teal-700 hover:underline">Back to activities</Link></div>;

  const canStartReview = event.status === 'NEW' || event.status === 'ACTIVITY_CREATED';
  const canDecide = event.status === 'IN_REVIEW';
  const canReopen = event.status === 'INFO_REQUESTED';
  const confirmDecision = (body: { action: 'ACCEPT' | 'DISMISS' | 'REQUEST_INFO'; reasonCode?: string; note: string }) => {
    setActionError('');
    actions.decide.mutate({ eventId, body }, { onSuccess: () => setModal(null), onError: (error) => setActionError(error.message) });
  };

  return (
    <div className="p-5 lg:p-6 fade-in space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div><Link to="/desktop" className="text-xs text-teal-700 hover:underline">My Activities</Link><div className="flex items-center gap-3 mt-2"><h1 className="text-2xl font-semibold text-navy-950">{event.policyId}</h1><SeverityChip severity={event.severity} /><span className="chip chip-open">{event.status.replace('_', ' ')}</span></div><p className="text-sm text-gray-500 mt-1">Drift event {event.eventId} · Rule version {event.ruleVersion.slice(0, 12)}</p></div>
        <div className="text-right"><div className="eds-label">Confidence</div><div className="text-2xl font-semibold text-navy-950 mt-1">{Math.round(event.confidence * 100)}%</div><div className="w-28 h-2 bg-gray-200 rounded-full mt-2"><div className="h-full bg-teal-500 rounded-full" style={{ width: `${Math.round(event.confidence * 100)}%` }} /></div></div>
      </div>

      {event.verifyFirst && <div className="border border-gray-300 bg-gray-100 rounded-lg px-4 py-3 text-sm text-gray-700"><strong>Verify match before review.</strong> Entity confidence is below the automatic match threshold. Confirm the insured and location evidence before deciding.</div>}
      {event.portfolioBreach && <div className="border border-red-200 bg-red-50 rounded-lg px-4 py-3 text-sm text-red-800"><strong>Portfolio appetite breach.</strong> This change pushes regional flood exposure above the configured cap.</div>}

      <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.65fr] gap-5">
        <div className="space-y-5">
          <section className="eds-card overflow-hidden"><div className="px-4 py-3 border-b border-gray-200"><h2 className="font-semibold text-gray-900">Risk snapshot comparison</h2><p className="text-xs text-gray-500 mt-0.5">Changed values are highlighted in the after state.</p></div><div className="grid grid-cols-2 divide-x divide-gray-200"><div className="p-4"><div className="eds-label mb-3">Before</div><div className="text-lg font-semibold text-navy-950">{formatMoney(event.before.totalTiv)}</div>{event.before.locations.map((location) => <div key={location.locationId} className="mt-4 border-t border-gray-100 pt-3"><div className="text-sm font-medium">{location.addressLine}</div><div className="text-xs text-gray-500 mt-1">{location.locationId} · {location.floodZone} · score {location.floodScore}</div><div className="text-sm mt-1">{formatMoney(location.tiv)}</div></div>)}</div><div className="p-4 bg-teal-50/30"><div className="eds-label mb-3 text-teal-700">After</div><div className="text-lg font-semibold text-navy-950">{formatMoney(event.after.totalTiv)}</div>{event.after.locations.map((location) => { const before = event.before.locations.find((item) => item.locationId === location.locationId); const changed = !before || before.tiv !== location.tiv || before.floodZone !== location.floodZone || before.floodScore !== location.floodScore; return <div key={location.locationId} className={`mt-4 border-t border-gray-100 pt-3 ${changed ? 'border-l-2 border-teal-500 pl-3' : ''}`}><div className="text-sm font-medium">{location.addressLine}{!before && <span className="ml-2 chip chip-open">New</span>}</div><div className="text-xs text-gray-500 mt-1">{location.locationId} · {location.floodZone} · score {location.floodScore}</div><div className="text-sm mt-1 font-semibold">{formatMoney(location.tiv)}</div></div>; })}</div></div></section>

          <section className="eds-card overflow-hidden"><div className="px-4 py-3 border-b border-gray-200"><h2 className="font-semibold text-gray-900">Rule breakdown</h2></div><table className="eds-table"><thead><tr><th>Rule</th><th>Points</th><th>Why it fired</th></tr></thead><tbody>{event.ruleBreakdown.map((rule) => <tr key={rule.ruleId}><td className="font-mono text-xs text-navy-800">{rule.ruleId}</td><td className="font-semibold">{rule.points}</td><td className="text-gray-700">{rule.reason}</td></tr>)}</tbody></table><div className="px-4 py-4 bg-gray-50 text-sm"><span className="eds-label">Why this matters</span><p className="mt-1 text-gray-800">{event.whyItMatters}</p><p className="mt-2 text-xs text-gray-500">Recommended action: {event.recommendedAction}</p></div></section>
        </div>

        <aside className="space-y-5"><section className="eds-card p-4"><div className="eds-label">Event controls</div><div className="mt-3 space-y-2">{canStartReview && <button type="button" onClick={() => actions.review.mutate(eventId)} disabled={actions.review.isPending} className="w-full px-3 py-2 text-sm rounded bg-navy-900 text-white hover:bg-navy-800 disabled:opacity-50">{actions.review.isPending ? 'Starting...' : 'Start review'}</button>}{canDecide && <><button type="button" onClick={() => setModal('ACCEPT')} className="w-full px-3 py-2 text-sm rounded bg-teal-600 text-white hover:bg-teal-700">Accept</button><button type="button" onClick={() => setModal('REQUEST_INFO')} className="w-full px-3 py-2 text-sm rounded border border-amber-300 text-amber-800 bg-amber-50 hover:bg-amber-100">Request information</button><button type="button" onClick={() => setModal('DISMISS')} className="w-full px-3 py-2 text-sm rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-100">Dismiss</button></>}{canReopen && <button type="button" onClick={() => actions.reopen.mutate(eventId)} disabled={actions.reopen.isPending} className="w-full px-3 py-2 text-sm rounded bg-navy-900 text-white disabled:opacity-50">{actions.reopen.isPending ? 'Reopening...' : 'Reopen review'}</button>}</div>{(actions.review.error || actions.reopen.error || actions.decide.error) && <p className="text-sm text-red-700 mt-3">{(actions.review.error || actions.reopen.error || actions.decide.error)?.message}</p>}</section><section className="eds-card p-4"><div className="eds-label">Evidence</div><dl className="mt-3 space-y-3 text-sm"><div><dt className="text-xs text-gray-500">Signals</dt><dd className="font-medium">{event.signalIds.length} received</dd></div><div><dt className="text-xs text-gray-500">Materiality score</dt><dd className="font-medium">{event.score} points</dd></div><div><dt className="text-xs text-gray-500">Portfolio flag</dt><dd className="font-medium">{event.portfolioBreach ? 'Breach' : 'Within appetite'}</dd></div></dl></section></aside>
      </div>
      {modal && <DecisionModal action={modal} busy={actions.decide.isPending} error={actionError} onCancel={() => setModal(null)} onConfirm={confirmDecision} />}
    </div>
  );
}