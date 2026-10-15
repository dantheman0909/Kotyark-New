// Next.js 16 "proxy" (formerly middleware).
// 1. /admin: cheap cookie-presence gate only. Real authorization happens in every route via
//    requireUser() / getCurrentUser().
// 2. Public pages: stamp the request path into `x-kp-path` (always overwriting any client-sent value)
//    so the server shell can send only the pop-ups that apply to this page.
import { NextResponse } from 'next/server';

export function proxy(request) {
  const { pathname } = request.nextUrl;
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (!request.cookies.get('kotyark_session')?.value) {
      const url = request.nextUrl.clone();
      const next = pathname + request.nextUrl.search;
      url.pathname = '/login';
      url.search = '';
      url.searchParams.set('next', next);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }
  const headers = new Headers(request.headers);
  headers.set('x-kp-path', pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Pages only: skip Next internals, API, media/file streams and anything with a file extension.
  matcher: ['/admin', '/admin/:path*', '/((?!_next/|api/|media/|files/|.*\\..*).*)'],
};
