import { PageWithMassivePayload } from '@/components/PageWithMassivePayload';
import { loadCachedPayload } from '@/lib/cached';
import { reproHardcoded as H } from '@/lib/reproHardcodedCopy';

export default async function PageA() {
  const data = await loadCachedPayload('/a', 'en');

  return (
    <PageWithMassivePayload
      title={H.PageA.title}
      intro={<p>{H.PageA.description}</p>}
      data={data}
    />
  );
}
