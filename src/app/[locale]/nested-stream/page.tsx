/**
 * Stress route for OpenNext on Cloudflare Workers: nested Suspense + two large
 * `loadCachedPayload` streams. If you see raw “Lorem ipsum” / junk at the top and
 * Chrome/Safari “This page couldn’t load” while `/nested-stream` is **200**, the RSC
 * Flight stream was likely corrupted (chunk ordering on the worker). Mitigations:
 * **`REPRO_NESTED_STREAM_SERIAL_COLUMNS=1`** (load column B after A — e.g. `yarn preview:without-inc-cache` or `.dev.vars`), lower **`REPRO_RESPONSE_KB`**, or confirm with **`next start`**.
 */
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Suspense } from 'react';

import { PageWithMassivePayload } from '@/components/PageWithMassivePayload';
import { loadCachedPayload } from '@/lib/cached';
import { nestedStreamSerialColumns } from '@/lib/reproNestedStreamEnv';

type PageParams = { locale: string };

type Props = {
  params: Promise<PageParams>;
};

function sleep(ms: number) {
  return new Promise<void>((r) => {
    setTimeout(r, ms);
  });
}

export default function NestedStreamPage(props: Props) {
  return (
    <Suspense fallback={<p>Loading shell…</p>}>
      <OuterShell {...props} />
    </Suspense>
  );
}

/** Layout already wraps Nav + LocaleSwitcher in Suspense; this adds another boundary layer. */
async function OuterShell(props: Props) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  await sleep(8);
  const t = await getTranslations('NestedStream');

  return (
    <div>
      <h1>{t('title')}</h1>
      <p style={{ maxWidth: '52rem', lineHeight: 1.5 }}>{t('intro')}</p>
      <Suspense fallback={<p>Loading grid…</p>}>
        <MiddleGrid {...props} />
      </Suspense>
    </div>
  );
}

async function MiddleGrid(props: Props) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  await sleep(24);

  if (nestedStreamSerialColumns()) {
    const colA = await ColumnBlockSequential(props, 'A', 12);
    const colB = await ColumnBlockSequential(props, 'B', 36);
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          marginTop: '1rem',
          alignItems: 'stretch',
        }}
      >
        {colA}
        {colB}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
        marginTop: '1rem',
        alignItems: 'start',
      }}
    >
      <Suspense fallback={<p>Column A…</p>}>
        <ColumnFrame {...props} label="A" staggerMs={12} />
      </Suspense>
      <Suspense fallback={<p>Column B…</p>}>
        <ColumnFrame {...props} label="B" staggerMs={36} />
      </Suspense>
    </div>
  );
}

/** One full column, awaited in order (Workers-safe path — no parallel massive payloads). */
async function ColumnBlockSequential(
  props: Props,
  label: 'A' | 'B',
  staggerMs: number,
) {
  const { locale } = await props.params;
  setRequestLocale(locale);
  await sleep(staggerMs);
  const t = await getTranslations('NestedStream');

  const data = await loadCachedPayload('/nested-stream', locale, `col-${label}`);

  return (
    <section
      style={{
        border: '1px solid #ccc',
        borderRadius: 8,
        padding: '1rem',
        minWidth: 0,
      }}
    >
      <h2 style={{ marginTop: 0 }}>{t('columnTitle', { label })}</h2>
      <p style={{ fontSize: '0.9rem', color: '#444' }}>{t('columnIntro')}</p>
      <PageWithMassivePayload
        title={t('massiveSectionTitle', { label })}
        intro={<p>{t('massiveSectionIntro', { label })}</p>}
        data={data}
      />
    </section>
  );
}

async function ColumnFrame({
  params,
  label,
  staggerMs,
}: Props & { label: string; staggerMs: number }) {
  const { locale } = await params;
  setRequestLocale(locale);
  await sleep(staggerMs);
  const t = await getTranslations('NestedStream');

  return (
    <section
      style={{
        border: '1px solid #ccc',
        borderRadius: 8,
        padding: '1rem',
        minWidth: 0,
      }}
    >
      <h2 style={{ marginTop: 0 }}>{t('columnTitle', { label })}</h2>
      <p style={{ fontSize: '0.9rem', color: '#444' }}>{t('columnIntro')}</p>
      <Suspense fallback={<p>Loading large payload…</p>}>
        <ColumnMassivePayload locale={locale} label={label} />
      </Suspense>
    </section>
  );
}

async function ColumnMassivePayload({
  locale,
  label,
}: {
  locale: string;
  label: string;
}) {
  setRequestLocale(locale);
  await sleep(16);
  const t = await getTranslations('NestedStream');
  const data = await loadCachedPayload('/nested-stream', locale, `col-${label}`);

  return (
    <PageWithMassivePayload
      title={t('massiveSectionTitle', { label })}
      intro={<p>{t('massiveSectionIntro', { label })}</p>}
      data={data}
    />
  );
}
