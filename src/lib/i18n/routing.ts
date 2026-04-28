import { defineRouting } from 'next-intl/routing';

/** Same shape as ecom-app-storefront (localePrefix always, no cookie detection). */
export const routing = defineRouting({
  locales: ['en', 'no', 'se', 'dk', 'fi', 'de', 'at'],
  defaultLocale: 'en',
  localePrefix: 'always',
  localeDetection: false,
});
