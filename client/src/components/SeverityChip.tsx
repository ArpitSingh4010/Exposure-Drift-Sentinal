export function SeverityChip({ severity }: { severity: 'LOW' | 'MEDIUM' | 'HIGH' }): React.ReactElement {
  return <span className={`chip chip-${severity.toLowerCase()}`}>{severity}</span>;
}