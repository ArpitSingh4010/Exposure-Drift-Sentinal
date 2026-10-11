import React from 'react';

export function SeverityChip({ severity }: { severity: 'LOW' | 'MEDIUM' | 'HIGH' }): React.ReactElement {
  const dotColor =
    severity === 'HIGH'
      ? 'pulse-dot-red'
      : severity === 'MEDIUM'
        ? 'pulse-dot-amber'
        : 'bg-blue-500';

  return (
    <span className={`chip chip-${severity.toLowerCase()}`}>
      <span className={`pulse-dot ${dotColor}`} aria-hidden="true" />
      <span>{severity}</span>
    </span>
  );
}