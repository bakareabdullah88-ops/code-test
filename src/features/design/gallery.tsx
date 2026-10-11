

/* Living component gallery. Copy here is developer-facing and intentionally not localised. */

import { useState, type ReactNode } from 'react';
import { Bell, BookmarkSimple, DownloadSimple, Plus, Trash } from '@phosphor-icons/react';
import { Wordmark, LogoMark } from '@/components/icons/logo';
import { BookIllustration, CloudOffIllustration, LampIllustration, PathIllustration } from '@/components/icons/illustrations';
import { Button } from '@/components/ui/button/button';
import { IconButton } from '@/components/ui/icon-button/icon-button';
import { Field } from '@/components/ui/field/field';
import { Input, Textarea } from '@/components/ui/input/input';
import { Select } from '@/components/ui/select/select';
import { Checkbox } from '@/components/ui/checkbox/checkbox';
import { Switch } from '@/components/ui/switch/switch';
import { RadioGroup } from '@/components/ui/radio-group/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs/tabs';
import { SegmentedControl } from '@/components/ui/segmented-control/segmented-control';
import { Dialog, DialogClose, DialogContent, DialogTrigger } from '@/components/ui/dialog/dialog';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet/sheet';
import { Tooltip } from '@/components/ui/tooltip/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu/dropdown-menu';
import { useToast } from '@/components/ui/toast/toast';
import { Avatar } from '@/components/ui/avatar/avatar';
import { Badge } from '@/components/ui/badge/badge';
import { Chip } from '@/components/ui/chip/chip';
import { Card } from '@/components/ui/card/card';
import { Skeleton, SkeletonRow, SkeletonText } from '@/components/ui/skeleton/skeleton';
import { Progress, ProgressThread, type ThreadStep } from '@/components/ui/progress/progress';
import { EmptyState } from '@/components/patterns/empty-state/empty-state';
import { ErrorState } from '@/components/patterns/error-state/error-state';
import { OfflineBanner } from '@/components/patterns/offline-banner/offline-banner';
import { Notice } from '@/components/patterns/notice/notice';
import { PageHeader } from '@/components/patterns/page-header/page-header';
import { setPrefs, usePrefs, type ReadingSize, type ThemePref } from '@/lib/prefs';

const paper = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const clay = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
const roles = ['bg', 'surface', 'surface-raised', 'surface-sunken', 'border', 'border-strong', 'text', 'text-muted', 'text-subtle', 'accent', 'accent-hover', 'accent-subtle', 'success', 'warning', 'danger'];
const names = ['Adaeze Okafor', 'Tomás Ferreira', 'Grace Wanjiru', 'Kwabena Mensah', 'Helena Costa', 'Priya Nair', 'Jin-woo Park', 'Esperance Uwase', 'Ngozi', '李明'];

const scriptSamples = [
  { lang: 'English', code: 'en', text: 'The Lord is my shepherd; I shall not want.' },
  { lang: 'Français', code: 'fr', text: 'Le Seigneur est mon berger: je ne manquerai de rien.' },
  { lang: 'Português', code: 'pt', text: 'O Senhor é o meu pastor; nada me faltará.' },
  { lang: 'Kiswahili', code: 'sw', text: 'Bwana ndiye mchungaji wangu; sitapungukiwa na kitu.' },
  { lang: 'Yorùbá', code: 'yo', text: 'Ẹ kú àárọ̀. Ọlọ́run ni olùṣọ́ àgùntàn mi, èmi kì yóò ṣe aláìní. Ṣé ẹ̀ṣẹ̀ ń bẹ̀?' },
  { lang: 'Hausa', code: 'ha', text: 'Ubangiji ne makiyayina, ba zan rasa kome ba. Ɓarna, ɗan ƙauna, ƴar uwa.' },
  { lang: 'Igbo', code: 'ig', text: 'Onyenwe anyị bụ onye ọzụzụ atụrụ m; Ị̀ ga-ahụ ụzọ ọma. Ọ bụ ụlọ ụka.' },
];

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="flex flex-col gap-5 border-t border-line pt-8">
      <h2 id={`${id}-h`} className="text-h3 font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Demo({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

