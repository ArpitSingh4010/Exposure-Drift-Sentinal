import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/hooks/useUserStore';

const USERS = [
  {
    id: 'USR-001',
    name: 'Priya Sharma',
    role: 'Underwriter',
    initials: 'PS',
    description: 'Reviews standard commercial property policies. Manages daily drift events and policy decisions.',
    color: 'from-violet-500 to-purple-600',
  },
  {
    id: 'USR-002',
    name: 'Marcus Williams',
    role: 'Senior Underwriter',
    initials: 'MW',
    description: 'Handles escalated high-severity events, treaty referrals, and senior-flagged appetite breaches.',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'USR-003',
    name: 'Admin User',
    role: 'Administrator',
    initials: 'AU',
    description: 'Full system access — audit trail, rules catalog, portfolio config, and simulator controls.',
    color: 'from-teal-500 to-cyan-600',
  },
  {
    id: 'USR-004',
    name: 'Aisha Patel',
    role: 'Underwriter',
    initials: 'AP',
    description: 'Specialises in South-East flood zone exposure reviews. Monitors portfolio concentration.',
    color: 'from-rose-500 to-pink-600',
  },
  {
    id: 'USR-005',
    name: 'Devon Torres',
    role: 'Underwriter',
    initials: 'DT',
    description: 'Manages new location discovery reviews and TIV increase validations across regions.',
    color: 'from-amber-500 to-orange-600',
  },
];

export function Login(): React.ReactElement {
  const { setUserId } = useUserStore();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!selected) return;
    setLoading(true);
    setTimeout(() => {
      setUserId(selected);
      navigate('/desktop');
    }, 600);
  };

  const selectedUser = USERS.find((u) => u.id === selected);

  return (
    <div className="login-bg flex min-h-screen items-center justify-center p-4">

      {/* Ambient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-indigo-500/5 blur-3xl" />
      </div>

      <div className="login-card w-full max-w-2xl p-5 sm:p-8 scale-in relative">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, rgba(0,199,184,0.2), rgba(59,130,246,0.15))', border: '1px solid rgba(0,199,184,0.25)' }}>
            <svg className="w-7 h-7 text-teal-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V6l-9-4z" />
            </svg>
          </div>
          <h1 className="text-2xl font-heading font-bold text-white tracking-tight">
            Exposure Drift Sentinel
          </h1>
          <p className="text-slate-400 text-sm mt-1.5 font-normal">
            Select your profile to enter the Guidewire PolicyCenter workspace
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {USERS.map((user) => (
            <button
              key={user.id}
              type="button"
              className={`role-card p-4 text-left w-full ${selected === user.id ? 'selected' : ''}`}
              onClick={() => setSelected(user.id)}
            >
              <div className="flex items-center gap-3 mb-2.5">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${user.color} flex items-center justify-center text-white text-xs font-bold shadow-lg flex-shrink-0`}>
                  {user.initials}
                </div>
                <div className="min-w-0">
                  <div className="text-white text-sm font-semibold truncate">{user.name}</div>
                  <div className="text-slate-400 text-[11px] font-medium">{user.role}</div>
                </div>
                {selected === user.id && (
                  <div className="ml-auto flex-shrink-0 w-5 h-5 rounded-full bg-teal-400/20 border border-teal-400/50 flex items-center justify-center">
                    <svg className="w-3 h-3 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                {user.description}
              </p>
            </button>
          ))}
        </div>

        {/* Login Button */}
        <button
          type="button"
          className="login-btn"
          disabled={!selected || loading}
          onClick={handleLogin}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signing in…
            </span>
          ) : selected ? (
            `Continue as ${selectedUser?.name} →`
          ) : (
            'Select a profile to continue'
          )}
        </button>

        {/* Footer note */}
        <p className="text-center text-slate-600 text-[11px] mt-5">
          Demo environment · No credentials required · All data is synthetic
        </p>
      </div>
    </div>
  );
}
