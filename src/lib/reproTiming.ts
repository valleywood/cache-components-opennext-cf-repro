import { headers } from 'next/headers';

import {
  REPRO_REQUEST_START_HEADER,
  reproTimingEnabled,
} from '@/lib/reproTimingEnv';

/**
 * Logs `[repro-timing] <label> +<ms>ms` relative to middleware request start.
 * Enable with `REPRO_TIMING=1` (Node: `yarn start`; Workers: `.dev.vars` or `wrangler` vars + preview).
 */
export async function reproTimingPhase(
  label: string,
  extra?: Record<string, unknown>,
): Promise<void> {
  if (!reproTimingEnabled()) return;

  const h = await headers();
  const startRaw = h.get(REPRO_REQUEST_START_HEADER);
  const start = startRaw ? Number(startRaw) : NaN;
  const now = Date.now();
  const elapsed = Number.isFinite(start) ? now - start : undefined;

  const suffix =
    extra && Object.keys(extra).length ? ` ${JSON.stringify(extra)}` : '';

  if (elapsed !== undefined) {
    console.log(`[repro-timing] ${label} +${elapsed}ms${suffix}`);
  } else {
    console.log(
      `[repro-timing] ${label} (missing ${REPRO_REQUEST_START_HEADER})${suffix}`,
    );
  }
}
