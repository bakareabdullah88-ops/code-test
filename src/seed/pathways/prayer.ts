import { mini } from './compact';
import type { SeedPathway } from './types';

export const prayer: SeedPathway = {
  key: 'prayer',
  title: 'Learning to Pray',
  summary: 'Six lessons on talking with God: honest words, a simple pattern, listening, and praying with others.',
  audience: 'Anyone who wants to pray more',
  level: 'growing',
  coverKey: 'lamp',
  tags: ['prayer', 'practice'],
  modules: [
    {
      key: 'pm1', title: 'Beginning to pray', summary: 'Simple, honest, daily.',
      lessons: [
        mini({ key: 'pray-honest', title: 'Say it plainly', summary: 'Honest prayer needs no special language.', minutes: 7,
          body: ['The psalms are full of blunt prayers: complaints, fears and shouts for help. They show that God is not shocked by honesty. If you are angry, say so. If you are numb, say that. A prayer does not have to sound holy to be heard.', 'Many people wait until they feel ready to pray. The psalmists did the opposite. They prayed their way from where they were toward where they hoped to be, often within a single psalm.'],
          refs: ['PSA 13:1-6'], practice: 'Write a three-line prayer today: what you are feeling, what you are asking, and one thing you are thankful for.',
          prompt: 'What have you been afraid to say to God? Write it here as plainly as you can.', quiz: { q: 'What does Psalm 13 show about honest prayer?', options: [['You can bring complaints and move toward trust', true], ['Only polished prayers are heard', false], ['Prayer is only for good days', false]], why: 'The psalm begins with "How long?" and ends in trust.' } }),
        mini({ key: 'pray-pattern', title: 'A pattern to follow', summary: 'The Lord’s Prayer as a map, line by line.', minutes: 9,
          body: ['When the first followers asked Jesus how to pray, he gave them a few lines that fit in one breath. They start with God (who he is, and what he wants), move to our daily needs, then forgiveness, then protection.', 'Praying the pattern slowly, one line at a time, adds a lot. Pause after each line and fill it in with your own life: whose forgiveness do you need to receive or give today? What does daily bread look like this week?'],
          refs: ['MAT 6:9-13'], memory: 'MAT 6:9-13', prompt: 'Choose one line of the prayer and say what it means for your week.', tf: { q: 'Jesus gave a pattern for prayer rather than a script.', a: true, why: 'He taught it as a model for how to pray.' } }),
        mini({ key: 'pray-listen', title: 'Listening', summary: 'Quiet as a way of praying.', minutes: 8,
          body: ['Prayer is a conversation, which means some of it is quiet. Silence can feel awkward at first. Start with one minute. Sit still, breathe slowly and repeat a short phrase, such as "Be still, and know that I am God".', 'Distractions will come. Treat them like clouds crossing the sky and return to the phrase. Over time, quiet becomes less like an empty room and more like shared company.'],
          refs: ['PSA 46:10', '1KI 19:11-13'], practice: 'Set a timer for one minute and sit in quiet. Notice what you notice.', prompt: 'What did you notice during a minute of quiet?' }),
      ],
    },
    {
      key: 'pm2', title: 'Praying with others', summary: 'Intercession and shared prayer.',
      lessons: [
        mini({ key: 'pray-for-others', title: 'Praying for others', summary: 'Carrying people to God by name.', minutes: 8,
          body: ['Praying for someone is an act of love you can do from anywhere. Keep a short list. Pray by name and be specific, asking for what they need rather than what you think they should do.', 'It also changes the person praying. Praying for people you find difficult softens something in you.'],
          refs: ['PHP 1:3-6', '1TI 2:1-2'], prompt: 'Who are three people you will pray for this week?', guidance: 'You may share this reflection with your mentor.' }),
        mini({ key: 'pray-together', title: 'Praying together', summary: 'Shared prayer in a group.', minutes: 8,
          body: ['Praying aloud with others can feel awkward. A few simple habits help: keep prayers short, pray for one thing at a time, and let silence be okay. No one has to pray aloud; amen is a full contribution.', 'The first Christians prayed constantly together, and the Bible describes it as ordinary rather than special.'],
          refs: ['ACT 1:12-14', 'MAT 18:19-20'], prompt: 'What would help you feel comfortable praying with others?', tf: { q: 'Everyone in a prayer group has to pray aloud.', a: false, why: 'Saying amen counts, and silence is fine.' } }),
        mini({ key: 'pray-answers', title: 'When answers are slow', summary: 'Waiting, trust and honest questions.', minutes: 9,
          body: ['Sometimes prayers seem unanswered, or answered differently from what we hoped. The Bible does not hide this. It includes Job, the psalms of lament and Jesus praying in Gethsemane: "Not what I desire, but what you desire."', 'It is fine to keep asking, to wonder aloud, and to bring the disappointment itself to God. Prayer is relationship, not a vending machine.'],
          refs: ['LUK 18:1-8', 'MAT 26:39'], prompt: 'Is there a prayer you have stopped praying? What would you say to God about it?' }),
      ],
    },
  ],
};
