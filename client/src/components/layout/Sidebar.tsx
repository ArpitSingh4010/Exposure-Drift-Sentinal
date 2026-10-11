import React from 'react';
import { useNavigate } from 'react-router-dom';
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
  const overdueCount = activities.filter(
    (a) => a.status === 'OPEN' && new Date(a.dueDate).getTime() < Date.now(),
  ).length;

  const portfolio = portfolioQuery.data;
  const seRegion = portfolio?.regions.find((r) => r.region === 'South-East');
  const isBreached = Boolean(seRegion?.breach);
  const seSharePct = seRegion ? (seRegion.share * 100).toFixed(2) : '19.70';
  const seCapPct = seRegion ? (seRegion.cap * 100).toFixed(0) : '20';

  const ruleVersion = rulesQuery.data?.version?.slice(0, 8) ?? '3e137490';

  return (
    <aside className="sidebar hidden md:flex flex-col justify-between p-4 bg-slate-50/70 border-r border-slate-200" aria-label="Sentinel Command Hub">
      <div className="space-y-5">
        {/* Hub Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span className="pulse-dot pulse-dot-green" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Sentinel Live
            </span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold">
            v{ruleVersion}
          </span>
        </div>

        {/* Portfolio Live Watcher */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              SE Flood Share
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isBreached ? 'bg-red-100 text-red-700' : 'bg-teal-100 text-teal-700'}`}>
              {isBreached ? 'BREACH' : 'IN CAP'}
            </span>
          </div>

          <div className="flex items-baseline justify-between">
            <span className={`text-xl font-heading font-extrabold ${isBreached ? 'text-red-600' : 'text-slate-900'}`}>
              {seSharePct}%
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Cap: {seCapPct}%
            </span>
          </div>

          {/* Mini progress bar */}
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden relative">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isBreached ? 'bg-gradient-to-r from-amber-500 to-red-600' : 'bg-gradient-to-r from-teal-400 to-cyan-500'}`}
              style={{ width: `${Math.min((Number(seSharePct) / Number(seCapPct)) * 100, 100)}%` }}
            />
          </div>

          <button
            onClick={() => navigate('/portfolio')}
            className="w-full text-center text-[11px] font-semibold text-teal-700 hover:text-teal-900 pt-1 block"
          >
            View Exposure Map &rarr;
          </button>
        </div>

        {/* Quick Triage Counters */}
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
            Activity Watch
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => navigate('/desktop')}
              className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-sm text-left hover:border-teal-400 transition-all group"
            >
              <div className="text-[10px] font-semibold text-slate-500 uppercase">Open</div>
              <div className="text-lg font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                {openCount}
              </div>
            </button>
            <button
              onClick={() => navigate('/desktop')}
              className={`p-2.5 rounded-lg bg-white border shadow-sm text-left transition-all group ${overdueCount > 0 ? 'border-red-200 bg-red-50/30' : 'border-slate-200'}`}
            >
              <div className={`text-[10px] font-semibold uppercase ${overdueCount > 0 ? 'text-red-600' : 'text-slate-500'}`}>Overdue</div>
              <div className={`text-lg font-bold group-hover:text-red-700 transition-colors ${overdueCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>
                {overdueCount}
              </div>
            </button>
          </div>
        </div>

        {/* Quick Tools */}
        <div className="space-y-2 pt-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
            Simulate & Audit
          </p>
          <button
            onClick={() => navigate('/simulator')}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-teal-50 hover:border-teal-300 hover:text-teal-800 transition-all shadow-sm"
          >
            <span className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
              Signal Simulator
            </span>
            <span className="text-[10px] px-1 rounded bg-teal-100 text-teal-700 font-bold">6 tests</span>
          </button>
          <button
            onClick={() => navigate('/audit')}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all shadow-sm"
          >
            <span className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Audit Stream
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Engine Badge */}
      <div className="pt-4 border-t border-slate-200 text-[11px] text-slate-500 space-y-1">
        <div className="flex items-center justify-between">
          <span>Replica Set</span>
          <span className="font-semibold text-emerald-600">Connected</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Appetite Cap</span>
          <span className="font-semibold text-slate-700">20% Regional</span>
        </div>
      </div>
    </aside>
  );
}
