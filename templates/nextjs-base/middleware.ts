import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get('session')?.value;
  const { pathname } = request.nextUrl;

  const publicPaths = ['/auth/login'];
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path));

  if (!sessionToken && !isPublicPath) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  if (sessionToken && pathname === '/auth/login') {
    return NextResponse.redirect(new URL('/inbox', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
