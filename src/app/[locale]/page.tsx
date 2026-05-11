import { notFound } from 'next/navigation';

import { PageWithMassivePayload } from '@/components/PageWithMassivePayload';
import { loadCachedPayload } from '@/lib/cached';
import { reproHardcoded as H } from '@/lib/reproHardcodedCopy';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;

  if (locale !== 'en') {
    notFound();
  }
  const data = await loadCachedPayload('/', locale);

  return (
    <PageWithMassivePayload
      title={H.Home.title}
      intro={<p>{H.Home.intro}</p>}
      data={data}
    />
  );
}
