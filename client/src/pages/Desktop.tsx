import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SeverityChip } from '@/components/SeverityChip';
import { useActivities, useEvents } from '@/hooks/useApi';

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
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
  const [search, setSearch] = useState('');
  const currentUser = typeof window !== 'undefined' ? window.localStorage.getItem('eds_userId') : null;

  const events = eventsQuery.data ?? [];
  const activities = activitiesQuery.data ?? [];
  const eventById = useMemo(() => new Map(events.map((event) => [event.eventId, event])), [events]);

  const rows = useMemo(() => {
    return activities
      .map((activity) => ({ activity, event: eventById.get(activity.eventId) }))
      .filter(({ activity, event }) => {
        if (!event) return false;
        if (status !== 'ALL' && activity.status !== status) return false;
        if (severity !== 'ALL' && event.severity !== severity) return false;
        if (mine && activity.assigneeUserId !== currentUser) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchPolicy = event.policyId.toLowerCase().includes(q);
          const matchEvent = event.eventId.toLowerCase().includes(q);
          const matchSubject = activity.subject.toLowerCase().includes(q);
          if (!matchPolicy && !matchEvent && !matchSubject) return false;
        }
        return true;
      });
  }, [activities, eventById, status, severity, mine, currentUser, search]);

  const openCount = activities.filter((activity) => activity.status === 'OPEN').length;
  const highCount = activities.filter((a) => {
    const e = eventById.get(a.eventId);
    return e?.severity === 'HIGH' && a.status === 'OPEN';
  }).length;
  const overdueCount = activities.filter((activity) => isOverdue(activity.dueDate, activity.status)).length;
  const verifyCount = activities.filter((a) => {
    const e = eventById.get(a.eventId);
    return Boolean(e?.verifyFirst) && a.status === 'OPEN';
  }).length;

  if (eventsQuery.isLoading || activitiesQuery.isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[300px] text-slate-500 space-y-2">
        <div className="w-5 h-5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium text-slate-500">Loading activities...</p>
      </div>
    );
  }

  if (eventsQuery.isError || activitiesQuery.isError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-xs font-medium">
          Unable to connect to Sentinel server. Verify server is running on port 4000.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6 fade-in max-w-7xl">
      {/* Clean Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-heading font-semibold text-slate-900 tracking-tight">
            Review Activities
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Exposure changes on bound commercial property policies requiring underwriter review.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/simulator')}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm"
          >
            Simulate Signal
          </button>
        </div>
      </div>

      {/* KPI Cards Grid (Linear / Stripe style) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="eds-card p-4">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Open Reviews
          </div>
          <div className="text-2xl font-heading font-semibold text-slate-900 mt-2">
            {openCount}
          </div>
          <div className="text-xs text-slate-400 mt-1">Pending review</div>
        </div>

        <div className="eds-card p-4">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            High Severity
          </div>
          <div className="text-2xl font-heading font-semibold text-slate-900 mt-2">
            {highCount}
          </div>
          <div className="text-xs text-slate-400 mt-1">2-day SLA window</div>
        </div>

        <div className="eds-card p-4">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Overdue
          </div>
          <div className={`text-2xl font-heading font-semibold mt-2 ${overdueCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>
            {overdueCount}
          </div>
          <div className="text-xs text-slate-400 mt-1">Exceeded SLA</div>
        </div>

        <div className="eds-card p-4">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Verify First
          </div>
          <div className="text-2xl font-heading font-semibold text-slate-900 mt-2">
            {verifyCount}
          </div>
          <div className="text-xs text-slate-400 mt-1">&lt;75% entity confidence</div>
        </div>
      </div>

      {/* Activities Table Card */}
      <section className="eds-card overflow-hidden">
        {/* Table Filter Toolbar */}
        <div className="p-3.5 sm:px-4 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Filter by policy # or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-md border border-slate-300 bg-white focus:border-slate-400 text-slate-800"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 cursor-pointer"
              aria-label="Filter severity"
            >
              <option value="ALL">All Severities</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="text-xs border border-slate-300 rounded-md px-2.5 py-1.5 bg-white text-slate-700 cursor-pointer"
              aria-label="Filter status"
            >
              <option value="OPEN">Open Only</option>
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed</option>
            </select>

            <label className="flex items-center gap-1.5 text-xs text-slate-600 border border-slate-300 rounded-md px-2.5 py-1.5 bg-white cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                checked={mine}
                onChange={(e) => setMine(e.target.checked)}
                className="rounded border-slate-300 text-slate-900"
              />
              Mine
            </label>
          </div>
        </div>

        {/* Table Body */}
        {rows.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No activities match your filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="eds-table min-w-[900px]">
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Policy</th>
                  <th>Subject & Details</th>
                  <th>Match Confidence</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Assignee</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ activity, event }) => {
                  if (!event) return null;
                  const overdue = isOverdue(activity.dueDate, activity.status);

                  return (
                    <tr
                      key={activity.activityId}
                      className={overdue ? 'overdue' : ''}
                      onClick={() => navigate(`/events/${event.eventId}`)}
                    >
                      <td>
                        <div className="flex items-center gap-1">
                          <SeverityChip severity={event.severity} />
                          {event.verifyFirst && (
                            <span className="chip chip-verify">Verify</span>
                          )}
                          {event.portfolioBreach && (
                            <span className="chip chip-high">Breach</span>
                          )}
                        </div>
                      </td>

                      <td>
                        <div className="font-medium text-slate-900">
                          {event.policyId}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {event.eventId}
                        </div>
                      </td>

                      <td>
                        <div className="max-w-[340px] truncate font-medium text-slate-800">
                          {activity.subject}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {event.changes.length} change{event.changes.length === 1 ? '' : 's'} &bull; After TIV: {formatMoney(event.after.totalTiv)}
                        </div>
                      </td>

                      <td>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-xs text-slate-700">
                            {Math.round(event.confidence * 100)}%
                          </span>
                          <div className="w-12 h-1 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-slate-700 rounded-full"
                              style={{ width: `${Math.round(event.confidence * 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="chip chip-open">
                          {event.status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td>
                        <div className={overdue ? 'text-red-700 font-semibold' : 'text-slate-700'}>
                          {new Date(activity.dueDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                        {overdue && (
                          <div className="text-[10px] uppercase font-bold text-red-600">
                            Overdue
                          </div>
                        )}
                      </td>

                      <td>
                        <div className="text-xs text-slate-700 font-medium">
                          {activity.assigneeUserId}
                        </div>
                        {activity.seniorFlag && (
                          <span className="text-[10px] text-amber-700">
                            Senior UW Flag
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
