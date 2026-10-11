# FRONTEND_ARCHITECTURE.md

> Status: Phase 0 plan, awaiting review. Versions are "latest stable at scaffold time, pinned exactly"; exact numbers are recorded in `package.json` in Phase 1.

---

## 1. Key decisions

| # | Decision | Why | Alternative rejected |
|---|---|---|---|
| D1 | **A mock server sits behind a transport; services never touch IndexedDB directly.** UI → hooks → `services` → `ApiClient` → `Transport` (mock or http). | The contract in API_CONTRACT.md is exercised for real: the mock implements the same routes, validation, permissions, pagination and errors. Swapping to a backend replaces only the transport. | Services reading IndexedDB directly: faster to write, but the real API shape would never be tested and migration would touch every service. |
| D2 | **Marketing is static/RSC; the product app is a client-rendered shell** with TanStack Query. | Data lives in the browser (IndexedDB), which server components cannot read. Marketing gets best-in-class performance and SEO. When a real backend exists, individual routes can move to RSC + prefetch without API changes. | Server-rendering the app now: nothing to render against, extra complexity. |
| D3 | **Types are the contract.** `src/types` is written as the future API schema; Zod schemas for every request body live next to the services and are reused by the mock server for validation. | One source of truth for forms, mock validation and later server validation. | Hand-written ad-hoc interfaces per component. |
| D4 | **Seed data and Bible are static JSON assets, not bundled JS.** Loaded into IndexedDB on first run, per domain, with a version stamp. | Keeps the JS bundle small for slow Android data; assets are cacheable by the service worker. | Importing seed JSON into the bundle. |
| D5 | **Role-based route segments + a permission layer**, not one giant app with conditional UI. | Smaller bundles per lens, clearer ownership, mirrors backend authorisation. | Single `/app` with role conditionals everywhere. |
| D6 | **Design system first** with tokens and a `/design` gallery. | Consistency and speed afterwards; fulfils the quality bar. | Styling per feature. |
| D7 | **Heavy dependencies are always lazy**: Tiptap, Recharts, dnd-kit, cmdk (on first open), audio/video players. | Lighthouse 95+ and slow-data kindness. | Eager imports. |
| D8 | **pnpm, Node 22 LTS, TypeScript strict + `noUncheckedIndexedAccess`.** | Reproducible, fast CI. | npm/yarn. |

---

## 2. Stack

| Concern | Choice |
|---|---|
| Framework | Next.js (App Router), React 19, TypeScript strict |
| Styling | Tailwind CSS v4 configured through `@theme` from our CSS-variable tokens (see DESIGN.md §3); no component library theme |
| Primitives | Radix UI (restyled), `cmdk` (command palette), `vaul`-style sheet implemented on Radix Dialog + our gesture hook |
| Server state | TanStack Query v5 over services; `persistQueryClient` to IndexedDB |
| Client state | Zustand (small stores: session/lens, UI prefs, command palette, demo toolbar) |
| Forms | React Hook Form + Zod resolver |
| Rich text | Tiptap (ProseMirror), limited schema, JSON storage |
| Charts | Recharts behind a `Chart` wrapper (lazy) |
| Drag and drop | dnd-kit with keyboard sensor, plus non-drag controls |
| i18n | next-intl |
| PWA | Serwist (service worker) + web manifest |
| Local DB | `idb` (IndexedDB) with a thin typed repository |
| IDs/time | ULID-style prefixed IDs; `Intl` and `date-fns` (tree-shaken) |
| Icons | Phosphor (per-icon imports) + custom SVG set |
| Testing | Vitest + Testing Library + `jest-axe`; MSW for the http-transport contract tests; Playwright (+ `@axe-core/playwright`) |
| Lint/format | ESLint (flat) with `eslint-plugin-boundaries`, `eslint-plugin-jsx-a11y`, `tailwindcss` rules, custom no-hex/no-literal-strings rules; Prettier |
| CI/Deploy | GitHub Actions (typecheck, lint, unit, build, Playwright, Lighthouse CI); Vercel previews and production |

---

## 3. Folder structure

