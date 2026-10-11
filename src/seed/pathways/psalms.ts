import { mini } from './compact';
import type { SeedPathway } from './types';

export const psalms: SeedPathway = {
  key: 'psalms',
  title: 'Psalms: Honest Songs',
  summary: 'Six psalms that give words to joy, doubt, guilt and trust, and show how to bring all of it to God.',
  audience: 'Anyone who wants words for what they are feeling',
  level: 'growing',
  coverKey: 'river',
  tags: ['psalms', 'prayer', 'scripture'],
  modules: [
    {
      key: 'sm1', title: 'Rooted and held', summary: 'Two psalms about where life draws its strength.',
      lessons: [
        mini({ key: 'psalm-rooted', title: 'A tree by the water', summary: 'Psalm 1 and the shape of a settled life.', minutes: 7,
          body: ['Psalm 1 opens the whole book with a picture rather than a rule: a tree planted beside a stream. It does not strain to grow. It simply stays near the water, and fruit comes in its season.', 'The psalm contrasts that tree with chaff, which has no root and goes wherever the wind sends it. The difference is not talent or effort but what a person keeps returning to. Here it is the law of the Lord, meant as instruction for living, thought over day and night.', 'Notice the word "meditates". In the original it carries the sense of murmuring, saying a thing quietly again and again. It is closer to chewing than to studying.'],
          refs: ['PSA 1:1-6'], practice: 'Choose one verse from today and say it quietly three times during the day: morning, midday and evening.',
          prompt: 'What are you most often rooted in during an ordinary week? What would moving closer to the water look like?',
          quiz: { q: 'What does the tree in Psalm 1 stand for?', options: [['A person who stays close to God\'s instruction', true], ['A person who works hardest', false], ['A person who avoids all difficulty', false]], why: 'The tree is planted by the water. Its life comes from what it stays near.' } }),
        mini({ key: 'psalm-shepherd', title: 'The shepherd', summary: 'Psalm 23, read slowly and not as a greeting card.', minutes: 8,
          body: ['Psalm 23 is so familiar that it can slide past us. Read it again as the words of a person who has been through a dark valley and is describing who was there with him.', 'The shepherd leads, restores and guards. He also walks through the valley rather than around it. The comfort is presence, not the absence of danger. The final image turns from open pasture to a table and a house, from being led to being welcomed.', 'The psalm moves from "he" to "you" in the middle. Talking about God becomes talking to God exactly when the valley appears.'],
          refs: ['PSA 23:1-6'], memory: 'PSA 23:1-6',
          prompt: 'Where is a valley in your life right now? Write a sentence to the shepherd about it, using "you".',
          tf: { q: 'Psalm 23 promises that the valley will be avoided.', a: false, why: 'It promises company in the valley: "I will fear no evil, for you are with me."' } }),
      ],
    },
    {
      key: 'sm2', title: 'Thirst, guilt and rescue', summary: 'Psalms that do not hide how hard it can be.',
      lessons: [
        mini({ key: 'psalm-thirst', title: 'Why are you downcast?', summary: 'Psalm 42 and talking to your own soul.', minutes: 8,
          body: ['The writer of Psalm 42 is far from home and remembers better days. He feels dry as a deer searching for water. Then he does something striking: he speaks to himself. "Why are you downcast, my soul?"', 'He does not scold himself, and he does not pretend. He asks a question, then tells his soul where to look: hope in God. The feelings stay real. The direction changes.', 'Faith here is not the absence of low days. It is the habit of turning toward God while still on one.'],
          refs: ['PSA 42:1-11'], practice: 'Write down one thing your soul has been telling you lately. Then write one thing you would tell your soul in reply.',
          prompt: 'What does your soul need to be reminded of today?',
          quiz: { q: 'What does the writer do when he feels downcast?', options: [['He asks his soul a question and points it toward hope in God', true], ['He denies he feels anything', false], ['He leaves the community', false]], why: 'He is honest about the low point and still turns toward God.' } }),
        mini({ key: 'psalm-mercy', title: 'Mercy and a clean start', summary: 'Psalm 51 as a pattern for confession.', minutes: 9,
          body: ['Psalm 51 is traditionally linked to David after he had done serious wrong. It is one of the plainest confessions in the Bible. He names what he did, does not shift the blame, and asks for mercy based on God\'s love rather than his own record.', 'Look at what he asks for: a clean heart, a renewed spirit, the joy of being restored. He wants more than a lighter sentence. He wants to be changed, so that he can teach others from his own story.', 'Confession here is not self-punishment. It is telling the truth to someone who already knows and stays kind.'],
          refs: ['PSA 51:1-12'], prompt: 'Is there something you have been carrying quietly? You do not have to share it. Write only what you would like to say to God about it.',
          guidance: 'This is private. Only share it if you choose to.',
          tf: { q: 'In Psalm 51 the writer asks for mercy because of what he has earned.', a: false, why: 'He appeals to God\'s steadfast love and great compassion.' } }),
      ],
    },
    {
      key: 'sm3', title: 'Help and being known', summary: 'Two psalms for travellers.',
      lessons: [
        mini({ key: 'psalm-help', title: 'Where does my help come from?', summary: 'Psalm 121, a song for the road.', minutes: 6,
          body: ['Psalm 121 was likely sung by pilgrims walking up to Jerusalem. The hills around them could hide robbers or hold shrines to other gods. So the question "Where does my help come from?" was a real one.', 'The answer is the Maker of heaven and earth, who does not sleep. Four times the psalm uses the word "keep": keep, keeper, keep, keep. It is a quiet repetition meant to settle a worried mind.', 'It is worth reading aloud on a day when your thoughts are loud.'],
          refs: ['PSA 121:1-8'], practice: 'Read this psalm aloud once before you sleep tonight.',
          prompt: 'What are you asking for help with this week?' }),
        mini({ key: 'psalm-known', title: 'Known and not alone', summary: 'Psalm 139 on being fully seen.', minutes: 9,
          body: ['Psalm 139 begins with a surprising thought: God has searched me and knows me. For some people that is a threat. In the psalm it is closer to relief. Nothing about the writer is a surprise to God, and he is still held.', 'The psalm explores sitting and rising, distance and darkness, and even the beginning of life. In every place there is presence. The final lines ask God to keep searching, which is a brave request.', 'Being known completely and loved anyway is the root of much of what the Bible says about grace.'],
          refs: ['PSA 139:1-18', 'PSA 139:23-24'], memory: 'PSA 139:23-24',
          prompt: 'What is it like to hear that you are fully known? Write honestly, including any hesitation.',
          quiz: { q: 'How does Psalm 139 describe being known by God?', options: [['As a source of comfort and presence', true], ['As something to fear', false], ['As something that only happens in church', false]], why: 'Even in darkness and distance, God is there and holds the writer.' } }),
      ],
    },
  ],
};
