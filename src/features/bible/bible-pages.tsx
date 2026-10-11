import { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useNavigate, useParams, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, BookmarkSimple, Copy, ListBullets, NotePencil, SlidersHorizontal, Trash, X } from '@phosphor-icons/react';
import type { BibleRange, BibleVerse, HighlightColor, RichDoc } from '@/types';
import { useT, useFormat } from '@/lib/i18n';
import { Link, usePathname } from '@/lib/nav';
import { BOOKS, bookByCode } from '@/lib/bible/books';
import { loadChapter } from '@/lib/bible/loader';
import { formatRef, parseRef, overlaps } from '@/lib/bible/ref';
import { emptyDoc } from '@/lib/editor/text';
import { setPrefs, usePrefs, type ReadingSize } from '@/lib/prefs';
import { reflectionsService } from '@/lib/services/reflections';
import { ApiError } from '@/lib/db/errors';
import { schedule } from '@/lib/srs';
import { memoryService } from '@/lib/services/memory';
import { QueryState } from '@/components/data/query-state';
import { PageHeader } from '@/components/patterns/page-header/page-header';
import { EmptyState } from '@/components/patterns/empty-state/empty-state';
import { Button, buttonStyles } from '@/components/ui/button/button';
import { Card } from '@/components/ui/card/card';
import { Badge } from '@/components/ui/badge/badge';
import { Input } from '@/components/ui/input/input';
import { IconButton } from '@/components/ui/icon-button/icon-button';
import { SegmentedControl } from '@/components/ui/segmented-control/segmented-control';
import { Sheet, SheetContent } from '@/components/ui/sheet/sheet';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton/skeleton';
import { Field } from '@/components/ui/field/field';
import { Tooltip } from '@/components/ui/tooltip/tooltip';
import { RichEditor } from '@/components/content/rich-editor';
import { RichView } from '@/components/content/rich-view';
import { PassageText } from '@/components/content/scripture';
import { BookIllustration, LampIllustration } from '@/components/icons/illustrations';
import { useToast } from '@/components/ui/toast/toast';
import { cn } from '@/lib/cn';
import { useAddMemoryVerse, useMemoryVerses, useRemoveMemoryVerse, useReviewVerse } from './hooks';
import { useAllAnnotations, useAnnotations, useDeleteNote, useHighlight, useSaveNote } from '@/features/community/hooks';

const COLORS: HighlightColor[] = ['straw', 'sage', 'rose', 'mist'];
const colorBg: Record<HighlightColor, string> = { straw: 'bg-hl-straw', sage: 'bg-hl-sage', rose: 'bg-hl-rose', mist: 'bg-hl-mist' };
// A second cue besides colour, so highlights never depend on colour alone.
const colorLine: Record<HighlightColor, string> = { straw: 'decoration-solid', sage: 'decoration-dotted', rose: 'decoration-wavy', mist: 'decoration-double' };

/** Shell for the non-reading Bible pages: Library, Highlights and notes, Memorise. */
export function BibleHub() {
  const t = useT();
  const nav = useNavigate();
  const path = usePathname();
  const value = path.includes('/memorise') ? 'memorise' : path.endsWith('/notes') ? 'notes' : path.includes('/plans') ? 'plans' : 'read';
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t('bible.title')} description={t('bible.description')} />
      <SegmentedControl label={t('bible.sections')} className="self-start" value={value} onValueChange={(v) => nav(v === 'read' ? '/app/bible' : `/app/bible/${v}`)} options={[{ value: 'read', label: t('bible.read') }, { value: 'plans', label: t('bible.plansTab') }, { value: 'notes', label: t('bible.notesTab') }, { value: 'memorise', label: t('bible.memoriseTab') }]} />
      <Outlet />
    </div>
  );
}

