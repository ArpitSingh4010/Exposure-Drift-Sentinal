import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useUserStore } from '@/hooks/useUserStore';

const TABS = [
  { label: 'Desktop',   path: '/desktop'   },
  { label: 'Policies',  path: '/policies'  },
  { label: 'Portfolio', path: '/portfolio' },
  { label: 'Simulator', path: '/simulator' },
  { label: 'Audit',     path: '/audit'     },
  { label: 'Rules',     path: '/rules'     },
] as const;

/** Seeded users shown in the switcher; populated from /users API in P5 */
const PLACEHOLDER_USERS = [
  { id: 'USR-001', name: 'Priya Sharma',    role: 'UNDERWRITER'        },
  { id: 'USR-002', name: 'Marcus Williams', role: 'SENIOR_UNDERWRITER' },
  { id: 'USR-003', name: 'Admin User',      role: 'ADMIN'              },
  { id: 'USR-004', name: 'Aisha Patel',     role: 'UNDERWRITER'        },
  { id: 'USR-005', name: 'Devon Torres',    role: 'UNDERWRITER'        },
];

export function TopBar(): React.ReactElement {
  const { userId, setUserId } = useUserStore();
  const navigate = useNavigate();

  const activeUser = PLACEHOLDER_USERS.find((u) => u.id === userId) ?? PLACEHOLDER_USERS[0]!;
  useEffect(() => {
    if (!userId) setUserId(PLACEHOLDER_USERS[0]!.id);
  }, [setUserId, userId]);

  return (
    <header className="topbar z-30 sticky top-0">
      {/* Logo */}
      <button
        className="flex items-center gap-2 mr-4 flex-shrink-0"
        onClick={() => navigate('/desktop')}
        aria-label="Go to Desktop"
      >
        {/* Shield icon (inline SVG — no external deps) */}
        <svg
          className="w-6 h-6 text-teal-400"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V6l-9-4z" />
        </svg>
        <span className="font-semibold text-sm tracking-tight text-white whitespace-nowrap">
          Exposure Drift Sentinel
        </span>
      </button>

      {/* Navigation tabs */}
      <nav className="flex items-center gap-1 flex-1 overflow-x-auto" aria-label="Main navigation">
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

      {/* User switcher */}
      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
        <div className="flex items-center gap-1.5 text-navy-200">
          {/* Avatar circle */}
          <div className="w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center text-xs font-bold text-white">
            {activeUser.name.charAt(0)}
          </div>
        </div>
        <select
          id="user-switcher"
          value={userId ?? ''}
          onChange={(e) => setUserId(e.target.value)}
          className="bg-white/10 text-white text-xs border border-white/20 rounded px-2 py-1
                     focus:outline-none focus:ring-1 focus:ring-teal-400 cursor-pointer
                     hover:bg-white/20 transition-colors"
          aria-label="Switch current user"
        >
          {PLACEHOLDER_USERS.map((u) => (
            <option key={u.id} value={u.id} className="text-gray-900 bg-white">
              {u.name} ({u.role.replace('_', ' ')})
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}
