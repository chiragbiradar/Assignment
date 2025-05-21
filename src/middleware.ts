import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// This middleware runs on every request
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Check if we're in development mode with no Supabase credentials
  const isDevelopment = process.env.NODE_ENV === 'development';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const hasValidCredentials = supabaseUrl.startsWith('http') && supabaseAnonKey.length > 0;

  // Skip authentication checks in development mode if credentials are not set
  if (isDevelopment && !hasValidCredentials) {
    console.warn("Middleware: Using mock authentication in development mode");

    // Check if the user is trying to access a protected route
    const { pathname } = req.nextUrl;
    const publicRoutes = ['/login', '/signup'];
    const isPublicRoute = publicRoutes.includes(pathname);

    // Check for a mock session in cookies
    const mockSessionCookie = req.cookies.get('mockSession')?.value;
    const hasMockSession = !!mockSessionCookie;

    // If the user has a mock session and is trying to access a public route, redirect to home
    if (hasMockSession && isPublicRoute) {
      const redirectUrl = new URL('/', req.url);
      return NextResponse.redirect(redirectUrl);
    }

    // If the user doesn't have a mock session and is trying to access a protected route, redirect to login
    if (!hasMockSession && !isPublicRoute) {
      const redirectUrl = new URL('/login', req.url);
      return NextResponse.redirect(redirectUrl);
    }

    return res;
  }

  // Create a Supabase client configured to use cookies
  let supabase;
  try {
    // Only create the client if we have valid credentials
    if (hasValidCredentials) {
      supabase = createServerClient(
        supabaseUrl,
        supabaseAnonKey,
        {
          cookies: {
            get: (name) => req.cookies.get(name)?.value,
            set: (name, value, options) => {
              res.cookies.set({ name, value, ...options });
            },
            remove: (name, options) => {
              res.cookies.set({ name, value: '', ...options });
            },
          },
        }
      );
    } else {
      console.error("Middleware: Invalid Supabase credentials");
      return res;
    }
  } catch (error) {
    console.error("Error creating Supabase client in middleware:", error);
    // Return the response without authentication checks for development
    return res;
  }

  // Refresh session if expired and get the current session
  let session;
  try {
    await supabase.auth.getSession();
    const { data } = await supabase.auth.getSession();
    session = data.session;
  } catch (error) {
    console.error("Error getting session in middleware:", error);
    // Return the response without authentication checks for development
    return res;
  }

  // Get the URL pathname
  const { pathname } = req.nextUrl;

  // Define public routes that don't require authentication
  const publicRoutes = ['/login', '/signup'];

  // Check if the route is public
  const isPublicRoute = publicRoutes.includes(pathname);

  // If the user is not signed in and the route is not public, redirect to login
  if (!session && !isPublicRoute) {
    const redirectUrl = new URL('/login', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  // If the user is signed in and trying to access a public route, redirect to home
  if (session && isPublicRoute) {
    const redirectUrl = new URL('/', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg).*)'],
};
