# PRODUCT.md

> Status: Phase 0 plan, awaiting review. Working name: **Tessera** (see DESIGN.md §1 for alternatives). The name lives in one config file and in ICU message variables, so changing it is a one-line edit.

---

## 1. Vision

A discipleship platform where **one connected journey replaces a pile of separate tools**. A person reads a lesson, writes a reflection, talks it through with a group, receives a mentor's response, and later sees that whole thread as part of their own growth.

For churches, ministries and campus fellowships, it gives mentors a calm way to see who needs care. For individuals, it is a quiet, beautiful place to learn on their own.

### Product principles

1. **One thread, not many tabs.** Every artefact (reflection, comment, feedback, prayer, note, goal) is anchored to something: a lesson, a verse, a person, a meeting. Features feed each other.
2. **Formation, not performance.** We show milestones and completed goals. We never show a "spirituality score", rankings, leaderboards or guilt-driven streaks.
3. **Care before metrics.** Mentor tooling answers "who might need a word from me?", not "who is behind?".
4. **Private by default, shared on purpose.** Every shareable thing has an explicit visibility the author chose and can see.
5. **Quiet and fast.** Built for Android phones on slow data. Reading comes first. Nothing flashes, nothing nags.
6. **Honest.** AI is labelled as AI. Demo data is labelled as demo. No invented testimonials or user counts.

### Success looks like (for the demo, and for the product later)

- A mentor can go from opening the dashboard to sending feedback on a reflection in **under 60 seconds**.
- A student can finish "today" (reading, lesson, reflection) in **one sitting on a phone, one-handed**.
- Everything a student writes can be found again from one place, anchored to its lesson.

---

## 2. Personas

Names are fictional; they also seed the demo.

| Persona | Role | Context | What they need | What they fear |
|---|---|---|---|---|
| **Adaeze Okafor**, 24, Lagos | Student | New believer, completing NYSC service. Budget Android phone, prepaid data, intermittent power. | Short daily path, readable Scripture, offline lessons, a person to ask. | Feeling judged; wasting data; falling behind. |
| **Tomás Ferreira**, 41, Maputo | Student (self-directed) | Lifelong churchgoer, no formal mentor. Reads in Portuguese and English. | Structure on his own terms, a journal that stays private, memory verses. | A tool that nags or gamifies his faith. |
| **Grace Wanjiru**, 54, Nairobi | Mentor | Volunteer elder mentoring six people alongside a full-time job. Mostly phone, evenings. | A clear list of whom to encourage this week, fast feedback, private notes. | Missing someone who is quietly struggling. |
| **Kwabena Mensah**, 22, Accra | Group leader | Campus cell-group leader, also a student himself. | Prep for Thursday's meeting, a discussion that stays kind and on topic. | Awkward silence; a thread that goes sideways. |
| **Helena Costa**, 37, Luanda / Lisbon | Organisation admin | Ministry coordinator for 150 people across three groups. Laptop and phone. | Invite people, assign roles, see healthy aggregate reports without reading private content. | Privacy mistakes; chasing people by spreadsheet. |
| **Priya Nair**, 29, Bengaluru | Solo learner | No organisation; wants to try it alone before asking her church. | A personal space that works fully, plus a gentle path to invite a mentor later. | Being forced to join something. |

**Design consequence:** a user with no organisation gets a **personal space** (solo mode). Mentor and group features appear as invitations, never as dead ends.

---

## 3. The journey loop

```
 LESSON  ──►  REFLECTION  ──►  GROUP DISCUSSION  ──►  MENTOR FEEDBACK  ──►  VISIBLE GROWTH
   ▲            (journal)        (optional)            (optional)           (timeline, milestones,
   │                                                                          goals, dashboard)
   └──────────────────────────  next lesson / goal  ◄──────────────────────────────┘
```

### How the connections work (hard rules the build must honour)

