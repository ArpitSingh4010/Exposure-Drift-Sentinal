import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchPolicies, fetchPolicy, type PolicyRecord } from '@/api/client';
import { SeverityChip } from '@/components/SeverityChip';
import { useUserStore } from '@/hooks/useUserStore';

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export const PRODUCT_LABELS: Record<string, { name: string; description: string }> = {
  'CP-BASE': { name: 'Base All-Risk', description: 'Monitors all 8 perils' },
  'CP-FLD':  { name: 'Commercial Flood Coverage', description: 'Monitors flood' },
  'CP-EQ':   { name: 'Commercial Earthquake Coverage', description: 'Monitors earthquake' },
  'CP-TSU':  { name: 'Tsunami & Coastal Inundation', description: 'Monitors tsunami' },
  'CP-WND':  { name: 'Named Storm & Hurricane', description: 'Monitors cyclone/hurricane' },
  'CP-WLD':  { name: 'Wildfire Coverage', description: 'Monitors wildfire' },
  'CP-LSL':  { name: 'Landslide & Earth Movement', description: 'Monitors landslide' },
  'CP-TOR':  { name: 'Tornado & Windstorm', description: 'Monitors tornado' },
  'CP-SCS':  { name: 'Severe Convective Storm', description: 'Monitors severe storm' },
};

