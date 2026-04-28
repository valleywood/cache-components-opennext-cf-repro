/** Locales that share messages with another locale (storefront uses at → de). */
const MESSAGE_LOCALE_MAP: Partial<Record<string, string>> = {
  at: 'de',
};

export async function loadMessages(locale: string) {
  const messageLocale = MESSAGE_LOCALE_MAP[locale] ?? locale;
  return (await import(`../../../messages/${messageLocale}.json`)).default;
}