```
.
├─ docs/                      # these planning docs
├─ content/                   # authored source (committed)
│  ├─ seed/                   # JSON per domain: people, orgs, pathways, lessons, activity…
│  └─ README.md               # authoring rules, licences
├─ public/
│  ├─ data/
│  │  ├─ seed/v{n}/*.json     # built seed bundles (fetched on first run)
│  │  └─ bible/web/           # index.json + {BOOK}/{chapter}.json (1189 small files)
│  ├─ media/                  # demo audio (opus), posters, captions (vtt)
│  ├─ icons/ …                # PWA icons incl. maskable
│  └─ fonts/                  # only if not using next/font self-hosting
├─ scripts/                   # build-bible, build-seed, check-contrast, check-i18n
├─ messages/                  # i18n catalogues: en/{common,marketing,learn,mentor,lead,admin,errors}.json …
├─ src/
│  ├─ app/
│  │  └─ [locale]/
│  │     ├─ (marketing)/      # / , features, for-churches, pricing, about, privacy, terms
│  │     ├─ (auth)/           # sign-in, sign-up, forgot-password
│  │     ├─ (onboarding)/     # onboarding/role|organisation|pathway|done
│  │     ├─ (shell)/          # authenticated shell layout
│  │     │  ├─ app/           # Learn lens
│  │     │  ├─ mentor/        # Mentor lens
│  │     │  ├─ leader/        # Lead lens
│  │     │  ├─ admin/         # Admin lens
│  │     │  ├─ notifications/ settings/ profile/
│  │     ├─ design/           # component gallery
│  │     ├─ offline/
│  │     └─ not-found.tsx, error.tsx, global-error.tsx
│  ├─ components/
│  │  ├─ ui/                  # Tier 1 primitives (no data, no services)
│  │  ├─ patterns/            # Tier 2 (EmptyState, ErrorState, PageHeader…)
│  │  └─ icons/               # custom SVG icons
│  ├─ features/               # vertical slices; each owns its UI, hooks, schemas
│  │  ├─ lessons/ pathways/ reflections/ journal/ feedback/ bible/ memory/
│  │  ├─ groups/ discussions/ prayer/ timeline/ milestones/ goals/
│  │  ├─ mentees/ checkins/ builder/ approvals/ companion/
│  │  ├─ members/ invites/ reports/ branding/
│  │  ├─ notifications/ search/ onboarding/ auth/ session/ offline/
│  │  └─ (each: components/, hooks/ (queries+mutations), schemas.ts, index.ts)
│  ├─ lib/
│  │  ├─ api/                 # ApiClient, Transport interface, http-transport, errors, pagination
│  │  ├─ services/            # one file per domain; the ONLY place UI-facing code calls the API
│  │  ├─ query/               # QueryClient, keys, persistence, offline mutation defaults
│  │  ├─ permissions/         # can(), policies, <Can>
│  │  ├─ i18n/                # config, formatters, pseudo-locale
│  │  ├─ offline/             # outbox, downloads, storage manager, online status
│  │  ├─ bible/               # reference parser, loaders, verse utils
│  │  ├─ srs/                 # spaced-repetition algorithm (pure)
│  │  ├─ editor/              # Tiptap schema, serialisers (RichDoc ⇄ text)
│  │  ├─ a11y/ , motion/, utils/
│  ├─ mock-server/            # NOT imported by UI; only by lib/api/mock-transport
│  │  ├─ db/                  # IndexedDB schema, migrations, repositories, seed loader, reset
│  │  ├─ routes/              # one handler per API route group (mirrors API_CONTRACT)
│  │  ├─ engine/              # milestone rules, notification fan-out, timeline, attention
│  │  ├─ ai/                  # canned companion responses + streaming simulator
│  │  ├─ policies/            # authorisation (shares logic with lib/permissions)
│  │  └─ index.ts             # createMockTransport(options)
│  ├─ styles/                 # tokens.css, base.css, prose.css
│  ├─ types/                  # domain types = API schema (see §6)
│  ├─ config/                 # brand.ts, env.ts (zod-validated), feature flags, roles, nav
│  └─ test/                   # test utils, factories, msw handlers, setup
├─ e2e/                       # Playwright specs and page objects
├─ CLAUDE.md
└─ package.json, next.config.ts, tsconfig.json, eslint.config.mjs, playwright.config.ts, vitest.config.ts
```

### Import rules (enforced by `eslint-plugin-boundaries`)

