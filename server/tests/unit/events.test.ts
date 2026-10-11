import { describe, expect, it } from 'vitest';
import { canTransition, transition } from '../../src/services/events/index.js';

describe('event state machine', () => {
  it.each([
    ['NEW', 'START_REVIEW', 'IN_REVIEW'],
    ['ACTIVITY_CREATED', 'START_REVIEW', 'IN_REVIEW'],
    ['IN_REVIEW', 'ACCEPT', 'CLOSED'],
    ['IN_REVIEW', 'DISMISS', 'CLOSED'],
    ['IN_REVIEW', 'REQUEST_INFO', 'INFO_REQUESTED'],
    ['INFO_REQUESTED', 'REOPEN', 'IN_REVIEW'],
  ])('%s + %s -> %s', (status, action, expected) => {
    expect(transition(status as never, action as never)).toBe(expected);
  });

  it.each([
    ['NEW', 'ACCEPT'],
    ['ACTIVITY_CREATED', 'DISMISS'],
    ['INFO_REQUESTED', 'ACCEPT'],
    ['CLOSED', 'REOPEN'],
  ])('rejects %s + %s', (status, action) => {
    expect(canTransition(status as never, action as never)).toBe(false);
    expect(() => transition(status as never, action as never)).toThrow('Invalid event transition');
  });
});