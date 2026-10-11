import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Gallery } from './gallery';

export const metadata: Metadata = { title: 'Design gallery', robots: { index: false, follow: false } };

export default async function DesignPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <Gallery />;
}