```
app  →  features, components, lib, config, types
features → components, lib (services via hooks only), config, types   (never other features' internals; use their index.ts)
components/ui, components/patterns → lib/a11y|utils|motion, types   (never services, features, or next/navigation data hooks)
lib/services → lib/api, types only   (no React, no stores)
lib/api → types, config; dynamically imports mock-server ONLY when NEXT_PUBLIC_API_MODE=mock
mock-server → types, lib/permissions (shared pure policy), lib/srs, lib/editor (pure) ; never React
```

UI code can never import `mock-server` or `idb`. A CI check greps the production (`API_MODE=http`) build to prove `mock-server` is absent from the bundle.

---

## 4. Routing map

`next-intl` with `localePrefix: 'as-needed'`: English has no prefix; others use `/fr/…`, `/pt/…`, `/sw/…`, `/yo/…`, `/ha/…`, `/ig/…`. Routes below are shown without locale.

### Public

| Route | Screen | Rendering |
|---|---|---|
| `/` | MK-1 Landing | Static (SSG) |
| `/features`, `/for-churches`, `/pricing`, `/about` | MK-2…5 | SSG |
| `/privacy`, `/terms` | MK-6 | SSG |
| `/sign-in`, `/sign-up`, `/forgot-password` | AU-1…3 | Client forms in static shell |
| `/onboarding/role` → `/organisation` → `/pathway` → `/done` | OB-1…4 | Client |
| `/offline` | GL-5 | Static, precached |
| `/design` | GL-7 | Static, noindex |

### Learn lens (`/app`)

| Route | Screen |
|---|---|
| `/app/today` | ST-1 |
| `/app/journey` , `/app/journey/timeline`, `/app/journey/milestones` | ST-2, 18, 19 |
| `/app/pathways/[pathwayId]` | ST-3 |
| `/app/pathways/[pathwayId]/lessons/[lessonId]` (`?block=`, `?panel=reflect|discuss|feedback|companion`) | ST-4/5 |
| `/app/journal`, `/app/journal/new` (`?lessonId&promptId`), `/app/journal/[reflectionId]` | ST-7, 6, 8 |
| `/app/bible` , `/app/bible/[translation]/[book]/[chapter]` (`?v=3-5`) | ST-10, 9 |
| `/app/bible/notes`, `/app/bible/memorise`, `/app/bible/memorise/review` | ST-11, 12 |
| `/app/community`, `/app/community/prayer`, `/app/community/prayer/[requestId]` | ST-13, 16, 17 |
| `/app/groups/[groupId]`, `/app/groups/[groupId]/discussions/[threadId]` | ST-14, 15 |
| `/app/companion`, `/app/downloads` | ST-22, 23 |

### Mentor lens (`/mentor`)

| Route | Screen |
|---|---|
| `/mentor` | MN-1 Attention dashboard |
| `/mentor/mentees`, `/mentor/mentees/[menteeId]` (+ `/journey`, `/reflections`, `/goals`, `/sessions`, `/sessions/[checkInId]`) | MN-2, 3, 6, 7 |
| `/mentor/feedback`, `/mentor/feedback/[reflectionId]` | MN-4, 5 |
| `/mentor/approvals` | MN-13 |
| `/mentor/pathways`, `/mentor/pathways/[pathwayId]`, `/…/lessons/[lessonId]`, `/…/preview` | MN-8…12 |

### Lead lens (`/leader`)

| Route | Screen |
|---|---|
| `/leader` (group picker/home) , `/leader/groups/[groupId]` | LD-1 |
| `/leader/groups/[groupId]/schedule`, `/discussions`, `/members` | LD-2, 3, 4 |
| `/leader/groups/[groupId]/meetings/[meetingId]` | LD-5 |

### Admin lens (`/admin`)

`/admin` · `/admin/members` · `/admin/invites` · `/admin/groups` · `/admin/reports` · `/admin/branding` · `/admin/settings` (AD-1…8; member drawer via `?member=<id>`).

### Shared (any lens)

`/notifications` · `/settings` (+ `/settings/[section]`) · `/profile` (own) · `/profile/[userId]` (permitted views).

### Guards and layouts

