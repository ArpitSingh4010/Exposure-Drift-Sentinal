import React from 'react';

export function SeverityChip({ severity }: { severity: 'LOW' | 'MEDIUM' | 'HIGH' }): React.ReactElement {
  const dotColor =
    severity === 'HIGH'
      ? 'status-dot-red'
      : severity === 'MEDIUM'
        ? 'status-dot-amber'
        : 'status-dot-blue';

  return (
    <span className={`chip chip-${severity.toLowerCase()}`}>
      <span className={`status-dot ${dotColor}`} aria-hidden="true" />
      <span>{severity}</span>
    </span>
  );
}