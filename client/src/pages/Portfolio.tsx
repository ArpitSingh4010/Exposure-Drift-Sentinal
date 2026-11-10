import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePortfolio, usePortfolioSummary } from '@/hooks/useApi';

function money(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

const HAZARD_TABS = [
  { id: 'flood',        label: 'Flood',                cap: '20%' },
  { id: 'earthquake',   label: 'Earthquake',           cap: '25%' },
  { id: 'tsunami',      label: 'Tsunami',              cap: '10%' },
  { id: 'cyclone',      label: 'Cyclone / Hurricane',  cap: '20%' },
  { id: 'wildfire',     label: 'Wildfire',             cap: '15%' },
  { id: 'landslide',    label: 'Landslide',            cap: '10%' },
  { id: 'tornado',      label: 'Tornado',              cap: '15%' },
  { id: 'severe_storm', label: 'Severe Storm',         cap: '25%' },
];

export function Portfolio(): React.ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeHazard = searchParams.get('hazard') ?? 'flood';

  const setHazardTab = (hazardId: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('hazard', hazardId);
    setSearchParams(next, { replace: true });
  };

  const query = usePortfolio(activeHazard);
  const summaryQuery = usePortfolioSummary();

  const activeTabMeta = HAZARD_TABS.find((h) => h.id === activeHazard) ?? HAZARD_TABS[0]!;

  if (query.isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[300px] text-slate-500 space-y-2">
        <div className="w-5 h-5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium">Loading portfolio aggregation for {activeTabMeta.label}...</p>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-4 text-xs font-medium">
          Unable to compute portfolio exposure for {activeTabMeta.label}.
        </div>
      </div>
    );
  }

  const { totalPortfolioTiv, regions } = query.data;
  const breached = regions.filter((region) => region.breach);
  const summaries = summaryQuery.data ?? [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            Multi-Hazard Portfolio Appetite & Concentration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time concentration monitoring across 8 peril types and 4 commercial property regions.
          </p>
        </div>

        <div className="text-right">
          <div className="text-xs font-medium text-slate-500">Total portfolio TIV</div>
          <div className="text-xl font-semibold text-slate-900 mt-0.5">
            {money(totalPortfolioTiv)}
          </div>
        </div>
      </div>

      {/* 8 Hazard Peril Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200">
        {HAZARD_TABS.map((tab) => {
          const isActive = tab.id === activeHazard;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setHazardTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-t border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                isActive
                  ? 'border-blue-600 text-blue-700 bg-blue-50/50 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1 rounded ${isActive ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'}`}>
                {tab.cap} cap
              </span>
            </button>
          );
        })}
      </div>

      {/* Breach Notification Banner */}
      {breached.length > 0 && (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-xs text-red-800 space-y-1">
          <div className="font-semibold">Risk Appetite Breach ({activeTabMeta.label}):</div>
          <div>
            <strong>{breached.map((r) => r.region).join(', ')}</strong> has exceeded the {activeTabMeta.cap} appetite cap for {activeTabMeta.label}. Further policy endorsements in this territory require senior underwriting approval.
          </div>
        </div>
      )}

      {/* Regional Exposure Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {regions.map((region) => {
          const sharePct = (region.share * 100).toFixed(2);
          const capPct = (region.cap * 100).toFixed(0);
          const headroomPct = (region.headroom * 100).toFixed(2);
          const maxDisplayCap = region.cap * 1.25;

          return (
            <div
              key={region.region}
              className={`eds-card p-4 space-y-3 ${
                region.breach ? 'border-red-300 bg-red-50/20' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-slate-900">
                    {region.region}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    High-risk TIV: {money(region.floodTiv)}
                  </p>
                </div>
                <span className={`chip ${region.breach ? 'chip-high' : 'chip-open'}`}>
                  {region.breach ? 'Breach' : 'In appetite'}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-baseline text-xs">
                  <span className={`text-lg font-semibold ${region.breach ? 'text-red-700' : 'text-slate-900'}`}>
                    {sharePct}%
                  </span>
                  <span className="text-slate-500 text-xs">
                    Cap: {capPct}%
                  </span>
                </div>

                <div className="h-2 bg-slate-100 rounded-full relative overflow-hidden border border-slate-200">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      region.breach ? 'bg-red-600' : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min((region.share / maxDisplayCap) * 100, 100)}%` }}
                  />
                  {/* Cap marker */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-800 z-10"
                    style={{ left: `${(region.cap / maxDisplayCap) * 100}%` }}
                    title={`Appetite Cap: ${capPct}%`}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 text-xs flex justify-between text-slate-600">
                <span>Headroom:</span>
                <span className={`font-semibold ${region.breach ? 'text-red-700' : 'text-slate-800'}`}>
                  {region.headroom >= 0 ? `+${headroomPct}%` : `${Math.abs(Number(headroomPct))}% over`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cross-Peril National Summary Table */}
      <section className="eds-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50">
          <h2 className="font-semibold text-sm text-slate-900">
            Multi-Hazard Concentration Overview (All 8 Perils)
          </h2>
          <p className="text-xs text-slate-500">
            Highest regional concentration share versus appetite cap for each peril in the national portfolio.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="eds-table">
            <thead>
              <tr>
                <th>Peril</th>
                <th>Worst region</th>
                <th>Regional concentration</th>
                <th>Appetite cap</th>
                <th>Headroom</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {summaries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6 text-xs text-slate-500">
                    Loading cross-hazard summary...
                  </td>
                </tr>
              ) : (
                summaries.map((s) => (
                  <tr
                    key={s.hazard}
                    onClick={() => setHazardTab(s.hazard)}
                    className={s.hazard === activeHazard ? 'bg-blue-50/40' : ''}
                  >
                    <td>
                      <span className="font-medium text-slate-900">
                        {s.label}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-slate-700">
                        {s.worstRegion}
                      </span>
                    </td>
                    <td>
                      <span className={`font-semibold ${s.breach ? 'text-red-700' : 'text-slate-900'}`}>
                        {(s.share * 100).toFixed(2)}%
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-slate-600">
                        {(s.cap * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td>
                      <span className={`font-medium ${s.breach ? 'text-red-700' : 'text-slate-700'}`}>
                        {s.headroom >= 0 ? `+${(s.headroom * 100).toFixed(2)}%` : `${Math.abs(s.headroom * 100).toFixed(2)}% over`}
                      </span>
                    </td>
                    <td>
                      <span className={`chip ${s.breach ? 'chip-high' : 'chip-open'}`}>
                        {s.breach ? 'Breach' : 'In appetite'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Contributing Policies */}
      <section className="eds-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50">
          <h2 className="font-semibold text-sm text-slate-900">
            Contributing Exposure Schedules ({activeTabMeta.label})
          </h2>
          <p className="text-xs text-slate-500">
            Top commercial property policies by high-risk TIV in each territory for {activeTabMeta.label}.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          {regions.map((region) => (
            <div key={region.region} className="p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-semibold text-xs text-slate-800">
                  {region.region}
                </span>
                <span className="text-[11px] text-slate-400">
                  {region.contributingPolicies.length} policies
                </span>
              </div>

              <div className="space-y-1.5">
                {region.contributingPolicies.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-1">
                    No high-hazard locations mapped in this territory for {activeTabMeta.label}.
                  </p>
                ) : (
                  region.contributingPolicies.map((p) => (
                    <div
                      key={p.policyId}
                      className="flex items-center justify-between text-xs py-1"
                    >
                      <span className="font-mono text-slate-700">{p.policyId}</span>
                      <span className="font-semibold text-slate-900">{money(p.tiv)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