export function DesignGallery() {
  const prefs = usePrefs();
  const toast = useToast();
  const [view, setView] = useState('pathways');
  const [chip, setChip] = useState(true);
  const [select, setSelect] = useState('');
  const [accent, setAccent] = useState('clay');
  const [fieldError, setFieldError] = useState(true);
  const [loadingBtn, setLoadingBtn] = useState(false);

  const steps: ThreadStep[] = ['Welcome', 'Grace', 'Faith', 'Prayer', 'Rest'].map((label, i) => ({
    id: label,
    label,
    state: i < 2 ? 'done' : i === 2 ? 'current' : 'todo',
    stateLabel: i < 2 ? 'Done' : i === 2 ? 'Current' : 'Not started',
  }));

  return (
    <main id="main" className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-8 md:py-12">
      <div className="flex flex-col gap-4">
        <Wordmark />
        <PageHeader eyebrow="Design gallery" title="Components, tokens and states" description="Every element is rendered from the same tokens the product uses. Use the controls to check light, dark, motion, reading size and organisation accents." />
        <Card className="flex flex-col gap-4" aria-label="Preview controls">
          <div className="flex flex-wrap gap-6">
            <Demo label="Theme">
              <SegmentedControl
                label="Theme"
                value={prefs.theme}
                onValueChange={(v) => setPrefs({ theme: v as ThemePref })}
                options={[{ value: 'light', label: 'Light' }, { value: 'dark', label: 'Dark' }, { value: 'system', label: 'System' }]}
              />
            </Demo>
            <Demo label="Reading size">
              <SegmentedControl
                label="Reading size"
                value={prefs.readingSize}
                onValueChange={(v) => setPrefs({ readingSize: v as ReadingSize })}
                options={[{ value: 's', label: 'S' }, { value: 'm', label: 'M' }, { value: 'l', label: 'L' }, { value: 'xl', label: 'XL' }]}
              />
            </Demo>
            <Demo label="Accent">
              <SegmentedControl
                label="Organisation accent"
                value={accent}
                onValueChange={(v) => {
                  setAccent(v);
                  if (v === 'clay') document.documentElement.removeAttribute('data-accent');
                  else document.documentElement.setAttribute('data-accent', v);
                }}
                options={[{ value: 'clay', label: 'Clay' }, { value: 'moss', label: 'Moss' }, { value: 'ochre', label: 'Ochre' }, { value: 'slate', label: 'Slate' }]}
              />
            </Demo>
            <Demo label="Motion">
              <Switch label="Reduce motion" checked={prefs.motion === 'reduce'} onCheckedChange={(c) => setPrefs({ motion: c ? 'reduce' : 'system' })} />
            </Demo>
          </div>
        </Card>
        <nav aria-label="Gallery sections">
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {['colour', 'type', 'space', 'buttons', 'forms', 'navigation', 'overlays', 'display', 'states'].map((s) => (
              <li key={s}>
                <a className="inline-flex min-h-11 items-center capitalize text-accent-soft-ink underline underline-offset-4" href={`#${s}`}>
                  {s}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <Section id="colour" title="Colour">
        <Demo label="Paper (neutral)">
          {paper.map((n) => (
            <Swatch key={n} varName={`--paper-${n}`} label={String(n)} />
          ))}
        </Demo>
        <Demo label="Clay (accent)">
          {clay.map((n) => (
            <Swatch key={n} varName={`--clay-${n}`} label={String(n)} />
          ))}
        </Demo>
        <Demo label="Roles (change with theme and accent)">
          {roles.map((r) => (
            <Swatch key={r} varName={`--${r}`} label={r} />
          ))}
        </Demo>
        <Demo label="Bible highlights (each also gets an underline style in the reader)">
          {['straw', 'sage', 'rose', 'mist'].map((c) => (
            <span key={c} className="rounded-sm px-2 py-1 font-serif text-base" style={{ background: `var(--hl-${c})` }}>
              {c}
            </span>
          ))}
        </Demo>
        <Demo label="Avatar tints (deterministic from name)">
          {names.map((n) => (
            <Avatar key={n} name={n} />
          ))}
        </Demo>
      </Section>

      <Section id="type" title="Typography">
        <div className="flex flex-col gap-3">
          <p className="text-h1 font-semibold font-serif">Heading one, serif</p>
          <p className="text-h2 font-semibold font-serif">Heading two, serif</p>
          <p className="text-h3 font-semibold font-serif">Heading three, serif</p>
          <p className="text-h4 font-semibold">Heading four, sans</p>
          <p className="text-base">Interface text at 16 px. Labels, buttons and form text use this size.</p>
          <p className="text-sm text-muted">Small interface text for meta and dense tables.</p>
        </div>
        <div className="prose-reading rounded-lg border border-line bg-surface p-5 md:p-8">
          <h3>Reading column</h3>
          <p>
            Grace is a gift we do not earn. It meets us where we are, and then it does not leave us where it found us. This paragraph is set at reading size, with a measure near sixty-eight characters so the eye can rest.
          </p>
          <p>
            <span className="verse-num">8</span>For by grace you have been saved through faith, and that not of yourselves; it is the gift of God, <span className="verse-num">9</span>not of works, that no one would boast.
          </p>
          <blockquote>Be still, and know that I am God.</blockquote>
        </div>
        <Demo label="Six target languages (glyph coverage spike)">
          <div className="grid w-full gap-3 md:grid-cols-2">
            {scriptSamples.map((s) => (
              <Card key={s.code} padding="sm" lang={s.code}>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">{s.lang}</p>
                <p className="font-serif text-lg">{s.text}</p>
                <p className="mt-1 text-base">{s.text}</p>
              </Card>
            ))}
          </div>
        </Demo>
      </Section>

      <Section id="space" title="Spacing, radius, elevation, motion">
        <Demo label="Spacing (4 px base)">
          {[1, 2, 3, 4, 6, 8, 12, 16].map((n) => (
            <div key={n} className="flex flex-col items-center gap-1 text-xs text-muted">
              <div className="bg-accent" style={{ width: `calc(var(--spacing) * ${n})`, height: '1rem' }} />
              {n * 4}
            </div>
          ))}
        </Demo>
        <Demo label="Radius">
          {['xs', 'sm', 'md', 'lg', 'xl'].map((r) => (
            <div key={r} className="flex size-16 items-center justify-center border border-line-strong bg-surface text-xs" style={{ borderRadius: `var(--rad-${r})` }}>
              {r}
            </div>
          ))}
        </Demo>
        <Demo label="Elevation">
          {[['none', 'none'], ['1', 'var(--shadow-1)'], ['2', 'var(--shadow-2)'], ['3', 'var(--shadow-3)']].map(([n, s]) => (
            <div key={n} className="flex size-20 items-center justify-center rounded-md border border-line bg-raised text-sm" style={{ boxShadow: s }}>
              {n}
            </div>
          ))}
        </Demo>
        <Demo label="Progress thread and bar">
          <div className="w-full max-w-md">
            <ProgressThread steps={steps} />
          </div>
          <div className="w-full max-w-md">
            <Progress value={37} label="Lesson progress" valueText="3 of 8 lessons" />
          </div>
        </Demo>
      </Section>

      <Section id="buttons" title="Buttons">
        <Demo label="Variants">
          <Button>Start lesson</Button>
          <Button variant="secondary">Save for later</Button>
          <Button variant="ghost">Not now</Button>
          <Button variant="danger">
            <Trash size={18} aria-hidden="true" />
            Delete reflection
          </Button>
        </Demo>
        <Demo label="Sizes">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </Demo>
        <Demo label="States">
          <Button disabled>Disabled</Button>
          <Button
            loading={loadingBtn}
            onClick={() => {
              setLoadingBtn(true);
              window.setTimeout(() => setLoadingBtn(false), 1800);
            }}
          >
            Send feedback
          </Button>
          <Button variant="secondary">
            <DownloadSimple size={18} aria-hidden="true" />
            Download for offline
          </Button>
        </Demo>
        <Demo label="Icon buttons (always named)">
          <Tooltip content="Add to memory verses">
            <IconButton label="Add to memory verses" variant="secondary">
              <BookmarkSimple size={22} />
            </IconButton>
          </Tooltip>
          <IconButton label="Notifications">
            <Bell size={22} />
          </IconButton>
          <IconButton label="New reflection" variant="accent">
            <Plus size={22} />
          </IconButton>
        </Demo>
      </Section>

      <Section id="forms" title="Forms">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Display name" description="This is how others in your group see you." required>
            {(p) => <Input placeholder="Adaeze Okafor" {...p} />}
          </Field>
          <Field label="Email" error={fieldError ? 'Enter an email address such as name@example.org.' : undefined} required>
            {(p) => <Input type="email" defaultValue="adaeze@" onChange={() => setFieldError(false)} {...p} />}
          </Field>
          <Field label="First reflection" description="Write as much or as little as you like.">
            {(p) => <Textarea placeholder="What stayed with you from today's lesson?" {...p} />}
          </Field>
          <Field label="Language">
            {(p) => (
              <Select
                {...p}
                value={select}
                onValueChange={setSelect}
                placeholder="Choose a language"
                options={[{ value: 'en', label: 'English' }, { value: 'fr', label: 'Français' }, { value: 'pt', label: 'Português' }, { value: 'sw', label: 'Kiswahili' }, { value: 'yo', label: 'Yorùbá' }, { value: 'ha', label: 'Hausa' }, { value: 'ig', label: 'Igbo' }]}
              />
            )}
          </Field>
          <div>
            <Checkbox label="Share with my mentor" description="You can change this until your mentor has replied." defaultChecked />
            <Checkbox label="Send me a weekly summary" />
            <Checkbox label="Select all" checked="indeterminate" />
          </div>
          <div>
            <Switch label="Download audio" description="Uses about 12 MB per lesson." />
            <RadioGroup
              defaultValue="mentor"
              aria-label="Who can see this reflection"
              options={[
                { value: 'private', label: 'Only me', description: 'Stays in your journal.' },
                { value: 'mentor', label: 'My mentor' },
                { value: 'group', label: 'My group' },
              ]}
            />
          </div>
        </div>
      </Section>

      <Section id="navigation" title="Navigation">
        <Demo label="Segmented control">
          <SegmentedControl
            label="Journey view"
            value={view}
            onValueChange={setView}
            options={[{ value: 'pathways', label: 'Pathways' }, { value: 'timeline', label: 'Timeline' }, { value: 'milestones', label: 'Milestones' }]}
          />
        </Demo>
        <Tabs defaultValue="overview">
          <TabsList aria-label="Mentee sections">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reflections">Reflections</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">Journey summary, current lesson and recent shared reflections.</TabsContent>
          <TabsContent value="reflections">Shared reflections with response status.</TabsContent>
          <TabsContent value="goals">Goals and steps.</TabsContent>
          <TabsContent value="sessions">Check-ins and private notes.</TabsContent>
        </Tabs>
        <Demo label="Filter chips">
          <Chip selected={chip} onClick={() => setChip((c) => !c)}>
            Has feedback
          </Chip>
          <Chip>This month</Chip>
        </Demo>
      </Section>

      <Section id="overlays" title="Overlays">
        <Demo label="Dialog, sheet, menu, toast">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">Open dialog</Button>
            </DialogTrigger>
            <DialogContent
              title="Delete this reflection?"
              description="It will be removed from your journal and from anyone you shared it with."
              closeLabel="Close"
              footer={
                <>
                  <DialogClose asChild>
                    <Button variant="secondary">Keep it</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button variant="danger">Delete reflection</Button>
                  </DialogClose>
                </>
              }
            />
          </Dialog>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary">Open sheet</Button>
            </SheetTrigger>
            <SheetContent title="Write a reflection" description="Bottom sheet on phones, side panel on larger screens." closeLabel="Close">
              <Textarea placeholder="What stayed with you?" aria-label="Reflection" rows={6} />
            </SheetContent>
          </Sheet>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary">Open menu</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Share with mentor</DropdownMenuItem>
              <DropdownMenuItem>Export as text</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="secondary" onClick={() => toast.show({ title: 'Reflection saved', description: 'Visible only to you.', tone: 'success' })}>
            Show toast
          </Button>
          <Button variant="secondary" onClick={() => toast.show({ title: "Couldn't send feedback", description: 'Your draft is safe. Try again.', tone: 'danger', actionLabel: 'Try again' })}>
            Show error toast
          </Button>
        </Demo>
      </Section>

      <Section id="display" title="Display">
        <Demo label="Avatars">
          <Avatar name="Grace Wanjiru" size="sm" />
          <Avatar name="Grace Wanjiru" size="md" />
          <Avatar name="Grace Wanjiru" size="lg" />
        </Demo>
        <Demo label="Badges (status is never colour-only)">
          <Badge>Draft</Badge>
          <Badge tone="accent">Waiting for you</Badge>
          <Badge tone="success">Answered</Badge>
          <Badge tone="warning">Update available</Badge>
          <Badge tone="danger">Could not send</Badge>
        </Demo>
        <div className="grid gap-4 md:grid-cols-2">
          <Card interactive>
            <h3 className="text-h4 font-semibold font-sans">Foundations of Faith</h3>
            <p className="mt-1 text-base text-muted">Eight short lessons on the basics, with space to reflect after each.</p>
            <div className="mt-4">
              <Progress value={37} label="Pathway progress" valueText="3 of 8 lessons" />
            </div>
          </Card>
          <Notice tone="info" title="A note on privacy">
            Only you can read this unless you choose to share it.
          </Notice>
          <Notice tone="warning" title="This lesson was updated">
            Your progress is kept. View what changed.
          </Notice>
          <Notice tone="danger" title="We couldn't save your changes">
            Nothing was lost. Check your connection and try again.
          </Notice>
        </div>
      </Section>

      <Section id="states" title="State matrix">
        <p className="max-w-prose text-base text-muted">Every screen defines loading, empty, error and offline. These are the shared patterns.</p>
        <div className="grid gap-4 md:grid-cols-2">
          <Card aria-busy="true" aria-label="Loading example">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Loading</p>
            <div className="flex flex-col gap-4">
              <SkeletonRow />
              <SkeletonRow />
              <Skeleton className="h-24 w-full" />
              <SkeletonText lines={3} />
            </div>
          </Card>
          <Card padding="none">
            <p className="px-4 pt-4 text-xs font-semibold uppercase tracking-wide text-muted">Empty (first use)</p>
            <EmptyState illustration={<BookIllustration />} title="Your journal is ready" description="When you write a reflection, it will be kept here, linked to the lesson that prompted it." action={<Button>Write your first reflection</Button>} />
          </Card>
          <Card padding="none">
            <p className="px-4 pt-4 text-xs font-semibold uppercase tracking-wide text-muted">Empty (filtered)</p>
            <EmptyState illustration={<LampIllustration />} title="Nothing matches those filters" description="Try removing a filter to see more of your journal." action={<Button variant="secondary">Clear filters</Button>} />
          </Card>
          <Card padding="none">
            <p className="px-4 pt-4 text-xs font-semibold uppercase tracking-wide text-muted">Error</p>
            <ErrorState title="Something didn't load" description="Check your connection and try again. Nothing you wrote has been lost." retryLabel="Try again" onRetry={() => toast.show({ title: 'Retrying…' })} details={{ label: 'Show details', requestId: 'req_01J9XK4M2T' }} />
          </Card>
          <Card padding="none" className="overflow-hidden md:col-span-2">
            <p className="px-4 pt-4 text-xs font-semibold uppercase tracking-wide text-muted">Offline</p>
            <OfflineBanner message="You're offline. Showing what's saved on this device." className="mt-3" />
            <EmptyState illustration={<CloudOffIllustration />} title="This isn't saved on your device yet" description="Download it while you're online and it will open here without a connection." action={<Button variant="secondary">Back to downloaded lessons</Button>} />
          </Card>
          <Card padding="none" className="md:col-span-2">
            <EmptyState illustration={<PathIllustration />} title="Choose a pathway to begin" description="A pathway is a short, guided series of lessons. You can change your mind at any time." />
          </Card>
        </div>
        <div className="flex items-center gap-3 text-muted">
          <LogoMark />
          <span className="text-sm">Logo mark: the tile with a thread through it.</span>
        </div>
      </Section>
    </main>
  );
}

function Swatch({ varName, label }: { varName: string; label: string }) {
  return (
    <div className="flex w-20 flex-col gap-1 text-xs text-muted">
      <div className="h-10 rounded-sm border border-line" style={{ background: `var(${varName})` }} />
      <span className="break-words">{label}</span>
    </div>
  );
}