export function BibleLibrary() {
  const t = useT();
  const nav = useNavigate();
  const [ref, setRef] = useState('');
  const [error, setError] = useState<string | undefined>();
  const last = (() => { try { return JSON.parse(localStorage.getItem('tessera.lastRead') ?? 'null') as { book: string; chapter: number } | null; } catch { return null; } })();
  const go = () => {
    const r = parseRef(ref);
    if (!r) { setError(t('bible.refInvalid')); return; }
    nav(`/app/bible/${r.book}/${r.chapter}${r.verseEnd ? `?v=${r.verseStart}${r.verseEnd !== r.verseStart ? `-${r.verseEnd}` : ''}` : ''}`);
  };
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end gap-3">
        <form className="flex max-w-md flex-1 items-end gap-2" onSubmit={(e) => { e.preventDefault(); go(); }}>
          <Field className="flex-1" label={t('bible.jump')} description={t('bible.jumpHelp')} error={error}>{(p) => <Input {...p} value={ref} onChange={(e) => { setRef(e.target.value); setError(undefined); }} placeholder="John 3:16" />}</Field>
          <Button type="submit" className="mb-0.5">{t('bible.go')}</Button>
        </form>
        {last ? <Link to={`/app/bible/${last.book}/${last.chapter}`} className={buttonStyles({ variant: 'secondary' })}>{t('bible.continueReading', { ref: `${bookByCode.get(last.book)?.name ?? last.book} ${last.chapter}` })}</Link> : null}
      </div>
      {(['OT', 'NT'] as const).map((tm) => (
        <section key={tm} aria-labelledby={`tm-${tm}`} className="flex flex-col gap-3">
          <h2 id={`tm-${tm}`} className="text-h3 font-semibold">{t(tm === 'OT' ? 'bible.oldTestament' : 'bible.newTestament')}</h2>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {BOOKS.filter((b) => b.testament === tm).map((b) => (
              <li key={b.code}><Link to={`/app/bible/${b.code}/1`} className="flex min-h-11 items-center justify-between rounded-md border border-line bg-surface px-3 py-2 transition-colors motion-fast hover:border-line-strong hover:bg-sunken"><span className="text-base font-medium">{b.name}</span><span className="text-sm text-subtle">{b.chapters}</span></Link></li>
            ))}
          </ul>
        </section>
      ))}
      <p className="text-sm text-muted">{t('bible.attribution')}</p>
    </div>
  );
}

function groupParagraphs(verses: BibleVerse[]): BibleVerse[][] {
  const out: BibleVerse[][] = [];
  for (const v of verses) { if (v.p || out.length === 0) out.push([v]); else out[out.length - 1]?.push(v); }
  return out;
}

function parseV(v: string | null): [number, number] | null {
  const m = v?.match(/^(\d+)(?:-(\d+))?$/);
  return m ? [Number(m[1]), Number(m[2] ?? m[1])] : null;
}