export function Policies(): React.ReactElement {
  const navigate = useNavigate();
  const { userId } = useUserStore();
  const [search, setSearch] = useState('');
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'locations' | 'drift' | 'snapshots'>('summary');

  const policiesQuery = useQuery({
    queryKey: ['policies', userId, search],
    queryFn: () => fetchPolicies(userId, search),
  });

  const detailQuery = useQuery({
    queryKey: ['policy', userId, selectedPolicyId],
    queryFn: () => (selectedPolicyId ? fetchPolicy(selectedPolicyId, userId) : null),
    enabled: Boolean(selectedPolicyId),
  });

  const policies = policiesQuery.data ?? [];
  const selectedDetail = detailQuery.data;

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[#1A1A18]">
            Policies & Location Schedules
          </h1>
          <p className="text-xs text-[#7A7A74] mt-0.5">
            Commercial property policy book, insured location schedules, and active baseline snapshots.
          </p>
        </div>

        {/* Search */}
        <div className="w-80 relative">
          <input
            type="text"
            placeholder="Search policy # or insured name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="field-input w-full pl-8"
          />
          <svg
            className="w-3.5 h-3.5 text-[#7A7A74] absolute left-2.5 top-2.5 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Main Grid: Policy Master List + Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.3fr] gap-6 items-start">
        {/* Left: Policy Master Table */}
        <section className="panel overflow-hidden bg-white">
          <div
            className="px-4 py-3 flex items-center justify-between border-b"
            style={{
              backgroundColor: 'var(--surface-raised)',
              borderColor: 'var(--border)',
            }}
          >
            <span className="text-xs font-semibold text-[#1A1A18]">
              Policies ({policies.length})
            </span>
            <span className="text-[11px] text-[#7A7A74]">Click to inspect details</span>
          </div>

          {policiesQuery.isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center text-[#7A7A74] space-y-2">
              <div className="spinner" />
              <p className="text-xs">Loading policy schedules...</p>
            </div>
          ) : policies.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#7A7A74]">
              No matching policies found.
            </div>
          ) : (
            <div className="max-h-[660px] overflow-y-auto divide-y" style={{ borderColor: 'var(--border)' }}>
              {policies.map((p: PolicyRecord) => {
                const isSelected = selectedPolicyId === p.policyId;

                return (
                  <div
                    key={p.policyId}
                    onClick={() => {
                      setSelectedPolicyId(p.policyId);
                      setActiveTab('summary');
                    }}
                    className={`p-3.5 cursor-pointer transition-colors ${
                      isSelected
                        ? 'border-l-[3px] border-l-[#2D6A4F]'
                        : 'hover:bg-[#FAFAF8]'
                    }`}
                    style={{
                      backgroundColor: isSelected ? 'var(--green-subtle)' : '#ffffff',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-[#1A1A18]">
                          {p.policyId}
                        </span>
                        <span className="badge badge-neutral font-mono text-[10px]">
                          {p.productCode ?? 'CP-BASE'}
                        </span>
                      </div>
                      <span className="text-[11px] text-[#7A7A74]">
                        {p.region}
                      </span>
                    </div>

                    <div className="text-xs font-medium text-[#1A1A18] mt-1">
                      {p.account?.name ?? 'Commercial Insured'}
                    </div>

                    <div className="text-[11px] text-[#7A7A74] mt-0.5">
                      {PRODUCT_LABELS[p.productCode ?? 'CP-BASE']?.name ?? 'Commercial Property'}
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#7A7A74] mt-2 pt-1.5 border-t border-[#F2F1EE]">
                      <span>Premium: <strong className="text-[#1A1A18] font-normal tabular-nums">{formatMoney(p.premium)}</strong></span>
                      <span className="badge badge-low text-[10px]">
                        {p.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right: Policy Detail Inspector Panel */}
        <section className="panel overflow-hidden bg-white">
          {!selectedPolicyId ? (
            <div className="p-16 text-center space-y-2 text-[#7A7A74]">
              <div className="text-2xl mb-1 text-[#A8A8A0]">☵</div>
              <p className="text-xs font-medium text-[#4A4A45]">No policy selected</p>
              <p className="text-[11px] text-[#7A7A74] max-w-xs mx-auto">
                Select a policy from the list on the left to inspect bound locations, historical snapshots, and associated drift events.
              </p>
            </div>
          ) : detailQuery.isLoading ? (
            <div className="p-16 flex flex-col items-center justify-center text-[#7A7A74] space-y-2">
              <div className="spinner" />
              <p className="text-xs">Loading policy details...</p>
            </div>
          ) : !selectedDetail ? (
            <div className="p-8 text-center text-xs text-[#B42318]">Failed to load policy record.</div>
          ) : (
            <div>
              {/* Policy Detail Header */}
              <div
                className="p-5 border-b space-y-2.5"
                style={{
                  backgroundColor: 'var(--surface-raised)',
                  borderColor: 'var(--border)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-lg font-semibold tracking-tight text-[#1A1A18]">
                      {selectedDetail.policy.policyId}
                    </h2>
                    <span className="badge badge-neutral font-mono text-[10px]">
                      {selectedDetail.policy.productCode ?? 'CP-BASE'}
                    </span>
                  </div>
                  <span className="badge badge-low text-[10px]">
                    {selectedDetail.policy.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-baseline gap-2 text-xs">
                  <span className="font-semibold text-[#1A1A18]">
                    {selectedDetail.account?.name ?? 'Commercial Insured'}
                  </span>
                  <span className="text-[#A8A8A0]">·</span>
                  <span className="text-[#2D6A4F] font-medium">
                    {PRODUCT_LABELS[selectedDetail.policy.productCode ?? 'CP-BASE']?.name ?? 'Commercial Property'}
                  </span>
                  <span className="text-[#7A7A74]">
                    ({PRODUCT_LABELS[selectedDetail.policy.productCode ?? 'CP-BASE']?.description ?? 'Monitored hazards'})
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-[#7A7A74] pt-1">
                  <span>Territory: <strong className="text-[#1A1A18] font-normal">{selectedDetail.policy.region}</strong></span>
                  <span>Premium: <strong className="text-[#1A1A18] font-normal tabular-nums">{formatMoney(selectedDetail.policy.premium)}</strong></span>
                </div>

                {/* Tabs Bar */}
                <div className="tab-list pt-2">
                  {(['summary', 'locations', 'drift', 'snapshots'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`tab-item capitalize text-xs ${activeTab === tab ? 'active' : ''}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Contents */}
              <div className="p-5 max-h-[520px] overflow-y-auto">
                {activeTab === 'summary' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        className="p-4 rounded"
                        style={{
                          backgroundColor: 'var(--surface-raised)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <span className="text-[11px] font-medium text-[#7A7A74] uppercase tracking-wider">
                          Bound Locations
                        </span>
                        <div className="text-xl font-semibold text-[#1A1A18] tabular-nums mt-1">
                          {selectedDetail.locations.length}
                        </div>
                      </div>
                      <div
                        className="p-4 rounded"
                        style={{
                          backgroundColor: 'var(--surface-raised)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <span className="text-[11px] font-medium text-[#7A7A74] uppercase tracking-wider">
                          Latest Baseline TIV
                        </span>
                        <div className="text-xl font-semibold text-[#2D6A4F] tabular-nums mt-1">
                          {selectedDetail.latestSnapshot ? formatMoney(selectedDetail.latestSnapshot.state.totalTiv) : '—'}
                        </div>
                      </div>
                    </div>

                    <div
                      className="p-4 rounded space-y-2"
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid var(--border)',
                      }}
                    >
                      <span className="text-[11px] font-medium text-[#7A7A74] uppercase tracking-wider">
                        Account Information
                      </span>
                      <div className="text-xs text-[#4A4A45] flex justify-between py-1 border-b border-[#F2F1EE]">
                        <span className="text-[#7A7A74]">Account ID</span>
                        <span className="font-mono text-[#1A1A18]">{selectedDetail.policy.accountId}</span>
                      </div>
                      <div className="text-xs text-[#4A4A45] flex justify-between py-1 border-b border-[#F2F1EE]">
                        <span className="text-[#7A7A74]">Region</span>
                        <span className="text-[#1A1A18]">{selectedDetail.policy.region}</span>
                      </div>
                      <div className="text-xs text-[#4A4A45] flex justify-between py-1">
                        <span className="text-[#7A7A74]">Product Model</span>
                        <span className="text-[#1A1A18]">{selectedDetail.policy.productCode ?? 'CP-BASE'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'locations' && (
                  <div className="space-y-3">
                    {selectedDetail.locations.map((loc) => (
                      <div
                        key={loc.locationId}
                        className="p-3.5 rounded space-y-1.5"
                        style={{
                          backgroundColor: 'var(--surface-raised)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#1A1A18]">{loc.addressLine}</span>
                          <span className="font-mono text-[10px] text-[#7A7A74] px-1.5 py-0.5 rounded bg-[#F2F1EE]">
                            {loc.locationId}
                          </span>
                        </div>
                        <div className="text-xs text-[#7A7A74] flex justify-between items-baseline">
                          <div>
                            {loc.floodZone && (
                              <span>Flood Zone: <strong className="text-[#4A4A45]">{loc.floodZone}</strong> (Score {loc.floodScore})</span>
                            )}
                            {loc.hazards && Object.entries(loc.hazards).map(([h, r]) => (
                              <span key={h} className="block text-[#7A7A74] capitalize mt-0.5">
                                {h}: <strong className="text-[#4A4A45]">{r.band}</strong> ({r.score}/10)
                              </span>
                            ))}
                          </div>
                          <span className="font-semibold text-[#1A1A18] tabular-nums">{formatMoney(loc.tiv)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'drift' && (
                  <div className="space-y-3">
                    {selectedDetail.drift.length === 0 ? (
                      <p className="text-xs text-[#7A7A74] italic p-4 text-center">No drift events recorded for this policy.</p>
                    ) : (
                      selectedDetail.drift.map((ev) => (
                        <div
                          key={ev.eventId}
                          onClick={() => navigate(`/events/${ev.eventId}`)}
                          className="p-3.5 rounded space-y-2 cursor-pointer transition-colors hover:bg-[#FAFAF8]"
                          style={{
                            border: '1px solid var(--border)',
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-semibold text-[#1A1A18] hover:text-[#2D6A4F] transition-colors">
                              {ev.eventId} &rarr;
                            </span>
                            <SeverityChip severity={ev.severity} />
                          </div>
                          <p className="text-xs text-[#4A4A45] leading-relaxed">{ev.whyItMatters}</p>
                          <div className="flex items-center justify-between text-xs text-[#7A7A74] pt-1 border-t border-[#F2F1EE]">
                            <span>Status: <strong className="text-[#1A1A18] capitalize font-normal">{ev.status.replace(/_/g, ' ').toLowerCase()}</strong></span>
                            <span>Score: <strong className="text-[#1A1A18] font-normal tabular-nums">{ev.score} pts</strong></span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'snapshots' && (
                  <div className="space-y-3">
                    {selectedDetail.latestSnapshot ? (
                      <div
                        className="p-4 rounded space-y-2"
                        style={{
                          backgroundColor: 'var(--surface-raised)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#4A4A45]">
                            Snapshot: {selectedDetail.latestSnapshot.kind}
                          </span>
                          <span className="badge badge-low text-[10px]">
                            Active Baseline
                          </span>
                        </div>
                        <div className="text-lg font-semibold text-[#1A1A18] tabular-nums">
                          Total TIV: {formatMoney(selectedDetail.latestSnapshot.state.totalTiv)}
                        </div>
                        <div className="text-xs text-[#7A7A74]">
                          Locations on schedule: {selectedDetail.latestSnapshot.state.locations.length}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-[#7A7A74] italic p-4 text-center">No baseline snapshot recorded.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
