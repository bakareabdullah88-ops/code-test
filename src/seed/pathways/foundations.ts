import { audio, callout, h3, makeQuiz, memory, multi, p, quizBlock, quote, reflect, scripture, single, text, trueFalse, ul, video } from '../rich';
import type { SeedPathway } from './types';

// "Foundations of Faith": eight short lessons for people who are new to faith or returning to it.

const l1 = [
  p('This is not a course you pass or fail. It is a path you walk at your own pace, and you will not be walking it alone. Each lesson takes about ten minutes. You read, you listen if you like, and then you write a few honest lines about what stayed with you.'),
  p('Those few lines matter more than they seem. Faith is not only something we know about; it is something we practise noticing. Writing slows us down enough to see what we actually think, what we doubt, and what we are hoping for.'),
  h3('How the journey works'),
  ul('A short lesson with Scripture from the World English Bible.', 'A reflection prompt. Write as little or as much as you like.', 'If you want, you can share your reflection with a mentor, who may write back.', 'Everything is private until you choose to share it.'),
  p('There are no streaks here and no scores. If you set this down for a week, the next lesson will simply be waiting when you return.'),
];
const l1audio = [p('This is not a course you pass or fail. It is a path you walk at your own pace, and you will not be walking it alone. Each lesson takes about ten minutes. You read, you listen if you like, and then you write a few honest lines about what stayed with you.')];

const l2 = [
  p('Almost every culture has asked where everything came from. The Bible answers in its first sentence, and it answers simply: God. Not a force or an idea, but someone who makes things on purpose and calls them good.'),
  p('That matters for how we think about our own lives. If the world was made with intention, then so were we. Our worth is not something we have to earn by being useful or impressive. It is given before we do anything at all.'),
  h3('A God who is close'),
  p('The Scriptures also say something surprising about distance. The same God who made the stars is described as knowing us from the inside: when we sit, when we stand, what we are about to say before we say it. For some people that sounds comforting. For others it feels exposing. Both reactions are honest, and both are welcome in this journey.'),
  p('You do not need to settle every question about God this week. Start with one: if you were sure that you were known and not rejected, how would that change the way you spend tomorrow?'),
];
const l2audio = [p('Almost every culture has asked where everything came from. The Bible answers in its first sentence, and it answers simply: God. Not a force or an idea, but someone who makes things on purpose and calls them good.')];

const l3 = [
  p('Grace is one of the most used and least understood words in faith. Put plainly, grace is a gift you do not earn and could not pay for. It is love given before you have done anything to deserve it.'),
  p('Most of us live as though love has to be earned. We work to be liked, to be useful, to be good enough. The message of grace turns that around. God does not wait for us to improve before loving us. The love comes first, and the change in us grows from it.'),
  h3('What grace is not'),
  ul('It is not permission to stop caring how we live. Gifts received with gratitude change people.', 'It is not a reward for those who got it right.', 'It is not fragile. It does not run out when we fail again.'),
  p('Notice the order in the passage below: saved, through faith, as a gift, so that no one can boast. If you are tired from trying to be enough, this is an invitation to rest, and then to begin again from a different place.'),
];

const l4 = [
  p('Christians do not only say that God is far above us. They say that God came close. The Gospel of John puts it in one sentence: the Word became flesh and lived among us. In Jesus, God is not an idea to agree with but a person to meet.'),
  p('That is why the four Gospels spend so much time on how Jesus lived: who he ate with, who he touched, how he spoke to people others ignored. His teaching and his life tell the same story. Power that serves instead of grabbing. Truth that is gentle without being weak.'),
  h3('Three things to notice as you read'),
  ul('Jesus pays attention to individuals, one at a time.', 'He tells the truth and he stays with people while they hear it.', 'He gives his life rather than taking others’ lives.'),
  p('You do not need to understand everything about Jesus before you begin. Many people started by simply reading one Gospel slowly and asking: what is he like?'),
];
const l4audio = [p('Christians do not only say that God is far above us. They say that God came close. The Gospel of John puts it in one sentence: the Word became flesh and lived among us.')];

