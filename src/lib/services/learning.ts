import type { Enrollment, Id, Lesson, LessonBlock, LessonProgress, LocalisedMessage, Milestone, Module, Pathway, PublishStatus, Quiz, QuizAttempt } from '@/types';
import { ApiError, forbidden, notFound } from '../db/errors';
import { daysFromNow, newId, nowIso } from '../db/ids';
import { actor } from '../db/session';
import { store } from '../db/store';
import { call } from '../db/api';
import { recordLessonCompleted, mentorsOf, nameOf } from './actions';
import { notify, addTimeline } from './engine';
import { requireRole } from './access';

export interface LessonSummary { id: Id<'les'>; title: string; summary: string; position: number; estimatedMinutes: number; status: PublishStatus; progress: LessonProgress['status'] }
export interface OutlineModule extends Module { lessons: LessonSummary[] }
export interface PathwayDetail extends Pathway {
  outline: OutlineModule[];
  enrollment: Enrollment | null;
  progress: { completed: number; total: number; currentLessonId: Id<'les'> | null };
  author: { id: Id<'usr'>; displayName: string };
}

const sortBy = <T,>(xs: T[], f: (x: T) => number) => [...xs].sort((a, b) => f(a) - f(b));

function progressOf(userId: string, lessonId: string): LessonProgress['status'] {
  return store.get('progress', `prg_${userId.slice(4)}_${lessonId}`)?.status ?? 'not_started';
}

function detail(pathway: Pathway, userId: Id<'usr'>): PathwayDetail {
  const modules = sortBy(store.find('modules', (m) => m.pathwayId === pathway.id), (m) => m.position);
  const outline: OutlineModule[] = modules.map((m) => ({
    ...m,
    lessons: sortBy(store.find('lessons', (l) => l.moduleId === m.id), (l) => l.position).map((l) => ({
      id: l.id, title: l.title, summary: l.summary, position: l.position, estimatedMinutes: l.estimatedMinutes, status: l.status, progress: progressOf(userId, l.id),
    })),
  }));
  const flat = outline.flatMap((m) => m.lessons);
  const completed = flat.filter((l) => l.progress === 'completed').length;
  const current = flat.find((l) => l.progress !== 'completed');
  const author = store.get('users', pathway.authorId);
  return {
    ...pathway, outline, enrollment: store.find('enrollments', (e) => e.userId === userId && e.pathwayId === pathway.id)[0] ?? null,
    progress: { completed, total: flat.length, currentLessonId: current?.id ?? null }, author: { id: pathway.authorId, displayName: author?.displayName ?? 'Unknown' },
  };
}

function recount(pathwayId: Id<'pth'>) {
  const p = store.get('pathways', pathwayId);
  if (!p) return;
  const lessons = store.find('lessons', (l) => l.pathwayId === pathwayId);
  store.put('pathways', { ...p, moduleCount: store.find('modules', (m) => m.pathwayId === pathwayId).length, lessonCount: lessons.length, estimatedMinutes: lessons.reduce((s, l) => s + l.estimatedMinutes, 0), updatedAt: nowIso() });
}

function canEditPathway(p: Pathway) {
  const a = actor();
  return p.authorId === a.user.id || (a.has('admin') && p.orgId === a.orgId);
}
function mustEdit(id: string): Pathway {
  const p = store.get('pathways', id);
  if (!p) throw notFound('That pathway');
  if (!canEditPathway(p)) throw forbidden('Only the author can change this pathway.');
  return p;
}

export type PathwayScope = 'enrolled' | 'library' | 'mine';

