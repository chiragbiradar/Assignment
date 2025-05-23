'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/utils/supabase/client';
import RegisterForm from './RegisterForm';

// Create a client component that uses useSearchParams
function RegisterContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email || !password || !fullName) {
      setError('All fields are required');
      setLoading(false);
      return;
    }

    try {
      // Sign up with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/callback`,
        },
      });

      console.log('Sign up response:', { data, error });

      if (error) {
        throw error;
      }

      // No need to manually insert user data into the users table
      // The database trigger 'on_auth_user_created' will automatically create a user record
      // when a new auth user is created with the metadata we provided
      if (data.user) {
        console.log('User created successfully with ID:', data.user.id);
      }

      // Redirect to login page with success message and email
      router.push(`/login?message=Check your email to confirm your sign up&email=${encodeURIComponent(email)}`);
    } catch (error: any) {
      console.error('Registration error:', error);

      // Provide more detailed error messages based on the error type
      if (error.message?.includes('email')) {
        setError('Invalid email address or email already in use');
      } else if (error.message?.includes('password')) {
        setError('Password is too weak. Use at least 6 characters with a mix of letters and numbers');
      } else {
        setError(error.message || 'An error occurred during registration');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <RegisterForm
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      fullName={fullName}
      setFullName={setFullName}
      handleRegister={handleRegister}
      loading={loading}
      error={error}
    />
  );
}

// Main page component with Suspense boundary
export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-800">Create an Account</h1>

        {/* Wrap the component that uses useSearchParams in Suspense */}
        <Suspense fallback={<div>Loading...</div>}>
          <RegisterContent />
        </Suspense>

        <div className="mt-4 text-center text-sm text-gray-600">
          <p>Already have an account? <a href="/login" className="text-green-600 hover:underline">Login</a></p>
        </div>
      </div>
    </div>
  );
}
