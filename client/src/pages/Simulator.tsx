import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { runScenario, resetDemo, type SimulatorResult } from '@/api/client';
import { SeverityChip } from '@/components/SeverityChip';
import { useUserStore } from '@/hooks/useUserStore';

interface ScenarioInfo {
  id: string;
  label: string;
  description: string;
  icon: string;
}

const SCENARIOS: ScenarioInfo[] = [
  {
    id: 'new_facility',
    label: 'New facility discovered',
    description: 'A third location is discovered for the demo policy in flood zone AE. Fires R1 (TIV +35%), R2 (new location), R3 (high-risk zone), and R5 (combined escalation). Expected: HIGH severity, portfolio breach.',
    icon: '\u{1F3ED}',
  },
  {
    id: 'tiv_increase',
    label: 'TIV increase',
    description: "An existing location's TIV changes to $2M. Evaluates R1 thresholds based on percentage change. Lower-severity result than the new_facility scenario.",
    icon: '\u{1F4C8}',
  },
  {
    id: 'flood_zone_update',
    label: 'Flood zone update',
    description: "A flood hazard feed reports a location's zone has changed to AE (score 8). Fires R3 and/or R4 depending on the delta from the current snapshot.",
    icon: '\u{1F30A}',
  },
  {
    id: 'verify_first_case',
    label: 'Verify-first case',
    description: 'A signal arrives with only "Acme" as the insured name - no policy ID. Entity resolution returns a low-confidence match, so the event is created with verifyFirst=true.',
    icon: '\u{1F50D}',
  },
  {
    id: 'noise_small_change',
    label: 'Noise (small change)',
    description: 'A minor TIV adjustment that falls below the R1 threshold. May produce a LOW severity event or no event at all, demonstrating the noise filter.',
    icon: '\u{1F4C9}',
  },
  {
    id: 'duplicate_signal',
    label: 'Duplicate signal',
    description: 'The new_facility signal is sent twice. The second submission is deduplicated - merged into the existing open event instead of creating a new one.',
    icon: '\u{267B}\u{FE0F}',
  },
];

