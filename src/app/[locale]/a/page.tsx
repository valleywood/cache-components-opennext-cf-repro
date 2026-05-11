import { notFound } from 'next/navigation';

import { PageWithMassivePayload } from '@/components/PageWithMassivePayload';
import { loadCachedPayload } from '@/lib/cached';
import { reproHardcoded as H } from '@/lib/reproHardcodedCopy';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function PageA({ params }: Props) {
  const { locale } = await params;

  if (locale !== 'en') {
    notFound();
  }
  const data = await loadCachedPayload('/a', locale);

  return (
    <PageWithMassivePayload
      title={H.PageA.title}
      intro={<p>{H.PageA.description}</p>}
      data={data}
    />
  );
}
