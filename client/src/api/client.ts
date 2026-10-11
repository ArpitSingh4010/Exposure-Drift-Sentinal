const API_BASE = '/api';

export interface EventRecord {
  eventId: string;
  policyId: string;
  status: 'NEW' | 'ACTIVITY_CREATED' | 'IN_REVIEW' | 'INFO_REQUESTED' | 'CLOSED';
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  score: number;
  confidence: number;
  verifyFirst: boolean;
  portfolioBreach: boolean;
  changes: Array<Record<string, unknown>>;
  ruleBreakdown: Array<{ ruleId: string; points: number; reason: string; evidenceRefs: string[] }>;
  before: SnapshotState;
  after: SnapshotState;
  signalIds: string[];
  recommendedAction: string;
  whyItMatters: string;
  ruleVersion: string;
  createdAt?: string;
}

export interface SnapshotState {
  totalTiv: number;
  locations: Array<{
    locationId: string;
    addressLine: string;
    tiv: number;
    floodZone: string;
    floodScore: number;
  }>;
}

export interface ActivityRecord {
  activityId: string;
  eventId: string;
  policyId: string;
  assigneeUserId: string;
  seniorFlag?: string;
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string;
  status: 'OPEN' | 'COMPLETED';
  completedAt?: string;
}

export interface PortfolioRegion {
  region: string;
  floodTiv: number;
  share: number;
  cap: number;
  breach: boolean;
  headroom: number;
  contributingPolicies: Array<{ policyId: string; tiv: number }>;
}

export interface PortfolioExposure {
  totalPortfolioTiv: number;
  regions: PortfolioRegion[];
  whatIfEventId?: string;
}

export interface PolicyRecord {
  policyId: string;
  accountId: string;
  region: string;
  premium: number;
  status: string;
  account?: { name: string } | null;
}

export interface PolicyDetail {
  policy: PolicyRecord;
  account: { name: string; industry: string } | null;
  locations: Array<{ locationId: string; addressLine: string; tiv: number; floodZone: string; floodScore: number }>;
  latestSnapshot: { kind: string; state: SnapshotState } | null;
  drift: EventRecord[];
}

export interface AuditRecord {
  ts: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, unknown>;
}

async function request<T>(path: string, userId: string | null, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(userId ? { 'X-User-Id': userId } : {}),
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export function fetchEvents(userId: string | null): Promise<EventRecord[]> {
  return request<EventRecord[]>('/events', userId);
}

export function fetchEvent(eventId: string, userId: string | null): Promise<EventRecord> {
  return request<EventRecord>(`/events/${eventId}`, userId);
}

export function fetchActivities(userId: string | null): Promise<ActivityRecord[]> {
  return request<ActivityRecord[]>('/activities', userId);
}

export function fetchPortfolio(userId: string | null, eventId?: string): Promise<PortfolioExposure> {
  const suffix = eventId ? `?eventId=${encodeURIComponent(eventId)}` : '';
  return request<PortfolioExposure>(`/portfolio/exposure${suffix}`, userId);
}

export function startReview(eventId: string, userId: string): Promise<EventRecord> {
  return request<EventRecord>(`/events/${eventId}/start-review`, userId, { method: 'POST' });
}

export function reopenEvent(eventId: string, userId: string): Promise<EventRecord> {
  return request<EventRecord>(`/events/${eventId}/reopen`, userId, { method: 'POST' });
}

export function decideEvent(
  eventId: string,
  userId: string,
  body: { action: 'ACCEPT' | 'DISMISS' | 'REQUEST_INFO'; reasonCode?: string; note: string },
): Promise<EventRecord> {
  return request<EventRecord>(`/events/${eventId}/decision`, userId, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function fetchPolicies(userId: string | null, search = ''): Promise<PolicyRecord[]> {
  return request<PolicyRecord[]>(`/policies${search ? `?search=${encodeURIComponent(search)}` : ''}`, userId);
}

export function fetchPolicy(policyId: string, userId: string | null): Promise<PolicyDetail> {
  return request<PolicyDetail>(`/policies/${policyId}`, userId);
}

export function fetchAudit(userId: string | null, filters: { entityType?: string; actor?: string } = {}): Promise<AuditRecord[]> {
  const params = new URLSearchParams();
  if (filters.entityType) params.set('entityType', filters.entityType);
  if (filters.actor) params.set('actor', filters.actor);
  return request<AuditRecord[]>(`/audit${params.toString() ? `?${params}` : ''}`, userId);
}

export function fetchRules(userId: string | null): Promise<{ version: string; yamlText: string }> {
  return request<{ version: string; yamlText: string }>('/rules', userId);
}

export function runScenario(userId: string | null, name: string, policyId: string): Promise<{ scenario: string; steps: string[]; event: unknown }> {
  return request<{ scenario: string; steps: string[]; event: unknown }>(`/simulator/scenarios/${name}`, userId, { method: 'POST', body: JSON.stringify({ policyId }) });
}