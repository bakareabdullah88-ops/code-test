import { useMutation } from '@tanstack/react-query';
import type { Lesson, Pathway, Quiz } from '@/types';
import { enrolmentsService, lessonsService, pathwaysService } from '@/lib/services/learning';

export const useCreatePathway = () => useMutation({ mutationFn: (v: Parameters<typeof pathwaysService.create>[0]) => pathwaysService.create(v) });
export const useUpdatePathway = () => useMutation({ mutationFn: (v: { id: string; patch: Parameters<typeof pathwaysService.update>[1] }) => pathwaysService.update(v.id, v.patch) });
export const useReorder = () => useMutation({ mutationFn: (v: { id: string; modules: { id: string; lessonIds: string[] }[] }) => pathwaysService.reorder(v.id, v.modules) });
export const useAddModule = () => useMutation({ mutationFn: (v: { pathwayId: string; title: string }) => pathwaysService.addModule(v.pathwayId, v.title) });
export const useRenameModule = () => useMutation({ mutationFn: (v: { id: string; title: string }) => pathwaysService.renameModule(v.id, v.title) });
export const useDeleteModule = () => useMutation({ mutationFn: (id: string) => pathwaysService.deleteModule(id) });
export const useAddLesson = () => useMutation({ mutationFn: (v: { moduleId: string; title: string }) => pathwaysService.addLesson(v.moduleId, v.title) });
export const useDeleteLesson = () => useMutation({ mutationFn: (id: string) => pathwaysService.deleteLesson(id) });
export const usePublish = () => useMutation({ mutationFn: (id: string) => pathwaysService.publish(id) });
export const useUnpublish = () => useMutation({ mutationFn: (id: string) => pathwaysService.unpublish(id) });
export const useDeletePathway = () => useMutation({ mutationFn: (id: string) => pathwaysService.remove(id) });
export const useSaveLesson = () => useMutation({ mutationFn: (v: { id: string; patch: Partial<Pick<Lesson, 'title' | 'summary' | 'estimatedMinutes' | 'blocks' | 'completion'>>; version: number }) => lessonsService.update(v.id, v.patch, v.version) });
export const useSaveQuiz = () => useMutation({ mutationFn: (v: { lessonId: string; questions: Quiz['questions'] }) => lessonsService.saveQuiz(v.lessonId, v.questions) });
export const useAssignPathway = () => useMutation({ mutationFn: (v: { pathwayId: string; userIds: string[]; note?: string }) => enrolmentsService.assign(v.pathwayId, v.userIds, v.note) });
export type { Pathway };
