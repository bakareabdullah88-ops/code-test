# ROADMAP.md

> Status: Phase 0 plan, awaiting review. Sizes are relative effort (S ≈ days, M ≈ 1-2 weeks, L ≈ 2-4 weeks of focused work), not promises. Each phase ends with a deployed Vercel preview that I demo against its definition of done, then I stop for your review before the next phase.

---

## Global definition of done (applies to every phase)

A change is done only when all of these are true:

- [ ] Types, lint, unit/component tests pass; new logic has tests; no skipped tests.
- [ ] **Checked in a real browser at mobile (360×800) and desktop (1280×800) widths**, in light and dark, with reduced motion on once. Screenshots attached to the phase review.
- [ ] Every new screen has designed **loading, empty, error and offline** states and they were actually viewed (using the demo toolbar's latency/offline controls).
- [ ] Keyboard-only pass and axe clean; focus order and labels checked; WCAG 2.2 AA items from DESIGN.md §8.
- [ ] No hard-coded data in components; all copy in message catalogues; no raw colours or ad-hoc spacing.
- [ ] Bundle budgets and Lighthouse thresholds hold (≥ 95 accessibility; performance per FRONTEND_ARCHITECTURE.md §13).
- [ ] Docs updated if any decision changed (PRODUCT, DESIGN, ARCHITECTURE, API_CONTRACT).

---

## Phase 0: Plan (this)

Deliverables: the six documents. **Exit:** you review and answer the open decisions below.

---

## Phase 1: Foundations and design system (L)

**Goal:** a project that already looks like the product, with a living gallery.

Scope
1. Scaffold: Next.js App Router, TS strict, pnpm, ESLint (boundaries, a11y, custom rules), Prettier, Vitest, Playwright, GitHub Actions, Vercel project, env validation, `config/brand.ts`.
2. Tokens (`tokens.css`), Tailwind `@theme` mapping, light/dark/system with no-flash script, org accent override, contrast checker script in CI.
3. Fonts: Literata + Instrument Sans via `next/font`, **six-language glyph spike** (decide fallback), reading typography utilities.
4. Tier 1 primitives and Tier 2 patterns (DESIGN.md §5) fully restyled on Radix, with tests and axe.
5. Custom icon set, monogram avatars, brand mark, ~10 spot illustrations for empty/error states.
6. `/design` gallery: tokens, specimens, all components and states, theme/reduced-motion/pseudo-locale controls, state matrix.
7. next-intl skeleton with `en`, empty `fr pt sw yo ha ig`, `en-XA`; `check-i18n` script.
8. Motion primitives respecting reduced motion.
9. App shell **skeleton** (mobile tabs, desktop sidebar, top bar) with placeholder routes per lens, to validate layouts on real devices early.

Definition of done (in addition to global)
- `/design` deployed; every Tier 1/2 component has all states, light/dark, mobile/desktop, with passing axe + unit tests.
- Contrast script passes for every semantic role pair in both themes.
- Glyph test page renders Yoruba, Igbo, Hausa, Swahili, French, Portuguese correctly; font decision recorded in DESIGN.md.
- Lighthouse on `/design` ≥ 95 performance/accessibility on throttled mobile.
- Lint blocks raw hex colours, arbitrary Tailwind values, literal JSX strings, and forbidden imports (proved by failing fixtures).
- Shell navigation works at 320, 360, 768, 1024, 1280 px with keyboard and screen reader labels.

Risks: font coverage; scope creep into polishing. Timebox spikes.

---

## Phase 2: Data foundation and app services (L)

**Goal:** the "backend" exists in the browser, with the real contract, ready to feed the vertical slice.

Scope
1. `src/types` complete per FRONTEND_ARCHITECTURE.md §6, with Zod schemas for inputs.
2. `ApiClient`, `Transport`, `MockTransport`, `HttpTransport` skeleton, `ApiError`, pagination utilities, idempotency, concurrency (`If-Match`).
3. Mock server: IndexedDB schema, repositories, seed loader with progress screen, migrations, **reset**, cross-tab invalidation, latency/failure profiles, injectable clock.
4. Policies (`lib/permissions`) with the visibility-matrix test table.
5. Domain engine: timeline, notifications, milestone rules, attention derivation (initially for the slice's events).
6. Services for the slice domains: session, organisations, members (read), pathways/modules/lessons/quizzes, enrolments, progress, reflections, feedback, notifications, timeline, milestones.
7. Query infrastructure: client, key factory, persistence, offline mutation defaults, outbox v1, connectivity store.
8. Seed pipeline: `content/seed` → `public/data/seed/v1`; Lantern Hill org, ~48 people with varied international names, one full pathway (*Foundations of Faith*, 8 lessons of real content), Bible build script and **WEB bundled** (per-chapter JSON, licence file).
9. Session provider, persona picker (demo), lens switcher, demo toolbar, "Preparing demo" first-run screen, reset flow.
10. Contract test harness running against the mock.

Definition of done
- Contract tests pass for all services listed; privacy matrix test table passes.
- Fresh load seeds in < 4 s on throttled mobile with progress; reload keeps data; reset restores the original state; changes persist across reloads and tabs.
- Switching persona changes what the UI is allowed to see (verified by tests, not just UI hiding).
- Production build with `API_MODE=http` contains no mock-server code (CI grep).
- WEB text verified against source checksums; every chapter loads; licence/attribution included.
- Latency/offline/failure toggles visibly change behaviour.

---

## Phase 3: The vertical slice, one complete working path (L)

**Goal:** prove the core idea end-to-end. *Mentor creates a pathway → student completes a lesson and reflection → mentor gives feedback → student sees it everywhere.*

Scope (screens from PRODUCT.md)
- Mentor: MN-8 pathway library (basic), MN-9 builder (create pathway/modules/lessons, reorder with drag **and** buttons, publish checklist), MN-10 lesson editor (text, scripture, callout, reflection prompt, quiz; audio/video blocks present with demo media), MN-11 quiz editor, MN-12 preview, MN-14 assign, MN-1 dashboard (reflection-waiting + quiet cards), MN-4 inbox, MN-5 feedback composer (AI draft assist stubbed to "coming in Phase 7").
- Student: ST-1 Today (real), ST-3 pathway detail, ST-4 lesson player with all block types, ST-5 quiz, ST-6 reflection editor (Tiptap, autosave, visibility), ST-7 journal, ST-8 reflection detail with feedback thread, ST-18 timeline (basic), milestone toast for "first reflection".
- Global: GL-1 notifications centre (basic), GL-4 demo toolbar polish, core of GL-2 command palette (navigation + search over slice entities).
- Downloads v0: download a lesson and view it offline (text + scripture; audio opt-in).
- Playwright **Journey 1** (mentor builds → student completes → feedback → timeline) in mobile and desktop, with axe.

Definition of done
- Journey 1 passes in CI on Chromium + WebKit, at 360 and 1280 widths, light and dark.
- All slice screens have loading/empty/error/offline states viewed and screenshot-reviewed.
- Offline: a downloaded lesson opens with the network off; a reflection written offline syncs when back online and the mentor sees it.
- Mentor can reorder via drag, via buttons and via keyboard; screen reader announces moves.
- Lesson player and reflection editor meet reading-typography spec; LCP ≤ 2.5 s on throttled Today after first visit.
- A 5-minute recorded walk-through on a real Android device (or emulator) is attached to the review.

Risks: Tiptap and dnd-kit weight (lazy-load, measure); scope of lesson editor (start with a constrained block set).

---

## Phase 4: Student experience, remaining (L)

Scope: ST-9…12 Bible reader (highlights, notes, chapter picker, reference parser, per-book offline download), Bible library, notes list, memory verses with SRS and review session, ST-19 milestones and goals, ST-18 timeline full, ST-13…17 groups (member view), lesson discussions, prayer wall with privacy levels, ST-20 profile, ST-21 settings (appearance, reading, offline storage, privacy), ST-23 downloads full, Today variants (solo, rest day, new milestone), remaining three pathways' content (*Gospel of Mark*, *Learning to Pray*, *Leading a Small Group*), reading plans, seed activity history.

Definition of done
- Bible reader: smooth chapter navigation on throttled mobile (< 300 ms from cache), selection toolbar accessible by keyboard and touch, annotations persist and sync from outbox.
- SRS unit-tested for scheduling edge cases; no streak language anywhere (copy audit).
- Prayer privacy levels enforced and tested for every viewer role; anonymous requests never leak authors in any response.
- Journeys 2, 3, 4, 5 (student parts) pass.
- Content QA: every lesson has real text, valid scripture refs, estimated time within 20% of word count, and a reflection prompt.

---

## Phase 5: Mentor and group leader, remaining (M-L)

Scope: MN-2/3 mentees and profiles, MN-6 check-ins and session notes (private), MN-7 goals, full MN-1 attention logic with snooze, mentor affirm-milestone, LD-1…5 group space, schedule with recurrence and time zones, discussion moderation (report, hide, lock, pin), attendance, meeting prep with offline attendance; mentor and group reports (own scope).

Definition of done
- Dashboard reasons trace correctly to seed data (tests assert each reason from fixtures).
- Session notes verified invisible to every other role through UI and contract tests.
- Time-zone correctness tests (Lagos/Nairobi/Lisbon/Manila).
- Journeys 5 (moderation) and the mentor halves of 2-4 pass.

---

## Phase 6: Organisation admin (M)

Scope: AD-1 overview + setup checklist, AD-2/3 members table (virtualised, bulk actions), AD-4 invites, AD-5 groups, AD-6 reports with charts and data-table alternatives, AD-7 branding with live preview and curated accents, AD-8 settings and audit log, mentor assignment management, onboarding OB-1…4 with join/create/solo.

Definition of done
- Charts: tokenised, keyboard-focusable, reduced-motion safe, each with a table alternative and text summary; lazy chunk ≤ 110 KB gz.
- Members table handles 5,000 synthetic rows smoothly (virtualised); bulk actions confirm and are undoable where possible.
- Aggregate reports prove no content leak (contract tests); minimum cell size enforced.
- Journey 6 and onboarding journeys pass.

---

## Phase 7: AI companion, notifications, command palette, completion (M)

Scope: ST-22 companion (panel + page) over a mock AI service with a curated canned-response library, streaming simulation, citations, safety hand-off, "Save privately" vs "Ask mentor to approve"; MN-13 approvals queue; mentor AI draft assist in the feedback composer (human must edit and send); full notifications centre, preferences, quiet hours; full command palette (navigation, actions, Bible reference jump, search across permitted entities, recent items, keyboard shortcut sheet).

Definition of done
- "AI" and "demo responses" labelling present on every AI surface (checked by E2E).
- Unapproved AI content is provably invisible to others (contract + E2E Journey 7).
- Command palette is fully keyboard/screen-reader operable, permission-filtered, fast (< 100 ms to open and filter on throttled mobile).
- Notification preferences affect what is generated.

---

## Phase 8: Marketing site (M)

Scope: MK-1…6, original copy and illustration (no testimonials, no user counts), real product renders from seed data, early-access form (local), SEO (metadata, OG images, sitemap, robots, structured data), i18n-ready, pricing draft clearly labelled, honest status page copy.

Definition of done
- Static output; total JS ≤ 60 KB per page; LCP ≤ 1.8 s on throttled mobile; Lighthouse ≥ 95 in all four categories.
- Copy audit: no invented claims, numbers or quotes; every product image labelled "Sample data" where relevant.
- Passes keyboard and screen reader review; works with JS disabled for content.

---

## Phase 9: PWA, i18n and quality hardening (M)

Scope: full Serwist setup, manifest, install prompt behaviour, update flow, storage manager, background flush, offline page; language switcher end-to-end with `en-XA`; scaffolded locale folders verified (fallback behaviour); full-text overflow fixes; visual regression suite; performance tuning to meet all budgets; Android real-device pass (TalkBack, Slow 4G); security headers/CSP; error boundaries and `global-error`; empty/error/offline state audit across every screen using the state matrix.

Definition of done
- Lighthouse ≥ 95 performance and accessibility on all CI routes (or a documented, approved exception for a specific data-heavy route).
- Journey 4 (offline) and 10 (pseudo-locale) pass; PWA installable (Lighthouse PWA checks pass).
- TalkBack/VoiceOver/NVDA notes recorded; blockers fixed.
- No console errors/warnings in any E2E run; CSP in force.

---

## Phase 10: Release candidate (S-M)

Scope: README and contributor docs, demo script, content proofreading, final copy audit against CLAUDE.md voice rules, reset-data and first-run polish, Vercel production deploy, handover notes for backend team (API_CONTRACT.md reconciled with what was actually built), known-issues list.

Definition of done
- API_CONTRACT.md matches the mock server exactly (diff checked by contract tests).
- A new contributor can run, test, and deploy from the README.
- All global DoD items verified on the production URL.

---

## Dependency overview

```
P1 design system ─► P2 data foundation ─► P3 vertical slice ─┬─► P4 student ─┐
                                                              ├─► P5 mentor/leader ─┼─► P7 AI/palette ─► P9 hardening ─► P10
                                                              └─► P6 admin ─┘                          ▲
P8 marketing (needs P1 only; can run in parallel after P3 for real product renders) ───────────────────┘
```

---

## Open decisions (I proceed with the defaults unless you say otherwise)

1. **Name:** working name *Tessera*; alternatives *Lanternway*, *Alongside* (DESIGN.md §1.1). Needs trademark/domain checks before launch.
2. **Demo media:** default is short, original Opus audio narrations for 2-3 lessons generated with a licensed TTS (labelled "demo narration") and a captioned video block using a self-made animated explainer or poster-only fallback. Alternative: text-only lessons with audio/video blocks shown via fixtures. Which do you prefer?
3. **Minimum age and safeguarding:** default copy assumes 16+ and no features for minors. Do you need a youth/child-safe mode or consent flow?
4. **Pricing page:** default is a clearly labelled draft (Personal free / Small group free to a limit / Organisation per active member). Provide real numbers, or keep it "to be announced" with a waitlist?
5. **Anonymous prayer:** default hides authors from leaders and admins in v1. Confirm.
6. **Solo/personal space:** default supports organisation-less learners with a path to invite a mentor. Confirm.
7. **Charts library:** Recharts (lazy, wrapped). Say if you prefer a lighter, lower-level option (visx), at some extra build cost.
8. **Gallery:** `/design` route instead of Storybook (rationale in DESIGN.md §10). Say if you want Storybook anyway.
9. **Bible attribution:** WEB is public domain; the "World English Bible" name has a usage note from its publisher. We will ship the text unmodified with attribution and re-verify the licence text at build time.
10. **Languages for content:** v1 content is English only. Confirm that translation of lessons is out of scope.

## Risk register (top items)

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Lighthouse 95+ performance on a data-driven client app | Medium | High | Budgets from day 1, lazy heavy deps, measure each phase on throttled mobile; marketing is static |
| Authoring real lesson content takes long | High | Medium | Phase it (1 pathway in P2/P3, 3 more in P4); strict content spec in `content/README.md` |
| Mock server over-engineering | Medium | Medium | Only implement documented rules; thin handlers |
| Font glyph coverage for African languages | Medium | Medium | P1 spike and fallback pair |
| Accessibility of drag-and-drop, editors, charts | Medium | High | Alternatives built in, manual AT testing each phase |
| Safari/iOS storage eviction and PWA limits | Medium | Medium | Feature-detect, persist request, honest messaging |
