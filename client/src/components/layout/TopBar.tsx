import React, { useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useUserStore } from '@/hooks/useUserStore';

interface TabItem {
  label: string;
  path: string;
}

const TABS: TabItem[] = [
  { label: 'Desktop',   path: '/desktop'   },
  { label: 'Policies',  path: '/policies'  },
  { label: 'Portfolio', path: '/portfolio' },
  { label: 'Simulator', path: '/simulator' },
  { label: 'Audit',     path: '/audit'     },
  { label: 'Rules',     path: '/rules'     },
];

const USERS = [
  { id: 'USR-001', name: 'Priya Sharma',    role: 'Underwriter'        },
  { id: 'USR-002', name: 'Marcus Williams', role: 'Senior Underwriter' },
  { id: 'USR-003', name: 'Admin User',      role: 'Administrator'      },
  { id: 'USR-004', name: 'Aisha Patel',     role: 'Underwriter'        },
  { id: 'USR-005', name: 'Devon Torres',    role: 'Underwriter'        },
];

export function TopBar(): React.ReactElement {
  const { userId, setUserId } = useUserStore();
  const navigate = useNavigate();

  const activeUser = USERS.find((u) => u.id === userId) ?? USERS[0]!;

  useEffect(() => {
    if (!userId) setUserId(USERS[0]!.id);
  }, [setUserId, userId]);

  return (
    <header className="topbar sticky top-0 z-40 bg-slate-900 border-b border-slate-800">
      {/* Brand logo & title */}
      <button
        className="flex items-center gap-2.5 mr-6 flex-shrink-0 focus:outline-none text-left"
        onClick={() => navigate('/desktop')}
        aria-label="Go to Desktop"
      >
        <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-teal-400">
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V6l-9-4z" />
          </svg>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-heading font-semibold text-sm text-white tracking-tight whitespace-nowrap">
            Exposure Drift Sentinel
          </span>
          <span className="hidden lg:inline text-[11px] text-slate-400 font-normal">
            for PolicyCenter
          </span>
        </div>
      </button>

      {/* Main navigation tabs */}
      <nav className="flex items-center gap-1 flex-1 overflow-x-auto py-1" aria-label="Main navigation">
        {TABS.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) => `topbar-tab ${isActive ? 'active' : ''}`}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      {/* User Switcher */}
      <div className="flex items-center gap-2.5 ml-4 flex-shrink-0">
        <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-lg px-2.5 py-1">
          <div className="w-5 h-5 rounded-full bg-slate-700 text-slate-200 flex items-center justify-center text-[10px] font-semibold">
            {activeUser.name.charAt(0)}
          </div>
          <div className="text-left hidden sm:block">
            <span className="text-xs font-medium text-slate-200">
              {activeUser.name}
            </span>
          </div>
          <select
            id="user-switcher"
            value={userId ?? ''}
            onChange={(e) => setUserId(e.target.value)}
            className="bg-transparent text-slate-400 hover:text-slate-200 text-xs border-0 rounded py-0 pl-1 pr-4 focus:outline-none focus:ring-0 cursor-pointer font-normal"
            aria-label="Switch current user"
          >
            {USERS.map((u) => (
              <option key={u.id} value={u.id} className="text-slate-900 bg-white">
                {u.name} ({u.role})
              </option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
}
