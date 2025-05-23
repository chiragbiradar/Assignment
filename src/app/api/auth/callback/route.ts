import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Get the URL and create a URL object
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    try {
      const supabase = await createClient();

      // Exchange the code for a session
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        console.error('Error exchanging code for session:', error);
        return NextResponse.redirect(
          `${requestUrl.origin}/auth/error?error=${encodeURIComponent(error.message)}`
        );
      }

      // Redirect to the auth callback page for a better user experience
      return NextResponse.redirect(`${requestUrl.origin}/auth/callback?code=${code}`);
    } catch (error) {
      console.error('Unexpected error during auth callback:', error);
      return NextResponse.redirect(
        `${requestUrl.origin}/auth/error?error=${encodeURIComponent('An unexpected error occurred during authentication')}`
      );
    }
  }

  // If no code is present, redirect to login
  return NextResponse.redirect(`${requestUrl.origin}/login?error=${encodeURIComponent('Invalid authentication attempt')}`);
}
