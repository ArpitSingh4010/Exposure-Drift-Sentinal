import React, { useState } from 'react';
import { useProducts } from '@/hooks/useApi';
import type { ProductRecord } from '@/api/client';

export function Products(): React.ReactElement {
  const query = useProducts();
  const products = query.data ?? [];
  const [selectedCode, setSelectedCode] = useState<string | null>('CP-BASE');

  if (query.isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[360px] text-[#7A7A74] space-y-2">
        <div className="spinner" />
        <p className="text-xs">Loading Guidewire PolicyCenter product catalogue...</p>
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="p-6 max-w-5xl">
        <div
          className="p-4 text-xs space-y-2"
          style={{
            backgroundColor: 'var(--risk-high-bg)',
            border: '1px solid var(--risk-high-border)',
            color: 'var(--risk-high-text)',
            borderRadius: '4px',
          }}
        >
          Unable to load product definitions from PolicyCenter mock endpoint.
        </div>
      </div>
    );
  }

  const selectedProduct = products.find((p) => p.productCode === selectedCode) ?? products[0];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[#1A1A18]">
            Commercial Property Product Catalogue
          </h1>
          <p className="text-xs text-[#7A7A74] mt-0.5">
            Guidewire PolicyCenter product model: lines of business, monitored peril triggers, coverages, and terms.
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs text-[#7A7A74]">Catalogue count: </span>
          <span className="font-semibold text-[#1A1A18] text-xs tabular-nums">{products.length} products</span>
        </div>
      </div>

      {/* Product Model Integration Note */}
      <div
        className="p-3.5 text-xs text-[#4A4A45] leading-relaxed rounded"
        style={{
          backgroundColor: 'var(--surface-raised)',
          border: '1px solid var(--border)',
        }}
      >
        <span className="font-semibold text-[#1A1A18]">Guidewire PolicyCenter Product Model Integration: </span>
        Illustrative products modelled on the concepts of Guidewire PolicyCenter (Line of Business: Commercial Property).
        A commercial property policy only produces risk drift review activities for perils that its specific product monitors.
        Synthetic demo data only.
      </div>

      {/* Main Content: Catalogue Table + Detail Inspector */}
      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6 items-start">
        {/* Left: Product Table */}
        <section className="panel overflow-hidden bg-white">
          <div
            className="px-4 py-3 flex items-center justify-between border-b"
            style={{
              backgroundColor: 'var(--surface-raised)',
              borderColor: 'var(--border)',
            }}
          >
            <span className="text-xs font-semibold text-[#1A1A18]">
              Product Models ({products.length})
            </span>
            <span className="text-[11px] text-[#7A7A74]">Select row to inspect coverages</span>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '100px' }}>Code</th>
                  <th>Product Name</th>
                  <th>Primary Peril</th>
                  <th>Monitored Hazards</th>
                  <th style={{ width: '120px' }}>Deductible</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p: ProductRecord) => {
                  const isSelected = selectedProduct?.productCode === p.productCode;
                  const isBase = p.productCode === 'CP-BASE';

                  return (
                    <tr
                      key={p.productCode}
                      onClick={() => setSelectedCode(p.productCode)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-[var(--green-subtle)]' : 'hover:bg-[#FAFAF8]'
                      }`}
                    >
                      <td className="font-mono text-xs font-semibold text-[#1A1A18]">
                        <span className={isBase ? 'text-[#2D6A4F]' : ''}>{p.productCode}</span>
                      </td>
                      <td>
                        <div className="font-medium text-[#1A1A18] text-xs">{p.name}</div>
                        <div className="text-[11px] text-[#7A7A74]">{p.lineOfBusiness}</div>
                      </td>
                      <td>
                        <span className="badge badge-neutral text-[10px] capitalize">
                          {p.primaryHazard ?? 'All Perils'}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-[#4A4A45]">
                          {p.monitoredHazards.length} perils
                        </span>
                        <div className="text-[10px] text-[#7A7A74] truncate max-w-[160px]">
                          {p.monitoredHazards.join(', ')}
                        </div>
                      </td>
                      <td className="text-xs text-[#4A4A45] tabular-nums">
                        {p.deductible.type === 'flat'
                          ? `$${p.deductible.value.toLocaleString()}`
                          : `${(p.deductible.value * 100).toFixed(0)}% TIV`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Right: Selected Product Inspector */}
        <section className="panel p-5 bg-white space-y-4 sticky top-6">
          {selectedProduct ? (
            <>
              <div className="pb-3 border-b space-y-1.5" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-[#F2F1EE] text-[#1A1A18]">
                    {selectedProduct.productCode}
                  </span>
                  <span className="badge badge-low text-[10px] capitalize">
                    {selectedProduct.primaryHazard ?? 'All Perils'}
                  </span>
                </div>
                <h3 className="text-sm font-semibold tracking-tight text-[#1A1A18] pt-1">
                  {selectedProduct.name}
                </h3>
                <p className="text-xs text-[#7A7A74]">
                  Line of Business: <span className="text-[#1A1A18] font-medium">{selectedProduct.lineOfBusiness}</span>
                </p>
              </div>

              {/* Policy Terms */}
              <div className="space-y-2 text-xs">
                <div className="text-[11px] font-semibold text-[#4A4A45] uppercase tracking-wider">
                  Underwriting Terms
                </div>
                <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-[#7A7A74]">Standard Deductible</span>
                  <span className="font-medium text-[#1A1A18] tabular-nums">
                    {selectedProduct.deductible.type === 'flat'
                      ? `$${selectedProduct.deductible.value.toLocaleString()} flat`
                      : `${(selectedProduct.deductible.value * 100).toFixed(0)}% of location TIV`}
                  </span>
                </div>
                {selectedProduct.waitingPeriodDays && (
                  <div className="flex justify-between py-1 border-b" style={{ borderColor: 'var(--border)' }}>
                    <span className="text-[#7A7A74]">Waiting Period</span>
                    <span className="font-medium text-[#1A1A18] tabular-nums">
                      {selectedProduct.waitingPeriodDays} days
                    </span>
                  </div>
                )}
              </div>

              {/* Monitored Peril Triggers */}
              <div className="space-y-2 pt-1">
                <div className="text-[11px] font-semibold text-[#4A4A45] uppercase tracking-wider">
                  Monitored Peril Triggers ({selectedProduct.monitoredHazards.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedProduct.monitoredHazards.map((h) => (
                    <span
                      key={h}
                      className="badge badge-neutral text-[10px] capitalize font-sans"
                    >
                      {h.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>

              {/* Coverages Schedule */}
              <div className="space-y-2 pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <div className="text-[11px] font-semibold text-[#4A4A45] uppercase tracking-wider">
                  Coverages Included ({selectedProduct.coverages.length})
                </div>
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                  {selectedProduct.coverages.map((cov) => (
                    <div
                      key={cov.code}
                      className="p-2.5 rounded flex items-center justify-between text-xs"
                      style={{
                        backgroundColor: 'var(--surface-raised)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <span className="text-[#1A1A18] font-medium">{cov.name}</span>
                      <span className="font-mono text-[10px] text-[#7A7A74] px-1.5 py-0.5 rounded bg-white border border-[#E2E0DB]">
                        {cov.code}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {selectedProduct.notes && (
                <div
                  className="p-3 text-[11px] text-[#7A7A74] italic leading-relaxed border-t"
                  style={{ borderColor: 'var(--border)' }}
                >
                  {selectedProduct.notes}
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-xs text-[#7A7A74]">
              Select a product to view specifications.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
