import React from 'react';

export function Footer(): React.ReactElement {
  return (
    <footer className="app-footer" role="contentinfo">
      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
        Exposure Drift Sentinel
      </span>
      <span style={{ textAlign: 'right', maxWidth: '52rem' }}>
        Illustrative products modelled on the concepts of Guidewire PolicyCenter; not official Guidewire products.
        Synthetic demo data only. Band names are illustrative, not official hazard data.
      </span>
    </footer>
  );
}
