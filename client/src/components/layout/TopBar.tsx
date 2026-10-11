import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useUserStore } from '@/hooks/useUserStore';

interface TabItem {
  label: string;
  path: string;
  icon: (props: { className?: string }) => React.ReactElement;
}

const TABS: TabItem[] = [
  {
    label: 'Desktop',
    path: '/desktop',
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    label: 'Policies',
    path: '/policies',
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    label: 'Portfolio',
    path: '/portfolio',
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    label: 'Simulator',
    path: '/simulator',
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    label: 'Audit',
    path: '/audit',
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: 'Rules',
    path: '/rules',
    icon: ({ className }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
];

const PLACEHOLDER_USERS = [
  { id: 'USR-001', name: 'Priya Sharma',    role: 'Underwriter',        color: 'from-teal-500 to-cyan-500' },
  { id: 'USR-002', name: 'Marcus Williams', role: 'Senior Underwriter', color: 'from-amber-500 to-orange-500' },
  { id: 'USR-003', name: 'Admin User',      role: 'Admin',              color: 'from-purple-500 to-indigo-500' },
  { id: 'USR-004', name: 'Aisha Patel',     role: 'Underwriter',        color: 'from-emerald-500 to-teal-500' },
  { id: 'USR-005', name: 'Devon Torres',    role: 'Underwriter',        color: 'from-blue-500 to-cyan-500' },
];

export function TopBar(): React.ReactElement {
  const { userId, setUserId } = useUserStore();
  const navigate = useNavigate();

  const activeUser = PLACEHOLDER_USERS.find((u) => u.id === userId) ?? PLACEHOLDER_USERS[0]!;

  useEffect(() => {
    if (!userId) setUserId(PLACEHOLDER_USERS[0]!.id);
  }, [setUserId, userId]);

  return (
    <header className="topbar sticky top-0 z-40 relative backdrop-blur-md">
      {/* Radiant accent line along bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-teal-400 via-cyan-400 to-blue-500 opacity-80" />

      {/* Brand logo & title */}
      <button
        className="flex items-center gap-3 mr-6 flex-shrink-0 group focus:outline-none text-left"
        onClick={() => navigate('/desktop')}
        aria-label="Go to Desktop"
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600 p-0.5 shadow-glow flex items-center justify-center transition-transform group-hover:scale-105">
          <div className="w-full h-full bg-navy-950 rounded-[10px] flex items-center justify-center">
            <svg
              className="w-5 h-5 text-teal-400"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V6l-9-4z" />
            </svg>
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-heading font-bold text-[15px] tracking-tight text-white whitespace-nowrap">
              Exposure Drift Sentinel
            </span>
            <span className="hidden xl:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-teal-500/15 text-teal-300 border border-teal-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              INTELLIGENCE LAYER
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-medium tracking-wide">
            Guidewire PolicyCenter decision-support
          </p>
        </div>
      </button>

      {/* Main navigation tabs */}
      <nav className="flex items-center gap-1.5 flex-1 overflow-x-auto py-1 scrollbar-none" aria-label="Main navigation">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) => `topbar-tab ${isActive ? 'active' : ''}`}
            >
              <Icon className="w-4 h-4 opacity-75" />
              <span>{tab.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Switcher with modern pill */}
      <div className="flex items-center gap-3 ml-4 flex-shrink-0">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 hover:bg-white/10 transition-colors">
          <div className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${activeUser.color} flex items-center justify-center text-xs font-bold text-white shadow-sm`}>
            {activeUser.name.charAt(0)}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-semibold text-white leading-tight">
              {activeUser.name}
            </div>
            <div className="text-[10px] text-teal-300/90 leading-tight">
              {activeUser.role}
            </div>
          </div>
          <select
            id="user-switcher"
            value={userId ?? ''}
            onChange={(e) => setUserId(e.target.value)}
            className="bg-transparent text-slate-300 text-xs border-0 rounded py-0 pl-1 pr-5 focus:outline-none focus:ring-0 cursor-pointer font-medium"
            aria-label="Switch current user"
          >
            {PLACEHOLDER_USERS.map((u) => (
              <option key={u.id} value={u.id} className="text-slate-900 bg-white">
                {u.name} — {u.role}
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
