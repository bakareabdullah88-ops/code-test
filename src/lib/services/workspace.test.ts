import { readFileSync } from 'node:fs';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { Id } from '@/types';
import { setDemoSettings } from '../db/demo-settings';
import { getSessionState, signInAs } from '../db/session';
import { store } from '../db/store';
import { parseRef } from '../bible/ref';
import { authService, bootService } from './system';
import { eventsService, libraryService, plansService } from './workspace';

const as = (k: string, org: string | null = 'org_lanternhill') => signInAs(`usr_${k}` as Id<'usr'>, org as Id<'org'> | null);

beforeAll(async () => {
  setDemoSettings({ latency: 'instant', offline: false });
  await bootService.ensureSeeded();
});
beforeEach(() => setDemoSettings({ latency: 'instant', offline: false }));

describe('seed integrity for plans and resources', () => {
  it('every reference in plans and resources exists in the bundled Bible', () => {
    const cache = new Map<string, { chapters: { v: number }[][] }>();
    const missing: string[] = [];
    const refs = [...store.list('plans').flatMap((p) => p.days.flatMap((d) => d.refs)), ...store.list('resources').flatMap((r) => r.refs)];
    for (const ref of refs) {
      const r = parseRef(ref);
      if (!r) { missing.push(`${ref}: unparseable`); continue; }
      if (!cache.has(r.book)) cache.set(r.book, JSON.parse(readFileSync(`public/data/bible/web/${r.book}.json`, 'utf8')));
      const verses = cache.get(r.book)?.chapters[r.chapter - 1] ?? [];
      const end = r.verseEnd || verses.length;
      for (let v = r.verseStart || 1; v <= end; v++) if (!verses.some((x) => x.v === v)) missing.push(`${ref}: ${r.chapter}:${v}`);
    }
    expect(missing).toEqual([]);
  });
});

describe('authService', () => {
  it('signs in a seeded email with any password and rejects unknown ones', async () => {
    const r = await authService.signIn({ email: 'Grace@example.org', password: 'x' });
    expect(r.roles).toContain('mentor');
    expect(getSessionState().userId).toBe('usr_grace');
    await expect(authService.signIn({ email: 'nobody@example.org', password: 'x' })).rejects.toMatchObject({ code: 'unauthenticated' });
  });

  it('validates fields', async () => {
    await expect(authService.signIn({ email: 'nope', password: '' })).rejects.toMatchObject({ code: 'validation_failed', fieldErrors: { email: ['invalid'], password: ['required'] } });
  });

  it('joins with an invite code once, and rejects reuse, bad codes and duplicate emails', async () => {
    const r = await authService.join({ code: 'lantern-2026', name: 'Test Person', email: 'test.person@example.org' });
    expect(r.roles).toEqual(['student']);
    expect(store.list('invites').find((i) => i.code === 'LANTERN-2026')?.status).toBe('accepted');
    await expect(authService.join({ code: 'LANTERN-2026', name: 'Other', email: 'other@example.org' })).rejects.toMatchObject({ code: 'not_found' });
    await expect(authService.join({ code: 'WRONG', name: 'Other', email: 'other@example.org' })).rejects.toMatchObject({ code: 'not_found' });
  });
});

describe('eventsService', () => {
  it('rsvps idempotently and counts once', async () => {
    as('fatima');
    await eventsService.rsvp('evt_harvest-meal', 'going');
    await eventsService.rsvp('evt_harvest-meal', 'going');
    const e = await eventsService.get('evt_harvest-meal');
    expect(e.attendees.filter((a) => a.id === 'usr_fatima')).toHaveLength(1);
    expect(e.mine).toBe('going');
    await eventsService.rsvp('evt_harvest-meal', null);
    expect((await eventsService.get('evt_harvest-meal')).mine).toBeNull();
  });

  it('refuses going when an event is full', async () => {
    as('helena');
    const ev = await eventsService.create({ title: 'Tiny supper', kind: 'social', startsAt: new Date(Date.now() + 86_400_000).toISOString(), durationMinutes: 60, location: 'Kitchen', description: '', capacity: 1 });
    as('tomas');
    await expect(eventsService.rsvp(ev.id, 'going')).rejects.toMatchObject({ code: 'conflict' });
    await expect(eventsService.rsvp(ev.id, 'maybe')).resolves.toBeTruthy();
  });

  it('only leaders and admins create events, and validates input', async () => {
    as('tomas');
    await expect(eventsService.create({ title: 'x', kind: 'social', startsAt: '', durationMinutes: 60, location: '', description: '', capacity: null })).rejects.toMatchObject({ code: 'forbidden' });
    as('helena');
    await expect(eventsService.create({ title: 'x', kind: 'social', startsAt: '', durationMinutes: 60, location: '', description: '', capacity: null })).rejects.toMatchObject({ code: 'validation_failed' });
  });

  it('hides events from other organisations and from people without one', async () => {
    as('hannah', 'org_northgate');
    await expect(eventsService.get('evt_sunday')).rejects.toMatchObject({ code: 'not_found' });
    expect(await eventsService.list('upcoming')).toEqual([]);
  });

  it('lets only the host or an admin cancel', async () => {
    as('tomas');
    await expect(eventsService.cancel('evt_retreat')).rejects.toMatchObject({ code: 'forbidden' });
    as('helena');
    await expect(eventsService.cancel('evt_retreat')).resolves.toEqual({ id: 'evt_retreat' });
  });
});

describe('libraryService', () => {
  it('searches, filters and toggles bookmarks per person', async () => {
    as('tomas');
    expect((await libraryService.list({ query: 'doubt' })).map((r) => r.id)).toEqual(['res_doubt']);
    expect((await libraryService.list({ kind: 'audio' })).every((r) => r.kind === 'audio')).toBe(true);
    expect((await libraryService.toggleBookmark('res_doubt')).bookmarked).toBe(true);
    expect((await libraryService.list({ saved: true })).map((r) => r.id)).toEqual(['res_doubt']);
    as('fatima');
    expect(await libraryService.list({ saved: true })).toEqual([]);
    as('tomas');
    expect((await libraryService.toggleBookmark('res_doubt')).bookmarked).toBe(false);
    await expect(libraryService.get('res_missing')).rejects.toMatchObject({ code: 'not_found' });
  });
});

describe('plansService', () => {
  it('requires starting, tracks days and records a timeline entry when finished', async () => {
    as('tomas');
    await expect(plansService.toggleDay('pln_psalms7', 1)).rejects.toMatchObject({ code: 'conflict' });
    await plansService.start('pln_psalms7');
    await plansService.start('pln_psalms7');
    expect(store.find('planProgress', (x) => x.userId === 'usr_tomas')).toHaveLength(1);
    for (let d = 1; d <= 7; d++) await plansService.toggleDay('pln_psalms7', d);
    const p = await plansService.get('pln_psalms7');
    expect(p.completed).toBe(7);
    expect(p.nextDay).toBeNull();
    expect(store.find('timeline', (t) => t.userId === 'usr_tomas' && t.type === 'plan_completed')).toHaveLength(1);
    await plansService.toggleDay('pln_psalms7', 7);
    expect((await plansService.get('pln_psalms7')).completed).toBe(6);
    await expect(plansService.toggleDay('pln_psalms7', 99)).rejects.toMatchObject({ code: 'not_found' });
  });
});
