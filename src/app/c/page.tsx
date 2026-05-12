import { PageWithMassivePayload } from '@/components/PageWithMassivePayload';
import { loadCachedPayload } from '@/lib/cached';
import { reproHardcoded as H } from '@/lib/reproHardcodedCopy';

export default async function PageC() {
  const data = await loadCachedPayload('/c', 'en');

  return (
    <PageWithMassivePayload
      title={H.PageC.title}
      intro={<p>{H.PageC.description}</p>}
      data={data}
    />
  );
}
