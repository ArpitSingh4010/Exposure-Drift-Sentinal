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
    bg: 'bg-indigo-600',
  },
  {
    id: 'USR-002',
    name: 'Marcus Williams',
    role: 'Senior Underwriter',
    initials: 'MW',
    description: 'Handles escalated high-severity events, treaty referrals, and senior-flagged appetite breaches.',
    bg: 'bg-blue-600',
  },
  {
    id: 'USR-003',
    name: 'Admin User',
    role: 'Administrator',
    initials: 'AU',
    description: 'Full system access — audit trail, rules catalog, portfolio config, and simulator controls.',
    bg: 'bg-slate-600',
  },
  {
    id: 'USR-004',
    name: 'Aisha Patel',
    role: 'Underwriter',
    initials: 'AP',
    description: 'Specialises in South-East flood zone exposure reviews. Monitors portfolio concentration.',
    bg: 'bg-emerald-600',
  },
  {
    id: 'USR-005',
    name: 'Devon Torres',
    role: 'Underwriter',
    initials: 'DT',
    description: 'Manages new location discovery reviews and TIV increase validations across regions.',
    bg: 'bg-amber-600',
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
    }, 300);
  };

  const selectedUser = USERS.find((u) => u.id === selected);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-800 border border-slate-700 rounded-lg p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded bg-blue-600 text-white font-bold text-sm mb-2">
            ED
          </div>
          <h1 className="text-xl font-semibold text-white tracking-tight">
            Exposure Drift Sentinel
          </h1>
          <p className="text-slate-400 text-xs">
            Select an underwriter persona to enter the Guidewire PolicyCenter decision-support workspace.
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {USERS.map((user) => {
            const isSelected = selected === user.id;

            return (
              <button
                key={user.id}
                type="button"
                className={`p-3.5 rounded border text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'border-blue-500 bg-blue-950/40 text-white'
                    : 'border-slate-700 bg-slate-900/60 text-slate-300 hover:border-slate-600'
                }`}
                onClick={() => setSelected(user.id)}
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className={`w-7 h-7 rounded ${user.bg} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
                    {user.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-white text-xs font-semibold truncate">{user.name}</div>
                    <div className="text-slate-400 text-[11px]">{user.role}</div>
                  </div>
                  {isSelected && (
                    <span className="text-blue-400 text-xs font-semibold">Active</span>
                  )}
                </div>
                <p className="text-slate-400 text-xs leading-relaxed">
                  {user.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Login Button */}
        <button
          type="button"
          className="w-full py-2.5 px-4 rounded font-semibold text-xs text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
          disabled={!selected || loading}
          onClick={handleLogin}
        >
          {loading ? (
            'Opening workspace...'
          ) : selected ? (
            `Continue as ${selectedUser?.name}`
          ) : (
            'Select a profile to continue'
          )}
        </button>

        {/* Footer note */}
        <p className="text-center text-slate-500 text-xs pt-1">
          Synthetic demo environment, no external credentials required.
        </p>
      </div>
    </div>
  );
}