| From | To | Mechanism |
|---|---|---|
| Lesson | Reflection | A lesson contains `reflectionPrompt` blocks. Tapping one opens the editor with the prompt quoted. The saved reflection stores `lessonId` and `promptId`. |
| Reflection | Journal | Every reflection (including free-writing) lives in one journal, filterable by lesson, pathway, verse and visibility. |
| Reflection | Mentor / Group | Author chooses visibility: **Private**, **My mentor**, **My group**. Changing it is explicit and reversible until someone has responded. |
| Reflection | Discussion | "Share to lesson discussion" posts an excerpt (or the whole reflection) into that lesson's thread for the author's group, linked back to the source. |
| Reflection | Feedback | A mentor's feedback attaches to the reflection and shows **in the lesson, in the journal and on the timeline**. |
| Lesson / Bible | Memory verse | Any scripture block or Bible selection can be added to memory verses with its source recorded. |
| Anything | Timeline | Each meaningful event creates a `TimelineEvent`. Shared items appear to those who can see them. |
| Events | Milestones | A rules engine awards milestones (for example "first reflection", "finished a pathway", "answered prayer recorded"). Mentors can also **affirm** a milestone by hand. |
| Everything | Mentor dashboard | "Needs attention" is derived from the same events: unanswered reflections, quiet members, upcoming check-ins, goals nearing their date. |
| AI companion | Everything | Private by default. Anything a student wants to share onward goes through a **mentor approval** first. |

### Worked example (the demo's spine; this is also the first Playwright journey)

1. **Grace** (mentor) builds *Foundations of Faith*, adds a lesson on "Grace", with a scripture block (Ephesians 2:8-9), a short audio reading, a reflection prompt and a 3-question quiz, then publishes it and assigns it to Adaeze.
2. **Adaeze** opens Today, sees "Lesson 3: Grace", reads and listens (downloaded earlier for offline), answers the quiz, then taps the reflection prompt. She writes, chooses **My mentor**, and submits.
3. The reflection appears in her journal, on her timeline ("Reflected on *Grace*"), and in Grace's **Feedback inbox** and dashboard. Grace gets a notification.
4. **Grace** opens it, reads it beside the lesson context, writes feedback, optionally affirms the milestone "First reflection shared", and sends.
5. **Adaeze** gets a notification. The feedback appears under her reflection, in the lesson, and on her timeline. Her dashboard card for "Adaeze" clears from "unanswered".
6. **Kwabena** (leader) sees the group's lesson discussion for "Grace" and the next meeting's agenda auto-linked to the lesson.

---

## 4. Growth model

**Shown**

- **Milestones**: moments of significance, awarded by rules or affirmed by a mentor. Each has a title, a one-line meaning, the source event, and a date. Examples: *First lesson finished*, *First reflection shared*, *Finished a pathway*, *Ten verses in memory*, *Read a whole Gospel*, *First answered prayer recorded*, *Led a discussion*.
- **Goals**: personal or mentor-set, with optional steps and a target date. Completed goals are celebrated on the timeline; unmet ones are quietly **paused or reframed**, never marked "failed".
- **Journey timeline**: a chronological, human-readable story of the person's engagement.

**Never shown or built**

- Any numeric "spirituality", "maturity" or "faith" score.
- Daily streaks, streak-loss warnings, "you broke your streak" copy, leaderboards, comparisons between people.
- Red "overdue" states on a student's own screens. Time-related items use neutral language ("Waiting for you", "Whenever you're ready").
- Public rankings in groups.

**Spaced repetition for memory verses** schedules reviews with an SM-2-style algorithm. Due items are offered gently ("3 verses ready to review"). There is no penalty for skipping.

**Mentor-only "quiet" signal.** Mentors see "Hasn't opened in 14 days" (threshold set by the org) as a prompt to reach out. Phrasing is about care ("Might be worth a message"), the signal is never shown to peers, and the student can see that their mentor sees last-active (disclosed in onboarding and Settings → Privacy).

---

## 5. Roles, lenses and visibility

Roles are **additive** on a membership: a person can be student + leader, or mentor + admin. The shell offers a **lens switcher** (Learn / Mentor / Lead / Admin) for people with more than one role. This is a real feature, separate from the **demo persona switcher**, which only exists in demo builds and swaps the whole signed-in user.

### Visibility matrix (enforced by the mock server, mirrored by the future backend)

