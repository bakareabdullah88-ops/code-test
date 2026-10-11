# CLAUDE.md

Conventions for every session working on this repository. Read this first. The planning documents in `docs/` are the source of truth: `PRODUCT.md`, `DESIGN.md`, `FRONTEND_ARCHITECTURE.md`, `API_CONTRACT.md`, `ROADMAP.md`. If a decision changes, update the doc in the same change.

## What this is

A **frontend-only**, production-grade discipleship platform (working name Tessera). There is no backend: a mock server behind a transport, backed by IndexedDB and seeded data, stands in for it. Quality bar: Linear, Notion, Duolingo-level craft. It must never look or feel generic, AI-generated or "vibecoded".

## Hard rules (never break these)

1. **Never hard-code data in components.** Names, lessons, verses, counts, lists, dates and options come from services via hooks. Test fixtures use factories in `src/test`. Seed content lives in `content/seed`.
2. **All data access goes through `src/lib/services`.** UI never imports `mock-server`, `idb` or the transport. Services return domain types from `src/types` and throw `ApiError`. Everything must be swappable for real HTTP without touching a component.
3. **Types are the API contract.** Change `src/types` and `docs/API_CONTRACT.md` together, with the mock server and services.
4. **No hard-coded user-facing strings.** Everything is in `messages/<locale>/*.json` via next-intl, ICU plurals, no concatenation. The brand name comes from `config/brand.ts` as `{appName}`.
5. **No raw colours, ad-hoc spacing or arbitrary Tailwind values.** Use tokens only (`src/styles/tokens.css`). Lint enforces this.
6. **No emoji anywhere** (UI, copy, code comments, commits). No lorem ipsum. No stock images or stock avatars. No purple/blue gradients, glassmorphism or default shadcn styling.
7. **No spirituality scores, no streaks, no guilt language, no leaderboards.** Growth is milestones and completed goals. Time language is neutral.
8. **Privacy is enforced in the mock server, not only the UI.** Follow the visibility matrix (PRODUCT.md §5). Admins never read reflections, prayer, notes or AI conversations.
9. **AI is always labelled, and nothing AI-generated is shared without mentor approval.**
10. **Every screen has designed loading (skeleton), empty, error and offline states.** A feature isn't done without them.
11. **Check every change in a real browser at mobile (360×800) and desktop (1280×800) widths before saying it is done.** See "Browser verification".

## Stack and commands

Next.js (App Router) + TypeScript strict, Tailwind v4 over our tokens, Radix primitives (restyled), TanStack Query, React Hook Form + Zod, Tiptap, Recharts, next-intl, Serwist, Vitest + Testing Library, Playwright. Package manager: pnpm. Node 22.

Commands (keep this list accurate; the two marked Phase 2 do not exist yet):

```
pnpm dev            # next dev
pnpm build          # production build
pnpm typecheck      # tsc --noEmit
pnpm lint           # eslint (boundaries, a11y, tokens, i18n literals)
pnpm test           # vitest run
pnpm test:watch
pnpm e2e            # playwright (mobile + desktop projects)
pnpm check          # typecheck + lint + test (run before every commit)
pnpm check:contrast # token contrast gate
pnpm check:i18n     # catalogue completeness / ICU validity
pnpm seed:build     # (Phase 2) content/seed -> public/data/seed/vN
pnpm bible:build    # (Phase 2) WEB source -> public/data/bible/web
```

## Folder rules

- `src/app`: routes, layouts, loading/error files only. No business logic; compose from `features`.
- `src/components/ui`: primitives. No data, no services, no feature imports. One folder per component with `name.tsx`, `name.test.tsx`, `name.gallery.tsx`.
- `src/components/patterns`: reusable states and layouts (EmptyState, ErrorState, PageHeader).
- `src/features/<name>`: vertical slices owning their components, query/mutation hooks, schemas. Import other features only through their `index.ts`.
- `src/lib/services`: one file per domain; the only code that calls the API client.
- `src/lib/api`: client, transports, errors. `src/mock-server`: the fake backend. Imported only by `lib/api` via dynamic import.
- `src/types`: domain types. `src/config`: brand, env, roles, nav. `src/styles`: tokens and base CSS.
- Import boundaries are enforced by `eslint-plugin-boundaries`; fix the code, not the config.
- Co-locate tests with source. E2E lives in `e2e/`.

## Code style

