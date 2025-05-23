'use client';

import { Suspense } from 'react';
import AuthErrorContent from './AuthErrorContent';

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold text-gray-800">Authentication Error</h1>

        <Suspense fallback={<div className="text-center py-4">Loading error details...</div>}>
          <AuthErrorContent />
        </Suspense>
      </div>
    </div>
  );
}
