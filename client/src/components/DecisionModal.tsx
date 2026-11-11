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
      ? {
          title: 'Accept Exposure Change',
          desc: 'Commit candidate state as the new bound baseline snapshot for this policy.',
          badgeClass: 'badge-low',
          badgeText: 'Accept Risk',
        }
      : action === 'REQUEST_INFO'
        ? {
            title: 'Request Underwriting Information',
            desc: 'Hold review and request engineering or valuation documentation from broker.',
            badgeClass: 'badge-medium',
            badgeText: 'Info Request',
          }
        : {
            title: 'Dismiss Drift Event',
            desc: 'Close this drift alert as immaterial, duplicate, or inaccurate.',
            badgeClass: 'badge-high',
            badgeText: 'Dismiss Event',
          };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(26, 26, 24, 0.45)', backdropFilter: 'blur(2px)' }}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <section
        className="w-full max-w-lg overflow-hidden bg-white"
        style={{
          border: '1px solid var(--border)',
          borderRadius: '6px',
          boxShadow: 'var(--shadow-modal)',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="decision-title"
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-start justify-between gap-4"
          style={{
            backgroundColor: 'var(--surface-raised)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`badge ${actionDetails.badgeClass}`}>
                {actionDetails.badgeText}
              </span>
            </div>
            <h2 id="decision-title" className="text-sm font-semibold tracking-tight text-[#1A1A18]">
              {actionDetails.title}
            </h2>
            <p className="text-xs text-[#7A7A74] mt-0.5 leading-normal">
              {actionDetails.desc}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-[#7A7A74] hover:text-[#1A1A18] p-1 rounded transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4">
          {action === 'DISMISS' && (
            <div>
              <label className="block text-xs font-medium text-[#4A4A45] mb-1.5" htmlFor="dismiss-reason">
                Reason
              </label>
              <select
                id="dismiss-reason"
                value={reasonCode}
                onChange={(event) => setReasonCode(event.target.value)}
                className="field-select w-full"
                aria-label="Reason"
              >
                <option value="">Select a reason code...</option>
                <option value="not_material">Not material to risk</option>
                <option value="wrong_match">Wrong entity match</option>
                <option value="already_known">Already known / previously endorsed</option>
                <option value="other">Other reason</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#4A4A45] mb-1.5" htmlFor="decision-note">
              Note
            </label>
            <textarea
              id="decision-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={4}
              aria-label="Note"
              className="field-input w-full resize-none font-sans"
              placeholder="State the underwriting rationale (recorded in immutable audit log)..."
            />
          </div>

          {error && (
            <div
              className="p-3 text-xs leading-relaxed"
              style={{
                backgroundColor: 'var(--risk-high-bg)',
                color: 'var(--risk-high-text)',
                border: '1px solid var(--risk-high-border)',
                borderRadius: '4px',
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className="px-5 py-3.5 flex items-center justify-end gap-2.5"
          style={{
            backgroundColor: 'var(--surface-raised)',
            borderTop: '1px solid var(--border)',
          }}
        >
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary text-xs"
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
            className={`btn ${action === 'DISMISS' ? 'btn-danger' : 'btn-primary'} text-xs disabled:opacity-50`}
          >
            {busy ? 'Recording...' : 'Confirm'}
          </button>
        </div>
      </section>
    </div>
  );
}
