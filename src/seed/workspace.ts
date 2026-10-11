import type { EventKind, Id, OrgEvent, PlanDay, ReadingPlan, Resource, ResourceKind, RsvpStatus } from '@/types';
import { daysAgo, daysFromNow } from '@/lib/db/ids';
import { store } from '@/lib/db/store';
import { ORG_A, uid } from './people';

const ev = (key: string, title: string, kind: EventKind, offset: number, hour: number, minutes: number, location: string, coverKey: string, host: string, description: string[], opts: { capacity?: number; group?: string } = {}): OrgEvent => {
  const startsAt = daysFromNow(offset, hour);
  return {
    id: `evt_${key}` as Id<'evt'>, orgId: ORG_A, title, description, kind, startsAt, endsAt: new Date(new Date(startsAt).getTime() + minutes * 60_000).toISOString(),
    location, coverKey, capacity: opts.capacity ?? null, hostId: uid(host), groupId: opts.group ? (`grp_${opts.group}` as Id<'grp'>) : null, createdAt: daysAgo(14),
  };
};

const events: OrgEvent[] = [
  ev('sunday', 'Sunday gathering', 'service', 3, 8, 90, 'Main hall, Lantern Hill', 'dawn', 'helena', ['Our weekly gathering. We sing, read together and hear a short message on the Gospel of Mark.', 'Children are welcome. Tea and bread follow in the courtyard.']),
  ev('prayer-night', 'Night of prayer', 'prayer', 6, 15, 120, 'Upper room', 'lamp', 'esperance', ['A quiet evening with space to pray alone and together. You can come and go as you need.', 'There will be short prompts on cards. Silence is welcome too.'], { capacity: 40 }),
  ev('leaders-workshop', 'Leading a small group, part one', 'workshop', 9, 9, 150, 'Room 3', 'table', 'grace', ['A practical morning for current and future group leaders: how to ask open questions, make space for quieter voices and prepare a meeting in thirty minutes.', 'Bring your own copy of a recent lesson you have led or joined.'], { capacity: 20 }),
  ev('harvest-meal', 'Shared harvest meal', 'social', 13, 11, 180, 'Courtyard', 'field', 'daniel', ['Bring a dish from your home or your country and tell us about it. We will eat together outside if the weather allows.']),
  ev('mark-study', 'Mark study evening', 'workshop', 16, 15, 90, 'Sunday Seekers room', 'path', 'esperance', ['A closer look at the next chapter of Mark with time for questions. Open to anyone, whether or not you have read ahead.'], { group: 'sunday' }),
  ev('retreat', 'Quiet weekend retreat', 'retreat', 30, 7, 2 * 24 * 60, 'Hillside guesthouse', 'mountain', 'helena', ['Two days away from screens, with morning reading, walks, shared meals and unhurried time for prayer.', 'Rooms are shared. Costs are covered by the community fund, so please tell us if cost is a concern.'], { capacity: 24 }),
  ev('thursday-table', 'Thursday Table', 'social', 2, 17, 90, 'Community kitchen', 'table', 'kwabena', ['Our weekly group meets to cook, eat and talk about the lesson. New people are welcome to join for a first visit.'], { group: 'thursday' }),
  ev('baptism', 'Baptism and celebration', 'service', 40, 9, 150, 'The river bank', 'river', 'helena', ['Anyone who would like to be baptised can speak with a mentor beforehand. Friends and family are warmly invited to watch and celebrate.']),
];

const rsvps: [string, string, RsvpStatus][] = [
  ['sunday', 'adaeze', 'going'], ['sunday', 'tomas', 'going'], ['sunday', 'fatima', 'maybe'], ['sunday', 'grace', 'going'], ['sunday', 'kwabena', 'going'],
  ['prayer-night', 'adaeze', 'maybe'], ['prayer-night', 'esperance', 'going'], ['prayer-night', 'ngozi', 'going'],
  ['leaders-workshop', 'sofia', 'going'], ['leaders-workshop', 'kwabena', 'going'], ['leaders-workshop', 'thandiwe', 'maybe'],
  ['retreat', 'tomas', 'going'], ['retreat', 'ngozi', 'going'], ['retreat', 'mateus', 'maybe'],
  ['harvest-meal', 'maria', 'going'], ['harvest-meal', 'salma', 'going'],
];

const res = (key: string, title: string, kind: ResourceKind, author: string, minutes: number, tags: string[], coverKey: string, summary: string, body: string[], refs: string[] = []): Resource => ({
  id: `res_${key}` as Id<'res'>, orgId: ORG_A, title, kind, summary, author, minutes, tags, coverKey, body, refs, createdAt: daysAgo(40),
});

