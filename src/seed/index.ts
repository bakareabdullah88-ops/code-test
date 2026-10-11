import type { Enrollment, Id, Lesson, Meeting, Pathway } from '@/types';
import { daysAgo, daysFromNow } from '@/lib/db/ids';
import { store } from '@/lib/db/store';
import { recordLessonCompleted } from '@/lib/services/actions';
import { evaluateMilestones, notify } from '@/lib/services/engine';
import { foundations } from './pathways/foundations';
import { prayer } from './pathways/prayer';
import { mark } from './pathways/mark';
import { leading } from './pathways/leading';
import { psalms } from './pathways/psalms';
import { sermon } from './pathways/sermon';
import { rhythms } from './pathways/rhythms';
import type { SeedPathway } from './pathways/types';
import { assignments, groupFrom, memberships, ORG_A, ORG_B, orgA, orgB, seedGroups, uid, users } from './people';
import { seedExtras } from './extras';
import { seedWorkspace } from './workspace';
import { seedReflections } from './reflections';

export const SEED_VERSION = 3;

const pathwayId = (k: string) => `pth_${k}` as Id<'pth'>;
const lessonId = (k: string) => `les_${k}` as Id<'les'>;

function seedPathway(sp: SeedPathway, authorKey: string, created: string, status: 'published' | 'draft' = 'published'): Lesson[] {
  const lessons: Lesson[] = [];
  let lessonCount = 0;
  let minutes = 0;
  sp.modules.forEach((m, mi) => {
    store.put('modules', { id: `mod_${sp.key}_${m.key}` as Id<'mod'>, pathwayId: pathwayId(sp.key), title: m.title, summary: m.summary, position: mi });
    m.lessons.forEach((l, li) => {
      lessonCount++;
      minutes += l.minutes;
      const lesson: Lesson = {
        id: lessonId(l.key), pathwayId: pathwayId(sp.key), moduleId: `mod_${sp.key}_${m.key}` as Id<'mod'>, title: l.title, summary: l.summary,
        position: li, estimatedMinutes: l.minutes, blocks: l.blocks, completion: { requireQuiz: false, requireReflection: !!l.requireReflection },
        status, version: 1, updatedAt: created,
      };
      store.put('lessons', lesson);
      lessons.push(lesson);
      if (l.quiz) store.put('quizzes', l.quiz);
    });
  });
  const pathway: Pathway = {
    id: pathwayId(sp.key), orgId: ORG_A, title: sp.title, summary: sp.summary, audience: sp.audience, level: sp.level, coverKey: sp.coverKey,
    locale: 'en', estimatedMinutes: minutes, moduleCount: sp.modules.length, lessonCount, status, version: 1, publishedVersion: status === 'published' ? 1 : null,
    authorId: uid(authorKey), tags: sp.tags, visibility: 'organisation', createdAt: created, updatedAt: created,
  };
  store.put('pathways', pathway);
  return lessons;
}

const lessonsByPathway = new Map<string, Lesson[]>();

function enroll(userKey: string, pathwayKey: string, completed: number, startedDaysAgo: number, assignedBy: string | null, opts: { inProgress?: boolean; groupKey?: string; lastDaysAgo?: number; org?: Id<'org'> | null } = {}) {
  const lessons = lessonsByPathway.get(pathwayKey) ?? [];
  const user = uid(userKey);
  const orgId = opts.org === undefined ? ORG_A : opts.org;
  const finished = completed >= lessons.length;
  const enrollment: Enrollment = {
    id: `enr_${userKey}_${pathwayKey}` as Id<'enr'>, userId: user, pathwayId: pathwayId(pathwayKey), pathwayVersion: 1, status: finished ? 'completed' : 'active',
    assignedBy: assignedBy ? uid(assignedBy) : null, groupId: opts.groupKey ? (`grp_${opts.groupKey}` as Id<'grp'>) : null, startedAt: daysAgo(startedDaysAgo),
    completedAt: finished ? daysAgo(opts.lastDaysAgo ?? 1) : null,
  };
  store.put('enrollments', enrollment);
  const last = opts.lastDaysAgo ?? 2;
  lessons.forEach((l, i) => {
    if (i < completed) {
      const d = completed <= 1 ? last : Math.round(startedDaysAgo - ((startedDaysAgo - last) * (i + 1)) / completed);
      const at = daysAgo(Math.max(last, d));
      store.put('progress', { id: `prg_${userKey}_${l.id}`, userId: user, lessonId: l.id, enrollmentId: enrollment.id, status: 'completed', lastBlockId: null, completedAt: at, updatedAt: at });
      recordLessonCompleted(user, orgId, l, at);
    } else if (i === completed && opts.inProgress) {
      const at = daysAgo(last);
      store.put('progress', { id: `prg_${userKey}_${l.id}`, userId: user, lessonId: l.id, enrollmentId: enrollment.id, status: 'in_progress', lastBlockId: l.blocks[1]?.id ?? null, completedAt: null, updatedAt: at });
    }
  });
}

