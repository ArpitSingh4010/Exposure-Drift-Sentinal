import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useActivities, usePortfolio, useRules } from '@/hooks/useApi';

export function Sidebar({ children }: { children?: React.ReactNode }): React.ReactElement {
  const navigate = useNavigate();
  const portfolioQuery = usePortfolio();
  const activitiesQuery = useActivities();
  const rulesQuery = useRules();

  if (children) {
    return (
      <aside className="sidebar p-4" aria-label="Contextual sidebar">
        {children}
      </aside>
    );
  }

  const activities = activitiesQuery.data ?? [];
  const openCount = activities.filter((a) => a.status === 'OPEN').length;

  const portfolio = portfolioQuery.data;
  const seRegion = portfolio?.regions.find((r) => r.region === 'South-East');
  const isBreached = Boolean(seRegion?.breach);
  const seSharePct = seRegion ? (seRegion.share * 100).toFixed(2) : '19.70';
  const seCapPct = seRegion ? (seRegion.cap * 100).toFixed(0) : '20';

  const ruleVersion = rulesQuery.data?.version?.slice(0, 8) ?? '3e137490';

  return (
    <aside className="sidebar hidden md:flex flex-col justify-between p-4 bg-white border-r border-slate-200" aria-label="Navigation sidebar">
      <div className="space-y-6">
        {/* Navigation Section */}
        <div className="space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 mb-2">
            Workspace
          </div>

          <NavLink
            to="/desktop"
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <span className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Review Queue
            </span>
            {openCount > 0 && (
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
                {openCount}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/policies"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Policies & Locations
          </NavLink>

          <NavLink
            to="/portfolio"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Portfolio Exposure
          </NavLink>
        </div>

        {/* Tools Section */}
        <div className="space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 mb-2">
            Verification
          </div>

          <NavLink
            to="/simulator"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Signal Simulator
          </NavLink>

          <NavLink
            to="/audit"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Audit Trail
          </NavLink>

          <NavLink
            to="/rules"
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            Rules Catalog
          </NavLink>
        </div>

        {/* Clean Portfolio Monitor Widget */}
        <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
            <span>SE Flood Exposure</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${isBreached ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-700'}`}>
              {isBreached ? 'Breach' : 'In Appetite'}
            </span>
          </div>

          <div className="flex items-baseline justify-between text-xs">
            <span className={`text-base font-bold ${isBreached ? 'text-red-600' : 'text-slate-900'}`}>
              {seSharePct}%
            </span>
            <span className="text-slate-500 text-[11px]">Cap: {seCapPct}%</span>
          </div>

          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${isBreached ? 'bg-red-500' : 'bg-slate-700'}`}
              style={{ width: `${Math.min((Number(seSharePct) / Number(seCapPct)) * 100, 100)}%` }}
            />
          </div>

          <button
            onClick={() => navigate('/portfolio')}
            className="text-[11px] font-medium text-slate-600 hover:text-slate-900 pt-0.5 block"
          >
            View portfolio breakdown &rarr;
          </button>
        </div>
      </div>

      {/* System Status info */}
      <div className="pt-3 border-t border-slate-200 text-[11px] text-slate-500 space-y-1">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="status-dot status-dot-green" />
            System Live
          </span>
          <span className="font-mono text-[10px] text-slate-400">v{ruleVersion}</span>
        </div>
      </div>
    </aside>
  );
}
