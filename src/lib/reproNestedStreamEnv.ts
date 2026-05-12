/**
 * When `1`, `/nested-stream` loads column B only after column A (including its cached
 * payload) has finished — avoids two parallel multi‑hundred‑KiB RSC chunks that often
 * break Chrome/Safari on Wrangler (“This page couldn’t load”) even when the HTML is 200.
 * Set `0` for parallel Suspense stress (default `yarn preview`, `yarn start`). Use `1` with
 * `yarn preview:without-inc-cache` or in `.dev.vars` to serialize columns on Workers.
 */
export function nestedStreamSerialColumns(): boolean {
  return process.env.REPRO_NESTED_STREAM_SERIAL_COLUMNS === '1';
}

/**
 * Number of sibling columns rendered by `/nested-stream` when in parallel mode.
 * Clamped to keep local preview usable while still allowing heavier stress.
 */
export function nestedStreamParallelColumns(): number {
  const raw = Number(process.env.REPRO_NESTED_STREAM_PARALLEL_COLUMNS ?? '2');
  if (!Number.isFinite(raw)) {
    return 2;
  }
  const n = Math.floor(raw);
  if (n < 2) {
    return 2;
  }
  if (n > 8) {
    return 8;
  }
  return n;
}
