import { useRules } from '@/hooks/useApi';

export function Rules(): React.ReactElement {
  const query = useRules();
  if (query.isLoading) return <div className="p-6 text-sm text-gray-500">Loading active rules...</div>;
  if (query.isError || !query.data) return <div className="p-6"><div className="bg-red-50 border border-red-200 text-red-700 rounded p-4">Unable to load rules.</div></div>;
  return <div className="p-5 lg:p-6 fade-in"><div className="flex items-end justify-between gap-3 flex-wrap mb-5"><div><p className="text-xs uppercase tracking-widest text-teal-700 font-semibold">Deterministic decision logic</p><h1 className="text-2xl font-semibold text-navy-950 mt-1">Active Rules</h1><p className="text-sm text-gray-500 mt-1">Read-only configuration loaded by the server.</p></div><div className="text-right"><div className="eds-label">Content hash</div><div className="font-mono text-xs text-navy-900 mt-1">{query.data.version}</div></div></div><pre className="eds-card p-5 overflow-x-auto text-xs leading-6 font-mono text-gray-800 whitespace-pre-wrap">{query.data.yamlText}</pre></div>;
}
