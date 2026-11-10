import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useActivities, usePortfolio, useRules } from '@/hooks/useApi';

function IconQueue()     { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>; }
function IconPolicies()  { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>; }
function IconProducts()  { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>; }
function IconPortfolio() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>; }
function IconSimulator() { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>; }
function IconAudit()     { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>; }
function IconRules()     { return <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>; }

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-medium text-slate-500 px-3 mb-1 mt-2">
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
      <aside className="sidebar p-4 bg-slate-50 border-r border-slate-200" aria-label="Contextual sidebar">
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
    <aside className="sidebar hidden md:flex flex-col justify-between p-3 bg-slate-50 border-r border-slate-200 w-60 flex-shrink-0" aria-label="Navigation sidebar">
      <div className="space-y-4">

        {/* Workspace nav */}
        <div className="space-y-1">
          <SectionLabel>Underwriting Workspace</SectionLabel>

          <NavLink to="/desktop" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <IconQueue />
            <span className="flex-1">Review Queue</span>
            <div className="flex items-center gap-1">
              {overdueCount > 0 && (
                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-red-100 text-red-700 border border-red-200">
                  {overdueCount}
                </span>
              )}
              {openCount > 0 && (
                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                  {openCount}
                </span>
              )}
            </div>
          </NavLink>

          <NavLink to="/policies" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <IconPolicies />
            <span>Policies & Locations</span>
          </NavLink>

          <NavLink to="/products" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <IconProducts />
            <span>Product Catalogue</span>
          </NavLink>

          <NavLink to="/portfolio" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <IconPortfolio />
            <span>Portfolio Exposure</span>
          </NavLink>
        </div>

        {/* Verification nav */}
        <div className="space-y-1">
          <SectionLabel>Verification & Controls</SectionLabel>

          <NavLink to="/simulator" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <IconSimulator />
            <span>Signal Simulator</span>
          </NavLink>

          <NavLink to="/audit" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <IconAudit />
            <span>Audit Trail</span>
          </NavLink>

          <NavLink to="/rules" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
            <IconRules />
            <span>Rules Catalogue</span>
          </NavLink>
        </div>

        {/* Portfolio appetite summary widget */}
        <div className="rounded border border-slate-200 bg-white p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-700">SE Flood Appetite</span>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
              isBreached
                ? 'bg-red-50 text-red-700 border-red-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              {isBreached ? 'Breach' : 'Within appetite'}
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <span className={`text-lg font-semibold ${isBreached ? 'text-red-700' : 'text-slate-900'}`}>
              {seSharePct}%
            </span>
            <span className="text-slate-400 text-xs">Cap {seCapPct}%</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-100 rounded overflow-hidden border border-slate-200">
            <div
              className={`h-full transition-all duration-300 ${isBreached ? 'bg-red-600' : 'bg-blue-600'}`}
              style={{ width: `${seProgress}%` }}
            />
          </div>

          <button
            type="button"
            onClick={() => navigate('/portfolio')}
            className="text-xs text-blue-700 hover:text-blue-900 font-medium pt-1 block cursor-pointer"
          >
            Inspect multi-hazard exposure
          </button>
        </div>
      </div>

      {/* System status */}
      <div className="pt-3 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
        <span>Deterministic rules</span>
        <span className="font-mono text-[11px] text-slate-600 bg-slate-200/60 px-1 py-0.5 rounded">
          v{ruleVersion}
        </span>
      </div>
    </aside>
  );
}