- `(shell)/layout.tsx`: hydrates session, mounts providers (Query, Session, Intl, Toast, Offline, Command palette, Demo toolbar), renders `AppShell`.
- Each lens has a `layout.tsx` with `<RoleGuard role="mentor">`: redirects to the right lens or shows "No access". No page assumes access.
- Unauthenticated users go to `/sign-in?next=`; users without an organisation or pathway are routed into onboarding (solo allowed).
- Each segment has `loading.tsx` (skeleton), `error.tsx` (ErrorState) and `not-found.tsx` as needed.

### Rendering strategy for performance

- Marketing: SSG, zero client JS beyond islands (language switcher, FAQ disclosure, early-access form).
- App shell: small shared client chunk; each lens and heavy feature is a separate chunk; route prefetching on intent.
- Targets (Moto G Power class device, simulated Slow 4G): LCP ≤ 2.5 s on `/app/today` after first visit and ≤ 3.0 s cold; JS on Today ≤ 170 KB gzipped; INP ≤ 200 ms; CLS ≤ 0.05. Marketing: LCP ≤ 1.8 s, total JS ≤ 60 KB.

---

## 5. Layered architecture and data flow

```
 React components (features/*)
        │ call hooks
        ▼
 Query/mutation hooks (features/*/hooks)      ← TanStack Query keys, cache, optimistic updates
        │ call
        ▼
 lib/services/*   (typed async API, no UI knowledge, returns domain types, throws ApiError)
        │ call
        ▼
 lib/api/ApiClient  (request building, zod response parse in dev, error mapping, retry policy, idempotency keys)
        │ uses
        ▼
 Transport interface  ─┬─ HttpTransport  (fetch → real backend, later)
                       └─ MockTransport  (in-process router → mock-server → IndexedDB)
```

### 5.1 Transport interface

```ts
// lib/api/transport.ts
export interface ApiRequest {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;                       // '/v1/reflections/ref_…'
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: Record<string, string>;   // Idempotency-Key, If-Match, Accept-Language
  signal?: AbortSignal;
}
export interface ApiResponse<T> { status: number; data: T; headers: Record<string, string> }
export interface Transport { request<T>(req: ApiRequest): Promise<ApiResponse<T>> }
```

`lib/api/index.ts` picks the transport from `NEXT_PUBLIC_API_MODE` (`mock` default for this project, `http` later with `NEXT_PUBLIC_API_BASE_URL`). The mock is loaded with a dynamic import so it is tree-shaken from `http` builds.

### 5.2 Services

One file per domain, each exporting a plain object of async functions. They are the **only** API the rest of the app uses.

```ts
// lib/services/reflections.ts
export const reflectionsService = {
  list(params: ListReflectionsParams): Promise<Page<Reflection>>,
  get(id: Id<'ref'>): Promise<Reflection>,
  create(input: CreateReflectionInput): Promise<Reflection>,
  update(id, patch: UpdateReflectionInput, version: number): Promise<Reflection>,  // autosave, optimistic concurrency
  submit(id, input: SubmitReflectionInput): Promise<Reflection>,
  withdraw(id): Promise<Reflection>,
  remove(id): Promise<void>,
};
```

Service modules (mirrors API_CONTRACT groups): `session`, `users`, `organisations`, `members`, `invites`, `mentorAssignments`, `groups`, `meetings`, `discussions`, `moderation`, `pathways`, `modules`, `lessons`, `quizzes`, `enrolments`, `progress`, `reflections`, `feedback`, `comments`, `prayer`, `bible` (static reads + annotations), `memory`, `goals`, `checkIns`, `sessionNotes`, `milestones`, `timeline`, `notifications`, `search`, `ai`, `reports`, `uploads`, `offline`, `sync`.

Rules: services never import React, never read stores, never format for display, never touch IndexedDB. Input and output types come from `src/types`; input is validated by Zod schemas in `features/*/schemas.ts` (UI) and again by the mock server (as the real server will).

### 5.3 Mock server (`src/mock-server`)

An in-process implementation of the contract.

