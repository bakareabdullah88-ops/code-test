import type { Id, Pathway, PrayerPrivacy, RichDoc } from '@/types';
import { daysAgo, daysFromNow } from '@/lib/db/ids';
import { store } from '@/lib/db/store';
import { addTimeline, award, evaluateMilestones, notify } from '@/lib/services/engine';
import { doc, p, range, text as textBlock, scripture, reflect } from './rich';
import { ORG_A, uid } from './people';

const rich = (...t: string[]): RichDoc => doc(...t.map((x) => p(x)));
const gid = (k: string) => `grp_${k}` as Id<'grp'>;

function prayer(key: string, user: string, daysAgoN: number, body: string, privacy: PrayerPrivacy, opts: { group?: string; anonymous?: boolean; category?: 'health' | 'family' | 'work' | 'faith' | 'community' | 'thanks' | 'other'; supporters?: string[]; answered?: string } = {}) {
  const at = daysAgo(daysAgoN, 8);
  store.put('prayers', {
    id: `pry_${key}` as Id<'pry'>, orgId: ORG_A, authorId: uid(user), anonymous: !!opts.anonymous, body, category: opts.category ?? null, privacy,
    groupId: opts.group ? gid(opts.group) : null, status: opts.answered ? 'answered' : 'open', supporterCount: opts.supporters?.length ?? 0, iAmPraying: false,
    answeredNote: opts.answered ?? null, answeredAt: opts.answered ? daysAgo(Math.max(0, daysAgoN - 5), 8) : null, createdAt: at, updatedAt: at,
    supporterIds: (opts.supporters ?? []).map(uid),
  });
}

