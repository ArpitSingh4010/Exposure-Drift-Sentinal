import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useUserStore } from './useUserStore';
import {
  decideEvent,
  fetchActivities,
  fetchEvent,
  fetchEvents,
  fetchPortfolio,
  fetchAudit,
  fetchPolicies,
  fetchPolicy,
  fetchRules,
  reopenEvent,
  startReview,
  type EventRecord,
} from '@/api/client';

export function useEvents() {
  const { userId } = useUserStore();
  return useQuery({ queryKey: ['events'], queryFn: () => fetchEvents(userId) });
}

export function useActivities() {
  const { userId } = useUserStore();
  return useQuery({ queryKey: ['activities'], queryFn: () => fetchActivities(userId) });
}

export function useEvent(eventId: string) {
  const { userId } = useUserStore();
  return useQuery({ queryKey: ['events', eventId], queryFn: () => fetchEvent(eventId, userId), enabled: Boolean(eventId) });
}

export function useEventActions() {
  const { userId } = useUserStore();
  const queryClient = useQueryClient();
  const invalidate = async (event: EventRecord) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['events'] }),
      queryClient.invalidateQueries({ queryKey: ['events', event.eventId] }),
      queryClient.invalidateQueries({ queryKey: ['activities'] }),
    ]);
  };
  const review = useMutation({
    mutationFn: (eventId: string) => startReview(eventId, userId ?? ''),
    onSuccess: invalidate,
  });
  const reopen = useMutation({
    mutationFn: (eventId: string) => reopenEvent(eventId, userId ?? ''),
    onSuccess: invalidate,
  });
  const decide = useMutation({
    mutationFn: ({ eventId, body }: { eventId: string; body: Parameters<typeof decideEvent>[2] }) =>
      decideEvent(eventId, userId ?? '', body),
    onSuccess: invalidate,
  });
  return { review, reopen, decide };
}

export function usePortfolio(eventId?: string) {
  const { userId } = useUserStore();
  return useQuery({
    queryKey: ['portfolio', eventId ?? 'baseline'],
    queryFn: () => fetchPortfolio(userId, eventId),
  });
}

export function usePolicies(search = '') {
  const { userId } = useUserStore();
  return useQuery({ queryKey: ['policies', search], queryFn: () => fetchPolicies(userId, search) });
}

export function usePolicy(policyId: string) {
  const { userId } = useUserStore();
  return useQuery({ queryKey: ['policies', policyId], queryFn: () => fetchPolicy(policyId, userId), enabled: Boolean(policyId) });
}

export function useAudit(filters: { entityType?: string; actor?: string } = {}) {
  const { userId } = useUserStore();
  return useQuery({ queryKey: ['audit', filters], queryFn: () => fetchAudit(userId, filters) });
}

export function useRules() {
  const { userId } = useUserStore();
  return useQuery({ queryKey: ['rules'], queryFn: () => fetchRules(userId) });
}