import { useState } from 'react';
import { runScenario } from '@/api/client';
import { useUserStore } from '@/hooks/useUserStore';

const scenarios = ['new_facility', 'tiv_increase', 'flood_zone_update', 'verify_first_case', 'noise_small_change', 'duplicate_signal'];

export function Simulator(): React.ReactElement {
  const { userId } = useUserStore();
  const [policyId, setPolicyId] = useState('POL-100245');
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function run(name: string): Promise<void> { setBusy(true); setError(''); try { const result = await runScenario(userId, name, policyId); setLog(result.steps); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Scenario failed'); } finally { setBusy(false); } }
  return <div className="p-5 lg:p-6 fade-in space-y-5"><div><p className="text-xs uppercase tracking-widest text-teal-700 font-semibold">Demo tool</p><h1 className="text-2xl font-semibold text-navy-950 mt-1">Signal Simulator</h1><p className="text-sm text-gray-500 mt-1">Run deterministic local signals without calling an external feed.</p></div><section className="eds-card p-5"><label className="block text-sm font-medium text-gray-700">Policy ID<input value={policyId} onChange={(event) => setPolicyId(event.target.value)} className="block mt-1 border border-gray-300 rounded px-3 py-2 w-full max-w-sm" /></label><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-5">{scenarios.map((scenario) => <button key={scenario} type="button" disabled={busy} onClick={() => void run(scenario)} className="text-left border border-gray-200 rounded px-3 py-3 hover:border-teal-400 hover:bg-teal-50 disabled:opacity-50"><div className="font-mono text-xs text-navy-900">{scenario}</div><div className="text-xs text-gray-500 mt-1">Run scenario</div></button>)}</div></section>{error && <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 text-sm">{error}</div>}<section className="eds-card overflow-hidden"><div className="px-4 py-3 border-b border-gray-200 font-semibold text-sm">Live step log</div>{log.length === 0 ? <div className="p-8 text-sm text-gray-500">Choose a scenario to begin.</div> : <ol className="p-4 space-y-3">{log.map((step, index) => <li key={`${step}-${index}`} className="flex gap-3 text-sm"><span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-xs font-semibold">{index + 1}</span><span className="pt-1">{step}</span></li>)}</ol>}</section></div>;
}
