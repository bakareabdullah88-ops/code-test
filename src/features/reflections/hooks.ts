import { useMutation, useQuery } from '@tanstack/react-query';
import type { ReflectionVisibility, RichDoc } from '@/types';
import { qk } from '@/lib/query';
import { feedbackService, reflectionsService, type ListReflectionsParams } from '@/lib/services/reflections';
import { useSessionState } from '@/lib/db/session';

const useWho = () => { const s = useSessionState(); return `${s.userId}:${s.orgId}`; };

export const useReflections = (params: ListReflectionsParams) => { const w = useWho(); return useQuery({ queryKey: [...qk.reflections(params), w], queryFn: () => reflectionsService.list(params) }); };
export const useReflection = (id: string | undefined) => { const w = useWho(); return useQuery({ queryKey: [...qk.reflection(id ?? ''), w], queryFn: () => reflectionsService.get(id ?? ''), enabled: !!id }); };

export const useCreateReflection = () => useMutation({ mutationFn: (v: { lessonId?: string | null; title?: string | null; body: RichDoc; visibility?: ReflectionVisibility }) => reflectionsService.create(v) });
export const useUpdateReflection = () => useMutation({ mutationFn: (v: { id: string; patch: { title?: string | null; body?: RichDoc; visibility?: ReflectionVisibility; groupId?: string | null }; version: number }) => reflectionsService.update(v.id, v.patch, v.version) });
export const useSubmitReflection = () => useMutation({ mutationFn: (v: { id: string; visibility: 'private' | 'mentor' | 'group'; groupId?: string | null }) => reflectionsService.submit(v.id, { visibility: v.visibility, groupId: v.groupId }) });
export const useWithdrawReflection = () => useMutation({ mutationFn: (id: string) => reflectionsService.withdraw(id) });
export const useDeleteReflection = () => useMutation({ mutationFn: (id: string) => reflectionsService.remove(id) });
export const useSendFeedback = () => useMutation({ mutationFn: (v: { reflectionId: string; body: RichDoc; shareableToGroup?: boolean; aiAssisted?: boolean }) => feedbackService.send(v.reflectionId, v) });
export const useMarkFeedbackRead = () => useMutation({ mutationFn: (id: string) => feedbackService.markRead(id) });
