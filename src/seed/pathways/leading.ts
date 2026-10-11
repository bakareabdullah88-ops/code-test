import { mini } from './compact';
import type { SeedPathway } from './types';

export const leading: SeedPathway = {
  key: 'leading',
  title: 'Leading a Small Group',
  summary: 'Five practical lessons for people who lead a Bible study, cell group or fellowship: welcome, questions, listening, hard moments and care.',
  audience: 'Group leaders and co-leaders',
  level: 'leading',
  coverKey: 'table',
  tags: ['leadership', 'groups'],
  modules: [
    {
      key: 'lm1', title: 'Leading with care', summary: 'The heart and habits of a good facilitator.',
      lessons: [
        mini({ key: 'lead-welcome', title: 'Create a welcome', summary: 'People decide in minutes whether they belong.', minutes: 9,
          body: ['The first five minutes of a meeting decide how the next hour goes. Greet people by name, offer something to eat or drink, and introduce new people to one or two others. Small hospitality tells people they were expected.', 'Welcome is also a posture: curiosity about people rather than a plan for them.'],
          refs: ['ROM 15:7'], prompt: 'What does a welcome look like in your group? What could be better?', quiz: { q: 'According to Romans 15:7, how should we treat one another?', options: [['Welcome one another as Christ welcomed us', true], ['Wait for people to prove themselves', false], ['Keep to ourselves', false]], why: 'Paul grounds welcome in Christ’s own welcome.' } }),
        mini({ key: 'lead-questions', title: 'Ask better questions', summary: 'Open questions that invite honest answers.', minutes: 10,
          body: ['A closed question has one correct answer. An open question invites someone to think and speak. Instead of "What is the main point?" try "What stood out to you?" Then wait, longer than is comfortable.', 'Follow up with "What makes you say that?" and "Does anyone see it differently?" These show that all answers are welcome.'],
          refs: ['LUK 10:25-37'], practice: 'Write three open questions for your next meeting.', prompt: 'Write two open questions for the passage you will use next.' }),
        mini({ key: 'lead-listen', title: 'Listen first', summary: 'Hold the room so others can speak.', minutes: 8,
          body: ['Good leaders talk less than they think they should. Make space for quieter voices by asking them gently, and thank people who risk a hard answer. If one person tends to dominate, say, "Let’s hear from someone who hasn’t spoken yet."', 'Listening is a form of love, and it makes groups safe enough for honesty.'],
          refs: ['JAS 1:19-20'], prompt: 'Who in your group speaks least? How could you make it easier for them to join in?' }),
      ],
    },
    {
      key: 'lm2', title: 'Hard moments', summary: 'Conflict, grief and boundaries.',
      lessons: [
        mini({ key: 'lead-conflict', title: 'When it gets tense', summary: 'Disagreement, strong opinions and repair.', minutes: 10,
          body: ['Disagreement is normal. The goal is not to avoid it but to hold it kindly. Acknowledge what you heard, name what you share, and return to the passage. If a conversation gets heated, offer to continue it privately.', 'Jesus tells us to go to a person directly, not to talk about them to others. Gossip does more damage than disagreement.'],
          refs: ['MAT 18:15-17', 'EPH 4:29'], prompt: 'Think of a tense moment you have seen in a group. What would a gentler response have been?' }),
        mini({ key: 'lead-care', title: 'Care without carrying it all', summary: 'Pastoral care, referral and your own limits.', minutes: 10,
          body: ['Group leaders often hear painful things. Listen and pray, but be honest about the limits of your role. For serious matters such as abuse, self-harm or crisis, involve your pastor or a trained professional promptly.', 'Caring for others includes caring for yourself. A tired leader cannot give what they do not have. Share the load with a co-leader and a mentor.'],
          refs: ['GAL 6:2', 'GAL 6:5'], prompt: 'Who looks after you? Who could share the load of leading?' }),
      ],
    },
  ],
};
