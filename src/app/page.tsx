import { PageWithMassivePayload } from '@/components/PageWithMassivePayload';
import { loadCachedPayload } from '@/lib/cached';
import { reproHardcoded as H } from '@/lib/reproHardcodedCopy';

export default async function HomePage() {
  const data = await loadCachedPayload('/', 'en');

  return (
    <PageWithMassivePayload
      title={H.Home.title}
      intro={<p>{H.Home.intro}</p>}
      data={data}
    />
  );
}