const l5 = [
  p('Faith is often described as believing hard things without proof. The Bible describes it differently: faith is trust. It is what you do when you sit in a chair without checking each leg. You have good reasons, and you also lean your weight on them.'),
  p('Trust grows by use. A small step of faith might be praying one honest sentence, forgiving someone a little, or telling the truth when it costs you. These steps do not need to be dramatic. They only need to be real.'),
  h3('Doubt and faith can share a room'),
  p('One father in the Gospel of Mark says something many of us could say: “I believe. Help my unbelief.” Jesus does not turn him away. Honest doubt is not the opposite of faith. Pretending is. You are allowed to bring your questions with you.'),
  callout('practice', p('This week, name one small thing you will do because you trust God with it. Keep it small enough that you will actually do it.')),
];
const l5audio = [p('Faith is often described as believing hard things without proof. The Bible describes it differently: faith is trust. It is what you do when you sit in a chair without checking each leg.')];

const l6 = [
  p('Prayer is talking with God, and listening. You do not need special words. Many of the prayers in the Bible are short, blunt and honest: “Help.” “Thank you.” “Why?” “I am sorry.”'),
  p('When the first followers asked Jesus how to pray, he gave them a pattern rather than a script. It begins with who God is, moves to what we need today, asks for forgiveness and help, and ends by trusting God with the future. It is short enough to learn by heart.'),
  h3('A simple rhythm to try'),
  ul('Begin by saying thanks for one specific thing.', 'Say what is on your mind, without tidying it up.', 'Ask for what you need, for yourself and someone else.', 'Be quiet for a minute. You do not have to feel anything.'),
  p('If your mind wanders, that is normal. Come back gently. The goal is not a perfect prayer. It is keeping company with God a little each day.'),
];
const l6audio = [p('Prayer is talking with God, and listening. You do not need special words. Many of the prayers in the Bible are short, blunt and honest: help, thank you, why, I am sorry.')];

const l7 = [
  p('The Bible is not one book but a library of sixty-six: history, poetry, letters, laws, stories and visions, written over many centuries. Christians read it as the main way God speaks and as the place to test everything else we hear.'),
  p('Reading it well is a skill, and like most skills it is learned by doing a little, often. Start with a Gospel. Read a paragraph, not a chapter. Ask three questions: What does this say? What does it show me about God? What is one thing I can do about it today?'),
  h3('Reading with others'),
  p('Scripture was meant to be read in community. When we read alone we bring our own assumptions without noticing them. A friend or a mentor asks the question we would never have thought to ask. That is one reason this journey includes space to share reflections.'),
  callout('note', p('The Bible reader in this app keeps your highlights and notes private. You can turn any note into a reflection when you are ready.')),
];

const l8 = [
  p('The earliest believers did not just share beliefs. They shared meals, money, prayers and time. Luke describes them as devoted to teaching, to fellowship, to breaking bread and to prayer. Faith was practised together.'),
  p('You may be nervous about church or group life. Maybe you have been hurt before, or maybe you simply do not know where you fit. A good first step is small: one person, one group, one regular conversation. Faith grows in ordinary rhythms.'),
  h3('Where to go from here'),
  ul('Keep reading a Gospel a few verses a day.', 'Share a reflection with your mentor or group.', 'Choose one verse to learn by heart.', 'Pick your next pathway when you are ready.'),
  p('You have finished the foundations. They are not the end of faith; they are the ground to build on. Whenever you want a next step, it will be here.'),
];
const l8audio = [p('The earliest believers did not just share beliefs. They shared meals, money, prayers and time. Faith was practised together.')];

