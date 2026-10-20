import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { runScenario, resetDemo, type SimulatorResult } from '@/api/client';
import { SeverityChip } from '@/components/SeverityChip';
import { useUserStore } from '@/hooks/useUserStore';
import { usePolicies } from '@/hooks/useApi';

interface ScenarioMeta {
  name: string;
  label: string;
  tag: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  expectedResult: string;
}

const SCENARIOS: ScenarioMeta[] = [
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
    description: 'Tiny TIV change (+2%) well below the 10% materiality cutoff. No flood hazard change.',
    expectedResult: 'Score = 0 -> suppressed as immaterial noise. No event or activity created.',
  },
  {
    name: 'duplicate_signal',
    label: 'Duplicate Signal Deduplication',
    tag: 'Dedupe / E11000',
    severity: 'HIGH',
    description: 'Submits the same signal twice in rapid succession. Exercises the partial unique index on open events.',
    expectedResult: 'Second signal merges into the existing open event; appends evidence without creating duplicate tickets.',
  },
];

export function Simulator(): React.ReactElement {
  const { userId } = useUserStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const policiesQuery = usePolicies();

  const [policyId, setPolicyId] = useState('POL-100245');
  const [selectedScenario, setSelectedScenario] = useState('new_facility');
  const [running, setRunning] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [lastResult, setLastResult] = useState<SimulatorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const policies = policiesQuery.data ?? [];
  const activeScenarioMeta = SCENARIOS.find((s) => s.name === selectedScenario) ?? SCENARIOS[0]!;
  const selectedPolicyRecord = policies.find((p) => p.policyId === policyId.trim());

  const handleRun = async (scenarioName = selectedScenario) => {
    setRunning(true);
    setError(null);
    setResetMessage(null);
    try {
      const result = await runScenario(userId, scenarioName, policyId.trim());
      setLastResult(result);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['events'] }),
        queryClient.invalidateQueries({ queryKey: ['activities'] }),
        queryClient.invalidateQueries({ queryKey: ['portfolio'] }),
        queryClient.invalidateQueries({ queryKey: ['audit'] }),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scenario execution failed');
    } finally {
      setRunning(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    setError(null);
    setResetMessage(null);
    setLastResult(null);
    try {
      const res = await resetDemo(userId);
      setResetMessage(res.message);
      setTimeout(async () => {
        await queryClient.invalidateQueries();
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setResetting(false);
    }
  };

  const generatedEventId =
    lastResult?.event && typeof lastResult.event === 'object' && 'eventId' in lastResult.event
      ? String(lastResult.event.eventId)
      : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 fade-in max-w-7xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-2xl font-heading font-semibold text-slate-900 tracking-tight">
            Signal Simulator
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Simulate asynchronous external signals (building permits, tax assessors, flood map updates).
          </p>
        </div>

        <button
          onClick={handleReset}
          disabled={resetting}
          className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          {resetting ? 'Resetting Demo...' : 'Reset Demo Baseline'}
        </button>
      </div>

      {resetMessage && (
        <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-100 text-xs text-slate-800">
          {resetMessage}
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-lg border border-red-200 bg-red-50 text-xs text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* Target Policy bar */}
      <div className="eds-card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-semibold text-slate-700">Target Policy:</span>
          <select
            value={policyId}
            onChange={(e) => setPolicyId(e.target.value)}
            className="font-mono text-xs font-semibold text-slate-900 px-3 py-1.5 rounded-lg border border-slate-300 bg-white shadow-sm outline-none focus:border-teal-500 max-w-xs sm:max-w-md"
          >
            <option value="POL-100245">POL-100245 — Northwind Fabrication (Headline Demo)</option>
            {policies
              .filter((p) => p.policyId !== 'POL-100245')
              .map((p) => (
                <option key={p.policyId} value={p.policyId}>
                  {p.policyId} — {p.account?.name ?? 'Commercial Insured'} ({p.region})
                </option>
              ))}
          </select>
          {selectedPolicyRecord && (
            <span className="text-xs text-teal-700 font-semibold bg-teal-50 px-2.5 py-1 rounded-md border border-teal-200">
              {selectedPolicyRecord.account?.name} &bull; {selectedPolicyRecord.region}
            </span>
          )}
          {policyId !== 'POL-100245' && (
            <button
              type="button"
              onClick={() => setPolicyId('POL-100245')}
              className="text-[11px] font-bold text-teal-700 hover:text-teal-900 underline"
            >
              Reset to Demo Policy
            </button>
          )}
        </div>

        <button
          onClick={() => handleRun()}
          disabled={running}
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
        >
          {running ? 'Running...' : `Run Scenario: ${activeScenarioMeta.label}`}
        </button>
      </div>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {SCENARIOS.map((sc) => {
          const isSelected = selectedScenario === sc.name;

          return (
            <div
              key={sc.name}
              onClick={() => setSelectedScenario(sc.name)}
              className={`eds-card p-4 cursor-pointer space-y-2.5 transition-all ${
                isSelected
                  ? 'border-slate-800 ring-1 ring-slate-800 bg-slate-50/30'
                  : 'hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    {sc.tag}
                  </span>
                  <h3 className="font-heading font-semibold text-sm text-slate-900 mt-0.5">
                    {sc.label}
                  </h3>
                </div>
                <SeverityChip severity={sc.severity} />
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {sc.description}
              </p>

              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                <span className="font-medium text-slate-700">Expected:</span> {sc.expectedResult}
              </div>

              <div className="pt-1 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400">
                  {sc.name}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedScenario(sc.name);
                    void handleRun(sc.name);
                  }}
                  disabled={running}
                  className="px-2.5 py-1 rounded text-xs font-medium bg-slate-100 text-slate-800 hover:bg-slate-200 transition-colors"
                >
                  Run
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Output Console (Clean developer style) */}
      {lastResult && (
        <section className="eds-card overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <span className="font-mono text-xs font-semibold text-slate-700">
              Execution Log: {lastResult.scenario}
            </span>
            {generatedEventId && (
              <button
                onClick={() => navigate(`/events/${generatedEventId}`)}
                className="px-3 py-1 rounded text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
              >
                Inspect Event {generatedEventId} &rarr;
              </button>
            )}
          </div>

          <div className="p-4 font-mono text-xs space-y-1.5 bg-slate-50/50 max-h-60 overflow-y-auto">
            {lastResult.steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2 text-slate-700">
                <span className="text-slate-400 select-none">[{idx + 1}]</span>
                <span className={step.includes('breach') || step.includes('created') ? 'font-semibold text-slate-900' : ''}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
