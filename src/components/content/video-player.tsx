import { useEffect, useState } from 'react';
import type { RichDoc } from '@/types';
import { useT } from '@/lib/i18n';
import { RichView } from './rich-view';
import { Notice } from '@/components/patterns/notice/notice';

const media = (path: string) => `${import.meta.env.BASE_URL}${path}`;

/** Video with captions on by default. No autoplay; the poster shows first. A transcript is always available. */
export function VideoPlayer({ src, poster, captions, transcript, title }: { src: string; poster: string | null; captions: string; transcript: RichDoc | null; title: string }) {
  const t = useT();
  const [failed, setFailed] = useState(false);
  const [showText, setShowText] = useState(false);
  // Captions are published as plain text; a blob with the right type lets the browser treat them as WebVTT.
  const [captionUrl, setCaptionUrl] = useState<string | null>(null);
  useEffect(() => {
    let url: string | null = null;
    let cancelled = false;
    fetch(media(captions)).then((r) => (r.ok ? r.text() : Promise.reject(new Error('captions')))).then((txt) => {
      if (cancelled) return;
      url = URL.createObjectURL(new Blob([txt], { type: 'text/vtt' }));
      setCaptionUrl(url);
    }).catch(() => undefined);
    return () => { cancelled = true; if (url) URL.revokeObjectURL(url); };
  }, [captions]);
  return (
    <section aria-label={title} className="overflow-hidden rounded-lg border border-line bg-surface">
      {failed ? (
        <Notice tone="warning" className="m-4">{t('learn.video.failed')}</Notice>
      ) : (
        <video controls preload="metadata" playsInline poster={poster ? media(poster) : undefined} className="aspect-video w-full bg-sunken" onError={() => setFailed(true)} aria-label={title}>
          <source src={media(src)} type="video/webm" onError={() => setFailed(true)} />
          <track kind="captions" src={captionUrl ?? undefined} srcLang="en" label="English" default />
        </video>
      )}
      <div className="px-4 pb-2">
        <button type="button" aria-expanded={showText} onClick={() => setShowText((s) => !s)} className="inline-flex min-h-11 items-center text-sm font-medium text-accent-soft-ink underline underline-offset-4">
          {showText ? t('learn.video.hideTranscript') : t('learn.video.showTranscript')}
        </button>
        {showText && transcript ? <RichView doc={transcript} className="prose-reading pb-3" /> : null}
      </div>
    </section>
  );
}
