import { Link } from 'react-router-dom';

export interface Crumb {
  label: string;
  path?: string;
}

/** Breadcrumb bar rendered just below the top bar on every page. */
export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }): React.ReactElement {
  return (
    <nav
      className="flex items-center gap-1 text-xs text-gray-500 px-4 py-2 bg-white border-b border-gray-200"
      aria-label="Breadcrumb"
    >
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-gray-300 select-none">/</span>}
          {crumb.path ? (
            <Link to={crumb.path} className="hover:text-navy-900 hover:underline transition-colors">
              {crumb.label}
            </Link>
          ) : (
            <span className="font-medium text-gray-700">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
