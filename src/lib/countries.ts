const display = typeof Intl !== 'undefined' && 'DisplayNames' in Intl ? new Intl.DisplayNames(['en'], { type: 'region' }) : null;

/** Country name from an ISO 3166-1 alpha-2 code. */
export function countryName(code: string | null | undefined): string | null {
  if (!code) return null;
  try {
    return display?.of(code) ?? code;
  } catch {
    return code;
  }
}
