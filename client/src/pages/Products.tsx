import React from 'react';
import { useProducts } from '@/hooks/useApi';
import type { ProductRecord } from '@/api/client';

export function Products(): React.ReactElement {
  const query = useProducts();
  const products = query.data ?? [];

  if (query.isLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[300px] text-slate-500 space-y-2">
        <div className="w-5 h-5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium">Loading Guidewire PolicyCenter product definitions...</p>
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded p-4 text-xs font-medium">
          Unable to load product definitions from PolicyCenter mock endpoint.
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            Commercial Property Product Catalogue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Guidewire PolicyCenter product model: lines of business, monitored peril triggers, coverages, and terms.
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs text-slate-500">Catalogue count: </span>
          <span className="font-semibold text-slate-900 text-xs">{products.length} products</span>
        </div>
      </div>

      {/* Product Model Disclaimer Banner */}
      <div className="rounded border border-slate-200 bg-white p-4 text-xs text-slate-600 space-y-1">
        <div className="font-semibold text-slate-800">Guidewire PolicyCenter Product Model Integration:</div>
        <p>
          Illustrative products modelled on the concepts of Guidewire PolicyCenter (Line of Business: Commercial Property).
          A commercial property policy only produces risk drift review activities for perils that its specific product monitors.
          Synthetic demo data only.
        </p>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((product: ProductRecord) => {
          const isBase = product.productCode === 'CP-BASE';

          return (
            <div
              key={product.productCode}
              className={`eds-card p-5 space-y-4 flex flex-col justify-between ${
                isBase ? 'border-blue-300 bg-blue-50/20' : 'bg-white'
              }`}
            >
              <div className="space-y-3">
                {/* Header: Code & Peril Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      {product.productCode}
                    </span>
                    <h2 className="font-semibold text-sm text-slate-900 mt-1.5 leading-snug">
                      {product.name}
                    </h2>
                  </div>

                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded border capitalize ${
                    isBase
                      ? 'bg-blue-50 text-blue-800 border-blue-200'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}>
                    {product.primaryHazard ?? 'All perils'}
                  </span>
                </div>

                {/* Line of Business & Terms */}
                <div className="text-xs space-y-1 text-slate-600 pt-1 border-t border-slate-100">
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-500">Line of business:</span>
                    <span className="font-medium text-slate-800">{product.lineOfBusiness}</span>
                  </div>
                  <div className="flex justify-between py-0.5">
                    <span className="text-slate-500">Standard deductible:</span>
                    <span className="font-medium text-slate-800">
                      {product.deductible.type === 'flat'
                        ? `$${product.deductible.value.toLocaleString()}`
                        : `${(product.deductible.value * 100).toFixed(0)}% of location TIV`}
                    </span>
                  </div>
                  {product.waitingPeriodDays && (
                    <div className="flex justify-between py-0.5">
                      <span className="text-slate-500">Waiting period:</span>
                      <span className="font-medium text-slate-800">{product.waitingPeriodDays} days</span>
                    </div>
                  )}
                </div>

                {/* Monitored Hazards Chips */}
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] font-medium text-slate-500 block">
                    Monitored peril triggers ({product.monitoredHazards.length}):
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {product.monitoredHazards.map((h) => (
                      <span
                        key={h}
                        className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200 capitalize"
                      >
                        {h.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Coverages Included */}
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] font-medium text-slate-500 block">Coverages:</span>
                  <ul className="text-xs text-slate-700 space-y-0.5">
                    {product.coverages.map((cov) => (
                      <li key={cov.code} className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-slate-400">{cov.code}</span>
                        <span>{cov.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Notes */}
              {product.notes && (
                <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 italic">
                  {product.notes}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

