import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { runScenario, resetDemo, type SimulatorResult } from '@/api/client';
import { SeverityChip } from '@/components/SeverityChip';
import { useUserStore } from '@/hooks/useUserStore';
import { usePolicies, useProducts } from '@/hooks/useApi';

interface ScenarioMeta {
  name: string;
  label: string;
  tag: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  expectedResult: string;
  supportsHazard?: boolean;
}

const SCENARIOS: ScenarioMeta[] = [
  {
    name: 'hazard_update',
    label: 'Multi-Hazard Peril Update',
    tag: 'Multi-Hazard',
    severity: 'HIGH',
    supportsHazard: true,
    description: 'Environmental feed updates a location to high-risk band and increases score by +3 for the selected peril (Earthquake, Cyclone, Wildfire, etc.).',
    expectedResult: 'Fires R3 (band entry) + R4 (score increase) -> Creates HIGH severity activity for monitored product.',
  },
  {
    name: 'new_facility',
    label: 'New Facility Discovered',
    tag: 'Headline Demo',
    severity: 'HIGH',
    description: '3rd location in Savannah GA ($1.4M TIV) in flood zone AE (score 8). Total TIV moves to $5.4M (+35%). Pushes SE flood share to ~20.07%, crossing the 20% cap.',
    expectedResult: 'Fires R1 (high) + R2 + R3 + R5 -> Severity HIGH. Portfolio breach banner displayed.',
  },
  {
    name: 'tiv_increase',
    label: 'TIV Increase on Existing Location',
    tag: 'TIV Drift',
    severity: 'MEDIUM',
    description: "An existing location's TIV changes to $2M. Evaluates R1 thresholds based on percentage change. Lower-severity result than the new_facility scenario.",
    expectedResult: 'Fires R1 -> Severity MEDIUM or LOW depending on percentage. No breach.',
  },
  {
    name: 'flood_zone_update',
    label: 'Flood Hazard Re-mapping',
    tag: 'FEMA Update',
    severity: 'HIGH',
    description: 'Existing facility re-mapped from safe zone X to high-hazard AE (score 8). Demonstrates hazard-feed-driven drift without TIV change.',
    expectedResult: 'Fires R3 (zone worsened into high-risk AE) -> Severity HIGH.',
  },
  {
    name: 'verify_first_case',
    label: 'Ambiguous Entity Match',
    tag: 'Confidence Gate',
    severity: 'MEDIUM',
    description: 'Signal for Acme with ambiguous legal name and address variants. Entity match confidence falls below 0.75 threshold.',
    expectedResult: 'Event created with verifyFirst=true. Activity prefixed with "Verify match before review".',
  },
  {
    name: 'noise_small_change',
    label: 'Sub-Threshold Noise Signal',
    tag: 'Noise Filter',
    severity: 'LOW',
    supportsHazard: true,
    description: 'Minor change well below materiality cutoff (e.g. +2% TIV or score +1 in low-risk band). Filtered before creating activities.',
    expectedResult: 'Score = 0 -> Suppressed as immaterial noise. No event or activity created.',
  },
  {
    name: 'duplicate_signal',
    label: 'Duplicate Signal Deduplication',
    tag: 'Dedupe / Idempotency',
    severity: 'HIGH',
    supportsHazard: true,
    description: 'Submits the same signal twice in rapid succession. Exercises the partial unique index on open events.',
    expectedResult: 'Second signal merges into the existing open event; appends evidence without creating duplicate tickets.',
  },
];

const HAZARDS = [
  { id: 'earthquake',   label: 'Earthquake',           defaultPolicy: 'POL-200101' },
  { id: 'cyclone',      label: 'Cyclone / Hurricane',  defaultPolicy: 'POL-200103' },
  { id: 'wildfire',     label: 'Wildfire',             defaultPolicy: 'POL-200104' },
  { id: 'tsunami',      label: 'Tsunami',              defaultPolicy: 'POL-200102' },
  { id: 'landslide',    label: 'Landslide',            defaultPolicy: 'POL-200105' },
  { id: 'tornado',      label: 'Tornado',              defaultPolicy: 'POL-200106' },
  { id: 'severe_storm', label: 'Severe Storm',         defaultPolicy: 'POL-200107' },
  { id: 'flood',        label: 'Flood',                defaultPolicy: 'POL-100245' },
];