export const pathwaysService = {
  list: (scope: PathwayScope) =>
    call(() => {
      const a = actor();
      let list: Pathway[];
      if (scope === 'mine') list = store.find('pathways', (p) => p.authorId === a.user.id);
      else if (scope === 'enrolled') {
        const ids = new Set(store.find('enrollments', (e) => e.userId === a.user.id).map((e) => e.pathwayId));
        list = store.find('pathways', (p) => ids.has(p.id));
      } else list = store.find('pathways', (p) => p.status === 'published' && (p.orgId === null || p.orgId === a.orgId || p.visibility === 'library') && (a.orgId !== null || p.orgId === null || true));
      return list.map((p) => detail(p, a.user.id));
    }),

  get: (id: string) =>
    call(() => {
      const a = actor();
      const p = store.get('pathways', id);
      if (!p) throw notFound('That pathway');
      if (p.status !== 'published' && p.authorId !== a.user.id && !a.has('admin')) throw notFound('That pathway');
      return detail(p, a.user.id);
    }),

  create: (input: { title: string; summary: string; audience: string; level: Pathway['level']; coverKey: string; fromPathwayId?: string }) =>
    call(() => {
      const a = actor();
      requireRole(a, 'mentor', 'admin');
      const id = newId('pth');
      const at = nowIso();
      const p: Pathway = { id, orgId: a.orgId, title: input.title, summary: input.summary, audience: input.audience, level: input.level, coverKey: input.coverKey, locale: 'en', estimatedMinutes: 0, moduleCount: 0, lessonCount: 0, status: 'draft', version: 1, publishedVersion: null, authorId: a.user.id, tags: [], visibility: 'organisation', createdAt: at, updatedAt: at };
      store.put('pathways', p);
      const src = input.fromPathwayId ? store.get('pathways', input.fromPathwayId) : undefined;
      if (src) {
        for (const m of store.find('modules', (x) => x.pathwayId === src.id)) {
          const mid = newId('mod');
          store.put('modules', { ...m, id: mid, pathwayId: id });
          for (const l of store.find('lessons', (x) => x.moduleId === m.id)) store.put('lessons', { ...l, id: newId('les'), pathwayId: id, moduleId: mid, status: 'draft', version: 1, updatedAt: at });
        }
        recount(id);
      }
      return detail(store.get('pathways', id) as Pathway, a.user.id);
    }, { write: true }),

  update: (id: string, patch: Partial<Pick<Pathway, 'title' | 'summary' | 'audience' | 'level' | 'coverKey' | 'tags' | 'visibility'>>) =>
    call(() => {
      const p = mustEdit(id);
      store.put('pathways', { ...p, ...patch, version: p.version + 1, updatedAt: nowIso() });
      return detail(store.get('pathways', id) as Pathway, actor().user.id);
    }, { write: true }),

  /** Full ordering in one atomic call: used by drag, buttons and keyboard moves. */
  reorder: (id: string, modules: { id: string; title?: string; lessonIds: string[] }[]) =>
    call(() => {
      mustEdit(id);
      modules.forEach((m, mi) => {
        const rec = store.get('modules', m.id);
        if (!rec || rec.pathwayId !== id) throw new ApiError('validation_failed', 'Unknown module in ordering.');
        store.put('modules', { ...rec, position: mi, title: m.title ?? rec.title });
        m.lessonIds.forEach((lid, li) => {
          const l = store.get('lessons', lid);
          if (!l || l.pathwayId !== id) throw new ApiError('validation_failed', 'Unknown lesson in ordering.');
          store.put('lessons', { ...l, moduleId: m.id as Id<'mod'>, position: li, updatedAt: nowIso() });
        });
      });
      recount(id as Id<'pth'>);
      return detail(store.get('pathways', id) as Pathway, actor().user.id);
    }, { write: true }),

  addModule: (pathwayId: string, title: string) =>
    call(() => {
      mustEdit(pathwayId);
      const position = store.find('modules', (m) => m.pathwayId === pathwayId).length;
      const m: Module = { id: newId('mod'), pathwayId: pathwayId as Id<'pth'>, title, summary: null, position };
      store.put('modules', m);
      recount(pathwayId as Id<'pth'>);
      return m;
    }, { write: true }),

  renameModule: (id: string, title: string) =>
    call(() => {
      const m = store.get('modules', id);
      if (!m) throw notFound('That module');
      mustEdit(m.pathwayId);
      return store.put('modules', { ...m, title });
    }, { write: true }),

  deleteModule: (id: string) =>
    call(() => {
      const m = store.get('modules', id);
      if (!m) throw notFound('That module');
      mustEdit(m.pathwayId);
      for (const l of store.find('lessons', (x) => x.moduleId === id)) store.remove('lessons', l.id);
      store.remove('modules', id);
      recount(m.pathwayId);
    }, { write: true }),

  addLesson: (moduleId: string, title: string) =>
    call(() => {
      const m = store.get('modules', moduleId);
      if (!m) throw notFound('That module');
      mustEdit(m.pathwayId);
      const lesson: Lesson = { id: newId('les'), pathwayId: m.pathwayId, moduleId: m.id, title, summary: '', position: store.find('lessons', (l) => l.moduleId === moduleId).length, estimatedMinutes: 10, blocks: [], completion: { requireQuiz: false, requireReflection: false }, status: 'draft', version: 1, updatedAt: nowIso() };
      store.put('lessons', lesson);
      recount(m.pathwayId);
      return lesson;
    }, { write: true }),

  deleteLesson: (id: string) =>
    call(() => {
      const l = store.get('lessons', id);
      if (!l) throw notFound('That lesson');
      mustEdit(l.pathwayId);
      store.remove('lessons', id);
      recount(l.pathwayId);
    }, { write: true }),

  publishChecklist: (id: string) => call(() => checklist(id)),

  publish: (id: string) =>
    call(() => {
      const p = mustEdit(id);
      const problems = checklist(id);
      if (problems.length) throw new ApiError('validation_failed', 'This pathway is not ready to publish.', { fieldErrors: { lessons: problems.map((x) => x.message) } });
      for (const l of store.find('lessons', (x) => x.pathwayId === id)) store.put('lessons', { ...l, status: 'published' });
      store.put('pathways', { ...p, status: 'published', publishedVersion: p.version, version: p.version + 1, updatedAt: nowIso() });
      return detail(store.get('pathways', id) as Pathway, actor().user.id);
    }, { write: true }),

  unpublish: (id: string) =>
    call(() => {
      const p = mustEdit(id);
      store.put('pathways', { ...p, status: 'draft', updatedAt: nowIso() });
    }, { write: true }),

  remove: (id: string) =>
    call(() => {
      mustEdit(id);
      if (store.find('enrollments', (e) => e.pathwayId === id).length) throw new ApiError('conflict', 'People are enrolled in this pathway. Archive it instead.');
      for (const m of store.find('modules', (x) => x.pathwayId === id)) store.remove('modules', m.id);
      for (const l of store.find('lessons', (x) => x.pathwayId === id)) store.remove('lessons', l.id);
      store.remove('pathways', id);
    }, { write: true }),
};