| Item | Author | Assigned mentor | Group members | Group leader | Org admin |
|---|---|---|---|---|---|
| Reflection: Private | Full | None | None | None | None |
| Reflection: My mentor | Full | Full + feedback | None | None | None |
| Reflection: My group | Full | Full + feedback | Read + comment | Read + comment + moderate | None (counts only) |
| Mentor feedback | Read | Author | Only if reflection is group-shared and mentor marks feedback "shareable" | Same | None |
| Session notes | None by default; mentor may publish a **shared summary** to the mentee | Full | None | None | None |
| Prayer: Only me / Mentor / Group / Organisation | Full | Mentor-level and above | Group-level and above | Group-level and above | Organisation-level only |
| Prayer: anonymous | Full | Sees author only if level is "Mentor" | Cannot see author | Cannot see author | Cannot see author (v1) |
| Highlights, verse notes, memory verses | Full | None (unless shared into a reflection) | None | None | None |
| Last active | Own | Mentees only | None | Own group members | Aggregated; per-person only in member list |
| Journey timeline | Full | Milestones, goals, shared reflections, completed lessons | None | None | None |
| AI conversations | Full | Only what the student chooses to share, after approval | Same | Same | None |
| Reports | n/a | Own mentees, aggregated | n/a | Own group, aggregated | Org-wide, aggregated, never content |

**Key rule:** admins administer the organisation; they do not read people's spiritual writing.

---

## 6. System-wide states (every screen must define these)

| State | Standard | Rules |
|---|---|---|
| **Loading** | Skeleton shaped like the final content (not spinners) | Appears after 150 ms to avoid flicker; keeps layout stable; `aria-busy` on region; list skeletons use 3 to 6 rows. |
| **Empty** | Small original illustration, one calm sentence, one primary action | Differentiate *first-use empty* (inviting) from *filtered empty* ("Nothing matches. Clear filters"). |
| **Error** | Inline `ErrorState` with a plain-language message, a Retry button, and a request ID in a disclosure | Never a blank screen. Field errors sit next to fields, with a summary on submit. Partial failures degrade per-section. |
| **Offline** | Persistent slim banner "You're offline. Showing what's saved on this device." | Reads come from cache. Writes queue in the outbox with a visible "Will send when you're back online" state. Features that need a network are disabled with an explanation, not hidden. |
| **No access** | Explains why and offers the next step ("Ask your organisation admin") | Distinct from not-found. |
| **Saving / saved** | Inline status text ("Saving…", "Saved 10:42"), not toasts, for autosave | Toasts only for discrete actions that leave the page. |
| **Stale** | Subtle "Updated 5 min ago" with refresh when showing cached data | Shown on dashboards and reports. |

Per-screen sections below list only **additional or specific** states.

---

## 7. Screens

Format: **ID Name** (route). Purpose. Content. Notable states. Routes are defined fully in FRONTEND_ARCHITECTURE.md §4.

### 7.1 Marketing site (public, static, fully server-rendered)

Original copy, written in the build phase. No testimonials. No user counts. Product visuals are real renderings of the app UI with seed data, labelled "Sample data".

- **MK-1 Landing** (`/`). Purpose: explain the one-journey idea in 10 seconds and invite early access. Content: hero (headline about a journey that connects lesson to growth, product shot of Today), the loop as an interactive diagram (lesson → reflection → discussion → feedback → growth), three audience panels (people, mentors, churches), a "what we won't do" strip (no scores, no streaks, no selling data), FAQ, early-access form (UI only; stores locally). States: form validation, success.
- **MK-2 Features** (`/features`). Sections per capability: Pathways and lessons, Reflection and journal, Bible reader, Memory verses, Groups and prayer, Mentor care, Admin and privacy, AI companion (with approval model), Offline. Each: short copy + real UI crop.
- **MK-3 For churches** (`/for-churches`). Purpose: speak to pastors and coordinators. Content: setup in four steps, privacy promises (the visibility matrix in plain words), roles explained, reports shown as aggregate-only, a checklist for a pilot with one small group, contact/early-access form.
- **MK-4 Pricing** (`/pricing`). Proposed (draft, to be confirmed by you): *Personal* free; *Small group* free up to a member limit; *Organisation* priced per active member per month with a regional-pricing note. No checkout. Clearly labelled "Draft pricing". FAQ on cost, non-profits and data. States: currency/region toggle (UI only).
- **MK-5 About** (`/about`). Why this exists, principles (section 1), how we think about AI, an honest "what's built, what's coming" status, contact. No invented team photos; use text and illustration.
- **MK-6 Legal stubs** (`/privacy`, `/terms`): placeholder structure flagged "Draft, not legal advice".
- Shared: header with language switcher, footer, cookie-free (no analytics in demo), 404, 500.

