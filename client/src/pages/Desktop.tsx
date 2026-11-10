import React, { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SeverityChip } from '@/components/SeverityChip';
import { useActivities, useEvents } from '@/hooks/useApi';
import { useUserStore } from '@/hooks/useUserStore';
import type { EventRecord } from '@/api/client';

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

const HAZARD_OPTIONS = [
  { value: 'ALL',          label: 'All perils' },
  { value: 'flood',        label: 'Flood' },
  { value: 'earthquake',   label: 'Earthquake' },
  { value: 'tsunami',      label: 'Tsunami' },
  { value: 'cyclone',      label: 'Cyclone / Hurricane' },
  { value: 'wildfire',     label: 'Wildfire' },
  { value: 'landslide',    label: 'Landslide' },
  { value: 'tornado',      label: 'Tornado' },
  { value: 'severe_storm', label: 'Severe storm' },
];

function resolveEventHazard(event: EventRecord): string {
  if (event.hazard) return event.hazard;
  const changeWithHazard = event.changes.find((c) => typeof c.hazard === 'string');
  if (changeWithHazard && typeof changeWithHazard.hazard === 'string') {
    return changeWithHazard.hazard;
  }
  const isFloodChange = event.changes.some((c) =>
    String(c.type ?? '').toLowerCase().includes('flood'),
  );
  if (isFloodChange) return 'flood';
  return 'commercial';
}

