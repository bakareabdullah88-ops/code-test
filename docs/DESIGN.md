# DESIGN.md

> Status: Phase 0 plan, awaiting review. Tokens here are the starting values; they are validated by an automated contrast script in Phase 1 and may shift slightly. Anything that changes is updated here first.

---

## 1. Brand direction

### 1.1 Name

Working name **Tessera**: the Roman *tessera hospitalis* was a token split between host and guest, a pledge of welcome. A tessera is also one tile in a mosaic, so each person is a piece of a larger picture. It is short, easy to pronounce in most of our target languages, and supports the visual motif.

Alternatives, if you prefer a different direction:

| Name | Idea | Note |
|---|---|---|
| **Tessera** (working) | Welcome token / mosaic tile | Quiet, literary, on-theme |
| **Lanternway** | A lit path you walk with others | Warmer, more explicit, longer |
| **Alongside** | Mentoring as walking next to someone | Very clear meaning; plain-word brand, harder to own |

No trademark, domain or app-store search has been done; do this before committing. The name is read from `config/brand.ts` and injected into copy as an ICU variable, so it is never hard-coded.

### 1.2 Essence

**A beautiful book plus a quiet, fast app.** Warm paper, good typography, ink-dark text, a single clay accent. It should feel like a well-made Bible or journal that happens to be responsive. Reverent without being solemn, modern without being techy.

### 1.3 Personality and voice

| We are | We are not |
|---|---|
| Warm, steady, plain-spoken | Cheerleading, hyped, gamified |
| Humble (we point beyond ourselves) | Preachy or prescriptive |
| Precise about what the app does | Vague "AI magic" |
| Welcoming to beginners | Insider-churchy jargon |

Copy rules (full list in CLAUDE.md): sentence case; verbs for buttons ("Send feedback", not "Submit"); never use guilt ("You missed…", "Don't break your streak"); time language is neutral ("Waiting for you"); no exclamation marks except rare, earned moments; no emoji.

