import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useActivities, usePortfolio, useRules } from '@/hooks/useApi';

type NavItem = { label: string; path: string; icon: () => React.ReactElement };

function Ico({ d }: { d: string }): React.ReactElement {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const NAV_SECTIONS: Array<{ heading: string; items: NavItem[] }> = [
  {
    heading: 'Workspace',
    items: [
      {
        label: 'Review Queue',
        path: '/desktop',
        icon: () => <Ico d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
      },
      {
        label: 'Policies',
        path: '/policies',
        icon: () => <Ico d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
      },
      {
        label: 'Product Catalogue',
        path: '/products',
        icon: () => <Ico d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />,
      },
      {
        label: 'Portfolio',
        path: '/portfolio',
        icon: () => <Ico d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
      },
    ],
  },
  {
    heading: 'Tools',
    items: [
      {
        label: 'Simulator',
        path: '/simulator',
        icon: () => <Ico d="M13 10V3L4 14h7v7l9-11h-7z" />,
      },
      {
        label: 'Audit Trail',
        path: '/audit',
        icon: () => <Ico d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
      },
      {
        label: 'Rules',
        path: '/rules',
        icon: () => <Ico d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />,
      },
    ],
  },
];

export function Sidebar({ children }: { children?: React.ReactNode }): React.ReactElement {
  const navigate = useNavigate();
  const activitiesQuery = useActivities();
  const portfolioQuery = usePortfolio();
  const rulesQuery = useRules();

  if (children) {
    return (
      <aside className="sidebar p-3" aria-label="Contextual sidebar">
        {children}
      </aside>
    );
  }

  const activities = activitiesQuery.data ?? [];
  const openCount = activities.filter((a) => a.status === 'OPEN').length;
  const overdueCount = activities.filter(
    (a) => a.status === 'OPEN' && new Date(a.dueDate).getTime() < Date.now()
  ).length;

  const portfolio = portfolioQuery.data;
  const seRegion = portfolio?.regions.find((r) => r.region === 'South-East');
  const isBreached = Boolean(seRegion?.breach);
  const seSharePct = seRegion ? (seRegion.share * 100).toFixed(2) : '19.70';
  const seCapPct = seRegion ? (seRegion.cap * 100).toFixed(0) : '20';
  const seProgress = Math.min((Number(seSharePct) / Number(seCapPct)) * 100, 100);

  const ruleVersion = rulesQuery.data?.version?.slice(0, 8) ?? '—';

  return (
    <aside
      className="sidebar hidden md:flex flex-col"
      style={{ width: '216px' }}
      aria-label="Navigation sidebar"
    >
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.heading}>
            <div
              className="section-label"
              style={{ padding: '0 0.375rem', marginBottom: '0.25rem' }}
            >
              {section.heading}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isQueue = item.path === '/desktop';
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
                  >
                    <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                      <item.icon />
                    </span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {isQueue && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {overdueCount > 0 && (
                          <span style={{
                            fontSize: '0.6rem',
                            fontWeight: 600,
                            padding: '0.0625rem 0.3125rem',
                            borderRadius: '2px',
                            backgroundColor: 'var(--risk-high-bg)',
                            color: 'var(--risk-high-text)',
                            border: '1px solid var(--risk-high-border)',
                          }}>
                            {overdueCount}
                          </span>
                        )}
                        {openCount > 0 && (
                          <span style={{
                            fontSize: '0.6rem',
                            fontWeight: 500,
                            padding: '0.0625rem 0.3125rem',
                            borderRadius: '2px',
                            backgroundColor: 'var(--surface-active)',
                            color: 'var(--text-muted)',
                          }}>
                            {openCount}
                          </span>
                        )}
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Appetite Snapshot Widget */}
      <div style={{
        margin: '0.5rem 0.5rem 0.5rem',
        padding: '0.75rem',
        border: '1px solid var(--border)',
        borderRadius: '5px',
        backgroundColor: 'var(--surface)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
            SE Flood
          </span>
          <span style={{
            fontSize: '0.6rem',
            fontWeight: 600,
            padding: '0.1rem 0.375rem',
            borderRadius: '2px',
            backgroundColor: isBreached ? 'var(--risk-high-bg)' : 'var(--risk-low-bg)',
            color: isBreached ? 'var(--risk-high-text)' : 'var(--risk-low-text)',
            border: `1px solid ${isBreached ? 'var(--risk-high-border)' : 'var(--risk-low-border)'}`,
          }}>
            {isBreached ? 'Breached' : 'OK'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
          <span style={{
            fontSize: '1rem',
            fontWeight: 600,
            color: isBreached ? 'var(--risk-high-text)' : 'var(--text-primary)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {seSharePct}%
          </span>
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
            cap {seCapPct}%
          </span>
        </div>

        <div className="progress-track" style={{ marginBottom: '0.5rem' }}>
          <div
            className={`progress-fill${isBreached ? ' progress-fill-danger' : ''}`}
            style={{ width: `${seProgress}%` }}
          />
        </div>

        <button
          type="button"
          onClick={() => navigate('/portfolio')}
          style={{
            fontSize: '0.6875rem',
            color: 'var(--green-primary)',
            fontWeight: 500,
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            padding: 0,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.textDecoration = 'underline'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.textDecoration = 'none'; }}
        >
          View all hazards
        </button>
      </div>

      {/* Rule engine version */}
      <div style={{
        padding: '0.5rem 0.75rem',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Rules</span>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.6875rem',
          color: 'var(--text-secondary)',
          backgroundColor: 'var(--surface-subtle)',
          padding: '0.125rem 0.375rem',
          borderRadius: '3px',
          border: '1px solid var(--border)',
        }}>
          v{ruleVersion}
        </span>
      </div>
    </aside>
  );
}
