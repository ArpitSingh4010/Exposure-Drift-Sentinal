import type { DriftEventStatus } from '../../models/DriftEvent.js';

export type EventAction = 'START_REVIEW' | 'ACCEPT' | 'DISMISS' | 'REQUEST_INFO' | 'REOPEN';

const TRANSITIONS: Record<DriftEventStatus, Partial<Record<EventAction, DriftEventStatus>>> = {
  NEW: { START_REVIEW: 'IN_REVIEW' },
  ACTIVITY_CREATED: { START_REVIEW: 'IN_REVIEW' },
  IN_REVIEW: {
    ACCEPT: 'CLOSED',
    DISMISS: 'CLOSED',
    REQUEST_INFO: 'INFO_REQUESTED',
  },
  INFO_REQUESTED: { REOPEN: 'IN_REVIEW' },
  CLOSED: {},
};

export function canTransition(status: DriftEventStatus, action: EventAction): boolean {
  return TRANSITIONS[status][action] !== undefined;
}

export function transition(status: DriftEventStatus, action: EventAction): DriftEventStatus {
  const nextStatus = TRANSITIONS[status][action];
  if (!nextStatus) {
    throw new Error(`Invalid event transition: ${status} -> ${action}`);
  }
  return nextStatus;
}