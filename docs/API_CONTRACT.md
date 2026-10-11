# API_CONTRACT.md

> Status: Phase 0 plan, awaiting review. This is the contract the frontend service layer (`src/lib/services`) assumes and the mock server (`src/mock-server`) implements. It is the brief for a future backend. Entity shapes are defined once in `src/types` (see FRONTEND_ARCHITECTURE.md §6); this document lists endpoints, inputs, outputs, authorisation and side effects. Where a payload is not spelled out, it is the named entity type.

---

## 1. Conventions

| Topic | Rule |
|---|---|
| Base | `/v1`, JSON (`application/json; charset=utf-8`), HTTPS only |
| Auth | Session cookie (`HttpOnly`, `Secure`, `SameSite=Lax`) or `Authorization: Bearer`; `401 unauthenticated` when absent/expired. The mock keeps a "current user" instead. |
| Tenancy | A request acts within the session's `activeOrgId` (or personal space). Org-scoped resources return `404` (not `403`) when the resource belongs to another org, to avoid leaking existence. |
| IDs | Opaque prefixed strings (`ref_01J…`), server-generated; clients may supply `clientId` on create for offline idempotency. |
| Time | UTC ISO 8601 with `Z`. Dates without time use `YYYY-MM-DD`. |
| Locale | `Accept-Language` selects system strings; user content is returned as authored. Response never contains pre-rendered English for system events: it uses `{ messageKey, params }`. |
| Pagination | Cursor based: `?limit=20&cursor=…` (default 20, max 100) → `Page<T> = { items, nextCursor, total? }`. Stable ordering documented per endpoint. |
| Filtering | Plain query params (`status=`, `lessonId=`, `q=`); multi-values comma separated. |
| Sorting | `sort=field` or `sort=-field`; only documented fields. |
| Includes | `include=a,b` expands relations to avoid N+1 (documented per endpoint); default responses are flat. |
| Concurrency | Entities with `version` use `If-Match: <version>`; mismatch → `409 conflict` with the current entity in `details.current`. Responses carry `ETag`. |
| Idempotency | Every `POST` that creates or triggers side effects accepts `Idempotency-Key` (UUID). The same key + same body returns the original response for 24 h. The offline outbox always sends one. |
| Partial update | `PATCH` uses JSON merge semantics on the documented fields; `PUT` replaces. |
| Rich text | `RichDoc` (ProseMirror JSON, limited schema: paragraph, heading 3-4, bold, italic, bullet/ordered list, blockquote, hard break, link, `scriptureRef` inline node). Server validates schema, size ≤ 200 KB, strips unknown nodes, stores JSON and a `plainText` projection. |
| Errors | `4xx/5xx` with `{ "error": { "code", "message", "fieldErrors"?, "requestId", "retryAfterMs"?, "details"? } }`. Codes: `unauthenticated` 401, `forbidden` 403, `not_found` 404, `validation_failed` 422, `conflict` 409, `rate_limited` 429, `unavailable` 503. |
| Rate limits | Headers `RateLimit-Limit/Remaining/Reset`; sensible per-route limits; stricter on auth and AI. |
| Deletion | Soft delete for user content (recoverable for 30 days) except where privacy requires hard delete; all deletes return `204`. |
| Audit | Admin and moderation actions create `AuditEvent`s (readable via `GET /organisations/:id/audit`). |
| Privacy | Visibility rules in PRODUCT.md §5 are enforced server-side on every read, list, search and notification. |
| Streaming | AI answers stream as Server-Sent Events (`text/event-stream`): events `chunk`, `citations`, `safety`, `done`, `error`. |
| Webhooks/realtime | Not required in v1; the client polls or refetches on focus. Realtime can be added later (SSE channel `/v1/events`). |

