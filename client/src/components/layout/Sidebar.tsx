import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useActivities, usePortfolio, useRules } from '@/hooks/useApi';

// ── Nav icon helpers ────────────────────────────────────────────────────────
function IconQueue()     { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>; }
function IconPolicies()  { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>; }
function IconPortfolio() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>; }
function IconSimulator() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>; }
function IconAudit()     { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function IconRules()     { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>; }

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 mb-1.5 mt-1">
      {children}
    </div>
  );
}

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
  const overdueCount = activities.filter(
    (a) => a.status === 'OPEN' && new Date(a.dueDate).getTime() < Date.now()
  ).length;

  const portfolio = portfolioQuery.data;
  const seRegion = portfolio?.regions.find((r) => r.region === 'South-East');
  const isBreached = Boolean(seRegion?.breach);
  const seSharePct = seRegion ? (seRegion.share * 100).toFixed(2) : '19.70';
  const seCapPct   = seRegion ? (seRegion.cap  * 100).toFixed(0)  : '20';
  const seProgress = Math.min((Number(seSharePct) / Number(seCapPct)) * 100, 100);

  const ruleVersion = rulesQuery.data?.version?.slice(0, 8) ?? '3e137490';

  return (
    <aside className="sidebar hidden md:flex flex-col justify-between p-3" aria-label="Navigation sidebar">
      <div className="space-y-5">

        {/* Workspace nav */}
        <div className="space-y-0.5">
          <SectionLabel>Workspace</SectionLabel>

          <NavLink to="/desktop" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <IconQueue />
            <span className="flex-1">Review Queue</span>
            <div className="flex items-center gap-1">
              {overdueCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">
                  {overdueCount}
                </span>
              )}
              {openCount > 0 && (
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-200/80 text-slate-600">
                  {openCount}
                </span>
              )}
            </div>
          </NavLink>

          <NavLink to="/policies"  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <IconPolicies />
            Policies & Locations
          </NavLink>

          <NavLink to="/portfolio" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <IconPortfolio />
            Portfolio Exposure
          </NavLink>
        </div>

        {/* Tools nav */}
        <div className="space-y-0.5">
          <SectionLabel>Verification</SectionLabel>

          <NavLink to="/simulator" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <IconSimulator />
            Signal Simulator
          </NavLink>

          <NavLink to="/audit"     className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <IconAudit />
            Audit Trail
          </NavLink>

          <NavLink to="/rules"     className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <IconRules />
            Rules Catalog
          </NavLink>
        </div>

        {/* Portfolio widget */}
        <div className="rounded-xl border border-slate-200/80 overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)' }}>
          <div className="px-3 py-2.5 border-b border-slate-200/60">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700">SE Flood Exposure</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                isBreached
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              }`}>
                {isBreached ? '⚠ Breach' : '✓ In Appetite'}
              </span>
            </div>
          </div>

          <div className="px-3 py-2.5 space-y-2">
            <div className="flex items-baseline justify-between">
              <span className={`text-xl font-heading font-bold ${isBreached ? 'text-red-600' : 'text-slate-900'}`}>
                {seSharePct}%
              </span>
              <span className="text-slate-400 text-[11px]">cap {seCapPct}%</span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${isBreached ? 'bg-red-500' : ''}`}
                style={{
                  width: `${seProgress}%`,
                  background: isBreached
                    ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                    : 'linear-gradient(90deg, #00c7b8, #3b82f6)',
                }}
              />
            </div>

            <button
              onClick={() => navigate('/portfolio')}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1"
            >
              View breakdown
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* System status */}
      <div className="pt-3 border-t border-slate-200/70 space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <span className="status-dot status-dot-green" />
            System Live
          </span>
          <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
            v{ruleVersion}
          </span>
        </div>
      </div>
    </aside>
  );
}
