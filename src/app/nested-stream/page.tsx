/**
 * Stress route for OpenNext on Cloudflare Workers: nested Suspense + large
 * `loadCachedPayload` streams. If you see raw “Lorem ipsum” / junk at the top and
 * Chrome/Safari “This page couldn’t load” while `/nested-stream` is **200**, the RSC
 * Flight stream was likely corrupted (chunk ordering on the worker). Mitigations:
 * **`REPRO_NESTED_STREAM_SERIAL_COLUMNS=1`** (e.g. `yarn preview:without-inc-cache` or `.dev.vars`),
 * lower **`REPRO_RESPONSE_KB`**, or confirm with **`next start`**.
 */
import { Suspense } from 'react';

import { PageWithMassivePayload } from '@/components/PageWithMassivePayload';
import { loadCachedPayload } from '@/lib/cached';
import { reproHardcoded as H } from '@/lib/reproHardcodedCopy';
import {
  nestedStreamParallelColumns,
  nestedStreamSerialColumns,
} from '@/lib/reproNestedStreamEnv';

function sleep(ms: number) {
  return new Promise<void>((r) => {
    setTimeout(r, ms);
  });
}

function columnLabels(count: number): string[] {
  return Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i));
}

function columnStaggerMs(index: number): number {
  return 12 + index * 24;
}

export default function NestedStreamPage() {
  return (
    <Suspense fallback={<p>Loading shell…</p>}>
      <OuterShell />
    </Suspense>
  );
}

async function OuterShell() {
  await sleep(8);
  const c = H.NestedStream;

  return (
    <div>
      <h1>{c.title}</h1>
      <p style={{ maxWidth: '52rem', lineHeight: 1.5 }}>{c.intro}</p>
      <Suspense fallback={<p>Loading grid…</p>}>
        <MiddleGrid />
      </Suspense>
    </div>
  );
}

async function MiddleGrid() {
  await sleep(24);

  if (nestedStreamSerialColumns()) {
    const labels = columnLabels(nestedStreamParallelColumns());
    const cols: Awaited<ReturnType<typeof ColumnBlockSequential>>[] = [];
    for (let i = 0; i < labels.length; i += 1) {
      const label = labels[i];
      cols.push(await ColumnBlockSequential(label, columnStaggerMs(i)));
    }

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
        {cols}
      </div>
    );
  }

  const labels = columnLabels(nestedStreamParallelColumns());

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))`,
        gap: '1rem',
        marginTop: '1rem',
        alignItems: 'start',
      }}
    >
      {labels.map((label, i) => (
        <Suspense key={label} fallback={<p>Column {label}…</p>}>
          <ColumnFrame label={label} staggerMs={columnStaggerMs(i)} />
        </Suspense>
      ))}
    </div>
  );
}

async function ColumnBlockSequential(label: string, staggerMs: number) {
  await sleep(staggerMs);
  const c = H.NestedStream;
  const data = await loadCachedPayload('/nested-stream', 'en', `col-${label}`);

  return (
    <section
      style={{
        border: '1px solid #ccc',
        borderRadius: 8,
        padding: '1rem',
        minWidth: 0,
      }}
    >
      <h2 style={{ marginTop: 0 }}>{c.columnTitle(label)}</h2>
      <p style={{ fontSize: '0.9rem', color: '#444' }}>{c.columnIntro}</p>
      <PageWithMassivePayload
        title={c.massiveSectionTitle(label)}
        intro={<p>{c.massiveSectionIntro(label)}</p>}
        data={data}
      />
    </section>
  );
}

async function ColumnFrame({
  label,
  staggerMs,
}: { label: string; staggerMs: number }) {
  await sleep(staggerMs);
  const c = H.NestedStream;

  return (
    <section
      style={{
        border: '1px solid #ccc',
        borderRadius: 8,
        padding: '1rem',
        minWidth: 0,
      }}
    >
      <h2 style={{ marginTop: 0 }}>{c.columnTitle(label)}</h2>
      <p style={{ fontSize: '0.9rem', color: '#444' }}>{c.columnIntro}</p>
      <Suspense fallback={<p>Loading large payload…</p>}>
        <ColumnMassivePayload label={label} />
      </Suspense>
    </section>
  );
}

async function ColumnMassivePayload({ label }: { label: string }) {
  await sleep(16);
  const c = H.NestedStream;
  const data = await loadCachedPayload('/nested-stream', 'en', `col-${label}`);

  return (
    <PageWithMassivePayload
      title={c.massiveSectionTitle(label)}
      intro={<p>{c.massiveSectionIntro(label)}</p>}
      data={data}
    />
  );
}
