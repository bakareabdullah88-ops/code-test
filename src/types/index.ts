// Domain types. Written as the future API schema (see docs/API_CONTRACT.md).

export type Id<K extends string> = `${K}_${string}`;
export type ISODateTime = string;       // 2026-10-11T09:30:00Z
export type ISODate = string;           // 2026-10-11
export type Locale = 'en' | 'fr' | 'pt' | 'sw' | 'yo' | 'ha' | 'ig';
export type Role = 'student' | 'mentor' | 'leader' | 'admin';
export type RichDoc = { type: 'doc'; content: RichNode[] };   // ProseMirror JSON, limited schema
export interface RichNode { type: string; attrs?: Record<string, unknown>; content?: RichNode[]; marks?: { type: string; attrs?: Record<string, unknown> }[]; text?: string }

export interface Page<T> { items: T[]; nextCursor: string | null; total?: number }
export interface PageParams { cursor?: string; limit?: number }

export type ErrorCode =
  | 'unauthenticated' | 'forbidden' | 'not_found' | 'validation_failed'
  | 'conflict' | 'rate_limited' | 'unavailable' | 'offline' | 'unknown';
export interface ApiErrorBody { code: ErrorCode; message: string; fieldErrors?: Record<string, string[]>; requestId: string; retryAfterMs?: number }

export interface LocalisedMessage { messageKey: string; params?: Record<string, string | number> }
export interface EntityRef { type: EntityType; id: string }
export type EntityType =
  | 'lesson' | 'pathway' | 'reflection' | 'feedback' | 'comment' | 'post' | 'thread' | 'meeting'
  | 'prayer' | 'goal' | 'milestone' | 'checkIn' | 'sessionNote' | 'user' | 'group' | 'verse' | 'approval';

export interface User {
  id: Id<'usr'>; displayName: string; email: string;           // email visible to self and org admins only
  avatarUrl: string | null; bio: string | null; country: string | null; // ISO 3166-1 alpha-2
  locale: Locale; timeZone: string;                             // IANA
  createdAt: ISODateTime;
}

export type OrgKind = 'church' | 'ministry' | 'campus' | 'other';
export type AccentKey = 'clay' | 'moss' | 'ochre' | 'slate';
export interface Organisation {
  id: Id<'org'>; name: string; slug: string; kind: OrgKind; country: string | null;
  branding: { logoUrl: string | null; accent: AccentKey; welcomeMessage: string | null };
  settings: {
    defaultLocale: Locale; defaultPrayerPrivacy: PrayerPrivacy;
    attentionAfterDays: number;            // mentor "quiet" threshold, default 14
    reflectionResponseTargetDays: number;  // default 3
    aiCompanionEnabled: boolean;           // sharing always requires mentor approval
    memberDirectory: 'everyone' | 'groups' | 'leaders';
  };
  createdAt: ISODateTime;
}

export type MembershipStatus = 'active' | 'invited' | 'suspended';
export interface Membership {
  id: Id<'mem'>; userId: Id<'usr'>; orgId: Id<'org'>; roles: Role[];
  status: MembershipStatus; joinedAt: ISODateTime | null;
  lastActiveAt: ISODateTime | null;        // only returned to mentors of this user and org admins
}
export interface MemberSummary { membership: Membership; user: Pick<User, 'id' | 'displayName' | 'avatarUrl' | 'country'>; mentorIds: Id<'usr'>[]; groupIds: Id<'grp'>[] }

export interface Session {
  user: User; memberships: Membership[]; organisations: Organisation[];
  activeOrgId: Id<'org'> | null;           // null = personal space
  capabilities: string[];                  // flattened permission keys for convenience
}

export interface Invite {
  id: Id<'inv'>; orgId: Id<'org'>; code: string; email: string | null; roles: Role[];
  expiresAt: ISODateTime; status: 'pending' | 'accepted' | 'revoked' | 'expired'; createdBy: Id<'usr'>; createdAt: ISODateTime;
}

export interface MentorAssignment {
  id: Id<'mas'>; orgId: Id<'org'>; mentorId: Id<'usr'>; menteeId: Id<'usr'>;
  status: 'active' | 'ended'; startedAt: ISODateTime; endedAt: ISODateTime | null;
}