| Instead of | Write |
|---|---|
| "You're 3 days behind!" | "Lesson 4 is ready when you are." |
| "Streak lost" | (nothing: we don't track streaks) |
| "Failed quiz" | "Let's look at that one again." |
| "Inactive: 14 days" (to mentors) | "Adaeze hasn't opened the app for two weeks. Might be worth a message." |

### 1.4 Visual motif: the thread

A continuous hand-drawn-feeling **thread** that connects nodes: the journey loop made visible. It appears as the lesson progress indicator, the timeline spine, the pathway outline, and a section divider on marketing pages. The tessera tile (a small rounded square set slightly off-axis) is the logo mark and the node shape.

- **Logo**: wordmark in the display serif, with a tile-and-thread mark. Designed as SVG in-house (no stock). Delivered in full colour, single colour and monochrome-reversed.
- **Illustration**: spot illustrations in a limited two-ink style (ink + clay) with paper texture avoided. Subjects are objects, not people: lamp, path, open book, seed, bread, bowl, door, hands only in outline. Used for empty states, onboarding and marketing. All original SVG, ≤ 6 KB each.
- **Photography**: none in the product. No stock photography, no stock avatars.
- **Avatars**: deterministic **monogram tiles** derived from the name and a warm, restrained palette of six tints that all pass contrast with ink text; user-uploaded photos optional.
- **Texture and depth (revised)**: frosted-glass bars and overlays (`.glass`, `.glass-strong`: backdrop blur over warm tinted surfaces), a soft ambient accent glow behind the page, layered paper tones, hairline borders and warm shadows (`--shadow-card`, `--shadow-lift`). Still no purple or blue gradients and no grain. Blur is used for chrome that floats over content (header, sidebar, bottom navigation, dialogs, menus, toasts), not for body text surfaces.

### 1.5 Iconography

Phosphor Icons (regular weight, 1.5 px visual stroke at 20 px) plus ~12 custom marks (lesson, reflection, thread, milestone, memory verse, prayer, group, mentor, pathway, companion, offline-download, highlight). Icons always accompany text or have an accessible name. Never emoji. Never icons as the only means of conveying status.

---

## 2. Design principles

1. **Reading first.** Type is the interface. Prefer whitespace and hierarchy over boxes.
2. **Calm by default.** One primary action per view. Few colours. Motion is a hand on the shoulder, not a nudge.
3. **Slow-data kind.** Perceived speed beats decoration: skeletons shaped like content, optimistic updates, no layout shift, small payloads.
4. **Earned emphasis.** The accent colour means "do this" or "this matters". It is not decoration.
5. **Everyone included.** WCAG 2.2 AA minimum, 44 px touch targets, full keyboard paths, readable in bright sun and in dark rooms.
6. **Honest states.** Loading, empty, error and offline are designed first-class, not afterthoughts.

---

## 3. Design tokens

Implemented as CSS variables in `src/styles/tokens.css`, consumed through Tailwind v4's `@theme` so utilities map to tokens. **Components never use raw hex values, raw px for spacing, or arbitrary Tailwind values** (lint-enforced).

### 3.1 Colour

#### Palette scales (primitives)

| Step | Paper (neutral, warm) | Clay (accent) |
|---|---|---|
| 50 | `#FDFAF5` | `#FBF1EC` |
| 100 | `#F8F3EA` | `#F5DED3` |
| 200 | `#EFE8DB` | `#EBBFAC` |
| 300 | `#E2D9C8` | `#DE9879` |
| 400 | `#C9BEA9` | `#CF7452` |
| 500 | `#9C927F` | `#BC5A38` |
| 600 | `#6F6657` | `#A5482B` |
| 700 | `#4F473B` | `#873A23` |
| 800 | `#342E25` | `#6A2E1E` |
| 900 | `#221D17` | `#4A2117` |
| 950 | `#16120E` | n/a |

Supporting hues (used sparingly, mostly in charts, status and highlights; all muted, none purple or blue): **moss** `#4F6B3A`, **ochre** `#9A6A12`, **brick** `#B3263E` (danger, intentionally cooler than clay so errors don't read as accent), **slate-teal** `#3F6E73`.

#### Semantic roles

| Role | Light | Dark |
|---|---|---|
| `bg` page | paper-50 | paper-950 |
| `surface` cards | `#FFFFFF` at 70% over paper-50 → solid `#FFFEFB` | `#1E1914` |
| `surface-raised` (popovers, sheets) | `#FFFFFF` | `#272019` |
| `surface-sunken` (inputs, code, quote) | paper-100 | `#120F0B` |
| `border` hairline | paper-300 | `#3A3228` |
| `border-strong` | paper-400 | `#5A4F40` |
| `text` | paper-900 | `#F2EBDD` |
| `text-muted` | paper-600 | `#BFB4A0` |
| `text-subtle` (placeholders, meta; never essential info) | paper-500 | `#8F8573` |
| `accent` (buttons, links, focus) | clay-600 | `#E08A66` |
| `accent-hover` | clay-700 | `#EB9C7B` |
| `accent-subtle` (tinted backgrounds) | clay-50 | `#2E1D16` |
| `on-accent` | `#FFFFFF` | paper-950 |
| `focus-ring` | clay-600 plus 2 px offset in `bg` | `#F0AA8C` |
| `success` / `warning` / `danger` | moss / ochre / brick | lightened equivalents, ≥ 4.5:1 |
| `info` | neutral ink (no blue) | neutral |

Estimated contrast (verified by script in Phase 1, any failure blocks merge): white on clay-600 ≈ 5.9:1; clay-600 text on paper-50 ≈ 5.5:1; paper-600 on paper-50 ≈ 5.4:1; dark accent `#E08A66` on paper-950 ≈ 7:1.

#### Organisation accents

Admins choose from four curated accents (clay, moss, ochre, slate-teal), each with pre-verified light and dark accent pairs. No free colour picker (it cannot guarantee contrast).

#### Bible highlight colours

Four muted tints with text-contrast guaranteed: **straw**, **sage**, **rose**, **mist**. Each also has a distinct underline style (solid, dotted, wavy, double) so meaning never relies on colour alone.

#### Data visualisation

Primary series uses accent; categorical sets use clay, moss, ochre, slate-teal, and paper-600; sequential ramp is paper→clay; every series is distinguishable without colour (direct labels, markers, or patterns). Gridlines are hairlines. Light and dark variants. A text table alternative accompanies each chart.

### 3.2 Typography

**Families**

| Role | Primary candidate | Fallback | Why |
|---|---|---|---|
| Reading & display serif | **Literata** (variable, optical size) | Source Serif 4 | Designed for long-form on-screen reading; warm; distinctive italics |
| Interface sans | **Instrument Sans** (variable) | Source Sans 3 | Clean, slightly humanist, uncommon in app UIs |
| Mono (rare: IDs in error details) | system `ui-monospace` | n/a | No extra download |

**Open risk, resolved by a Phase 1 spike:** Yoruba (ẹ ọ ṣ, tone marks), Igbo (ị ọ ụ, tone marks) and Hausa (ɓ ɗ ƙ ƴ) need reliable glyph and combining-mark rendering. A test page renders sample paragraphs in all six target languages in both families. If a primary candidate fails, the fallback family (strong African-language coverage) takes over. Fonts are self-hosted via `next/font`, subset by script, `font-display: swap`, size-adjusted fallbacks to avoid layout shift. Budget: ≤ 120 KB of fonts on first paint (serif regular + sans variable, Latin subset), others lazy.

**Scale** (fluid with `clamp`, 360 px → 1280 px viewport)

| Token | Size | Line height | Use |
|---|---|---|---|
| `text-xs` | 12–13 px | 1.4 | Meta, captions |
| `text-sm` | 14–15 px | 1.45 | Dense UI, tables |
| `text-base` (UI) | 16 px | 1.5 | Default UI text |
| `text-reading` | 18–20 px | 1.7 | Lessons, Bible, reflections |
| `text-lg` | 20–22 px | 1.4 | Lead paragraphs |
| `text-h4` | 20 px | 1.3 | Section headings (sans, 600) |
| `text-h3` | 24–26 px | 1.25 | Page subsections (serif, 600) |
| `text-h2` | 30–36 px | 1.2 | Page titles (serif, 600) |
| `text-h1` | 38–52 px | 1.1 | Marketing and lesson titles (serif, 600, optical size high) |

**Reading typography**

- Measure: 62–68 characters; reading column `max-width: 68ch` and centred on wide screens.
- Paragraph spacing 1em, first line not indented, hanging punctuation where supported.
- Scripture: serif, slightly larger, verse numbers as small superscript in `text-subtle`, paragraph structure preserved from WEB, poetry indented with preserved line breaks.
- User controls: text size (S 100%, M 112%, L 125%, XL 150%) and line spacing (Comfortable 1.7, Relaxed 1.9); persisted per device.
- `font-variant-numeric: lining-nums` in UI, `oldstyle-nums` allowed inside long-form body text; `text-wrap: balance` for headings, `pretty` for paragraphs.
- Respects OS text-size settings (rem-based throughout; no fixed-px type).

### 3.3 Spacing and sizing

4 px base. Tokens: `0, 1(4), 2(8), 3(12), 4(16), 5(20), 6(24), 8(32), 10(40), 12(48), 16(64), 20(80), 24(96)`. Page gutter 16 px (mobile) / 24 px (tablet) / 32 px (desktop). Interactive targets ≥ 44 × 44 px (exceeds the 24 px WCAG 2.2 AA minimum). Content widths: reading 68ch, form 480 px, dashboard 1120 px, builder full-bleed.

### 3.4 Radius, borders

`xs 4`, `sm 6` (chips, inputs), `md 10` (buttons, cards), `lg 16` (sheets, large cards), `xl 24` (marketing), `full`. Borders are 1 px hairline in `border`; focus ring 2 px + 2 px offset.

### 3.5 Elevation

Separation uses **hairline borders, tone and soft layered shadow** together (revised: cards lift on hover). Shadows are warm-tinted (`rgb(34 29 23 / α)`), small and soft.

| Level | Use | Light | Dark |
|---|---|---|---|
| 0 | Flat content | none | none |
| 1 | Cards that lift on hover | `0 1px 2px / .06` | border-strong |
| 2 | Popovers, menus | `0 8px 24px -8px / .18` | surface-raised + border |
| 3 | Dialogs, sheets | `0 24px 48px -16px / .28` | surface-raised + border |

Dark mode elevates by lightening the surface rather than increasing shadow.

### 3.6 Motion

**Revised direction.** Motion is a visible part of the product's craft, not just a hand on the shoulder: spring-physics sliding pills (navigation, segmented controls), staggered list entrances, scroll reveals (`Reveal`), count-up numbers (`CountUp`), pop-in icon tiles, cross-fading quotes, hover lift on interactive cards, animated progress and checkmarks. Everything below still applies for reduced motion: all of it is removed or becomes instant under `prefers-reduced-motion` and the in-app toggle, and nothing carries information only through motion.

**Document-style pages.** Detail pages (pathway, event, resource, reading plan, group) use `PageCover` (cover art with an icon tile resting on its edge) and `PropertyList` (icon, label and value rows that tint on hover), following the feel of a Notion page. Lists of related items are cards with a cover and hover lift.


Purpose: orient, confirm, soften. Never decorate, never block.

| Token | Value |
|---|---|
| Durations | `instant 90ms`, `fast 150ms`, `base 240ms`, `slow 400ms` |
| Easings | `standard cubic-bezier(.2,0,0,1)`, `enter cubic-bezier(0,0,.2,1)`, `exit cubic-bezier(.4,0,1,1)` |
| Distance | ≤ 8 px translate for entrances; sheets slide full height |

Catalogue: route change (fade 150 ms), sheet/dialog (translate + fade, base), toast, list insert (height + fade), **thread draw** (progress line stroke-dash, slow, only when progress changes), checkmark draw (fast), skeleton shimmer (very subtle, 1.6 s, disabled under reduced motion), card press (scale 0.99).

**Reduced motion** (`prefers-reduced-motion: reduce` and an in-app toggle): transforms and shimmer are removed; fades shorten to 90 ms or become instant; the thread simply updates. No motion carries information that isn't also visible statically. Nothing flashes more than three times per second.

### 3.7 Z-index and layers

`base 0, sticky 10, dropdown 20, sheet 30, dialog 40, toast 50, command 60, demo-toolbar 70`. Sticky bars set `scroll-padding` so focused elements are never obscured (WCAG 2.2 Focus Not Obscured).

### 3.8 Breakpoints and layout grid

Mobile-first. `base` (≥ 360), `sm` 480, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536. Container queries are used for components (cards, tables) so they adapt to their slot, not just the viewport.

### 3.9 Token reference snippet

```css
:root {
  --paper-50:#FDFAF5; --paper-900:#221D17; --clay-600:#A5482B; /* …full scales in tokens.css */
  --bg:var(--paper-50); --text:var(--paper-900); --accent:var(--clay-600);
  --on-accent:#fff; --border:var(--paper-300);
  --radius-md:10px; --space-4:1rem;
  --dur-base:240ms; --ease-standard:cubic-bezier(.2,0,0,1);
}
:root:not([data-theme="light"]) { @media (prefers-color-scheme: dark){ /* dark roles */ } }
:root[data-theme="dark"] { /* dark roles */ }
@media (prefers-reduced-motion: reduce){ :root{ --dur-base:0.01ms; } }
```

---

## 4. Theming

- **Light / Dark / System**, set in Settings and the command palette; applied before first paint (inline script) to avoid flash.
- **Reading preferences** (size, line spacing, serif/sans for body) apply to lesson player, Bible reader and journal.
- **Organisation accent** swaps `--accent*` roles only.
- **Contrast mode:** respects `forced-colors` and `prefers-contrast: more` (borders thicken, shadows removed).

---

## 5. Component inventory

Tiered so the roadmap can build in order. Every component ships with: variants, all states (default, hover, focus-visible, active, disabled, loading, error), keyboard behaviour, ARIA notes, reduced-motion behaviour, a Vitest + Testing Library test, an axe check, and a gallery entry.

### Tier 1: primitives (Radix-based, fully restyled)

| Component | Notes |
|---|---|
| Button (primary, secondary, ghost, danger; sizes; loading; icon-only) | `<button>`/`<a>` correct semantics; loading keeps width |
| IconButton | Requires accessible name (type-enforced) |
| Link | Underline offset style, external indicator |
| Input, Textarea, PasswordInput | Label, description, error wiring via `Field` |
| Field / FormMessage | `aria-describedby`, `aria-invalid`, error summary |
| Checkbox, RadioGroup, Switch | 44 px hit area |
| Select, Combobox | Radix + searchable list, async options |
| Slider | Reading size, audio seek |
| Tabs, SegmentedControl | Roving tabindex, URL-synced option |
| Dialog, AlertDialog, Sheet (bottom on mobile / side on desktop) | Focus trap, return focus, swipe-to-dismiss on touch |
| Popover, Tooltip, DropdownMenu, ContextMenu | Tooltips never carry essential info |
| Toast / Toaster | `role=status`, pause on hover/focus, ≥ 6 s or persistent for errors |
| Avatar (Monogram), AvatarGroup | Deterministic tints |
| Badge, Chip (filter chip, scripture chip) | Not colour-only |
| Card, Surface, Separator | |
| Skeleton (text, block, avatar, row) | `aria-hidden`, region `aria-busy` |
| Progress (linear, thread) | Accessible value text |
| VisuallyHidden, SkipLink, FocusScope | |
| Calendar, DatePicker, TimePicker | Locale-aware, keyboard grid |
| Table (responsive), Pagination, VirtualList | Table becomes card list on mobile |

### Tier 2: patterns and states

`EmptyState`, `ErrorState`, `OfflineBanner`, `Notice` (info/success/warning/danger, neutral info), `PageHeader`, `Breadcrumbs`, `Toolbar`, `FormSection`, `ConfirmDestructive`, `UnsavedChangesGuard`, `StatusText` (Saving/Saved), `Stale indicator`, `RequestIdDisclosure`, `Kbd`, `Pagination "Load more"`.

### Tier 3: domain components (built with feature work)

| Group | Components |
|---|---|
| Learning | `LessonPlayer`, `BlockRenderer`, `ScriptureBlock`, `AudioPlayer`, `VideoPlayer` (captions required), `Callout`, `ReflectionPrompt`, `QuizRunner`, `ProgressThread`, `PathwayOutline`, `DownloadButton` |
| Writing | `RichTextEditor` (Tiptap, lazy), `VisibilityPicker`, `ReflectionCard`, `FeedbackThread`, `FeedbackComposer`, `ScriptureRefChip`, `SnippetPicker` |
| Bible | `BibleReader`, `VerseSelectionToolbar`, `ChapterPicker`, `HighlightSwatches`, `NoteSheet`, `ReaderSettings` |
| Memory | `VerseCard` (flip), `ReviewRatingBar`, `DueSummary` |
| Community | `GroupCard`, `MeetingCard`, `DiscussionThread`, `PostComposer`, `ModerationQueueItem`, `PrayerCard`, `PrivacyChip`, `SupportButton` |
| Growth | `TimelineThread`, `TimelineEvent`, `MilestoneCard`, `GoalCard`, `GoalStepList` |
| Mentor | `AttentionCard`, `MenteeRow`, `MenteeHeader`, `CheckInCard`, `SessionNoteEditor`, `ApprovalCard` |
| Builder | `OutlineEditor` (dnd-kit + keyboard + buttons), `BlockPalette`, `BlockEditor`, `QuizEditor`, `PublishChecklist` |
| Admin | `MemberTable`, `RoleSelect`, `InviteForm`, `ChartCard`, `Chart` wrappers (line, bar, stacked, distribution) with `DataTableToggle`, `BrandingPreview` |
| AI | `AiLabel`, `AiMessage`, `ApprovalBanner`, `SafetyHandoff` |
| Shell | `AppShell`, `SidebarNav`, `BottomTabs`, `TopBar`, `LensSwitcher`, `OrgSwitcher`, `CommandPalette` (cmdk), `NotificationBell`, `DemoToolbar` |

### Charts

Recharts behind a thin `Chart` wrapper that applies tokens (axis, grid, tooltip, colours, patterns), lazy-loaded only on admin report routes and mentor dashboard sparklines. Wrapper enforces: title, text summary, data-table toggle, keyboard-focusable points with tooltips, and reduced-motion (no animated draw).

---

## 6. Interaction patterns

- **Forms**: labels above fields; helper text before error; validation on blur then on change; error summary focuses on submit; never disable submit just for being invalid (explain instead); autosave for long-form writing.
- **Destructive actions**: confirm with the consequence in the title ("Delete this reflection?"), default focus on Cancel, undo toast for reversible actions instead of confirm where possible.
- **Optimistic updates** with rollback and inline error for: highlights, prayer support, memory reviews, goal steps, marking notifications read.
- **Long lists**: cursor pagination with "Load more" (and virtualisation after 100 rows). No infinite scroll for content that has a footer or needs predictable focus.
- **Sheets vs dialogs**: mobile uses bottom sheets for secondary tasks (reflection prompt, verse actions, filters); desktop uses side panels or centred dialogs.
- **Undo and drafts**: nothing a user writes is lost to navigation, errors or going offline.

---

## 7. Layout and navigation

### 7.1 Mobile (≤ 767 px)

```
┌──────────────────────────────┐
│ Top bar: title · search · ● │  ← bell, avatar (Me sheet: profile, lens, org, settings)
├──────────────────────────────┤
│                              │
│  Content (single column)     │
│  16 px gutters, safe areas   │
│                              │
├──────────────────────────────┤
│  Tab 1  Tab 2  Tab 3  Tab 4  Tab 5 │  ← bottom tabs, 56 px + safe-area
└──────────────────────────────┘
```

- Bottom tabs: five maximum, icon + label always. Active tab uses accent + a filled icon (not colour only).
- Page-level secondary navigation uses segmented controls at the top (for example Journey: Pathways | Timeline | Milestones).
- Lesson player, Bible reader and editors go **immersive**: tabs hide, a slim header remains, a back affordance returns to origin.
- Thumb zone: primary actions at the bottom (sticky action bar), destructive actions away from it.
- Landscape and small screens (≤ 320 px width) work without horizontal scroll.

### 7.2 Desktop (≥ 1024 px)

```
┌─────────┬────────────────────────────────────────────┐
│ Sidebar │ Top bar: breadcrumbs · ⌘K search · bell · me │
│ (lens   ├────────────────────────────────────────────┤
│ nav,    │  Page content (max width per template)     │
│ collapsible) │  optional right panel (notes, AI, context)│
└─────────┴────────────────────────────────────────────┘
```

- Sidebar 248 px expanded / 64 px collapsed; remembers state. Lens and organisation switchers at its top.
- Tablet (768–1023): collapsed icon rail instead of bottom tabs.
- Right context panel (≥ 1280): Bible notes, lesson reflection editor, AI companion, mentor context.

### 7.3 Navigation per lens

| Lens | Mobile bottom tabs | Desktop sidebar adds |
|---|---|---|
| **Learn** | Today · Journey · Bible · Journal · Community | Downloads, Companion, Notifications |
| **Mentor** | Attention · Mentees · Feedback · Pathways · More | Approvals, Check-ins calendar |
| **Lead** | Groups · Schedule · Discussion · Members | Meeting prep |
| **Admin** | Overview · Members · Groups · Reports · More | Invites, Branding, Settings, Audit |

Memory verses live under Bible (Read | Highlights | Memorise). Prayer lives under Community (Groups | Prayer). Profile, settings and lens switching live in the Me sheet / avatar menu. Mentor and admin tools that need large screens (builder, reports, member tables) show a calm "Best on a larger screen" note with a reduced-function mobile view rather than being hidden.

### 7.4 Page templates

1. **Reading** (lesson, Bible, reflection detail): single centred column, minimal chrome.
2. **List / detail** (journal, mentees, feedback inbox, members): list left, detail right on desktop; push navigation on mobile.
3. **Dashboard** (Today, mentor, admin overview): card grid, responsive via container queries.
4. **Builder** (pathway/lesson): three regions: outline, canvas, inspector/preview; collapses to stacked panes.
5. **Form / settings**: 480 px column with section nav.

### 7.5 Wayfinding and shortcuts

- Breadcrumbs on desktop for depth > 2. Back always works predictably (no hijacked history).
- Command palette `Ctrl/Cmd+K` (and `/` for search); `?` opens a shortcut sheet. Inbox lists support `j/k/Enter`. All shortcuts are discoverable and can be disabled.
- Deep links are stable; sheets that hold meaningful state have URLs.

---

## 8. Accessibility specifics (WCAG 2.2 AA)

| Area | Commitment |
|---|---|
| Keyboard | Every function reachable and operable; logical order; visible focus (3:1, 2 px + offset); skip links; no keyboard traps. |
| Focus Not Obscured (2.4.11) | Sticky headers/tabs use scroll padding; sheets restore focus. |
| Dragging movements (2.5.7) | Reordering has button and keyboard alternatives. |
| Target size (2.5.8) | 44 px minimum, even for inline icon buttons. |
| Consistent help (3.2.6) | Help/feedback link in the same place on every page. |
| Accessible authentication (3.3.8) | No cognitive tests; paste allowed; password managers supported. |
| Redundant entry (3.3.7) | Onboarding data carries across steps. |
| Colour | 4.5:1 text, 3:1 UI; status never by colour alone. |
| Screen readers | Landmarks, headings in order, live regions for save/sync, labelled icon buttons, chart summaries and tables, audio/video captions/transcripts. |
| Zoom and reflow | 200% text and 400% zoom without loss (320 px reflow). |
| Motion | Respects reduced motion; no autoplay audio/video. |
| Language | `lang` set per locale; scripture and snippets in other languages marked `lang`. |
| Testing | axe in unit and E2E; manual screen reader pass (TalkBack on Android, VoiceOver, NVDA) per phase. |

---

## 9. Content design notes

- Reading level around grade 8 for UI copy. Short sentences. Translatable: no concatenated strings; ICU plurals; allow ~40% expansion (pseudo-locale test) and ~30% for Yoruba/Igbo/Hausa diacritic height (line-height tests).
- Dates and times in the user's locale/time zone; relative times only under a day ("2 hours ago"), otherwise absolute.
- Names: never assume given/family order; support single names; display name is one field.

---

## 10. Component gallery

A `/design` route (noindex, excluded from sitemap, enabled in all demo builds) rather than Storybook, because it dogfoods the real build, tokens and providers, adds no extra toolchain, and loads fast. It contains:

- Tokens: colour (with live contrast ratios), type specimens (including the six target languages), spacing, radius, elevation, motion.
- Every primitive and pattern with all states, in light/dark, and reading size toggles.
- A **state matrix** page: loading / empty / error / offline for each domain component.
- A theme, reduced-motion and pseudo-locale control panel.
- Playwright visual and axe checks run against it in CI.

If the team later wants isolated component dev, Storybook can be added without changing components.
