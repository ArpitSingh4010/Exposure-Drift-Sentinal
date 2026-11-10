import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useUserStore } from '@/hooks/useUserStore';

interface TabItem {
  label: string;
  path: string;
}

const TABS: TabItem[] = [
  { label: 'Desktop',   path: '/desktop'   },
  { label: 'Policies',  path: '/policies'  },
  { label: 'Products',  path: '/products'  },
  { label: 'Portfolio', path: '/portfolio' },
  { label: 'Simulator', path: '/simulator' },
  { label: 'Audit',     path: '/audit'     },
  { label: 'Rules',     path: '/rules'     },
];

export const USERS = [
  { id: 'USR-001', name: 'Priya Sharma',    role: 'Underwriter',        initials: 'PS', bg: 'bg-indigo-600' },
  { id: 'USR-002', name: 'Marcus Williams', role: 'Senior Underwriter', initials: 'MW', bg: 'bg-blue-600'   },
  { id: 'USR-003', name: 'Admin User',      role: 'Administrator',      initials: 'AU', bg: 'bg-slate-600'  },
  { id: 'USR-004', name: 'Aisha Patel',     role: 'Underwriter',        initials: 'AP', bg: 'bg-emerald-600'},
  { id: 'USR-005', name: 'Devon Torres',    role: 'Underwriter',        initials: 'DT', bg: 'bg-amber-600'  },
];

export function TopBar(): React.ReactElement {
  const { userId, setUserId } = useUserStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeUser = USERS.find((u) => u.id === userId) ?? USERS[0]!;

  useEffect(() => {
    if (!userId) setUserId(USERS[0]!.id);
  }, [setUserId, userId]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    setMenuOpen(false);
    localStorage.removeItem('eds_userId');
    setUserId('');
    navigate('/login');
  };

  const handleSwitchUser = (id: string) => {
    setUserId(id);
    setMenuOpen(false);
  };

  return (
    <header className="topbar sticky top-0 z-40 bg-slate-900 border-b border-slate-800 flex items-center h-14 px-4 sm:px-6 gap-6">
      {/* Brand */}
      <button
        type="button"
        className="flex items-center gap-2.5 mr-2 flex-shrink-0 cursor-pointer focus-visible:outline-none"
        onClick={() => navigate('/desktop')}
        aria-label="Go to Desktop"
      >
        <div className="w-7 h-7 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
          ED
        </div>
        <div className="flex flex-col items-start leading-none text-left">
          <span className="font-semibold text-sm text-white tracking-tight whitespace-nowrap">
            Exposure Drift Sentinel
          </span>
          <span className="text-[11px] text-slate-400 font-normal hidden sm:block">
            Guidewire PolicyCenter Integration
          </span>
        </div>
      </button>

      {/* Nav tabs */}
      <nav className="flex items-center gap-1 flex-1 overflow-x-auto py-1" aria-label="Main navigation">
        {TABS.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              `topbar-tab text-xs px-2.5 py-1.5 rounded font-medium transition-colors ${
                isActive
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      {/* User profile dropdown */}
      <div className="relative flex-shrink-0 ml-auto" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2 rounded px-2 py-1.5 bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
          aria-label="User menu"
          aria-expanded={menuOpen}
        >
          <div className={`w-6 h-6 rounded ${activeUser.bg} flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0`}>
            {activeUser.initials}
          </div>
          <div className="text-left hidden sm:block pr-1">
            <div className="text-xs font-medium text-white leading-tight">{activeUser.name}</div>
            <div className="text-[10px] text-slate-400">{activeUser.role}</div>
          </div>
          <svg
            className={`w-3.5 h-3.5 text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {menuOpen && (
          <div
            className="absolute right-0 top-full mt-1.5 w-60 rounded-md shadow-lg py-1 bg-slate-900 border border-slate-700 z-50 text-slate-200"
          >
            <div className="px-3 py-1.5 text-xs text-slate-400 border-b border-slate-800">
              Active underwriter
            </div>

            {USERS.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleSwitchUser(user.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                  user.id === userId ? 'bg-slate-800 text-white font-medium' : 'hover:bg-slate-800/70 text-slate-300'
                }`}
              >
                <div className={`w-6 h-6 rounded ${user.bg} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>
                  {user.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate">{user.name}</div>
                  <div className="text-[10px] text-slate-400">{user.role}</div>
                </div>
                {user.id === userId && (
                  <span className="text-xs text-blue-400 font-semibold">Active</span>
                )}
              </button>
            ))}

            <div className="border-t border-slate-800 mt-1 pt-1">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs text-red-400 hover:bg-red-950/40 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Switch or sign out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
