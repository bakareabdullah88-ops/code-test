import { useMemo, useState } from 'react';
import { Pause, Play, Stop } from '@phosphor-icons/react';
import type { RichDoc } from '@/types';
import { docToText } from '@/lib/editor/text';
import { useT } from '@/lib/i18n';
import { useSpeech } from '@/lib/use-speech';
import { Button } from '@/components/ui/button/button';
import { Progress } from '@/components/ui/progress/progress';
import { SegmentedControl } from '@/components/ui/segmented-control/segmented-control';
import { RichView } from './rich-view';
import { Notice } from '@/components/patterns/notice/notice';

/** "Listen" block: the transcript is read aloud by the browser's own voices, with speed control. */
export function AudioReader({ transcript, durationSec, title }: { transcript: RichDoc; durationSec: number; title: string }) {
  const t = useT();
  const text = useMemo(() => docToText(transcript), [transcript]);
  const sp = useSpeech(text);
  const [showText, setShowText] = useState(false);
  const mins = Math.max(1, Math.round(durationSec / 60));

  return (
    <section aria-label={title} className="rounded-lg border border-line bg-surface p-4 md:p-5">
      <div className="flex flex-wrap items-center gap-3">
        {sp.state === 'playing' ? (
          <Button onClick={sp.pause}><Pause size={20} weight="fill" aria-hidden="true" />{t('learn.audio.pause')}</Button>
        ) : (
          <Button onClick={sp.play} disabled={!sp.supported}><Play size={20} weight="fill" aria-hidden="true" />{sp.state === 'paused' ? t('learn.audio.resume') : t('learn.audio.listen')}</Button>
        )}
        {sp.state !== 'idle' ? <Button variant="secondary" onClick={sp.stop}><Stop size={18} weight="fill" aria-hidden="true" />{t('learn.audio.stop')}</Button> : null}
        <span className="text-sm text-muted">{t('learn.audio.length', { minutes: mins })}</span>
        <SegmentedControl className="ms-auto" label={t('learn.audio.speed')} value={String(sp.rate)} onValueChange={(v) => sp.setRate(Number(v))} options={[{ value: '0.85', label: '0.85x' }, { value: '1', label: '1x' }, { value: '1.25', label: '1.25x' }]} />
      </div>
      {sp.state !== 'idle' ? <Progress className="mt-3" value={sp.progress * 100} label={t('learn.audio.progress')} valueText={t('learn.audio.progressText', { percent: Math.round(sp.progress * 100) })} /> : null}
      {!sp.supported ? <Notice tone="warning" className="mt-3">{t('learn.audio.unsupported')}</Notice> : <p className="mt-2 text-sm text-subtle">{t('learn.audio.voiceNote')}</p>}
      <button type="button" aria-expanded={showText} onClick={() => setShowText((s) => !s)} className="mt-2 inline-flex min-h-11 items-center text-sm font-medium text-accent-soft-ink underline underline-offset-4">
        {showText ? t('learn.audio.hideTranscript') : t('learn.audio.showTranscript')}
      </button>
      {showText ? <RichView doc={transcript} className="prose-reading mt-1" /> : null}
    </section>
  );
}
