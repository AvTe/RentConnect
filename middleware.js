import { NextResponse } from 'next/server';

/**
 * Middleware for performance optimizations
 * - Add security headers
 * - Handle redirects
 * - Optimize caching
 */
export function middleware(request) {
  const response = NextResponse.next();

  // Add security and performance headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Cache control for static assets
  if (request.nextUrl.pathname.match(/^\/static\/.*/)) {
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }

  // No cache for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  }

  return response;
}

// Configure which routes middleware applies to
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
