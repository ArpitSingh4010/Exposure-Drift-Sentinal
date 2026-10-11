import React, { useState } from 'react';

type DecisionAction = 'ACCEPT' | 'DISMISS' | 'REQUEST_INFO';

export function DecisionModal({
  action,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  action: DecisionAction;
  busy?: boolean;
  error?: string;
  onCancel: () => void;
  onConfirm: (body: { action: DecisionAction; reasonCode?: string; note: string }) => void;
}): React.ReactElement {
  const [note, setNote] = useState('');
  const [reasonCode, setReasonCode] = useState('');
  const valid = note.trim().length > 0 && (action !== 'DISMISS' || reasonCode.length > 0);

  const actionDetails =
    action === 'ACCEPT'
      ? { title: 'Accept Exposure Change', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300', btn: 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-glow' }
      : action === 'REQUEST_INFO'
        ? { title: 'Request Underwriting Information', badge: 'bg-amber-100 text-amber-800 border-amber-300', btn: 'bg-amber-600 text-white' }
        : { title: 'Dismiss Drift Event', badge: 'bg-slate-100 text-slate-800 border-slate-300', btn: 'bg-navy-900 text-white' };

  return (
    <div
      className="fixed inset-0 z-50 bg-navy-950/60 backdrop-blur-sm flex items-center justify-center p-4 fade-in"
      role="presentation"
    >
      <section
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden slide-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="decision-title"
      >
        <div className="p-6 border-b border-slate-200 bg-slate-50/70 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${actionDetails.badge}`}>
                {action.replace(/_/g, ' ')}
              </span>
            </div>
            <h2 id="decision-title" className="font-heading font-extrabold text-xl text-slate-900 mt-1">
              {actionDetails.title}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Every decision requires an immutable underwriter rationale note for compliance.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {action === 'DISMISS' && (
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Reason
              <select
                value={reasonCode}
                onChange={(event) => setReasonCode(event.target.value)}
                className="mt-1.5 w-full border border-slate-300 rounded-xl px-3.5 py-2.5 bg-slate-50 text-sm font-semibold text-slate-800 focus:bg-white focus:border-teal-500 outline-none"
              >
                <option value="">Select a dismissal reason code</option>
                <option value="not_material">Not material to risk</option>
                <option value="wrong_match">Wrong entity match</option>
                <option value="already_known">Already known / previously endorsed</option>
                <option value="other">Other reason</option>
              </select>
            </label>
          )}

          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Note
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={4}
              className="mt-1.5 w-full border border-slate-300 rounded-xl p-3.5 text-sm text-slate-800 focus:bg-white focus:border-teal-500 outline-none resize-none font-normal"
              placeholder="State the underwriting rationale (e.g. verified new Savannah warehouse with insured broker via email)"
            />
          </label>

          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-semibold">
              {error}
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold border border-slate-300 rounded-xl bg-white hover:bg-slate-100 text-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!valid || busy}
            onClick={() =>
              onConfirm({
                action,
                note: note.trim(),
                ...(reasonCode ? { reasonCode } : {}),
              })
            }
            className={`px-5 py-2 text-xs font-bold rounded-xl transition-all disabled:opacity-50 ${actionDetails.btn}`}
          >
            {busy ? 'Saving...' : 'Confirm'}
          </button>
        </div>
      </section>
    </div>
  );
}