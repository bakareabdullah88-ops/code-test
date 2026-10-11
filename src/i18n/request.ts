import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { brand } from '@/config/brand';
import { routing } from './routing';

const namespaces = ['common', 'nav'] as const;

async function loadNamespaces(locale: string) {
  const entries = await Promise.all(
    namespaces.map(async (ns) => {
      const mod = (await import(`../../messages/${locale}/${ns}.json`)) as { default: Record<string, unknown> };
      return [ns, mod.default] as const;
    }),
  );
  return Object.fromEntries(entries);
}

function mergeDeep(base: Record<string, unknown>, over: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(over)) {
    const b = out[k];
    out[k] =
      v && typeof v === 'object' && b && typeof b === 'object'
        ? mergeDeep(b as Record<string, unknown>, v as Record<string, unknown>)
        : v;
  }
  return out;
}

// The product name is injected once here so catalogues stay free of the literal brand.
function withBrand<T>(messages: T): T {
  return JSON.parse(JSON.stringify(messages).replaceAll('{appName}', brand.appName)) as T;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const fallback = await loadNamespaces(routing.defaultLocale);
  const merged = locale === routing.defaultLocale ? fallback : mergeDeep(fallback, await loadNamespaces(locale));
  return { locale, messages: withBrand(merged) };
});
