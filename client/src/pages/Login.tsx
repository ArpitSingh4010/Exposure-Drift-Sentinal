import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/hooks/useUserStore';

const USERS = [
  {
    id: 'USR-001',
    name: 'Priya Sharma',
    role: 'Underwriter',
    initials: 'PS',
    description: 'Reviews standard commercial property drift events. Manages daily review queue and policy decisions.',
  },
  {
    id: 'USR-002',
    name: 'Marcus Williams',
    role: 'Senior Underwriter',
    initials: 'MW',
    description: 'Handles escalated high-severity events, treaty referrals, and senior-flagged appetite breaches.',
  },
  {
    id: 'USR-003',
    name: 'Admin',
    role: 'Administrator',
    initials: 'AU',
    description: 'Full access — audit trail, rules catalogue, portfolio configuration, and simulator controls.',
  },
  {
    id: 'USR-004',
    name: 'Aisha Patel',
    role: 'Underwriter',
    initials: 'AP',
    description: 'Specialises in South-East flood zone exposure reviews and portfolio concentration monitoring.',
  },
  {
    id: 'USR-005',
    name: 'Devon Torres',
    role: 'Underwriter',
    initials: 'DT',
    description: 'Manages new location discovery reviews and TIV increase validations across all regions.',
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
    }, 280);
  };

  const selectedUser = USERS.find((u) => u.id === selected);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0F0F0D',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
    }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '5px',
            backgroundColor: '#2D6A4F',
            marginBottom: '0.875rem',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M5 20L12 4L19 20" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 14H16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 style={{
            fontSize: '1.0625rem',
            fontWeight: 600,
            color: '#E8E6E0',
            letterSpacing: '-0.01em',
            marginBottom: '0.25rem',
          }}>
            Exposure Drift Sentinel
          </h1>
          <p style={{ fontSize: '0.8125rem', color: '#6A6A64' }}>
            Select an underwriter profile to continue.
          </p>
        </div>

        {/* Profile list */}
        <div style={{
          backgroundColor: '#1A1A17',
          border: '1px solid #2A2A27',
          borderRadius: '8px',
          overflow: 'hidden',
        }}>
          {USERS.map((user, idx) => {
            const isSelected = selected === user.id;
            const isLast = idx === USERS.length - 1;

            return (
              <button
                key={user.id}
                type="button"
                onClick={() => setSelected(user.id)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.875rem',
                  padding: '0.875rem 1rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  border: 'none',
                  borderBottom: isLast ? 'none' : '1px solid #242421',
                  backgroundColor: isSelected ? '#1F2920' : 'transparent',
                  transition: 'background-color 100ms ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1E1E1B';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: isSelected ? '#2D6A4F' : '#2E2E2B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isSelected ? 'white' : '#8A8880',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  flexShrink: 0,
                  marginTop: '0.0625rem',
                  letterSpacing: '0.03em',
                  transition: 'background-color 150ms ease, color 150ms ease',
                }}>
                  {user.initials}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.1875rem' }}>
                    <span style={{
                      fontSize: '0.875rem',
                      fontWeight: isSelected ? 600 : 400,
                      color: isSelected ? '#E8E6E0' : '#C0BEB8',
                      transition: 'color 100ms ease, font-weight 100ms ease',
                    }}>
                      {user.name}
                    </span>
                    <span style={{
                      fontSize: '0.6875rem',
                      color: isSelected ? '#6BA882' : '#5A5A54',
                      fontWeight: 500,
                    }}>
                      {user.role}
                    </span>
                  </div>
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#6A6A64',
                    lineHeight: 1.5,
                    margin: 0,
                  }}>
                    {user.description}
                  </p>
                </div>

                {/* Selection indicator */}
                <div style={{
                  width: '16px',
                  height: '16px',
                  borderRadius: '50%',
                  border: `1.5px solid ${isSelected ? '#2D6A4F' : '#3A3A37'}`,
                  backgroundColor: isSelected ? '#2D6A4F' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '0.3125rem',
                  transition: 'all 150ms ease',
                }}>
                  {isSelected && (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Continue button */}
        <div style={{ marginTop: '1rem' }}>
          <button
            type="button"
            disabled={!selected || loading}
            onClick={handleLogin}
            style={{
              width: '100%',
              padding: '0.6875rem',
              borderRadius: '5px',
              border: 'none',
              cursor: selected && !loading ? 'pointer' : 'not-allowed',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'white',
              backgroundColor: selected && !loading ? '#2D6A4F' : '#1E2E26',
              transition: 'background-color 150ms ease',
              opacity: !selected ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (selected && !loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1E4D38';
            }}
            onMouseLeave={(e) => {
              if (selected && !loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2D6A4F';
            }}
          >
            {loading
              ? 'Opening workspace…'
              : selected
              ? `Continue as ${selectedUser?.name}`
              : 'Select a profile to continue'}
          </button>
        </div>

        <p style={{
          marginTop: '1rem',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: '#4A4A45',
        }}>
          Synthetic demo environment. No external credentials required.
        </p>
      </div>
    </div>
  );
}
