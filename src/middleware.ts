import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';

import { routing } from '@/lib/i18n/routing';
import {
  REPRO_REQUEST_START_HEADER,
  reproTimingEnabled,
} from '@/lib/reproTimingEnv';

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const startMs = Date.now();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REPRO_REQUEST_START_HEADER, String(startMs));

  if (reproTimingEnabled()) {
    const p = request.nextUrl.pathname;
    console.log(
      `[repro-timing] request ${request.method} ${p} startMs=${startMs} (edge)`,
    );
  }

  const modified = new NextRequest(request, { headers: requestHeaders });
  return intlMiddleware(modified);
}

export const config = {
  matcher: ['/', '/(en|no|se|dk|fi|de|at)/:path*'],
};
