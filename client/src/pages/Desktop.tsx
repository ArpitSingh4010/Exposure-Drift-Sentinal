import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SeverityChip } from '@/components/SeverityChip';
import { useActivities, useEvents } from '@/hooks/useApi';

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function isOverdue(dueDate: string, status: string): boolean {
  return status === 'OPEN' && new Date(dueDate).getTime() < Date.now();
}

export function Desktop(): React.ReactElement {
  const navigate = useNavigate();
  const eventsQuery = useEvents();
  const activitiesQuery = useActivities();
  const [severity, setSeverity] = useState('ALL');
  const [status, setStatus] = useState('OPEN');
  const [mine, setMine] = useState(false);
  const currentUser = window.localStorage.getItem('eds_userId');

  const events = eventsQuery.data ?? [];
  const activities = activitiesQuery.data ?? [];
  const eventById = useMemo(() => new Map(events.map((event) => [event.eventId, event])), [events]);
  const rows = activities
    .map((activity) => ({ activity, event: eventById.get(activity.eventId) }))
    .filter(({ activity, event }) => {
      if (!event) return false;
      if (status !== 'ALL' && activity.status !== status) return false;
      if (severity !== 'ALL' && event.severity !== severity) return false;
      if (mine && activity.assigneeUserId !== currentUser) return false;
      return true;
    });
  const openCount = activities.filter((activity) => activity.status === 'OPEN').length;
  const highCount = rows.filter(({ event }) => event?.severity === 'HIGH').length;
  const overdueCount = activities.filter((activity) => isOverdue(activity.dueDate, activity.status)).length;
  const verifyCount = rows.filter(({ event }) => event?.verifyFirst).length;

  if (eventsQuery.isLoading || activitiesQuery.isLoading) return <div className="p-6 text-sm text-gray-500">Loading activities...</div>;
  if (eventsQuery.isError || activitiesQuery.isError) return <div className="p-6"><div className="bg-red-50 border border-red-200 text-red-700 rounded p-4">Unable to load activities. Check that the server is running.</div></div>;

  return (
    <div className="p-5 lg:p-6 fade-in space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-teal-700 font-semibold">Underwriting workspace</p>
          <h1 className="text-2xl font-semibold text-navy-950 mt-1">My Activities</h1>
          <p className="text-sm text-gray-500 mt-1">Exposure changes requiring a human review decision.</p>
        </div>
        <div className="text-right text-xs text-gray-500">Updated just now<br /><span className="text-teal-700 font-medium">Live policy workflow</span></div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          ['Open', openCount, 'chip-open'],
          ['High severity', highCount, 'chip-high'],
          ['Overdue', overdueCount, 'chip-high'],
          ['Verify first', verifyCount, 'chip-verify'],
        ].map(([label, value, chip]) => (
          <div key={String(label)} className="eds-card p-4">
            <div className="flex items-center justify-between"><span className="eds-label">{label}</span><span className={`chip ${chip}`}>{value}</span></div>
            <p className="text-2xl font-semibold text-navy-950 mt-3">{value}</p>
          </div>
        ))}
      </div>

      <section className="eds-card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex flex-wrap items-center gap-2 justify-between">
          <div><h2 className="font-semibold text-gray-900">Review queue</h2><p className="text-xs text-gray-500 mt-0.5">Select an activity to inspect the evidence.</p></div>
          <div className="flex flex-wrap gap-2">
            <select value={severity} onChange={(event) => setSeverity(event.target.value)} className="text-xs border border-gray-300 rounded px-2 py-1.5 bg-white" aria-label="Filter severity">
              <option value="ALL">All severity</option><option value="HIGH">High</option><option value="MEDIUM">Medium</option><option value="LOW">Low</option>
            </select>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="text-xs border border-gray-300 rounded px-2 py-1.5 bg-white" aria-label="Filter status">
              <option value="OPEN">Open only</option><option value="ALL">All status</option><option value="COMPLETED">Completed</option>
            </select>
            <label className="flex items-center gap-1.5 text-xs text-gray-600 border border-gray-300 rounded px-2 py-1.5"><input type="checkbox" checked={mine} onChange={(event) => setMine(event.target.checked)} /> Mine</label>
          </div>
        </div>
        {rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">No activities match these filters.</div>
        ) : (
          <div className="overflow-x-auto"><table className="eds-table min-w-[900px]"><thead><tr><th>Severity</th><th>Policy</th><th>Change summary</th><th>Confidence</th><th>Status</th><th>Due</th><th>Assignee</th></tr></thead><tbody>
            {rows.map(({ activity, event }) => {
              if (!event) return null;
              const overdue = isOverdue(activity.dueDate, activity.status);
              return <tr key={activity.activityId} className={overdue ? 'overdue' : ''} onClick={() => navigate(`/events/${event.eventId}`)}>
                <td><SeverityChip severity={event.severity} />{event.verifyFirst && <span className="chip chip-verify ml-1">Verify</span>}</td>
                <td><div className="font-medium text-navy-900">{event.policyId}</div><div className="text-xs text-gray-500">{event.eventId}</div></td>
                <td><div className="max-w-[280px] truncate text-gray-800">{activity.subject}</div><div className="text-xs text-gray-500">{event.changes.length} evidence changes · {formatMoney(event.after.totalTiv)} after TIV</div></td>
                <td><div className="font-medium">{Math.round(event.confidence * 100)}%</div><div className="w-16 h-1.5 bg-gray-200 rounded-full mt-1"><div className="h-full bg-teal-500 rounded-full" style={{ width: `${Math.round(event.confidence * 100)}%` }} /></div></td>
                <td><span className="chip chip-open">{event.status.replace('_', ' ')}</span></td>
                <td className={overdue ? 'text-red-700 font-semibold' : 'text-gray-700'}>{new Date(activity.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}{overdue && <div className="text-[10px] uppercase">Overdue</div>}</td>
                <td className="text-xs text-gray-600">{activity.assigneeUserId}{activity.seniorFlag && <div className="text-amber-700">Senior flagged</div>}</td>
              </tr>;
            })}
          </tbody></table></div>
        )}
      </section>
    </div>
  );
}
