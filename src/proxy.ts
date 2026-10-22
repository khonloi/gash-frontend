import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js 16 Proxy convention for route-level middleware and security.
 * Enforces session checks for protected routes such as /orders.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect customer order history routes
  if (pathname.startsWith('/orders')) {
    const hasSession = request.cookies.has('jocksport_session');
    const isDemo =
      process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || request.cookies.has('jocksport_demo_mode');

    if (!hasSession && !isDemo) {
      const redirectUrl = new URL('/', request.url);
      redirectUrl.searchParams.set('auth_required', 'true');
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/orders/:path*'],
};
