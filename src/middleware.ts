import createMiddleware from 'next-intl/middleware';

import { routing } from '@/lib/i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default intlMiddleware;

export const config = {
  matcher: ['/', '/(en|no|se|dk|fi|de|at)/:path*'],
};
