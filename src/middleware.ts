import { type NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';

import { routing } from '@/lib/i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  if (process.env.REPRO_BYPASS_NEXT_INTL === '1') {
    const url = request.nextUrl.clone();
    const p = url.pathname;
    if (p === '/') {
      url.pathname = '/en';
      return NextResponse.redirect(url);
    }
    const m = p.match(/^\/(en|no|se|dk|fi|de|at)(?=\/|$)/);
    if (m && m[1] !== 'en') {
      url.pathname = p.replace(/^\/(en|no|se|dk|fi|de|at)/, '/en');
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/(en|no|se|dk|fi|de|at)/:path*'],
};
