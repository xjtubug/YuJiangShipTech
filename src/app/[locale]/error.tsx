'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-white px-4">
      <div className="text-center max-w-lg">
        <div className="flex justify-center mb-6">
          <AlertTriangle className="w-16 h-16 text-red-400" />
        </div>
        <h1 className="text-4xl font-bold text-[var(--primary)]">
          Something Went Wrong
        </h1>
        <p className="mt-4 text-gray-500">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-6 py-3 text-white font-medium transition hover:bg-[var(--primary)]/90"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
