import { useAudit } from '@/hooks/useApi';

export function Audit(): React.ReactElement {
  const query = useAudit();
  if (query.isLoading) return <div className="p-6 text-sm text-gray-500">Loading audit history...</div>;
  if (query.isError) return <div className="p-6"><div className="bg-red-50 border border-red-200 text-red-700 rounded p-4">Unable to load audit history.</div></div>;
  return <div className="p-5 lg:p-6 fade-in"><div className="mb-5"><p className="text-xs uppercase tracking-widest text-teal-700 font-semibold">Append-only history</p><h1 className="text-2xl font-semibold text-navy-950 mt-1">Audit Log</h1><p className="text-sm text-gray-500 mt-1">Every signal, workflow transition, decision, and appetite breach.</p></div><section className="eds-card overflow-hidden"><div className="overflow-x-auto"><table className="eds-table min-w-[850px]"><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead><tbody>{query.data?.map((entry) => <tr key={`${entry.ts}-${entry.entityId}-${entry.action}`}><td className="text-xs text-gray-500">{new Date(entry.ts).toLocaleString()}</td><td>{entry.actor}</td><td><span className="chip chip-open">{entry.action}</span></td><td className="font-mono text-xs">{entry.entityType} · {entry.entityId}</td><td className="text-xs text-gray-600 max-w-[320px] truncate">{JSON.stringify(entry.details)}</td></tr>)}</tbody></table></div>{query.data?.length === 0 && <div className="p-8 text-center text-sm text-gray-500">No audit entries yet.</div>}</section></div>;
}