const resources: Resource[] = [
  res('start-reading', 'How to start reading the Bible', 'guide', 'Grace Wanjiru', 6, ['scripture', 'beginners'], 'path', 'Where to begin, how much to read, and what to do when a passage makes no sense.',
    ['Many people open the Bible at page one and stall in the first few books of law. A better start is one of the four accounts of Jesus. Mark is short and quick, John is reflective, Luke is detailed and warm.', 'Read a small section at a time, about a chapter at most. Read it once to get the story, then again slowly. Underline a word or phrase that stays with you.', 'When something confuses you, mark it and keep going. Many questions are answered a few pages later, and the rest are good things to bring to a mentor or group.', 'Keep a simple pattern: read, notice, ask, respond. What does this say about God? What does it ask of me? What is one small thing I will do?'], ['MRK 1:1-15', 'JHN 1:1-18']),
  res('prayer-basics', 'A first week of prayer', 'guide', 'Esperance Uwase', 5, ['prayer', 'beginners'], 'lamp', 'Seven short, honest ways to begin praying without special words.',
    ['Prayer is talking with God, and it does not need to be polished. Begin where you are. If words are hard, borrow some from the Psalms or the Lord\'s Prayer.', 'Day one, thank God for three ordinary things. Day two, say what is worrying you. Day three, pray for one person by name. Day four, sit in a minute of quiet. Day five, read a psalm aloud. Day six, say sorry for something specific. Day seven, ask for one thing you really want.', 'Keep each prayer short. Consistency matters more than length. If your mind wanders, gently return. That is the practice.'], ['MAT 6:9-13']),
  res('doubt', 'Honest doubt', 'article', 'Daniel Osei', 8, ['doubt', 'faith'], 'dawn', 'Doubt is not the opposite of faith. Here is how to hold questions without losing heart.',
    ['Almost everyone who follows Jesus has doubted. John the Baptist sent friends to ask whether Jesus was really the one. Thomas wanted to see the wounds before he believed. Neither was turned away.', 'Doubt tends to be healthier when it is spoken aloud and not buried. Find someone safe who will listen without panic. Write your questions down and return to them over time. Some will be answered, some will become less urgent, and some will stay as open questions you carry with trust.', 'It also helps to separate questions about God from questions about people. Often what shakes us is how a person or institution behaved, not who God is.'], ['MRK 9:23-24', 'JHN 20:24-29']),
  res('mentoring', 'How to be a good mentor', 'guide', 'Helena Costa', 9, ['mentoring', 'leading'], 'table', 'Listening, asking better questions and giving feedback that encourages.',
    ['A mentor walks alongside; they do not run ahead. The most valuable thing you can offer is attention. Let the other person finish. Ask what they noticed before you say what you noticed.', 'Good feedback is specific, kind and brief. Name something that landed, then offer one question or next step. Avoid giving a list of corrections. Growth is steady, not sudden.', 'Protect privacy. What someone shares with you is theirs. If something makes you concerned for their safety, involve the right people gently and tell the person you are doing so.'], ['PRO 27:17']),
  res('rest', 'Resting well', 'article', 'Marcos Almeida', 6, ['rest', 'habits'], 'river', 'Why a protected pause matters, and what to do with it.',
    ['Rest is not laziness. In Genesis even God rests, not because he is tired but because the work is good. A weekly pause tells us we are more than our productivity.', 'Rest is easiest when it is planned. Decide your pause in advance, turn off notifications, and choose things that restore you: sleep, a walk, a meal with friends, music, an unhurried read.', 'If your schedule makes a full day impossible, start with a few protected hours.'], ['GEN 2:1-3', 'MAT 11:28-30']),
  res('psalms-audio', 'Reading Psalm 23 aloud', 'audio', 'Thandiwe Dlamini', 4, ['psalms', 'audio'], 'river', 'A slow reading with pauses, for evenings and quiet mornings.',
    ['This is a short guided listen. Read or listen slowly and let each line settle before moving to the next. Notice which word catches you.', 'There are six verses. After each, pause for one slow breath. Do not rush to finish. At the end sit quietly for a minute.'], ['PSA 23:1-6']),
  res('gospel-overview', 'The four Gospels at a glance', 'article', 'Grace Wanjiru', 7, ['gospels', 'overview'], 'mountain', 'Four accounts of one life, each with its own emphasis.',
    ['Matthew writes with a Jewish audience in mind and shows how Jesus fulfils what was promised. Mark is fast and direct, with an emphasis on action and on the cost of following. Luke is orderly and warm, attentive to the poor and to women. John is reflective, built around signs and conversations.', 'They are not competing. Think of four friends describing the same person: each notices different things, and together the picture grows.', 'If you are new, start with Mark, then read John slowly.'], ['MRK 1:1', 'LUK 1:1-4']),
  res('serving-small', 'Serving in small ways', 'guide', 'Sofía Ramírez', 5, ['service', 'habits'], 'field', 'Practical ideas for noticing needs and helping without fuss.',
    ['Look first at your own street, office, classroom or home. Who is lonely? Who is carrying too much? A message, a meal or an hour of help often matters more than a grand plan.', 'Ask before you assume. People are experts in their own needs. Offer something specific, like "Can I bring dinner on Thursday?", rather than "Let me know if you need anything".', 'Keep going quietly. Faithfulness over months builds trust that big gestures cannot.'], ['GAL 6:9-10']),
];