- **Router**: a tiny pattern matcher registering handlers per `METHOD /v1/path/:param`. Handlers are thin: parse → authorise → repository calls → domain engine → respond.
- **Session**: the "signed-in" user id is stored by the mock auth; every request carries it so authorisation policies run exactly as a server would. The demo persona switcher changes this identity.
- **Database**: IndexedDB (`idb`), one object store per entity with indexes for the access patterns (by org, by user, by lesson, by status, by createdAt). Single DB name `tessera-demo`, with `schemaVersion` (structure) and `seedVersion` (content).
- **Seed loader**: on first run (or after reset) fetches `/data/seed/v{n}/*.json` in dependency order and bulk-inserts in a transaction, showing a branded "Preparing your demo" screen with real progress. Idempotent and resumable.
- **Migrations**: `schemaVersion` bumps run additive migrations preserving user changes. A `seedVersion` bump shows a non-blocking notice "Demo content updated. Reset to see the new content", never silently wipes the user's work.
- **Reset**: `Settings → Demo data → Reset` and command palette action; deletes the DB, clears query cache and outbox, reseeds, returns to the persona picker. Confirmation required.
- **Domain engine** (the "side effects" in API_CONTRACT): a small in-process event bus. E.g. `reflection.submitted` → create notification for the mentor, write a timeline event, evaluate milestone rules; `feedback.sent` → notify student, timeline event, clear attention flags; `lesson.completed` → progress, timeline, milestones, advance Today suggestion.
- **Pagination**: opaque cursors (base64 of sort key + id), `limit` default 20, max 100, stable ordering, `total` only where cheap.
- **Latency & failure simulation**: profiles `instant` (tests), `normal` (80-300 ms, default), `slow3g` (800-2500 ms), `flaky` (15% retryable `unavailable`/timeouts), `offline` (throws `offline`). Per-request override header `x-mock-latency`, `x-mock-fail` for tests and Playwright. Writes can be set to fail once to demo error handling.
- **Cross-tab**: a `BroadcastChannel` tells other tabs to invalidate affected query keys after writes.
- **Time**: handlers use an injectable clock so seed activity is relative to "now" (seed stores offsets like `-3d`, resolved on load) and tests are deterministic.
- **Streaming (AI)**: `POST /v1/ai/conversations/:id/messages` returns an `AsyncIterable<AiChunk>` from the mock; the http transport will expose the same via SSE. `ApiClient.stream()` normalises both.

### 5.4 Errors

```ts
export class ApiError extends Error {
  code: ErrorCode; status: number; fieldErrors?: Record<string, string[]>;
  requestId: string; retryable: boolean; retryAfterMs?: number;
}
```

Query defaults: retry only `retryable` errors (max 2, exponential backoff + jitter), never retry 4xx. UI maps `code` to messages in `messages/*/errors.json`; field errors are bound to RHF via a helper.

### 5.5 Swapping to a real backend (the checklist)

1. Implement the endpoints in API_CONTRACT.md.
2. Set `NEXT_PUBLIC_API_MODE=http`, `NEXT_PUBLIC_API_BASE_URL`.
3. Implement `HttpTransport` (already scaffolded: fetch, credentials, JSON, error mapping, SSE for AI, `Idempotency-Key`, `Accept-Language`).
4. Run the shared **contract test suite** (Vitest) against both transports; the same tests must pass against the mock and a staging API.
5. Remove `src/mock-server` and `public/data/seed` from production builds (already excluded by mode). No component or hook changes.

---

## 6. Data types (the API contract in TypeScript)

Written as the future API schema. All timestamps are UTC ISO 8601 strings; all IDs are opaque prefixed strings; list endpoints return `Page<T>`; every mutable entity has `version` for optimistic concurrency where concurrent edits are plausible. Localisable user-facing strings in system objects use `messageKey` + `params`.

### 6.1 Common

```ts
// types/common.ts
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
```

### 6.2 People and organisations

```ts
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
```

### 6.3 Groups, meetings, discussion

```ts
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
```

### 6.4 Learning content

```ts
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
```

### 6.5 Reflection, feedback, comments

```ts
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
```

### 6.6 Prayer

```ts
export type PrayerPrivacy = 'only_me' | 'mentor' | 'group' | 'organisation';
export interface PrayerRequest {
  id: Id<'pry'>; orgId: Id<'org'> | null; authorId: Id<'usr'> | null;   // null in responses when anonymous to the viewer
  anonymous: boolean; body: string; category: 'health' | 'family' | 'work' | 'faith' | 'community' | 'thanks' | 'other' | null;
  privacy: PrayerPrivacy; groupId: Id<'grp'> | null; status: 'open' | 'answered' | 'archived';
  supporterCount: number; iAmPraying: boolean; answeredNote: string | null; answeredAt: ISODateTime | null;
  createdAt: ISODateTime; updatedAt: ISODateTime;
}
```