export function Simulator(): React.ReactElement {
  const { userId } = useUserStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const policiesQuery = usePolicies();
  const productsQuery = useProducts();

  const [policyId, setPolicyId] = useState('POL-200101');
  const [selectedScenario, setSelectedScenario] = useState('hazard_update');
  const [selectedHazard, setSelectedHazard] = useState('earthquake');
  const [running, setRunning] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [lastResult, setLastResult] = useState<SimulatorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const policies = policiesQuery.data ?? [];
  const products = productsQuery.data ?? [];
  const productByCode = new Map(products.map((p) => [p.productCode, p]));
  const activeScenarioMeta = SCENARIOS.find((s) => s.name === selectedScenario) ?? SCENARIOS[0]!;

  const DEMO_POLICY_IDS = new Set([
    'POL-100245',
    'POL-200101',
    'POL-200102',
    'POL-200103',
    'POL-200104',
    'POL-200105',
    'POL-200106',
    'POL-200107',
  ]);

  const demoPolicies = policies.filter((p) => DEMO_POLICY_IDS.has(p.policyId));
  const portfolioPolicies = policies.filter((p) => !DEMO_POLICY_IDS.has(p.policyId));
  const currentPolicy = policies.find((p) => p.policyId === policyId.trim());
  const currentProduct = currentPolicy ? productByCode.get(currentPolicy.productCode ?? 'CP-BASE') : undefined;

  const handleHazardChange = (hId: string) => {
    setSelectedHazard(hId);
    const match = HAZARDS.find((h) => h.id === hId);
    if (match) {
      setPolicyId(match.defaultPolicy);
    }
  };

  const handleRun = async (scenarioName = selectedScenario) => {
    setRunning(true);
    setError(null);
    setResetMessage(null);
    try {
      const result = await runScenario(
        userId,
        scenarioName,
        policyId.trim() || undefined,
        activeScenarioMeta.supportsHazard ? selectedHazard : undefined,
      );
      setLastResult(result);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['events'] }),
        queryClient.invalidateQueries({ queryKey: ['activities'] }),
        queryClient.invalidateQueries({ queryKey: ['portfolio'] }),
        queryClient.invalidateQueries({ queryKey: ['audit'] }),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRunning(false);
    }
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Reset all demo policies, snapshots, and portfolio back to clean baseline state?')) return;
    setResetting(true);
    setError(null);
    setLastResult(null);
    try {
      const res = await resetDemo(userId);
      setResetMessage(res.message);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['events'] }),
        queryClient.invalidateQueries({ queryKey: ['activities'] }),
        queryClient.invalidateQueries({ queryKey: ['portfolio'] }),
        queryClient.invalidateQueries({ queryKey: ['policies'] }),
        queryClient.invalidateQueries({ queryKey: ['audit'] }),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            Signal Simulator
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Inject real-world external signals to evaluate detection rules, multi-hazard materiality, and activity generation.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetDemo}
          disabled={resetting}
          className="btn-secondary text-xs"
        >
          <span>{resetting ? 'Resetting...' : 'Reset demo baseline'}</span>
        </button>
      </div>

      {resetMessage && (
        <div className="p-3 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
          {resetMessage}
        </div>
      )}

      {error && (
        <div className="p-3 rounded bg-red-50 border border-red-200 text-xs text-red-800">
          {error}
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
        {/* Scenario Selection */}
        <section className="eds-card overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h2 className="font-semibold text-sm text-slate-900">
              Select Scenario
            </h2>
            <p className="text-xs text-slate-500">
              Choose an external signal scenario to simulate.
            </p>
          </div>

          <div className="p-4 space-y-2.5 max-h-[580px] overflow-y-auto">
            {SCENARIOS.map((sc) => {
              const isSelected = selectedScenario === sc.name;

              return (
                <div
                  key={sc.name}
                  onClick={() => {
                    setSelectedScenario(sc.name);
                    if (sc.name === 'new_facility' || sc.name === 'flood_zone_update') {
                      setPolicyId('POL-100245');
                    } else if (sc.name === 'hazard_update') {
                      setPolicyId('POL-200101');
                    }
                  }}
                  className={`p-3.5 rounded border transition-colors cursor-pointer ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/40'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900">
                      {sc.label}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {sc.tag}
                      </span>
                      <SeverityChip severity={sc.severity} />
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {sc.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Execution & Output Panel */}
        <section className="eds-card p-5 space-y-4 bg-white flex flex-col justify-between">
          <div className="space-y-4">
            <div className="border-b border-slate-200 pb-3">
              <span className="text-xs font-medium text-slate-500">Active Scenario</span>
              <h3 className="font-semibold text-base text-slate-900 mt-0.5">
                {activeScenarioMeta.label}
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Expected outcome: <strong>{activeScenarioMeta.expectedResult}</strong>
              </p>
            </div>

            {/* Parameter Inputs */}
            <div className="space-y-3">
              {activeScenarioMeta.supportsHazard && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Monitored peril
                  </label>
                  <select
                    value={selectedHazard}
                    onChange={(e) => handleHazardChange(e.target.value)}
                    className="eds-select w-full"
                  >
                    {HAZARDS.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.label} (Default: {h.defaultPolicy})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-medium text-slate-700">
                    Target Policy
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Select a demo policy or enter an ID
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    onChange={(e) => setPolicyId(e.target.value)}
                    className="eds-select flex-1 text-xs"
                    value={policyId}
                  >
                    <option value="" disabled>Select a target policy...</option>
                    <optgroup label="⭐ Curated Scenario Demo Policies (1 Per Hazard)">
                      {demoPolicies.map((p) => {
                        const prod = productByCode.get(p.productCode ?? 'CP-BASE');
                        return (
                          <option key={p.policyId} value={p.policyId}>
                            {p.policyId} — {p.account?.name ?? 'Insured'} ({prod?.name ?? p.productCode ?? 'CP-BASE'})
                          </option>
                        );
                      })}
                    </optgroup>
                    <optgroup label="📁 Portfolio Accumulation Book ($300M Total TIV Invariant)">
                      {portfolioPolicies.map((p) => {
                        const prod = productByCode.get(p.productCode ?? 'CP-BASE');
                        return (
                          <option key={p.policyId} value={p.policyId}>
                            {p.policyId} — {p.account?.name ?? 'Commercial Insured'} ({prod?.name ?? p.productCode ?? 'CP-BASE'})
                          </option>
                        );
                      })}
                    </optgroup>
                  </select>

                  <input
                    type="text"
                    value={policyId}
                    onChange={(e) => setPolicyId(e.target.value)}
                    placeholder="Custom ID"
                    className="eds-input w-28 text-xs font-mono"
                    title="Directly enter custom or edge-case policy ID"
                  />
                </div>

                {/* Selected Policy Context & Peril Gate Explanation Card */}
                {currentPolicy && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50/90 p-3 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-slate-900">
                        {currentPolicy.account?.name ?? 'Commercial Insured'} ({currentPolicy.policyId})
                      </div>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold border border-blue-200">
                        {currentPolicy.productCode ?? 'CP-BASE'}
                      </span>
                    </div>

                    <div className="text-slate-700">
                      <span className="font-semibold text-slate-900">Product: </span>
                      {currentProduct?.name ?? 'Commercial Property (Base All-Risk)'}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 bg-white p-2.5 rounded border border-slate-200/70">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                          Monitored Perils
                        </span>
                        <span className="font-medium text-slate-800 capitalize">
                          {currentProduct?.monitoredHazards ? currentProduct.monitoredHazards.join(', ') : 'All 8 Perils'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                          Deductible & Terms
                        </span>
                        <span className="font-medium text-slate-800">
                          {currentProduct?.deductible
                            ? currentProduct.deductible.type === 'flat'
                              ? `$${currentProduct.deductible.value.toLocaleString()} flat`
                              : `${(currentProduct.deductible.value * 100).toFixed(0)}% location TIV`
                            : 'Standard terms'}
                        </span>
                      </div>
                    </div>

                    {/* Product Gating Explanation */}
                    {activeScenarioMeta.supportsHazard && currentProduct && (
                      (() => {
                        const monitorsPeril = currentProduct.monitoredHazards?.includes(selectedHazard);
                        return monitorsPeril ? (
                          <div className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded p-2 flex items-start gap-1.5">
                            <span className="font-bold">✓ Monitored Peril:</span>
                            <span>This product covers <strong>{selectedHazard}</strong>. Sentinel drift rules (R3/R4) will score this update and create an Underwriter activity.</span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded p-2 space-y-1">
                            <div className="font-bold flex items-center gap-1">
                              <span>⚠️ Product Gate Suppressed:</span>
                            </div>
                            <p>
                              This policy product (<strong>{currentProduct.name}</strong>) does <em>not</em> cover <strong>{selectedHazard}</strong>.
                              Guidewire PolicyCenter product-model rules will suppress this signal (HTTP 200, <code>hazard_not_monitored_by_product</code>) without creating an alert.
                            </p>
                          </div>
                        );
                      })()
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleRun()}
                disabled={running}
                className="btn-primary w-full justify-center disabled:opacity-50 mt-2"
              >
                <span>{running ? 'Ingesting & scoring signal...' : 'Run scenario'}</span>
              </button>
            </div>

            {/* Results Display */}
            {lastResult && (
              <div className="pt-3 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">Scenario Output</span>
                  {lastResult.event && (
                    <button
                      type="button"
                      onClick={() => navigate(`/events/${lastResult.event?.eventId}`)}
                      className="text-xs text-blue-700 font-medium hover:underline cursor-pointer"
                    >
                      View Drift Event {lastResult.event.eventId}
                    </button>
                  )}
                </div>

                <div className="p-3 rounded bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 space-y-1">
                  {lastResult.steps.map((st, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="text-slate-400">{i + 1}.</span>
                      <span>{st}</span>
                    </div>
                  ))}
                </div>

                {lastResult.event && (
                  <div className="p-3 rounded bg-white border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Result severity:</span>
                      <SeverityChip severity={lastResult.event.severity} />
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Materiality score:</span>
                      <span className="font-semibold text-slate-900">{lastResult.event.score} points</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Portfolio breach:</span>
                      <span className={`font-semibold ${lastResult.event.portfolioBreach ? 'text-red-600' : 'text-emerald-700'}`}>
                        {lastResult.event.portfolioBreach ? 'Breach triggered' : 'Within appetite'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
