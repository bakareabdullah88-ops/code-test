import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDown, ArrowLeft, ArrowUp, DotsSixVertical, Eye, PaperPlaneTilt, Plus, Trash, UsersThree } from '@phosphor-icons/react';
import { useT } from '@/lib/i18n';
import { Link } from '@/lib/nav';
import { ApiError } from '@/lib/db/errors';
import { pathwaysService, type OutlineModule, type LessonSummary } from '@/lib/services/learning';
import { usePathway } from '@/features/learning/hooks';
import { useMentees } from '@/features/mentoring/hooks';
import { useAddLesson, useAddModule, useAssignPathway, useDeleteLesson, useDeleteModule, useDeletePathway, usePublish, useRenameModule, useReorder, useUnpublish, useUpdatePathway } from './hooks';
import { QueryState } from '@/components/data/query-state';
import { Badge } from '@/components/ui/badge/badge';
import { Button, buttonStyles } from '@/components/ui/button/button';
import { Card } from '@/components/ui/card/card';
import { Checkbox } from '@/components/ui/checkbox/checkbox';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog/dialog';
import { Field } from '@/components/ui/field/field';
import { IconButton } from '@/components/ui/icon-button/icon-button';
import { Input, Textarea } from '@/components/ui/input/input';
import { Select } from '@/components/ui/select/select';
import { Skeleton, SkeletonText } from '@/components/ui/skeleton/skeleton';
import { useToast } from '@/components/ui/toast/toast';
import { Notice } from '@/components/patterns/notice/notice';
import { cn } from '@/lib/cn';

type Mod = OutlineModule;

export function BuilderPage() {
  const { pathwayId = '' } = useParams();
  const t = useT();
  const q = usePathway(pathwayId);
  return (
    <div className="flex flex-col gap-6">
      <Link to="/mentor/pathways" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"><ArrowLeft size={16} aria-hidden="true" />{t('mentor.builder.libraryTitle')}</Link>
      <QueryState query={q} skeleton={<div className="flex flex-col gap-4"><Skeleton className="h-12 w-2/3" /><SkeletonText lines={4} /><Skeleton className="h-48 w-full" /></div>}>
        {(p) => <Builder key={p.id} pathway={p} />}
      </QueryState>
    </div>
  );
}

