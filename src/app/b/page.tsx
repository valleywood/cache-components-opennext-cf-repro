import { PageWithMassivePayload } from '@/components/PageWithMassivePayload';
import { loadCachedPayload } from '@/lib/cached';
import { reproHardcoded as H } from '@/lib/reproHardcodedCopy';

export default async function PageB() {
  const data = await loadCachedPayload('/b', 'en');

  return (
    <PageWithMassivePayload
      title={H.PageB.title}
      intro={<p>{H.PageB.description}</p>}
      data={data}
    />
  );
}
