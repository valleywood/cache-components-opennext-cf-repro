import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { PageWithMassivePayload } from '@/components/PageWithMassivePayload';
import { loadCachedPayload } from '@/lib/cached';
import { reproHardcoded as H } from '@/lib/reproHardcodedCopy';

type Props = {
  params: Promise<{ locale: string; id: string }>;
};

function ItemFallback() {
  return <p>Loading item…</p>;
}

async function ItemBody({ params }: Props) {
  const { locale, id } = await params;

  if (locale !== 'en') {
    notFound();
  }

  const c = H.Item;
  const data = await loadCachedPayload(`/items/[id]`, locale, id);

  return (
    <PageWithMassivePayload
      title={c.title(id)}
      intro={<p>{c.description}</p>}
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