### 7.2 Auth and onboarding (UI only)

- **AU-1 Sign in** (`/sign-in`). Email + password, "Continue as a demo person" list (demo builds), forgot link. Accessible-authentication friendly: paste allowed, no puzzles. States: invalid credentials (always succeeds in mock unless "error" persona), loading.
- **AU-2 Sign up** (`/sign-up`). Name, email, password with strength hint, language, terms. Age confirmation (see open question on minors).
- **AU-3 Forgot password** (`/forgot-password`). Email field, "Check your inbox" confirmation (simulated).
- **OB-1 Choose role** (`/onboarding/role`). Cards: *I'm here to grow*, *I guide others (mentor)*, *I lead a group*, *I run an organisation*. Multi-select allowed. Explains that roles can change later.
- **OB-2 Join or create organisation** (`/onboarding/organisation`). Tabs: Enter invite code / Find my church (by name) / Create an organisation / Continue on my own. Create flow: name, kind, country, language. States: invalid/expired code, org not found, pending approval.
- **OB-3 Pick first pathway** (`/onboarding/pathway`). Recommended pathways by role and experience (new to faith, returning, leader), each with duration, lesson count, a sample lesson preview. "Choose later" is always available.
- **OB-4 Welcome** (`/onboarding/done`). Sets expectations: language, offline lessons, notification choices (asked here, not on first load).

### 7.3 Student (lens: Learn, base path `/app`)

