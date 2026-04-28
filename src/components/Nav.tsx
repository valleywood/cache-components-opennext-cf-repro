import { getTranslations } from 'next-intl/server';

import { Link } from '@/lib/i18n/navigation';

/** Set `NEXT_PUBLIC_REPRO_NAV_PREFETCH=0` (e.g. `yarn preview:without-inc-cache`) to avoid RSC prefetch storms on Workers. */
const linkPrefetch = process.env.NEXT_PUBLIC_REPRO_NAV_PREFETCH !== '0';

export async function Nav() {
  const t = await getTranslations('Nav');

  return (
    <nav
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        padding: '1rem',
        borderBottom: '1px solid #ccc',
        marginBottom: '1rem',
      }}
    >
      <Link href="/" prefetch={linkPrefetch}>
        {t('home')}
      </Link>
      <Link href="/a" prefetch={linkPrefetch}>
        {t('pageA')}
      </Link>
      <Link href="/b" prefetch={linkPrefetch}>
        {t('pageB')}
      </Link>
      <Link href="/c" prefetch={linkPrefetch}>
        {t('pageC')}
      </Link>
      <Link href="/nested-stream" prefetch={linkPrefetch}>
        {t('nestedStream')}
      </Link>
      <Link href="/items/1" prefetch={linkPrefetch}>
        {t('item1')}
      </Link>
      <Link href="/items/2" prefetch={linkPrefetch}>
        {t('item2')}
      </Link>
    </nav>
  );
}
