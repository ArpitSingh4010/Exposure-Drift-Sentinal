import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SeverityChip } from '@/components/SeverityChip';
import { useActivities, useEvents } from '@/hooks/useApi';
import { useUserStore } from '@/hooks/useUserStore';

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
  const { userId: currentUser } = useUserStore();
  const eventsQuery = useEvents();
  const activitiesQuery = useActivities();
  const [severity, setSeverity] = useState('ALL');
  const [status, setStatus] = useState('OPEN');
  const [mine, setMine] = useState(false);
  const [search, setSearch] = useState('');

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
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-heading font-bold text-slate-900 tracking-tight">
            Review Queue
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-normal">
            Exposure changes on bound commercial property policies requiring underwriter review.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/simulator')}
            className="btn-primary"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Simulate Signal
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        <div className="kpi-card p-4 slide-up">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Open Reviews</div>
          <div className="text-3xl font-heading font-bold text-slate-900">{openCount}</div>
          <div className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Pending review
          </div>
        </div>

        <div className="kpi-card p-4 slide-up">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">High Severity</div>
          <div className="text-3xl font-heading font-bold text-slate-900">{highCount}</div>
          <div className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            2-day SLA window
          </div>
        </div>

        <div className={`kpi-card p-4 slide-up ${overdueCount > 0 ? 'kpi-card-danger' : ''}`}>
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Overdue</div>
          <div className={`text-3xl font-heading font-bold ${overdueCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>{overdueCount}</div>
          <div className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            SLA exceeded
          </div>
        </div>

        <div className="kpi-card p-4 slide-up">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Verify First</div>
          <div className="text-3xl font-heading font-bold text-slate-900">{verifyCount}</div>
          <div className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            &lt;75% confidence
          </div>
        </div>
      </div>

      {/* Activities Table Card */}
      <section className="eds-card overflow-hidden">
        {/* Table Filter Toolbar */}
        <div className="p-3.5 sm:px-4 border-b border-slate-100/80 bg-white/60 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-sm relative">
            <svg className="absolute left-3 w-3.5 h-3.5 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Filter by policy # or subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="eds-input w-full pl-9"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="eds-select"
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
              className="eds-select"
              aria-label="Filter status"
            >
              <option value="OPEN">Open Only</option>
              <option value="ALL">All Statuses</option>
              <option value="COMPLETED">Completed</option>
            </select>

            <label className="flex items-center gap-1.5 text-xs text-slate-600 border border-slate-200 rounded-xl px-2.5 py-2 bg-white/80 cursor-pointer hover:border-slate-300 hover:bg-white transition-all">
              <input
                type="checkbox"
                checked={mine}
                onChange={(e) => setMine(e.target.checked)}
                className="rounded border-slate-300 text-slate-900"
              />
              Mine only
            </label>
          </div>
        </div>

        {/* Table Body */}
        {rows.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-700">No activities found</div>
              <div className="text-xs text-slate-400 mt-1">Try adjusting your filters or simulate a new signal</div>
            </div>
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
