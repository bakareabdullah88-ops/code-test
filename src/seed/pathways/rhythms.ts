import { mini } from './compact';
import type { SeedPathway } from './types';

export const rhythms: SeedPathway = {
  key: 'rhythms',
  title: 'Rhythms of a Steady Life',
  summary: 'Six simple habits that help faith take root: scripture, rest, giving, simplicity, honesty and service.',
  audience: 'People who want faith to show up in ordinary weeks',
  level: 'growing',
  coverKey: 'field',
  tags: ['habits', 'practice', 'growth'],
  modules: [
    {
      key: 'rx1', title: 'Taking in', summary: 'Scripture and rest.',
      lessons: [
        mini({ key: 'rhythm-scripture', title: 'A small, steady reading habit', summary: 'Ten minutes beats an ambition.', minutes: 7,
          body: ['Many people begin a large reading plan and stop after a week. A smaller habit lasts longer: a short passage, read slowly, at the same time each day. Ten quiet minutes is enough.', 'A simple pattern helps. Read the passage twice. Notice one thing that stands out. Ask what it says about God and what it asks of you. Write one sentence.', 'Missing a day is ordinary. Pick up again at the next passage. The goal is to keep returning, not to keep a record.'],
          refs: ['PSA 119:105-112', 'JOS 1:8'], practice: 'Choose a time and place for ten minutes of reading this week, and write it down.',
          prompt: 'When and where could ten quiet minutes realistically fit in your week?',
          tf: { q: 'A good reading habit needs a long daily session.', a: false, why: 'Short, steady reading builds a habit that lasts.' } }),
        mini({ key: 'rhythm-sabbath', title: 'Rest as a gift', summary: 'Why God built a pause into the week.', minutes: 8,
          body: ['The Bible describes a day of rest as a gift for people, and not only as a rule. Jesus said the Sabbath was made for humans, not humans for the Sabbath.', 'Rest is a way of trusting that the world keeps going without us. It is also a way of enjoying what we have, with family, a walk, a meal, or sleep.', 'Rest can look different for a student, a shift worker or a parent. The shape is flexible. The principle is a regular, protected pause.'],
          refs: ['EXO 20:8-11', 'MRK 2:23-28'], practice: 'Plan two hours this week that are free from work and screens.',
          prompt: 'What would real rest look like for you this week? What gets in the way?',
          quiz: { q: 'How does Jesus describe the Sabbath?', options: [['A gift made for people', true], ['A test of discipline', false], ['An optional old custom', false]], why: 'He said it was made for people, not people for it.' } }),
      ],
    },
    {
      key: 'rx2', title: 'Giving out', summary: 'Generosity, simplicity and honesty.',
      lessons: [
        mini({ key: 'rhythm-giving', title: 'Generosity that fits your life', summary: 'Giving time, money and attention.', minutes: 8,
          body: ['The Bible speaks about giving as a cheerful response, not an obligation to be squeezed out. Paul tells the Corinthians that each should give as they have decided, not reluctantly or under pressure.', 'Generosity is wider than money. It includes time, attention, hospitality and skills. A phone call to someone lonely is generosity. So is cooking an extra portion.', 'Start small and regular. A steady habit teaches more than a single large gesture.'],
          refs: ['2CO 9:6-8', 'ACT 20:35'], practice: 'Choose one person to help this week with something practical.',
          prompt: 'What is one thing you have that someone else could use? Time, money, a skill or a space?' }),
        mini({ key: 'rhythm-simplicity', title: 'Enough', summary: 'Contentment in a loud, buying world.', minutes: 7,
          body: ['Advertising works by making enough feel like not enough. Paul writes from a prison cell that he has learned to be content in every situation. It was a learned skill, not a personality.', 'Simplicity is not poverty. It is deciding what matters and letting go of what pulls attention away. For some people that means a month without buying anything new. For others it means a quieter phone.', 'The test is freedom. Do my things serve me, or do I serve them?'],
          refs: ['PHP 4:11-13', '1TI 6:6-10'], prompt: 'Where do you feel the pull of "more"? What would "enough" look like there?' }),
        mini({ key: 'rhythm-honesty', title: 'Honesty with a friend', summary: 'Confession as relief, not shame.', minutes: 8,
          body: ['James writes that we should confess our sins to one another and pray for each other so that we may be healed. It is a surprising instruction because most of us hide.', 'Secrets grow in the dark. Saying a hard thing aloud to a trusted person often takes away much of its power. Choose someone who is kind, discreet and able to listen without fixing.', 'It is not for everyone and not for everything. But one safe friendship where you can be truthful is worth the effort.'],
          refs: ['JAS 5:13-16', '1JN 1:5-9'], prompt: 'Who is one person you trust enough to be honest with? What stops you?',
          guidance: 'Keep names private if you prefer. Describe the kind of person instead.',
          tf: { q: 'James encourages believers to keep their struggles to themselves.', a: false, why: 'He encourages confessing to one another and praying for each other.' } }),
      ],
    },
    {
      key: 'rx3', title: 'Serving', summary: 'Using what you have for others.',
      lessons: [
        mini({ key: 'rhythm-serve', title: 'Serving where you are', summary: 'Small, ordinary acts of service.', minutes: 7,
          body: ['Jesus washed his disciples\' feet, a job nobody wanted. He said the greatest among them would be the one who served. Service is how the kingdom is lived out in plain sight.', 'You do not need a title or a programme. Look for what is needed within reach: a neighbour, a classmate, a coworker, a group. Offering help consistently is often better than offering something grand once.', 'Service also changes the server. It teaches humility, patience and attention to others.'],
          refs: ['JHN 13:3-17', 'GAL 5:13-14'], practice: 'Offer a specific piece of help to someone this week, and follow through.',
          prompt: 'What is one practical need near you that you could help meet?',
          quiz: { q: 'What did Jesus do to teach about service?', options: [['He washed his disciples\' feet', true], ['He gave a long lecture', false], ['He assigned them tasks', false]], why: 'He took the role of a servant to show what leadership looks like.' } }),
      ],
    },
  ],
};
