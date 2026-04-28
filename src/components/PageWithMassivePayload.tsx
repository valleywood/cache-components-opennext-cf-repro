import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import type { CachedPayload } from '@/lib/cached';

type Props = {
  title: string;
  intro: ReactNode;
  data: CachedPayload;
};

export async function PageWithMassivePayload({ title, intro, data }: Props) {
  const t = await getTranslations('Massive');
  const { massiveBody, ...meta } = data;

  return (
    <div>
      <h1>{title}</h1>
      <div>{intro}</div>
      <p style={{ fontSize: '0.9rem', color: '#444' }}>
        {t('sizeHint')}{' '}
        <strong>{meta.massiveTargetBytes.toLocaleString()} {t('bytes')}</strong>{' '}
        (<code>REPRO_RESPONSE_KB</code>). {t('actualChars')}{' '}
        <strong>{meta.massiveCharCount.toLocaleString()}</strong>.
      </p>
      <pre
        style={{
          background: '#f4f4f4',
          padding: '1rem',
          maxHeight: '14rem',
          overflow: 'auto',
        }}
      >
        {JSON.stringify(meta, null, 2)}
      </pre>
      <details>
        <summary>
          {t('detailsSummary', { count: massiveBody.length })}
        </summary>
        <pre
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            maxHeight: '40vh',
            overflow: 'auto',
            background: '#fafafa',
            padding: '1rem',
            fontSize: '11px',
          }}
        >
          {massiveBody}
        </pre>
      </details>
    </div>
  );
}
