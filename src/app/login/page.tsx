'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// Add a utility function to check if we're on the client side
const isClient = typeof window !== 'undefined';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn, user } = useAuth();
  const router = useRouter();

  // Redirect to home if already logged in
  useEffect(() => {
    if (isClient && user) {
      console.log("User already logged in, redirecting to home");
      router.push('/');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    console.log("Attempting login with email:", email);

    try {
      // Check if we're in development mode with no Supabase credentials
      const isDevelopment = process.env.NODE_ENV === 'development';
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      const hasValidCredentials = supabaseUrl.startsWith('http') && supabaseAnonKey.length > 0;

      if (isDevelopment && !hasValidCredentials) {
        console.warn("Using mock authentication in development mode");
        console.log("For development, you can use any email/password combination");
      }

      // Attempt to sign in
      const { error } = await signIn(email, password);

      if (error) {
        console.error("Login error:", error);
        setError(error.message || 'Authentication failed');
      } else {
        // If no error, we should be redirected by the AuthContext
        console.log("Login successful, forcing redirection...");

        // Force immediate navigation to home page
        window.location.href = '/';

        // If that doesn't work, try other methods after a short delay
        setTimeout(() => {
          if (window.location.pathname.includes('login')) {
            console.log("First redirection attempt failed, trying again...");
            try {
              router.push('/');
              router.refresh();
            } catch (routerError) {
              console.error("Router navigation failed:", routerError);
              window.location.replace('/');
            }
          }
        }, 500);
      }
    } catch (err: any) {
      console.error("Unexpected login error:", err);

      // Provide a more helpful error message in development mode
      if (process.env.NODE_ENV === 'development') {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

        if (!supabaseUrl.startsWith('http') || !supabaseAnonKey) {
          setError('Development mode: Supabase credentials not configured properly. Using mock authentication.');
        } else {
          setError(err.message || 'An unexpected error occurred during login');
        }
      } else {
        setError(err.message || 'An unexpected error occurred during login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <div className="w-16 h-16 relative">
              <Image
                src="/whatsapp-logo.png"
                alt="WhatsApp Logo"
                fill
                className="object-contain"
              />
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to WhatsApp
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/signup" className="font-medium text-green-600 hover:text-green-500">
              create a new account
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-green-400"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