### 6.7 Bible, notes, memory

```ts
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
```

### 6.8 Mentoring, goals, growth

```ts
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
```

### 6.9 Notifications, AI, reports, system

```ts
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
```

### 6.10 Client-only types (not part of the API)

`OutboxItem`, `DownloadedPackage { lessonId, version, bytes, assets[], downloadedAt }`, `ReaderPreferences`, `DemoSettings { persona, latencyProfile, offlineSimulated }`, `DraftRecord`.

---

## 7. State management

| Kind | Tool | Notes |
|---|---|---|
| Server data | TanStack Query | Keys from a typed factory per domain (`qk.reflections.list(params)`). `staleTime` tuned per domain (Bible chapters: infinity; dashboards: 60 s). |
| Mutations | `useMutation` with `networkMode: 'offlineFirst'` | Paused offline mutations persist in the query cache and in the outbox (§11); optimistic updates with rollback. |
| Session, lens, org | Zustand `sessionStore` (persisted) + `useSession()` | Source of truth is `GET /v1/session`; the store caches it. |
| UI prefs | Zustand `prefsStore` (persisted, localStorage with safe wrapper) | theme, reader size, spacing, reduced motion, shortcuts on/off |
| Ephemeral UI | Component state / URL | Filters, tabs, selected verse range live in the URL where shareable. |
| Forms | React Hook Form | Draft autosave through `useAutosaveDraft` (IndexedDB `drafts` store, keyed by form + entity). |
| Command palette | Zustand `paletteStore` + registry | Features register commands via `useRegisterCommands()`; permission-filtered. |

Conventions: no server data in Zustand; no `useEffect` fetching; mutations always invalidate or patch specific keys; a `useIsOffline` hook reads a single connectivity store (navigator online + transport failures + demo toggle).

---

## 8. Permissions

`lib/permissions` exports pure functions shared by UI and mock server:

```ts
can(ctx: { user: User; memberships: Membership[]; orgId; assignments; groupMemberships }, action: Action, resource?): boolean
// Action examples: 'reflection:read', 'reflection:feedback', 'pathway:publish', 'member:changeRole', 'report:view', 'prayer:read', 'ai:approve'
```

- `<Can action resource>` and `useCan()` hide or disable UI with an explanation; **the mock server re-checks every request** and returns `forbidden`, so UI hiding is never the only guard (mirrors production).
- Visibility rules from PRODUCT.md §5 are encoded as policy tests (a table-driven Vitest suite, one row per matrix cell).

---

## 9. Forms and validation

- Zod schemas live in `features/*/schemas.ts`, export inferred input types that match `types` request shapes, and are reused by the mock server routes for validation.
- RHF with `zodResolver`; shared `Field`, error summary and focus-first-error helper; server `fieldErrors` mapped back to fields.
- Rich text is validated structurally (allowed nodes/marks, max size) and sanitised on the way in and out. Plain-text projection (`plainText`) is computed by `lib/editor` for search, excerpts and notifications.
- Autosave: debounced 1.5 s, save on blur/hidden, versioned writes (`If-Match`), conflict dialog with side-by-side choice.

---

## 10. Internationalisation (next-intl)

- Locales: `en` now; `fr`, `pt`, `sw`, `yo`, `ha`, `ig` scaffolded (directories with empty catalogues falling back to `en`) plus a dev-only **pseudo-locale** `en-XA` (accents + 40% expansion) to catch hard-coded and overflowing strings.
- Catalogues split by namespace and area (`messages/en/learn.json` etc.); a route only ships the namespaces it uses (`getRequestConfig` + per-layout `NextIntlClientProvider` with picked messages).
- ICU MessageFormat for plurals/select/ordinals (Hausa, Yoruba, Igbo, Swahili have different plural rules; ICU handles them). No string concatenation. Brand name passed as `{appName}`.
- All system-generated text from the backend/mock is key-based (`LocalisedMessage`), never pre-rendered English.
- Formatting: `Intl.DateTimeFormat`, `NumberFormat`, `RelativeTimeFormat`, `ListFormat`, `Collator` via helpers; user time zone from profile.
- Content (pathways/lessons) carries `locale`; Bible `BibleTranslation.language` allows language-specific translations later (candidate public-domain texts to verify licences: French Louis Segond 1910, Portuguese Almeida, Swahili Union Version, Yoruba/Hausa/Igbo older translations). None are bundled in v1.
- CI scripts: `check-i18n` (missing/unused keys, ICU validity, no literal JSX strings via ESLint rule) and a Playwright pass in `en-XA`.
- Locale switcher on marketing and in Settings; the `lang` attribute and `hreflang` on marketing pages. RTL is not a v1 requirement but logical CSS properties (`margin-inline`, etc.) are used throughout so it can be added.

