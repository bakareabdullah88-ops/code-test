import { openDB, type IDBPDatabase } from 'idb';
import type * as T from '@/types';

/** Every collection the mock backend keeps. Each record has a string `id`. */
export interface Collections {
  users: T.User;
  organisations: T.Organisation;
  memberships: T.Membership;
  invites: T.Invite;
  assignments: T.MentorAssignment;
  groups: T.Group;
  groupMemberships: T.GroupMembership & { id: string };
  meetings: T.Meeting;
  threads: T.DiscussionThread;
  posts: T.DiscussionPost;
  reports: T.Report;
  pathways: T.Pathway;
  modules: T.Module;
  lessons: T.Lesson;
  quizzes: T.Quiz;
  quizAttempts: T.QuizAttempt;
  enrollments: T.Enrollment;
  progress: T.LessonProgress & { id: string };
  reflections: T.Reflection;
  feedback: T.Feedback;
  comments: T.Comment;
  prayers: T.PrayerRequest & { supporterIds: string[] };
  highlights: T.Highlight;
  verseNotes: T.VerseNote;
  memoryVerses: T.MemoryVerse;
  memoryReviews: T.MemoryReview;
  goals: T.Goal;
  checkIns: T.CheckIn;
  sessionNotes: T.SessionNote;
  milestones: T.Milestone;
  timeline: T.TimelineEvent;
  notifications: T.Notification;
  aiConversations: T.AiConversation;
  aiMessages: T.AiMessage;
  approvals: T.ApprovalRequest;
  audit: T.AuditEvent;
  events: T.OrgEvent;
  rsvps: T.EventRsvp;
  resources: T.Resource;
  bookmarks: T.ResourceBookmark;
  plans: T.ReadingPlan;
  planProgress: T.PlanProgress;
  snoozes: { id: string; mentorId: string; key: string; until: string };
  meta: { id: string; value: unknown };
}
export type CollectionName = keyof Collections;
export const collectionNames: CollectionName[] = [
  'users', 'organisations', 'memberships', 'invites', 'assignments', 'groups', 'groupMemberships', 'meetings', 'threads', 'posts', 'reports',
  'pathways', 'modules', 'lessons', 'quizzes', 'quizAttempts', 'enrollments', 'progress', 'reflections', 'feedback', 'comments', 'prayers',
  'highlights', 'verseNotes', 'memoryVerses', 'memoryReviews', 'goals', 'checkIns', 'sessionNotes', 'milestones', 'timeline', 'notifications',
  'aiConversations', 'aiMessages', 'approvals', 'audit', 'events', 'rsvps', 'resources', 'bookmarks', 'plans', 'planProgress', 'snoozes', 'meta',
];

type AnyRec = { id: string };
const DB_NAME = 'tessera-demo';
const DB_VERSION = 2;

class Store {
  private data = new Map<CollectionName, Map<string, AnyRec>>();
  private db: IDBPDatabase | null = null;
  private pending = new Map<CollectionName, Map<string, AnyRec | null>>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private listeners = new Set<() => void>();
  persistent = false;
  version = 0;

  constructor() {
    for (const n of collectionNames) this.data.set(n, new Map());
  }

  /** Loads saved data. Returns true when the database already had content. */
  async load(): Promise<boolean> {
    try {
      this.db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          for (const n of collectionNames) if (!db.objectStoreNames.contains(n)) db.createObjectStore(n, { keyPath: 'id' });
        },
      });
      this.persistent = true;
      let any = false;
      for (const n of collectionNames) {
        const rows = (await this.db.getAll(n)) as AnyRec[];
        const m = this.data.get(n);
        if (!m) continue;
        for (const r of rows) m.set(r.id, r);
        if (rows.length) any = true;
      }
      return any;
    } catch {
      // Private mode or blocked storage: keep working in memory and say so in settings.
      this.persistent = false;
      return false;
    }
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }
  private notify() {
    this.version++;
    this.listeners.forEach((l) => l());
  }

  list<K extends CollectionName>(name: K): Collections[K][] {
    return [...(this.data.get(name)?.values() ?? [])] as Collections[K][];
  }
  get<K extends CollectionName>(name: K, id: string): Collections[K] | undefined {
    return this.data.get(name)?.get(id) as Collections[K] | undefined;
  }
  find<K extends CollectionName>(name: K, pred: (r: Collections[K]) => boolean): Collections[K][] {
    return this.list(name).filter(pred);
  }
  put<K extends CollectionName>(name: K, rec: Collections[K]): Collections[K] {
    this.data.get(name)?.set(rec.id, rec);
    this.queue(name, rec.id, rec);
    this.notify();
    return rec;
  }
  putMany<K extends CollectionName>(name: K, recs: Collections[K][]) {
    for (const r of recs) {
      this.data.get(name)?.set(r.id, r);
      this.queue(name, r.id, r);
    }
    this.notify();
  }
  remove(name: CollectionName, id: string) {
    this.data.get(name)?.delete(id);
    this.queue(name, id, null);
    this.notify();
  }

  private queue(name: CollectionName, id: string, rec: AnyRec | null) {
    if (!this.persistent) return;
    let m = this.pending.get(name);
    if (!m) this.pending.set(name, (m = new Map()));
    m.set(id, rec);
    this.timer ??= setTimeout(() => void this.flush(), 60);
  }

  async flush() {
    this.timer = null;
    const db = this.db;
    if (!db) return;
    const batches = this.pending;
    this.pending = new Map();
    for (const [name, rows] of batches) {
      const tx = db.transaction(name, 'readwrite');
      for (const [id, rec] of rows) {
        if (rec === null) void tx.store.delete(id);
        else void tx.store.put(rec);
      }
      await tx.done;
    }
  }

  async clearAll() {
    for (const m of this.data.values()) m.clear();
    this.pending = new Map();
    if (this.db) for (const n of collectionNames) await this.db.clear(n);
    this.notify();
  }
}

export const store = new Store();
