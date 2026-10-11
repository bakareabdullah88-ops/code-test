import { useMutation, useQuery } from '@tanstack/react-query';
import { qk } from '@/lib/query';
import { enrolmentsService, lessonsService, pathwaysService, todayService, type PathwayScope } from '@/lib/services/learning';
import { useSessionState } from '@/lib/db/session';

// Session identity is part of every key so switching person never shows someone else's cached data.
const useWho = () => {
  const s = useSessionState();
  return `${s.userId}:${s.orgId}`;
};

export const useToday = () => { const w = useWho(); return useQuery({ queryKey: [...qk.today, w], queryFn: todayService.get }); };
export const usePathways = (scope: PathwayScope) => { const w = useWho(); return useQuery({ queryKey: [...qk.pathways(scope), w], queryFn: () => pathwaysService.list(scope) }); };
export const usePathway = (id: string) => { const w = useWho(); return useQuery({ queryKey: [...qk.pathway(id), w], queryFn: () => pathwaysService.get(id) }); };
export const useLesson = (id: string) => { const w = useWho(); return useQuery({ queryKey: [...qk.lesson(id), w], queryFn: () => lessonsService.get(id) }); };
export const useQuiz = (id: string) => useQuery({ queryKey: qk.quiz(id), queryFn: () => lessonsService.quiz(id) });

export const useEnrol = () => useMutation({ mutationFn: (pathwayId: string) => enrolmentsService.enrol(pathwayId) });
export const useAssign = () => useMutation({ mutationFn: (v: { pathwayId: string; userIds: string[]; note?: string }) => enrolmentsService.assign(v.pathwayId, v.userIds, v.note) });
export const useSetProgress = () => useMutation({ mutationFn: (v: { lessonId: string; status: 'in_progress' | 'completed'; lastBlockId?: string | null }) => lessonsService.setProgress(v.lessonId, v.status, v.lastBlockId ?? null) });
export const useAttemptQuiz = () => useMutation({ mutationFn: (v: { quizId: string; answers: Record<string, string[] | boolean> }) => lessonsService.attemptQuiz(v.quizId, v.answers) });
