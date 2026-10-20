import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useUserStore } from '@/hooks/useUserStore';

interface TabItem { label: string; path: string; }

const TABS: TabItem[] = [
  { label: 'Desktop',   path: '/desktop'   },
  { label: 'Policies',  path: '/policies'  },
  { label: 'Portfolio', path: '/portfolio' },
  { label: 'Simulator', path: '/simulator' },
  { label: 'Audit',     path: '/audit'     },
  { label: 'Rules',     path: '/rules'     },
];

export const USERS = [
  { id: 'USR-001', name: 'Priya Sharma',    role: 'Underwriter',        initials: 'PS', color: 'from-violet-500 to-purple-600' },
  { id: 'USR-002', name: 'Marcus Williams', role: 'Senior Underwriter', initials: 'MW', color: 'from-blue-500 to-indigo-600'   },
  { id: 'USR-003', name: 'Admin User',      role: 'Administrator',      initials: 'AU', color: 'from-teal-500 to-cyan-600'     },
  { id: 'USR-004', name: 'Aisha Patel',     role: 'Underwriter',        initials: 'AP', color: 'from-rose-500 to-pink-600'     },
  { id: 'USR-005', name: 'Devon Torres',    role: 'Underwriter',        initials: 'DT', color: 'from-amber-500 to-orange-600'  },
];

export function TopBar(): React.ReactElement {
  const { userId, setUserId } = useUserStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeUser = USERS.find((u) => u.id === userId) ?? USERS[0]!;

  // Auto-set default user
  useEffect(() => {
    if (!userId) setUserId(USERS[0]!.id);
  }, [setUserId, userId]);

  // Close menu on outside click
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
    <header className="topbar sticky top-0 z-40">
      {/* Brand */}
      <button
        className="flex items-center gap-2.5 mr-4 flex-shrink-0 focus:outline-none"
        onClick={() => navigate('/desktop')}
        aria-label="Go to Desktop"
      >
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-teal-400 flex-shrink-0"
          style={{ background: 'rgba(0,199,184,0.12)', border: '1px solid rgba(0,199,184,0.2)' }}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V6l-9-4z" />
          </svg>
        </div>
        <div className="flex flex-col items-start leading-none">
          <span className="font-heading font-semibold text-sm text-white tracking-tight whitespace-nowrap">
            EDS
          </span>
          <span className="text-[10px] text-slate-500 font-normal hidden sm:block">
            PolicyCenter
          </span>
        </div>
      </button>

      {/* Divider */}
      <div className="w-px h-6 bg-white/10 flex-shrink-0" />

      {/* Nav tabs */}
      <nav className="flex items-center gap-0.5 flex-1 overflow-x-auto py-1 px-2" aria-label="Main navigation">
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

      {/* User menu */}
      <div className="relative flex-shrink-0 ml-2" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 transition-all duration-150 focus:outline-none"
          style={{
            background: menuOpen ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
          aria-label="User menu"
          aria-expanded={menuOpen}
        >
          <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${activeUser.color} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 shadow-sm`}>
            {activeUser.initials}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-semibold text-white leading-none">{activeUser.name}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{activeUser.role}</div>
          </div>
          <svg
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 hidden sm:block ${menuOpen ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown */}
        {menuOpen && (
          <div
            className="absolute right-0 top-full mt-2 w-64 rounded-2xl shadow-2xl py-1.5 fade-in overflow-hidden"
            style={{
              background: 'rgba(15, 23, 42, 0.96)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04) inset',
            }}
          >
            <div className="px-3 py-2 border-b border-white/5">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Switch Profile</div>
            </div>

            {USERS.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleSwitchUser(user.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors duration-100"
                style={{
                  background: user.id === userId ? 'rgba(255,255,255,0.06)' : 'transparent',
                }}
                onMouseEnter={(e) => { if (user.id !== userId) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = user.id === userId ? 'rgba(255,255,255,0.06)' : 'transparent'; }}
              >
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${user.color} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>
                  {user.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-white truncate">{user.name}</div>
                  <div className="text-[10px] text-slate-500">{user.role}</div>
                </div>
                {user.id === userId && (
                  <svg className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}

            <div className="border-t border-white/5 mt-1 pt-1">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors duration-100 text-red-400"
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="text-xs font-medium">Sign out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
