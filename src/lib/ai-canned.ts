import type { BibleRange } from '@/types';
import { range } from '@/seed/rich';

/**
 * Canned replies for the demo companion. They are authored, not generated, and the UI says so.
 * Topics are matched by keyword; each answer cites passages from the bundled World English Bible.
 */
interface Topic { keys: string[]; title: string; paragraphs: string[]; refs: string[]; followUp: string }

const topics: Topic[] = [
  { keys: ['grace', 'earn', 'deserve', 'worthy'], title: 'Grace', paragraphs: ['Grace means receiving something good that you did not earn. In Ephesians 2, Paul says salvation is a gift, so that no one can boast. It does not depend on how well you perform.', 'People often hear this and relax a little, and then worry it is too easy. The same letter goes on to say we were made for good works. The works come after the gift, as a response, not before it as payment.'], refs: ['EPH 2:8-9', 'ROM 5:8', 'TIT 3:4-5'], followUp: 'Where in your week are you trying to earn something that was meant as a gift?' },
  { keys: ['doubt', 'faith', 'believe', 'unbelief', 'sure'], title: 'Faith and doubt', paragraphs: ['Faith in the Bible is trust more than certainty. Doubt is not treated as the opposite of faith. In Mark 9 a father says, "I believe. Help my unbelief," and Jesus helps him.', 'A practical step is to name the question you are actually asking. "Is God real?" and "Does God care about me?" are different questions, and they are usually answered in different ways.'], refs: ['MRK 9:23-24', 'HEB 11:1', 'PSA 13:1-6'], followUp: 'What is the question under your doubt, in one sentence?' },
  { keys: ['pray', 'prayer', 'praying'], title: 'Praying', paragraphs: ['Prayer is talking with God and listening. The psalms show that honest prayer can be blunt: complaints, fears and thanks, all in the same breath.', 'Jesus gave a short pattern in Matthew 6. It starts with who God is, then asks for daily needs, forgiveness and protection. Many people find it easier to pray one line at a time and fill each in with their own situation.'], refs: ['MAT 6:9-13', 'PHP 4:6-7', 'PSA 13:1-6'], followUp: 'Would it help to try the four-part rhythm today: thanks, what is on your mind, what you need, a minute of quiet?' },
  { keys: ['forgive', 'forgiveness', 'bitter', 'resent'], title: 'Forgiveness', paragraphs: ['Forgiveness is releasing someone from a debt they cannot pay. It does not mean pretending the harm did not happen, and it does not always mean trusting the person again.', 'Jesus links being forgiven with forgiving. Many people find it is a process rather than a single decision, and that it is worth sharing with a mentor or friend instead of carrying alone.'], refs: ['COL 3:13', 'MAT 6:14-15', 'EPH 4:31-32'], followUp: 'Is there a specific person or memory you are thinking about?' },
  { keys: ['suffer', 'pain', 'hurt', 'grief', 'loss', 'lonely', 'sad', 'afraid', 'anxious', 'anxiety', 'worry'], title: 'Hard seasons', paragraphs: ['I am sorry you are carrying this. The Bible does not hurry past pain. The psalms of lament give words to grief, fear and loneliness, and they are included in Scripture on purpose.', 'An AI cannot sit with you the way a person can. If this feels heavy, please consider telling your mentor or someone you trust. If you are in danger or may hurt yourself, contact local emergency services right now.'], refs: ['PSA 34:18', 'PSA 23:4', '1PE 5:7'], followUp: 'Would you like to bring this to your mentor? I can help you write a few lines to share.' },
  { keys: ['read', 'bible', 'scripture', 'study', 'where do i start', 'begin'], title: 'Reading the Bible', paragraphs: ['A good way to start is with one Gospel, such as Mark, read a paragraph at a time. Ask three questions: What does this say? What does it show me about God? What is one thing I can do today?', 'It also helps to read with someone else. A friend or mentor asks questions you would not think to ask yourself.'], refs: ['2TI 3:16-17', 'PSA 119:105', 'LUK 24:27'], followUp: 'Would you like a short reading plan for the Gospel of Mark?' },
  { keys: ['jesus', 'christ', 'who is'], title: 'Who Jesus is', paragraphs: ['The four Gospels present Jesus as God come close: teacher, healer and servant. John begins by saying the Word became flesh and lived among us.', 'A simple approach is to read one story slowly and notice how he treats the people he meets.'], refs: ['JHN 1:1-5', 'JHN 1:14', 'MRK 10:45'], followUp: 'Which story about Jesus would you like to explore first?' },
  { keys: ['church', 'community', 'friends', 'belong', 'group'], title: 'Belonging', paragraphs: ['The earliest believers shared meals, prayer and teaching. Faith was not meant to be practised alone.', 'If church feels hard, start small: one person, one group, one regular conversation. Many people find that a small group feels safer than a large gathering.'], refs: ['ACT 2:42-47', 'HEB 10:24-25'], followUp: 'What would make a first step toward a group feel safer for you?' },
];

const fallback: Topic = { keys: [], title: 'Study help', paragraphs: ['I may not have a good answer to that one. I am a study companion with a small set of prepared answers, so it is best to treat what I say as a starting point.', 'You could try asking about grace, faith and doubt, prayer, forgiveness, reading the Bible, or who Jesus is. Or bring the question to your mentor.'], refs: ['PSA 119:105'], followUp: 'Which of those would you like to start with?' };

const crisis = ['suicide', 'kill myself', 'end my life', 'hurt myself', 'self-harm', 'self harm', 'abuse', 'abused', 'being hit'];

export interface CannedReply { content: string; citations: BibleRange[]; safety: 'ok' | 'handoff'; title: string }

export function respond(question: string, context?: { lessonTitle?: string; passage?: string }): CannedReply {
  const q = question.toLowerCase();
  if (crisis.some((k) => q.includes(k))) {
    return {
      title: 'Please talk to a person',
      safety: 'handoff',
      citations: [],
      content: 'What you wrote sounds serious, and I do not want to answer it from a script. Please tell someone you trust right now: your mentor, a pastor, or a friend. If you are in danger or thinking of harming yourself, contact your local emergency number or a crisis line in your country immediately. You do not have to carry this alone.',
    };
  }
  const topic = topics.find((t) => t.keys.some((k) => q.includes(k))) ?? fallback;
  const lead = context?.lessonTitle ? `You are reading "${context.lessonTitle}"${context.passage ? ` (${context.passage})` : ''}, so I will keep that in view. ` : '';
  return {
    title: topic.title,
    safety: 'ok',
    citations: topic.refs.map(range),
    content: [lead + topic.paragraphs[0], ...topic.paragraphs.slice(1), topic.followUp].join('\n\n'),
  };
}

/** A starting draft for a mentor to edit. It is never sent by itself. */
export function draftFeedback(name: string, text: string): string {
  const t = text.toLowerCase();
  const theme = ['earn', 'proud', 'perform', 'worth'].some((k) => t.includes(k)) ? 'the pressure to earn approval' : ['doubt', 'unsure', 'hard to believe', 'afraid'].some((k) => t.includes(k)) ? 'the honesty about doubt' : ['grateful', 'thank', 'joy'].some((k) => t.includes(k)) ? 'the gratitude' : 'what you chose to write about';
  return `${name}, thank you for sharing this. I noticed ${theme}, and I want you to know that is a good thing to bring here.\n\nOne question to take with you this week: what is one small thing you could do in response?\n\nI will be praying for you.`;
}
