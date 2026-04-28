import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';

import { PageWithMassivePayload } from '@/components/PageWithMassivePayload';
import { loadCachedPayload } from '@/lib/cached';

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

function ItemFallback() {
  return <p>Loading item…</p>;
}

async function ItemBody({ params }: Props) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('Item');
  const data = await loadCachedPayload(`/items/[id]`, locale, id);

  return (
    <PageWithMassivePayload
      title={t('title', { id })}
      intro={<p>{t('description')}</p>}
      data={data}
    />
  );
}

export default function ItemPage(props: Props) {
  return (
    <Suspense fallback={<ItemFallback />}>
      <ItemBody {...props} />
    </Suspense>
  );
}
