import { cacheLife, cacheTag } from 'next/cache';

import { buildMassivePayloadString, getTargetPayloadBytes } from '@/lib/massivePayload';

export type CachedPayload = {
  routeKey: string;
  locale: string;
  extra: string | null;
  renderedAt: string;
  /** Bytes requested via REPRO_RESPONSE_KB (before cap). */
  massiveTargetBytes: number;
  /** Actual cached blob length (characters ≈ bytes for this ASCII payload). */
  massiveCharCount: number;
  massiveBody: string;
};

/**
 * Cached server work to exercise Cache Components + cacheTag/cacheLife under OpenNext (same pattern as production app).
 */
export async function loadCachedPayload(
  routeKey: string,
  locale: string,
  extra?: string,
): Promise<CachedPayload> {
  'use cache';

  cacheLife('default');
  cacheTag('repro', routeKey, locale, ...(extra ? [extra] : []));

  // Simulate async data (GraphQL, CMS, etc.)
  await new Promise((r) => setTimeout(r, 25));

  const massiveTargetBytes = getTargetPayloadBytes();
  const flightSafe = process.env.REPRO_FLIGHT_SAFE_PAYLOAD === '1';

  if (flightSafe) {
    const massiveBody = `[REPRO_FLIGHT_SAFE_PAYLOAD: ${massiveTargetBytes} byte target — Lorem not sent in Flight; use yarn preview for full stress]`;
    return {
      routeKey,
      locale,
      extra: extra ?? null,
      renderedAt: new Date().toISOString(),
      massiveTargetBytes,
      massiveCharCount: massiveTargetBytes,
      massiveBody,
    };
  }

  const massiveBodyFull = buildMassivePayloadString(massiveTargetBytes);

  return {
    routeKey,
    locale,
    extra: extra ?? null,
    renderedAt: new Date().toISOString(),
    massiveTargetBytes,
    massiveCharCount: massiveBodyFull.length,
    massiveBody: massiveBodyFull,
  };
}
