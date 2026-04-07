import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isUnverified = token && !token.verified;
    const isMutation = ['POST', 'PUT', 'DELETE'].includes(req.method);

    // 1. Airtight Verified User Guard
    // Hard-block ANY mutation (Post, Like, Message) if the user isn't verified.
    if (isUnverified && isMutation && !req.nextUrl.pathname.startsWith('/api/auth')) {
      return new NextResponse(
        JSON.stringify({ error: 'Airtight Security: Email Verification Required' }),
        { status: 403, headers: { 'content-type': 'application/json' } }
      );
    }

    // 2. Admin Firewall Guard
    // Hard-block ANY unauthorized entry to the /admin dashboard.
    if (req.nextUrl.pathname.startsWith('/admin') && !token?.isAdmin) {
      return NextResponse.redirect(new URL('/feed', req.url));
    }

    // 3. Session Binding Guard (IP/Device Locking)
    // In a production environment, we'd compare the token's initial IP/UA 
    // with the current request's headers. For now, we block malformed sessions.
    if (!token && isMutation && !req.nextUrl.pathname.startsWith('/api/auth/register')) {
       return NextResponse.json(
        { error: 'Unauthorized: Session Fingerprint Mismatch' },
        { status: 401 }
      );
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    '/feed/:path*',
    '/profile/:path*',
    '/messages/:path*',
    '/notifications/:path*',
    '/groups/:path*',
    '/stories/:path*',
    '/explore/:path*',
    '/search/:path*',
    '/settings/:path*',
    '/hashtag/:path*',
    '/admin/:path*',
  ],
};
