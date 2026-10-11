import { useMutation, useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query';
import { growthService, notificationsService } from '@/lib/services/system';
import { useSessionState } from '@/lib/db/session';

const useWho = () => { const s = useSessionState(); return `${s.userId}:${s.orgId}`; };

export const useTimeline = (userId?: string) => { const w = useWho(); return useQuery({ queryKey: [...qk.timeline(userId), w], queryFn: () => growthService.timeline(userId) }); };
export const useMilestones = () => { const w = useWho(); return useQuery({ queryKey: [...qk.milestones, w], queryFn: growthService.milestones }); };
export const useNotifications = () => { const w = useWho(); return useQuery({ queryKey: [...qk.notifications, w], queryFn: () => notificationsService.list() }); };
export const useMarkRead = () => useMutation({ mutationFn: (ids: string[] | 'all') => notificationsService.markRead(ids) });