export function seedAll() {
  const created = daysAgo(120);
  store.putMany('users', users);
  store.putMany('organisations', [orgA, orgB]);

  // Pathways
  lessonsByPathway.set('foundations', seedPathway(foundations, 'grace', created));
  lessonsByPathway.set('prayer', seedPathway(prayer, 'esperance', created));
  lessonsByPathway.set('mark', seedPathway(mark, 'daniel', created));
  lessonsByPathway.set('leading', seedPathway(leading, 'helena', created));
  lessonsByPathway.set('psalms', seedPathway(psalms, 'esperance', created));
  lessonsByPathway.set('sermon', seedPathway(sermon, 'daniel', created));
  lessonsByPathway.set('rhythms', seedPathway(rhythms, 'grace', created));
  store.put('invites', { id: 'inv_welcome' as Id<'inv'>, orgId: ORG_A, code: 'LANTERN-2026', email: null, roles: ['student'], expiresAt: daysFromNow(365), status: 'pending', createdBy: uid('helena'), createdAt: daysAgo(10) });

  const activeDays: Record<string, number | null> = {
    helena: 0, grace: 0, daniel: 1, esperance: 2, marcos: 3, kwabena: 1, sofia: 2, thandiwe: 4, adaeze: 1, tomas: 0, jinwoo: 18, mateus: 2, fatima: 3, olumide: 9,
    ngozi: 3, salma: 1, maria: 6, ananya: 4, oliver: 5, wanjiku: 2, yaw: 8, amina: 7, chidi: 12, esther: 5, joao: 11, lindiwe: 6, sipho: 21,
  };
  store.putMany('memberships', memberships(activeDays, daysAgo));

  for (const [mentor, mentees] of Object.entries(assignments)) {
    for (const m of mentees) store.put('assignments', { id: `mas_${mentor}_${m}` as Id<'mas'>, orgId: ORG_A, mentorId: uid(mentor), menteeId: uid(m), status: 'active', startedAt: daysAgo(70), endedAt: null });
  }

  for (const g of seedGroups) {
    const group = groupFrom(g, g.pathway ? pathwayId(g.pathway) : null, daysAgo(90));
    store.put('groups', group);
    [...g.leaders.map((k) => [k, 'leader'] as const), ...g.members.map((k) => [k, 'member'] as const)].forEach(([k, role]) =>
      store.put('groupMemberships', { id: `gmb_${g.key}_${k}`, groupId: group.id, userId: uid(k), role, joinedAt: daysAgo(80) }),
    );
    // Past and upcoming meetings
    const lessonKeys = lessonsByPathway.get(g.pathway ?? '')?.map((l) => l.id) ?? [];
    [-21, -14, -7, 0, 7].forEach((offset, i) => {
      const dayOffset = offset === 0 ? 0 : offset;
      const base = new Date();
      base.setUTCHours(Number(g.time.slice(0, 2)) - 3, Number(g.time.slice(3, 5)), 0, 0);
      const delta = ((g.weekday - base.getUTCDay() + 7) % 7) + dayOffset;
      const starts = new Date(base.getTime() + delta * 86_400_000);
      const past = starts.getTime() < Date.now();
      const present = past ? g.members.concat(g.leaders).filter((_, idx) => (idx + i) % 4 !== 0) : [];
      const meeting: Meeting = {
        id: `mtg_${g.key}_${i}` as Id<'mtg'>, groupId: group.id, startsAt: starts.toISOString(), endsAt: new Date(starts.getTime() + 90 * 60_000).toISOString(),
        location: g.location, videoUrl: null, lessonId: lessonKeys[Math.min(i + 1, lessonKeys.length - 1)] ?? null,
        agenda: [
          { id: 'a1', kind: 'opening', title: 'Welcome and a shared meal', minutes: 15, detail: null },
          { id: 'a2', kind: 'scripture', title: 'Read the passage aloud', minutes: 10, detail: null },
          { id: 'a3', kind: 'discussion', title: 'Discussion', minutes: 40, detail: 'Use the lesson questions.' },
          { id: 'a4', kind: 'prayer', title: 'Prayer', minutes: 15, detail: null },
        ],
        notes: null, status: past ? 'held' : 'scheduled', attendance: past ? [...g.members, ...g.leaders].map((k) => ({ userId: uid(k), present: present.includes(k) })) : [], version: 1,
      };
      store.put('meetings', meeting);
    });
  }

  // Learning progress
  enroll('adaeze', 'foundations', 2, 21, 'grace', { inProgress: true, groupKey: 'thursday', lastDaysAgo: 4 });
  enroll('tomas', 'foundations', 5, 34, 'grace', { inProgress: true, groupKey: 'thursday', lastDaysAgo: 1 });
  enroll('fatima', 'foundations', 3, 28, 'grace', { inProgress: true, groupKey: 'thursday', lastDaysAgo: 3 });
  enroll('olumide', 'foundations', 1, 20, 'grace', { inProgress: false, groupKey: 'thursday', lastDaysAgo: 10 });
  enroll('ngozi', 'foundations', 6, 40, 'daniel', { inProgress: true, groupKey: 'thursday', lastDaysAgo: 3 });
  enroll('jinwoo', 'foundations', 2, 36, 'daniel', { inProgress: false, groupKey: 'thursday', lastDaysAgo: 19 });
  enroll('mateus', 'foundations', 4, 30, 'daniel', { inProgress: true, groupKey: 'thursday', lastDaysAgo: 2 });
  enroll('oliver', 'foundations', 3, 25, 'marcos', { inProgress: true, lastDaysAgo: 5 });
  enroll('chidi', 'foundations', 1, 22, 'marcos', { inProgress: false, lastDaysAgo: 12 });
  enroll('salma', 'mark', 3, 24, 'esperance', { inProgress: true, groupKey: 'sunday', lastDaysAgo: 1 });
  enroll('maria', 'mark', 2, 24, 'esperance', { inProgress: true, groupKey: 'sunday', lastDaysAgo: 6 });
  enroll('ananya', 'mark', 4, 24, 'esperance', { inProgress: true, groupKey: 'sunday', lastDaysAgo: 4 });
  enroll('thandiwe', 'psalms', 1, 6, null, { inProgress: true, lastDaysAgo: 1 });
  enroll('adaeze', 'psalms', 2, 9, null, { inProgress: false, lastDaysAgo: 3 });
  enroll('adaeze', 'sermon', 1, 7, 'grace', { inProgress: false, lastDaysAgo: 5 });
  enroll('kwabena', 'sermon', 3, 14, null, { inProgress: true, lastDaysAgo: 2 });
  enroll('sofia', 'rhythms', 2, 12, null, { inProgress: true, lastDaysAgo: 3 });
  enroll('wanjiku', 'prayer', 2, 18, 'esperance', { inProgress: true, lastDaysAgo: 2 });
  enroll('kwabena', 'leading', 3, 30, 'helena', { inProgress: true, groupKey: 'leaders', lastDaysAgo: 1 });
  enroll('sofia', 'leading', 2, 30, 'helena', { inProgress: true, groupKey: 'leaders', lastDaysAgo: 2 });
  enroll('priya', 'foundations', 2, 15, null, { inProgress: true, lastDaysAgo: 3, org: null });

  seedReflections();
  seedExtras();
  seedWorkspace();

  // Make sure everyone has their milestones, then add a few mentor affirmations later in extras.
  for (const u of users) evaluateMilestones(u.id, daysAgo(1));
  notify(uid('adaeze'), 'invite_received', { messageKey: 'notif.welcome', params: { org: orgA.name } }, '/app/today', null, daysAgo(21));
  // Only recent activity is unread, so the bell shows a believable handful.
  const cutoff = daysAgo(3);
  for (const n of store.list('notifications')) if (n.createdAt < cutoff && !n.readAt) store.put('notifications', { ...n, readAt: n.createdAt });
  void ORG_B; void daysFromNow;
}
