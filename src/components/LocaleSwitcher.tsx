'use client';

import { useLocale } from 'next-intl';

import { Link, usePathname } from '@/lib/i18n/navigation';
import { routing } from '@/lib/i18n/routing';

const linkPrefetch = process.env.NEXT_PUBLIC_REPRO_NAV_PREFETCH !== '0';

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        alignItems: 'center',
        padding: '0.5rem 1rem',
        background: '#f0f0f0',
        fontSize: '0.85rem',
      }}
    >
      <span style={{ fontWeight: 600 }}>Locale:</span>
      {routing.locales.map((l) => (
        <Link
          key={l}
          href={pathname}
          locale={l}
          prefetch={linkPrefetch}
          style={{
            fontWeight: l === locale ? 700 : 400,
            textDecoration: l === locale ? 'underline' : 'none',
          }}
        >
          {l}
        </Link>
      ))}
    </div>
  );
}
