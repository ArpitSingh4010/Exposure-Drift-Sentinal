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
      <div className="p-8 flex flex-col items-center justify-center min-h-[300px] text-slate-500 space-y-3">
        <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Loading underwriter activities...</p>
      </div>
    );
  }

  if (eventsQuery.isError || activitiesQuery.isError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-5 shadow-sm">
          <div className="font-semibold text-base">Unable to connect to Sentinel API</div>
          <p className="text-sm mt-1 text-red-600">Please verify the server is running on port 4000.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 eds-canvas min-h-full space-y-6 fade-in">
      {/* Header Banner */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200">
              Guidewire PolicyCenter Triage
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-medium">Auto-Ingest Active</span>
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-slate-900 mt-1 tracking-tight">
            My Activities
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Commercial property exposure changes requiring underwriting review, re-rating referral, or bound schedule updates.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/simulator')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-glow hover:opacity-95 transition-all transform hover:-translate-y-0.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Trigger Signal Simulator
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-in">
        <div className="eds-card p-5 relative overflow-hidden group hover:border-teal-300">
          <div className="flex items-center justify-between">
            <span className="eds-label">Open Review Queue</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-heading font-extrabold text-slate-900">{openCount}</span>
            <span className="text-xs text-slate-500 font-medium">pending decision</span>
          </div>
          <div className="mt-3 text-[11px] text-teal-700 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
            Requires human action
          </div>
        </div>

        <div className="eds-card p-5 relative overflow-hidden group hover:border-red-300">
          <div className="flex items-center justify-between">
            <span className="eds-label text-red-600">High Severity</span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-heading font-extrabold text-red-600">{highCount}</span>
            <span className="text-xs text-red-700/80 font-medium">escalated</span>
          </div>
          <div className="mt-3 text-[11px] text-red-700 font-medium flex items-center gap-1">
            <span className="pulse-dot pulse-dot-red" />
            2-day SLA window
          </div>
        </div>

        <div className={`eds-card p-5 relative overflow-hidden group ${overdueCount > 0 ? 'border-red-300 bg-red-50/20' : 'hover:border-amber-300'}`}>
          <div className="flex items-center justify-between">
            <span className="eds-label text-amber-700">Overdue SLA</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold text-xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-3xl font-heading font-extrabold ${overdueCount > 0 ? 'text-red-700' : 'text-slate-900'}`}>{overdueCount}</span>
            <span className="text-xs text-slate-500 font-medium">breached SLA</span>
          </div>
          <div className="mt-3 text-[11px] text-amber-700 font-medium flex items-center gap-1">
            <span className="pulse-dot pulse-dot-amber" />
            Priority escalation
          </div>
        </div>

        <div className="eds-card p-5 relative overflow-hidden group hover:border-slate-400">
          <div className="flex items-center justify-between">
            <span className="eds-label">Verify First</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-heading font-extrabold text-slate-800">{verifyCount}</span>
            <span className="text-xs text-slate-500 font-medium">&lt; 75% confidence</span>
          </div>
          <div className="mt-3 text-[11px] text-slate-600 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Confirm entity match
          </div>
        </div>
      </div>

      {/* Main Review Queue Table Card */}
      <section className="eds-card overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 sm:px-6 sm:py-4 border-b border-slate-200/80 bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search policy, event, or insured..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 w-64 bg-slate-50 focus:bg-white transition-all focus:border-teal-500"
              />
              <svg
                className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              Showing <strong>{rows.length}</strong> activities
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 p-1 rounded-lg border border-slate-200">
              <span className="text-[11px] font-bold text-slate-400 uppercase px-1.5">Filters:</span>
              <select
                value={severity}
                onChange={(event) => setSeverity(event.target.value)}
                className="text-xs border-0 bg-transparent py-1 pl-1 pr-6 font-semibold text-slate-700 cursor-pointer focus:ring-0"
                aria-label="Filter severity"
              >
                <option value="ALL">All Severities</option>
                <option value="HIGH">High Severity</option>
                <option value="MEDIUM">Medium Severity</option>
                <option value="LOW">Low Severity</option>
              </select>

              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="text-xs border-0 bg-transparent py-1 pl-1 pr-6 font-semibold text-slate-700 cursor-pointer focus:ring-0"
                aria-label="Filter status"
              >
                <option value="OPEN">Open Only</option>
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>

            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={mine}
                onChange={(event) => setMine(event.target.checked)}
                className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
              />
              Assigned to Me
            </label>
          </div>
        </div>

        {/* Table Body */}
        {rows.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-800">No activities match your filters</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your severity or status filters, or trigger a new scenario in the Signal Simulator.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="eds-table min-w-[960px]">
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Policy & Event</th>
                  <th>Subject & Exposure Change</th>
                  <th>Entity Confidence</th>
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
                        <div className="flex items-center gap-1.5">
                          <SeverityChip severity={event.severity} />
                          {event.verifyFirst && (
                            <span className="chip chip-verify">Verify</span>
                          )}
                          {event.portfolioBreach && (
                            <span className="chip chip-high animate-pulse">Breach</span>
                          )}
                        </div>
                      </td>

                      <td>
                        <div className="font-heading font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                          {event.policyId}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          {event.eventId}
                        </div>
                      </td>

                      <td>
                        <div className="max-w-[340px] truncate font-semibold text-slate-800">
                          {activity.subject}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-medium">
                            {event.changes.length} {event.changes.length === 1 ? 'change' : 'changes'}
                          </span>
                          <span>&bull;</span>
                          <span>After TIV: <strong>{formatMoney(event.after.totalTiv)}</strong></span>
                        </div>
                      </td>

                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-teal-400 to-cyan-500 rounded-full"
                              style={{ width: `${Math.round(event.confidence * 100)}%` }}
                            />
                          </div>
                          <span className="font-heading font-bold text-xs text-slate-700">
                            {Math.round(event.confidence * 100)}%
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="chip chip-open">
                          {event.status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td>
                        <div className={overdue ? 'text-red-700 font-bold' : 'text-slate-700 font-semibold'}>
                          {new Date(activity.dueDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                        {overdue ? (
                          <div className="text-[10px] uppercase font-bold text-red-600 tracking-wider">
                            SLA Overdue
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-400">Within window</div>
                        )}
                      </td>

                      <td>
                        <div className="font-medium text-slate-800 text-xs flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                            {activity.assigneeUserId.slice(-1)}
                          </span>
                          {activity.assigneeUserId}
                        </div>
                        {activity.seniorFlag && (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1 rounded">
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
