import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { runScenario, resetDemo, type SimulatorResult } from '@/api/client';
import { SeverityChip } from '@/components/SeverityChip';
import { useUserStore } from '@/hooks/useUserStore';

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

  const [policyId, setPolicyId] = useState('POL-100245');
  const [selectedScenario, setSelectedScenario] = useState('new_facility');
  const [running, setRunning] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [lastResult, setLastResult] = useState<SimulatorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const activeScenarioMeta = SCENARIOS.find((s) => s.name === selectedScenario) ?? SCENARIOS[0]!;

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
    <div className="p-6 lg:p-8 eds-canvas min-h-full space-y-6 fade-in">
      {/* Page Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200">
              Demo Intelligence Tool
            </span>
            <span className="text-xs text-slate-400">&bull;</span>
            <span className="text-xs text-slate-500 font-medium">Deterministic Signal Injection</span>
          </div>
          <h1 className="text-3xl font-heading font-extrabold text-slate-900 mt-1 tracking-tight">
            Signal Simulator
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Simulate asynchronous external data feeds (building permits, municipal assessor updates, FEMA flood zone re-mappings) without live external API dependencies.
          </p>
        </div>

        {/* Reset Demo Button */}
        <button
          onClick={handleReset}
          disabled={resetting}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-400 transition-all shadow-sm disabled:opacity-50"
        >
          {resetting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
              Resetting Database...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset Demo Baseline ($300M TIV)
            </>
          )}
        </button>
      </div>

      {resetMessage && (
        <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/70 text-xs font-bold text-teal-900 flex items-center gap-2 shadow-sm">
          <span className="pulse-dot pulse-dot-green" />
          {resetMessage}
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-xs text-red-700 font-semibold shadow-sm">
          {error}
        </div>
      )}

      {/* Target Policy Selection Bar */}
      <div className="eds-card p-5 bg-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="eds-label text-slate-400">Target Policy:</span>
          <input
            type="text"
            value={policyId}
            onChange={(e) => setPolicyId(e.target.value)}
            className="font-mono text-sm font-bold text-navy-950 px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white w-44 focus:border-teal-500"
          />
          <span className="text-xs text-slate-500 hidden sm:inline">
            (Demo Commercial Account: <strong>Northwind Fabrication</strong>)
          </span>
        </div>

        <button
          onClick={() => handleRun()}
          disabled={running}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-glow hover:opacity-95 transition-all disabled:opacity-50"
        >
          {running ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing Signal & Rules...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              </svg>
              Run Scenario: {activeScenarioMeta.label}
            </>
          )}
        </button>
      </div>

      {/* Scenario Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {SCENARIOS.map((sc) => {
          const isSelected = selectedScenario === sc.name;

          return (
            <div
              key={sc.name}
              onClick={() => setSelectedScenario(sc.name)}
              className={`eds-card p-5 cursor-pointer space-y-3 transition-all relative overflow-hidden ${
                isSelected
                  ? 'border-teal-500 ring-2 ring-teal-400/40 bg-teal-50/10 shadow-md'
                  : 'hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 uppercase tracking-wider">
                    {sc.tag}
                  </span>
                  <h3 className="font-heading font-bold text-base text-slate-900 mt-1">
                    {sc.label}
                  </h3>
                </div>
                <SeverityChip severity={sc.severity} />
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {sc.description}
              </p>

              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
                <div className="font-semibold text-slate-700">Expected Result:</div>
                <div className="text-teal-800 font-medium">{sc.expectedResult}</div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold text-slate-400">
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
                  className="px-3 py-1 rounded-lg text-[11px] font-bold bg-navy-900 text-white hover:bg-navy-800 transition-colors"
                >
                  Run Scenario
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Terminal Step Log */}
      {lastResult && (
        <section className="eds-card overflow-hidden border-navy-900 bg-slate-950 text-slate-200 shadow-xl">
          <div className="px-5 py-3.5 bg-navy-900/90 border-b border-navy-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                Execution Log: {lastResult.scenario}
              </span>
            </div>
            {generatedEventId && (
              <button
                onClick={() => navigate(`/events/${generatedEventId}`)}
                className="px-3 py-1 rounded-md text-xs font-bold bg-teal-500 text-navy-950 hover:bg-teal-400 transition-colors shadow-sm"
              >
                Inspect Event {generatedEventId} &rarr;
              </button>
            )}
          </div>

          <div className="p-5 font-mono text-xs space-y-2 max-h-72 overflow-y-auto">
            {lastResult.steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-2 text-slate-300">
                <span className="text-slate-500 font-semibold select-none">[{idx + 1}]</span>
                <span className={step.includes('breach') || step.includes('created') ? 'text-teal-300 font-bold' : ''}>
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
