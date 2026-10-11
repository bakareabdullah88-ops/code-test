import type { ReactNode } from 'react';
import { IntlProvider, useTranslations } from 'use-intl';
import type { LocalisedMessage } from '@/types';
import { brand } from '@/config/brand';

// Catalogues are plain JSON per area. The brand name is injected once so copy never hard-codes it.
const modules = import.meta.glob('../../../messages/en/*.json', { eager: true }) as Record<string, { default: Record<string, unknown> }>;
const merged: Record<string, unknown> = {};
for (const m of Object.values(modules)) Object.assign(merged, m.default);
export const messages = JSON.parse(JSON.stringify(merged).replaceAll('{appName}', brand.appName)) as Record<string, unknown>;

export function I18nProvider({ children }: { children: ReactNode }) {
  return (
    <IntlProvider locale="en" messages={messages as never} timeZone={Intl.DateTimeFormat().resolvedOptions().timeZone} onError={() => undefined} getMessageFallback={({ key }) => key}>
      {children}
    </IntlProvider>
  );
}

export const useT = () => useTranslations();
type T = ReturnType<typeof useT>;

/** Renders a system-generated message (notification, timeline, attention). Params ending in `Key` are translated first. */
export function useMsg() {
  const t = useT();
  return (m: LocalisedMessage): string => {
    const params: Record<string, string | number> = {};
    for (const [k, v] of Object.entries(m.params ?? {})) params[k.endsWith('Key') ? k.slice(0, -3) : k] = k.endsWith('Key') ? t(String(v)) : v;
    return t(m.messageKey, params);
  };
}
export type { T };

export function useFormat() {
  const locale = 'en';
  return {
    date: (iso: string, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }) => new Intl.DateTimeFormat(locale, opts).format(new Date(iso)),
    dateTime: (iso: string) => new Intl.DateTimeFormat(locale, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }).format(new Date(iso)),
    time: (iso: string) => new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(new Date(iso)),
    /** Relative time under a week, absolute date after that. */
    ago: (iso: string) => {
      const diff = Date.now() - new Date(iso).getTime();
      const abs = Math.abs(diff);
      const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
      const sign = diff > 0 ? -1 : 1;
      if (abs < 3_600_000) return rtf.format(sign * Math.max(1, Math.round(abs / 60_000)), 'minute');
      if (abs < 86_400_000) return rtf.format(sign * Math.round(abs / 3_600_000), 'hour');
      if (abs < 7 * 86_400_000) return rtf.format(sign * Math.round(abs / 86_400_000), 'day');
      return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: abs > 300 * 86_400_000 ? 'numeric' : undefined }).format(new Date(iso));
    },
  };
}
