import { useState } from 'react';
import { useT } from '@/lib/i18n';
import { setPrefs, usePrefs, type ReadingSize, type ThemePref } from '@/lib/prefs';
import { useSession } from '@/features/session/hooks';
import { useMutation } from '@tanstack/react-query';
import { peopleService } from '@/lib/services/system';
import { PageHeader } from '@/components/patterns/page-header/page-header';
import { Card } from '@/components/ui/card/card';
import { Field } from '@/components/ui/field/field';
import { Input, Textarea } from '@/components/ui/input/input';
import { Button } from '@/components/ui/button/button';
import { SegmentedControl } from '@/components/ui/segmented-control/segmented-control';
import { Switch } from '@/components/ui/switch/switch';
import { Avatar } from '@/components/ui/avatar/avatar';
import { useToast } from '@/components/ui/toast/toast';
import { Notice } from '@/components/patterns/notice/notice';

export function SettingsPage() {
  const t = useT();
  const toast = useToast();
  const prefs = usePrefs();
  const { user } = useSession();
  const [name, setName] = useState(user?.displayName ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [avatar, setAvatar] = useState<string | null>(user?.avatarUrl ?? null);
  const save = useMutation({ mutationFn: () => peopleService.updateMe({ displayName: name.trim() || undefined, bio: bio || null, avatarUrl: avatar }) });

  const onFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      // Downscale so the saved photo stays small.
      const img = new Image();
      img.onload = () => {
        const size = 160;
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext('2d');
        const s = Math.min(img.width, img.height);
        ctx?.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
        setAvatar(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <PageHeader title={t('settings.title')} description={t('settings.description')} />
      <Card padding="lg" className="flex flex-col gap-4">
        <h2 className="text-h4 font-semibold">{t('settings.profile')}</h2>
        <div className="flex items-center gap-4">
          <Avatar name={name || user?.displayName || ''} src={avatar} size="lg" />
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex min-h-11 cursor-pointer items-center rounded-md border border-line-strong bg-surface px-4 text-base font-medium hover:bg-sunken focus-within:outline-2 focus-within:outline-offset-2">
              {t('settings.photo')}
              <input type="file" accept="image/*" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
            {avatar ? <Button variant="ghost" onClick={() => setAvatar(null)}>{t('settings.removePhoto')}</Button> : null}
          </div>
        </div>
        <Field label={t('settings.name')}>{(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} />}</Field>
        <Field label={t('settings.bio')}>{(p) => <Textarea {...p} rows={3} value={bio} onChange={(e) => setBio(e.target.value)} />}</Field>
        <div><Button loading={save.isPending} onClick={() => save.mutate(undefined, { onSuccess: () => toast.show({ title: t('settings.saved'), tone: 'success' }) })}>{t('actions.save')}</Button></div>
      </Card>
      <Card padding="lg" className="flex flex-col gap-4">
        <h2 className="text-h4 font-semibold">{t('settings.appearance')}</h2>
        <div className="flex flex-col gap-2"><p className="text-sm font-medium">{t('theme.label')}</p><SegmentedControl label={t('theme.label')} value={prefs.theme} onValueChange={(v) => setPrefs({ theme: v as ThemePref })} options={[{ value: 'light', label: t('theme.light') }, { value: 'dark', label: t('theme.dark') }, { value: 'system', label: t('theme.system') }]} /></div>
        <div className="flex flex-col gap-2"><p className="text-sm font-medium">{t('learn.lesson.textSize')}</p><SegmentedControl label={t('learn.lesson.textSize')} value={prefs.readingSize} onValueChange={(v) => setPrefs({ readingSize: v as ReadingSize })} options={[{ value: 's', label: t('learn.lesson.sizeS') }, { value: 'm', label: t('learn.lesson.sizeM') }, { value: 'l', label: t('learn.lesson.sizeL') }, { value: 'xl', label: t('learn.lesson.sizeXL') }]} /></div>
        <Switch label={t('settings.reduceMotion')} description={t('settings.reduceMotionHelp')} checked={prefs.motion === 'reduce'} onCheckedChange={(c) => setPrefs({ motion: c ? 'reduce' : 'system' })} />
      </Card>
      <Card padding="lg" className="flex flex-col gap-3">
        <h2 className="text-h4 font-semibold">{t('settings.privacy')}</h2>
        <Notice>{t('settings.privacyBody')}</Notice>
      </Card>
    </div>
  );
}