Notation: **Who** = roles allowed (`any` = authenticated; "mentor of" = assigned mentor; "leader of" = group leader; `self` = owner). **FX** = side effects the server must perform (the mock's domain engine implements these).

---

## 2. Auth and session

| Method & path | Who | Request | Response | FX |
|---|---|---|---|---|
| `POST /auth/sign-up` | public | `{ displayName, email, password, locale, timeZone, acceptTerms: true, ageConfirmed: true }` | `Session` | Creates user; welcome notification |
| `POST /auth/sign-in` | public | `{ email, password }` | `Session` | Rate-limited |
| `POST /auth/sign-out` | any | none | `204` | |
| `POST /auth/forgot-password` | public | `{ email }` | `202` always | Sends reset email (never reveals existence) |
| `POST /auth/reset-password` | public | `{ token, password }` | `204` | |
| `GET /session` | any | none | `Session` | |
| `PATCH /session/active-org` | any | `{ orgId: Id<'org'> \| null }` | `Session` | |
| `GET /me` / `PATCH /me` | self | `{ displayName?, bio?, country?, locale?, timeZone? }` | `User` | |
| `PUT /me/avatar` | self | `{ uploadId: Id<'upl'> \| null }` | `User` | |
| `GET /me/preferences` / `PUT /me/preferences` | self | `{ reader: { size, spacing, font }, reducedMotion: boolean \| null, theme: 'system'\|'light'\|'dark' }` | same | |
| `GET /me/export` | self | none | `202 { jobId }` then download link | Data export (UI stub in v1) |
| `DELETE /me` | self | `{ confirm: true }` | `204` | Account deletion (UI stub in v1) |

---

## 3. Organisations, members, invites

| Method & path | Who | Request | Response | FX |
|---|---|---|---|---|
| `POST /organisations` | any | `{ name, kind, country, defaultLocale }` | `Organisation` | Creator becomes `admin`; setup checklist; default groups none |
| `GET /organisations/:id` | member | none | `Organisation` | |
| `PATCH /organisations/:id` | admin | `{ name?, kind?, country? }` | `Organisation` | Audit |
| `PATCH /organisations/:id/branding` | admin | `{ accent?, welcomeMessage?, logoUploadId? }` | `Organisation` | Audit |
| `PATCH /organisations/:id/settings` | admin | partial `Organisation['settings']` | `Organisation` | Audit; changing AI/prayer defaults affects new content only |
| `GET /organisations/directory?q=` | any | `q` (min 3 chars) | `Page<{ id, name, kind, country }>` | Only orgs that opted into discovery |
| `POST /organisations/join` | any | `{ code }` | `Session` | Accepts invite or join code; adds membership with the invite's roles |
| `POST /organisations/:id/join-requests` | any | `{ message? }` | `202` | Notifies admins |
| `GET /invites/preview?code=` | public | `code` | `{ orgName, kind, roles, status }` | |
| `GET /organisations/:id/members` | admin, leader, mentor (own mentees only for `lastActiveAt`) | `q, role, status, groupId, cursor, limit` sort `name` | `Page<MemberSummary>` | |
| `PATCH /organisations/:id/members/:membershipId` | admin | `{ roles?: Role[], status?: 'active'\|'suspended' }` | `MemberSummary` | Audit; role removal revokes access to role-scoped data immediately; cannot remove last admin |
| `DELETE /organisations/:id/members/:membershipId` | admin, self | none | `204` | Reassigns/ends mentor assignments; audit |
| `GET /organisations/:id/invites` | admin | `status, cursor` | `Page<Invite>` | |
| `POST /organisations/:id/invites` | admin | `{ roles: Role[], email?: string, expiresInDays: 1..30, maxUses?: number }` | `Invite` | Email sent if `email`; audit |
| `POST /invites/:id/resend` | admin | none | `Invite` | |
| `DELETE /invites/:id` | admin | none | `204` | Revokes |
| `GET /organisations/:id/mentor-assignments` | admin, mentor | `mentorId?, menteeId?, status?` | `Page<MentorAssignment>` | |
| `POST /organisations/:id/mentor-assignments` | admin; mentor accepting a request | `{ mentorId, menteeId }` | `MentorAssignment` | Notifies both; creates timeline event |
| `DELETE /mentor-assignments/:id` | admin | none | `204` (ends assignment) | Mentor loses access to shared items going forward |
| `POST /organisations/:id/mentor-requests` | student | `{ note? }` | `202` | Notifies admins (solo/unassigned students) |
| `GET /organisations/:id/audit` | admin | `actorId?, action?, from?, to?, cursor` | `Page<AuditEvent>` | |

---

## 4. Groups, meetings, discussion, moderation

| Method & path | Who | Request | Response | FX |
|---|---|---|---|---|
| `GET /groups` | any | `scope=mine\|org\|led, archived?, q?` | `Page<Group>` | `org` shows only groups visible to the viewer |
| `POST /groups` | admin, leader | `{ name, description?, leaderIds, privacy, pathwayId?, schedule }` | `Group` | Audit |
| `GET /groups/:id` | member, admin | `include=members,nextMeeting` | `Group` (+ expanded) | |
| `PATCH /groups/:id` | admin, leader of | partial `Group` fields | `Group` | |
| `POST /groups/:id/archive` / `unarchive` | admin, leader of | none | `Group` | Threads become read-only |
| `GET /groups/:id/members` | member, leader, admin | `cursor` | `Page<GroupMemberView>` (`{ user, role, joinedAt }`, no private data) | |
| `POST /groups/:id/members` | admin, leader of | `{ userIds: Id<'usr'>[] }` | `Page<GroupMemberView>` | Notifies added users; may enrol in group pathway |
| `DELETE /groups/:id/members/:userId` | admin, leader of, self | none | `204` | |
| `GET /groups/:id/meetings` | member | `from?, to?, status?, cursor` sort `startsAt` | `Page<Meeting>` | |
| `POST /groups/:id/meetings` | leader of | `Omit<Meeting,'id'\|'version'\|'attendance'\|'status'> & { repeat?: { every: 'week'\|'2weeks'\|'month', until: ISODate } }` | `Meeting[]` | Reminder notifications scheduled |
| `PATCH /meetings/:id` | leader of | partial `Meeting` + `If-Match` | `Meeting` | Time change notifies members |
| `PUT /meetings/:id/attendance` | leader of | `{ attendance: { userId, present }[] }` | `Meeting` | Contributes to reports and milestone rules |
| `GET /groups/:id/threads` | member | `lessonId?, pinned?, cursor` sort `-lastPostAt` | `Page<DiscussionThread>` | |
| `POST /groups/:id/threads` | member (leader may pin) | `{ title, lessonId?, firstPost: RichDoc }` | `DiscussionThread` | Notifies group (digest-able) |
| `GET /threads/:id` | member | none | `DiscussionThread` | |
| `GET /threads/:id/posts` | member | `cursor` sort `createdAt` | `Page<DiscussionPost>` (hidden posts returned as tombstones for members, full for leader) | |
| `POST /threads/:id/posts` | member (not if locked) | `{ body: RichDoc, parentId?, sharedReflectionId? }` | `DiscussionPost` | Notifies thread participants; if `sharedReflectionId`, requires the reflection's visibility to be `group` for this group or sets it with confirmation; creates `discussion_shared` timeline event |
| `PATCH /posts/:id` | author | `{ body }` | `DiscussionPost` | Marks edited |
| `DELETE /posts/:id` | author, leader of | none | `204` | |
| `PUT /posts/:id/reaction` | member | `{ kind: 'amen'\|'thanks'\|'helpful' \| null }` | `DiscussionPost` | |
| `POST /reports` | member | `{ subject: EntityRef, reason, note? }` | `Report` | Notifies leader(s) |
| `GET /groups/:id/reports` | leader of | `status` | `Page<Report>` | |
| `POST /moderation/actions` | leader of | `{ subject: EntityRef, action: 'hide'\|'restore'\|'lock'\|'unlock'\|'pin'\|'unpin', reason? }` | `204` | Notifies post author (hide); audit |
| `PATCH /threads/:id` | leader of | `{ pinned?, locked?, title? }` | `DiscussionThread` | |

---

## 5. Pathways, lessons, quizzes (authoring and reading)

| Method & path | Who | Request | Response | FX |
|---|---|---|---|---|
| `GET /pathways` | any | `scope=library\|mine\|enrolled\|organisation, status?, q?, cursor` | `Page<Pathway>` | Students only see `published` |
| `POST /pathways` | mentor, admin | `{ title, summary, audience, level, locale, coverKey, tags, visibility, fromPathwayId? }` | `Pathway` | `fromPathwayId` duplicates a template |
| `GET /pathways/:id` | permitted | `include=outline,progress` | `Pathway & { outline: { modules: (Module & { lessons: LessonSummary[] })[] }, progress?: { completedLessons, totalLessons, currentLessonId } }` | |
| `PATCH /pathways/:id` | author | partial fields + `If-Match` | `Pathway` | |
| `PUT /pathways/:id/outline` | author | `{ modules: { id, title?, lessonIds: Id<'les'>[] }[] }` (full ordering; atomic) | outline | Reorders modules/lessons transactionally; the builder uses this for drag and for keyboard/button moves |
| `POST /pathways/:id/publish` | author | `{ notes? }` | `Pathway` | Validates checklist (every lesson has ≥ 1 block, estimated time > 0, scripture refs valid, video has captions) → `422` with reasons; increments `publishedVersion`; enrolled students stay on their `pathwayVersion` and see an "updated" notice |
| `POST /pathways/:id/unpublish` / `archive` | author, admin | none | `Pathway` | |
| `POST /pathways/:id/duplicate` | mentor, admin | `{ title? }` | `Pathway` | |
| `DELETE /pathways/:id` | author | none | `204` | Blocked if students are enrolled (archive instead) |
| `POST /pathways/:id/modules` | author | `{ title, summary? }` | `Module` | |
| `PATCH /modules/:id` / `DELETE /modules/:id` | author | `{ title?, summary? }` / none | `Module` / `204` | Delete moves lessons to a prompt-resolved target |
| `POST /modules/:id/lessons` | author | `{ title, summary, estimatedMinutes }` | `Lesson` | |
| `GET /lessons/:id` | permitted | `version?` | `Lesson` (quiz `correct` flags stripped for non-authors) | Counts as "opened" only via progress call |
| `PUT /lessons/:id` | author | `Lesson` editable fields (`title, summary, estimatedMinutes, blocks, completion`) + `If-Match` | `Lesson` | Validates blocks, scripture refs against WEB, media captions; autosave target |
| `DELETE /lessons/:id` | author | none | `204` | |
| `GET /lessons/:id/offline-manifest` | enrolled | none | `{ lessonId, version, assets: { url, bytes, type }[], totalBytes }` | Used by Downloads |
| `GET /lessons/:id/quiz` | enrolled | none | `Quiz` (no answers) | |
| `PUT /lessons/:id/quiz` | author | `Quiz` | `Quiz` | |
| `POST /quizzes/:id/attempts` | enrolled | `{ answers }` | `{ attempt: QuizAttempt, results: { questionId, correct, explanation, correctOptionIds? }[] }` | Unlimited attempts; best attempt counts; feeds lesson completion |

`LessonSummary = Pick<Lesson,'id'|'title'|'summary'|'position'|'estimatedMinutes'|'status'> & { progress?: LessonProgress['status'] }`.

---

## 6. Enrolment and progress

| Method & path | Who | Request | Response | FX |
|---|---|---|---|---|
| `GET /me/enrolments` | self | `status?` | `Enrollment[]` | |
| `POST /pathways/:id/enrol` | any (published, visible) | `{ groupId? }` | `Enrollment` | Timeline `pathway_started`; Today recomputed |
| `POST /enrolments/assign` | mentor of, leader of, admin | `{ pathwayId, userIds?: Id<'usr'>[], groupId?: Id<'grp'>, note?, startDate? }` | `Enrollment[]` | Notifies assignees |
| `PATCH /enrolments/:id` | self | `{ status: 'active'\|'paused' }` | `Enrollment` | |
| `GET /me/progress` | self | `pathwayId?` | `LessonProgress[]` | |
| `PUT /lessons/:id/progress` | self | `{ status: 'in_progress'\|'completed', lastBlockId? }` | `LessonProgress & { newMilestones: Milestone[] }` | On `completed`: timeline `lesson_completed`; milestone rules; if last lesson, enrolment `completed`, timeline `pathway_completed`; notifies mentor (digest); updates Today suggestion |
| `GET /me/today` | self | `date?` | `{ reading: { plan, ref: BibleRange } \| null, nextLesson: { pathwayId, lesson: LessonSummary, resumeBlockId } \| null, openReflection: Reflection \| null, dueVerses: number, recentFeedback: Feedback[], nextMeeting: Meeting \| null, newMilestone: Milestone \| null }` | Aggregated read model for the Today screen |
| `GET /reading-plans` / `PUT /me/reading-plan` | any / self | `{ planId }` | plan | Simple plans (Gospel of Mark in 30 days etc.) |

---

## 7. Reflections, feedback, comments

| Method & path | Who | Request | Response | FX |
|---|---|---|---|---|
| `GET /reflections` | any | `scope=mine\|inbox\|mentee\|group`, `lessonId?, pathwayId?, visibility?, status?, feedbackStatus?, menteeId?, groupId?, q?, cursor` sort `-updatedAt` (`inbox`: sort `submittedAt` ascending for waiting) | `Page<Reflection>` | `inbox` = shared with me as mentor, `group` = shared to groups I belong to; privacy enforced per row |
| `POST /reflections` | any | `{ clientId?, lessonId?, promptId?, title?, body: RichDoc, scriptureRefs?, visibility?: 'private', groupId? }` | `Reflection` (draft) | |
| `GET /reflections/:id` | self, permitted viewers | `include=feedback,lesson` | `Reflection & { feedback?: Feedback[], lesson?: LessonSummary }` | Marks first view by mentor (`seenAt`) |
| `PATCH /reflections/:id` | self | `{ title?, body?, scriptureRefs?, visibility?, groupId? }` + `If-Match` | `Reflection` | Visibility can widen only before response, can always narrow (withdraw) |
| `POST /reflections/:id/submit` | self | `{ visibility: 'mentor'\|'group', groupId? }` | `Reflection` | `status=submitted`; timeline `reflection_submitted`; notifies mentor(s) / group; sets `feedbackStatus=awaiting` (mentor) ; milestone rules; creates mentor attention item |
| `POST /reflections/:id/withdraw` | self | none | `Reflection` | Back to `private`; removes from inboxes; existing feedback retained for the author, hidden from others |
| `DELETE /reflections/:id` | self | none | `204` | |
| `GET /reflections/:id/feedback` | self, mentor of | none | `Feedback[]` | |
| `POST /reflections/:id/feedback` | mentor of | `{ body: RichDoc, shareableToGroup?: boolean, status: 'draft'\|'sent', aiDraftId?: string }` | `Feedback` | On `sent`: reflection `feedbackStatus=responded`; notify student; timeline `feedback_received`; clear attention item; AI-assisted flag recorded; **a human must send; the server rejects `status: 'sent'` with an AI draft that is byte-identical to the unedited draft** (anti-autosend guard) |
| `PATCH /feedback/:id` | author | `{ body?, status? }` | `Feedback` | Edits allowed for 15 min after sending (then new feedback) |
| `POST /feedback/:id/read` | student | none | `Feedback` | Sets `readAt` |
| `GET /comments` | permitted | `subjectType, subjectId, cursor` | `Page<Comment>` | |
| `POST /comments` | permitted | `{ subject, body: string ≤ 2000, parentId?, kind? }` | `Comment` | Notifies subject owner/participants |
| `PATCH /comments/:id` / `DELETE /comments/:id` | author (delete also moderator) | `{ body }` / none | `Comment` / `204` | |

---

## 8. Mentoring: dashboard, mentees, goals, check-ins, notes

| Method & path | Who | Request | Response | FX |
|---|---|---|---|---|
| `GET /mentor/attention` | mentor | `includeSnoozed?` | `AttentionItem[]` (sorted by priority then age) | Derived server-side from reflections awaiting > `reflectionResponseTargetDays`, no activity > `attentionAfterDays`, goals due ≤ 7 d, check-ins ≤ 48 h, unaffirmed milestones, pending AI approvals, prayer shared with mentor |
| `POST /mentor/attention/:id/snooze` | mentor | `{ days: 3\|7 }` | `AttentionItem` | |
| `GET /mentor/mentees` | mentor | `q, needsAttention?, cursor` | `Page<MenteeSummary>` (`{ user, assignment, currentPathway, lastReflectionAt, lastActiveAt, nextCheckInAt, awaitingCount }`) | |
| `GET /mentees/:id/overview` | mentor of | none | `{ user, pathways: Enrollment[], recentReflections: Reflection[] (shared only), goals: Goal[], milestones: Milestone[], nextCheckIn: CheckIn \| null }` | |
| `GET /users/:id/timeline` | self, mentor of (filtered by visibility) | `types?, from?, to?, cursor` sort `-occurredAt` | `Page<TimelineEvent>` | |
| `GET /goals` | self, mentor of | `userId?, status?` | `Goal[]` | |
| `POST /goals` | self; mentor of (for mentee) | `{ userId?, title, description?, targetDate?, steps, linked? }` | `Goal` | Mentor-set notifies mentee; mentee may decline/reframe |
| `PATCH /goals/:id` | owner, creator | partial + `If-Match` | `Goal` | On completion: timeline `goal_completed`, milestone rules, notifies mentor |
| `DELETE /goals/:id` | creator | none | `204` | |
| `GET /check-ins` | mentor, mentee | `menteeId?, from?, to?, status?` | `CheckIn[]` | |
| `POST /check-ins` | mentor of | `{ menteeId, scheduledAt, durationMin, mode, location?, agenda }` | `CheckIn` | Notifies mentee; adds reminders |
| `PATCH /check-ins/:id` | mentor of; mentee may request reschedule via comment | partial | `CheckIn` | `held` → timeline `checkin_held`; `sharedSummary` publishes to mentee |
| `GET /mentees/:id/notes` | **mentor author only** | `cursor` | `Page<SessionNote>` | Never exposed to mentee, leader or admin |
| `POST /mentees/:id/notes` | mentor of | `{ checkInId?, body: RichDoc, followUps }` | `SessionNote` | |
| `PATCH /notes/:id` / `DELETE /notes/:id` | author | partial + `If-Match` / none | `SessionNote` / `204` | |
| `POST /milestones/affirm` | mentor of | `{ userId, key, note? }` | `Milestone` | Notifies student; timeline `milestone_awarded` |

---

## 9. Prayer

| Method & path | Who | Request | Response | FX |
|---|---|---|---|---|
| `GET /prayer-requests` | any | `scope=mine\|mentor\|group\|organisation`, `groupId?, status?, cursor` sort `-createdAt` | `Page<PrayerRequest>` | Authorship stripped when anonymous; `scope=mentor` = shared with me as mentor |
| `POST /prayer-requests` | any | `{ body ≤ 1500, category?, privacy, groupId?, anonymous }` | `PrayerRequest` | Notifies audience per privacy (digest) |
| `GET /prayer-requests/:id` | permitted | none | `PrayerRequest` | |
| `PATCH /prayer-requests/:id` | author | `{ body?, category?, privacy?, anonymous? }` | `PrayerRequest` | Privacy can be narrowed at any time; widening re-confirms |
| `POST /prayer-requests/:id/answered` | author | `{ note? }` | `PrayerRequest` | Timeline `prayer_answered`; milestone rule; notifies supporters |
| `POST /prayer-requests/:id/archive` | author | none | `PrayerRequest` | |
| `PUT /prayer-requests/:id/support` | permitted viewer | `{ praying: boolean }` | `PrayerRequest` | Idempotent; counts only (names visible at group level and below) |
| `DELETE /prayer-requests/:id` | author | none | `204` | |
| Comments | | via `/comments` with `subject.type='prayer'` | | Short encouragements; moderated |

---

## 10. Bible, highlights, notes, memory verses

Scripture text is **static** and cacheable forever per version: it is served from the CDN, not computed.

| Method & path | Who | Request | Response | Notes |
|---|---|---|---|---|
| `GET /bible/translations` | any | none | `BibleTranslation[]` | v1: `web` only |
| `GET /bible/:translationId/books` | any | none | `BibleBook[]` | Immutable; `Cache-Control: public, max-age=31536000, immutable` |
| `GET /bible/:translationId/:bookId/:chapter` | any | none | `BibleChapter` | Frontend mock serves `/data/bible/web/{BOOK}/{chapter}.json` |
| `GET /bible/:translationId/passage` | any | `ref=JHN.3.16-18` | `{ range, verses: BibleVerse[] }` | Convenience for lessons, memory verses |
| `GET /bible/:translationId/search` | any | `q, book?, cursor` | `Page<{ range, snippet }>` | Stretch goal |
| `GET /me/highlights` | self | `book?, chapter?, color?, cursor` | `Page<Highlight>` | |
| `PUT /me/highlights` | self | `{ range, color }` | `Highlight` | Upsert on overlapping range; recolour idempotent |
| `DELETE /me/highlights/:id` | self | none | `204` | |
| `GET /me/verse-notes` | self | `book?, chapter?, q?, cursor` | `Page<VerseNote>` | |
| `POST /me/verse-notes` | self | `{ range, body: RichDoc, reflectionId? }` | `VerseNote` | |
| `PATCH /me/verse-notes/:id` / `DELETE` | self | `{ body }` + `If-Match` / none | `VerseNote` / `204` | |
| `POST /verse-notes/:id/promote` | self | none | `Reflection` (draft) | Turns a note into a reflection draft |
| `GET /me/memory-verses` | self | `state?, cursor` | `Page<MemoryVerse>` | |
| `POST /me/memory-verses` | self | `{ range, source }` | `MemoryVerse` | Server snapshots verse text; milestone rules (10 verses) |
| `DELETE /me/memory-verses/:id` | self | none | `204` | |
| `GET /me/memory-verses/due` | self | `limit` | `MemoryVerse[]` | Due now, ordered by `dueAt` |
| `POST /me/memory-verses/:id/reviews` | self | `{ rating: 'again'\|'hard'\|'good'\|'easy', reviewedAt? }` | `MemoryVerse` (next schedule applied) | SM-2-style scheduling server-authoritative; client may preview. Idempotent per `Idempotency-Key`. |

---

## 11. Milestones, notifications, search

| Method & path | Who | Request | Response | FX |
|---|---|---|---|---|
| `GET /milestone-definitions` | any | none | `MilestoneDefinition[]` | |
| `GET /me/milestones` | self | `cursor` | `Page<Milestone>` | |
| `GET /users/:id/milestones` | mentor of | none | `Milestone[]` | |
| `GET /notifications` | self | `unread?, kind?, cursor` sort `-createdAt` | `Page<Notification>` | |
| `GET /notifications/unread-count` | self | none | `{ count }` | |
| `POST /notifications/read` | self | `{ ids?: Id<'ntf'>[], all?: true }` | `{ count }` | |
| `GET /me/notification-preferences` / `PUT` | self | `NotificationPreferences` | same | |
| `GET /search` | any | `q (≥2 chars), types?, limit ≤ 20` | `SearchHit[]` grouped by type | Only returns what the viewer may read; reflections/journal only for self |

---

## 12. AI study companion

| Method & path | Who | Request | Response | FX |
|---|---|---|---|---|
| `GET /ai/status` | any | none | `{ enabled: boolean, mode: 'demo' \| 'live', disclosure: LocalisedMessage }` | `enabled` follows `Organisation.settings.aiCompanionEnabled` |
| `GET /ai/conversations` | self | `cursor` | `Page<AiConversation>` | |
| `POST /ai/conversations` | self | `{ context?: EntityRef, title? }` | `AiConversation` | |
| `GET /ai/conversations/:id/messages` | self | `cursor` | `Page<AiMessage>` | |
| `POST /ai/conversations/:id/messages` | self | `{ content ≤ 2000 }` | **SSE**: `chunk {text}` … `citations {BibleRange[]}`, `safety {'ok'\|'handoff'}`, `done {AiMessage}` | Responses grounded in lesson/passage context; safety hand-off for crisis/pastoral topics; rate-limited; logged without content in analytics |
| `DELETE /ai/conversations/:id` | self | none | `204` | |
| `POST /ai/share-requests` | self | `{ messageId, target: { type: 'reflection'\|'group', id }, note? }` | `ApprovalRequest` | Assigns to the student's mentor; if none, to an org admin-designated reviewer; notifies mentor; **content is not visible to anyone else until approved** |
| `GET /ai/approvals` | mentor, reviewer | `status=pending\|all, cursor` | `Page<ApprovalRequest>` | |
| `POST /ai/approvals/:id/decision` | assigned reviewer | `{ decision: 'approve'\|'decline', editedContent?, note? }` | `ApprovalRequest` | On approve: content appended to target with an "AI-assisted, reviewed by {mentor}" label; notifies student; audit |
| `POST /ai/feedback-drafts` | mentor of | `{ reflectionId }` | `{ draftId, suggestion: string, citations: BibleRange[] }` | Draft is **never** saved as feedback automatically; mentor must edit and send |

---

## 13. Reports (admin; aggregate only)

| Method & path | Who | Request | Response |
|---|---|---|---|
| `GET /organisations/:id/reports/overview` | admin | `from, to` | `OrgOverviewReport` |
| `GET /organisations/:id/reports/activity` | admin | `from, to, granularity=week` | `OrgOverviewReport['weeklyActivity']` |
| `GET /organisations/:id/reports/pathways` | admin | `from, to` | `OrgOverviewReport['completionsByPathway']` |
| `GET /organisations/:id/reports/response-time` | admin | `from, to` | `OrgOverviewReport['responseTime']` |
| `GET /organisations/:id/reports/groups` | admin | `from, to` | `OrgOverviewReport['attendanceByGroup']` |
| `GET /organisations/:id/reports/export` | admin | `from, to, format=csv` | `text/csv` |
| `GET /groups/:id/reports/summary` | leader of | `from, to` | `{ attendance, discussionActivity, lessonProgress }` (aggregates) |
| `GET /mentor/reports/summary` | mentor | `from, to` | `{ responseTimeMedian, reflectionsAnswered, checkInsHeld }` (own work) |

Rules: aggregates only, minimum cell size 3 for any breakdown that could identify a person; no endpoint returns reflection, prayer, note or conversation content to admins.

---

## 14. Uploads, offline sync, system

| Method & path | Who | Request | Response | Notes |
|---|---|---|---|---|
| `POST /uploads` | any | `{ purpose: 'avatar'\|'logo'\|'lesson_audio'\|'lesson_video'\|'lesson_caption', contentType, bytes, fileName }` | `{ upload: Upload, uploadUrl, headers }` (pre-signed) | Size/type limits per purpose; virus scan; captions required for video before publish |
| `POST /uploads/:id/complete` | any | none | `Upload` | |
| `POST /sync/batch` | any | `{ operations: { idempotencyKey, method, path, body, ifMatch? }[] }` | `{ results: { status, body }[] }` in order | Optional optimisation for the offline outbox; each operation behaves exactly as its standalone endpoint |
| `GET /health` | public | none | `{ status: 'ok', version }` | |
| `GET /me/devices` | self | | | Out of scope v1 |

---

## 15. Notification fan-out reference (for the backend team)

| Trigger | Recipients | `kind` | `messageKey` (params) |
|---|---|---|---|
| Reflection submitted to mentor | assigned mentor(s) | `reflection_shared` | `notif.reflection_shared` (`name`, `lesson`) |
| Feedback sent | reflection author | `feedback_received` | `notif.feedback_received` (`mentor`, `lesson`) |
| Reply in thread | thread participants | `discussion_reply` | `notif.discussion_reply` (`name`, `thread`) |
| Meeting in 24 h / 1 h | group members | `meeting_reminder` | `notif.meeting_reminder` (`group`, `time`) |
| Prayer answered / update | supporters | `prayer_update` | `notif.prayer_answered` |
| Milestone awarded | user | `milestone_awarded` | `notif.milestone` (`title`) |
| Assignment | assignees | `assignment` | `notif.assignment` (`pathway`) |
| AI share requested / decided | mentor / student | `ai_approval_request` / `ai_approval_result` | `notif.ai_request`, `notif.ai_result` |

Digests and quiet hours are applied by the server according to `NotificationPreferences`.

---

## 16. Contract test expectations

The same Vitest suite (`src/lib/services/__contract__`) runs against `MockTransport` and, later, a staging URL through `HttpTransport`. It must cover for every route group: success, `validation_failed` with `fieldErrors`, `forbidden` per role, `not_found`, `conflict` with `If-Match`, pagination (cursor stability, last page `nextCursor: null`), idempotent replay, and the privacy matrix from PRODUCT.md §5.
