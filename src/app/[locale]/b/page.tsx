import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PageWithMassivePayload } from '@/components/PageWithMassivePayload';
import { loadCachedPayload } from '@/lib/cached';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function PageB({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('PageB');
  const data = await loadCachedPayload('/b', locale);

  return (
    <PageWithMassivePayload
      title={t('title')}
      intro={<p>{t('description')}</p>}
      data={data}
    />
  );
}