export function Simulator(): React.ReactElement {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userId } = useUserStore();
  const [policyId, setPolicyId] = useState('POL-100245');
  const [result, setResult] = useState<SimulatorResult | null>(null);
  const [steps, setSteps] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState('');
  const [activeScenario, setActiveScenario] = useState('');

  async function run(name: string): Promise<void> {
    setBusy(true);
    setError('');
    setActiveScenario(name);
    setResult(null);
    setSteps([]);
    try {
      const res = await runScenario(userId, name, policyId);
      setResult(res);
      setSteps(res.steps);
      await queryClient.invalidateQueries();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Scenario failed');
    } finally {
      setBusy(false);
    }
  }

  async function handleReset(): Promise<void> {
    setResetting(true);
    setError('');
    setResult(null);
    setSteps([]);
    setActiveScenario('');
    try {
      await resetDemo(userId);
      await new Promise((resolve) => setTimeout(resolve, 3000));
      await queryClient.invalidateQueries();
      setSteps([
        'Demo database reset to seed state.',
        'All drift events, activities, and audit entries cleared.',
        'Portfolio exposure restored to baseline.',
      ]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Reset failed');
    } finally {
      setResetting(false);
    }
  }

  const event = result?.event ?? null;

  return (
    <div className="p-5 lg:p-6 fade-in space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-widest text-teal-700 font-semibold">Demo tool</p>
          <h1 className="text-2xl font-semibold text-navy-950 mt-1">Signal Simulator</h1>
          <p className="text-sm text-gray-500 mt-1">
            Run deterministic local signals without calling an external feed. Each scenario submits a signal
            through the full ingestion pipeline.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleReset()}
          disabled={resetting || busy}
          className="px-4 py-2 text-sm rounded border border-red-300 text-red-700 bg-red-50
                     hover:bg-red-100 disabled:opacity-50 transition-colors flex items-center gap-2"
        >
          {resetting ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-red-300 border-t-red-700 rounded-full animate-spin" />
              Resetting...
            </>
          ) : (
            <>
              <span aria-hidden="true">{'\u21BB'}</span> Reset demo
            </>
          )}
        </button>
      </div>

      {/* Policy selector */}
      <section className="eds-card p-5">
        <label className="block text-sm font-medium text-gray-700">
          Target policy
          <input
            value={policyId}
            onChange={(e) => setPolicyId(e.target.value)}
            className="block mt-1 border border-gray-300 rounded px-3 py-2 w-full max-w-sm text-sm
                       focus:ring-2 focus:ring-teal-400 focus:border-teal-400 outline-none transition-shadow"
            placeholder="POL-100245"
          />
        </label>
        <p className="text-xs text-gray-500 mt-2">
          Default is POL-100245 (Northwind Fabrication, South-East). You can target any seeded policy.
        </p>
      </section>

      {/* Scenario grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {SCENARIOS.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            disabled={busy || resetting}
            onClick={() => void run(scenario.id)}
            className={`eds-card p-4 text-left hover:shadow-card-hover hover:border-teal-400
                        disabled:opacity-50 transition-all duration-200 group
                        ${activeScenario === scenario.id && !busy ? 'border-teal-500 bg-teal-50/30' : ''}`}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl" role="img" aria-label={scenario.label}>{scenario.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-mono text-xs text-navy-900 group-hover:text-teal-700 transition-colors">
                  {scenario.id}
                </div>
                <div className="text-sm font-medium text-gray-900 mt-1">{scenario.label}</div>
                <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{scenario.description}</p>
              </div>
            </div>
          </button>
        ))}
      </section>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm slide-in">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Step log */}
      <section className="eds-card overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Pipeline step log</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Signal &rarr; resolve &rarr; detect &rarr; score &rarr; event &rarr; activity
            </p>
          </div>
          {busy && (
            <span className="inline-block w-4 h-4 border-2 border-teal-300 border-t-teal-700 rounded-full animate-spin" />
          )}
        </div>
        {steps.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">
            Choose a scenario above to run it. Each step in the pipeline will appear here.
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {steps.map((step, index) => (
              <div
                key={`${step}-${index}`}
                className="flex gap-3 items-start slide-in"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <span className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {index + 1}
                </span>
                <span className="text-sm text-gray-800 pt-0.5">{step}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Event result card */}
      {event && (
        <section className="eds-card overflow-hidden slide-in">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Created / merged event</h2>
            <SeverityChip severity={event.severity} />
          </div>
          <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="eds-label">Event ID</div>
              <div className="font-mono text-xs text-navy-900 mt-1">{event.eventId}</div>
            </div>
            <div>
              <div className="eds-label">Status</div>
              <div className="mt-1"><span className="chip chip-open">{event.status.replace('_', ' ')}</span></div>
            </div>
            <div>
              <div className="eds-label">Score</div>
              <div className="text-lg font-semibold text-navy-950 mt-1">{event.score} pts</div>
            </div>
            <div>
              <div className="eds-label">Portfolio breach</div>
              <div className="mt-1">
                {event.portfolioBreach
                  ? <span className="chip chip-high">Breach</span>
                  : <span className="text-sm text-gray-600">Within appetite</span>}
              </div>
            </div>
          </div>
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-xs text-gray-500">
              Rules fired: {event.ruleBreakdown.map((r) => r.ruleId).join(', ')}
            </div>
            <button
              type="button"
              onClick={() => navigate(`/events/${event.eventId}`)}
              className="text-sm text-teal-700 hover:underline font-medium"
            >
              Open event detail &rarr;
            </button>
          </div>
        </section>
      )}

      {/* Duplicate info */}
      {result?.duplicate && (
        <div className="eds-card p-4 text-sm text-gray-700 slide-in">
          <strong>Duplicate signal:</strong> The second signal was merged into the existing event.
          No new event was created - the dedup logic identified the same idempotency key.
        </div>
      )}
    </div>
  );
}
