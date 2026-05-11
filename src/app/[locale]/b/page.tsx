import { notFound } from 'next/navigation';

import { PageWithMassivePayload } from '@/components/PageWithMassivePayload';
import { loadCachedPayload } from '@/lib/cached';
import { reproHardcoded as H } from '@/lib/reproHardcodedCopy';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function PageB({ params }: Props) {
  const { locale } = await params;

  if (locale !== 'en') {
    notFound();
  }
  const data = await loadCachedPayload('/b', locale);

  return (
    <PageWithMassivePayload
      title={H.PageB.title}
      intro={<p>{H.PageB.description}</p>}
      data={data}
    />
  );
}
