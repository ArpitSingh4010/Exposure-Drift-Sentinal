import React from 'react';

/** Contextual sidebar — children injected per page. */
export function Sidebar({ children }: { children?: React.ReactNode }): React.ReactElement {
  return (
    <aside className="sidebar" aria-label="Contextual sidebar">
      {children ?? (
        <div className="p-4 text-xs text-gray-400 italic">No sidebar content for this view.</div>
      )}
    </aside>
  );
}