function Builder({ pathway }: { pathway: NonNullable<ReturnType<typeof usePathway>['data']> }) {
  const t = useT();
  const toast = useToast();
  const nav = useNavigate();
  const update = useUpdatePathway();
  const reorder = useReorder();
  const addModule = useAddModule();
  const addLesson = useAddLesson();
  const renameModule = useRenameModule();
  const delModule = useDeleteModule();
  const delLesson = useDeleteLesson();
  const unpublish = useUnpublish();
  const delPathway = useDeletePathway();

  const [modules, setModules] = useState<Mod[]>(pathway.outline);
  const [announce, setAnnounce] = useState('');
  const [title, setTitle] = useState(pathway.title);
  const [summary, setSummary] = useState(pathway.summary);
  const [publishOpen, setPublishOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newLessonFor, setNewLessonFor] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newModule, setNewModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');

  useEffect(() => setModules(pathway.outline), [pathway.outline]);

  const persist = (next: Mod[], message: string) => {
    const prev = modules;
    setModules(next);
    setAnnounce(message);
    reorder.mutate({ id: pathway.id, modules: next.map((m) => ({ id: m.id, lessonIds: m.lessons.map((l) => l.id) })) }, { onError: () => { setModules(prev); toast.show({ title: t('mentor.builder.reorderFailed'), tone: 'danger' }); } });
  };

  const moveModule = (index: number, dir: -1 | 1) => {
    const to = index + dir;
    if (to < 0 || to >= modules.length) return;
    persist(arrayMove(modules, index, to), t('mentor.builder.movedModule', { title: modules[index]?.title ?? '', position: to + 1, total: modules.length }));
  };
  const moveLesson = (mi: number, li: number, dir: -1 | 1) => {
    const m = modules[mi];
    if (!m) return;
    const to = li + dir;
    if (to < 0 || to >= m.lessons.length) return;
    const next = modules.map((x, i) => (i === mi ? { ...x, lessons: arrayMove(x.lessons, li, to) } : x));
    persist(next, t('mentor.builder.movedLesson', { title: m.lessons[li]?.title ?? '', position: to + 1, total: m.lessons.length }));
  };
  const moveLessonToModule = (mi: number, li: number, targetId: string) => {
    const lesson = modules[mi]?.lessons[li];
    if (!lesson) return;
    const next = modules.map((m, i) => (i === mi ? { ...m, lessons: m.lessons.filter((_, k) => k !== li) } : m.id === targetId ? { ...m, lessons: [...m.lessons, lesson] } : m));
    persist(next, t('mentor.builder.movedToModule', { title: lesson.title, module: modules.find((m) => m.id === targetId)?.title ?? '' }));
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const onModuleDragEnd = (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const from = modules.findIndex((m) => m.id === e.active.id);
    const to = modules.findIndex((m) => m.id === e.over?.id);
    persist(arrayMove(modules, from, to), t('mentor.builder.movedModule', { title: modules[from]?.title ?? '', position: to + 1, total: modules.length }));
  };
  const onLessonDragEnd = (mi: number) => (e: DragEndEvent) => {
    if (!e.over || e.active.id === e.over.id) return;
    const m = modules[mi];
    if (!m) return;
    const from = m.lessons.findIndex((l) => l.id === e.active.id);
    const to = m.lessons.findIndex((l) => l.id === e.over?.id);
    persist(modules.map((x, i) => (i === mi ? { ...x, lessons: arrayMove(x.lessons, from, to) } : x)), t('mentor.builder.movedLesson', { title: m.lessons[from]?.title ?? '', position: to + 1, total: m.lessons.length }));
  };

  const saveMeta = (patch: { title?: string; summary?: string }) => update.mutate({ id: pathway.id, patch }, { onError: () => toast.show({ title: t('states.errorTitle'), tone: 'danger' }) });

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2"><Badge tone={pathway.status === 'published' ? 'success' : 'warning'}>{t(pathway.status === 'published' ? 'mentor.builder.published' : 'mentor.builder.draft')}</Badge><span className="text-sm text-muted">{t('learn.pathway.counts', { lessons: pathway.lessonCount, minutes: pathway.estimatedMinutes })}</span></div>
        <Field label={t('mentor.builder.titleLabel')}>{(p) => <Input {...p} className="font-serif text-h3 font-semibold" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => title.trim() && title !== pathway.title && saveMeta({ title: title.trim() })} />}</Field>
        <Field label={t('mentor.builder.summaryLabel')}>{(p) => <Textarea {...p} rows={2} value={summary} onChange={(e) => setSummary(e.target.value)} onBlur={() => summary !== pathway.summary && saveMeta({ summary })} />}</Field>
        <div className="flex flex-wrap gap-2">
          {pathway.status === 'published' ? <Button variant="secondary" loading={unpublish.isPending} onClick={() => unpublish.mutate(pathway.id, { onSuccess: () => toast.show({ title: t('mentor.builder.unpublished'), tone: 'success' }) })}>{t('mentor.builder.unpublish')}</Button> : <Button onClick={() => setPublishOpen(true)}><PaperPlaneTilt size={18} aria-hidden="true" />{t('mentor.builder.publish')}</Button>}
          {pathway.status === 'published' ? <Button variant="secondary" onClick={() => setAssignOpen(true)}><UsersThree size={18} aria-hidden="true" />{t('mentor.builder.assign')}</Button> : null}
          {pathway.outline[0]?.lessons[0] ? <Link to={`/app/pathways/${pathway.id}/lessons/${pathway.outline[0].lessons[0].id}`} className={buttonStyles({ variant: 'secondary' })}><Eye size={18} aria-hidden="true" />{t('mentor.builder.preview')}</Link> : null}
          <Button variant="ghost" onClick={() => setConfirmDelete(true)}><Trash size={18} aria-hidden="true" />{t('actions.delete')}</Button>
        </div>
      </header>

      <p role="status" aria-live="polite" className="sr-only">{announce}</p>
      <Notice>{t('mentor.builder.reorderHelp')}</Notice>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onModuleDragEnd}>
        <SortableContext items={modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
          <ol className="flex flex-col gap-4">
            {modules.map((m, mi) => (
              <SortableItem key={m.id} id={m.id}>
                {(handle) => (
                  <Card padding="none" className="overflow-hidden">
                    <div className="flex flex-wrap items-center gap-2 border-b border-line bg-sunken p-3">
                      {handle}
                      <ModuleTitle value={m.title} onSave={(v) => renameModule.mutate({ id: m.id, title: v })} label={t('mentor.builder.moduleTitle')} />
                      <div className="ms-auto flex items-center gap-1">
                        <IconButton size="sm" label={t('mentor.builder.moveModuleUp', { title: m.title })} disabled={mi === 0} onClick={() => moveModule(mi, -1)}><ArrowUp size={18} /></IconButton>
                        <IconButton size="sm" label={t('mentor.builder.moveModuleDown', { title: m.title })} disabled={mi === modules.length - 1} onClick={() => moveModule(mi, 1)}><ArrowDown size={18} /></IconButton>
                        <IconButton size="sm" label={t('mentor.builder.deleteModule', { title: m.title })} onClick={() => delModule.mutate(m.id, { onSuccess: () => toast.show({ title: t('mentor.builder.moduleDeleted'), tone: 'success' }) })}><Trash size={18} /></IconButton>
                      </div>
                    </div>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onLessonDragEnd(mi)}>
                      <SortableContext items={m.lessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
                        <ol className="divide-y divide-line">
                          {m.lessons.map((l, li) => (
                            <SortableItem key={l.id} id={l.id}>
                              {(h) => <LessonRow lesson={l} pathwayId={pathway.id} handle={h} first={li === 0} last={li === m.lessons.length - 1} onUp={() => moveLesson(mi, li, -1)} onDown={() => moveLesson(mi, li, 1)} otherModules={modules.filter((x) => x.id !== m.id)} onMove={(target) => moveLessonToModule(mi, li, target)} onDelete={() => delLesson.mutate(l.id, { onSuccess: () => toast.show({ title: t('mentor.builder.lessonDeleted'), tone: 'success' }) })} />}
                            </SortableItem>
                          ))}
                        </ol>
                      </SortableContext>
                    </DndContext>
                    {m.lessons.length === 0 ? <p className="px-4 py-3 text-sm text-muted">{t('mentor.builder.noLessons')}</p> : null}
                    <div className="border-t border-line p-2"><Button variant="ghost" size="sm" onClick={() => { setNewLessonFor(m.id); setNewLessonTitle(''); }}><Plus size={16} aria-hidden="true" />{t('mentor.builder.addLesson')}</Button></div>
                  </Card>
                )}
              </SortableItem>
            ))}
          </ol>
        </SortableContext>
      </DndContext>
      <div><Button variant="secondary" onClick={() => { setNewModule(true); setNewModuleTitle(''); }}><Plus size={18} aria-hidden="true" />{t('mentor.builder.addModule')}</Button></div>

      <NameDialog open={!!newLessonFor} onOpenChange={(o) => !o && setNewLessonFor(null)} title={t('mentor.builder.addLesson')} label={t('mentor.builder.lessonTitle')} value={newLessonTitle} setValue={setNewLessonTitle} busy={addLesson.isPending}
        onConfirm={() => newLessonFor && addLesson.mutate({ moduleId: newLessonFor, title: newLessonTitle.trim() }, { onSuccess: (l) => { setNewLessonFor(null); nav(`/mentor/pathways/${pathway.id}/lessons/${l.id}`); } })} />
      <NameDialog open={newModule} onOpenChange={setNewModule} title={t('mentor.builder.addModule')} label={t('mentor.builder.moduleTitle')} value={newModuleTitle} setValue={setNewModuleTitle} busy={addModule.isPending}
        onConfirm={() => addModule.mutate({ pathwayId: pathway.id, title: newModuleTitle.trim() }, { onSuccess: () => setNewModule(false) })} />
      <PublishDialog open={publishOpen} onOpenChange={setPublishOpen} pathwayId={pathway.id} />
      <AssignDialog open={assignOpen} onOpenChange={setAssignOpen} pathwayId={pathway.id} />
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent title={t('mentor.builder.deleteTitle')} description={t('mentor.builder.deleteBody')} closeLabel={t('actions.close')} footer={<><DialogClose asChild><Button variant="secondary">{t('actions.cancel')}</Button></DialogClose><Button variant="danger" loading={delPathway.isPending} onClick={() => delPathway.mutate(pathway.id, { onSuccess: () => { toast.show({ title: t('mentor.builder.deleted'), tone: 'success' }); nav('/mentor/pathways'); }, onError: (e) => { setConfirmDelete(false); toast.show({ title: e instanceof ApiError ? e.message : t('states.errorTitle'), tone: 'danger' }); } })}>{t('mentor.builder.deleteConfirm')}</Button></>} />
      </Dialog>
    </div>
  );
}

