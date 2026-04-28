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
  const massiveBody = buildMassivePayloadString(massiveTargetBytes);

  return {
    routeKey,
    locale,
    extra: extra ?? null,
    renderedAt: new Date().toISOString(),
    massiveTargetBytes,
    massiveCharCount: massiveBody.length,
    massiveBody,
  };
}