function checklist(id: string): { lessonId: string | null; message: string }[] {
  const out: { lessonId: string | null; message: string }[] = [];
  const lessons = store.find('lessons', (l) => l.pathwayId === id);
  if (!lessons.length) out.push({ lessonId: null, message: 'Add at least one lesson.' });
  for (const l of lessons) {
    if (!l.blocks.length) out.push({ lessonId: l.id, message: `"${l.title}" has no content yet.` });
    if (l.estimatedMinutes <= 0) out.push({ lessonId: l.id, message: `"${l.title}" needs an estimated time.` });
    for (const b of l.blocks) if (b.type === 'video' && !b.captionsSrc) out.push({ lessonId: l.id, message: `A video in "${l.title}" needs captions.` });
  }
  return out;
}

function stripQuiz(q: Quiz): Quiz {
  return {
    ...q,
    questions: q.questions.map((qq) => (qq.kind === 'true_false' ? { ...qq, answer: false } : { ...qq, options: qq.options.map((o) => ({ ...o, correct: false })) })),
  };
}

export const lessonsService = {
  get: (id: string) =>
    call(() => {
      const a = actor();
      const l = store.get('lessons', id);
      if (!l) throw notFound('That lesson');
      const p = store.get('pathways', l.pathwayId);
      if (!p) throw notFound('That lesson');
      const isAuthor = canEditPathway(p);
      if (!isAuthor && l.status !== 'published') throw notFound('That lesson');
      const progress = store.find('progress', (x) => x.userId === a.user.id && x.lessonId === id)[0] ?? null;
      const pathway = detail(p, a.user.id);
      const flat = pathway.outline.flatMap((m) => m.lessons);
      const idx = flat.findIndex((x) => x.id === id);
      return { lesson: l, progress, pathway: { id: p.id, title: p.title }, previousId: flat[idx - 1]?.id ?? null, nextId: flat[idx + 1]?.id ?? null, isAuthor };
    }),

  update: (id: string, patch: Partial<Pick<Lesson, 'title' | 'summary' | 'estimatedMinutes' | 'blocks' | 'completion'>>, version: number) =>
    call(() => {
      const l = store.get('lessons', id);
      if (!l) throw notFound('That lesson');
      mustEdit(l.pathwayId);
      if (l.version !== version) throw new ApiError('conflict', 'This lesson was changed somewhere else.');
      const next = store.put('lessons', { ...l, ...patch, version: l.version + 1, updatedAt: nowIso() });
      recount(l.pathwayId);
      return next;
    }, { write: true }),

  quiz: (quizId: string) =>
    call(() => {
      const q = store.get('quizzes', quizId);
      if (!q) throw notFound('That quiz');
      const l = store.get('lessons', q.lessonId);
      return l && store.get('pathways', l.pathwayId) && canEditPathway(store.get('pathways', l.pathwayId) as Pathway) ? q : stripQuiz(q);
    }),

  saveQuiz: (lessonId: string, questions: Quiz['questions']) =>
    call(() => {
      const l = store.get('lessons', lessonId);
      if (!l) throw notFound('That lesson');
      mustEdit(l.pathwayId);
      const existing = store.find('quizzes', (q) => q.lessonId === lessonId)[0];
      const quiz: Quiz = { id: existing?.id ?? (`qz_${lessonId.slice(4)}` as Id<'qz'>), lessonId: l.id, questions, passRule: 'all_answered' };
      store.put('quizzes', quiz);
      if (!l.blocks.some((b) => b.type === 'quiz')) store.put('lessons', { ...l, blocks: [...l.blocks, { id: `b${Date.now()}`, type: 'quiz', quizId: quiz.id } as LessonBlock], version: l.version + 1, updatedAt: nowIso() });
      return quiz;
    }, { write: true }),

  attemptQuiz: (quizId: string, answers: Record<string, string[] | boolean>) =>
    call(() => {
      const a = actor();
      const q = store.get('quizzes', quizId);
      if (!q) throw notFound('That quiz');
      const results = q.questions.map((qq) => {
        const given = answers[qq.id];
        let correct: boolean;
        let correctOptionIds: string[] | undefined;
        if (qq.kind === 'true_false') {
          correct = given === qq.answer;
        } else {
          const want = qq.options.filter((o) => o.correct).map((o) => o.id).sort();
          correctOptionIds = want;
          const g = Array.isArray(given) ? [...given].sort() : [];
          correct = g.length === want.length && g.every((x, i) => x === want[i]);
        }
        return { questionId: qq.id, correct, explanation: qq.explanation, correctOptionIds };
      });
      const attempt: QuizAttempt = { id: newId('qat'), quizId: q.id, userId: a.user.id, answers, correctCount: results.filter((r) => r.correct).length, completedAt: nowIso() };
      store.put('quizAttempts', attempt);
      return { attempt, results };
    }, { write: true }),

  /** Records reading progress. Completing a lesson updates the timeline, milestones and the enrolment. */
  setProgress: (lessonId: string, status: 'in_progress' | 'completed', lastBlockId: string | null = null) =>
    call(() => {
      const a = actor();
      const lesson = store.get('lessons', lessonId);
      if (!lesson) throw notFound('That lesson');
      let enrollment = store.find('enrollments', (e) => e.userId === a.user.id && e.pathwayId === lesson.pathwayId)[0];
      if (!enrollment) {
        const p = store.get('pathways', lesson.pathwayId);
        if (!p || (p.status !== 'published' && !canEditPathway(p))) throw forbidden();
        if (canEditPathway(p) && p.status !== 'published') return { progress: null, newMilestones: [] as Milestone[], pathwayCompleted: false };
        enrollment = store.put('enrollments', { id: newId('enr'), userId: a.user.id, pathwayId: p.id, pathwayVersion: p.version, status: 'active', assignedBy: null, groupId: null, startedAt: nowIso(), completedAt: null });
        addTimeline(a.user.id, 'pathway_started', { type: 'pathway', id: p.id }, { messageKey: 'timeline.pathway_started', params: { pathway: p.title } });
      }
      const key = `prg_${a.user.id.slice(4)}_${lessonId}`;
      const existing = store.get('progress', key);
      const wasDone = existing?.status === 'completed';
      const at = nowIso();
      const progress = store.put('progress', { id: key, userId: a.user.id, lessonId: lesson.id, enrollmentId: enrollment.id, status: wasDone ? 'completed' : status, lastBlockId: lastBlockId ?? existing?.lastBlockId ?? null, completedAt: wasDone ? existing?.completedAt ?? at : status === 'completed' ? at : null, updatedAt: at });
      let newMilestones: Milestone[] = [];
      let pathwayCompleted = false;
      if (status === 'completed' && !wasDone) {
        const all = store.find('lessons', (l) => l.pathwayId === lesson.pathwayId && l.status === 'published');
        const done = all.every((l) => store.get('progress', `prg_${a.user.id.slice(4)}_${l.id}`)?.status === 'completed');
        if (done && enrollment.status !== 'completed') {
          store.put('enrollments', { ...enrollment, status: 'completed', completedAt: at });
          pathwayCompleted = true;
          addTimeline(a.user.id, 'pathway_completed', { type: 'pathway', id: lesson.pathwayId }, { messageKey: 'timeline.pathway_completed', params: { pathway: store.get('pathways', lesson.pathwayId)?.title ?? '' } });
        }
        newMilestones = recordLessonCompleted(a.user.id, a.orgId, lesson, at);
      }
      return { progress, newMilestones, pathwayCompleted };
    }, { write: true }),
};

