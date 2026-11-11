import React from 'react';
import { NavLink } from 'react-router-dom';

export function BottomNav(): React.ReactElement {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-2 py-1.5 flex justify-around items-center"
      style={{
        backgroundColor: 'var(--topbar-bg)',
        borderTop: '1px solid var(--topbar-border)',
        paddingBottom: 'calc(0.4rem + env(safe-area-inset-bottom, 0px))',
      }}
      aria-label="Mobile navigation"
    >
      <NavLink
        to="/desktop"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center py-1 px-2.5 rounded text-[11px] font-medium transition-colors ${
            isActive ? 'text-white' : 'text-[#8A8880] hover:text-[#E8E6E0]'
          }`
        }
      >
        <svg className="w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <span>Queue</span>
      </NavLink>

      <NavLink
        to="/policies"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center py-1 px-2.5 rounded text-[11px] font-medium transition-colors ${
            isActive ? 'text-white' : 'text-[#8A8880] hover:text-[#E8E6E0]'
          }`
        }
      >
        <svg className="w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <span>Policies</span>
      </NavLink>

      <NavLink
        to="/portfolio"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center py-1 px-2.5 rounded text-[11px] font-medium transition-colors ${
            isActive ? 'text-white' : 'text-[#8A8880] hover:text-[#E8E6E0]'
          }`
        }
      >
        <svg className="w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span>Portfolio</span>
      </NavLink>

      <NavLink
        to="/simulator"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center py-1 px-2.5 rounded text-[11px] font-medium transition-colors ${
            isActive ? 'text-white' : 'text-[#8A8880] hover:text-[#E8E6E0]'
          }`
        }
      >
        <svg className="w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span>Simulator</span>
      </NavLink>

      <NavLink
        to="/rules"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center py-1 px-2.5 rounded text-[11px] font-medium transition-colors ${
            isActive ? 'text-white' : 'text-[#8A8880] hover:text-[#E8E6E0]'
          }`
        }
      >
        <svg className="w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
        <span>Rules</span>
      </NavLink>

      <NavLink
        to="/audit"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center py-1 px-2.5 rounded text-[11px] font-medium transition-colors ${
            isActive ? 'text-white' : 'text-[#8A8880] hover:text-[#E8E6E0]'
          }`
        }
      >
        <svg className="w-4 h-4 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Audit</span>
      </NavLink>
    </nav>
  );
}
