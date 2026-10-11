import { useMutation, useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query';
import { mentoringService } from '@/lib/services/mentoring';
import { useSessionState } from '@/lib/db/session';

const useWho = () => { const s = useSessionState(); return `${s.userId}:${s.orgId}`; };

export const useAttention = () => { const w = useWho(); return useQuery({ queryKey: [...qk.attention, w], queryFn: mentoringService.attention }); };
export const useMentees = () => { const w = useWho(); return useQuery({ queryKey: [...qk.mentees, w], queryFn: mentoringService.mentees }); };
export const useMentee = (id: string) => { const w = useWho(); return useQuery({ queryKey: [...qk.mentee(id), w], queryFn: () => mentoringService.menteeOverview(id) }); };
export const useGoals = (userId?: string) => { const w = useWho(); return useQuery({ queryKey: [...qk.goals(userId), w], queryFn: () => mentoringService.goals(userId) }); };
export const useMyCheckIns = () => { const w = useWho(); return useQuery({ queryKey: ['checkins', w], queryFn: mentoringService.myCheckIns }); };

export const useSnooze = () => useMutation({ mutationFn: (v: { id: string; days: 3 | 7 }) => mentoringService.snooze(v.id, v.days) });
export const useCreateGoal = () => useMutation({ mutationFn: mentoringService.createGoal });
export const useUpdateGoal = () => useMutation({ mutationFn: (v: { id: string; patch: Parameters<typeof mentoringService.updateGoal>[1] }) => mentoringService.updateGoal(v.id, v.patch) });
export const useScheduleCheckIn = () => useMutation({ mutationFn: mentoringService.scheduleCheckIn });
export const useUpdateCheckIn = () => useMutation({ mutationFn: (v: { id: string; patch: Parameters<typeof mentoringService.updateCheckIn>[1] }) => mentoringService.updateCheckIn(v.id, v.patch) });
export const useSaveNote = () => useMutation({ mutationFn: mentoringService.saveNote });
export const useAffirm = () => useMutation({ mutationFn: (v: { userId: string; key: string; note?: string }) => mentoringService.affirmMilestone(v.userId, v.key, v.note) });