const day = (n: number, title: string, refs: string[], prompt: string): PlanDay => ({ day: n, title, refs, prompt });

const plans: ReadingPlan[] = [
  {
    id: 'pln_psalms7' as Id<'pln'>, title: 'A week in the Psalms', summary: 'Seven short psalms for seven days, each with a simple question to carry through the day.', coverKey: 'river', tags: ['psalms', 'short'],
    days: [
      day(1, 'Rooted', ['PSA 1:1-6'], 'What are you rooted in right now?'), day(2, 'Wonder', ['PSA 8:1-9'], 'What small or large thing makes you marvel today?'),
      day(3, 'Held', ['PSA 23:1-6'], 'Where do you most need a shepherd?'), day(4, 'Longing', ['PSA 42:1-11'], 'What is your soul thirsty for?'),
      day(5, 'Honest', ['PSA 51:1-12'], 'What would you like to say plainly to God?'), day(6, 'Help', ['PSA 121:1-8'], 'Where do you need help this week?'),
      day(7, 'Known', ['PSA 139:1-18'], 'What does it mean to be fully known and kept?'),
    ],
  },
  {
    id: 'pln_john10' as Id<'pln'>, title: 'Meet Jesus in John', summary: 'Ten days of conversations and signs from John\'s Gospel. A good second step after Mark.', coverKey: 'dawn', tags: ['gospel', 'jesus'],
    days: [
      day(1, 'The Word', ['JHN 1:1-18'], 'What stands out about how John begins?'), day(2, 'Come and see', ['JHN 1:35-51'], 'What would you ask Jesus if you walked with him?'),
      day(3, 'Born again', ['JHN 3:1-21'], 'Where do you feel like Nicodemus, curious and unsure?'), day(4, 'Living water', ['JHN 4:1-30'], 'What are you thirsty for?'),
      day(5, 'Bread of life', ['JHN 6:25-40'], 'What fills you, and what leaves you empty?'), day(6, 'The good shepherd', ['JHN 10:1-18'], 'Whose voice do you follow most?'),
      day(7, 'Lazarus', ['JHN 11:17-44'], 'Where do you need life to return?'), day(8, 'Servant', ['JHN 13:1-17'], 'Who could you serve quietly this week?'),
      day(9, 'Peace', ['JHN 14:1-27'], 'What troubles your heart, and what would peace look like?'), day(10, 'Morning', ['JHN 20:1-18'], 'What changes if the story is true?'),
    ],
  },
  {
    id: 'pln_proverbs7' as Id<'pln'>, title: 'Wisdom for ordinary days', summary: 'A week of Proverbs on words, work, friendship and trust.', coverKey: 'field', tags: ['wisdom', 'short'],
    days: [
      day(1, 'Trust', ['PRO 3:1-12'], 'Where are you leaning on your own understanding?'), day(2, 'Words', ['PRO 15:1-4', 'PRO 18:21'], 'What did you say today that you would like to say better?'),
      day(3, 'Work', ['PRO 6:6-11', 'PRO 16:1-9'], 'What work are you putting off?'), day(4, 'Friends', ['PRO 17:17', 'PRO 27:5-10'], 'Who has been a good friend to you? Tell them.'),
      day(5, 'Money', ['PRO 11:24-28', 'PRO 30:7-9'], 'What would enough look like?'), day(6, 'Humility', ['PRO 11:2', 'PRO 16:18-19'], 'Where could you listen more than you speak?'),
      day(7, 'Wisdom calls', ['PRO 8:1-21'], 'What step will you take this week?'),
    ],
  },
];

export function seedWorkspace() {
  store.putMany('events', events);
  rsvps.forEach(([e, u, status], i) => store.put('rsvps', { id: `rsv_${e}_${u}`, eventId: `evt_${e}` as Id<'evt'>, userId: uid(u), status, at: daysAgo(3 + (i % 5)) }));
  store.putMany('resources', resources);
  store.putMany('plans', plans);
  store.put('planProgress', { id: 'ppr_adaeze_psalms7', userId: uid('adaeze'), planId: 'pln_psalms7' as Id<'pln'>, startedAt: daysAgo(3), completedDays: [1, 2, 3], updatedAt: daysAgo(1) });
  store.put('bookmarks', { id: 'bkm_adaeze_start', userId: uid('adaeze'), resourceId: 'res_start-reading' as Id<'res'>, at: daysAgo(5) });
}
