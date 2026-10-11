import { useEffect, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { Navigate, Outlet, useNavigate } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, CaretUpDown, Check, MagnifyingGlass, Moon, SlidersHorizontal, Sun, UserSwitch } from '@phosphor-icons/react';
import { cn } from '@/lib/cn';
import { useT } from '@/lib/i18n';
import { Link, usePathname } from '@/lib/nav';
import { accountNav, isActive, lensFromPathname, lensHome, navByLens, toolsByLens, type Lens, type NavItem } from '@/config/nav';
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
    <div className="min-h-dvh lg:ps-72">
      <a href="#main" className="sr-only z-[70] rounded-md bg-ink px-4 py-2 text-bg focus:not-sr-only focus:fixed focus:start-4 focus:top-4">{t('shell.skip')}</a>

      <aside className="fixed inset-y-0 start-0 hidden w-72 flex-col overflow-y-auto border-e border-line bg-surface px-6 pb-6 lg:flex">
        <div className="flex h-20 shrink-0 items-center border-b border-line"><Link to={lensHome[lens]} aria-label={t('app.name')}><Wordmark /></Link></div>
        <div className="mt-6"><OrgBlock /></div>
        {lenses.length > 1 ? <div className="mt-3"><LensSwitcher lens={lens} lenses={lenses} /></div> : null}
        <SideSection label={t('nav.section.main')} items={items} pathname={pathname} labelOf={(k) => t(`nav.${lens}.${k}`)} indicator />
        {toolsByLens[lens].length ? <SideSection label={t('nav.section.tools')} items={toolsByLens[lens]} pathname={pathname} labelOf={(k) => t(`nav.tools.${k}`)} /> : null}
        <SideSection label={t('nav.section.account')} items={accountNav} pathname={pathname} labelOf={(k) => t(`nav.account.${k}`)} />
        <div className="mt-auto flex flex-col gap-1 pt-6">
          <Button variant="ghost" size="sm" className="justify-start text-muted" onClick={() => setDemoOpen(true)}><SlidersHorizontal size={18} aria-hidden="true" />{t('demo.title')}</Button>
          <SwitchPersonButton />
        </div>
      </aside>

      <div className="flex min-h-dvh flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-3 border-b border-line bg-surface/95 px-4 pt-safe backdrop-blur-sm lg:h-20 lg:px-8">
          <div className="lg:hidden"><Link to={lensHome[lens]} aria-label={t('app.name')}><Wordmark /></Link></div>
          <div className="hidden min-w-0 leading-tight lg:block">
            <p className="text-sm text-muted">{t('shell.hello')}</p>
            <p className="truncate text-base font-medium text-ink">{user.displayName}</p>
          </div>
          <div className="ms-auto flex items-center gap-2">
            <button type="button" onClick={() => setPaletteOpen(true)} aria-label={t('shell.commandPalette')} className="hidden min-h-11 w-72 items-center gap-2 rounded-xl border border-line bg-sunken px-3.5 text-sm text-subtle transition-colors motion-fast hover:border-line-strong md:inline-flex">
              <MagnifyingGlass size={18} aria-hidden="true" /><span className="flex-1 text-start">{t('shell.searchShort')}</span><kbd className="rounded-md border border-line bg-surface px-1.5 text-xs text-muted">Ctrl K</kbd>
            </button>
            <button type="button" onClick={() => setPaletteOpen(true)} aria-label={t('shell.commandPalette')} className={cn(squareBtn, 'md:hidden')}><MagnifyingGlass size={20} aria-hidden="true" /></button>
            <BellLink />
            <ThemeToggle />
            <MeMenu lens={lens} lenses={lenses} onDemo={() => setDemoOpen(true)} />
          </div>
        </header>
        {demo.offline ? <OfflineBanner message={t('states.offlineBanner')} /> : null}
        <main id="main" tabIndex={-1} className="flex-1 px-4 pb-28 pt-6 outline-none lg:px-8 lg:pb-12 lg:pt-8">
          <div key={pathname} className="enter mx-auto w-full max-w-6xl"><Outlet /></div>
        </main>
      </div>

      <nav aria-label={t('shell.primaryNav')} className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface pb-safe lg:hidden">
        <ul className="mx-auto flex max-w-xl">
          {items.map((item) => {
            const active = isActive(item, pathname);
            const Icon = item.icon;
            return (
              <li key={item.key} className="flex-1">
                <Link to={item.href} aria-current={active ? 'page' : undefined} className={cn('relative flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-xs font-medium transition-colors motion-fast', active ? 'text-accent' : 'text-muted')}>
                  {active ? <motion.span layoutId="tab-bar" className="absolute inset-x-5 top-0 h-0.5 rounded-b-full bg-accent" transition={{ type: 'spring', stiffness: 300, damping: 30 }} aria-hidden="true" /> : null}
                  <Icon size={22} weight={active ? 'fill' : 'regular'} aria-hidden="true" />
                  <span className="max-w-full truncate">{t(`nav.${lens}.${item.labelKey}`)}</span>
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

const squareBtn = 'relative inline-flex size-11 items-center justify-center rounded-xl border border-line bg-surface text-ink transition-colors motion-fast hover:bg-sunken';

function SideSection({ label, items, pathname, labelOf, indicator }: { label: string; items: NavItem[]; pathname: string; labelOf: (k: string) => string; indicator?: boolean }) {
  return (
    <nav aria-label={label} className="mt-7 flex flex-col gap-1">
      <p className="mb-1 px-1 text-xs font-medium uppercase text-subtle">{label}</p>
      {items.map((item) => {
        const active = isActive(item, pathname);
        const Icon = item.icon;
        return (
          <Link key={item.key} to={item.href} aria-current={active ? 'page' : undefined} className={cn('relative flex min-h-11 items-center gap-3 rounded-xl border px-3 text-base transition-colors motion-fast', active ? 'border-line bg-surface font-medium text-ink shadow-card' : 'border-transparent text-muted hover:bg-sunken hover:text-ink')}>
            {active && indicator ? <motion.span layoutId="side-indicator" className="absolute -start-6 inset-y-1.5 w-1 rounded-e-full bg-accent" transition={{ type: 'spring', stiffness: 300, damping: 30 }} aria-hidden="true" /> : null}
            <Icon size={20} weight={active ? 'bold' : 'regular'} aria-hidden="true" />
            <span>{labelOf(item.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function ThemeToggle() {
  const t = useT();
  const prefs = usePrefs();
  const dark = prefs.theme === 'dark' || (prefs.theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  return (
    <button type="button" aria-label={t('shell.toggleTheme')} aria-pressed={dark} onClick={() => setPrefs({ theme: dark ? 'light' : 'dark' })} className={squareBtn}>
      {dark ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
    </button>
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
  const label = current?.name ?? t('shell.personalSpace');
  const body = (
    <>
      <Avatar name={session.user.displayName} size="md" />
      <span className="min-w-0 flex-1"><span className="block truncate text-base font-medium text-ink">{session.user.displayName}</span><span className="block truncate text-sm text-accent">{label}</span></span>
    </>
  );
  if (orgs.length < 2) return <div className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-card">{body}</div>;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-3 text-start shadow-card transition-colors motion-fast hover:bg-sunken">
          {body}
          <CaretUpDown size={16} aria-hidden="true" className="text-muted" />
        </button>
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
    <Link to="/notifications" aria-label={`${t('shell.notifications')}. ${t('shell.unread', { count })}`} className={squareBtn}>
      <Bell size={20} aria-hidden="true" />
      {count > 0 ? <span aria-hidden="true" className="absolute end-2.5 top-2.5 size-2 rounded-full bg-warning ring-2 ring-surface" /> : null}
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
        <button type="button" aria-label={t('shell.me')} className="inline-flex size-11 items-center justify-center rounded-xl hover:bg-sunken"><Avatar name={user.displayName} size="sm" /></button>
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