export type GroupPrivacy = 'open_to_org' | 'invite_only';
export interface Group {
  id: Id<'grp'>; orgId: Id<'org'>; name: string; description: string | null;
  leaderIds: Id<'usr'>[]; privacy: GroupPrivacy; pathwayId: Id<'pth'> | null;
  schedule: { recurrence: 'none' | 'weekly' | 'biweekly' | 'monthly'; weekday: 0 | 1 | 2 | 3 | 4 | 5 | 6 | null; startTime: string | null; durationMin: number | null; timeZone: string; location: string | null; videoUrl: string | null };
  memberCount: number; archivedAt: ISODateTime | null; createdAt: ISODateTime;
}
export interface GroupMembership { groupId: Id<'grp'>; userId: Id<'usr'>; role: 'member' | 'co_leader' | 'leader'; joinedAt: ISODateTime }

export interface Meeting {
  id: Id<'mtg'>; groupId: Id<'grp'>; startsAt: ISODateTime; endsAt: ISODateTime;
  location: string | null; videoUrl: string | null; lessonId: Id<'les'> | null;
  agenda: AgendaItem[]; notes: RichDoc | null; status: 'scheduled' | 'held' | 'cancelled';
  attendance: { userId: Id<'usr'>; present: boolean }[]; version: number;
}
export interface AgendaItem { id: string; kind: 'opening' | 'scripture' | 'discussion' | 'prayer' | 'other'; title: string; minutes: number | null; detail: string | null }

export interface DiscussionThread {
  id: Id<'thr'>; groupId: Id<'grp'>; lessonId: Id<'les'> | null; title: string;
  createdBy: Id<'usr'>; pinned: boolean; locked: boolean; postCount: number; lastPostAt: ISODateTime | null; createdAt: ISODateTime;
}
export type PostStatus = 'visible' | 'hidden' | 'removed';
export interface DiscussionPost {
  id: Id<'pst'>; threadId: Id<'thr'>; parentId: Id<'pst'> | null; authorId: Id<'usr'>;
  body: RichDoc; sharedReflection: { reflectionId: Id<'ref'>; excerpt: string } | null;
  status: PostStatus; moderation: { reason: string; at: ISODateTime; by: Id<'usr'> } | null;
  createdAt: ISODateTime; editedAt: ISODateTime | null; reactions: { kind: 'amen' | 'thanks' | 'helpful'; count: number; mine: boolean }[];
}
export interface Report { id: Id<'rpt'>; subject: EntityRef; reportedBy: Id<'usr'>; reason: 'unkind' | 'off_topic' | 'private_info' | 'other'; note: string | null; status: 'open' | 'actioned' | 'dismissed'; createdAt: ISODateTime }

export type PublishStatus = 'draft' | 'published' | 'archived';
export interface Pathway {
  id: Id<'pth'>; orgId: Id<'org'> | null;            // null = platform starter library
  title: string; summary: string; audience: string; level: 'new_to_faith' | 'growing' | 'leading';
  coverKey: string;                                  // illustration key, not an image URL
  locale: Locale; estimatedMinutes: number; moduleCount: number; lessonCount: number;
  status: PublishStatus; version: number; publishedVersion: number | null;
  authorId: Id<'usr'>; tags: string[]; visibility: 'private' | 'organisation' | 'library';
  createdAt: ISODateTime; updatedAt: ISODateTime;
}
export interface Module { id: Id<'mod'>; pathwayId: Id<'pth'>; title: string; summary: string | null; position: number }
export interface Lesson {
  id: Id<'les'>; pathwayId: Id<'pth'>; moduleId: Id<'mod'>; title: string; summary: string;
  position: number; estimatedMinutes: number; blocks: LessonBlock[];
  completion: { requireQuiz: boolean; requireReflection: boolean };
  status: PublishStatus; version: number; updatedAt: ISODateTime;
}

