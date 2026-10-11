import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { SeverityChip } from '@/components/SeverityChip';
import { usePolicies, usePolicy } from '@/hooks/useApi';

function money(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

type DetailTab = 'summary' | 'locations' | 'drift' | 'snapshots';

export function Policies(): React.ReactElement {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedId = location.pathname.split('/')[2] ?? '';
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<DetailTab>('summary');
  const list = usePolicies(search);
  const detail = usePolicy(selectedId);

  if (list.isLoading) {
    return <div className="p-6 text-sm text-gray-500">Loading policies…</div>;
  }
  if (list.isError) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          Unable to load policies. Check that the server is running.
        </div>
      </div>
    );
  }

  const tabs: { key: DetailTab; label: string }[] = [
    { key: 'summary', label: 'Summary' },
    { key: 'locations', label: 'Locations' },
    { key: 'drift', label: 'Drift' },
    { key: 'snapshots', label: 'Snapshots' },
  ];

  return (
    <div className="p-5 lg:p-6 fade-in">
      <div className="flex items-end justify-between gap-3 flex-wrap mb-5">
        <div>
          <p className="text-xs uppercase tracking-widest text-teal-700 font-semibold">Commercial property book</p>
          <h1 className="text-2xl font-semibold text-navy-950 mt-1">Policies</h1>
          <p className="text-sm text-gray-500 mt-1">
            {list.data?.length ?? 0} policies · search by policy ID or insured name
          </p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search policy or insured…"
          className="border border-gray-300 rounded px-3 py-2 text-sm w-64
                     focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none transition-shadow"
          aria-label="Search policies"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-5">
        {/* ── Policy register (left column) ── */}
        <section className="eds-card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 text-sm font-semibold">
            Policy register
          </div>
          <div className="max-h-[640px] overflow-y-auto">
            {list.data?.length === 0 && (
              <div className="p-6 text-sm text-gray-500 text-center">
                No policies match your search.
              </div>
            )}
            {list.data?.map((policy) => (
              <button
                key={policy.policyId}
                type="button"
                onClick={() => { navigate(`/policies/${policy.policyId}`); setTab('summary'); }}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50
                            transition-colors duration-100
                            ${selectedId === policy.policyId
                              ? 'bg-teal-50 border-l-2 border-l-teal-500'
                              : ''}`}
              >
                <div className="font-mono text-xs text-navy-900">{policy.policyId}</div>
                <div className="text-sm font-medium mt-1">{policy.account?.name ?? policy.accountId}</div>
                <div className="text-xs text-gray-500 mt-1">{policy.region} · {policy.status}</div>
              </button>
            ))}
          </div>
        </section>

        {/* ── Policy detail (right column) ── */}
        <section>
          {!selectedId ? (
            <div className="eds-card p-10 text-center text-sm text-gray-500">
              Select a policy from the register to inspect its locations, snapshots, and drift timeline.
            </div>
          ) : detail.isLoading ? (
            <div className="eds-card p-10 text-center text-sm text-gray-500">
              Loading policy detail…
            </div>
          ) : !detail.data ? (
            <div className="eds-card p-6 text-sm text-red-700">
              Policy detail unavailable.
            </div>
          ) : (
            <div className="space-y-5 fade-in">
              {/* Detail header */}
              <div className="eds-card p-5">
                <div className="flex justify-between gap-4 flex-wrap">
                  <div>
                    <div className="eds-label">Policy</div>
                    <h2 className="text-xl font-semibold text-navy-950 mt-1">{detail.data.policy.policyId}</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      {detail.data.account?.name} · {detail.data.account?.industry} · {detail.data.policy.region}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="eds-label">Premium</div>
                    <div className="text-lg font-semibold text-navy-950 mt-1">{money(detail.data.policy.premium)}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      <span className="chip chip-open">{detail.data.policy.status}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-200">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTab(t.key)}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors duration-150
                               ${tab === t.key
                                 ? 'border-teal-500 text-teal-700'
                                 : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  >
                    {t.label}
                    {t.key === 'drift' && detail.data.drift.length > 0 && (
                      <span className="ml-1.5 text-xs bg-teal-100 text-teal-700 rounded-full px-1.5 py-0.5">
                        {detail.data.drift.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              {tab === 'summary' && (
                <div className="eds-card p-5 space-y-4 slide-in">
                  <h3 className="font-semibold text-gray-900">Policy summary</h3>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div><div className="eds-label">Locations</div><div className="text-lg font-semibold mt-1">{detail.data.locations.length}</div></div>
                    <div>
                      <div className="eds-label">Total TIV</div>
                      <div className="text-lg font-semibold mt-1">
                        {money(detail.data.locations.reduce((sum, loc) => sum + loc.tiv, 0))}
                      </div>
                    </div>
                    <div><div className="eds-label">Drift events</div><div className="text-lg font-semibold mt-1">{detail.data.drift.length}</div></div>
                    <div>
                      <div className="eds-label">Latest snapshot</div>
                      <div className="text-sm font-medium mt-1">{detail.data.latestSnapshot?.kind ?? 'None'}</div>
                    </div>
                  </div>
                  {detail.data.drift.length > 0 && (
                    <div className="border-t border-gray-100 pt-4">
                      <div className="eds-label mb-2">Recent drift</div>
                      <div className="flex flex-wrap gap-2">
                        {detail.data.drift.slice(0, 5).map((evt) => (
                          <button
                            key={evt.eventId}
                            type="button"
                            onClick={() => navigate(`/events/${evt.eventId}`)}
                            className="inline-flex items-center gap-1.5 text-xs border border-gray-200 rounded px-2.5 py-1.5 hover:border-teal-400 hover:bg-teal-50 transition-colors"
                          >
                            <SeverityChip severity={evt.severity} />
                            <span className="font-mono text-gray-700">{evt.eventId}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === 'locations' && (
                <div className="eds-card overflow-hidden slide-in">
                  <div className="px-4 py-3 border-b border-gray-200 font-semibold text-sm">
                    Insured locations
                  </div>
                  {detail.data.locations.length === 0 ? (
                    <div className="p-6 text-sm text-gray-500 text-center">No locations recorded.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="eds-table min-w-[700px]">
                        <thead>
                          <tr>
                            <th>Location</th>
                            <th>TIV</th>
                            <th>Flood zone</th>
                            <th>Flood score</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detail.data.locations.map((loc) => (
                            <tr key={loc.locationId}>
                              <td>
                                <div className="font-medium">{loc.addressLine}</div>
                                <div className="text-xs text-gray-500">{loc.locationId}</div>
                              </td>
                              <td className="font-medium">{money(loc.tiv)}</td>
                              <td>
                                <span className={`chip ${['A', 'AE', 'V'].includes(loc.floodZone) ? 'chip-high' : 'chip-open'}`}>
                                  {loc.floodZone}
                                </span>
                              </td>
                              <td>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{loc.floodScore}</span>
                                  <div className="w-12 h-1.5 bg-gray-200 rounded-full">
                                    <div
                                      className={`h-full rounded-full ${loc.floodScore >= 7 ? 'bg-red-500' : loc.floodScore >= 4 ? 'bg-amber-500' : 'bg-teal-500'}`}
                                      style={{ width: `${(loc.floodScore / 10) * 100}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {tab === 'drift' && (
                <div className="eds-card overflow-hidden slide-in">
                  <div className="px-4 py-3 border-b border-gray-200 font-semibold text-sm">
                    Drift timeline
                  </div>
                  {detail.data.drift.length === 0 ? (
                    <div className="p-8 text-sm text-gray-500 text-center">
                      No drift events recorded for this policy.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {detail.data.drift.map((evt, idx) => (
                        <button
                          key={evt.eventId}
                          type="button"
                          onClick={() => navigate(`/events/${evt.eventId}`)}
                          className="w-full text-left px-4 py-4 hover:bg-gray-50 transition-colors group"
                        >
                          <div className="flex items-start gap-3">
                            {/* Timeline dot */}
                            <div className="flex flex-col items-center pt-1 flex-shrink-0">
                              <div className={`w-3 h-3 rounded-full ${
                                evt.severity === 'HIGH' ? 'bg-red-500' :
                                evt.severity === 'MEDIUM' ? 'bg-amber-500' : 'bg-blue-500'
                              }`} />
                              {idx < detail.data!.drift.length - 1 && (
                                <div className="w-0.5 flex-1 bg-gray-200 mt-1" style={{ minHeight: '20px' }} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs text-navy-900">{evt.eventId}</span>
                                <SeverityChip severity={evt.severity} />
                                <span className="chip chip-open">{evt.status.replace('_', ' ')}</span>
                                {evt.verifyFirst && <span className="chip chip-verify">Verify</span>}
                                {evt.portfolioBreach && <span className="chip chip-high">Breach</span>}
                              </div>
                              <p className="text-sm text-gray-700 mt-1 group-hover:text-teal-700 transition-colors">
                                {evt.whyItMatters}
                              </p>
                              <div className="text-xs text-gray-500 mt-1">
                                Score {evt.score} · {evt.ruleBreakdown.length} rules fired ·
                                {evt.createdAt ? ` ${new Date(evt.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}
                              </div>
                            </div>
                            <span className="text-gray-400 group-hover:text-teal-600 text-sm flex-shrink-0 pt-1">→</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === 'snapshots' && (
                <div className="eds-card overflow-hidden slide-in">
                  <div className="px-4 py-3 border-b border-gray-200 font-semibold text-sm">
                    Risk snapshots
                  </div>
                  {!detail.data.latestSnapshot ? (
                    <div className="p-8 text-sm text-gray-500 text-center">
                      No snapshots recorded. A BIND snapshot is created at policy inception.
                    </div>
                  ) : (
                    <div className="p-4 space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="chip chip-open">{detail.data.latestSnapshot.kind}</span>
                        <span className="text-sm text-gray-500">Latest snapshot</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="eds-label">Total TIV</div>
                          <div className="text-lg font-semibold mt-1">
                            {money(detail.data.latestSnapshot.state.totalTiv)}
                          </div>
                        </div>
                        <div>
                          <div className="eds-label">Locations</div>
                          <div className="text-lg font-semibold mt-1">
                            {detail.data.latestSnapshot.state.locations.length}
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-gray-100 pt-3">
                        <div className="eds-label mb-2">Snapshot locations</div>
                        <div className="space-y-2">
                          {detail.data.latestSnapshot.state.locations.map((loc) => (
                            <div key={loc.locationId} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                              <div>
                                <div className="font-medium">{loc.addressLine}</div>
                                <div className="text-xs text-gray-500">{loc.locationId} · Zone {loc.floodZone} · Score {loc.floodScore}</div>
                              </div>
                              <div className="font-medium">{money(loc.tiv)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
