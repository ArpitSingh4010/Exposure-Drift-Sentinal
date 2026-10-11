import React from 'react';
import { usePortfolio } from '@/hooks/useApi';

function money(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function Portfolio(): React.ReactElement {
  const query = usePortfolio();

  if (query.isLoading) {
    return (
      <div className="p-12 flex flex-col items-center justify-center min-h-[400px] text-slate-500 space-y-3">
        <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Calculating regional exposure aggregation...</p>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 shadow-sm">
          <div className="font-heading font-bold text-base">Unable to compute portfolio exposure</div>
          <p className="text-sm text-red-600 mt-1">Check that MongoDB replica set is online.</p>
        </div>
      </div>
    );
  }

  const { totalPortfolioTiv, regions } = query.data;
  const breached = regions.filter((region) => region.breach);
  const totalFloodTiv = regions.reduce((sum, r) => sum + r.floodTiv, 0);
  const totalFloodShare = (totalFloodTiv / totalPortfolioTiv) * 100;

  return (
    <div className="p-6 lg:p-8 eds-canvas min-h-full space-y-6 fade-in">
      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200">
              Portfolio Risk Appetite
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs text-slate-500 font-medium">FEMA Zones A / AE / V</span>
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-slate-900 mt-1 tracking-tight">
            Exposure Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Real-time concentration monitoring against the 20.00% regional appetite threshold. Includes live what-if projections for candidate drift events.
          </p>
        </div>

        <div className="text-right">
          <div className="eds-label text-slate-400">Total Bound Portfolio TIV</div>
          <div className="text-3xl font-heading font-extrabold text-slate-900 mt-0.5">
            {money(totalPortfolioTiv)}
          </div>
        </div>
      </div>

      {/* Breach Warning Banner */}
      {breached.length > 0 && (
        <div className="rounded-xl border border-red-300 bg-gradient-to-r from-red-50 to-orange-50 p-5 shadow-sm flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-red-100 text-red-600 flex-shrink-0 mt-0.5">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-red-900">
              Portfolio Risk Appetite Breach Detected
            </h3>
            <p className="text-xs text-red-700 mt-1 leading-relaxed">
              <strong>{breached.map((r) => r.region).join(', ')}</strong> {breached.length === 1 ? 'is' : 'are'} operating above the configured 20.00% flood-hazard concentration threshold. New endorsements and bindings in this territory require senior underwriting approval or reinsurance treaty sign-off.
            </p>
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="eds-card p-5">
          <span className="eds-label">Carrier Total TIV</span>
          <div className="text-2xl font-heading font-extrabold text-slate-900 mt-2">
            {money(totalPortfolioTiv)}
          </div>
          <p className="text-xs text-slate-500 mt-1">Across 4 commercial territories</p>
        </div>

        <div className="eds-card p-5">
          <span className="eds-label">Carrier Flood-Zone TIV</span>
          <div className="text-2xl font-heading font-extrabold text-teal-700 mt-2">
            {money(totalFloodTiv)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {totalFloodShare.toFixed(2)}% national portfolio share
          </p>
        </div>

        <div className="eds-card p-5">
          <span className="eds-label">Regional Threshold Cap</span>
          <div className="text-2xl font-heading font-extrabold text-navy-900 mt-2">
            20.00%
          </div>
          <p className="text-xs text-slate-500 mt-1">Defined in portfolioConfig (Mongo)</p>
        </div>
      </div>

      {/* Regional Exposure Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {regions.map((region) => {
          const sharePct = (region.share * 100).toFixed(2);
          const capPct = (region.cap * 100).toFixed(0);
          const headroomPct = (region.headroom * 100).toFixed(2);

          return (
            <div
              key={region.region}
              className={`eds-card p-5 space-y-4 transition-all ${
                region.breach
                  ? 'border-red-300 bg-red-50/20 shadow-md ring-1 ring-red-200'
                  : 'hover:border-teal-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-heading font-bold text-base text-slate-900">
                    {region.region}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Flood TIV: <strong>{money(region.floodTiv)}</strong>
                  </p>
                </div>
                <span className={`chip ${region.breach ? 'chip-high' : 'chip-open'}`}>
                  {region.breach ? 'BREACH' : 'IN APPETITE'}
                </span>
              </div>

              {/* Progress Visual */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline text-xs">
                  <span className={`text-xl font-heading font-extrabold ${region.breach ? 'text-red-600' : 'text-slate-900'}`}>
                    {sharePct}%
                  </span>
                  <span className="text-slate-500 font-semibold">
                    Cap: {capPct}%
                  </span>
                </div>

                <div className="h-3 bg-slate-100 rounded-full relative overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      region.breach
                        ? 'bg-gradient-to-r from-amber-500 to-red-600'
                        : 'bg-gradient-to-r from-teal-400 to-cyan-500'
                    }`}
                    style={{ width: `${Math.min((region.share / 0.25) * 100, 100)}%` }}
                  />
                  {/* Cap Marker Line at 20% (relative to 25% max axis) */}
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-navy-900 z-10"
                    style={{ left: `${(0.20 / 0.25) * 100}%` }}
                    title="20% Cap"
                  />
                </div>
              </div>

              {/* Headroom / Over Status */}
              <div className="pt-2 border-t border-slate-100 text-xs flex items-center justify-between">
                <span className="text-slate-500 font-medium">Headroom:</span>
                <span className={`font-bold ${region.breach ? 'text-red-700' : 'text-emerald-700'}`}>
                  {region.headroom >= 0 ? `+${headroomPct}% capacity` : `${Math.abs(Number(headroomPct))}% over cap`}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Contributing Policies Section */}
      <section className="eds-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/70">
          <h2 className="font-heading font-bold text-base text-slate-900">
            Contributing Exposure Schedules
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Top Commercial Property policies by high-risk flood-zone TIV across each territory.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          {regions.map((region) => (
            <div key={region.region} className="p-6 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="font-heading font-bold text-sm text-navy-950 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-teal-500" />
                  {region.region}
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  {region.contributingPolicies.length} major schedules
                </span>
              </div>

              <div className="space-y-2">
                {region.contributingPolicies.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    No high-hazard locations mapped in this territory.
                  </p>
                ) : (
                  region.contributingPolicies.map((p, index) => (
                    <div
                      key={p.policyId}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/60 hover:bg-slate-100/80 transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded bg-slate-200 text-slate-600 font-mono text-[10px] flex items-center justify-center font-bold">
                          {index + 1}
                        </span>
                        <span className="font-mono font-bold text-slate-800">{p.policyId}</span>
                      </div>
                      <span className="font-heading font-extrabold text-slate-900">
                        {money(p.tiv)}
                      </span>
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