- **ST-1 Today** (`/app/today`). Purpose: one calm page of what to do now. Content: greeting by time of day; **Reading** (today's passage from the current plan, opens Bible reader); **Lesson** (next lesson with time estimate, resume point); **Reflection** (open prompt or draft, "Continue writing"); gentle "Verses ready to review" (only if due); recent feedback from mentor (if any, highlighted once); next group meeting; milestone just earned (one-time, dismissible). States: nothing assigned ("Choose a pathway"), all done today ("That's enough for today. Rest."), solo-mode variant with "Invite a mentor" card, offline (shows downloaded lesson).
- **ST-2 Journey hub** (`/app/journey`). Segmented: **Pathways** | **Timeline** | **Milestones and goals**. Pathways tab: current, available, completed.
- **ST-3 Pathway detail** (`/app/pathways/:id`). Content: summary, who it's for, outline (modules → lessons with status: not started, in progress, done), progress as a thread of nodes (no percentage badge competing for attention), author, "Download for offline" per module. States: not enrolled (Preview + Start), archived pathway (read-only), unpublished version notice.
- **ST-4 Lesson player** (`/app/pathways/:id/lessons/:lessonId`). Purpose: immersive, readable lesson. Content: block stream: rich text, scripture block (WEB, with "Open in Bible", "Add to memory"), audio (custom player, speed, sleep timer off by default), video (poster first, no autoplay, captions required), callouts, **reflection prompt** (opens the editor in a bottom sheet on mobile, side panel on desktop), **quiz** (inline), "Lesson discussion" and "Feedback" tabs at the end. Sticky minimal header with progress thread. Reader settings (size, line spacing). States: downloaded vs streaming, media failed (text transcript fallback), version updated while reading ("This lesson was updated. View changes"), completed state with next-step.
- **ST-5 Quiz** (inline in ST-4). Single choice, multi choice, true/false. Non-punitive: wrong answers show the explanation, unlimited retakes, no "failed" language. Results feed lesson completion rules set by the author (completion = viewed all blocks, quiz optional or required per lesson).
- **ST-6 Reflection editor** (`/app/journal/new?lessonId=&promptId=`, also in-lesson sheet). Rich text (headings off; bold, italic, lists, quote, scripture reference chips that link to the Bible reader), autosave to drafts, character-free (no word limit), prompt shown pinned, visibility selector with plain explanation of who sees what, "Submit to mentor" / "Save". States: draft restored, offline (queues), conflict (edited elsewhere: choose version), submitted (read-only unless withdrawn).
- **ST-7 Journal** (`/app/journal`). Chronological list of reflections and free entries; filters (lesson, pathway, visibility, has feedback), search over local text, grouping by month. States: first-use empty with a writing prompt of the day, filtered empty, many entries (paginated, virtualised after 100).
- **ST-8 Reflection detail** (`/app/journal/:id`). The entry, its lesson link, visibility and who has seen it, **feedback thread** (mentor), discussion shares, edit/withdraw/delete, add to memory verse, export as text.
- **ST-9 Bible reader** (`/app/bible/web/:book/:chapter`). WEB text with paragraph structure; verse tap/long-press selection → toolbar (highlight in four muted colours, add note, copy with reference, add to memory, share into reflection). Chapter navigation (swipe, buttons), book/chapter picker, text size and line spacing, reading position remembered, offline indicator per book. States: chapter not cached while offline, annotation save queued.
- **ST-10 Bible library and search** (`/app/bible`). Testaments → books → chapters grid, recent reading, jump by reference ("jn 3:16" parser), text search (stretch: local index).
- **ST-11 Highlights and notes** (`/app/bible/notes`). All highlights and notes grouped by book, filters by colour, tap to open in context, notes can become reflections.
- **ST-12 Memory verses** (`/app/bible/memorise`, review at `/app/bible/memorise/review`). Library with state per verse (new, learning, known), add by reference with preview. Review session: card shows reference or first words → recall → reveal → rate (*Again*, *Hard*, *Good*, *Easy*). Progress is counted per session ("5 reviewed") with no streak. States: nothing due ("All caught up. Next review on Thursday."), empty library with suggested verses from current pathway.
- **ST-13 Community: groups** (`/app/community`). Segmented **Groups** | **Prayer**. Group cards with next meeting and recent activity.
- **ST-14 Group space, member view** (`/app/groups/:id`). Next meeting + agenda, current lesson, recent discussion, members (names and roles only), prayer for the group.
- **ST-15 Lesson discussion** (`/app/groups/:id/discussions/:threadId`). Threaded, one level of replies, scripture reference chips, shared reflection excerpts shown as quoted cards, report button, kind-reminder guidelines pinned. States: locked thread, hidden post (moderated) placeholder, empty ("Be the first to share a thought").
- **ST-16 Prayer wall** (`/app/community/prayer`). Cards filtered by scope (mine, group, organisation) and status (open, answered). "I'm praying" action (counts only, no names beyond group level). States: no requests, privacy chip on every card.
- **ST-17 Prayer request compose and detail** (`/app/community/prayer/:id`). Compose: text, privacy level (Only me / My mentor / My group / Whole organisation), anonymous toggle, category (optional). Detail: updates, "Mark as answered" with a testimony note, supporters (count), encouraging messages (short, moderated).
- **ST-18 Timeline** (`/app/journey/timeline`). Vertical thread with dated events grouped by week: lessons completed, reflections, feedback received, milestones, goals, memory verses added, prayers answered. Filter by type. Each event deep-links to its source. States: new account (first events appear as you go), long history (windowed).
- **ST-19 Milestones and goals** (`/app/journey/milestones`). Earned milestones as a quiet shelf (title, date, why), upcoming ones described without percentages, goals with steps and target date; create a personal goal. Completed goals archive.
- **ST-20 Profile** (`/profile`). Name, avatar (monogram default), bio, country, languages, role badges, organisation(s), mentor (if any).
- **ST-21 Settings** (`/settings`). Sections: Account, Language and region, Appearance (theme, reading size), Notifications (channels and quiet hours), Privacy (who sees what, last-active disclosure, data export request UI), Offline storage (downloaded lessons and Bible books, sizes, remove), Demo data (reset, latency simulation, role switcher; demo builds only).
- **ST-22 AI study companion** (`/app/companion`, plus a panel inside lessons and the Bible). Always labelled "AI study companion · demo responses". Suggestions grounded in the current lesson or passage, with references. "Save to my journal" (private) or "Ask my mentor to approve sharing" (creates an `ApprovalRequest`). Safety: sensitive topics get a supportive hand-off to a mentor and local-help line placeholder. States: companion disabled by org, awaiting mentor approval, approved/rejected with note.
- **ST-23 Downloads** (`/app/downloads`). Downloaded lessons and Bible books, size on device, update-available markers, remove all. States: storage nearly full, download failed/resumable.

### 7.4 Mentor (lens: Mentor, base path `/mentor`)

- **MN-1 Dashboard: who needs attention** (`/mentor`). Purpose: the first screen answers "who might need me this week?" Content: ordered attention cards, each with the person, the reason in plain language, and one primary action. Reasons: *reflection waiting 3 days*, *hasn't opened in 14 days*, *goal date this week*, *check-in tomorrow*, *milestone to affirm*, *AI share awaiting approval*, *prayer request shared with you*. Below: "This week" strip (check-ins), recent activity, mentee roster shortcut. Dismiss/snooze per card (snooze 3/7 days; remembered). States: nobody needs attention ("Everyone's been looked after. Thank you."), no mentees yet (how assignment works), stale data indicator.
- **MN-2 Mentees** (`/mentor/mentees`). Searchable list with current pathway, last reflection, last active, next check-in; sort and filter (needs attention, no recent check-in). States: empty (not assigned), filtered empty.
- **MN-3 Mentee profile** (`/mentor/mentees/:id`, nested tabs). **Overview** (journey summary, current lesson, recent reflections shared, goals, milestones), **Journey** (timeline limited to what's visible), **Reflections** (shared ones, with response status), **Goals**, **Sessions** (check-ins and private notes). Persistent header: name, pathway, last active, "Message/Check-in" actions. States: nothing shared yet, visibility explainer ("Adaeze chooses what to share").
- **MN-4 Feedback inbox** (`/mentor/feedback`). Queue of shared reflections: Waiting | Responded | All, sorted oldest-waiting first, with lesson/pathway chips, excerpt, and age. Keyboard: j/k to move, Enter to open. States: empty ("No reflections waiting").
- **MN-5 Feedback on a reflection** (`/mentor/feedback/:reflectionId`). Two-pane on desktop (reflection + lesson context left; composer right), stacked on mobile. Composer: rich-text, quick phrases (own saved snippets), scripture chip insert, "Affirm a milestone" picker, "Make a goal from this", **AI draft assist** (produces a draft only; mentor must edit and send), send/save draft. Previous feedback thread below. States: draft saved, send failed (retry, nothing lost), reflection withdrawn by student, already answered by another mentor (co-mentor note).
- **MN-6 Check-ins and session notes** (inside MN-3 Sessions; `/mentor/mentees/:id/sessions/:checkInId`). Schedule a check-in (date/time in both time zones, mode), agenda from open goals and recent reflections, notes editor (private by default), optional **shared summary** pushed to the mentee, follow-up tasks. States: missed/rescheduled, notes autosave.
- **MN-7 Goals** (inside MN-3 Goals). Create/edit goal with steps and target date, link to lesson/reflection, mark complete (creates timeline event and optional milestone), pause or reframe.
- **MN-8 Pathway library** (`/mentor/pathways`). My drafts, published, organisation-shared, and the starter library; duplicate, archive. States: no pathways ("Start from a template or from scratch").
- **MN-9 Pathway builder** (`/mentor/pathways/:id`). Outline editor: modules and lessons, **reordering** by drag and by "Move up/down" buttons and a keyboard mode (a WCAG 2.2 dragging alternative), inline rename, status chips (draft, published with version), publish checklist (every lesson has content, estimated time set), assign. Desktop-first; mobile supports reorder, rename and preview, with block editing deferred to a simpler form. States: unsaved changes guard, publish blocked with reasons, concurrent edit warning (version).
- **MN-10 Lesson editor** (`/mentor/pathways/:id/lessons/:lessonId`). Block editor: add text, scripture (picker validated against bundled WEB), audio (upload stub), video (link/upload stub with caption requirement), callout, reflection prompt, quiz; reorder blocks; live preview pane; autosave drafts. States: invalid scripture ref, missing caption warning, media upload failing.
- **MN-11 Quiz editor** (inside MN-10). Question types single/multi/true-false, explanations required, optional pass rule, preview.
- **MN-12 Preview as student** (`/mentor/pathways/:id/preview`). Same lesson player with a "Preview" banner; progress isn't recorded; mobile/desktop toggle.
- **MN-13 AI approvals** (`/mentor/approvals`). Queue of AI-generated content a student wants to share (or a mentor drafted for group use). View source question, AI answer, scripture cited; **Approve**, **Edit then approve**, **Decline with note**. Nothing is visible to others until approved. States: empty, expired requests.
- **MN-14 Assign pathway** (modal from MN-2/MN-3/MN-9). Choose mentees/groups, optional start date and note.

### 7.5 Group leader (lens: Lead, base path `/leader`)

- **LD-1 Group space** (`/leader/groups/:id`). Next meeting with prep status, current lesson with discussion activity, members with participation hints phrased as care (not scoring), pinned announcement, prayer for the group, flagged posts.
- **LD-2 Schedule** (`/leader/groups/:id/schedule`). Meetings list and calendar month; create recurring meetings (weekly/biweekly), location or link, link a lesson, time-zone aware, reminders. States: no meetings, conflicting times warning.
- **LD-3 Discussion moderation** (`/leader/groups/:id/discussions`). Threads list, pin/lock, queue of reported posts with context, hide/restore with reason (author notified), post announcement, member guidelines editor. States: nothing flagged.
- **LD-4 Members** (`/leader/groups/:id/members`). Roster, roles within the group, add from organisation, remove with confirmation; attendance trend per person phrased neutrally.
- **LD-5 Meeting prep and notes** (`/leader/groups/:id/meetings/:meetingId`). Agenda builder (opening, Scripture, discussion questions pulled from the lesson, prayer), attendance (mark present), shared notes after the meeting. States: past meeting read-only, offline use at the meeting (attendance queues).

### 7.6 Organisation admin (lens: Admin, base path `/admin`)

- **AD-1 Overview** (`/admin`). Health at a glance, aggregate only: active members this month, lessons completed, reflections awaiting response, groups meeting. Setup checklist for new orgs (invite first members, create a group, assign mentors, choose branding).
- **AD-2 Members** (`/admin/members`). Table (virtualised) with search, role and status filters, bulk actions (change role, remove, resend invite). Row drawer **AD-3** shows roles, groups, mentor assignment, status; never content. States: pending invites tab, suspended members, CSV import (UI stub).
- **AD-4 Invites** (`/admin/invites`). Create invite links/codes with role and expiry, email invites list, revoke. States: expired, over-limit warning.
- **AD-5 Groups** (`/admin/groups`). Create/archive groups, assign leaders, set privacy and pathway, see sizes.
- **AD-6 Reports** (`/admin/reports`). Date-range controlled charts: weekly activity (line), lesson completions by pathway (bar), reflection response time (distribution), group meeting attendance (bar), milestone types awarded (stacked). Accessible alternatives: every chart has a data table toggle and a text summary. Export CSV (generated client-side from mock). States: not enough data ("Reports appear after a week of activity"), range with no data.
- **AD-7 Branding** (`/admin/branding`). Logo upload (stub), curated accent choices (each pre-checked for contrast in light and dark), welcome message, live preview of Today and sign-in.
- **AD-8 Settings** (`/admin/settings`). Default language, default prayer privacy, attention thresholds, AI companion on/off and approval requirement (cannot be turned off for shared content), data retention notes, audit log viewer.

### 7.7 Global surfaces

- **GL-1 Notifications centre** (`/notifications`, plus bell popover). Grouped by day; types: feedback received, reflection shared with you, discussion reply, group meeting reminder, prayer update, milestone, invite, AI approval result, system. Mark read/all, filter, deep links, per-type settings link. Notifications carry `messageKey` + params for localisation. States: empty, all read, load more.
- **GL-2 Command palette** (Ctrl/Cmd + K, also a search button on mobile). Sections: Go to (screens allowed for the current lens), Jump to Bible reference, Search journal, lessons, people (role-permitting), Actions (New reflection, Add memory verse, New pathway, Switch lens, Toggle theme, Reset demo data). Fully keyboard-operable; recent items; results labelled by type. States: no results, offline (local sources only).
- **GL-3 Lens and organisation switcher**. In the top bar (desktop) and in the "Me" sheet (mobile).
- **GL-4 Demo toolbar** (demo builds only). Persona switcher grouped by role, latency profile (instant, normal, slow 3G, flaky), simulate offline, reset demo data, "what's seeded" info. Collapsible, never covers primary controls.
- **GL-5 Offline page** (`/offline`). Shown for uncached navigations with links to downloaded content.
- **GL-6 Not found / no access / error boundary**. Friendly, with a way home and the request ID.
- **GL-7 Design gallery** (`/design`, noindex). Living component gallery (see DESIGN.md §10).

---

## 8. AI companion principles

1. **Labelled everywhere**: a persistent "AI" label and "Demo responses" label in the demo. Responses never imitate a human mentor's voice.
2. **Grounded**: answers cite the lesson or passage in view and use Scripture from the bundled WEB text. In the demo they are canned and authored by us through a mock service; the UI never claims real intelligence.
3. **Private by default, approved to share**: nothing AI-generated leaves the student's private space until a mentor approves it. Mentor-side AI drafts are never sent automatically; the mentor edits and sends in their own name.
4. **Humble about pastoral matters**: for grief, abuse, self-harm, crisis or doctrinal disputes, the companion declines to counsel and directs to a mentor and to local emergency resources (placeholder list to be localised).
5. **Org control**: admins can turn the companion off for the organisation.
6. **No training claims, no data claims** beyond what is true; the demo says exactly what it is.

---

## 9. Demo story the seed data must support

- **Organisation A: Lantern Hill Community Church** (fictional). About 48 members, 6 groups, 4 mentors, 1 admin, members from Nigeria, Kenya, Ghana, Rwanda, South Africa, Angola, Brazil, Portugal, Philippines, India, South Korea, Mexico and the UK.
- **Organisation B: Northgate Campus Fellowship** (fictional). Small, to demonstrate organisation switching and branding differences.
- **Personal space** (Priya) with no organisation.
- **Pathways** (real content, in plain, ecumenical language):
  1. *Foundations of Faith* (8 lessons)
  2. *Walking with Jesus: The Gospel of Mark* (10 lessons)
  3. *Learning to Pray* (6 lessons)
  4. *Leading a Small Group* (5 lessons, for leaders)
- **Activity**: three months of believable history across reflections, feedback, discussions, prayers, goals, milestones and check-ins, with a handful of deliberately open items (unanswered reflections, a quiet member, an upcoming check-in) so the mentor dashboard has something honest to show.
- **Scripture**: World English Bible (public domain), bundled per chapter.

---

## 10. Out of scope (this frontend effort)

- Any real backend, database, authentication, email/SMS/push delivery, file storage or payment processing.
- Real AI. The companion is a mock service with canned responses.
- Native iOS/Android apps (PWA only), live video meetings, in-app direct messaging between people, donations/giving, event ticketing.
- Translation of content into other languages. The i18n structure and locale plumbing are built for fr, pt, sw, yo, ha, ig; only English strings and content ship in the first release.
- Full SCORM/LMS interoperability, certificates, advanced moderation (appeals, automated detection), formal safeguarding workflows, GDPR tooling beyond UI stubs.
- Analytics and tracking. The demo ships none.
- Multi-user real-time collaboration (the demo is one browser, many personas).

## 11. Assumptions and open questions (see ROADMAP.md §Open decisions)

- Minimum age and safeguarding policy for minors: assumed 16+ for the UI copy; needs a decision.
- Whether an unassigned student can request a mentor from an org: assumed yes (request goes to the admin).
- Anonymous prayer is hidden from leaders and admins in v1; a safeguarding escalation path is a future backend concern.
- Lesson audio/video media for the demo: see ROADMAP open decisions.
