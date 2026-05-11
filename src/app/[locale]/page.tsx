import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { PageWithMassivePayload } from '@/components/PageWithMassivePayload';
import { loadCachedPayload } from '@/lib/cached';
import { bypassNextIntl } from '@/lib/reproBypassNextIntl';
import { reproHardcoded as H } from '@/lib/reproHardcodedCopy';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;

  if (bypassNextIntl()) {
    if (locale !== 'en') notFound();
    const data = await loadCachedPayload('/', locale);
    return (
      <PageWithMassivePayload
        title={H.Home.title}
        intro={<p>{H.Home.intro}</p>}
        data={data}
      />
    );
  }

  setRequestLocale(locale);
  const t = await getTranslations('Home');
  const data = await loadCachedPayload('/', locale);

  return (
    <PageWithMassivePayload
      title={t('title')}
      intro={<p>{t('intro')}</p>}
      data={data}
    />
  );
}
