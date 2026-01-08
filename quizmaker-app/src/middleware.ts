import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt-edge';

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth (auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon (favicon file)
     * - public files
     */
    '/((?!api/auth|_next/static|_next/image|favicon|.*\\.svg|.*\\.png|.*\\.jpg).*)',
  ],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip authentication for auth and health API routes
  if (pathname.startsWith('/api/auth') || pathname === '/api/health') {
    console.log('Allowing public API route:', pathname);
    return NextResponse.next();
  }

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/signup'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // API routes (except auth) require authentication
  const isApiRoute = pathname.startsWith('/api/');

  // Get token from cookie
  const token = request.cookies.get('auth_token')?.value;

  // If it's a public route and user has token, allow
  if (isPublicRoute && !token) {
    return NextResponse.next();
  }

  // If user is authenticated and tries to access login/signup, redirect to dashboard
  if (isPublicRoute && token && (pathname === '/login' || pathname === '/signup')) {
    try {
      const decoded = await verifyToken(token);
      const redirectUrl = decoded.role === 'instructor' ? '/instructor/dashboard' : '/student/quiz';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    } catch {
      // Invalid token, allow access to login/signup
      return NextResponse.next();
    }
  }

  // If no token and trying to access protected route, redirect to login
  if (!token && !isPublicRoute) {
    if (isApiRoute) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Verify token
  if (token) {
    try {
      const decoded = await verifyToken(token);

      // Add user info to request headers for use in API routes
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', decoded.userId);
      requestHeaders.set('x-user-role', decoded.role);

      // Role-based route protection
      if (pathname.startsWith('/instructor') && decoded.role !== 'instructor') {
        return NextResponse.redirect(new URL('/student/quiz', request.url));
      }

      if (pathname.startsWith('/student') && decoded.role !== 'student') {
        return NextResponse.redirect(new URL('/instructor/dashboard', request.url));
      }

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    } catch (error) {
      // Invalid token
      const response = isApiRoute
        ? NextResponse.json(
            { success: false, message: 'Invalid or expired token' },
            { status: 401 }
          )
        : NextResponse.redirect(new URL('/login', request.url));

      // Clear invalid token
      response.cookies.delete('auth_token');
      return response;
    }
  }

  return NextResponse.next();
}

