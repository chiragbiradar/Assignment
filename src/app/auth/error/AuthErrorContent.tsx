'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AuthErrorContent() {
  const [countdown, setCountdown] = useState(5);
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error') || 'An authentication error occurred';

  useEffect(() => {
    // Redirect to login page after countdown
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      router.push('/login');
    }
  }, [countdown, router]);

  return (
    <>
      <div className="mb-6 rounded bg-red-100 p-4 text-sm text-red-900">
        {error}
      </div>
      
      <p className="text-center text-gray-600">
        You will be redirected to the login page in {countdown} seconds.
      </p>
      
      <div className="mt-6 text-center">
        <button
          onClick={() => router.push('/login')}
          className="rounded-md bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
        >
          Go to Login
        </button>
      </div>
    </>
  );
}
