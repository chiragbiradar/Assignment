'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import LoginForm from './LoginForm';

// Create a client component that uses useSearchParams
function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      router.push('/');
    } catch (error: any) {
      setError(error.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginForm 
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      handleLogin={handleLogin}
      loading={loading}
      error={error}
    />
  );
}

// Main page component with Suspense boundary
export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-800">Periskope Clone</h1>
        
        {/* Wrap the component that uses useSearchParams in Suspense */}
        <Suspense fallback={<div>Loading...</div>}>
          <LoginContent />
        </Suspense>
        
        <div className="mt-4 text-center text-sm text-gray-600">
          <p>Don't have an account? <a href="/register" className="text-green-600 hover:underline">Register</a></p>
        </div>
      </div>
    </div>
  );
}

