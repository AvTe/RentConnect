import { NextResponse } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';

/**
 * Middleware for:
 * - Supabase session refresh (critical for maintaining login state)
 * - Security headers
 * - Cache control
 */
export async function middleware(request) {
  // CRITICAL: Refresh Supabase session to maintain login state
  // This must happen on every request to keep the session alive
  let response;
  try {
    response = await updateSession(request);
  } catch (error) {
    // If session refresh fails, continue with a normal response
    console.error('Session refresh error:', error);
    response = NextResponse.next({ request });
  }

  // Content Security Policy - allows necessary scripts and resources
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://accounts.google.com https://www.google.com https://maps.googleapis.com https://www.gstatic.com https://apis.google.com https://*.withpersona.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.withpersona.com;
    img-src 'self' blob: data: https: http:;
    font-src 'self' data: https://fonts.gstatic.com https://*.withpersona.com;
    connect-src 'self' https://yydwhwkvrvgkqnmirbrr.supabase.co wss://yydwhwkvrvgkqnmirbrr.supabase.co https://accounts.google.com https://www.googleapis.com https://apis.google.com https://*.withpersona.com wss://*.withpersona.com;
    frame-src 'self' https://accounts.google.com https://www.google.com https://*.withpersona.com https://inquiry.withpersona.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  // Add security headers
  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Allow camera and microphone for Persona identity verification
  response.headers.set('Permissions-Policy', 'camera=(self "https://inquiry.withpersona.com"), microphone=(self "https://inquiry.withpersona.com"), geolocation=()');

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
