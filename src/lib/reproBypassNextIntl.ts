/** When `1`, strip next-intl (single hardcoded English) to see if cache/Flight issues reproduce without i18n. */
export function bypassNextIntl(): boolean {
  return process.env.REPRO_BYPASS_NEXT_INTL === '1';
}
