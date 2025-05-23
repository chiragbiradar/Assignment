import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // Create an unmodified response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // For protected routes, redirect to login if not authenticated
  if (request.nextUrl.pathname.startsWith('/chat') || request.nextUrl.pathname === '/') {
    // Check for authentication cookie
    const authCookie = request.cookies.get('sb-auth-token')

    if (!authCookie) {
      // If no auth cookie, redirect to login
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return response
}

