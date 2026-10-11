export const locales = ['en', 'fr', 'pt', 'sw', 'yo', 'ha', 'ig'] as const;
export type AppLocale = (typeof locales)[number];
export const defaultLocale: AppLocale = 'en';

// Dev-only pseudo-locale used to catch hard-coded strings and overflow.
export const pseudoLocale = 'en-XA';
