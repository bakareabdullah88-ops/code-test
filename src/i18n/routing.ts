import { defineRouting } from 'next-intl/routing';
import { defaultLocale, locales } from '@/config/locales';

export const routing = defineRouting({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'as-needed',
});