- TypeScript strict, `noUncheckedIndexedAccess`. No `any` (use `unknown` and narrow). No non-null assertions without a comment. No `@ts-ignore`; `@ts-expect-error` needs a reason.
- Server Components by default; add `'use client'` only at leaves that need it. Heavy deps (Tiptap, Recharts, dnd-kit, cmdk) are always dynamically imported.
- Function components, named exports (default exports only where Next requires them). Small files, one component per file when non-trivial.
- Data fetching only through TanStack Query hooks in `features/*/hooks`. No fetching in `useEffect`. Query keys from the key factory.
- Forms: React Hook Form + Zod; schemas shared with the mock server. Always wire labels, descriptions, `aria-invalid`, error summary.
- Prefer composition and variants (`cva`) over prop sprawl. No inline styles except computed values via CSS variables.
- Use logical CSS properties (`ms-`, `pe-`, `inline-size`) so RTL is possible later.
- Comments explain *why*, not *what*. Match the surrounding comment density; don't add noisy comments.
- Dates, numbers, lists through Intl helpers; store UTC ISO strings.
- Never write `console.log` in committed code. Errors are surfaced through `ErrorState`/toasts and typed `ApiError`.

## Copy and voice

Warm, steady, plain-spoken, humble. Sentence case. Buttons start with verbs ("Send feedback"). No exclamation marks except rare earned moments. No guilt, hype or gamified language. Be honest about demo and AI status. UI copy ~grade 8. Details: DESIGN.md §1.3.

## Design rules

- Follow DESIGN.md. Accent colour is for "do this/this matters", used sparingly. Depth via tone and hairlines, not heavy shadow.
- Touch targets ≥ 44 px. Reading text 18-20 px, measure ≤ 68ch. One primary action per view.
- Motion is subtle, uses motion tokens, and must degrade under `prefers-reduced-motion` and the in-app toggle. Nothing carries information only through motion.
- New component = variants + all states + keyboard + ARIA + test + axe + gallery entry.

## Accessibility (WCAG 2.2 AA is the floor)

Keyboard operable everywhere; visible focus; focus not obscured by sticky bars; dragging has button/keyboard alternatives; status is never colour-only; icon buttons need accessible names (the type requires it); live regions for save/sync; charts have summaries and table alternatives; media has captions/transcripts; text zoom to 200% and reflow at 320 px. Run axe in tests and Playwright.

## Performance

Mobile-first on slow Android over slow data. Respect the budgets in `FRONTEND_ARCHITECTURE.md` §13. Skeletons must match final layout (no CLS). Lazy-load heavy widgets. Virtualise lists over 100 rows. Don't add dependencies casually: check size and justify in the PR/commit.

## Testing rules

- Every new component: Testing Library test (behaviour via roles/labels, not implementation) plus `jest-axe`.
- Every new pure function in `lib/`: unit tests including edge cases.
- Services and mock-server routes: contract tests covering success, validation failure, forbidden, not found, pagination, conflict, idempotency, and privacy.
- Key journeys (ROADMAP Phase 3 onward) have Playwright specs in mobile and desktop projects with axe.
- Tests use factories and the `instant` latency profile; no sleeps; no network; no snapshot tests of large DOM trees.
- Never skip, disable or delete a failing test to get green. Fix the cause.
- A bug fix starts with a failing test.

## Browser verification (required before "done")

For any UI change:

1. Start the app (`pnpm dev`), with `NEXT_PUBLIC_DEMO=true`.
2. Use Playwright (Chromium is preinstalled; never run `playwright install`) to load the affected routes at **360×800** and **1280×800**. Capture screenshots into `.screenshots/` (git-ignored) and actually look at them.
3. Check light and dark themes, and once with reduced motion.
4. Exercise the states: loading (slow3g profile), empty, error (flaky profile), offline (simulate offline). Confirm no layout shift and no console errors.
5. Keyboard-only pass: tab order, focus visibility, Escape/Enter behaviour.
6. Only then report the change as done, and say which widths and states you checked. If you could not verify something, say so plainly instead of claiming it works.

## Git and workflow

- Develop on the branch named in the task; do not push elsewhere. Do not open a pull request unless asked.
- Conventional commits (`feat(lessons): …`, `fix(mock-server): …`, `docs: …`). Small, reviewable commits; run `pnpm check` first.
- TypeScript is pinned to 6.x because typescript-eslint does not support 7.x yet; bump together when it does.
- To check in the browser: `pnpm build && pnpm start -p 3100`, then `CHROMIUM_PATH=<preinstalled chromium> node scripts/screenshots.mjs http://localhost:3100 /route`. Do not `pkill -f` patterns that appear in your own command line.
- Don't commit secrets, `.screenshots/`, build output or large binaries. Media and Bible JSON are generated or licensed assets documented in `content/README.md`.
- Keep docs in sync: change a type → update API_CONTRACT.md; change a decision → update the relevant doc.
- When a phase finishes, stop and summarise against its definition of done in ROADMAP.md, with screenshots and any deviations, then wait for review.

## Content rules

- Lesson content is original, in plain ecumenical language, with real substance (no filler). Scripture quoted only from the bundled WEB text, referenced by `BibleRange`. Validate refs in the seed build.
- Names in seed data are fictional but believable and from many countries; organisations are fictional. No real people, no real church names.
- No fake testimonials, user counts, or logos anywhere, including marketing.
