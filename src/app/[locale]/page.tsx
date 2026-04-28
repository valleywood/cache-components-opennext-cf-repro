import { getTranslations, setRequestLocale } from 'next-intl/server';

import { PageWithMassivePayload } from '@/components/PageWithMassivePayload';
import { loadCachedPayload } from '@/lib/cached';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
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
