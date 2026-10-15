// Next.js 16 "proxy" (formerly middleware). Cheap cookie-presence gate only:
// real authorization happens in every route via requireUser() / getCurrentUser().
import { NextResponse } from 'next/server';

export function proxy(request) {
  if (!request.cookies.get('kotyark_session')?.value) {
    const url = request.nextUrl.clone();
    const next = request.nextUrl.pathname + request.nextUrl.search;
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('next', next);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
