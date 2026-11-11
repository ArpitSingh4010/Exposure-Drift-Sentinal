import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useUserStore } from '@/hooks/useUserStore';

const NAV_ITEMS = [
  { label: 'Review Queue', path: '/desktop' },
  { label: 'Policies',     path: '/policies' },
  { label: 'Products',     path: '/products' },
  { label: 'Portfolio',    path: '/portfolio' },
  { label: 'Simulator',   path: '/simulator' },
  { label: 'Audit',        path: '/audit' },
  { label: 'Rules',        path: '/rules' },
  { label: 'Registry',     path: '/registry' },
];

export const USERS = [
  { id: 'USR-001', name: 'Priya Sharma',    role: 'Underwriter',        initials: 'PS' },
  { id: 'USR-002', name: 'Marcus Williams', role: 'Senior Underwriter',  initials: 'MW' },
  { id: 'USR-003', name: 'Admin User',      role: 'Administrator',       initials: 'AU' },
  { id: 'USR-004', name: 'Aisha Patel',     role: 'Underwriter',        initials: 'AP' },
  { id: 'USR-005', name: 'Devon Torres',    role: 'Underwriter',        initials: 'DT' },
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
    <header className="topbar sticky top-0 z-40" style={{ height: '48px' }}>
      {/* Brand mark */}
      <button
        type="button"
        onClick={() => navigate('/desktop')}
        aria-label="Go to Desktop"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginRight: '1rem',
          cursor: 'pointer',
          flexShrink: 0,
          background: 'none',
          border: 'none',
          padding: '0.25rem 0',
        }}
      >
        {/* Minimal square logotype */}
        <div style={{
          width: '22px',
          height: '22px',
          borderRadius: '3px',
          backgroundColor: '#2D6A4F',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 10L6 2L10 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3.5 7.5H8.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <span style={{ fontSize: '0.8125rem', fontWeight: '600', color: '#E8E6E0', letterSpacing: '-0.01em' }}>
          EDS
        </span>
      </button>

      {/* Nav links */}
      <nav
        aria-label="Main navigation"
        style={{ display: 'flex', alignItems: 'center', gap: '0.125rem', flex: 1, overflowX: 'auto' }}
      >
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `topbar-link${isActive ? ' active' : ''}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User menu */}
      <div className="relative ml-auto flex-shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="User menu"
          aria-expanded={menuOpen}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.3rem 0.6rem',
            borderRadius: '4px',
            border: '1px solid #2E2E2B',
            backgroundColor: '#252522',
            cursor: 'pointer',
            transition: 'background-color 100ms ease',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2E2E2B'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#252522'; }}
        >
          {/* Avatar */}
          <div style={{
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            backgroundColor: '#2D6A4F',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '0.6rem',
            fontWeight: '700',
            flexShrink: 0,
            letterSpacing: '0.02em',
          }}>
            {activeUser.initials}
          </div>
          <div className="hidden sm:block" style={{ textAlign: 'left' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '500', color: '#E8E6E0', lineHeight: 1.2 }}>
              {activeUser.name}
            </div>
            <div style={{ fontSize: '0.625rem', color: '#8A8880', lineHeight: 1.2 }}>
              {activeUser.role}
            </div>
          </div>
          <svg
            width="10" height="10" viewBox="0 0 10 10" fill="none"
            style={{ color: '#8A8880', flexShrink: 0, transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 150ms ease' }}
          >
            <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {menuOpen && (
          <div style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 6px)',
            width: '240px',
            backgroundColor: '#1A1A17',
            border: '1px solid #2A2A27',
            borderRadius: '6px',
            boxShadow: '0 12px 24px -4px rgba(0,0,0,0.4)',
            zIndex: 50,
            overflow: 'hidden',
          }}>
            <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.6875rem', color: '#8A8880', borderBottom: '1px solid #2A2A27' }}>
              Switch underwriter
            </div>

            {USERS.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => handleSwitchUser(user.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  padding: '0.5rem 0.75rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  border: 'none',
                  backgroundColor: user.id === userId ? '#252522' : 'transparent',
                  transition: 'background-color 100ms ease',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#252522'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = user.id === userId ? '#252522' : 'transparent'; }}
              >
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: user.id === userId ? '#2D6A4F' : '#3A3A37',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '0.6rem',
                  fontWeight: '700',
                  flexShrink: 0,
                  letterSpacing: '0.02em',
                }}>
                  {user.initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8125rem', color: '#E8E6E0', fontWeight: user.id === userId ? 500 : 400 }}>
                    {user.name}
                  </div>
                  <div style={{ fontSize: '0.6875rem', color: '#8A8880' }}>
                    {user.role}
                  </div>
                </div>
                {user.id === userId && (
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#2D6A4F',
                    flexShrink: 0,
                  }} />
                )}
              </button>
            ))}

            <div style={{ borderTop: '1px solid #2A2A27', padding: '0.375rem 0' }}>
              <button
                type="button"
                onClick={handleLogout}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 0.75rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#E57373',
                  fontSize: '0.8125rem',
                  transition: 'background-color 100ms ease',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2A1515'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
