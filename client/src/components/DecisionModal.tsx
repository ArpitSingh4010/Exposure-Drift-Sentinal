import { useState } from 'react';

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
  return (
    <div className="fixed inset-0 z-40 bg-navy-950/45 flex items-center justify-center p-4" role="presentation">
      <section className="bg-white w-full max-w-md rounded-lg shadow-card-hover border border-gray-200" role="dialog" aria-modal="true" aria-labelledby="decision-title">
        <div className="px-5 py-4 border-b border-gray-200">
          <h2 id="decision-title" className="font-semibold text-gray-900">{action.replace('_', ' ')}</h2>
          <p className="text-xs text-gray-500 mt-1">Record the underwriter note before continuing.</p>
        </div>
        <div className="p-5 space-y-4">
          {action === 'DISMISS' && (
            <label className="block text-sm text-gray-700">
              Reason
              <select value={reasonCode} onChange={(event) => setReasonCode(event.target.value)} className="mt-1 w-full border border-gray-300 rounded px-3 py-2 bg-white">
                <option value="">Select a reason</option>
                <option value="not_material">Not material</option>
                <option value="wrong_match">Wrong match</option>
                <option value="already_known">Already known</option>
                <option value="other">Other</option>
              </select>
            </label>
          )}
          <label className="block text-sm text-gray-700">
            Note
            <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} className="mt-1 w-full border border-gray-300 rounded px-3 py-2 resize-y" placeholder="Add a decision note" />
          </label>
          {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}
        </div>
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-3 py-2 text-sm border border-gray-300 rounded bg-white hover:bg-gray-100">Cancel</button>
          <button type="button" disabled={!valid || busy} onClick={() => onConfirm({ action, note: note.trim(), ...(reasonCode ? { reasonCode } : {}) })} className="px-3 py-2 text-sm rounded bg-navy-900 text-white disabled:opacity-50 hover:bg-navy-800">
            {busy ? 'Saving...' : 'Confirm'}
          </button>
        </div>
      </section>
    </div>
  );
}