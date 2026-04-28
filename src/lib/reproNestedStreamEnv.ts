/**
 * When `1`, `/nested-stream` loads column B only after column A (including its cached
 * payload) has finished — avoids two parallel multi‑hundred‑KiB RSC chunks that often
 * break Chrome/Safari on Wrangler (“This page couldn’t load”) even when the HTML is 200.
 * Set `0` for parallel Suspense stress (e.g. `yarn start` / `preview:with-inc-cache`).
 */
export function nestedStreamSerialColumns(): boolean {
  return process.env.REPRO_NESTED_STREAM_SERIAL_COLUMNS === '1';
}
