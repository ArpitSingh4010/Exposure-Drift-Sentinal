import React from 'react';

/** Global footer — displayed on every page per spec. */
export function Footer(): React.ReactElement {
  return (
    <footer className="eds-footer flex flex-wrap items-center justify-between px-6 gap-2" role="contentinfo">
      <div className="flex items-center gap-2 text-slate-500">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="font-medium">Exposure Drift Sentinel &bull; Academic Concept (21CSE734P)</span>
      </div>
      <div className="text-slate-400">
        Concept project&nbsp;—&nbsp;Guidewire-style UI, not affiliated with Guidewire Software, Inc.
      </div>
    </footer>
  );
}