export const foundations: SeedPathway = {
  key: 'foundations',
  title: 'Foundations of Faith',
  summary: 'Eight short lessons on the basics, with space to reflect after each one. For people who are new to faith or coming back to it.',
  audience: 'New to faith, or returning',
  level: 'new_to_faith',
  coverKey: 'dawn',
  tags: ['basics', 'new believers'],
  modules: [
    {
      key: 'm1', title: 'Beginning', summary: 'What this journey is, and who God is.',
      lessons: [
        {
          key: 'welcome', title: 'Welcome to the journey', summary: 'How the lessons, reflections and conversations fit together.', minutes: 8,
          blocks: [audio(l1audio), text(...l1), scripture('MAT 11:28-30', 'An invitation to rest'), callout('pray', p('You might pray: God, I am here. Help me to be honest, and to listen.')),
            reflect('welcome-1', 'What brought you here, and what are you hoping might change?', 'There is no right answer. Write what is true today.'), quizBlock('qz_welcome')],
          quiz: makeQuiz('qz_welcome', 'les_welcome', [
            trueFalse('q1', 'You have to share every reflection with someone.', false, 'Everything you write is private until you choose to share it.'),
            single('q2', 'How long is each lesson meant to take?', [['About ten minutes', true], ['A full hour', false], ['Whatever the mentor decides', false]], 'Lessons are short so they fit into an ordinary day.'),
          ]),
        },
        {
          key: 'god', title: 'Who is God?', summary: 'A Creator who made us on purpose and knows us closely.', minutes: 10,
          blocks: [audio(l2audio), text(...l2), scripture('GEN 1:1'), scripture('PSA 139:1-4', 'Known and not rejected'),
            reflect('god-1', 'If you were sure you were known and not rejected, what might change about tomorrow?', 'Think about one real moment from the week.'), quizBlock('qz_god')],
          quiz: makeQuiz('qz_god', 'les_god', [
            single('q1', 'What does Genesis 1:1 say God did?', [['Created the heavens and the earth', true], ['Chose a nation', false], ['Gave the law', false]], 'The Bible begins with God as Creator.'),
            trueFalse('q2', 'Psalm 139 says God knows us only from a distance.', false, 'The psalm describes God as knowing us closely, from the inside.'),
          ]),
        },
      ],
    },
    {
      key: 'm2', title: 'The good news', summary: 'Grace, Jesus and faith.',
      lessons: [
        {
          key: 'grace', title: 'Grace', summary: 'A gift you cannot earn and do not have to.', minutes: 10,
          blocks: [video('grace', 24, [p('Grace is a gift you do not earn. It is love given before you have done anything to deserve it. Saved, through faith, as a gift, so that no one can boast.')]), text(...l3), scripture('EPH 2:8-9', 'Read slowly, twice'), scripture('ROM 5:8'),
            memory('EPH 2:8-9'), reflect('grace-1', 'Where in your life have you been trying to earn love or approval? What would it mean to receive it as a gift?', 'You might write about a person, a habit or an expectation.'), quizBlock('qz_grace')],
          quiz: makeQuiz('qz_grace', 'les_grace', [
            single('q1', 'In Ephesians 2:8-9, what is described as a gift of God?', [['Salvation by grace through faith', true], ['A reward for good behaviour', false], ['A list of rules', false]], 'Paul says it is not from ourselves; it is a gift, so that no one can boast.'),
            multi('q2', 'Which of these does grace NOT mean?', [['Permission to stop caring how we live', true], ['A gift we do not earn', false], ['Love that comes before we change', false]], 'Grace is a gift that changes people from the inside; it is not an excuse.'),
            trueFalse('q3', 'Grace runs out if we fail too often.', false, 'The message of grace is that love is not fragile.'),
          ]),
        },
        {
          key: 'jesus', title: 'Who is Jesus?', summary: 'God came close, in a person you can meet.', minutes: 11,
          blocks: [audio(l4audio), text(...l4), scripture('JHN 1:1-5'), scripture('JHN 1:14'), scripture('MRK 10:45', 'What he came to do'),
            reflect('jesus-1', 'If you read one story about Jesus this week, which would you choose, and why?', 'Try Mark 1 or John 4 if you are not sure where to start.'), quizBlock('qz_jesus')],
          quiz: makeQuiz('qz_jesus', 'les_jesus', [
            single('q1', 'What does John 1:14 say happened to the Word?', [['It became flesh and lived among us', true], ['It stayed in heaven', false], ['It became a book', false]], 'This is how John describes Jesus.'),
            trueFalse('q2', 'Mark 10:45 says Jesus came to be served.', false, 'It says he came to serve and to give his life.'),
          ]),
        },
        {
          key: 'faith', title: 'What is faith?', summary: 'Trust you can practise in small steps, and room for honest doubt.', minutes: 9,
          blocks: [audio(l5audio), text(...l5), scripture('HEB 11:1'), scripture('MRK 9:23-24', 'Belief and unbelief in one sentence'),
            reflect('faith-1', 'What is one small step of trust you could take this week?', 'Keep it small enough that you will do it.'), quizBlock('qz_faith')],
          quiz: makeQuiz('qz_faith', 'les_faith', [
            trueFalse('q1', 'Honest doubt is the opposite of faith.', false, 'In Mark 9 a father says "I believe; help my unbelief" and Jesus does not turn him away.'),
            single('q2', 'The lesson compares faith to...', [['Sitting in a chair without checking each leg', true], ['Passing an exam', false], ['Winning an argument', false]], 'Faith is trust you lean your weight on.'),
          ]),
        },
      ],
    },
    {
      key: 'm3', title: 'Living it out', summary: 'Prayer, Scripture and community.',
      lessons: [
        {
          key: 'prayer', title: 'Learning to pray', summary: 'A short pattern, and a simple daily rhythm.', minutes: 10,
          blocks: [audio(l6audio), text(...l6), scripture('MAT 6:9-13', 'A pattern, not a script'), scripture('PHP 4:6-7'),
            callout('practice', p('Try the four-part rhythm once today: thanks, what is on your mind, what you need, and a minute of quiet.')),
            memory('PHP 4:6-7'), reflect('prayer-1', 'What is one thing you would like to say to God right now, in your own words?', 'Write it as a prayer if you like.'), quizBlock('qz_prayer')],
          quiz: makeQuiz('qz_prayer', 'les_prayer', [
            multi('q1', 'Which are part of the simple rhythm in this lesson?', [['Say thanks', true], ['Say what is on your mind', true], ['Use special words', false]], 'No special words are needed.'),
            trueFalse('q2', 'Jesus gave his followers a pattern for prayer.', true, 'The Lord’s Prayer in Matthew 6 is that pattern.'),
          ]),
        },
        {
          key: 'scripture', title: 'Reading the Scriptures', summary: 'A library of sixty-six books, and a simple way to read one.', minutes: 10,
          blocks: [video('scripture', 22, [p('Read a paragraph, not a chapter. What does it say? What does it show me about God? What is one thing I can do today?')]), text(...l7), scripture('2TI 3:16-17'), scripture('PSA 119:105'),
            memory('PSA 119:105'), reflect('scripture-1', 'What does it show you about God, and what is one thing you could do about it today?', 'Choose any passage you have read this week.'), quizBlock('qz_scripture')],
          quiz: makeQuiz('qz_scripture', 'les_scripture', [
            single('q1', 'How many books are in the Protestant Bible?', [['Sixty-six', true], ['One', false], ['Twelve', false]], 'The Bible is a library of sixty-six books.'),
            multi('q2', 'Which questions does the lesson suggest asking of a passage?', [['What does this say?', true], ['What does it show me about God?', true], ['How can I win a debate?', false]], 'Read slowly and ask simple questions.'),
          ]),
        },
        {
          key: 'together', title: 'Walking together', summary: 'Faith was never meant to be practised alone.', minutes: 9,
          blocks: [audio(l8audio), text(...l8), scripture('ACT 2:42-47'), scripture('HEB 10:24-25'),
            reflect('together-1', 'Who is one person you could talk with regularly about what you are learning?', 'It does not have to be someone from a church.'), quizBlock('qz_together')],
          quiz: makeQuiz('qz_together', 'les_together', [
            single('q1', 'According to Acts 2:42, what were the first believers devoted to?', [['Teaching, fellowship, breaking bread and prayer', true], ['Building temples', false], ['Avoiding others', false]], 'Faith was practised together, in ordinary rhythms.'),
          ]),
          requireReflection: false,
        },
      ],
    },
  ],
};
void quote;
