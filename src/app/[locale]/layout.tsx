import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { Suspense } from 'react';

import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { Nav } from '@/components/Nav';

import '../globals.css';

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return [{ locale: 'en' }];
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (locale !== 'en') {
    notFound();
  }

  return (
    <html lang="en">
      <body>
        <Suspense fallback={<div style={{ minHeight: 40, background: '#f0f0f0' }} />}>
          <LocaleSwitcher />
        </Suspense>
        <Suspense
          fallback={
            <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
              ...
            </nav>
          }
        >
          <Nav />
        </Suspense>
        <main>{children}</main>
      </body>
    </html>
  );
}