export function BibleReader() {
  const { book = 'JHN', chapter: ch = '1' } = useParams();
  const chapter = Number(ch) || 1;
  const t = useT();
  const nav = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();
  const info = bookByCode.get(book);
  const q = useQuery({ queryKey: ['chapter', book, chapter], queryFn: () => loadChapter(book, chapter), staleTime: Infinity });
  const ann = useAnnotations(book, chapter);
  const highlight = useHighlight();
  const memAdd = useAddMemoryVerse();
  const mem = useMemoryVerses();
  const prefs = usePrefs();
  const [selected, setSelected] = useState<number[]>(() => { const v = parseV(params.get('v')); return v ? Array.from({ length: v[1] - v[0] + 1 }, (_, i) => v[0] + i) : []; });
  const [picker, setPicker] = useState(false);
  const [settings, setSettings] = useState(false);
  const [noteFor, setNoteFor] = useState<BibleRange | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => { try { localStorage.setItem('tessera.lastRead', JSON.stringify({ book, chapter })); } catch { /* storage may be blocked */ } }, [book, chapter]);
  useEffect(() => {
    const v = parseV(params.get('v'));
    setSelected(v ? Array.from({ length: v[1] - v[0] + 1 }, (_, i) => v[0] + i) : []);
    if (v) window.setTimeout(() => document.getElementById(`v-${v[0]}`)?.scrollIntoView({ block: 'center' }), 60);
    else window.scrollTo({ top: 0 });
  }, [book, chapter]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!info || chapter < 1 || chapter > info.chapters) return <EmptyState illustration={<BookIllustration />} title={t('states.notFoundTitle')} description={t('bible.refInvalid')} action={<Link to="/app/bible" className={buttonStyles()}>{t('bible.title')}</Link>} />;

  const sel = [...selected].sort((a, b) => a - b);
  const range: BibleRange | null = sel.length ? { book, chapter, verseStart: sel[0] as number, verseEnd: sel[sel.length - 1] as number } : null;
  const highlightFor = (v: number) => ann.data?.highlights.find((h) => h.range.chapter === chapter && h.range.book === book && v >= h.range.verseStart && v <= (h.range.verseEnd || 999));
  const noteAt = (v: number) => ann.data?.notes.find((n) => v >= n.range.verseStart && v <= (n.range.verseEnd || 999));
  const toggle = (v: number) => setSelected((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));

  const verseTextOf = (verses: BibleVerse[]) => verses.filter((v) => sel.includes(v.v)).map((v) => v.text.replaceAll(' / ', ' ')).join(' ');

  const prev = chapter > 1 ? { book, chapter: chapter - 1 } : (() => { const i = BOOKS.findIndex((b) => b.code === book); const b = BOOKS[i - 1]; return b ? { book: b.code, chapter: b.chapters } : null; })();
  const next = chapter < info.chapters ? { book, chapter: chapter + 1 } : (() => { const i = BOOKS.findIndex((b) => b.code === book); const b = BOOKS[i + 1]; return b ? { book: b.code, chapter: 1 } : null; })();

  return (
    <div ref={topRef} className="mx-auto flex max-w-[68ch] flex-col gap-4 pb-28 lg:max-w-3xl">
      <div className="sticky top-14 z-10 -mx-4 flex items-center gap-2 border-b border-line bg-bg px-4 py-2 lg:-mx-8 lg:px-8">
        <Link to="/app/bible" aria-label={t('bible.title')} className="inline-flex size-11 items-center justify-center rounded-md text-muted hover:bg-sunken"><ArrowLeft size={20} aria-hidden="true" /></Link>
        <Button variant="secondary" onClick={() => setPicker(true)} className="min-w-0 flex-1 justify-between sm:flex-none"><span className="truncate">{info.name} {chapter}</span><ListBullets size={18} aria-hidden="true" /></Button>
        <span className="ms-auto text-sm text-muted">{t('bible.webShort')}</span>
        <IconButton label={t('learn.lesson.readerSettings')} onClick={() => setSettings(true)}><SlidersHorizontal size={20} /></IconButton>
      </div>

      <QueryState query={q} skeleton={<div className="flex flex-col gap-3"><SkeletonText lines={6} /><SkeletonText lines={5} /><Skeleton className="h-4 w-1/3" /></div>}>
        {(verses) => (
          <article aria-label={`${info.name} ${chapter}`} className="prose-reading max-w-none">
            <h1 className="mb-4 text-h2 font-semibold">{info.name} {chapter}</h1>
            {groupParagraphs(verses).map((para, i) => (
              <p key={i} className={para[0]?.poetry ? 'ps-2' : undefined}>
                {para.map((v) => {
                  const h = highlightFor(v.v);
                  const isSel = selected.includes(v.v);
                  const note = noteAt(v.v);
                  return (
                    <span key={v.v} className={v.poetry ? 'block ps-4 -indent-4' : undefined}>
                      <span
                        id={`v-${v.v}`} role="button" tabIndex={0} aria-pressed={isSel}
                        aria-label={`${t('bible.verse', { n: v.v })}${h ? `, ${t(`bible.color.${h.color}`)}` : ''}${note ? `, ${t('bible.hasNote')}` : ''}`}
                        onClick={() => toggle(v.v)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(v.v); } }}
                        className={cn('cursor-pointer rounded-xs px-0.5 transition-colors motion-fast', h && `${colorBg[h.color]} underline decoration-1 underline-offset-4 ${colorLine[h.color]}`, isSel && 'outline outline-2 outline-offset-1 outline-accent')}
                      >
                        <span className="verse-num">{v.v}</span>{v.text.replaceAll(' / ', ' ')}
                      </span>
                      {note ? <button type="button" aria-label={t('bible.openNote')} onClick={() => setNoteFor(note.range)} className="ms-0.5 inline-flex size-6 items-center justify-center align-middle text-accent-soft-ink"><NotePencil size={14} weight="fill" aria-hidden="true" /></button> : null}{' '}
                    </span>
                  );
                })}
              </p>
            ))}
            <nav aria-label={t('bible.chapterNav')} className="mt-8 flex items-center justify-between gap-2 font-sans text-base">
              {prev ? <Link to={`/app/bible/${prev.book}/${prev.chapter}`} className={buttonStyles({ variant: 'secondary' })}><ArrowLeft size={16} aria-hidden="true" />{t('bible.previous')}</Link> : <span />}
              {next ? <Link to={`/app/bible/${next.book}/${next.chapter}`} className={buttonStyles({ variant: 'secondary' })}>{t('bible.next')}<ArrowRight size={16} aria-hidden="true" /></Link> : <span />}
            </nav>
            {/* Selection toolbar */}
            {range ? (
              <div role="toolbar" aria-label={t('bible.selectionTools', { ref: formatRef(range) })} className="fixed inset-x-0 bottom-16 z-20 mx-auto flex max-w-xl flex-wrap items-center justify-center gap-1 rounded-lg border border-line bg-raised p-2 shadow-pop lg:bottom-6 lg:start-64 font-sans">
                <span className="px-2 text-sm font-medium">{formatRef(range)}</span>
                {COLORS.map((c) => (
                  <Tooltip key={c} content={t(`bible.color.${c}`)}>
                    <button type="button" aria-label={t('bible.highlightWith', { color: t(`bible.color.${c}`) })} onClick={() => highlight.mutate([range, c], { onSuccess: () => setSelected([]) })} className={cn('size-11 rounded-md border border-line-strong md:size-9 coarse:size-11', colorBg[c])} />
                  </Tooltip>
                ))}
                <IconButton size="sm" label={t('bible.removeHighlight')} onClick={() => highlight.mutate([range, null], { onSuccess: () => setSelected([]) })}><X size={18} /></IconButton>
                <IconButton size="sm" label={t('bible.addNote')} onClick={() => setNoteFor(range)}><NotePencil size={18} /></IconButton>
                <IconButton size="sm" label={t('bible.addMemory')} onClick={() => memAdd.mutate({ range, source: { type: 'bible', id: null } }, { onSuccess: () => toast.show({ title: t('learn.memory.addedToast', { ref: formatRef(range) }), tone: 'success' }), onError: (e) => toast.show({ title: e instanceof ApiError ? e.message : t('states.errorTitle'), tone: 'danger' }) })}><BookmarkSimple size={18} /></IconButton>
                <IconButton size="sm" label={t('bible.copy')} onClick={async () => { try { await navigator.clipboard.writeText(`${verseTextOf(verses)} — ${formatRef(range)} (WEB)`); toast.show({ title: t('bible.copied'), tone: 'success' }); } catch { toast.show({ title: t('bible.copyFailed'), tone: 'danger' }); } }}><Copy size={18} /></IconButton>
                <IconButton size="sm" label={t('bible.clearSelection')} onClick={() => setSelected([])}><Trash size={18} /></IconButton>
              </div>
            ) : null}
          </article>
        )}
      </QueryState>
      <p className="font-sans text-sm text-muted">{t('bible.attribution')}</p>

      <Sheet open={picker} onOpenChange={setPicker}>
        <SheetContent title={t('bible.choose')} closeLabel={t('actions.close')} side="responsive">
          <ChapterPicker current={book} onPick={(b, c) => { setPicker(false); nav(`/app/bible/${b}/${c}`); }} />
        </SheetContent>
      </Sheet>
      <Sheet open={settings} onOpenChange={setSettings}>
        <SheetContent title={t('learn.lesson.readerSettings')} closeLabel={t('actions.close')} side="responsive">
          <div className="flex flex-col gap-4"><SegmentedControl label={t('learn.lesson.textSize')} value={prefs.readingSize} onValueChange={(v) => setPrefs({ readingSize: v as ReadingSize })} options={[{ value: 's', label: t('learn.lesson.sizeS') }, { value: 'm', label: t('learn.lesson.sizeM') }, { value: 'l', label: t('learn.lesson.sizeL') }, { value: 'xl', label: t('learn.lesson.sizeXL') }]} />
            <SegmentedControl label={t('learn.lesson.lineSpacing')} value={prefs.readingSpacing} onValueChange={(v) => setPrefs({ readingSpacing: v as 'comfortable' | 'relaxed' })} options={[{ value: 'comfortable', label: t('learn.lesson.comfortable') }, { value: 'relaxed', label: t('learn.lesson.relaxed') }]} /></div>
        </SheetContent>
      </Sheet>
      <NoteSheet range={noteFor} existing={noteFor ? ann.data?.notes.find((n) => overlaps(n.range, noteFor)) : undefined} onClose={() => setNoteFor(null)} />
      <span className="hidden">{mem.data?.length}</span>
    </div>
  );
}

