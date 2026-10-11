import { ChatCircleText, Lock, UsersThree, UserCircle } from '@phosphor-icons/react';
import { useT, useFormat } from '@/lib/i18n';
import { Link } from '@/lib/nav';
import type { ReflectionView } from '@/lib/services/reflections';
import { excerpt } from '@/lib/editor/text';
import { Badge } from '@/components/ui/badge/badge';
import { Avatar } from '@/components/ui/avatar/avatar';

export function VisibilityBadge({ r }: { r: Pick<ReflectionView, 'visibility' | 'status'> }) {
  const t = useT();
  if (r.status === 'draft') return <Badge tone="warning">{t('learn.reflect.statusDraft')}</Badge>;
  const icon = r.visibility === 'private' ? <Lock size={12} /> : r.visibility === 'mentor' ? <UserCircle size={12} /> : <UsersThree size={12} />;
  return <Badge icon={icon}>{t(`learn.reflect.status.${r.visibility}`)}</Badge>;
}

export function ReflectionCard({ r, href, showAuthor = false }: { r: ReflectionView; href: string; showAuthor?: boolean }) {
  const t = useT();
  const f = useFormat();
  return (
    <Link to={href} className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-4 transition-colors motion-fast hover:border-line-strong hover:bg-sunken">
      <div className="flex flex-wrap items-center gap-2">
        {showAuthor ? <span className="flex items-center gap-2 text-sm font-medium"><Avatar name={r.author.displayName} size="sm" />{r.author.displayName}</span> : null}
        <VisibilityBadge r={r} />
        {r.feedbackStatus === 'responded' ? <Badge tone="accent" icon={<ChatCircleText size={12} />}>{t('learn.reflect.hasReply')}</Badge> : null}
        {r.feedbackStatus === 'awaiting' && !showAuthor ? <Badge>{t('learn.reflect.waiting')}</Badge> : null}
        <span className="ms-auto text-sm text-muted">{f.ago(r.submittedAt ?? r.updatedAt)}</span>
      </div>
      <h3 className="font-sans text-base font-semibold text-ink">{r.title ?? r.lessonTitle ?? t('learn.journal.entry')}</h3>
      {r.lessonTitle && r.title ? <p className="text-sm text-muted">{r.lessonTitle}</p> : null}
      <p className="line-clamp-2 font-serif text-base text-muted">{excerpt(r.plainText, 200)}</p>
    </Link>
  );
}
