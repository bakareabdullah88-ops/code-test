import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useT } from '@/lib/i18n';
import { setDemoSettings, useDemoSettings, type LatencyProfile } from '@/lib/db/demo-settings';
import { bootService } from '@/lib/services/system';
import { store } from '@/lib/db/store';
import { Sheet, SheetContent } from '@/components/ui/sheet/sheet';
import { RadioGroup } from '@/components/ui/radio-group/radio-group';
import { Switch } from '@/components/ui/switch/switch';
import { Button } from '@/components/ui/button/button';
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog/dialog';
import { useToast } from '@/components/ui/toast/toast';
import { Notice } from '@/components/patterns/notice/notice';

export function DemoControls({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const t = useT();
  const s = useDemoSettings();
  const qc = useQueryClient();
  const nav = useNavigate();
  const toast = useToast();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  const reset = async () => {
    setBusy(true);
    await bootService.reset();
    await qc.invalidateQueries();
    qc.clear();
    setBusy(false);
    setConfirm(false);
    onOpenChange(false);
    nav('/');
    toast.show({ title: t('demo.resetDone'), tone: 'success' });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent title={t('demo.title')} description={t('demo.intro')} closeLabel={t('actions.close')}>
          <div className="flex flex-col gap-6">
            <fieldset className="flex flex-col gap-1">
              <legend className="text-sm font-semibold text-ink">{t('demo.latency')}</legend>
              <RadioGroup
                aria-label={t('demo.latency')}
                value={s.latency}
                onValueChange={(v) => setDemoSettings({ latency: v as LatencyProfile })}
                options={(['instant', 'normal', 'slow', 'flaky'] as const).map((v) => ({ value: v, label: t(`demo.${v}`) }))}
              />
            </fieldset>
            <Switch label={t('demo.offline')} description={t('demo.offlineHelp')} checked={s.offline} onCheckedChange={(c) => setDemoSettings({ offline: c })} />
            <div className="flex flex-col gap-2 border-t border-line pt-4">
              <p className="text-sm text-muted">{t('demo.resetHelp')}</p>
              <Button variant="danger" onClick={() => setConfirm(true)}>{t('demo.reset')}</Button>
            </div>
            <Notice tone={store.persistent ? 'info' : 'warning'}>{store.persistent ? t('demo.storage') : t('demo.storageVolatile')}</Notice>
          </div>
        </SheetContent>
      </Sheet>
      <Dialog open={confirm} onOpenChange={setConfirm}>
        <DialogContent
          title={t('demo.resetConfirmTitle')}
          description={t('demo.resetConfirmBody')}
          closeLabel={t('actions.close')}
          footer={<><DialogClose asChild><Button variant="secondary">{t('actions.cancel')}</Button></DialogClose><Button variant="danger" loading={busy} onClick={() => void reset()}>{t('demo.resetConfirm')}</Button></>}
        />
      </Dialog>
    </>
  );
}