export function Desktop(): React.ReactElement {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { userId: currentUser } = useUserStore();
  const eventsQuery = useEvents();
  const activitiesQuery = useActivities();

  const hazardParam = searchParams.get('hazard') ?? 'ALL';
  const severity = searchParams.get('severity') ?? 'ALL';
  const status = searchParams.get('status') ?? 'OPEN';
  const mine = searchParams.get('mine') === 'true';
  const search = searchParams.get('q') ?? '';

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === 'ALL' || !value) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  };

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

        const evHazard = resolveEventHazard(event);
        if (hazardParam !== 'ALL' && evHazard !== hazardParam) return false;

        if (search.trim()) {
          const q = search.toLowerCase();
          const matchPolicy = event.policyId.toLowerCase().includes(q);
          const matchEvent = event.eventId.toLowerCase().includes(q);
          const matchSubject = activity.subject.toLowerCase().includes(q);
          if (!matchPolicy && !matchEvent && !matchSubject) return false;
        }
        return true;
      });
  }, [activities, eventById, status, severity, mine, currentUser, search, hazardParam]);

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
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-4 text-xs font-medium">
          Unable to connect to Sentinel server. Verify server is running on port 4000.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            Underwriter Review Queue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time exposure drift across bound commercial property policies and monitored hazards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/simulator')}
            className="btn-primary"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Simulate signal</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card p-4">
          <div className="text-xs font-medium text-slate-500 mb-2">Open reviews</div>
          <div className="text-2xl font-semibold text-slate-900">{openCount}</div>
          <div className="text-xs text-slate-500 mt-1">Pending underwriter review</div>
        </div>

        <div className="kpi-card p-4">
          <div className="text-xs font-medium text-slate-500 mb-2">High severity</div>
          <div className="text-2xl font-semibold text-slate-900">{highCount}</div>
          <div className="text-xs text-red-700 font-medium mt-1">2 business day SLA</div>
        </div>

        <div className={`kpi-card p-4 ${overdueCount > 0 ? 'kpi-card-danger' : ''}`}>
          <div className="text-xs font-medium text-slate-500 mb-2">Overdue</div>
          <div className={`text-2xl font-semibold ${overdueCount > 0 ? 'text-red-700' : 'text-slate-900'}`}>{overdueCount}</div>
          <div className="text-xs text-slate-500 mt-1">Due date exceeded</div>
        </div>

        <div className="kpi-card p-4">
          <div className="text-xs font-medium text-slate-500 mb-2">Verification gated</div>
          <div className="text-2xl font-semibold text-slate-900">{verifyCount}</div>
          <div className="text-xs text-amber-700 font-medium mt-1">Under 75% match confidence</div>
        </div>
      </div>

      {/* Activities Table Card */}
      <section className="eds-card overflow-hidden">
        {/* Table Filter Toolbar */}
        <div className="p-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-sm relative">
            <input
              type="text"
              placeholder="Search policy #, event, or subject..."
              value={search}
              onChange={(e) => updateParam('q', e.target.value)}
              className="eds-input w-full"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Hazard Peril Filter */}
            <select
              value={hazardParam}
              onChange={(e) => updateParam('hazard', e.target.value)}
              className="eds-select"
              aria-label="Filter peril"
            >
              {HAZARD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Severity Filter */}
            <select
              value={severity}
              onChange={(e) => updateParam('severity', e.target.value)}
              className="eds-select"
              aria-label="Filter severity"
            >
              <option value="ALL">All severities</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => updateParam('status', e.target.value)}
              className="eds-select"
              aria-label="Filter status"
            >
              <option value="OPEN">Open only</option>
              <option value="ALL">All statuses</option>
              <option value="COMPLETED">Completed</option>
            </select>

            <label className="flex items-center gap-1.5 text-xs text-slate-700 border border-slate-200 rounded px-2.5 py-1.5 bg-white cursor-pointer hover:border-slate-300">
              <input
                type="checkbox"
                checked={mine}
                onChange={(e) => updateParam('mine', e.target.checked ? 'true' : 'false')}
                className="rounded border-slate-300 text-blue-600"
              />
              <span>Assigned to me</span>
            </label>
          </div>
        </div>

        {/* Table Body */}
        {rows.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center gap-2 text-center text-slate-500">
            <div className="text-sm font-medium text-slate-700">No review activities match current filters</div>
            <div className="text-xs text-slate-400">Try adjusting peril, severity, or search parameters</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="eds-table min-w-[900px]">
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Peril</th>
                  <th>Policy</th>
                  <th>Activity subject</th>
                  <th>Match</th>
                  <th>Status</th>
                  <th>Due date</th>
                  <th>Assignee</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ activity, event }) => {
                  if (!event) return null;
                  const overdue = isOverdue(activity.dueDate, activity.status);
                  const hazardId = resolveEventHazard(event);
                  const hazardLabel =
                    HAZARD_OPTIONS.find((h) => h.value === hazardId)?.label ?? hazardId;

                  return (
                    <tr
                      key={activity.activityId}
                      className={overdue ? 'overdue' : ''}
                      onClick={() => navigate(`/events/${event.eventId}`)}
                    >
                      <td>
                        <div className="flex items-center gap-1.5">
                          <SeverityChip severity={event.severity} />
                          {event.portfolioBreach && (
                            <span className="chip chip-high">Breach</span>
                          )}
                        </div>
                      </td>

                      <td>
                        <span className="text-xs font-medium text-slate-700 capitalize">
                          {hazardLabel}
                        </span>
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
                        <div className="max-w-[320px] truncate font-medium text-slate-800">
                          {activity.subject}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {event.changes.length} change{event.changes.length === 1 ? '' : 's'}, after TIV {formatMoney(event.after.totalTiv)}
                        </div>
                      </td>

                      <td>
                        <span className="text-xs text-slate-700 font-medium">
                          {Math.round(event.confidence * 100)}%
                        </span>
                      </td>

                      <td>
                        <span className="chip chip-open">
                          {event.status.replace(/_/g, ' ').toLowerCase()}
                        </span>
                      </td>

                      <td>
                        <div className={overdue ? 'text-red-700 font-medium' : 'text-slate-700'}>
                          {new Date(activity.dueDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </div>
                        {overdue && (
                          <span className="text-[10px] text-red-600 font-medium">
                            Overdue
                          </span>
                        )}
                      </td>

                      <td>
                        <div className="text-xs text-slate-700 font-medium">
                          {activity.assigneeUserId}
                        </div>
                        {activity.seniorFlag && (
                          <span className="text-[10px] text-amber-700">
                            Senior referral
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