function SortableItem({ id, children }: { id: string; children: (handle: React.ReactNode) => React.ReactNode }) {
  const t = useT();
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  const handle = (
    <button type="button" ref={setActivatorNodeRef} {...attributes} {...listeners} aria-label={t('mentor.builder.dragHandle')} className="inline-flex size-11 shrink-0 cursor-grab touch-none items-center justify-center rounded-sm text-muted hover:bg-raised hover:text-ink active:cursor-grabbing md:size-8 coarse:size-11">
      <DotsSixVertical size={20} aria-hidden="true" />
    </button>
  );
  return <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn('list-none', isDragging && 'relative z-10 opacity-90 shadow-pop')}>{children(handle)}</li>;
}

function ModuleTitle({ value, onSave, label }: { value: string; onSave: (v: string) => void; label: string }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  return <Input aria-label={label} className="min-h-10 max-w-xs flex-1 font-semibold" value={v} onChange={(e) => setV(e.target.value)} onBlur={() => v.trim() && v !== value && onSave(v.trim())} onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()} />;
}

function LessonRow({ lesson, pathwayId, handle, first, last, onUp, onDown, otherModules, onMove, onDelete }: { lesson: LessonSummary; pathwayId: string; handle: React.ReactNode; first: boolean; last: boolean; onUp: () => void; onDown: () => void; otherModules: Mod[]; onMove: (id: string) => void; onDelete: () => void }) {
  const t = useT();
  const [moving, setMoving] = useState(false);
  return (
    <div className="flex flex-wrap items-center gap-1 px-2 py-1.5">
      {handle}
      <Link to={`/mentor/pathways/${pathwayId}/lessons/${lesson.id}`} className="min-w-0 flex-1 px-1 py-1.5 hover:underline"><span className="block truncate font-medium text-ink">{lesson.title}</span><span className="block text-sm text-muted">{t('learn.minutes', { minutes: lesson.estimatedMinutes })}</span></Link>
      <div className="flex items-center gap-1">
        <IconButton size="sm" label={t('mentor.builder.moveUp', { title: lesson.title })} disabled={first} onClick={onUp}><ArrowUp size={18} /></IconButton>
        <IconButton size="sm" label={t('mentor.builder.moveDown', { title: lesson.title })} disabled={last} onClick={onDown}><ArrowDown size={18} /></IconButton>
        {otherModules.length ? <Button size="sm" variant="ghost" onClick={() => setMoving((m) => !m)} aria-expanded={moving}>{t('mentor.builder.moveTo')}</Button> : null}
        <IconButton size="sm" label={t('mentor.builder.deleteLesson', { title: lesson.title })} onClick={onDelete}><Trash size={18} /></IconButton>
      </div>
      {moving ? <div className="w-full ps-12 pb-2"><Select aria-describedby={undefined} placeholder={t('mentor.builder.chooseModule')} onValueChange={(v) => { setMoving(false); onMove(v); }} options={otherModules.map((m) => ({ value: m.id, label: m.title }))} /></div> : null}
    </div>
  );
}

