import { mini } from './compact';
import type { SeedPathway } from './types';

export const sermon: SeedPathway = {
  key: 'sermon',
  title: 'The Sermon on the Mount',
  summary: 'Six lessons in the most famous teaching of Jesus: blessing, light, honesty, trust and a life built on solid ground.',
  audience: 'Anyone curious what Jesus actually taught',
  level: 'new_to_faith',
  coverKey: 'mountain',
  tags: ['jesus', 'matthew', 'teaching'],
  modules: [
    {
      key: 'sx1', title: 'A different kind of blessing', summary: 'Who Jesus says is fortunate, and what that makes them.',
      lessons: [
        mini({ key: 'sermon-blessed', title: 'Blessed are the poor in spirit', summary: 'The Beatitudes turn expectations upside down.', minutes: 9,
          body: ['Jesus opens the sermon by calling the wrong people blessed: those who are poor in spirit, who mourn, who are meek, who hunger for what is right. Nobody in the crowd would have picked them as the lucky ones.', 'The word often translated "blessed" means something like "deeply well-off". Jesus is saying that the kingdom of heaven belongs to people who know they need it. They are not asked to be impressive first.', 'Each blessing comes with a promise: comfort, inheritance, mercy, sight. The kingdom works by receiving, not by earning.'],
          refs: ['MAT 5:1-12'], prompt: 'Which of the Beatitudes feels closest to where you are today? Which feels furthest away?',
          quiz: { q: 'Whom does Jesus call blessed in the Beatitudes?', options: [['People who know their need and long for what is right', true], ['The most successful and powerful', false], ['Only people who never doubt', false]], why: 'The kingdom is given to the poor in spirit, not earned by the confident.' } }),
        mini({ key: 'sermon-light', title: 'Salt and light', summary: 'A visible life that makes ordinary things better.', minutes: 7,
          body: ['After the blessings Jesus says "You are the salt of the earth" and "You are the light of the world". These are statements of identity, not commands. Salt preserves and adds flavour. Light shows the way.', 'Neither works by announcing itself. Salt disappears into food. Light helps people see other things. The aim is that others notice good work and give glory to the Father, not that we look impressive.', 'The warning is simple: salt that loses its flavour and a lamp hidden under a bowl have stopped doing their job.'],
          refs: ['MAT 5:13-16'], practice: 'Do one small, unannounced good thing for someone today.',
          prompt: 'Where could you be salt or light in the place you spend most of your week?',
          tf: { q: 'Jesus says people should do good works so that they are praised.', a: false, why: 'He says the goal is that others glorify the Father in heaven.' } }),
      ],
    },
    {
      key: 'sx2', title: 'The heart behind the action', summary: 'Anger, promises and secret generosity.',
      lessons: [
        mini({ key: 'sermon-anger', title: 'Anger and making peace', summary: 'Why relationships come before offerings.', minutes: 8,
          body: ['Jesus takes the old command against murder and looks at what leads to it: contempt and unchecked anger. He is not describing a rule to be dodged but a heart to be tended.', 'His practical example is striking. If you are about to bring a gift to the altar and remember that someone has something against you, leave the gift, go and be reconciled first. Worship and relationships are not separate.', 'Reconciliation is hard and often uncomfortable. The instruction is to move early, before things harden.'],
          refs: ['MAT 5:21-26'], prompt: 'Is there someone you need to make peace with? What is one small step you could take?',
          guidance: 'You do not have to name them. Describe the situation if that helps.',
          quiz: { q: 'What does Jesus say to do if you remember someone has something against you?', options: [['Go and be reconciled, then come back to worship', true], ['Ignore it until it passes', false], ['Wait for them to apologise', false]], why: 'He puts reconciliation ahead of the offering.' } }),
        mini({ key: 'sermon-secret', title: 'Giving, praying and fasting in secret', summary: 'Practising faith for an audience of One.', minutes: 8,
          body: ['Three times Jesus warns about doing good things to be seen: giving, praying and fasting. The danger is not the practice but the audience. Applause becomes the only reward.', 'He suggests a quiet alternative. Give so quietly that your left hand does not know what your right is doing. Pray in a private room. Fast without announcing it. The Father who sees in secret is the audience that matters.', 'The Lord\'s Prayer sits in the middle of this section as a model of short, direct, unperformed prayer.'],
          refs: ['MAT 6:1-18'], practice: 'Do one generous or prayerful thing today that nobody will ever know about.',
          prompt: 'When have you done something good mainly to be noticed? What would doing it quietly change?' }),
      ],
    },
    {
      key: 'sx3', title: 'Trust and foundations', summary: 'Worry, judging and building to last.',
      lessons: [
        mini({ key: 'sermon-worry', title: 'Do not be anxious', summary: 'Birds, flowers and the next small step.', minutes: 8,
          body: ['Jesus points at birds and wildflowers and asks his listeners to look at them. They are cared for without anxious planning. If God looks after them, how much more will he care for people?', 'He does not say planning is wrong or that needs are unimportant. He says worry cannot add a single hour to a life, and that seeking God\'s kingdom first puts other things in their place.', 'The closing line is practical: tomorrow will worry about itself. Take today\'s trouble as enough for today.'],
          refs: ['MAT 6:25-34'], memory: 'MAT 6:33-34',
          prompt: 'What is weighing on you most? Write it, then underline the part that is actually yours to do today.',
          tf: { q: 'Jesus teaches that planning ahead is always wrong.', a: false, why: 'He teaches against anxious worry, not against responsible preparation.' } }),
        mini({ key: 'sermon-rock', title: 'Built on the rock', summary: 'Hearing and doing as a foundation.', minutes: 7,
          body: ['The sermon ends with two builders. One builds on rock, the other on sand. When the storm arrives, both houses face the same weather. Only one is still standing.', 'The difference is not who heard the teaching. Both did. The difference is who acted on it. Small, repeated obedience is like laying stones where nobody sees them.', 'It is an encouraging picture: a solid life is built one ordinary decision at a time.'],
          refs: ['MAT 7:24-29'], prompt: 'What is one thing from this pathway you could put into practice this week?',
          quiz: { q: 'What separates the two builders?', options: [['One acts on the words and the other does not', true], ['One heard the teaching and the other did not', false], ['One had better materials', false]], why: 'Both heard. Only one put it into practice.' } }),
      ],
    },
  ],
};
