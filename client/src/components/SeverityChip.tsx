import React from 'react';

export function SeverityChip({ severity }: { severity: 'LOW' | 'MEDIUM' | 'HIGH' }): React.ReactElement {
  const styles: Record<string, React.CSSProperties> = {
    HIGH:   { backgroundColor: 'var(--risk-high-bg)',    color: 'var(--risk-high-text)',    border: '1px solid var(--risk-high-border)' },
    MEDIUM: { backgroundColor: 'var(--risk-med-bg)',     color: 'var(--risk-med-text)',     border: '1px solid var(--risk-med-border)' },
    LOW:    { backgroundColor: 'var(--risk-low-bg)',     color: 'var(--risk-low-text)',     border: '1px solid var(--risk-low-border)' },
  };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '0.1875rem 0.4375rem',
      borderRadius: '3px',
      fontSize: '0.6875rem',
      fontWeight: 600,
      letterSpacing: '0.03em',
      lineHeight: 1,
      ...styles[severity],
    }}>
      {severity}
    </span>
  );
}
