'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { Bell, CaretUpDown, Check } from '@phosphor-icons/react';
import { Link, usePathname } from '@/i18n/navigation';
import { cn } from '@/lib/cn';
import { isActive, lensFromPathname, lensHome, navByLens, type Lens } from '@/config/nav';
import { Wordmark } from '../icons/logo';
import { Button } from '../ui/button/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu/dropdown-menu';
import { Avatar } from '../ui/avatar/avatar';
import { setPrefs, usePrefs, type ThemePref } from '@/lib/prefs';

const lenses: Lens[] = ['learn', 'mentor', 'lead', 'admin'];

/** Phase 1 shell: layout and navigation only. Identity and roles arrive with the session in Phase 2. */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const lens = lensFromPathname(pathname);
  const t = useTranslations();
  const items = navByLens[lens];

  return (
    <div className="min-h-dvh lg:ps-64">
      <a href="#main" className="sr-only z-[70] rounded-md bg-ink px-4 py-2 text-bg focus:not-sr-only focus:fixed focus:start-4 focus:top-4">
        {t('common.actions.skipToContent')}
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 start-0 hidden w-64 flex-col gap-4 border-e border-line bg-surface p-4 lg:flex">
        <Wordmark />
        <LensSwitcher lens={lens} />
        <nav aria-label={t('common.shell.primaryNav')} className="flex flex-col gap-1">
          {items.map((item) => {
            const active = isActive(item, pathname);
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-11 items-center gap-3 rounded-md px-3 text-base font-medium transition-colors motion-fast',
                  active ? 'bg-accent-soft text-accent-soft-ink' : 'text-muted hover:bg-sunken hover:text-ink',
                )}
              >
                <Icon size={22} weight={active ? 'fill' : 'regular'} aria-hidden="true" />
                {t(`nav.${lens}.${item.labelKey}`)}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-2 border-b border-line bg-bg/95 px-4 pt-safe lg:px-8">
          <div className="lg:hidden">
            <Wordmark />
          </div>
          <div className="ms-auto flex items-center gap-1">
            <Link href="/notifications" aria-label={t('common.shell.notifications')} className="inline-flex size-11 items-center justify-center rounded-md text-muted transition-colors motion-fast hover:bg-sunken hover:text-ink">
              <Bell size={22} aria-hidden="true" />
            </Link>
            <MeMenu lens={lens} />
          </div>
        </header>

        <main id="main" tabIndex={-1} className="flex-1 px-4 pb-24 pt-6 outline-none lg:px-8 lg:pb-12">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>

      {/* Mobile bottom tabs */}
      <nav aria-label={t('common.shell.primaryNav')} className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface pb-safe lg:hidden">
        <ul className="mx-auto flex max-w-xl">
          {items.map((item) => {
            const active = isActive(item, pathname);
            const Icon = item.icon;
            return (
              <li key={item.key} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn('flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-xs font-medium transition-colors motion-fast', active ? 'text-accent-soft-ink' : 'text-muted')}
                >
                  <Icon size={24} weight={active ? 'fill' : 'regular'} aria-hidden="true" />
                  <span className="max-w-full truncate">{t(`nav.${lens}.${item.labelKey}`)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function LensSwitcher({ lens }: { lens: Lens }) {
  const t = useTranslations('common.lens');
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" fullWidth className="justify-between">
          <span className="text-muted">{t('label')}</span>
          <span className="flex items-center gap-1">
            {t(lens)}
            <CaretUpDown size={16} aria-hidden="true" />
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {lenses.map((l) => (
          <DropdownMenuItem key={l} asChild>
            <Link href={lensHome[l]} className="justify-between">
              {t(l)}
              {l === lens ? <Check size={16} weight="bold" aria-hidden="true" /> : null}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function MeMenu({ lens }: { lens: Lens }) {
  const t = useTranslations('common');
  const prefs = usePrefs();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label={t('shell.me')} className="inline-flex size-11 items-center justify-center rounded-md hover:bg-sunken">
          <Avatar name="Demo Person" size="sm" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel className="lg:hidden">{t('lens.label')}</DropdownMenuLabel>
        {lenses.map((l) => (
          <DropdownMenuItem key={l} asChild className="lg:hidden">
            <Link href={lensHome[l]} className="justify-between">
              {t(`lens.${l}`)}
              {l === lens ? <Check size={16} weight="bold" aria-hidden="true" /> : null}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="lg:hidden" />
        <DropdownMenuLabel>{t('theme.label')}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={prefs.theme} onValueChange={(v) => setPrefs({ theme: v as ThemePref })}>
          {(['light', 'dark', 'system'] as const).map((v) => (
            <DropdownMenuRadioItem key={v} value={v}>
              {t(`theme.${v}`)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

