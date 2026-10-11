import { useEffect, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Navigate, Outlet, useNavigate } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CaretUpDown, Check, MagnifyingGlass, SlidersHorizontal, UserSwitch } from '@phosphor-icons/react';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n';
import { Link, usePathname } from '@/lib/nav';
import { isActive, lensFromPathname, lensHome, navByLens, type Lens } from '@/config/nav';
import { qk } from '@/lib/query';
import { notificationsService } from '@/lib/services/system';
import { setPrefs, usePrefs, type ThemePref } from '@/lib/prefs';
import { signInAs } from '@/lib/db/session';
import { useDemoSettings } from '@/lib/db/demo-settings';
import { useSession } from '@/features/session/hooks';
import { Wordmark } from '@/components/icons/logo';
import { Avatar } from '@/components/ui/avatar/avatar';
import { Button } from '@/components/ui/button/button';
import { OfflineBanner } from '@/components/patterns/offline-banner/offline-banner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu/dropdown-menu';
import { DemoControls } from '@/features/shell/demo-controls';
import { CommandPalette, usePaletteHotkey } from '@/features/shell/command-palette';

export function AppShell() {
  const { userId, user, lenses, org, loading } = useSession();
  const pathname = usePathname();
  const t = useT();
  const demo = useDemoSettings();
  const [demoOpen, setDemoOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = usePaletteHotkey();
  const lens = lensFromPathname(pathname);

  useEffect(() => {
    const accent = org?.branding.accent ?? 'clay';
    if (accent === 'clay') document.documentElement.removeAttribute('data-accent');
    else document.documentElement.setAttribute('data-accent', accent);
  }, [org?.branding.accent]);

  if (!userId) return <Navigate to="/" replace />;
  if (loading || !user) return <div className="grid min-h-dvh place-items-center" aria-busy="true" aria-label={t('states.loading')}><div className="skeleton size-12 rounded-lg" /></div>;
  if (!lenses.includes(lens)) return <Navigate to={lensHome[lenses[0] ?? 'learn']} replace />;
  const items = navByLens[lens];

  return (
    <div className="min-h-dvh lg:ps-64">
      <a href="#main" className="sr-only z-[70] rounded-md bg-ink px-4 py-2 text-bg focus:not-sr-only focus:fixed focus:start-4 focus:top-4">{t('shell.skip')}</a>

      <aside className="glass fixed inset-y-0 start-0 hidden w-64 flex-col gap-5 overflow-y-auto border-e p-4 lg:flex">
        <Link to={lensHome[lens]} aria-label={t('app.name')}><Wordmark /></Link>
        <OrgBlock />
        {lenses.length > 1 ? <LensSwitcher lens={lens} lenses={lenses} /> : null}
        <nav aria-label={t('shell.primaryNav')} className="flex flex-col gap-1">
          {items.map((item) => {
            const active = isActive(item, pathname);
            const Icon = item.icon;
            return (
              <Link key={item.key} to={item.href} aria-current={active ? 'page' : undefined} className={cn('relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-base font-medium transition-colors motion-fast', active ? 'text-accent-soft-ink' : 'text-muted hover:text-ink')}>
                {active ? <motion.span layoutId="side-pill" className="absolute inset-0 rounded-xl bg-accent-soft shadow-card" transition={{ type: 'spring', stiffness: 420, damping: 34 }} aria-hidden="true" /> : null}
                <Icon size={22} weight={active ? 'fill' : 'regular'} aria-hidden="true" className="relative" />
                <span className="relative">{t(`nav.${lens}.${item.labelKey}`)}</span>
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-2 border-t border-line pt-4">
          <Button variant="ghost" size="sm" className="justify-start" onClick={() => setDemoOpen(true)}><SlidersHorizontal size={18} aria-hidden="true" />{t('demo.title')}</Button>
          <SwitchPersonButton />
        </div>
      </aside>

      <div className="flex min-h-dvh flex-col">
        <header className="glass sticky top-0 z-10 flex h-16 items-center justify-between gap-2 border-b px-4 pt-safe lg:px-8">
          <div className="lg:hidden"><Link to={lensHome[lens]} aria-label={t('app.name')}><Wordmark /></Link></div>
          <div className="hidden min-w-0 items-center gap-2 text-sm text-muted lg:flex"><span className="truncate">{org?.name ?? t('shell.personalSpace')}</span></div>
          <div className="ms-auto flex items-center gap-1">
            <button type="button" onClick={() => setPaletteOpen(true)} aria-label={t('shell.commandPalette')} className="hidden min-h-11 items-center gap-2 rounded-xl border border-glass-line bg-surface/60 px-3.5 text-sm text-muted shadow-card transition-all motion-fast hover:border-line-strong hover:text-ink md:inline-flex">
              <MagnifyingGlass size={18} aria-hidden="true" />{t('shell.search')}<kbd className="rounded-xs border border-line px-1.5 text-xs">Ctrl K</kbd>
            </button>
            <button type="button" onClick={() => setPaletteOpen(true)} aria-label={t('shell.commandPalette')} className="inline-flex size-11 items-center justify-center rounded-md text-muted hover:bg-sunken hover:text-ink md:hidden"><MagnifyingGlass size={22} aria-hidden="true" /></button>
            <BellLink />
            <MeMenu lens={lens} lenses={lenses} onDemo={() => setDemoOpen(true)} />
          </div>
        </header>
        {demo.offline ? <OfflineBanner message={t('states.offlineBanner')} /> : null}
        <main id="main" tabIndex={-1} className="flex-1 px-4 pb-32 pt-8 outline-none lg:px-8 lg:pb-16">
          <div key={pathname} className="enter mx-auto w-full max-w-5xl"><Outlet /></div>
        </main>
      </div>

      <nav aria-label={t('shell.primaryNav')} className="glass-strong fixed inset-x-2 bottom-2 z-20 rounded-2xl border pb-safe shadow-lift lg:hidden">
        <ul className="mx-auto flex max-w-xl">
          {items.map((item) => {
            const active = isActive(item, pathname);
            const Icon = item.icon;
            return (
              <li key={item.key} className="flex-1">
                <Link to={item.href} aria-current={active ? 'page' : undefined} className={cn('relative flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-xs font-medium transition-colors motion-fast', active ? 'text-accent-soft-ink' : 'text-muted')}>
                  {active ? <motion.span layoutId="tab-pill" className="absolute inset-x-1.5 inset-y-1 rounded-xl bg-accent-soft" transition={{ type: 'spring', stiffness: 420, damping: 34 }} aria-hidden="true" /> : null}
                  <Icon size={24} weight={active ? 'fill' : 'regular'} aria-hidden="true" className="relative" />
                  <span className="relative max-w-full truncate">{t(`nav.${lens}.${item.labelKey}`)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <DemoControls open={demoOpen} onOpenChange={setDemoOpen} />
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} lens={lens} />
    </div>
  );
}

function OrgBlock() {
  const { session, orgId: activeOrgId } = useSession();
  const t = useT();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { userId } = useSession();
  if (!session) return null;
  const orgs = session.organisations;
  const current = orgs.find((o) => o.id === activeOrgId);
  const switchTo = (id: string | null) => {
    signInAs(userId, id as never);
    void qc.invalidateQueries();
    nav('/app/today');
  };
  if (orgs.length < 2) return <p className="truncate px-1 text-sm font-medium text-ink">{current?.name ?? t('shell.personalSpace')}</p>;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="justify-between px-2">
          <span className="truncate">{current?.name ?? t('shell.personalSpace')}</span>
          <CaretUpDown size={16} aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>{t('shell.organisation')}</DropdownMenuLabel>
        {orgs.map((o) => (
          <DropdownMenuItem key={o.id} onSelect={() => switchTo(o.id)} className="justify-between">{o.name}{o.id === activeOrgId ? <Check size={16} weight="bold" aria-hidden="true" /> : null}</DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LensSwitcher({ lens, lenses }: { lens: Lens; lenses: Lens[] }) {
  const t = useT();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" fullWidth className="justify-between">
          <span className="text-muted">{t('lens.label')}</span>
          <span className="flex items-center gap-1">{t(`lens.${lens}`)}<CaretUpDown size={16} aria-hidden="true" /></span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {lenses.map((l) => (
          <DropdownMenuItem key={l} asChild>
            <Link to={lensHome[l]} className="justify-between">{t(`lens.${l}`)}{l === lens ? <Check size={16} weight="bold" aria-hidden="true" /> : null}</Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SwitchPersonButton() {
  const t = useT();
  const nav = useNavigate();
  const qc = useQueryClient();
  return (
    <Button variant="ghost" size="sm" className="justify-start" onClick={() => { signInAs(null, null); void qc.invalidateQueries(); nav('/'); }}>
      <UserSwitch size={18} aria-hidden="true" />{t('shell.switchPerson')}
    </Button>
  );
}

function BellLink() {
  const t = useT();
  const q = useQuery({ queryKey: qk.unread, queryFn: notificationsService.unreadCount, refetchInterval: 20_000 });
  const count = q.data ?? 0;
  return (
    <Link to="/notifications" aria-label={`${t('shell.notifications')}. ${t('shell.unread', { count })}`} className="relative inline-flex size-11 items-center justify-center rounded-md text-muted transition-colors motion-fast hover:bg-sunken hover:text-ink">
      <Bell size={22} aria-hidden="true" />
      {count > 0 ? <span aria-hidden="true" className="absolute end-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[0.65rem] font-semibold leading-4 text-on-accent">{count > 9 ? '9+' : count}</span> : null}
    </Link>
  );
}

function MeMenu({ lens, lenses, onDemo }: { lens: Lens; lenses: Lens[]; onDemo: () => void }) {
  const t = useT();
  const { user } = useSession();
  const prefs = usePrefs();
  const nav = useNavigate();
  const qc = useQueryClient();
  if (!user) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label={t('shell.me')} className="inline-flex size-11 items-center justify-center rounded-md hover:bg-sunken"><Avatar name={user.displayName} size="sm" /></button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>{t('shell.signedInAs', { name: user.displayName })}</DropdownMenuLabel>
        {lenses.length > 1 ? (
          <>
            <DropdownMenuSeparator className="lg:hidden" />
            {lenses.map((l) => (
              <DropdownMenuItem key={l} asChild className="lg:hidden">
                <Link to={lensHome[l]} className="justify-between">{t(`lens.${l}`)}{l === lens ? <Check size={16} weight="bold" aria-hidden="true" /> : null}</Link>
              </DropdownMenuItem>
            ))}
          </>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link to="/app/companion">{t('companion.title')}</Link></DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/settings">{t('nav.settings')}</Link></DropdownMenuItem>
        <DropdownMenuItem onSelect={onDemo}>{t('demo.title')}</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => { signInAs(null, null); void qc.invalidateQueries(); nav('/'); }}>{t('shell.switchPerson')}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>{t('theme.label')}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={prefs.theme} onValueChange={(v) => setPrefs({ theme: v as ThemePref })}>
          {(['light', 'dark', 'system'] as const).map((v) => <DropdownMenuRadioItem key={v} value={v}>{t(`theme.${v}`)}</DropdownMenuRadioItem>)}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export type { ReactNode };
