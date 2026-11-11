import React, { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SeverityChip } from '@/components/SeverityChip';
import { useActivities, useEvents } from '@/hooks/useApi';
import { useUserStore } from '@/hooks/useUserStore';
import type { EventRecord } from '@/api/client';

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
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
  { value: 'severe_storm', label: 'Severe Storm' },
];

function resolveEventHazard(event: EventRecord): string {
  if (event.hazard) return event.hazard;
  const changeWithHazard = event.changes.find((c) => typeof c.hazard === 'string');
  if (changeWithHazard && typeof changeWithHazard.hazard === 'string') return changeWithHazard.hazard;
  const isFloodChange = event.changes.some((c) => String(c.type ?? '').toLowerCase().includes('flood'));
  if (isFloodChange) return 'flood';
  return 'property';
}

const USERS: Record<string, string> = {
  'USR-001': 'P. Sharma',
  'USR-002': 'M. Williams',
  'USR-003': 'Admin',
  'USR-004': 'A. Patel',
  'USR-005': 'D. Torres',
};

export function Desktop(): React.ReactElement {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { userId: currentUser } = useUserStore();
  const eventsQuery = useEvents();
  const activitiesQuery = useActivities();

  const hazardParam = searchParams.get('hazard') ?? 'ALL';
  const severity    = searchParams.get('severity') ?? 'ALL';
  const status      = searchParams.get('status') ?? 'OPEN';
  const mine        = searchParams.get('mine') === 'true';
  const search      = searchParams.get('q') ?? '';

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'ALL') next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  const events = eventsQuery.data ?? [];
  const activities = activitiesQuery.data ?? [];
  const eventById = useMemo(() => new Map(events.map((e) => [e.eventId, e])), [events]);

  const rows = useMemo(() =>
    activities
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
          if (!event.policyId.toLowerCase().includes(q) &&
              !event.eventId.toLowerCase().includes(q) &&
              !activity.subject.toLowerCase().includes(q)) return false;
        }
        return true;
      }),
    [activities, eventById, status, severity, mine, currentUser, search, hazardParam]
  );

  const openCount    = activities.filter((a) => a.status === 'OPEN').length;
  const highCount    = activities.filter((a) => { const e = eventById.get(a.eventId); return e?.severity === 'HIGH' && a.status === 'OPEN'; }).length;
  const overdueCount = activities.filter((a) => isOverdue(a.dueDate, a.status)).length;
  const verifyCount  = activities.filter((a) => { const e = eventById.get(a.eventId); return Boolean(e?.verifyFirst) && a.status === 'OPEN'; }).length;

  if (eventsQuery.isLoading || activitiesQuery.isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <div className="spinner" />
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Loading activities…</span>
        </div>
      </div>
    );
  }

  if (eventsQuery.isError || activitiesQuery.isError) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div style={{
          padding: '0.875rem 1rem',
          backgroundColor: 'var(--risk-high-bg)',
          border: '1px solid var(--risk-high-border)',
          borderRadius: '5px',
          fontSize: '0.8125rem',
          color: 'var(--risk-high-text)',
        }}>
          Unable to connect to Sentinel server. Verify server is running on port 4000.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Page header */}
      <div style={{
        padding: '1.125rem 1.5rem 0',
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h1 className="page-title">Review Queue</h1>
            <p className="page-desc">
              Exposure drift events requiring underwriter review.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/simulator')}
            className="btn-secondary"
            style={{ marginTop: '0.125rem', fontSize: '0.8125rem' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Simulate
          </button>
        </div>

        {/* KPI strip — inline, not cards */}
        <div className="kpi-strip" style={{ marginBottom: '1rem' }}>
          <div className="kpi-strip-item">
            <div className="kpi-label">Open</div>
            <div className="kpi-value">{openCount}</div>
            <div className="kpi-sub">pending review</div>
          </div>
          <div className="kpi-strip-item">
            <div className="kpi-label">High severity</div>
            <div className="kpi-value" style={{ color: highCount > 0 ? 'var(--risk-high-text)' : undefined }}>
              {highCount}
            </div>
            <div className="kpi-sub" style={{ color: 'var(--risk-med-text)' }}>2-day SLA</div>
          </div>
          <div className="kpi-strip-item">
            <div className="kpi-label">Overdue</div>
            <div className="kpi-value" style={{ color: overdueCount > 0 ? 'var(--risk-high-text)' : undefined }}>
              {overdueCount}
            </div>
            <div className="kpi-sub">SLA exceeded</div>
          </div>
          <div className="kpi-strip-item">
            <div className="kpi-label">Verify-first</div>
            <div className="kpi-value">{verifyCount}</div>
            <div className="kpi-sub">confidence &lt; 75%</div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        {/* Search */}
        <div style={{ position: 'relative', flex: '0 1 240px' }}>
          <svg
            width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ position: 'absolute', left: '0.5625rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', pointerEvents: 'none' }}
          >
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Policy, event ID, or subject…"
            value={search}
            onChange={(e) => updateParam('q', e.target.value)}
            className="field-input"
            style={{ paddingLeft: '1.875rem', width: '100%' }}
          />
        </div>

        {/* Filters */}
        <select value={hazardParam} onChange={(e) => updateParam('hazard', e.target.value)} className="field-select" style={{ width: 'auto' }}>
          {HAZARD_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>

        <select value={severity} onChange={(e) => updateParam('severity', e.target.value)} className="field-select" style={{ width: 'auto' }}>
          <option value="ALL">All severities</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <select value={status} onChange={(e) => updateParam('status', e.target.value)} className="field-select" style={{ width: 'auto' }}>
          <option value="OPEN">Open only</option>
          <option value="ALL">All statuses</option>
          <option value="COMPLETED">Completed</option>
        </select>

        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.8125rem',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          userSelect: 'none',
        }}>
          <input
            type="checkbox"
            checked={mine}
            onChange={(e) => updateParam('mine', e.target.checked ? 'true' : 'false')}
            style={{ accentColor: 'var(--green-primary)' }}
          />
          Assigned to me
        </label>

        {/* Result count */}
        <div style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {rows.length} {rows.length === 1 ? 'result' : 'results'}
        </div>
      </div>

      {/* Table */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {rows.length === 0 ? (
          <div className="empty-state">
            <div className="empty-title">No matching review activities</div>
            <div className="empty-desc">Adjust filters or run a simulation to generate events.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ minWidth: '860px' }}>
              <thead>
                <tr>
                  <th style={{ width: '110px' }}>Severity</th>
                  <th style={{ width: '110px' }}>Peril</th>
                  <th style={{ width: '130px' }}>Policy</th>
                  <th>Subject</th>
                  <th style={{ width: '70px', textAlign: 'right' }}>Match</th>
                  <th style={{ width: '90px' }}>Status</th>
                  <th style={{ width: '90px' }}>Due</th>
                  <th style={{ width: '110px' }}>Assignee</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(({ activity, event }) => {
                  if (!event) return null;
                  const overdue = isOverdue(activity.dueDate, activity.status);
                  const hazardId = resolveEventHazard(event);
                  const hazardLabel = HAZARD_OPTIONS.find((h) => h.value === hazardId)?.label ?? hazardId;
                  const dueDate = new Date(activity.dueDate);
                  const dueDateStr = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                  return (
                    <tr
                      key={activity.activityId}
                      className={`row-clickable${overdue ? ' row-alert' : ''}`}
                      onClick={() => navigate(`/events/${event.eventId}`)}
                    >
                      {/* Severity */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                          <SeverityChip severity={event.severity} />
                          {event.portfolioBreach && (
                            <span className="badge badge-high" style={{ fontSize: '0.5625rem', padding: '0.0625rem 0.25rem' }}>
                              Breach
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Peril */}
                      <td>
                        <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                          {hazardLabel}
                        </span>
                      </td>

                      {/* Policy */}
                      <td>
                        <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.8125rem' }}>
                          {event.policyId}
                        </div>
                        <div className="mono-id" style={{ fontSize: '0.6875rem', marginTop: '0.0625rem' }}>
                          {event.eventId}
                        </div>
                      </td>

                      {/* Subject */}
                      <td style={{ maxWidth: '340px' }}>
                        <div style={{
                          fontWeight: 500,
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: '0.8125rem',
                        }}>
                          {activity.subject}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.0625rem' }}>
                          {event.changes.length} change{event.changes.length !== 1 ? 's' : ''} · TIV {formatMoney(event.after.totalTiv)}
                        </div>
                      </td>

                      {/* Match confidence */}
                      <td style={{ textAlign: 'right' }}>
                        <span style={{
                          fontVariantNumeric: 'tabular-nums',
                          fontSize: '0.8125rem',
                          fontWeight: 500,
                          color: event.confidence >= 0.75 ? 'var(--text-secondary)' : 'var(--risk-med-text)',
                        }}>
                          {Math.round(event.confidence * 100)}%
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <span style={{
                          fontSize: '0.6875rem',
                          color: 'var(--text-muted)',
                          textTransform: 'capitalize',
                        }}>
                          {event.status.replace(/_/g, ' ').toLowerCase()}
                        </span>
                      </td>

                      {/* Due date */}
                      <td>
                        <span style={{
                          fontSize: '0.8125rem',
                          fontVariantNumeric: 'tabular-nums',
                          color: overdue ? 'var(--risk-high-text)' : 'var(--text-secondary)',
                          fontWeight: overdue ? 500 : 400,
                        }}>
                          {dueDateStr}
                        </span>
                        {overdue && (
                          <div style={{ fontSize: '0.625rem', color: 'var(--risk-high-text)', fontWeight: 600, letterSpacing: '0.03em' }}>
                            OVERDUE
                          </div>
                        )}
                      </td>

                      {/* Assignee */}
                      <td>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {USERS[activity.assigneeUserId] ?? activity.assigneeUserId}
                        </div>
                        {activity.seniorFlag && (
                          <div style={{ fontSize: '0.625rem', color: 'var(--risk-med-text)', fontWeight: 500 }}>
                            Senior referral
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
