import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/hooks/useUserStore';

const SINGLE_USER = {
  id: 'USR-001',
  name: 'Priya Sharma',
  role: 'Commercial Underwriter',
  initials: 'PS',
  description: 'Underwriter workstation access — manages commercial property drift reviews, Guidewire PolicyCenter activities, and policy decisions.',
};

export function Login(): React.ReactElement {
  const { setUserId } = useUserStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setUserId(SINGLE_USER.id);
      navigate('/desktop');
    }, 200);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0F0F0D',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
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
            Underwriting & Risk Intelligence Workstation
          </p>
        </div>

        {/* Single Account Card */}
        <div style={{
          backgroundColor: '#1A1A17',
          border: '1px solid #2A2A27',
          borderRadius: '8px',
          overflow: 'hidden',
          padding: '1.25rem',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.875rem',
          }}>
            {/* Avatar */}
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              backgroundColor: '#2D6A4F',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '0.75rem',
              fontWeight: 700,
              flexShrink: 0,
              letterSpacing: '0.03em',
            }}>
              {SINGLE_USER.initials}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span style={{
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  color: '#E8E6E0',
                }}>
                  {SINGLE_USER.name}
                </span>
                <span style={{
                  fontSize: '0.6875rem',
                  color: '#6BA882',
                  backgroundColor: '#1E2E26',
                  padding: '0.125rem 0.375rem',
                  borderRadius: '3px',
                  fontWeight: 500,
                }}>
                  {SINGLE_USER.role}
                </span>
              </div>
              <p style={{
                fontSize: '0.75rem',
                color: '#8A8880',
                lineHeight: 1.5,
                margin: '0 0 0.5rem 0',
              }}>
                {SINGLE_USER.description}
              </p>
              <div style={{
                fontSize: '0.6875rem',
                color: '#5A5A54',
                fontFamily: 'monospace',
              }}>
                Account ID: {SINGLE_USER.id}
              </div>
            </div>
          </div>
        </div>

        {/* Continue button */}
        <div style={{ marginTop: '1rem' }}>
          <button
            type="button"
            disabled={loading}
            onClick={handleLogin}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '5px',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: 'white',
              backgroundColor: '#2D6A4F',
              transition: 'background-color 150ms ease',
            }}
            onMouseEnter={(e) => {
              if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1E4D38';
            }}
            onMouseLeave={(e) => {
              if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2D6A4F';
            }}
          >
            {loading ? 'Opening workspace…' : `Enter Workspace as ${SINGLE_USER.name} →`}
          </button>
        </div>

        <p style={{
          marginTop: '1.25rem',
          textAlign: 'center',
          fontSize: '0.75rem',
          color: '#4A4A45',
        }}>
          Single-tenant workstation environment connected to Guidewire PolicyCenter.
        </p>
      </div>
    </div>
  );
}
