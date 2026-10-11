import { useMutation, useQuery } from '@tanstack/react-query';
import type { BibleRange, MemoryVerse } from '@/types';
import { memoryService } from '@/lib/services/memory';
import type { Rating } from '@/lib/srs';
import { useSessionState } from '@/lib/db/session';

const useWho = () => { const s = useSessionState(); return `${s.userId}:${s.orgId}`; };

export const useMemoryVerses = () => { const w = useWho(); return useQuery({ queryKey: ['memory', w], queryFn: memoryService.list }); };
export const useAddMemoryVerse = () => useMutation({ mutationFn: (v: { range: BibleRange; source?: MemoryVerse['source'] }) => memoryService.add(v.range, v.source) });
export const useRemoveMemoryVerse = () => useMutation({ mutationFn: (id: string) => memoryService.remove(id) });
export const useReviewVerse = () => useMutation({ mutationFn: (v: { id: string; rating: Rating }) => memoryService.review(v.id, v.rating) });
