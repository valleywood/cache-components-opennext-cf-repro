import { notFound } from 'next/navigation';

import { PageWithMassivePayload } from '@/components/PageWithMassivePayload';
import { loadCachedPayload } from '@/lib/cached';
import { reproHardcoded as H } from '@/lib/reproHardcodedCopy';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function PageC({ params }: Props) {
  const { locale } = await params;

  if (locale !== 'en') {
    notFound();
  }
  const data = await loadCachedPayload('/c', locale);

  return (
    <PageWithMassivePayload
      title={H.PageC.title}
      intro={<p>{H.PageC.description}</p>}
      data={data}
    />
  );
}
