import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  // Generate a unique request ID for debugging
  const requestId = Math.random().toString(36).substring(2, 8);

  // Log the incoming request with its ID
  console.log(`[${requestId}] Middleware processing: ${request.method} ${request.nextUrl.pathname} (${new Date().toISOString()})`);

  // Get the pathname
  const { pathname } = request.nextUrl;

  // Clean URL if it has cache buster parameters
  if (request.nextUrl.searchParams.has('_cb') || request.nextUrl.searchParams.has('_t')) {
    console.log(`[${requestId}] Detected query parameters, cleaning URL`);
    const cleanUrl = new URL(pathname, request.url);
    return NextResponse.redirect(cleanUrl);
  }

  // Just pass through the request
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
