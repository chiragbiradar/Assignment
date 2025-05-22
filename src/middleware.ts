import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This middleware runs on every request
export async function middleware(req: NextRequest) {
  // Generate a unique request ID for debugging
  const requestId = Math.random().toString(36).substring(2, 8);

  // Log the incoming request with its ID
  console.log(`[${requestId}] Middleware processing: ${req.method} ${req.nextUrl.pathname} (${new Date().toISOString()})`);

  // Get the pathname
  const { pathname } = req.nextUrl;

  // Clean URL if it has cache buster parameters
  if (req.nextUrl.searchParams.has('_cb') || req.nextUrl.searchParams.has('_t')) {
    console.log(`[${requestId}] Detected query parameters, cleaning URL`);
    const cleanUrl = new URL(pathname, req.url);
    const response = NextResponse.redirect(cleanUrl);
    return response;
  }

  // For all cases, proceed normally without authentication checks
  console.log(`[${requestId}] Proceeding normally with request`);
  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.webp).*)'],
};
