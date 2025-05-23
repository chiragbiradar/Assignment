'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';

export default function AuthCallbackContent() {
  const [message, setMessage] = useState<string>('Processing your authentication...');
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(3);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the auth code from the URL
        const code = searchParams.get('code');
        
        if (!code) {
          setError('No authentication code found in the URL');
          return;
        }

        // Exchange the code for a session
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          setError(`Authentication error: ${error.message}`);
          return;
        }

        setMessage('Authentication successful! Redirecting to home page...');
        
        // Start countdown for redirection
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              router.push('/');
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        return () => clearInterval(timer);
      } catch (err) {
        setError(`Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
      }
    };

    handleCallback();
  }, [router, searchParams]);

  // If there's an error, redirect to login after countdown
  useEffect(() => {
    if (error && countdown === 0) {
      router.push('/login?error=' + encodeURIComponent(error));
    }
  }, [error, countdown, router]);

  return (
    <>
      {error ? (
        <div className="mb-6 rounded bg-red-100 p-4 text-sm text-red-900">
          {error}
          <p className="mt-2">
            Redirecting to login in {countdown} seconds...
          </p>
        </div>
      ) : (
        <div className="mb-6 rounded bg-green-100 p-4 text-sm text-green-900">
          {message}
          {countdown > 0 && (
            <p className="mt-2">
              Redirecting in {countdown} seconds...
            </p>
          )}
        </div>
      )}
      
      <div className="mt-6 text-center">
        <button
          onClick={() => router.push(error ? '/login' : '/')}
          className="rounded-md bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
        >
          {error ? 'Go to Login' : 'Go to Home'}
        </button>
      </div>
    </>
  );
}