function NameDialog({ open, onOpenChange, title, label, value, setValue, onConfirm, busy }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; label: string; value: string; setValue: (v: string) => void; onConfirm: () => void; busy: boolean }) {
  const t = useT();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={title} closeLabel={t('actions.close')} footer={<><DialogClose asChild><Button variant="secondary">{t('actions.cancel')}</Button></DialogClose><Button loading={busy} disabled={!value.trim()} onClick={onConfirm}>{t('actions.add')}</Button></>}>
        <Field label={label} required>{(p) => <Input {...p} autoFocus value={value} onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && value.trim() && onConfirm()} />}</Field>
      </DialogContent>
    </Dialog>
  );
}

function PublishDialog({ open, onOpenChange, pathwayId }: { open: boolean; onOpenChange: (o: boolean) => void; pathwayId: string }) {
  const t = useT();
  const toast = useToast();
  const publish = usePublish();
  const check = useQuery({ queryKey: ['checklist', pathwayId, open], queryFn: () => pathwaysService.publishChecklist(pathwayId), enabled: open });
  const problems = check.data ?? [];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={t('mentor.builder.publishTitle')} description={t('mentor.builder.publishBody')} closeLabel={t('actions.close')} footer={<><DialogClose asChild><Button variant="secondary">{t('actions.cancel')}</Button></DialogClose><Button loading={publish.isPending} disabled={check.isLoading || problems.length > 0} onClick={() => publish.mutate(pathwayId, { onSuccess: () => { onOpenChange(false); toast.show({ title: t('mentor.builder.publishedToast'), description: t('mentor.builder.publishedBody'), tone: 'success' }); } })}>{t('mentor.builder.publish')}</Button></>}>
        {check.isLoading ? <Skeleton className="h-16 w-full" /> : problems.length ? (
          <div className="flex flex-col gap-2"><Notice tone="warning" title={t('mentor.builder.notReady')}><ul className="list-disc ps-5">{problems.map((p, i) => <li key={i}>{p.message}</li>)}</ul></Notice></div>
        ) : <Notice tone="success">{t('mentor.builder.ready')}</Notice>}
      </DialogContent>
    </Dialog>
  );
}

