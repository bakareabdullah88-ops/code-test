import type { Feedback, Id, Reflection, ReflectionVisibility } from '@/types';
import { daysAgo } from '@/lib/db/ids';
import { store } from '@/lib/db/store';
import { recordFeedbackSent, recordReflectionSubmitted } from '@/lib/services/actions';
import { doc, p } from './rich';
import { ORG_A, uid } from './people';

interface RSeed {
  user: string;
  lesson?: string;
  daysAgo: number;
  visibility: ReflectionVisibility;
  paras: string[];
  status?: 'draft' | 'submitted';
  group?: string;
  feedback?: { mentor: string; daysAgo: number; paras: string[]; shareable?: boolean };
  title?: string;
}

const plain = (paras: string[]) => paras.join('\n\n');

export function reflection(r: RSeed): Reflection {
  const lesson = r.lesson ? store.get('lessons', `les_${r.lesson}` as Id<'les'>) : undefined;
  const prompt = lesson?.blocks.find((b) => b.type === 'reflectionPrompt');
  const at = r.daysAgo === 0 ? new Date(Date.now() - 2 * 3_600_000).toISOString() : daysAgo(r.daysAgo, 17);
  const status = r.status ?? 'submitted';
  const plainText = plain(r.paras);
  const rec: Reflection = {
    id: `ref_${r.user}_${r.lesson ?? 'free'}_${r.daysAgo}` as Id<'ref'>, authorId: uid(r.user), orgId: r.user === 'priya' ? null : ORG_A, lessonId: lesson?.id ?? null, pathwayId: lesson?.pathwayId ?? null,
    promptId: prompt && prompt.type === 'reflectionPrompt' ? prompt.promptId : null, promptText: prompt && prompt.type === 'reflectionPrompt' ? prompt.prompt : null,
    title: r.title ?? null, body: doc(...r.paras.map((t) => p(t))), plainText, wordCount: plainText.split(/\s+/).length, scriptureRefs: [], visibility: r.visibility,
    groupId: r.group ? (`grp_${r.group}` as Id<'grp'>) : null, status, submittedAt: status === 'submitted' ? at : null,
    feedbackStatus: status === 'submitted' && (r.visibility === 'mentor' || r.visibility === 'group') ? (r.feedback ? 'responded' : 'awaiting') : 'none',
    feedbackCount: r.feedback ? 1 : 0, version: 1, createdAt: at, updatedAt: at,
  };
  store.put('reflections', rec);
  if (status === 'submitted') recordReflectionSubmitted(rec, at);
  if (r.feedback) {
    const fat = daysAgo(r.feedback.daysAgo, 19);
    const fb: Feedback = {
      id: `fbk_${rec.id.slice(4)}` as Id<'fbk'>, reflectionId: rec.id, mentorId: uid(r.feedback.mentor), body: doc(...r.feedback.paras.map((t) => p(t))), plainText: plain(r.feedback.paras),
      shareableToGroup: !!r.feedback.shareable, aiAssisted: false, status: 'sent', sentAt: fat, readAt: r.feedback.daysAgo > 3 ? fat : null, createdAt: fat, updatedAt: fat,
    };
    store.put('feedback', fb);
    recordFeedbackSent(fb, rec, fat);
  }
  return rec;
}

