import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Command } from 'cmdk';
import { useQuery } from '@tanstack/react-query';
import { BookOpenText, MagnifyingGlass } from '@phosphor-icons/react';
import { useT } from '@/lib/i18n';
import { navByLens, lensHome, type Lens } from '@/config/nav';
import { qk } from '@/lib/query';
import { searchService } from '@/lib/services/system';
import { parseRef, formatRef } from '@/lib/bible/ref';
import { setPrefs, usePrefs } from '@/lib/prefs';
import { signInAs } from '@/lib/db/session';
import { Dialog } from '@/components/ui/dialog/dialog';
import { Dialog as RadixDialog } from 'radix-ui';
import { useSession } from '@/features/session/hooks';

export function usePaletteHotkey(): [boolean, (o: boolean) => void] {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return [open, setOpen];
}

const itemCls = 'flex min-h-11 cursor-pointer items-center gap-3 rounded-sm px-3 text-base text-ink aria-selected:bg-sunken';
const groupCls = '[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-muted';

export function CommandPalette({ open, onOpenChange, lens }: { open: boolean; onOpenChange: (o: boolean) => void; lens: Lens }) {
  const t = useT();
  const nav = useNavigate();
  const prefs = usePrefs();
  const { lenses } = useSession();
  const [q, setQ] = useState('');
  const ref = parseRef(q);
  const search = useQuery({ queryKey: qk.search(q), queryFn: () => searchService.search(q), enabled: open && q.trim().length >= 2 });

  const go = (to: string) => {
    onOpenChange(false);
    setQ('');
    nav(to);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setQ(''); }}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="overlay" />
        <RadixDialog.Content aria-describedby={undefined} className="dialog-panel fixed start-1/2 top-[12dvh] z-50 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 glass-strong overflow-hidden rounded-2xl border shadow-lift">
          <RadixDialog.Title className="sr-only">{t('palette.title')}</RadixDialog.Title>
          <Command shouldFilter={!q.trim() || !search.data} label={t('palette.title')} className="flex max-h-[70dvh] flex-col">
            <div className="flex items-center gap-2 border-b border-line px-3">
              <MagnifyingGlass size={20} className="text-muted" aria-hidden="true" />
              <Command.Input autoFocus value={q} onValueChange={setQ} placeholder={t('palette.placeholder')} className="min-h-12 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-subtle" />
            </div>
            <Command.List className="overflow-y-auto p-2">
              <Command.Empty className="px-3 py-6 text-center text-base text-muted">{q.trim() ? t('palette.noResults') : t('palette.hint')}</Command.Empty>
              {ref ? (
                <Command.Group heading={t('palette.bible')} className={groupCls}>
                  <Command.Item value={`bible ${q}`} className={itemCls} onSelect={() => go(`/app/bible/${ref.book}/${ref.chapter}${ref.verseEnd ? `?v=${ref.verseStart}${ref.verseEnd !== ref.verseStart ? `-${ref.verseEnd}` : ''}` : ''}`)}>
                    <BookOpenText size={20} aria-hidden="true" />{t('palette.openVerse', { ref: formatRef(ref) })}
                  </Command.Item>
                </Command.Group>
              ) : null}
              {search.data?.length ? (
                <Command.Group heading={t('palette.results')} className={groupCls}>
                  {search.data.map((h) => (
                    <Command.Item key={`${h.type}${h.id}`} value={`${h.type} ${h.title} ${h.id}`} className={itemCls} onSelect={() => go(h.href)}>
                      <span className="rounded-xs bg-sunken px-1.5 py-0.5 text-xs text-muted">{t(`palette.typeOf.${h.type}`)}</span>
                      <span className="min-w-0 flex-1"><span className="block truncate">{h.title}</span>{h.excerpt ? <span className="block truncate text-sm text-muted">{h.excerpt}</span> : null}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              ) : null}
              <Command.Group heading={t('palette.goTo')} className={groupCls}>
                {navByLens[lens].map((n) => (
                  <Command.Item key={n.key} value={`go ${t(`nav.${lens}.${n.labelKey}`)}`} className={itemCls} onSelect={() => go(n.href)}>
                    <n.icon size={20} aria-hidden="true" />{t(`nav.${lens}.${n.labelKey}`)}
                  </Command.Item>
                ))}
                {lenses.filter((l) => l !== lens).map((l) => (
                  <Command.Item key={l} value={`go ${t(`lens.${l}`)} view`} className={itemCls} onSelect={() => go(lensHome[l])}>{t('lens.label')} {t(`lens.${l}`)}</Command.Item>
                ))}
                <Command.Item value="go notifications" className={itemCls} onSelect={() => go('/notifications')}>{t('nav.notifications')}</Command.Item>
 <Command.Item value="go study companion ai" className={itemCls} onSelect={() => go('/app/companion')}>{t('companion.title')}</Command.Item>
                <Command.Item value="go settings" className={itemCls} onSelect={() => go('/settings')}>{t('nav.settings')}</Command.Item>
              </Command.Group>
              <Command.Group heading={t('palette.actions')} className={groupCls}>
                <Command.Item value="action new reflection write journal" className={itemCls} onSelect={() => go('/app/journal/new')}>{t('palette.newReflection')}</Command.Item>
                <Command.Item value="action theme dark light" className={itemCls} onSelect={() => { setPrefs({ theme: prefs.theme === 'dark' ? 'light' : 'dark' }); onOpenChange(false); }}>{t('palette.toggleTheme')}</Command.Item>
                <Command.Item value="action switch person" className={itemCls} onSelect={() => { signInAs(null, null); go('/'); }}>{t('palette.switchPerson')}</Command.Item>
              </Command.Group>
            </Command.List>
          </Command>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </Dialog>
  );
}