function ChapterPicker({ current, onPick }: { current: string; onPick: (b: string, c: number) => void }) {
  const t = useT();
  const [open, setOpen] = useState(current);
  return (
    <div className="flex flex-col gap-1">
      {(['OT', 'NT'] as const).map((tm) => (
        <div key={tm}>
          <p className="px-1 py-2 text-xs font-semibold uppercase tracking-wide text-muted">{t(tm === 'OT' ? 'bible.oldTestament' : 'bible.newTestament')}</p>
          {BOOKS.filter((b) => b.testament === tm).map((b) => (
            <div key={b.code}>
              <button type="button" aria-expanded={open === b.code} onClick={() => setOpen(open === b.code ? '' : b.code)} className={cn('flex min-h-11 w-full items-center justify-between rounded-md px-3 text-start text-base hover:bg-sunken', open === b.code && 'bg-accent-soft font-medium')}>{b.name}<span className="text-sm text-subtle">{b.chapters}</span></button>
              {open === b.code ? <div className="grid grid-cols-6 gap-1 p-2 sm:grid-cols-8">{Array.from({ length: b.chapters }, (_, i) => <button key={i} type="button" onClick={() => onPick(b.code, i + 1)} className="min-h-11 rounded-sm border border-line text-sm hover:bg-sunken">{i + 1}</button>)}</div> : null}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function NoteSheet({ range, existing, onClose }: { range: BibleRange | null; existing?: { id: string; body: RichDoc } | undefined; onClose: () => void }) {
  const t = useT();
  const toast = useToast();
  const save = useSaveNote();
  const del = useDeleteNote();
  const [body, setBody] = useState<RichDoc>(emptyDoc());
  const [key, setKey] = useState(0);
  useEffect(() => { setBody(existing?.body ?? emptyDoc()); setKey((k) => k + 1); }, [range?.verseStart, range?.verseEnd, range?.chapter, existing?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Sheet open={!!range} onOpenChange={(o) => !o && onClose()}>
      <SheetContent title={range ? t('bible.noteOn', { ref: formatRef(range) }) : ''} description={t('bible.notePrivate')} closeLabel={t('actions.close')} side="responsive">
        {range ? (
          <div className="flex flex-col gap-4">
            <div className="rounded-md bg-sunken p-3"><PassageText range={range} className="text-base" /></div>
            <RichEditor key={key} label={t('bible.noteLabel')} value={body} onChange={setBody} placeholder={t('bible.notePlaceholder')} autoFocus minHeight="sm" />
            <div className="flex flex-wrap gap-2">
              <Button loading={save.isPending} onClick={() => save.mutate({ id: existing?.id, range, body }, { onSuccess: () => { toast.show({ title: t('bible.noteSaved'), tone: 'success' }); onClose(); } })}>{t('actions.save')}</Button>
              {existing ? <Button variant="ghost" loading={del.isPending} onClick={() => del.mutate(existing.id, { onSuccess: onClose })}>{t('actions.delete')}</Button> : null}
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export function NotesPage() {
  const t = useT();
  const f = useFormat();
  const nav = useNavigate();
  const toast = useToast();
  const q = useAllAnnotations();
  const [color, setColor] = useState<'all' | HighlightColor>('all');
  return (
    <QueryState query={q} skeleton={<SkeletonText lines={5} />}>
      {(d) => (
        <div className="flex flex-col gap-8">
          <section aria-labelledby="hl-h" className="flex flex-col gap-3">
            <h2 id="hl-h" className="text-h3 font-semibold">{t('bible.highlights')}</h2>
            <div role="group" aria-label={t('bible.filterColour')} className="flex flex-wrap gap-2">
              {(['all', ...COLORS] as const).map((c) => <Button key={c} size="sm" variant={color === c ? 'primary' : 'secondary'} aria-pressed={color === c} onClick={() => setColor(c)}>{c === 'all' ? t('bible.allColours') : t(`bible.color.${c}`)}</Button>)}
            </div>
            {d.highlights.filter((h) => color === 'all' || h.color === color).length ? (
              <ul className="flex flex-col gap-3">{d.highlights.filter((h) => color === 'all' || h.color === color).map((h) => (
                <li key={h.id}><Link to={`/app/bible/${h.range.book}/${h.range.chapter}?v=${h.range.verseStart}-${h.range.verseEnd}`} className="block rounded-lg border border-line bg-surface p-4 hover:bg-sunken"><p className="mb-1 flex items-center gap-2 font-medium"><span className={cn('size-3 rounded-full border border-line-strong', colorBg[h.color])} aria-hidden="true" />{formatRef(h.range)}<span className="text-sm font-normal text-muted">{f.date(h.createdAt)}</span></p><PassageText range={h.range} className="text-base text-muted" /></Link></li>
              ))}</ul>
            ) : <EmptyState illustration={<LampIllustration />} title={t('bible.noHighlightsTitle')} description={t('bible.noHighlightsBody')} action={<Link to="/app/bible" className={buttonStyles()}>{t('bible.openBible')}</Link>} />}
          </section>
          <section aria-labelledby="nt-h" className="flex flex-col gap-3">
            <h2 id="nt-h" className="text-h3 font-semibold">{t('bible.notes')}</h2>
            {d.notes.length ? <ul className="flex flex-col gap-3">{d.notes.map((n) => (
              <li key={n.id}><Card className="flex flex-col gap-2"><Link to={`/app/bible/${n.range.book}/${n.range.chapter}?v=${n.range.verseStart}-${n.range.verseEnd}`} className="font-medium text-accent-soft-ink underline underline-offset-4">{formatRef(n.range)}</Link><RichView doc={n.body} className="prose-reading text-[length:0.95em]" /><div className="flex flex-wrap items-center gap-3"><span className="text-sm text-muted">{f.ago(n.updatedAt)}</span>
                <Button size="sm" variant="secondary" onClick={async () => { try { const r = await reflectionsService.create({ title: formatRef(n.range), body: n.body }); toast.show({ title: t('bible.madeReflection'), tone: 'success' }); nav(`/app/journal/${r.id}`); } catch { toast.show({ title: t('states.errorTitle'), tone: 'danger' }); } }}>{t('bible.toReflection')}</Button></div></Card></li>
            ))}</ul> : <p className="text-base text-muted">{t('bible.noNotes')}</p>}
          </section>
        </div>
      )}
    </QueryState>
  );
}

function dueText(iso: string, t: ReturnType<typeof useT>, f: ReturnType<typeof useFormat>) {
  const d = new Date(iso).getTime() - Date.now();
  if (d <= 0) return t('bible.memory.readyNow');
  const days = Math.round(d / 86_400_000);
  return days <= 0 ? t('bible.memory.laterToday') : days === 1 ? t('bible.memory.tomorrow') : t('bible.memory.inDays', { days, date: f.date(iso) });
}

export function MemorisePage() {
  const t = useT();
  const f = useFormat();
  const toast = useToast();
  const q = useMemoryVerses();
  const add = useAddMemoryVerse();
  const remove = useRemoveMemoryVerse();
  const [ref, setRef] = useState('');
  const parsed = parseRef(ref);
  const due = (q.data ?? []).filter((v) => v.srs.dueAt <= new Date().toISOString());
  const nextDue = (q.data ?? []).map((v) => v.srs.dueAt).sort()[0];
  return (
    <div className="flex flex-col gap-6">
      <QueryState query={q} skeleton={<SkeletonText lines={4} />}>
        {(list) => (
          <>
            <Card className="flex flex-wrap items-center justify-between gap-3 bg-accent-soft">
              <div><h2 className="text-h4 font-semibold">{due.length ? t('bible.memory.dueTitle', { count: due.length }) : t('bible.memory.caughtUp')}</h2><p className="text-base text-muted">{due.length ? t('bible.memory.dueBody') : nextDue ? t('bible.memory.nextReview', { when: dueText(nextDue, t, f) }) : t('bible.memory.addFirst')}</p></div>
              {due.length ? <Link to="/app/bible/memorise/review" className={buttonStyles({ size: 'lg' })}>{t('bible.memory.start')}</Link> : null}
            </Card>
            <form className="flex flex-col gap-2 sm:flex-row sm:items-end" onSubmit={(e) => { e.preventDefault(); if (parsed) add.mutate({ range: parsed }, { onSuccess: () => { setRef(''); toast.show({ title: t('learn.memory.addedToast', { ref: formatRef(parsed) }), tone: 'success' }); }, onError: (er) => toast.show({ title: er instanceof ApiError ? er.message : t('states.errorTitle'), tone: 'danger' }) }); }}>
              <Field className="flex-1" label={t('bible.memory.addLabel')} description={t('bible.jumpHelp')} error={ref && !parsed ? t('bible.refInvalid') : undefined}>{(p) => <Input {...p} value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Psalm 23:1" />}</Field>
              <Button type="submit" loading={add.isPending} disabled={!parsed || !parsed.verseEnd}>{t('learn.memory.add')}</Button>
            </form>
            {parsed && parsed.verseEnd ? <div className="rounded-md bg-sunken p-3"><PassageText range={parsed} className="text-base" /></div> : null}
            {list.length ? (
              <ul className="flex flex-col gap-3">{list.map((v) => (
                <li key={v.id}><Card className="flex flex-col gap-2">
                  <div className="flex flex-wrap items-center gap-2"><h3 className="font-sans text-base font-semibold">{formatRef(v.range)}</h3><Badge tone={v.state === 'known' ? 'success' : v.state === 'learning' ? 'accent' : 'neutral'}>{t(`bible.memory.state.${v.state}`)}</Badge><span className="ms-auto text-sm text-muted">{dueText(v.srs.dueAt, t, f)}</span></div>
                  <p className="font-serif text-base text-muted">{v.text}</p>
                  <div><Button size="sm" variant="ghost" onClick={() => remove.mutate(v.id)}><Trash size={16} aria-hidden="true" />{t('actions.remove')}</Button></div>
                </Card></li>
              ))}</ul>
            ) : <EmptyState illustration={<BookIllustration />} title={t('bible.memory.emptyTitle')} description={t('bible.memory.emptyBody')} />}
          </>
        )}
      </QueryState>
    </div>
  );
}

export function ReviewSession() {
  const t = useT();
  const f = useFormat();
  const q = useQuery({ queryKey: ['review-queue'], queryFn: memoryService.due, staleTime: Infinity, gcTime: 0 });
  const review = useReviewVerse();
  const [i, setI] = useState(0);
  const [shown, setShown] = useState(false);
  const [hint, setHint] = useState(false);
  const [done, setDone] = useState(0);
  const queue = useMemo(() => q.data ?? [], [q.data]);
  const cur = queue[i];
  const rate = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!cur) return;
    review.mutate({ id: cur.id, rating }, { onSuccess: () => { setDone((d) => d + 1); setShown(false); setHint(false); setI((x) => x + 1); } });
  };
  const preview = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!cur) return '';
    const n = schedule(cur.srs, rating);
    return n.intervalDays === 0 ? t('bible.memory.in10') : n.intervalDays === 1 ? t('bible.memory.tomorrow') : t('bible.memory.inDays', { days: n.intervalDays, date: f.date(new Date(Date.now() + n.intervalDays * 86_400_000).toISOString()) });
  };
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <Link to="/app/bible/memorise" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"><ArrowLeft size={16} aria-hidden="true" />{t('bible.memoriseTab')}</Link>
      <QueryState query={q} skeleton={<Skeleton className="h-56 w-full" />}>
        {() => !queue.length || !cur ? (
          <EmptyState illustration={<LampIllustration />} title={done ? t('bible.memory.sessionDone', { count: done }) : t('bible.memory.caughtUp')} description={done ? t('bible.memory.sessionDoneBody') : t('bible.memory.nothingDue')} action={<Link to="/app/bible/memorise" className={buttonStyles()}>{t('bible.memory.back')}</Link>} />
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted" aria-live="polite">{t('bible.memory.progress', { n: i + 1, total: queue.length })}</p>
            <Card padding="lg" className="flex min-h-56 flex-col justify-center gap-3 text-center">
              <h2 className="font-serif text-h3 font-semibold">{formatRef(cur.range)}</h2>
              {shown ? <p className="prose-reading mx-auto font-serif">{cur.text}</p> : hint ? <p className="font-serif text-lg text-muted">{cur.text.split(' ').slice(0, 4).join(' ')}…</p> : <p className="text-base text-muted">{t('bible.memory.prompt')}</p>}
            </Card>
            {!shown ? (
              <div className="flex flex-wrap justify-center gap-2"><Button size="lg" onClick={() => setShown(true)}>{t('bible.memory.show')}</Button>{!hint ? <Button size="lg" variant="ghost" onClick={() => setHint(true)}>{t('bible.memory.hint')}</Button> : null}</div>
            ) : (
              <div role="group" aria-label={t('bible.memory.howDid')} className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {(['again', 'hard', 'good', 'easy'] as const).map((r) => <Button key={r} variant={r === 'good' ? 'primary' : 'secondary'} disabled={review.isPending} onClick={() => rate(r)} className="h-auto flex-col py-2"><span>{t(`bible.memory.rate.${r}`)}</span><span className="text-xs font-normal opacity-80">{preview(r)}</span></Button>)}
              </div>
            )}
          </div>
        )}
      </QueryState>
    </div>
  );
}
