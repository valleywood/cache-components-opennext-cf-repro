/** Forwarded on the request so RSC can log ms from first middleware execution. */
export const REPRO_REQUEST_START_HEADER = 'x-repro-request-start-ms';

export function reproTimingEnabled(): boolean {
  const v = process.env.REPRO_TIMING;
  return v === '1' || v === 'true';
}
