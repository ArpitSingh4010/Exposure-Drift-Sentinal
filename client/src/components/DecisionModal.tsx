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
      ? { title: 'Accept Exposure Change', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', btn: 'bg-slate-900 text-white hover:bg-slate-800' }
      : action === 'REQUEST_INFO'
        ? { title: 'Request Underwriting Information', badge: 'bg-amber-50 text-amber-700 border-amber-200', btn: 'bg-slate-900 text-white hover:bg-slate-800' }
        : { title: 'Dismiss Drift Event', badge: 'bg-slate-100 text-slate-700 border-slate-200', btn: 'bg-slate-900 text-white hover:bg-slate-800' };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4 fade-in"
      role="presentation"
    >
      <section
        className="bg-white w-full max-w-lg rounded-xl shadow-xl border border-slate-200 overflow-hidden slide-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="decision-title"
      >
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border uppercase ${actionDetails.badge}`}>
                {action.replace(/_/g, ' ')}
              </span>
            </div>
            <h2 id="decision-title" className="font-heading font-semibold text-lg text-slate-900 mt-1">
              {actionDetails.title}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter an underwriting rationale note before proceeding.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-7 h-7 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 flex items-center justify-center transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          {action === 'DISMISS' && (
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
              Reason
              <select
                value={reasonCode}
                onChange={(event) => setReasonCode(event.target.value)}
                className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 bg-white text-xs text-slate-800 focus:border-slate-500 outline-none"
              >
                <option value="">Select a reason code</option>
                <option value="not_material">Not material to risk</option>
                <option value="wrong_match">Wrong entity match</option>
                <option value="already_known">Already known / previously endorsed</option>
                <option value="other">Other reason</option>
              </select>
            </label>
          )}

          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
            Note
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={4}
              className="mt-1 w-full border border-slate-300 rounded-lg p-3 text-xs text-slate-800 focus:border-slate-500 outline-none resize-none"
              placeholder="State the decision rationale..."
            />
          </label>

          {error && (
            <div className="p-2.5 rounded bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}
        </div>

        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-3.5 py-1.5 text-xs font-medium border border-slate-300 rounded-lg bg-white hover:bg-slate-50 text-slate-700 transition-colors"
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
            className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50 ${actionDetails.btn}`}
          >
            {busy ? 'Saving...' : 'Confirm'}
          </button>
        </div>
      </section>
    </div>
  );
}