import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { Suspense } from 'react';

import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { Nav } from '@/components/Nav';
import { routing } from '@/lib/i18n/routing';

import '../globals.css';

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {/* Suspense: Cache Components + PPR (e.g. /items/[id]) — client locale + async Nav must not block the static shell */}
          <Suspense fallback={<div style={{ minHeight: 40, background: '#f0f0f0' }} />}>
            <LocaleSwitcher />
          </Suspense>
          <Suspense
            fallback={
              <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
                …
              </nav>
            }
          >
            <Nav />
          </Suspense>
          <main>{children}</main>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
