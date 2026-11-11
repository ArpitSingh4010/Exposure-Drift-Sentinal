import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { usePortfolio, usePortfolioSummary } from '@/hooks/useApi';

function money(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
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

function ProgressBar({ share, cap, breach }: { share: number; cap: number; breach: boolean }): React.ReactElement {
  const displayCap = cap * 1.3;
  const fillPct = Math.min((share / displayCap) * 100, 100);
  const markerPct = (cap / displayCap) * 100;

  return (
    <div style={{ position: 'relative', height: '5px', backgroundColor: 'var(--surface-active)', borderRadius: '2px', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0,
        width: `${fillPct}%`,
        backgroundColor: breach ? 'var(--risk-high-fill)' : 'var(--green-primary)',
        borderRadius: '2px',
        transition: 'width 300ms ease',
      }} />
      <div style={{
        position: 'absolute', top: 0, bottom: 0,
        left: `${markerPct}%`,
        width: '1.5px',
        backgroundColor: 'var(--text-secondary)',
        zIndex: 1,
      }} title={`Appetite cap: ${(cap * 100).toFixed(0)}%`} />
    </div>
  );
}

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: '300px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <div className="spinner" />
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Loading portfolio exposure for {activeTabMeta.label}…
          </span>
        </div>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div style={{ padding: '1.5rem' }}>
        <div style={{
          padding: '0.875rem 1rem',
          backgroundColor: 'var(--risk-high-bg)',
          border: '1px solid var(--risk-high-border)',
          borderRadius: '5px',
          fontSize: '0.8125rem',
          color: 'var(--risk-high-text)',
        }}>
          Unable to compute portfolio exposure for {activeTabMeta.label}.
        </div>
      </div>
    );
  }

  const { totalPortfolioTiv, regions } = query.data;
  const breached = regions.filter((r) => r.breach);
  const summaries = summaryQuery.data ?? [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Page header */}
      <div style={{
        padding: '1.125rem 1.5rem 0',
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <h1 className="page-title">Portfolio Concentration</h1>
            <p className="page-desc">
              Regional appetite monitoring across 8 peril types. Total portfolio TIV:{' '}
              <strong style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                {money(totalPortfolioTiv)}
              </strong>
            </p>
          </div>
          {breached.length > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.3rem 0.6rem',
              backgroundColor: 'var(--risk-high-bg)',
              border: '1px solid var(--risk-high-border)',
              borderRadius: '4px',
              fontSize: '0.75rem',
              color: 'var(--risk-high-text)',
              fontWeight: 600,
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--risk-high-fill)' }} />
              {breached.length} appetite breach{breached.length > 1 ? 'es' : ''}
            </div>
          )}
        </div>

        {/* Peril tabs */}
        <div className="tab-list" style={{ padding: 0, marginLeft: 0 }}>
          {HAZARD_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setHazardTab(tab.id)}
              className={`tab-item${tab.id === activeHazard ? ' active' : ''}`}
              style={{ cursor: 'pointer', background: 'none', border: 'none', fontFamily: 'var(--font-sans)' }}
            >
              {tab.label}
              <span style={{
                marginLeft: '0.3rem',
                fontSize: '0.625rem',
                color: tab.id === activeHazard ? 'var(--green-primary)' : 'var(--text-faint)',
                fontWeight: 500,
              }}>
                {tab.cap}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Breach banner */}
        {breached.length > 0 && (
          <div style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--risk-high-bg)',
            border: '1px solid var(--risk-high-border)',
            borderRadius: '5px',
            fontSize: '0.8125rem',
            color: 'var(--risk-high-text)',
          }}>
            <strong>Appetite breach — {activeTabMeta.label}:</strong>{' '}
            {breached.map((r) => r.region).join(', ')} {breached.length === 1 ? 'has' : 'have'} exceeded the {activeTabMeta.cap} cap.
            Further endorsements in this territory require senior underwriting approval.
          </div>
        )}

        {/* Regional exposure — compact table layout */}
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '0.75rem 1.25rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Regional Concentration — {activeTabMeta.label}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                Share of high-risk TIV per region against the {activeTabMeta.cap} appetite cap.
              </div>
            </div>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th>Region</th>
                <th style={{ textAlign: 'right' }}>High-risk TIV</th>
                <th style={{ textAlign: 'right' }}>Concentration</th>
                <th style={{ width: '160px' }}>vs Cap</th>
                <th style={{ textAlign: 'right' }}>Headroom</th>
                <th style={{ textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {regions.map((region) => {
                const sharePct = (region.share * 100).toFixed(2);
                const capPct = (region.cap * 100).toFixed(0);
                const headroomPct = (region.headroom * 100).toFixed(2);
                const isOver = region.headroom < 0;

                return (
                  <tr key={region.region}>
                    <td>
                      <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                        {region.region}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        {money(region.floodTiv)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{
                        fontSize: '0.9375rem',
                        fontWeight: 600,
                        fontVariantNumeric: 'tabular-nums',
                        color: region.breach ? 'var(--risk-high-text)' : 'var(--text-primary)',
                      }}>
                        {sharePct}%
                      </span>
                    </td>
                    <td>
                      <ProgressBar share={region.share} cap={region.cap} breach={region.breach} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', fontSize: '0.6rem', color: 'var(--text-faint)' }}>
                        <span>0%</span>
                        <span>Cap {capPct}%</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span style={{
                        fontSize: '0.8125rem',
                        fontVariantNumeric: 'tabular-nums',
                        fontWeight: 500,
                        color: isOver ? 'var(--risk-high-text)' : 'var(--risk-low-text)',
                      }}>
                        {isOver ? `−${Math.abs(Number(headroomPct)).toFixed(2)}%` : `+${headroomPct}%`}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '0.1875rem 0.4375rem',
                        borderRadius: '3px',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        letterSpacing: '0.02em',
                        backgroundColor: region.breach ? 'var(--risk-high-bg)' : 'var(--risk-low-bg)',
                        color: region.breach ? 'var(--risk-high-text)' : 'var(--risk-low-text)',
                        border: `1px solid ${region.breach ? 'var(--risk-high-border)' : 'var(--risk-low-border)'}`,
                      }}>
                        {region.breach ? 'Breach' : 'OK'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Contributing policies per region */}
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Contributing Policies — {activeTabMeta.label}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
              Commercial property policies with high-risk exposure in this peril category.
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          }}>
            {regions.map((region, idx) => (
              <div
                key={region.region}
                style={{
                  padding: '1rem 1.25rem',
                  borderRight: idx < regions.length - 1 ? '1px solid var(--border)' : 'none',
                  borderBottom: idx < 2 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.625rem',
                }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {region.region}
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                    {region.contributingPolicies.length} pols
                  </span>
                </div>

                {region.contributingPolicies.length === 0 ? (
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-faint)', fontStyle: 'italic' }}>
                    No high-risk exposure in this territory.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3125rem' }}>
                    {region.contributingPolicies.slice(0, 6).map((p) => (
                      <div key={p.policyId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                          {p.policyId}
                        </span>
                        <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 500, color: 'var(--text-primary)' }}>
                          {money(p.tiv)}
                        </span>
                      </div>
                    ))}
                    {region.contributingPolicies.length > 6 && (
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        +{region.contributingPolicies.length - 6} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Cross-hazard summary table */}
        {summaries.length > 0 && (
          <div style={{
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                All-Peril Concentration Summary
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>
                Peak regional concentration versus appetite cap across all 8 monitored perils.
              </div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Peril</th>
                  <th>Worst region</th>
                  <th style={{ textAlign: 'right' }}>Concentration</th>
                  <th style={{ textAlign: 'right' }}>Cap</th>
                  <th style={{ textAlign: 'right' }}>Headroom</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((s) => {
                  const isActive = s.hazard === activeHazard;
                  const isOver = s.headroom < 0;
                  return (
                    <tr
                      key={s.hazard}
                      className="row-clickable"
                      onClick={() => setHazardTab(s.hazard)}
                      style={{ backgroundColor: isActive ? 'var(--surface-subtle)' : undefined }}
                    >
                      <td>
                        <span style={{ fontWeight: isActive ? 600 : 400, color: 'var(--text-primary)' }}>
                          {s.label}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>{s.worstRegion}</td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{
                          fontVariantNumeric: 'tabular-nums',
                          fontWeight: 600,
                          color: s.breach ? 'var(--risk-high-text)' : 'var(--text-primary)',
                        }}>
                          {(s.share * 100).toFixed(2)}%
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--text-secondary)' }}>
                          {(s.cap * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span style={{
                          fontVariantNumeric: 'tabular-nums',
                          fontWeight: 500,
                          color: isOver ? 'var(--risk-high-text)' : 'var(--risk-low-text)',
                        }}>
                          {isOver ? `−${(Math.abs(s.headroom) * 100).toFixed(2)}%` : `+${(s.headroom * 100).toFixed(2)}%`}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '0.125rem 0.4rem',
                          borderRadius: '3px',
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          letterSpacing: '0.02em',
                          backgroundColor: s.breach ? 'var(--risk-high-bg)' : 'var(--risk-low-bg)',
                          color: s.breach ? 'var(--risk-high-text)' : 'var(--risk-low-text)',
                          border: `1px solid ${s.breach ? 'var(--risk-high-border)' : 'var(--risk-low-border)'}`,
                        }}>
                          {s.breach ? 'Breach' : 'OK'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
