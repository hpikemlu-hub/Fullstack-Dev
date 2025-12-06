import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Check authentication - simplified for Edge Runtime compatibility
  let isAuthenticated = false;
  
  // Check for JWT access token in cookies (basic validation)
  const accessToken = req.cookies.get('accessToken')?.value;
  const userCookie = req.cookies.get('user')?.value;
  
  // Basic token presence check (Edge Runtime compatible)
  console.log('🔍 Middleware Debug:', { 
    hasAccessToken: !!accessToken, 
    tokenStart: accessToken?.slice(0, 10),
    hasUserCookie: !!userCookie,
    path: req.nextUrl.pathname
  });
  
  if (accessToken && accessToken.startsWith('eyJ')) {
    // JWT tokens start with 'eyJ', basic format check
    try {
      // Split JWT and check structure
      const parts = accessToken.split('.');
      if (parts.length === 3) {
        // Basic JWT structure validation
        isAuthenticated = true;
        console.log('✅ JWT token valid structure');
      }
    } catch (error) {
      console.log('❌ JWT parsing error:', error);
      isAuthenticated = false;
    }
  }

  // Also check for user cookie session as fallback
  if (!isAuthenticated && userCookie) {
    try {
      const decoded = decodeURIComponent(userCookie);
      const userData = JSON.parse(decoded);
      isAuthenticated = !!(userData.id && userData.email);
    } catch {
      isAuthenticated = false;
    }
  }

  // Define protected routes
  const protectedRoutes = ['/dashboard', '/workload', '/employees', '/calendar', '/reports', '/e-kinerja', '/history'];
  const authRoutes = ['/auth/login', '/auth/signup'];

  const isProtectedRoute = protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route));
  const isAuthRoute = authRoutes.some(route => req.nextUrl.pathname.startsWith(route));

  // Redirect logic
  if (isProtectedRoute && !isAuthenticated) {
    // Redirect to login if accessing protected route without session
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/auth/login';
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthRoute && isAuthenticated) {
    // Redirect to dashboard if already logged in and accessing auth pages
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect root to dashboard if logged in, otherwise to login
  if (req.nextUrl.pathname === '/') {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = isAuthenticated ? '/dashboard' : '/auth/login';
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: [
    // Exclude API routes and static assets from middleware
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};