export const enrolmentsService = {
  enrol: (pathwayId: string) =>
    call(() => {
      const a = actor();
      const p = store.get('pathways', pathwayId);
      if (!p || p.status !== 'published') throw notFound('That pathway');
      const existing = store.find('enrollments', (e) => e.userId === a.user.id && e.pathwayId === pathwayId)[0];
      if (existing) return existing;
      addTimeline(a.user.id, 'pathway_started', { type: 'pathway', id: p.id }, { messageKey: 'timeline.pathway_started', params: { pathway: p.title } });
      return store.put('enrollments', { id: newId('enr'), userId: a.user.id, pathwayId: p.id, pathwayVersion: p.version, status: 'active', assignedBy: null, groupId: null, startedAt: nowIso(), completedAt: null });
    }, { write: true }),

  assign: (pathwayId: string, userIds: string[], note?: string) =>
    call(() => {
      const a = actor();
      requireRole(a, 'mentor', 'leader', 'admin');
      const p = store.get('pathways', pathwayId);
      if (!p || p.status !== 'published') throw notFound('That pathway');
      const out: Enrollment[] = [];
      for (const uid of userIds) {
        if (store.find('enrollments', (e) => e.userId === uid && e.pathwayId === pathwayId).length) continue;
        out.push(store.put('enrollments', { id: newId('enr'), userId: uid as Id<'usr'>, pathwayId: p.id, pathwayVersion: p.version, status: 'active', assignedBy: a.user.id, groupId: null, startedAt: nowIso(), completedAt: null }));
        notify(uid as Id<'usr'>, 'assignment', { messageKey: 'notif.assignment', params: { pathway: p.title, mentor: nameOf(a.user.id), note: note ?? '' } }, `/app/pathways/${p.id}`, { type: 'pathway', id: p.id });
        addTimeline(uid as Id<'usr'>, 'pathway_started', { type: 'pathway', id: p.id }, { messageKey: 'timeline.pathway_started', params: { pathway: p.title } });
      }
      return out;
    }, { write: true }),
};

