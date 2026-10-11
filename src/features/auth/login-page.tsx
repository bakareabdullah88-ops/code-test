import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Eye, EyeSlash, Info } from '@phosphor-icons/react';
import { useT } from '@/lib/i18n';
import { ApiError } from '@/lib/db/errors';
import { authService } from '@/lib/services/system';
import { queryClient } from '@/lib/query';
import { lensHome } from '@/config/nav';
import { Wordmark } from '@/components/icons/logo';
import { Cover } from '@/components/content/cover';
import { Button } from '@/components/ui/button/button';
import { Field } from '@/components/ui/field/field';
import { Input } from '@/components/ui/input/input';
import { SegmentedControl } from '@/components/ui/segmented-control/segmented-control';
import { Avatar } from '@/components/ui/avatar/avatar';
import { usePersonas } from '@/features/persona/hooks';

type Mode = 'signin' | 'join';
const QUOTES = ['one', 'two', 'three'] as const;
const FEATURED = ['usr_adaeze', 'usr_grace', 'usr_sofia', 'usr_helena'];

function QuoteRotator() {
  const t = useT();
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setI((n) => (n + 1) % QUOTES.length), 5200);
    return () => window.clearInterval(id);
  }, []);
  const k = QUOTES[i] ?? 'one';
  return (
    <div className="min-h-28" aria-live="off">
      <AnimatePresence mode="wait">
        <motion.p key={k} initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -10, filter: 'blur(6px)' }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="font-serif text-2xl font-medium leading-snug tracking-tight text-ink md:text-3xl">
          {t(`auth.quote.${k}`)}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

export function LoginPage() {
  const t = useT();
  const nav = useNavigate();
  const personas = usePersonas();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fe = (k: string) => (error?.fieldErrors?.[k]?.length ? t(`auth.fieldError.${error.fieldErrors[k]?.[0] ?? 'invalid'}`) : undefined);
  const formError = error && !error.fieldErrors ? error.message : error?.code === 'unauthenticated' || error?.code === 'conflict' || (error?.code === 'not_found' && !error.fieldErrors) ? error.message : null;

  const go = (roles: readonly string[]) => {
    void queryClient.invalidateQueries();
    const lens = roles.includes('admin') ? 'admin' : roles.includes('mentor') ? 'mentor' : roles.includes('leader') && !roles.includes('student') ? 'lead' : 'learn';
    nav(lensHome[lens]);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = mode === 'signin' ? await authService.signIn({ email, password }) : await authService.join({ code, name, email });
      go(r.roles);
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError('unknown', t('states.errorBody')));
    } finally {
      setBusy(false);
    }
  };

  const demo = (personas.data ?? []).filter((p) => FEATURED.includes(p.userId));

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <main id="main" className="relative flex flex-col px-5 py-6 sm:px-10 lg:px-16">
        <header className="flex items-center justify-between"><Wordmark /><Link to="/demo" className="text-sm font-medium text-accent-soft-ink underline-offset-4 hover:underline">{t('auth.browseDemo')}</Link></header>
        <div className="enter mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 py-10">
          <div className="flex flex-col gap-2">
            <h1 className="text-h1 font-semibold tracking-tight">{mode === 'signin' ? t('auth.title') : t('auth.joinTitle')}</h1>
            <p className="text-lg text-muted">{mode === 'signin' ? t('auth.intro') : t('auth.joinIntro')}</p>
          </div>
          <SegmentedControl label={t('auth.mode')} value={mode} onValueChange={(v) => { setMode(v as Mode); setError(null); }} options={[{ value: 'signin', label: t('auth.signIn') }, { value: 'join', label: t('auth.join') }]} />
          <form onSubmit={submit} noValidate className="flex flex-col gap-4">
            <AnimatePresence initial={false}>
              {mode === 'join' ? (
                <motion.div key="join" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex flex-col gap-4 overflow-hidden px-px pb-px">
                  <Field label={t('auth.code')} description={t('auth.codeHelp')} error={fe('code')} required>{(p) => <Input {...p} value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" autoCapitalize="characters" className="font-mono tracking-widest" />}</Field>
                  <Field label={t('auth.name')} error={fe('name')} required>{(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />}</Field>
                </motion.div>
              ) : null}
            </AnimatePresence>
            <Field label={t('auth.email')} error={fe('email')} required>{(p) => <Input {...p} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" />}</Field>
            {mode === 'signin' ? (
              <Field label={t('auth.password')} error={fe('password')} required>
                {(p) => (
                  <div className="relative">
                    <Input {...p} type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" className="pe-12" />
                    <button type="button" onClick={() => setShow((s) => !s)} aria-pressed={show} aria-label={t('auth.showPassword')} className="absolute inset-y-0 end-0 grid w-11 place-items-center rounded-e-lg text-muted hover:text-ink">{show ? <EyeSlash size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}</button>
                  </div>
                )}
              </Field>
            ) : null}
            <div role="alert" aria-live="assertive">{formError ? <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm font-medium text-danger">{formError}</p> : null}</div>
            <Button type="submit" size="lg" fullWidth loading={busy}>{mode === 'signin' ? t('auth.signIn') : t('auth.createAccount')}<ArrowRight size={18} aria-hidden="true" /></Button>
            <p className="flex items-start gap-2 text-sm text-muted"><Info size={18} className="mt-0.5 shrink-0" aria-hidden="true" />{mode === 'signin' ? t('auth.demoNote') : t('auth.joinNote')}</p>
          </form>
          {demo.length ? (
            <section aria-labelledby="demo-h" className="flex flex-col gap-3 border-t border-line pt-5">
              <h2 id="demo-h" className="text-sm font-semibold uppercase tracking-wider text-muted">{t('auth.tryAs')}</h2>
              <ul className="grid grid-cols-2 gap-2">
                {demo.map((p) => (
                  <li key={p.userId}>
                    <button type="button" onClick={() => { setMode('signin'); setEmail(`${p.userId.replace('usr_', '')}@example.org`); setPassword('demo'); setError(null); }} className="hover-lift flex min-h-14 w-full items-center gap-3 rounded-xl border border-line bg-surface/70 p-2 text-start">
                      <Avatar name={p.name} size="sm" />
                      <span className="min-w-0"><span className="block truncate text-sm font-medium">{p.name}</span><span className="block truncate text-xs text-muted">{t(`persona.role${(p.roles.includes('admin') ? 'admin' : p.roles.includes('mentor') ? 'mentor' : p.roles.includes('leader') ? 'leader' : 'student').replace(/^./, (c) => c.toUpperCase())}`)}</span></span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-muted">{t('auth.inviteHint')}</p>
            </section>
          ) : null}
        </div>
      </main>
      <aside aria-hidden="true" className="sticky top-0 hidden h-dvh overflow-hidden lg:block">
        <div className="absolute inset-0"><Cover coverKey="dawn" className="scale-125" /></div>
        <div className="absolute inset-0 flex items-end p-10">
          <div className="glass-strong w-full max-w-xl rounded-3xl border p-8 shadow-lift"><QuoteRotator /></div>
        </div>
      </aside>
    </div>
  );
}
