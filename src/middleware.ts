import { type NextRequest, NextResponse } from 'next/server';

export default function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const p = url.pathname;

  const m = p.match(/^\/(en|no|se|dk|fi|de|at)(?=\/|$)/);
  if (m) {
    const nextPath = p.replace(/^\/(en|no|se|dk|fi|de|at)(?=\/|$)/, '') || '/';
    url.pathname = nextPath;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/(en|no|se|dk|fi|de|at)', '/(en|no|se|dk|fi|de|at)/:path*'],
};