export interface TodayDayItem { kind: 'done' | 'meeting' | 'event'; at: string; message: LocalisedMessage | null; title: string | null; href: string }

export const todayService = {
  get: () =>
    call(() => {
      const a = actor();
      const enrollments = store.find('enrollments', (e) => e.userId === a.user.id && e.status === 'active').sort((x, y) => y.startedAt.localeCompare(x.startedAt));
      let next: { pathway: PathwayDetail; lesson: LessonSummary; resumeBlockId: string | null } | null = null;
      for (const e of enrollments) {
        const p = store.get('pathways', e.pathwayId);
        if (!p) continue;
        const d = detail(p, a.user.id);
        const lesson = d.outline.flatMap((m) => m.lessons).find((l) => l.progress !== 'completed' && l.status === 'published');
        if (lesson) {
          next = { pathway: d, lesson, resumeBlockId: store.find('progress', (x) => x.userId === a.user.id && x.lessonId === lesson.id)[0]?.lastBlockId ?? null };
          break;
        }
      }
      const draft = store.find('reflections', (r) => r.authorId === a.user.id && r.status === 'draft').sort((x, y) => y.updatedAt.localeCompare(x.updatedAt))[0] ?? null;
      const dueVerses = store.find('memoryVerses', (v) => v.userId === a.user.id && v.srs.dueAt <= nowIso()).length;
      const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
      const feedback = store.find('feedback', (f) => f.status === 'sent' && (f.sentAt ?? '') > weekAgo && store.get('reflections', f.reflectionId)?.authorId === a.user.id).sort((x, y) => (y.sentAt ?? '').localeCompare(x.sentAt ?? ''))[0] ?? null;
      const feedbackReflection = feedback ? store.get('reflections', feedback.reflectionId) ?? null : null;
      const groups = store.find('groupMemberships', (g) => g.userId === a.user.id).map((g) => g.groupId);
      const nextMeeting = store.find('meetings', (m) => groups.includes(m.groupId) && m.status === 'scheduled' && m.startsAt > nowIso()).sort((x, y) => x.startsAt.localeCompare(y.startsAt))[0] ?? null;
      const group = nextMeeting ? store.get('groups', nextMeeting.groupId) ?? null : null;
      const recentMilestone = store.find('milestones', (m) => m.userId === a.user.id && m.awardedAt > new Date(Date.now() - 3 * 86_400_000).toISOString()).sort((x, y) => y.awardedAt.localeCompare(x.awardedAt))[0] ?? null;
      const mentor = mentorsOf(a.user.id, a.orgId)[0];
      // Monday-to-Sunday of the current week, with what happened (timeline) or is planned (meetings, events) each day.
      const monday = new Date();
      monday.setHours(0, 0, 0, 0);
      monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
      const sameDay = (iso: string, d: Date) => { const x = new Date(iso); return x.getFullYear() === d.getFullYear() && x.getMonth() === d.getMonth() && x.getDate() === d.getDate(); };
      const going = new Set(store.find('rsvps', (r) => r.userId === a.user.id && r.status !== 'declined').map((r) => r.eventId));
      const week = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday.getTime() + i * 86_400_000);
        const items: TodayDayItem[] = [
          ...store.find('timeline', (e) => e.userId === a.user.id && sameDay(e.occurredAt, d)).map((e): TodayDayItem => ({ kind: 'done', at: e.occurredAt, message: e.summary, title: null, href: '/app/journey/timeline' })),
          ...store.find('meetings', (m) => groups.includes(m.groupId) && sameDay(m.startsAt, d)).map((m): TodayDayItem => ({ kind: 'meeting', at: m.startsAt, message: null, title: store.get('groups', m.groupId)?.name ?? '', href: `/app/groups/${m.groupId}` })),
          ...store.find('events', (e) => going.has(e.id) && sameDay(e.startsAt, d)).map((e): TodayDayItem => ({ kind: 'event', at: e.startsAt, message: null, title: e.title, href: `/app/community/events/${e.id}` })),
        ].sort((x, y) => x.at.localeCompare(y.at));
        const reflected = store.find('reflections', (r) => r.authorId === a.user.id && r.status !== 'draft' && !!r.submittedAt && sameDay(r.submittedAt, d)).length > 0;
        return { date: d.toISOString(), items, reflected };
      });
      const flat = next ? next.pathway.outline.flatMap((m) => m.lessons) : [];
      const upNext = next ? flat[flat.findIndex((l) => l.id === next?.lesson.id) + 1] ?? null : null;
      return { week, upNext, next, draft, dueVerses, feedback, feedbackReflection, nextMeeting, groupName: group?.name ?? null, recentMilestone, mentorName: mentor ? nameOf(mentor) : null, hasMentor: !!mentor, inOrg: !!a.orgId, enrolledCount: enrollments.length };
    }),
};

void daysFromNow;