export function seedExtras() {
  // Discussion on the Grace lesson in Thursday Table
  const thread: Id<'thr'> = 'thr_thursday_grace' as Id<'thr'>;
  store.put('threads', { id: thread, groupId: gid('thursday'), lessonId: 'les_grace' as Id<'les'>, title: 'Grace: what stood out to you?', createdBy: uid('kwabena'), pinned: true, locked: false, postCount: 6, lastPostAt: daysAgo(2, 20), createdAt: daysAgo(17, 9) });
  const posts: [string, string, number, string[], string | null][] = [
    ['p1', 'kwabena', 17, ['Welcome to this week’s thread. Read Ephesians 2:8-9 and tell us one word or phrase that stood out, and why. There are no wrong answers.'], null],
    ['p2', 'tomas', 16, ['"Not of yourselves." I have been proud of working hard at being a good Christian. This verse took the wind out of me, in a good way.'], null],
    ['p3', 'fatima', 15, ['For me it was "gift". I grew up with a strong sense that everything has to be paid for. A gift that cannot be paid back is a strange idea.'], null],
    ['p4', 'olumide', 14, ['I wonder how to hold this together with James saying faith without works is dead. Does anyone have thoughts?'], null],
    ['p5', 'kwabena', 13, ['Good question, Olumide. I think James is describing what real faith looks like, not how to earn grace. Let’s explore it on Thursday.'], 'p4'],
    ['p6', 'adaeze', 2, ['I am new to all this. Is it okay if I just say I find the idea of a gift with no strings hard to believe? I would like to believe it.'], null],
  ];
  for (const [id, user, d, paras, parent] of posts) {
    store.put('posts', {
      id: `pst_${id}` as Id<'pst'>, threadId: thread, parentId: parent ? (`pst_${parent}` as Id<'pst'>) : null, authorId: uid(user), body: rich(...paras), sharedReflection: null,
      status: 'visible', moderation: null, createdAt: daysAgo(d, 20), editedAt: null, reactions: id === 'p6' ? [{ kind: 'amen', count: 3, mine: false }] : [],
    });
  }
  store.put('reports', { id: 'rpt_1' as Id<'rpt'>, subject: { type: 'post', id: 'pst_p4' }, reportedBy: uid('sipho'), reason: 'off_topic', note: 'Seems like a different topic from the thread.', status: 'open', createdAt: daysAgo(1) });

  // Prayer wall
  prayer('a', 'adaeze', 3, 'Please pray for my mother, who is in hospital in Port Harcourt. We are waiting for test results.', 'group', { group: 'thursday', category: 'health', supporters: ['tomas', 'fatima', 'kwabena'] });
  prayer('b', 'tomas', 9, 'Thankful: after four months of searching I have a new job. Thank you to everyone who prayed.', 'organisation', { category: 'thanks', supporters: ['grace', 'helena', 'kwabena', 'esther'], answered: 'I start on Monday. I did not expect this to come so soon.' });
  prayer('c', 'fatima', 2, 'Wisdom for a hard conversation with my supervisor at the pharmacy.', 'mentor', { category: 'work' });
  prayer('d', 'jinwoo', 6, 'Feeling very far from home. Please pray for peace and for good friendships.', 'group', { group: 'thursday', anonymous: true, category: 'community', supporters: ['kwabena'] });
  prayer('e', 'esther', 4, 'For the families in our neighbourhood who lost homes in the floods.', 'organisation', { category: 'community', supporters: ['thandiwe', 'amina', 'chidi', 'lindiwe'] });
  prayer('f', 'ngozi', 5, 'I find it hard to feel anything when I pray lately. I would like to keep going anyway.', 'only_me', { category: 'faith' });
  prayer('g', 'sofia', 8, 'Strength for the next season of leading the Sunday group. I feel stretched.', 'group', { group: 'leaders', category: 'faith', supporters: ['kwabena', 'thandiwe'] });
  prayer('h', 'lindiwe', 1, 'My brother is starting chemotherapy next week.', 'group', { group: 'riverside', category: 'health', supporters: ['thandiwe'] });

  // Goals and check-ins
  store.put('goals', { id: 'gol_adaeze_mark1' as Id<'gol'>, userId: uid('adaeze'), createdBy: uid('adaeze'), kind: 'personal', title: 'Read Mark 1 slowly this week', description: 'Take one question to Grace on Friday.', targetDate: daysFromNow(4).slice(0, 10),
    steps: [{ id: 's1', label: 'Read verses 1-20', done: true }, { id: 's2', label: 'Read verses 21-45', done: false }, { id: 's3', label: 'Write down one question', done: false }], status: 'active', completedAt: null, linked: { type: 'lesson', id: 'les_mark-1' }, mentorNote: null, version: 1, createdAt: daysAgo(3) });
  store.put('goals', { id: 'gol_tomas_verse' as Id<'gol'>, userId: uid('tomas'), createdBy: uid('grace'), kind: 'mentor_set', title: 'Learn Ephesians 2:8-9 by heart', description: 'Review it a little each day. Aim for the end of the month.', targetDate: daysFromNow(14).slice(0, 10),
    steps: [{ id: 's1', label: 'Read it aloud each morning', done: true }, { id: 's2', label: 'Say it without looking', done: false }], status: 'active', completedAt: null, linked: { type: 'verse', id: 'EPH.2.8-9' }, mentorNote: 'No rush. The aim is to carry it, not to pass a test.', version: 1, createdAt: daysAgo(12) });
  store.put('goals', { id: 'gol_fatima_done' as Id<'gol'>, userId: uid('fatima'), createdBy: uid('fatima'), kind: 'personal', title: 'Finish lesson 3 before Thursday', description: null, targetDate: daysAgo(6).slice(0, 10),
    steps: [], status: 'completed', completedAt: daysAgo(6, 21), linked: null, mentorNote: null, version: 1, createdAt: daysAgo(14) });

  store.put('checkIns', { id: 'chk_adaeze_1' as Id<'chk'>, mentorId: uid('grace'), menteeId: uid('adaeze'), scheduledAt: daysAgo(14, 17), durationMin: 30, mode: 'call', location: null, status: 'held', agenda: ['How is the first week going?', 'Any questions about Mark 1?'], sharedSummary: rich('We talked about doubt and how it is welcome here. Adaeze will read Mark 1 and bring a question.'), createdAt: daysAgo(16) });
  store.put('checkIns', { id: 'chk_adaeze_2' as Id<'chk'>, mentorId: uid('grace'), menteeId: uid('adaeze'), scheduledAt: daysFromNow(2, 16), durationMin: 30, mode: 'call', location: null, status: 'planned', agenda: ['Follow up on "known and not rejected"', 'Her mother’s health'], sharedSummary: null, createdAt: daysAgo(2) });
  store.put('checkIns', { id: 'chk_tomas_1' as Id<'chk'>, mentorId: uid('grace'), menteeId: uid('tomas'), scheduledAt: daysFromNow(6, 17), durationMin: 45, mode: 'in_person', location: 'Church garden', status: 'planned', agenda: ['Call with his brother', 'Memorising Ephesians 2:8-9'], sharedSummary: null, createdAt: daysAgo(1) });
  store.put('sessionNotes', { id: 'snt_adaeze_1' as Id<'snt'>, mentorId: uid('grace'), menteeId: uid('adaeze'), checkInId: 'chk_adaeze_1' as Id<'chk'>, body: rich('Hesitant at first, then opened up. Worried about being too much at work. Mother’s health weighing on her.', 'Follow up on whether she has someone to talk to at work.'), plainText: 'Hesitant at first, then opened up.', followUps: [{ id: 'f1', label: 'Ask how things are at work', done: false }, { id: 'f2', label: 'Share a short prayer for her mother', done: true }], createdAt: daysAgo(14), updatedAt: daysAgo(14), version: 1 });

  // Memory verses
  const verse = (user: string, key: string, ref: string, text: string, dueIn: number, state: 'new' | 'learning' | 'known', box: number) => {
    const r = range(ref);
    store.put('memoryVerses', { id: `mvs_${user}_${key}` as Id<'mvs'>, userId: uid(user), translationId: 'web', range: r, text, source: { type: 'lesson', id: 'les_grace' }, srs: { box, easiness: 2.5, intervalDays: [0, 1, 3, 7, 14, 30][box] ?? 1, reps: box, dueAt: dueIn <= 0 ? daysAgo(-dueIn) : daysFromNow(dueIn), lastReviewedAt: daysAgo(3) }, state, createdAt: daysAgo(12) });
  };
  verse('adaeze', 'eph', 'EPH 2:8-9', 'For by grace you have been saved through faith, and that not of yourselves; it is the gift of God, not of works, that no one would boast.', 0, 'learning', 1);
  verse('adaeze', 'php', 'PHP 4:6-7', 'In nothing be anxious, but in everything, by prayer and petition with thanksgiving, let your requests be made known to God. And the peace of God, which surpasses all understanding, will guard your hearts and your thoughts in Christ Jesus.', 2, 'new', 0);
  verse('tomas', 'eph', 'EPH 2:8-9', 'For by grace you have been saved through faith, and that not of yourselves; it is the gift of God, not of works, that no one would boast.', 3, 'known', 4);
  verse('tomas', 'psa', 'PSA 119:105', 'Your word is a lamp to my feet, and a light for my path.', 1, 'learning', 2);
  verse('tomas', 'mrk', 'MRK 8:34', 'He called the multitude to himself with his disciples, and said to them, “Whoever wants to come after me, let him deny himself, and take up his cross, and follow me.', 0, 'learning', 1);

  // Highlights and notes for Adaeze
  store.put('highlights', { id: 'hlt_1' as Id<'hlt'>, userId: uid('adaeze'), translationId: 'web', range: range('JHN 3:16'), color: 'straw', createdAt: daysAgo(10) });
  store.put('highlights', { id: 'hlt_2' as Id<'hlt'>, userId: uid('adaeze'), translationId: 'web', range: range('EPH 2:8-9'), color: 'rose', createdAt: daysAgo(5) });
  store.put('verseNotes', { id: 'vnt_1' as Id<'vnt'>, userId: uid('adaeze'), range: range('EPH 2:8'), body: rich('Saved by grace. Not by trying harder.'), plainText: 'Saved by grace. Not by trying harder.', reflectionId: null, createdAt: daysAgo(5), updatedAt: daysAgo(5), version: 1 });

  // A draft pathway for the builder demo (Grace)
  const draftId = 'pth_advent' as Id<'pth'>;
  const draft: Pathway = { id: draftId, orgId: ORG_A, title: 'Advent: Waiting Well', summary: 'Four short weekly readings for the weeks before Christmas.', audience: 'Everyone', level: 'growing', coverKey: 'lamp', locale: 'en', estimatedMinutes: 24, moduleCount: 1, lessonCount: 2, status: 'draft', version: 1, publishedVersion: null, authorId: uid('grace'), tags: ['seasonal'], visibility: 'organisation', createdAt: daysAgo(6), updatedAt: daysAgo(1) };
  store.put('pathways', draft);
  store.put('modules', { id: 'mod_advent_1' as Id<'mod'>, pathwayId: draftId, title: 'Weeks one and two', summary: null, position: 0 });
  store.put('lessons', { id: 'les_advent-1' as Id<'les'>, pathwayId: draftId, moduleId: 'mod_advent_1' as Id<'mod'>, title: 'Waiting', summary: 'What it means to wait with hope.', position: 0, estimatedMinutes: 10, blocks: [textBlock(p('Advent is the season of waiting. We wait not because nothing is happening, but because something is coming.')), scripture('ISA 9:2'), reflect('advent-1', 'What are you waiting for this season?')], completion: { requireQuiz: false, requireReflection: false }, status: 'draft', version: 1, updatedAt: daysAgo(1) });
  store.put('lessons', { id: 'les_advent-2' as Id<'les'>, pathwayId: draftId, moduleId: 'mod_advent_1' as Id<'mod'>, title: 'Light in the dark', summary: 'Darkness and the light that shines in it.', position: 1, estimatedMinutes: 14, blocks: [], completion: { requireQuiz: false, requireReflection: false }, status: 'draft', version: 1, updatedAt: daysAgo(1) });

  // Mentor affirmation and some notifications
  award(uid('tomas'), 'verses_3', null, daysAgo(2), uid('grace'), 'Well done keeping these close.');
  addTimeline(uid('adaeze'), 'memory_verse_added', { type: 'verse', id: 'EPH.2.8-9' }, { messageKey: 'timeline.memory_verse_added', params: { ref: 'Ephesians 2:8-9' } }, 'owner', daysAgo(12));
  notify(uid('grace'), 'ai_approval_request', { messageKey: 'notif.system_welcome', params: {} }, '/mentor', null, daysAgo(1));
  for (const u of ['adaeze', 'tomas', 'fatima']) evaluateMilestones(uid(u), daysAgo(1));
}
