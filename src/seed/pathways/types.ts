import type { LessonBlock, Quiz } from '@/types';

export interface SeedLesson {
  key: string;
  title: string;
  summary: string;
  minutes: number;
  blocks: LessonBlock[];
  quiz?: Quiz;
  requireReflection?: boolean;
}
export interface SeedModule {
  key: string;
  title: string;
  summary: string;
  lessons: SeedLesson[];
}
export interface SeedPathway {
  key: string;
  title: string;
  summary: string;
  audience: string;
  level: 'new_to_faith' | 'growing' | 'leading';
  coverKey: string;
  tags: string[];
  modules: SeedModule[];
}
