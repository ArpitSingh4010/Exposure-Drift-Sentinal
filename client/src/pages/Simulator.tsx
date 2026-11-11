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
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[#1A1A18]">
            External Signal Simulator
          </h1>
          <p className="text-xs text-[#7A7A74] mt-0.5">
            Inject real-world external signals to evaluate detection rules, multi-hazard materiality, and activity generation.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetDemo}
          disabled={resetting}
          className="btn btn-secondary text-xs"
        >
          {resetting ? 'Resetting Baseline...' : 'Reset Demo Baseline'}
        </button>
      </div>

      {resetMessage && (
        <div
          className="p-3 text-xs rounded"
          style={{
            backgroundColor: 'var(--green-subtle)',
            border: '1px solid var(--green-border)',
            color: 'var(--green-text)',
          }}
        >
          {resetMessage}
        </div>
      )}

      {error && (
        <div
          className="p-3 text-xs rounded"
          style={{
            backgroundColor: 'var(--risk-high-bg)',
            border: '1px solid var(--risk-high-border)',
            color: 'var(--risk-high-text)',
          }}
        >
          {error}
        </div>
      )}

      {/* Main Grid: Scenario Selector (Left) + Execution & Results (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 items-start">
        {/* Scenario Selection */}
        <section className="panel overflow-hidden bg-white">
          <div
            className="p-4 border-b flex items-center justify-between"
            style={{
              backgroundColor: 'var(--surface-raised)',
              borderColor: 'var(--border)',
            }}
          >
            <div>
              <h2 className="text-xs font-semibold tracking-tight text-[#1A1A18]">
                Select Scenario
              </h2>
              <p className="text-[11px] text-[#7A7A74]">
                Choose an external hazard or policy update signal to simulate
              </p>
            </div>
            <span className="text-[11px] text-[#7A7A74]">
              {SCENARIOS.length} scenarios
            </span>
          </div>

          <div className="p-3.5 space-y-2 max-h-[620px] overflow-y-auto">
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
                  className={`p-3 rounded cursor-pointer transition-colors ${
                    isSelected ? 'border-l-[3px] border-l-[#2D6A4F]' : 'hover:bg-[#FAFAF8]'
                  }`}
                  style={{
                    backgroundColor: isSelected ? 'var(--green-subtle)' : '#ffffff',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-[#1A1A18]">
                      {sc.label}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="badge badge-neutral text-[10px]">
                        {sc.tag}
                      </span>
                      <SeverityChip severity={sc.severity} />
                    </div>
                  </div>
                  <p className="text-xs text-[#4A4A45] mt-1 leading-relaxed">
                    {sc.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Execution & Output Console */}
        <section className="panel p-5 bg-white space-y-4 sticky top-6">
          <div className="border-b pb-3" style={{ borderColor: 'var(--border)' }}>
            <span className="text-[11px] font-medium text-[#7A7A74] uppercase tracking-wider">
              Active Scenario
            </span>
            <h3 className="text-sm font-semibold tracking-tight text-[#1A1A18] mt-0.5">
              {activeScenarioMeta.label}
            </h3>
            <p className="text-xs text-[#4A4A45] mt-1 leading-relaxed">
              Expected: <strong className="text-[#1A1A18] font-normal">{activeScenarioMeta.expectedResult}</strong>
            </p>
          </div>

          {/* Parameter Inputs */}
          <div className="space-y-3">
            {activeScenarioMeta.supportsHazard && (
              <div>
                <label className="block text-xs font-medium text-[#4A4A45] mb-1" htmlFor="hazard-select">
                  Monitored Peril
                </label>
                <select
                  id="hazard-select"
                  value={selectedHazard}
                  onChange={(e) => handleHazardChange(e.target.value)}
                  className="field-select w-full"
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
                <label className="block text-xs font-medium text-[#4A4A45]" htmlFor="policy-select">
                  Target Policy
                </label>
                <span className="text-[11px] text-[#7A7A74]">
                  Demo policy or custom ID
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  id="policy-select"
                  onChange={(e) => setPolicyId(e.target.value)}
                  className="field-select flex-1 text-xs"
                  value={policyId}
                >
                  <option value="" disabled>Select a target policy...</option>
                  <optgroup label="Curated Demo Policies (1 Per Hazard)">
                    {demoPolicies.map((p) => {
                      const prod = productByCode.get(p.productCode ?? 'CP-BASE');
                      return (
                        <option key={p.policyId} value={p.policyId}>
                          {p.policyId} — {p.account?.name ?? 'Insured'} ({prod?.name ?? p.productCode ?? 'CP-BASE'})
                        </option>
                      );
                    })}
                  </optgroup>
                  <optgroup label="Portfolio Accumulation Book ($300M Total TIV)">
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
                  className="field-input w-28 text-xs font-mono"
                  title="Directly enter custom or edge-case policy ID"
                />
              </div>

              {/* Selected Policy Context & Peril Gate Explanation */}
              {currentPolicy && (
                <div
                  className="rounded p-3 space-y-2 text-xs"
                  style={{
                    backgroundColor: 'var(--surface-raised)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#1A1A18]">
                      {currentPolicy.account?.name ?? 'Commercial Insured'} ({currentPolicy.policyId})
                    </span>
                    <span className="badge badge-neutral font-mono text-[10px]">
                      {currentPolicy.productCode ?? 'CP-BASE'}
                    </span>
                  </div>

                  <div className="text-[#4A4A45]">
                    <span className="text-[#7A7A74]">Product: </span>
                    <span className="font-medium text-[#1A1A18]">{currentProduct?.name ?? 'Commercial Property (Base All-Risk)'}</span>
                  </div>

                  <div
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] p-2.5 rounded bg-white"
                    style={{ border: '1px solid var(--border)' }}
                  >
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#7A7A74] tracking-wider block">
                        Monitored Perils
                      </span>
                      <span className="font-medium text-[#1A1A18] capitalize">
                        {currentProduct?.monitoredHazards ? currentProduct.monitoredHazards.join(', ') : 'All 8 Perils'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-[#7A7A74] tracking-wider block">
                        Deductible Terms
                      </span>
                      <span className="font-medium text-[#1A1A18] tabular-nums">
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
                        <div
                          className="text-[11px] rounded p-2 flex items-start gap-2"
                          style={{
                            backgroundColor: 'var(--green-subtle)',
                            border: '1px solid var(--green-border)',
                            color: 'var(--green-text)',
                          }}
                        >
                          <span className="font-semibold">Monitored Peril:</span>
                          <span>This product covers <strong>{selectedHazard}</strong>. Sentinel drift rules will score this signal and generate an Underwriter activity.</span>
                        </div>
                      ) : (
                        <div
                          className="text-[11px] rounded p-2 space-y-1"
                          style={{
                            backgroundColor: 'var(--risk-med-bg)',
                            border: '1px solid var(--risk-med-border)',
                            color: 'var(--risk-med-text)',
                          }}
                        >
                          <div className="font-semibold">Product Gate Suppressed:</div>
                          <p>
                            Policy product (<strong>{currentProduct.name}</strong>) does <em>not</em> cover <strong>{selectedHazard}</strong>.
                            Guidewire PolicyCenter product-model rules suppress this signal without alerting underwriters.
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
              className="btn btn-primary w-full justify-center text-xs mt-2"
            >
              {running ? 'Ingesting & Scoring Signal...' : 'Run Scenario'}
            </button>
          </div>

          {/* Results Display */}
          {lastResult && (
            <div className="pt-3 border-t space-y-3" style={{ borderColor: 'var(--border)' }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1A1A18]">Execution Receipt</span>
                {lastResult.event && (
                  <button
                    type="button"
                    onClick={() => navigate(`/events/${lastResult.event?.eventId}`)}
                    className="text-xs text-[#2D6A4F] font-medium hover:underline cursor-pointer"
                  >
                    View Event {lastResult.event.eventId} &rarr;
                  </button>
                )}
              </div>

              <div
                className="p-3 rounded text-xs font-mono space-y-1"
                style={{
                  backgroundColor: 'var(--surface-raised)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                }}
              >
                {lastResult.steps.map((st, i) => (
                  <div key={i} className="flex items-baseline gap-2">
                    <span className="text-[#A8A8A0] text-[10px] tabular-nums">{i + 1}.</span>
                    <span>{st}</span>
                  </div>
                ))}
              </div>

              {lastResult.event && (
                <div
                  className="p-3 rounded bg-white space-y-1.5 text-xs"
                  style={{ border: '1px solid var(--border)' }}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[#7A7A74]">Result Severity</span>
                    <SeverityChip severity={lastResult.event.severity} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#7A7A74]">Materiality Score</span>
                    <span className="font-semibold text-[#1A1A18] tabular-nums">{lastResult.event.score} points</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#7A7A74]">Portfolio Status</span>
                    <span className={`font-semibold ${lastResult.event.portfolioBreach ? 'text-[#B42318]' : 'text-[#2D6A4F]'}`}>
                      {lastResult.event.portfolioBreach ? 'Breach Triggered' : 'Within Appetite'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