function AssignDialog({ open, onOpenChange, pathwayId }: { open: boolean; onOpenChange: (o: boolean) => void; pathwayId: string }) {
  const t = useT();
  const toast = useToast();
  const mentees = useMentees();
  const assign = useAssignPathway();
  const [picked, setPicked] = useState<string[]>([]);
  const [note, setNote] = useState('');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={t('mentor.builder.assignTitle')} description={t('mentor.builder.assignBody')} closeLabel={t('actions.close')} footer={<><DialogClose asChild><Button variant="secondary">{t('actions.cancel')}</Button></DialogClose><Button loading={assign.isPending} disabled={!picked.length} onClick={() => assign.mutate({ pathwayId, userIds: picked, note }, { onSuccess: (r) => { onOpenChange(false); setPicked([]); toast.show({ title: t('mentor.builder.assigned', { count: r.length }), tone: 'success' }); } })}>{t('mentor.builder.assignConfirm')}</Button></>}>
        <div className="flex flex-col gap-3">
          {mentees.data?.length ? <div>{mentees.data.map((m) => <Checkbox key={m.user.id} label={m.user.displayName} description={m.pathwayTitle ?? t('mentor.mentees.noPathway')} checked={picked.includes(m.user.id)} onCheckedChange={(c) => setPicked((p) => (c ? [...p, m.user.id] : p.filter((x) => x !== m.user.id)))} />)}</div> : <p className="text-base text-muted">{t('mentor.mentees.emptyBody')}</p>}
          <Field label={t('mentor.builder.assignNote')}>{(p) => <Textarea {...p} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />}</Field>
        </div>
      </DialogContent>
    </Dialog>
  );
}