export type LessonBlock =
  | { id: string; type: 'text'; doc: RichDoc }
  | { id: string; type: 'scripture'; ref: BibleRange; translationId: 'web'; caption: string | null }
  | { id: string; type: 'audio'; src: string; durationSec: number; transcript: RichDoc; downloadBytes: number }
  | { id: string; type: 'video'; src: string; posterSrc: string | null; captionsSrc: string; durationSec: number; transcript: RichDoc | null; downloadBytes: number | null }
  | { id: string; type: 'callout'; tone: 'note' | 'practice' | 'pray'; doc: RichDoc }
  | { id: string; type: 'reflectionPrompt'; promptId: string; prompt: string; guidance: string | null }
  | { id: string; type: 'quiz'; quizId: Id<'qz'> }
  | { id: string; type: 'memoryVerse'; ref: BibleRange };

export interface Quiz { id: Id<'qz'>; lessonId: Id<'les'>; questions: QuizQuestion[]; passRule: 'none' | 'all_answered' | { minCorrect: number } }
export type QuizQuestion =
  | { id: string; kind: 'single'; prompt: string; options: QuizOption[]; explanation: string }
  | { id: string; kind: 'multi'; prompt: string; options: QuizOption[]; explanation: string }
  | { id: string; kind: 'true_false'; prompt: string; answer: boolean; explanation: string };
export interface QuizOption { id: string; text: string; correct: boolean }          // `correct` is stripped from payloads for students until answered
export interface QuizAttempt { id: Id<'qat'>; quizId: Id<'qz'>; userId: Id<'usr'>; answers: Record<string, string[] | boolean>; correctCount: number; completedAt: ISODateTime }

export interface Enrollment {
  id: Id<'enr'>; userId: Id<'usr'>; pathwayId: Id<'pth'>; pathwayVersion: number;
  status: 'active' | 'paused' | 'completed'; assignedBy: Id<'usr'> | null; groupId: Id<'grp'> | null;
  startedAt: ISODateTime; completedAt: ISODateTime | null;
}
export interface LessonProgress {
  userId: Id<'usr'>; lessonId: Id<'les'>; enrollmentId: Id<'enr'>;
  status: 'not_started' | 'in_progress' | 'completed'; lastBlockId: string | null;
  completedAt: ISODateTime | null; updatedAt: ISODateTime;
}

export type ReflectionVisibility = 'private' | 'mentor' | 'group';
export type ReflectionStatus = 'draft' | 'submitted' | 'withdrawn';
export interface Reflection {
  id: Id<'ref'>; authorId: Id<'usr'>; orgId: Id<'org'> | null;
  lessonId: Id<'les'> | null; pathwayId: Id<'pth'> | null; promptId: string | null; promptText: string | null;
  title: string | null; body: RichDoc; plainText: string; wordCount: number;
  scriptureRefs: BibleRange[]; visibility: ReflectionVisibility; groupId: Id<'grp'> | null;
  status: ReflectionStatus; submittedAt: ISODateTime | null;
  feedbackStatus: 'none' | 'awaiting' | 'responded';             // derived; drives the mentor inbox
  feedbackCount: number; version: number; createdAt: ISODateTime; updatedAt: ISODateTime;
}

export interface Feedback {
  id: Id<'fbk'>; reflectionId: Id<'ref'>; mentorId: Id<'usr'>; body: RichDoc; plainText: string;
  shareableToGroup: boolean; aiAssisted: boolean;               // true if an AI draft was used as a starting point; always human-edited
  status: 'draft' | 'sent'; sentAt: ISODateTime | null; readAt: ISODateTime | null; createdAt: ISODateTime; updatedAt: ISODateTime;
}

export type CommentSubject = 'reflection' | 'post' | 'prayer' | 'goal' | 'checkIn';
export interface Comment {
  id: Id<'cmt'>; subject: { type: CommentSubject; id: string }; parentId: Id<'cmt'> | null; authorId: Id<'usr'>;
  body: string; kind: 'comment' | 'encouragement'; createdAt: ISODateTime; editedAt: ISODateTime | null; status: 'visible' | 'hidden';
}

