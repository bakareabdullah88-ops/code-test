import { useNavigate } from 'react-router';
import { ArrowRight } from '@phosphor-icons/react';
import { useT } from '@/lib/i18n';
import { signInAs } from '@/lib/db/session';
import { queryClient } from '@/lib/query';
import { lensHome } from '@/config/nav';
import type { PersonaCard } from '@/lib/services/system';
import { Avatar } from '@/components/ui/avatar/avatar';
import { Card } from '@/components/ui/card/card';
import { Badge } from '@/components/ui/badge/badge';
import { Wordmark } from '@/components/icons/logo';
import { SkeletonRow } from '@/components/ui/skeleton/skeleton';
import { ErrorState } from '@/components/patterns/error-state/error-state';
import { PathIllustration } from '@/components/icons/illustrations';
import { usePersonas } from './hooks';
import { countryName } from '@/lib/countries';

const FEATURED = 'usr_adaeze';

export function PersonaPicker() {
  const t = useT();
  const nav = useNavigate();
  const q = usePersonas();

  const pick = (p: PersonaCard) => {
    signInAs(p.userId, p.orgId);
    void queryClient.invalidateQueries();
    const lens = p.roles.includes('admin') ? 'admin' : p.roles.includes('mentor') ? 'mentor' : p.roles.includes('leader') && !p.roles.includes('student') ? 'lead' : 'learn';
    nav(lensHome[lens]);
  };

  const groups: { key: string; label: string; filter: (p: PersonaCard) => boolean }[] = [
    { key: 'student', label: t('persona.groupStudent'), filter: (p) => !!p.orgId && p.roles.length === 1 && p.roles[0] === 'student' && p.userId !== FEATURED },
    { key: 'mentor', label: t('persona.groupMentor'), filter: (p) => p.roles.includes('mentor') },
    { key: 'leader', label: t('persona.groupLeader'), filter: (p) => p.roles.includes('leader') },
    { key: 'admin', label: t('persona.groupAdmin'), filter: (p) => p.roles.includes('admin') },
    { key: 'solo', label: t('persona.groupSolo'), filter: (p) => !p.orgId },
  ];
  const featured = q.data?.find((p) => p.userId === FEATURED);

  return (
    <main id="main" className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8 md:py-14">
      <Wordmark />
      <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-4">
          <h1 className="text-h1 font-semibold">{t('persona.title')}</h1>
          <p className="max-w-prose text-lg text-muted">{t('persona.intro')}</p>
        </div>
        <div className="hidden w-52 text-ink md:block"><PathIllustration /></div>
      </div>

      {q.isLoading ? (
        <div className="flex flex-col gap-4" aria-busy="true" aria-label={t('states.loading')}>
          {Array.from({ length: 5 }, (_, i) => <SkeletonRow key={i} />)}
        </div>
      ) : q.isError ? (
        <ErrorState title={t('persona.bootError')} description={t('persona.bootErrorBody')} retryLabel={t('actions.retry')} onRetry={() => void q.refetch()} />
      ) : (
        <>
          {featured ? (
            <Card padding="lg" className="flex flex-col gap-5 border-accent bg-accent-soft">
              <div className="flex flex-wrap items-center gap-4">
                <Avatar name={featured.name} size="lg" />
                <div className="min-w-0 flex-1">
                  <Badge tone="accent">{t('persona.featured')}</Badge>
                  <h2 className="mt-1 text-h3 font-semibold">{featured.name}</h2>
                  <p className="text-base text-muted">{t('persona.featuredBlurb')}</p>
                </div>
              </div>
              <p className="max-w-prose text-base text-ink">{t('persona.tryBody')}</p>
              <button type="button" onClick={() => pick(featured)} className="inline-flex min-h-12 w-fit items-center gap-2 rounded-md bg-accent px-5 font-medium text-on-accent transition-colors motion-fast hover:bg-accent-hover">
                {t('persona.startAs', { name: featured.name.split(' ')[0] ?? featured.name })}
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            </Card>
          ) : null}

          {groups.map((g) => {
            const list = (q.data ?? []).filter(g.filter);
            if (!list.length) return null;
            return (
              <section key={g.key} aria-labelledby={`g-${g.key}`} className="flex flex-col gap-3">
                <h2 id={`g-${g.key}`} className="text-h4 font-semibold">{g.label}</h2>
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((p) => (
                    <li key={p.userId}>
                      <button type="button" onClick={() => pick(p)} className="flex w-full items-start gap-3 rounded-lg border border-line bg-surface p-4 text-start transition-colors motion-fast hover:border-line-strong hover:bg-sunken">
                        <Avatar name={p.name} />
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium text-ink">{p.name}</span>
                          <span className="block text-sm text-muted">{[countryName(p.country), p.roles.map((r) => t(`persona.role${r[0]?.toUpperCase()}${r.slice(1)}`)).join(', ')].filter(Boolean).join(' · ')}</span>
                          <span className="mt-1 line-clamp-2 block text-sm text-subtle">{p.blurb}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
          <p className="text-sm text-muted">{t('persona.resetNote')}</p>
        </>
      )}
    </main>
  );
}