---

## 11. PWA and offline

**Installability**: web manifest (name from brand config, `display: standalone`, theme colours for light/dark, maskable and monochrome icons, shortcuts: *Today*, *New reflection*, *Bible*), install prompt surfaced only after a successful lesson, never on first load.

**Service worker (Serwist)**

| Resource | Strategy |
|---|---|
| App shell, JS/CSS (hashed) | Precache |
| Navigations | NetworkFirst with 3 s timeout → cached shell → `/offline` |
| Fonts, icons, illustrations | CacheFirst (long-lived) |
| `/data/bible/web/**` | CacheFirst; entire books cached when the user opts to download; recently read chapters cached automatically (LRU cap) |
| `/data/seed/**` | StaleWhileRevalidate (first-run only) |
| `/media/**` | Only cached when downloaded explicitly (range-request support for audio via `RangeRequestsPlugin`) |
| Mock API | Not network traffic: it is in-process; offline simulation is done at the transport |

**Offline lessons**: "Download" on a lesson/module stores the lesson JSON (including quiz and prompts), referenced Bible chapters and audio (opt-in, shows size first) in Cache Storage + an IndexedDB manifest (`DownloadedPackage` with version). Offline view: Today and Journey show a "Downloaded" filter; lessons render from the package; reflections, progress and highlights write to the **outbox**.

**Outbox**: every mutation made offline is stored with an idempotency key, retried in order when connectivity returns (online event, visibility change, Background Sync where available). UI shows per-item "Waiting to send", "Sent", or an actionable failure; nothing is ever silently dropped. Conflicts use versions; last-writer-wins only for idempotent preferences.

**Storage manager**: reads `navigator.storage.estimate()`, shows usage per item, asks for `persist()` after the first download, and handles quota errors gracefully.

**Updates**: new SW waits; a calm "A new version is ready. Update" banner applies at a safe moment (never mid-edit; unsaved drafts are in IndexedDB anyway).

**Platform notes**: iOS PWA has storage eviction and no Background Sync; the app relies on the foreground flush path there and says so in Settings → Offline storage.

**Mock-mode honesty**: because the mock server is in the page, it keeps working offline. A demo toggle makes the *transport* fail with `offline` so real offline behaviour (banner, queueing, disabled actions) is exercised and testable.

---

## 12. Design system implementation

- `styles/tokens.css` is the single source of tokens (primitives → semantic roles → component aliases), with light/dark and org-accent overrides on `[data-theme]` and `[data-accent]`. `scripts/check-contrast.ts` parses it and fails CI on any role pair below threshold.
- Tailwind `@theme` maps utilities to tokens; arbitrary values and raw colours are banned by lint.
- Components use `cva`-style variants (`class-variance-authority`) and `clsx`; each Tier 1 component is in `components/ui/<name>/{name.tsx,name.test.tsx,name.gallery.tsx}`; the gallery auto-discovers `*.gallery.tsx`.
- Icons imported per file; sizes via tokens.
- Dark-mode and theme switching use a blocking inline script that sets `data-theme` from localStorage/system before paint.

---

## 13. Performance and accessibility engineering

