import React from 'react';

/** Global footer — displayed on every page per spec. */
export function Footer(): React.ReactElement {
  return (
    <footer className="eds-footer flex flex-wrap items-center justify-between px-6 py-2.5 gap-2" role="contentinfo">
      <div className="flex items-center gap-2 text-slate-500 text-xs">
        <span className="font-medium text-slate-700">Exposure Drift Sentinel</span>
        <span className="text-slate-400">Underwriting Copilot</span>
      </div>
      <div className="text-slate-500 text-xs text-right max-w-xl">
        Illustrative products modelled on the concepts of Guidewire PolicyCenter; not official Guidewire products. Synthetic data only.
      </div>
    </footer>
  );
}