export type PrayerPrivacy = 'only_me' | 'mentor' | 'group' | 'organisation';
export interface PrayerRequest {
  id: Id<'pry'>; orgId: Id<'org'> | null; authorId: Id<'usr'> | null;   // null in responses when anonymous to the viewer
  anonymous: boolean; body: string; category: 'health' | 'family' | 'work' | 'faith' | 'community' | 'thanks' | 'other' | null;
  privacy: PrayerPrivacy; groupId: Id<'grp'> | null; status: 'open' | 'answered' | 'archived';
  supporterCount: number; iAmPraying: boolean; answeredNote: string | null; answeredAt: ISODateTime | null;
  createdAt: ISODateTime; updatedAt: ISODateTime;
}

export interface BibleTranslation { id: 'web'; name: string; language: Locale; licence: 'public_domain'; attribution: string; bookCount: number }
export interface BibleBook { id: string /* USFM code: 'JHN' */; name: string; testament: 'OT' | 'NT'; chapters: number; order: number }
export interface BibleVerse { v: number; text: string; p?: boolean /* starts paragraph */; poetry?: 0 | 1 | 2 /* indent level */; heading?: string }
export interface BibleChapter { translationId: 'web'; book: string; chapter: number; verses: BibleVerse[] }
export interface BibleRange { book: string; chapter: number; verseStart: number; verseEnd: number }

export type HighlightColor = 'straw' | 'sage' | 'rose' | 'mist';
export interface Highlight { id: Id<'hlt'>; userId: Id<'usr'>; translationId: 'web'; range: BibleRange; color: HighlightColor; createdAt: ISODateTime }
export interface VerseNote { id: Id<'vnt'>; userId: Id<'usr'>; range: BibleRange; body: RichDoc; plainText: string; reflectionId: Id<'ref'> | null; createdAt: ISODateTime; updatedAt: ISODateTime; version: number }

export interface MemoryVerse {
  id: Id<'mvs'>; userId: Id<'usr'>; translationId: 'web'; range: BibleRange; text: string;
  source: { type: 'lesson' | 'bible' | 'manual' | 'reflection'; id: string | null };
  srs: { box: number; easiness: number; intervalDays: number; reps: number; dueAt: ISODateTime; lastReviewedAt: ISODateTime | null };
  state: 'new' | 'learning' | 'known'; createdAt: ISODateTime;
}
export interface MemoryReview { id: Id<'mrv'>; memoryVerseId: Id<'mvs'>; rating: 'again' | 'hard' | 'good' | 'easy'; reviewedAt: ISODateTime }

export interface Goal {
  id: Id<'gol'>; userId: Id<'usr'>; createdBy: Id<'usr'>; kind: 'personal' | 'mentor_set';
  title: string; description: string | null; targetDate: ISODate | null;
  steps: { id: string; label: string; done: boolean }[];
  status: 'active' | 'paused' | 'completed'; completedAt: ISODateTime | null;
  linked: EntityRef | null; mentorNote: string | null; version: number; createdAt: ISODateTime;
}
export interface CheckIn {
  id: Id<'chk'>; mentorId: Id<'usr'>; menteeId: Id<'usr'>; scheduledAt: ISODateTime; durationMin: number;
  mode: 'in_person' | 'call' | 'video' | 'message'; location: string | null;
  status: 'planned' | 'held' | 'missed' | 'cancelled'; agenda: string[]; sharedSummary: RichDoc | null; createdAt: ISODateTime;
}
export interface SessionNote {
  id: Id<'snt'>; mentorId: Id<'usr'>; menteeId: Id<'usr'>; checkInId: Id<'chk'> | null;
  body: RichDoc; plainText: string; followUps: { id: string; label: string; done: boolean }[];
  createdAt: ISODateTime; updatedAt: ISODateTime; version: number;                      // never returned to anyone but the author
}

export interface MilestoneDefinition { key: string; titleKey: string; meaningKey: string; category: 'learning' | 'reflection' | 'scripture' | 'community' | 'service' | 'goals'; icon: string; rule: string /* human-readable; evaluated server-side */ }
export interface Milestone { id: Id<'mls'>; userId: Id<'usr'>; key: string; awardedAt: ISODateTime; source: EntityRef | null; affirmedBy: Id<'usr'> | null; note: string | null }