- **Budgets** (enforced in CI via `size-limit` and Lighthouse CI): route-level JS budgets (marketing ≤ 60 KB, Today ≤ 170 KB, lesson player ≤ 190 KB, editor chunk lazy ≤ 120 KB, charts lazy ≤ 110 KB), images/illustrations SVG only, fonts ≤ 120 KB on first paint.
- RSC for all static chrome; client components pushed to leaves; `next/dynamic` for heavy widgets; `React.lazy` boundaries with skeleton fallbacks of identical size (no CLS).
- Query data is selected and normalised minimally; long lists virtualised (`@tanstack/react-virtual`) beyond 100 items.
- Images: none raster in-product; marketing visuals are real UI renders as SVG/optimised WebP with explicit dimensions.
- Lighthouse CI runs on marketing, `/sign-in`, `/app/today` (with seeded demo), `/app/pathways/…/lessons/…`, `/mentor`, `/admin/reports`; thresholds: performance ≥ 95 (marketing) / ≥ 90 allowed to be re-evaluated for data-heavy app routes in demo mode with a documented reason, accessibility ≥ 95 everywhere, best practices ≥ 95, SEO ≥ 95 (marketing).
- axe checks in unit tests for each component and in Playwright for each route; manual screen-reader sweeps each phase.

---

## 14. Testing strategy

| Layer | Tool | What |
|---|---|---|
| Unit | Vitest | `lib/*` pure code (SRS, reference parser, permissions table, pagination, cursors, milestone engine, outbox) |
| Component | Vitest + Testing Library + jest-axe | Every Tier 1/2 component and key domain components in all states |
| Service/contract | Vitest | Service functions against the mock transport: happy path, validation, forbidden, not_found, pagination, conflict. The same suite can run against a real API later. |
| Mock-server | Vitest (fake-indexeddb) | Routes, authorisation, engine side effects |
| E2E | Playwright (Chromium, WebKit; mobile 360×800 + desktop 1280×800; `en` and `en-XA`) | Key journeys below, with axe and offline simulation |
| Visual | Playwright screenshots of `/design` (light/dark, mobile/desktop) | Guard against regressions |
| Performance | Lighthouse CI | Budgets above |

**Key journeys**: (1) mentor builds & publishes pathway → student completes lesson & reflection → mentor feedback → student sees feedback and timeline; (2) onboarding as solo learner; (3) Bible highlight + note + memory verse review; (4) offline: download lesson, go offline, complete reflection, reconnect, sync; (5) group discussion + moderation; (6) admin invites, role change and report view; (7) AI share request → mentor approval; (8) command palette navigation and keyboard-only flow; (9) reset demo data; (10) language switch to pseudo-locale.

Rules: tests use factories, never the real seed (except E2E, which uses the real seed with `instant` latency); no snapshot tests of large DOM trees; a11y assertions are not optional.

---

## 15. Environments, config and deployment

- `config/env.ts` validates env with Zod at startup: `NEXT_PUBLIC_API_MODE` (`mock|http`), `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_DEMO` (`true` shows demo toolbar), `NEXT_PUBLIC_SITE_URL`.
- Vercel: production = marketing + demo app (`API_MODE=mock`, `DEMO=true`); every PR gets a preview URL; headers: strict CSP (no inline scripts except nonce'd theme script), `Referrer-Policy`, `Permissions-Policy`, long-cache for hashed assets and `/data/**` with versioned paths.
- No analytics, no third-party scripts, no cookies set by the demo (localStorage/IndexedDB only; disclosed in the footer).
- Bible licence file and attribution shipped at `/data/bible/web/LICENSE.txt` and in the app's About screen.

---

## 16. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Client-side app on slow Android hurts Lighthouse and UX | Strict budgets, lazy chunks, skeleton-first, measure on throttled mobile every phase |
| Mock server grows into a second product | Keep handlers thin; engine only implements rules the contract documents; delete-able by design |
| Font coverage for Yoruba/Igbo/Hausa | Early spike (Phase 1) with fallback family |
| IndexedDB quirks (Safari eviction, private mode) | Feature-detect, fall back to in-memory with a visible notice; export/import demo state is a stretch |
| Content volume (real lesson text) is large | Author in `content/` with a lint for word counts and scripture-ref validity; phase the writing (Phase 3: one pathway, Phase 4: remaining) |
| Media for demo (audio/video) licensing and size | See ROADMAP open decisions; defaults to short original TTS-narrated Opus clips and caption/transcript-first lessons |
| Dnd-kit accessibility | Always ship button/keyboard alternatives, test with screen readers |
| Scope | Roadmap gates; vertical slice first; each later phase independently shippable |