export function seedReflections() {
  // Adaeze: the demo spine. One answered, one waiting, one private, one draft.
  reflection({ user: 'adaeze', lesson: 'welcome', daysAgo: 19, visibility: 'mentor',
    paras: ['I came because my friend at service kept inviting me and I ran out of excuses. Honestly, I am not sure what I believe. I grew up going to church on Christmas and Easter only.', 'I hope I can ask questions here without people thinking I am wasting their time. I also hope this stops feeling like a performance.'],
    feedback: { mentor: 'grace', daysAgo: 18, paras: ['Adaeze, thank you for writing so honestly. Asking questions is never a waste of anyone’s time. It is exactly what these lessons are for, and I would be glad to take any of them with you.', 'You named two hopes: to ask freely, and to stop performing. Hold on to both. This week, if you like, read Mark 1 slowly and bring me one question.'] } });
  reflection({ user: 'adaeze', lesson: 'god', daysAgo: 4, visibility: 'mentor',
    paras: ['The part about being known and not rejected hit me. At work I keep a lot of myself hidden because I am afraid people will think I am too much.', 'If God already knows me and still wants me close, I do not know what to do with that. It sounds nice but I find it hard to believe. How would I even know it is true? I would like to understand this better.'] });
  reflection({ user: 'adaeze', daysAgo: 2, visibility: 'private', title: 'Bus ride',
    paras: ['Rough day. The generator went off twice and I could not finish my report. I prayed for the first time on the bus, not out loud. Just "help". I am not sure it counted.'] });
  reflection({ user: 'adaeze', lesson: 'grace', daysAgo: 0, visibility: 'mentor', status: 'draft',
    paras: ['I keep thinking about the word earn. I have been trying to earn things my whole life: marks, praise, a place at the table.'] });

  // Tomás: steady, reflective, mostly answered.
  reflection({ user: 'tomas', lesson: 'welcome', daysAgo: 33, visibility: 'mentor', paras: ['I have gone to church all my life but I have rarely asked myself why. I hope this slows me down. I read quickly and forget quickly.'],
    feedback: { mentor: 'grace', daysAgo: 32, paras: ['Tomás, slowing down is a good aim. Try reading each passage twice: once for the sweep and once for a single phrase that catches you.'] } });
  reflection({ user: 'tomas', lesson: 'god', daysAgo: 27, visibility: 'mentor', paras: ['The idea that I was made on purpose is not new to me, but I had not connected it to how I treat my own mistakes. I treat them as proof that I am not worth much.'],
    feedback: { mentor: 'grace', daysAgo: 26, paras: ['That connection is worth staying with. If we are made on purpose, our mistakes are real but they are not our identity. What would it look like to treat yours the way a kind friend would?'] } });
  reflection({ user: 'tomas', lesson: 'grace', daysAgo: 18, visibility: 'group', group: 'thursday', paras: ['I read Ephesians 2 four times. "Not of yourselves" stopped me. I have been quietly proud of how hard I work at being a good Christian, and I think that is the opposite of this.', 'I would like to learn to receive instead.'],
    feedback: { mentor: 'grace', daysAgo: 17, shareable: true, paras: ['What an honest thing to notice. Many of us carry that same quiet pride. Receiving is a skill, and you can practise it in small ways, such as saying thank you without explaining or repaying.'] } });
  reflection({ user: 'tomas', lesson: 'jesus', daysAgo: 11, visibility: 'mentor', paras: ['I chose Mark 2 because I like how Jesus eats with people others avoid. It makes me wonder who I avoid at church.'],
    feedback: { mentor: 'grace', daysAgo: 10, paras: ['Ask that question again this Sunday and see who comes to mind. No need for guilt, only attention.'] } });
  reflection({ user: 'tomas', lesson: 'faith', daysAgo: 1, visibility: 'mentor', paras: ['My small step of trust: I will call my brother, whom I have not spoken to since the funeral. I do not know what I will say.'] });

  // Fatima
  reflection({ user: 'fatima', lesson: 'welcome', daysAgo: 26, visibility: 'mentor', paras: ['I am a pharmacist and I like evidence, so I am cautious. But I am curious.'],
    feedback: { mentor: 'grace', daysAgo: 25, paras: ['Curiosity and caution are good companions. Keep asking for reasons; the Scriptures can take hard questions.'] } });
  reflection({ user: 'fatima', lesson: 'god', daysAgo: 12, visibility: 'mentor', paras: ['Psalm 139 is almost uncomfortable. To be known that fully. But I also find it steadying.'],
    feedback: { mentor: 'grace', daysAgo: 11, paras: ['Uncomfortable and steadying can both be true. I would love to hear what makes it steadying for you.'] } });

  // Olumide
  reflection({ user: 'olumide', lesson: 'welcome', daysAgo: 18, visibility: 'mentor', paras: ['I have been going through a busy season at work. I hope to carve out a little time for this each week.'],
    feedback: { mentor: 'grace', daysAgo: 16, paras: ['Little and regular beats long and rare. Ten minutes on Sunday evening could be a good anchor.'] } });

  // Ngozi (mentor Daniel): one old answered, one waiting six days.
  reflection({ user: 'ngozi', lesson: 'grace', daysAgo: 22, visibility: 'mentor', paras: ['As a teacher I spend my days grading. It is strange to hear that love is not graded.'],
    feedback: { mentor: 'daniel', daysAgo: 21, paras: ['Ngozi, that is a lovely observation from your own world. Who in your classroom could you show that kind of grace to this week?'] } });
  reflection({ user: 'ngozi', lesson: 'faith', daysAgo: 6, visibility: 'mentor', paras: ['The line about doubt made me cry a little. I have been afraid to tell anyone that some mornings I feel nothing when I pray.'] });

  // Jin-woo (quiet), Mateus
  reflection({ user: 'jinwoo', lesson: 'welcome', daysAgo: 30, visibility: 'mentor', paras: ['I am far from home and I am looking for a place to belong.'],
    feedback: { mentor: 'daniel', daysAgo: 29, paras: ['Jin-woo, thank you for being honest about that. I would be glad to meet for tea after the Thursday group.'] } });
  reflection({ user: 'mateus', lesson: 'god', daysAgo: 20, visibility: 'mentor', paras: ['As a developer I like systems and I wondered if God is like a designer. But Psalm 139 is more personal than that.'],
    feedback: { mentor: 'daniel', daysAgo: 19, paras: ['Good instinct to notice the personal tone. Design and love are both in the picture, and the second shapes how we read the first.'] } });
  reflection({ user: 'mateus', lesson: 'jesus', daysAgo: 8, visibility: 'mentor', paras: ['I read John 1 aloud twice. The phrase "the light shines in the darkness" has stayed with me all week.'],
    feedback: { mentor: 'daniel', daysAgo: 7, paras: ['Beautiful. Carry it into one dark place this week and see what changes.'] } });

  // Salma (Sunday Seekers, shared with group)
  reflection({ user: 'salma', lesson: 'mark-1', daysAgo: 5, visibility: 'group', group: 'sunday', paras: ['The word "immediately" is everywhere in Mark. It makes me feel how urgent the invitation is.'],
    feedback: { mentor: 'esperance', daysAgo: 4, paras: ['It does move fast. What would change if you treated an invitation like that as something to say yes to today?'] } });

  // Priya (personal space; private only)
  reflection({ user: 'priya', lesson: 'welcome', daysAgo: 14, visibility: 'private', paras: ['I am trying this on my own for now. I am not ready to talk to anyone at a church.'] });
  reflection({ user: 'priya', lesson: 'god', daysAgo: 5, visibility: 'private', paras: ['Genesis 1 reads like poetry. I did not expect that.'] });
}
