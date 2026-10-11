import React, { useState } from 'react';
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

export function Policies(): React.ReactElement {
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
    <div className="p-6 lg:p-8 space-y-6 fade-in max-w-7xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-heading font-semibold text-slate-900 tracking-tight">
            Policies & Locations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Commercial property accounts, location schedules, and policy drift history.
          </p>
        </div>

        <div className="w-72 relative">
          <input
            type="text"
            placeholder="Search policy # or insured name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:border-teal-500 shadow-sm"
          />
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3 top-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Main Grid: Policy List + Selected Policy Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1.3fr] gap-6">
        {/* Left: Policy List Table */}
        <section className="eds-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <span className="font-heading font-bold text-xs uppercase tracking-wider text-slate-700">
              Policies ({policies.length})
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Select to inspect details</span>
          </div>

          {policiesQuery.isLoading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading policy schedules...</div>
          ) : policies.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No matching policies found.</div>
          ) : (
            <div className="max-h-[640px] overflow-y-auto divide-y divide-slate-100">
              {policies.map((p: PolicyRecord) => {
                const isSelected = selectedPolicyId === p.policyId;

                return (
                  <div
                    key={p.policyId}
                    onClick={() => {
                      setSelectedPolicyId(p.policyId);
                      setActiveTab('summary');
                    }}
                    className={`p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-teal-50/60 border-l-4 border-teal-500 pl-3'
                        : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-heading font-bold text-sm text-slate-900">
                        {p.policyId}
                      </div>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {p.region}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-700 mt-1">
                      {p.account?.name ?? 'Commercial Insured'}
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 mt-2 pt-1 border-t border-slate-100/60">
                      <span>Premium: <strong>{formatMoney(p.premium)}</strong></span>
                      <span className="text-emerald-700 font-bold">{p.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Right: Policy Detail Inspector Drawer */}
        <section className="eds-card overflow-hidden bg-white">
          {!selectedPolicyId ? (
            <div className="p-16 text-center space-y-3 text-slate-400">
              <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium">Select a policy from the list to view locations, historical snapshots, and drift timelines.</p>
            </div>
          ) : detailQuery.isLoading ? (
            <div className="p-12 text-center text-xs text-slate-400">Loading policy details...</div>
          ) : !selectedDetail ? (
            <div className="p-8 text-center text-xs text-red-500">Failed to load policy record.</div>
          ) : (
            <div>
              {/* Policy Header */}
              <div className="p-6 border-b border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading font-extrabold text-2xl text-slate-900">
                    {selectedDetail.policy.policyId}
                  </h2>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800">
                    {selectedDetail.policy.status}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-700">
                  {selectedDetail.account?.name ?? 'Commercial Insured'}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                  <span>Territory: <strong>{selectedDetail.policy.region}</strong></span>
                  <span>&bull;</span>
                  <span>Premium: <strong>{formatMoney(selectedDetail.policy.premium)}</strong></span>
                </div>

                {/* Tabs Bar */}
                <div className="flex gap-2 pt-3 border-t border-slate-200">
                  {(['summary', 'locations', 'drift', 'snapshots'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                        activeTab === tab
                          ? 'bg-navy-900 text-white shadow-sm'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tab Contents */}
              <div className="p-6 max-h-[520px] overflow-y-auto">
                {activeTab === 'summary' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="eds-label">Bound Locations</span>
                        <div className="text-2xl font-heading font-extrabold text-slate-900 mt-1">
                          {selectedDetail.locations.length}
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                        <span className="eds-label">Latest Baseline TIV</span>
                        <div className="text-2xl font-heading font-extrabold text-teal-700 mt-1">
                          {selectedDetail.latestSnapshot ? formatMoney(selectedDetail.latestSnapshot.state.totalTiv) : '—'}
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                      <span className="eds-label">Account Metadata</span>
                      <div className="text-xs text-slate-700 flex justify-between">
                        <span>Account ID: <strong>{selectedDetail.policy.accountId}</strong></span>
                        <span>Territory: <strong>{selectedDetail.policy.region}</strong></span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'locations' && (
                  <div className="space-y-3">
                    {selectedDetail.locations.map((loc) => (
                      <div
                        key={loc.locationId}
                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-slate-900">{loc.addressLine}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                            {loc.locationId}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 flex justify-between">
                          <span>Flood Zone: <strong>{loc.floodZone}</strong> (Score {loc.floodScore})</span>
                          <span className="font-bold text-slate-900">{formatMoney(loc.tiv)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'drift' && (
                  <div className="space-y-3">
                    {selectedDetail.drift.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No drift events recorded for this policy.</p>
                    ) : (
                      selectedDetail.drift.map((ev) => (
                        <div
                          key={ev.eventId}
                          className="p-4 rounded-xl border border-slate-200 bg-white space-y-2 shadow-sm"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-slate-800">{ev.eventId}</span>
                            <SeverityChip severity={ev.severity} />
                          </div>
                          <p className="text-xs text-slate-700 font-medium">{ev.whyItMatters}</p>
                          <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                            <span>Status: <strong>{ev.status}</strong></span>
                            <span>Score: <strong>{ev.score} pts</strong></span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'snapshots' && (
                  <div className="space-y-3">
                    {selectedDetail.latestSnapshot ? (
                      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                            Snapshot: {selectedDetail.latestSnapshot.kind}
                          </span>
                          <span className="text-xs text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                            Active Baseline
                          </span>
                        </div>
                        <div className="text-lg font-heading font-extrabold text-navy-950">
                          Total TIV: {formatMoney(selectedDetail.latestSnapshot.state.totalTiv)}
                        </div>
                        <div className="text-xs text-slate-500">
                          Locations on schedule: {selectedDetail.latestSnapshot.state.locations.length}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No snapshot recorded.</p>
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
