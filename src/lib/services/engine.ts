import type { EntityRef, Id, LocalisedMessage, Milestone, MilestoneDefinition, Notification, NotificationKind, TimelineEvent, TimelineEventType } from '@/types';
import { newId, nowIso } from '../db/ids';
import { store } from '../db/store';

/** Domain engine: the side effects the real backend will perform when things happen. */

export const milestoneDefinitions: MilestoneDefinition[] = [
  { key: 'first_lesson', titleKey: 'milestones.first_lesson.title', meaningKey: 'milestones.first_lesson.meaning', category: 'learning', icon: 'seed', rule: 'Finish a lesson' },
  { key: 'lessons_5', titleKey: 'milestones.lessons_5.title', meaningKey: 'milestones.lessons_5.meaning', category: 'learning', icon: 'path', rule: 'Finish five lessons' },
  { key: 'pathway_complete', titleKey: 'milestones.pathway_complete.title', meaningKey: 'milestones.pathway_complete.meaning', category: 'learning', icon: 'flag', rule: 'Finish a pathway' },
  { key: 'first_reflection', titleKey: 'milestones.first_reflection.title', meaningKey: 'milestones.first_reflection.meaning', category: 'reflection', icon: 'pen', rule: 'Share a reflection' },
  { key: 'first_feedback', titleKey: 'milestones.first_feedback.title', meaningKey: 'milestones.first_feedback.meaning', category: 'reflection', icon: 'chat', rule: 'Receive a mentor reply' },
  { key: 'verses_3', titleKey: 'milestones.verses_3.title', meaningKey: 'milestones.verses_3.meaning', category: 'scripture', icon: 'book', rule: 'Keep three verses in memory' },
  { key: 'goal_completed', titleKey: 'milestones.goal_completed.title', meaningKey: 'milestones.goal_completed.meaning', category: 'goals', icon: 'check', rule: 'Complete a goal' },
  { key: 'prayer_answered', titleKey: 'milestones.prayer_answered.title', meaningKey: 'milestones.prayer_answered.meaning', category: 'community', icon: 'hands', rule: 'Record an answered prayer' },
  { key: 'first_discussion', titleKey: 'milestones.first_discussion.title', meaningKey: 'milestones.first_discussion.meaning', category: 'community', icon: 'group', rule: 'Join a group discussion' },
];

export function addTimeline(userId: Id<'usr'>, type: TimelineEventType, subject: EntityRef, summary: LocalisedMessage, visibility: TimelineEvent['visibility'] = 'mentor', at = nowIso()): TimelineEvent {
  return store.put('timeline', { id: newId('tle'), userId, type, occurredAt: at, summary, subject, visibility });
}

export function notify(userId: Id<'usr'>, kind: NotificationKind, message: LocalisedMessage, href: string, subject: EntityRef | null = null, at = nowIso()): Notification {
  return store.put('notifications', { id: newId('ntf'), userId, kind, message, subject, href, createdAt: at, readAt: null });
}

export function award(userId: Id<'usr'>, key: string, source: EntityRef | null, at = nowIso(), affirmedBy: Id<'usr'> | null = null, note: string | null = null): Milestone | null {
  if (store.find('milestones', (m) => m.userId === userId && m.key === key).length) return null;
  const m = store.put('milestones', { id: newId('mls'), userId, key, awardedAt: at, source, affirmedBy, note });
  addTimeline(userId, 'milestone_awarded', { type: 'milestone', id: m.id }, { messageKey: 'timeline.milestone', params: { titleKey: `milestones.${key}.title` } }, 'mentor', at);
  notify(userId, 'milestone_awarded', { messageKey: 'notif.milestone', params: { titleKey: `milestones.${key}.title` } }, '/app/journey/milestones', { type: 'milestone', id: m.id }, at);
  return m;
}

/** Awards any milestones the user has now earned. Returns the newly awarded ones. */
export function evaluateMilestones(userId: Id<'usr'>, at = nowIso()): Milestone[] {
  const out: Milestone[] = [];
  const done = store.find('progress', (p) => p.userId === userId && p.status === 'completed');
  const reflections = store.find('reflections', (r) => r.authorId === userId && r.status === 'submitted');
  const add = (m: Milestone | null) => m && out.push(m);
  if (done.length >= 1) add(award(userId, 'first_lesson', { type: 'lesson', id: done[0]?.lessonId ?? '' }, at));
  if (done.length >= 5) add(award(userId, 'lessons_5', null, at));
  if (store.find('enrollments', (e) => e.userId === userId && e.status === 'completed').length) add(award(userId, 'pathway_complete', null, at));
  if (reflections.length >= 1) add(award(userId, 'first_reflection', { type: 'reflection', id: reflections[0]?.id ?? '' }, at));
  const fb = store.find('feedback', (f) => f.status === 'sent' && store.get('reflections', f.reflectionId)?.authorId === userId);
  if (fb.length) add(award(userId, 'first_feedback', { type: 'feedback', id: fb[0]?.id ?? '' }, at));
  if (store.find('memoryVerses', (v) => v.userId === userId).length >= 3) add(award(userId, 'verses_3', null, at));
  if (store.find('goals', (g) => g.userId === userId && g.status === 'completed').length) add(award(userId, 'goal_completed', null, at));
  if (store.find('prayers', (p) => p.authorId === userId && p.status === 'answered').length) add(award(userId, 'prayer_answered', null, at));
  if (store.find('posts', (p) => p.authorId === userId).length) add(award(userId, 'first_discussion', null, at));
  return out;
}

export function touchActive(userId: Id<'usr'>, orgId: Id<'org'> | null, at = nowIso()) {
  if (!orgId) return;
  const m = store.find('memberships', (x) => x.userId === userId && x.orgId === orgId)[0];
  if (m) store.put('memberships', { ...m, lastActiveAt: at });
}
