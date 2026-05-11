import { type NextRequest, NextResponse } from 'next/server';

export default function middleware(request: NextRequest) {
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

export const config = {
  matcher: ['/', '/(en|no|se|dk|fi|de|at)/:path*'],
};
