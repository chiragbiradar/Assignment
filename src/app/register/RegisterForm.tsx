'use client';

import { useSearchParams } from 'next/navigation';

interface RegisterFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  fullName: string;
  setFullName: (fullName: string) => void;
  handleRegister: (e: React.FormEvent) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export default function RegisterForm({
  email,
  setEmail,
  password,
  setPassword,
  fullName,
  setFullName,
  handleRegister,
  loading,
  error
}: RegisterFormProps) {
  // useSearchParams is now safely inside a component that will be wrapped in Suspense
  const searchParams = useSearchParams();
  const message = searchParams.get('message');

  return (
    <>
      {message && (
        <div className="mb-4 rounded bg-yellow-100 p-3 text-sm text-yellow-900">
          {message}
        </div>
      )}
      
      {error && (
        <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-900">
          {error}
        </div>
      )}
      
      <form onSubmit={handleRegister}>
        <div className="mb-4">
          <label htmlFor="fullName" className="mb-2 block text-sm font-medium text-gray-700">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 p-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            placeholder="John Doe"
          />
        </div>
        
        <div className="mb-4">
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 p-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            placeholder="you@example.com"
          />
        </div>
        
        <div className="mb-6">
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 p-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            placeholder="••••••••"
            minLength={6}
          />
          <p className="mt-1 text-xs text-gray-500">Password must be at least 6 characters</p>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-green-600 py-2 text-white transition-colors hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-green-400"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
    </>
  );
}
