/** Inline copy for the English-only repro mode. */
export const reproHardcoded = {
  Nav: {
    home: 'Home',
    pageA: 'Page A (prefetch=true)',
    pageB: 'Page B (prefetch=true)',
    pageC: 'Page C (prefetch=true)',
    item1: 'Item 1',
    item2: 'Item 2 (prefetch=true)',
    nestedStream: 'Nested stream repro',
  },
  Home: {
    title: 'Home',
    intro:
      'Minimal repro for use cache / Cache Components on OpenNext Cloudflare. Nav links use prefetch for stress. Each page ships a large cached blob (REPRO_RESPONSE_KB).',
  },
  PageA: {
    title: 'Page A',
    description: 'All links use prefetch=true from Nav.',
  },
  PageB: {
    title: 'Page B',
    description: 'All links use prefetch=true from Nav.',
  },
  PageC: {
    title: 'Page C',
    description: 'Another default-prefetch route for comparison.',
  },
  Item: {
    title: (id: string) => `Item ${id}`,
    description: 'Dynamic segment + cached payload (extra tag segment = id).',
  },
  NestedStream: {
    title: 'Nested Suspense + parallel streams',
    intro:
      'Several Suspense boundaries (including inside each column) plus two sibling columns that each load the full REPRO_RESPONSE_KB cached payload. Use a high REPRO_RESPONSE_KB with yarn preview to stress split RSC chunks on Cloudflare Workers—especially cold starts—where chunk ordering bugs may surface as 500s.',
    columnTitle: (label: string) => `Column ${label}`,
    columnIntro: 'Sibling async boundary; cache tag includes this column id.',
    massiveSectionTitle: (label: string) => `Payload column ${label}`,
    massiveSectionIntro: (label: string) =>
      `Inner Suspense boundary: full blob per column, separate cache tag (col-${label}).`,
  },
  Massive: {
    sizeHint: 'Cached payload size target:',
    bytes: 'bytes',
    actualChars: 'Actual chars:',
    detailsSummary: (count: number) =>
      `Massive cached body (${count} chars) — still in HTML when collapsed; expands for manual inspection.`,
  },
} as const;
