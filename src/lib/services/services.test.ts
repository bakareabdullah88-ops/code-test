import { readFileSync } from 'node:fs';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Id } from '@/types';
import { setDemoSettings } from '../db/demo-settings';
import { signInAs } from '../db/session';
import { store } from '../db/store';
import { bootService, notificationsService } from './system';
import { feedbackService, reflectionsService } from './reflections';
import { lessonsService, pathwaysService } from './learning';
import { mentoringService } from './mentoring';
import { doc, p } from '@/seed/rich';

const as = (k: string, org: string | null = 'org_lanternhill') => signInAs(`usr_${k}` as Id<'usr'>, org as Id<'org'> | null);

beforeAll(async () => {
  setDemoSettings({ latency: 'instant', offline: false });
  await bootService.ensureSeeded();
});
beforeEach(() => setDemoSettings({ latency: 'instant', offline: false }));

describe('seed integrity', () => {
  it('every scripture reference in every lesson exists in the bundled Bible', () => {
    const cache = new Map<string, { chapters: { v: number }[][] }>();
    const missing: string[] = [];
    for (const l of store.list('lessons')) {
      for (const b of l.blocks) {
        const refs = b.type === 'scripture' || b.type === 'memoryVerse' ? [b.ref] : [];
        for (const r of refs) {
          if (!cache.has(r.book)) cache.set(r.book, JSON.parse(readFileSync(`public/data/bible/web/${r.book}.json`, 'utf8')));
          const verses = cache.get(r.book)?.chapters[r.chapter - 1] ?? [];
          const end = r.verseEnd || verses.length;
          for (let v = r.verseStart; v <= end; v++) if (!verses.some((x) => x.v === v)) missing.push(`${l.id}: ${r.book} ${r.chapter}:${v}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('every quiz block points at a quiz that belongs to its lesson', () => {
    for (const l of store.list('lessons')) for (const b of l.blocks) if (b.type === 'quiz') expect(store.get('quizzes', b.quizId)?.lessonId).toBe(l.id);
  });
});

describe('reflection privacy', () => {
  it('private reflections are visible only to their author', async () => {
    as('adaeze');
    const mine = await reflectionsService.list({ scope: 'mine' });
    const priv = mine.find((r) => r.visibility === 'private');
    expect(priv).toBeTruthy();
    as('grace');
    await expect(reflectionsService.get(priv?.id ?? '')).rejects.toMatchObject({ code: 'not_found' });
    as('helena');
    await expect(reflectionsService.get(priv?.id ?? '')).rejects.toMatchObject({ code: 'not_found' });
  });

  it('admins never read shared reflections either', async () => {
    as('adaeze');
    const shared = (await reflectionsService.list({ scope: 'mine' })).find((r) => r.visibility === 'mentor' && r.status === 'submitted');
    as('helena');
    await expect(reflectionsService.get(shared?.id ?? '')).rejects.toMatchObject({ code: 'not_found' });
  });

  it('only the assigned mentor sees the mentor inbox', async () => {
    as('grace');
    const inbox = await reflectionsService.list({ scope: 'inbox' });
    expect(inbox.every((r) => ['adaeze', 'tomas', 'fatima', 'olumide'].includes(r.authorId.slice(4)))).toBe(true);
    as('daniel');
    const inboxD = await reflectionsService.list({ scope: 'inbox' });
    expect(inboxD.some((r) => r.authorId === 'usr_adaeze')).toBe(false);
  });
});

describe('the core loop', () => {
  it('reflection submitted -> mentor notified -> feedback -> student notified and attention clears', async () => {
    as('adaeze');
    const lessonRes = await lessonsService.get('les_grace');
    const created = await reflectionsService.create({ lessonId: lessonRes.lesson.id, body: doc(p('Receiving is harder than earning, for me.')) });
    const { reflection } = await reflectionsService.submit(created.id, { visibility: 'mentor' });
    expect(reflection.feedbackStatus).toBe('awaiting');

    as('grace');
    const before = await notificationsService.list(true);
    expect(before.some((n) => n.kind === 'reflection_shared' && n.subject?.id === reflection.id)).toBe(true);
    const attentionBefore = await mentoringService.attention();
    expect(attentionBefore.some((i) => i.kind === 'reflection_waiting' && i.menteeId === 'usr_adaeze')).toBe(true);

    await feedbackService.send(reflection.id, { body: doc(p('Thank you. Notice how you wrote "receiving".')) });
    as('adaeze');
    const after = await reflectionsService.get(reflection.id);
    expect(after.feedback).toHaveLength(1);
    expect(after.reflection.feedbackStatus).toBe('responded');
    const notifs = await notificationsService.list(true);
    expect(notifs.some((n) => n.kind === 'feedback_received' && n.subject?.type === 'feedback')).toBe(true);
  });

  it('completing a lesson records progress, timeline and milestones, and advances the pathway', async () => {
    as('priya', null);
    const res = await lessonsService.setProgress('les_jesus', 'completed');
    expect(res.progress?.status).toBe('completed');
    const detail = await pathwaysService.get('pth_foundations');
    expect(detail.progress.completed).toBeGreaterThanOrEqual(3);
  });
});

describe('mentor dashboard', () => {
  it('flags a quiet member and a long-waiting reflection from the seed', async () => {
    as('daniel');
    const items = await mentoringService.attention();
    expect(items.some((i) => i.kind === 'quiet' && i.menteeId === 'usr_jinwoo')).toBe(true);
    expect(items.some((i) => i.kind === 'reflection_waiting' && i.menteeId === 'usr_ngozi')).toBe(true);
  });

  it('students cannot open the mentor dashboard', async () => {
    as('adaeze');
    await expect(mentoringService.attention()).rejects.toMatchObject({ code: 'forbidden' });
  });
});

describe('pathway authoring', () => {
  it('blocks publishing a pathway with an empty lesson and lists the reasons', async () => {
    as('grace');
    await expect(pathwaysService.publish('pth_advent')).rejects.toMatchObject({ code: 'validation_failed' });
  });

  it('only the author can change a pathway', async () => {
    as('daniel');
    await expect(pathwaysService.update('pth_foundations', { title: 'Hijacked' })).rejects.toMatchObject({ code: 'forbidden' });
  });

  it('reorders lessons atomically', async () => {
    as('grace');
    const d = await pathwaysService.get('pth_advent');
    const m = d.outline[0];
    const ids = m?.lessons.map((l) => l.id) ?? [];
    const next = await pathwaysService.reorder('pth_advent', [{ id: m?.id ?? '', lessonIds: [...ids].reverse() }]);
    expect(next.outline[0]?.lessons.map((l) => l.id)).toEqual([...ids].reverse());
  });
});

describe('simulated failures', () => {
  it('offline mode rejects with an offline error', async () => {
    as('adaeze');
    setDemoSettings({ offline: true });
    await expect(reflectionsService.list({ scope: 'mine' })).rejects.toMatchObject({ code: 'offline', retryable: true });
  });
});
