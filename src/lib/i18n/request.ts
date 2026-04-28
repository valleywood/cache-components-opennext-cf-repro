import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { cache } from 'react';

import { loadMessages } from './loadMessages';
import { routing } from './routing';

/**
 * Same pattern as ecom-app-storefront: cache resolved locale per request when
 * `requestLocale` is undefined on later getRequestConfig calls (ISR / Workers edge cases).
 */
const getCachedLocale = cache(() => {
  let cachedLocale: string | undefined;
  return {
    set: (locale: string) => {
      cachedLocale = locale;
    },
    get: () => cachedLocale,
  };
});

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;

  let locale: string;

  if (hasLocale(routing.locales, requested)) {
    locale = requested;
    getCachedLocale().set(locale);
  } else {
    const cached = getCachedLocale().get();
    locale = cached ?? routing.defaultLocale;
  }

  return {
    locale,
    messages: await loadMessages(locale),
  };
});
