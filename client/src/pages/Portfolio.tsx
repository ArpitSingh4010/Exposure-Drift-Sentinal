import { usePortfolio } from '@/hooks/useApi';

function money(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

export function Portfolio(): React.ReactElement {
  const query = usePortfolio();
  if (query.isLoading) return <div className="p-6 text-sm text-gray-500">Loading portfolio exposure...</div>;
  if (query.isError || !query.data) return <div className="p-6"><div className="bg-red-50 border border-red-200 text-red-700 rounded p-4">Unable to load portfolio exposure.</div></div>;
  const breached = query.data.regions.filter((region) => region.breach);
  const maxShare = Math.max(...query.data.regions.map((region) => region.share), 0.2);

  return (
    <div className="p-5 lg:p-6 fade-in space-y-5">
      <div className="flex items-end justify-between gap-4 flex-wrap"><div><p className="text-xs uppercase tracking-widest text-teal-700 font-semibold">Portfolio risk appetite</p><h1 className="text-2xl font-semibold text-navy-950 mt-1">Exposure Overview</h1><p className="text-sm text-gray-500 mt-1">Regional flood-zone concentration against configured appetite caps.</p></div><div className="text-right"><div className="eds-label">Total portfolio TIV</div><div className="text-2xl font-semibold text-navy-950 mt-1">{money(query.data.totalPortfolioTiv)}</div></div></div>
      {breached.length > 0 && <div className="border border-red-200 bg-red-50 rounded-lg px-4 py-3 text-sm text-red-800"><strong>Appetite breach detected.</strong> {breached.map((region) => region.region).join(', ')} {breached.length === 1 ? 'is' : 'are'} above the configured flood exposure cap.</div>}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">{query.data.regions.map((region) => <div key={region.region} className={`eds-card p-4 ${region.breach ? 'border-red-300' : ''}`}><div className="flex items-start justify-between gap-2"><div><div className="font-semibold text-navy-950">{region.region}</div><div className="text-xs text-gray-500 mt-1">Flood TIV {money(region.floodTiv)}</div></div><span className={`chip ${region.breach ? 'chip-high' : 'chip-open'}`}>{region.breach ? 'Breach' : 'Within cap'}</span></div><div className="mt-5"><div className="flex justify-between text-xs mb-1"><span className="font-semibold">{(region.share * 100).toFixed(2)}%</span><span className="text-gray-500">Cap {(region.cap * 100).toFixed(0)}%</span></div><div className="h-3 bg-gray-100 rounded-full relative overflow-hidden"><div className={`h-full rounded-full ${region.breach ? 'bg-red-500' : 'bg-teal-500'}`} style={{ width: `${Math.min((region.share / maxShare) * 100, 100)}%` }} /><div className="absolute top-0 bottom-0 w-0.5 bg-navy-900" style={{ left: `${Math.min((region.cap / maxShare) * 100, 100)}%` }} /></div><div className="text-xs text-gray-500 mt-2">Headroom {region.headroom >= 0 ? `${(region.headroom * 100).toFixed(2)}%` : `${(Math.abs(region.headroom) * 100).toFixed(2)}% over`}</div></div></div>)}</section>
      <section className="eds-card overflow-hidden"><div className="px-4 py-3 border-b border-gray-200"><h2 className="font-semibold text-gray-900">Contributing policies</h2><p className="text-xs text-gray-500 mt-0.5">Top flood-zone TIV contributors by region.</p></div><div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">{query.data.regions.map((region) => <div key={region.region} className="p-4"><div className="flex justify-between items-center"><span className="font-medium text-navy-900">{region.region}</span><span className="text-xs text-gray-500">{region.contributingPolicies.length} shown</span></div><div className="mt-3 space-y-2">{region.contributingPolicies.length === 0 ? <div className="text-sm text-gray-500">No high-risk flood locations.</div> : region.contributingPolicies.map((policy) => <div key={policy.policyId} className="flex justify-between text-sm"><span className="font-mono text-xs text-gray-700">{policy.policyId}</span><span className="font-medium">{money(policy.tiv)}</span></div>)}</div></div>)}</div></section>
    </div>
  );
}
