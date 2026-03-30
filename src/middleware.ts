import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

const intlMiddleware = createMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is an admin route (but not login)
  const adminPathMatch = pathname.match(/^\/(en|zh|ja|ar)\/admin(\/.*)?$/);
  if (adminPathMatch) {
    const adminSubPath = adminPathMatch[2] || '';
    // Skip auth check for login page
    if (adminSubPath === '/login' || adminSubPath.startsWith('/login/')) {
      return intlMiddleware(request);
    }

    // Check for auth token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      const locale = adminPathMatch[1];
      const loginUrl = new URL(`/${locale}/admin/login`, request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/(en|zh|ja|ar)/:path*'],
};
