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
      <div className="p-8 flex flex-col items-center justify-center min-h-[300px] text-slate-500 space-y-2">
        <div className="w-5 h-5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium">Loading portfolio aggregation...</p>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-xs font-medium">
          Unable to compute portfolio exposure.
        </div>
      </div>
    );
  }

  const { totalPortfolioTiv, regions } = query.data;
  const breached = regions.filter((region) => region.breach);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 fade-in max-w-7xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-heading font-semibold text-slate-900 tracking-tight">
            Portfolio Exposure
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Regional flood-zone concentration monitored against the 20.00% appetite cap.
          </p>
        </div>

        <div className="text-right">
          <div className="text-[11px] font-medium text-slate-500 uppercase">Total Portfolio TIV</div>
          <div className="text-2xl font-heading font-semibold text-slate-900 mt-0.5">
            {money(totalPortfolioTiv)}
          </div>
        </div>
      </div>

      {/* Breach Notification */}
      {breached.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-xs text-red-800 space-y-1">
          <div className="font-semibold">Risk Appetite Breach:</div>
          <div>
            <strong>{breached.map((r) => r.region).join(', ')}</strong> has exceeded the 20.00% flood-hazard appetite cap. Further bindings in this territory require senior underwriting approval.
          </div>
        </div>
      )}

      {/* Regional Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {regions.map((region) => {
          const sharePct = (region.share * 100).toFixed(2);
          const capPct = (region.cap * 100).toFixed(0);
          const headroomPct = (region.headroom * 100).toFixed(2);

          return (
            <div
              key={region.region}
              className={`eds-card p-4 space-y-3 ${
                region.breach ? 'border-red-300 bg-red-50/10' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-heading font-semibold text-sm text-slate-900">
                    {region.region}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Flood TIV: {money(region.floodTiv)}
                  </p>
                </div>
                <span className={`chip ${region.breach ? 'chip-high' : 'chip-open'}`}>
                  {region.breach ? 'Breach' : 'In Cap'}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-baseline text-xs">
                  <span className={`text-lg font-heading font-semibold ${region.breach ? 'text-red-600' : 'text-slate-900'}`}>
                    {sharePct}%
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Cap: {capPct}%
                  </span>
                </div>

                <div className="h-2 bg-slate-100 rounded-full relative overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      region.breach ? 'bg-red-500' : 'bg-slate-700'
                    }`}
                    style={{ width: `${Math.min((region.share / 0.25) * 100, 100)}%` }}
                  />
                  {/* Cap marker at 20% */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-slate-900 z-10"
                    style={{ left: `${(0.20 / 0.25) * 100}%` }}
                    title="20% Cap"
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

      {/* Contributing Policies */}
      <section className="eds-card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50">
          <h2 className="font-heading font-semibold text-sm text-slate-900">
            Contributing Flood Exposure Schedules
          </h2>
          <p className="text-xs text-slate-500">
            Top commercial property policies by high-risk flood TIV in each territory.
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
                    No high-hazard locations mapped in this territory.
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
