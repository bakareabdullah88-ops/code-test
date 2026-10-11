import type { Feedback, Id, Lesson, Reflection } from '@/types';
import { nowIso } from '../db/ids';
import { store } from '../db/store';
import { addTimeline, evaluateMilestones, notify, touchActive } from './engine';

/** Active mentors for a person in an organisation. */
export function mentorsOf(userId: Id<'usr'>, orgId: Id<'org'> | null): Id<'usr'>[] {
  if (!orgId) return [];
  return store.find('assignments', (a) => a.orgId === orgId && a.menteeId === userId && a.status === 'active').map((a) => a.mentorId);
}

export const nameOf = (id: string) => store.get('users', id)?.displayName ?? 'Someone';

export function recordLessonCompleted(userId: Id<'usr'>, orgId: Id<'org'> | null, lesson: Lesson, at = nowIso()) {
  addTimeline(userId, 'lesson_completed', { type: 'lesson', id: lesson.id }, { messageKey: 'timeline.lesson_completed', params: { lesson: lesson.title } }, 'mentor', at);
  touchActive(userId, orgId, at);
  return evaluateMilestones(userId, at);
}

export function recordReflectionSubmitted(r: Reflection, at = nowIso()) {
  const lesson = r.lessonId ? store.get('lessons', r.lessonId) : undefined;
  const visibility = r.visibility === 'group' ? 'group' : r.visibility === 'mentor' ? 'mentor' : 'owner';
  addTimeline(r.authorId, 'reflection_submitted', { type: 'reflection', id: r.id }, { messageKey: lesson ? 'timeline.reflection_submitted' : 'timeline.reflection_free', params: { lesson: lesson?.title ?? '' } }, visibility, at);
  if (r.visibility !== 'private') {
    for (const mentorId of mentorsOf(r.authorId, r.orgId)) {
      notify(mentorId, 'reflection_shared', { messageKey: 'notif.reflection_shared', params: { name: nameOf(r.authorId), lesson: lesson?.title ?? '' } }, `/mentor/feedback/${r.id}`, { type: 'reflection', id: r.id }, at);
    }
  }
  touchActive(r.authorId, r.orgId, at);
  return evaluateMilestones(r.authorId, at);
}

export function recordFeedbackSent(f: Feedback, r: Reflection, at = nowIso()) {
  const lesson = r.lessonId ? store.get('lessons', r.lessonId) : undefined;
  addTimeline(r.authorId, 'feedback_received', { type: 'reflection', id: r.id }, { messageKey: 'timeline.feedback_received', params: { mentor: nameOf(f.mentorId), lesson: lesson?.title ?? '' } }, 'mentor', at);
  notify(r.authorId, 'feedback_received', { messageKey: 'notif.feedback_received', params: { mentor: nameOf(f.mentorId), lesson: lesson?.title ?? '' } }, `/app/journal/${r.id}`, { type: 'feedback', id: f.id }, at);
  return evaluateMilestones(r.authorId, at);
}