export type TimelineEventType =
  | 'lesson_completed' | 'pathway_started' | 'pathway_completed' | 'reflection_submitted' | 'feedback_received'
  | 'discussion_shared' | 'memory_verse_added' | 'goal_completed' | 'milestone_awarded' | 'prayer_answered' | 'checkin_held';
export interface TimelineEvent { id: Id<'tle'>; userId: Id<'usr'>; type: TimelineEventType; occurredAt: ISODateTime; summary: LocalisedMessage; subject: EntityRef; visibility: 'owner' | 'mentor' | 'group' }

export interface AttentionItem {
  id: string; menteeId: Id<'usr'>; kind: 'reflection_waiting' | 'quiet' | 'goal_due' | 'checkin_soon' | 'milestone_to_affirm' | 'approval_pending' | 'prayer_shared';
  detail: LocalisedMessage; subject: EntityRef | null; since: ISODateTime; snoozedUntil: ISODateTime | null;
}

export type NotificationKind =
  | 'feedback_received' | 'reflection_shared' | 'discussion_reply' | 'meeting_reminder' | 'prayer_update'
  | 'milestone_awarded' | 'invite_received' | 'ai_approval_result' | 'ai_approval_request' | 'assignment' | 'system';
export interface Notification { id: Id<'ntf'>; userId: Id<'usr'>; kind: NotificationKind; message: LocalisedMessage; subject: EntityRef | null; href: string; createdAt: ISODateTime; readAt: ISODateTime | null }
export interface NotificationPreferences { channels: Record<NotificationKind, { inApp: boolean; email: boolean; push: boolean }>; quietHours: { start: string; end: string; timeZone: string } | null }

export interface AiConversation { id: Id<'aic'>; userId: Id<'usr'>; context: EntityRef | null; title: string; createdAt: ISODateTime; updatedAt: ISODateTime }
export interface AiMessage {
  id: Id<'aim'>; conversationId: Id<'aic'>; role: 'user' | 'assistant'; content: string;
  citations: BibleRange[]; disclosure: 'ai_generated_demo'; safety: 'ok' | 'handoff'; createdAt: ISODateTime;
}
export interface ApprovalRequest {
  id: Id<'apr'>; kind: 'share_ai_answer' | 'share_ai_summary'; requestedBy: Id<'usr'>; mentorId: Id<'usr'>;
  source: { conversationId: Id<'aic'>; messageId: Id<'aim'> }; content: string; target: { type: 'reflection' | 'group'; id: string };
  status: 'pending' | 'approved' | 'declined' | 'expired'; editedContent: string | null; decisionNote: string | null;
  decidedBy: Id<'usr'> | null; decidedAt: ISODateTime | null; createdAt: ISODateTime;
}

export interface SearchHit { type: 'lesson' | 'pathway' | 'reflection' | 'person' | 'verse' | 'group'; id: string; title: string; excerpt: string | null; href: string }
export interface AuditEvent { id: Id<'aud'>; orgId: Id<'org'>; actorId: Id<'usr'>; action: string; subject: EntityRef | null; at: ISODateTime; meta: Record<string, unknown> }
export interface Upload { id: Id<'upl'>; url: string; contentType: string; bytes: number; createdAt: ISODateTime }

export interface OrgOverviewReport {
  range: { from: ISODate; to: ISODate };
  totals: { activeMembers: number; lessonsCompleted: number; reflectionsSubmitted: number; reflectionsAwaiting: number; milestonesAwarded: number; meetingsHeld: number };
  weeklyActivity: { weekStart: ISODate; activeMembers: number; lessonsCompleted: number; reflections: number }[];
  completionsByPathway: { pathwayId: Id<'pth'>; title: string; started: number; completed: number }[];
  responseTime: { bucket: '<1d' | '1-3d' | '3-7d' | '>7d'; count: number }[];
  attendanceByGroup: { groupId: Id<'grp'>; name: string; averageAttendance: number; meetings: number }[];
  milestonesByCategory: { category: MilestoneDefinition['category']; count: number }[];
  generatedAt: ISODateTime;
}

// Client-only types (not part of the API).
export interface DemoPersona { userId: Id<'usr'>; orgId: Id<'org'> | null; roles: Role[]; blurb: string }
