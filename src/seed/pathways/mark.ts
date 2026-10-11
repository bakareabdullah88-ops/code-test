import { mini } from './compact';
import type { SeedPathway } from './types';

export const mark: SeedPathway = {
  key: 'mark',
  title: 'Walking with Jesus: The Gospel of Mark',
  summary: 'Ten guided readings through the shortest and fastest-moving Gospel, with one question for each.',
  audience: 'Anyone who wants to meet Jesus in Scripture',
  level: 'growing',
  coverKey: 'path',
  tags: ['gospel', 'reading plan'],
  modules: [
    {
      key: 'mm1', title: 'Who is this?', summary: 'Mark 1 to 5',
      lessons: [
        mini({ key: 'mark-1', title: 'The beginning', summary: 'John the Baptist, baptism and the first call.', minutes: 10,
          body: ['Mark starts without a birth story. He opens with the good news, an announcement, and moves quickly. Jesus is baptised, tested in the wilderness, and then begins to call people to follow him.', 'Notice how many times Mark uses the word "immediately". The tone is urgent and the story keeps moving. Read the passage once through for the sweep, then again slowly.'],
          refs: ['MRK 1:1-11', 'MRK 1:14-20'], prompt: 'Which person or moment in this passage drew your attention, and why?', tf: { q: 'Mark begins with a birth story.', a: false, why: 'Mark begins with John the Baptist and the baptism of Jesus.' } }),
        mini({ key: 'mark-2', title: 'Authority and welcome', summary: 'Healing, forgiveness and eating with outsiders.', minutes: 10,
          body: ['In chapter 2 four friends tear a hole in a roof to get a paralysed man to Jesus. He forgives the man and then heals him. Soon after, he eats with tax collectors and says he came for the sick, not the healthy.', 'The pattern is consistent. Jesus has authority, and he uses it to welcome people the religious establishment kept away.'],
          refs: ['MRK 2:1-12', 'MRK 2:13-17'], prompt: 'Who are the people Jesus welcomes in this reading? Who might they be today?' }),
        mini({ key: 'mark-3', title: 'Stories about the kingdom', summary: 'The sower and the soils.', minutes: 10,
          body: ['Jesus teaches in parables, short stories that make people think. The sower scatters seed on four kinds of soil. Only one produces a harvest. The story invites listeners to ask what kind of soil they are.', 'Notice that the sower is generous, scattering seed even on poor ground. The focus is the openness of the listener.'],
          refs: ['MRK 4:1-20'], prompt: 'Which soil best describes where you are right now?', quiz: { q: 'In the parable, how many soils produce a harvest?', options: [['One of the four', true], ['All four', false], ['None', false]], why: 'Only the good soil produces a crop.' } }),
        mini({ key: 'mark-4', title: 'Storms and fear', summary: 'Jesus calms the sea.', minutes: 9,
          body: ['The disciples are experienced fishermen and they are afraid of the storm. Jesus is asleep in the boat. They wake him with a sharp question: do you not care that we are perishing?', 'He speaks to the wind and the sea, and then asks them why they are afraid. The question is not a scolding. It is an invitation to trust.'],
          refs: ['MRK 4:35-41'], prompt: 'What is the storm in your life right now? What would it mean to bring it to Jesus?' }),
        mini({ key: 'mark-5', title: 'Interrupted', summary: 'Two healings, one stolen and one given back.', minutes: 10,
          body: ['On the way to heal a girl, Jesus is stopped by a woman who has been ill for twelve years. He turns, finds her and calls her "daughter". Then he goes on and raises the girl.', 'He is never too busy for an individual. Notice how he treats the woman: he does not let her slip away unseen.'],
          refs: ['MRK 5:21-43'], prompt: 'When have you felt overlooked? What does this reading say to that?' }),
      ],
    },
    {
      key: 'mm2', title: 'The cost and the cross', summary: 'Mark 8 to 16',
      lessons: [
        mini({ key: 'mark-6', title: 'Who do you say I am?', summary: 'Peter’s answer, and a surprising path.', minutes: 10,
          body: ['At the centre of Mark, Jesus asks his friends what people say about him, and then asks them directly. Peter answers: you are the Christ. Immediately Jesus begins to explain that the path leads through suffering.', 'The call that follows is demanding: take up your cross and follow. It is not a call to misery, but to a life oriented around love rather than self-protection.'],
          refs: ['MRK 8:27-35'], memory: 'MRK 8:34', prompt: 'How would you answer the question, "Who do you say that I am?" today?' }),
        mini({ key: 'mark-7', title: 'Greatness turned upside down', summary: 'Children, servants and the last who are first.', minutes: 9,
          body: ['The disciples argue about who is greatest. Jesus puts a child in front of them and says that welcoming such a person is welcoming him. He later says that whoever wants to be great must serve.', 'The upside-down kingdom runs on service, not status. Notice the contrast between the disciples’ argument and the quiet example Jesus gives.'],
          refs: ['MRK 9:33-37', 'MRK 10:41-45'], prompt: 'Where could you serve someone quietly this week?' }),
        mini({ key: 'mark-8', title: 'Last days', summary: 'Entering Jerusalem, the last supper and the garden.', minutes: 11,
          body: ['The pace slows for the last week. Jesus enters Jerusalem, shares a meal with his friends and prays in a garden, asking whether the cup might pass, and then trusting the Father.', 'Mark does not hurry past the fear. Jesus is honest about it. It is permission to be honest in our own hardest moments.'],
          refs: ['MRK 14:22-26', 'MRK 14:32-36'], prompt: 'What stands out to you in the garden prayer?' }),
        mini({ key: 'mark-9', title: 'The cross', summary: 'The crucifixion, told plainly.', minutes: 10,
          body: ['Mark tells the crucifixion briefly and without decoration. The one who is mocked as a king is a king. The Roman centurion who watched him die says: truly this man was the Son of God.', 'You may want to read this passage slowly, aloud, and then sit in quiet for a minute.'],
          refs: ['MRK 15:33-39'], prompt: 'What do you want to say or ask after reading this passage?' }),
        mini({ key: 'mark-10', title: 'He is risen', summary: 'An ending that is also a beginning.', minutes: 8,
          body: ['The women come to the tomb expecting to anoint a body. They find the stone rolled away and a message: he has risen, and he is going ahead of you. In the oldest manuscripts the Gospel ends there, in wonder and fear.', 'It leaves readers on the edge of the story, as if to say: now it is your turn to follow.'],
          refs: ['MRK 16:1-8'], prompt: 'Where are you being invited to go ahead of fear and follow?' }),
      ],
    },
  ],
};
