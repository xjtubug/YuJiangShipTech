import Link from 'next/link';
import { Anchor } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-50 to-white px-4">
      <div className="text-center max-w-lg">
        <div className="flex justify-center mb-6">
          <Anchor className="w-16 h-16 text-[var(--secondary)] opacity-50" />
        </div>
        <h1 className="text-8xl font-extrabold text-[var(--primary)] tracking-tight">
          404
        </h1>
        <p className="mt-4 text-2xl font-semibold text-[var(--foreground)]">
          Page Not Found
        </p>
        <p className="mt-2 text-gray-500">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-6 py-3 text-white font-medium transition hover:bg-[var(--primary)]/90"
        >
          ← Back to Home
        </Link>
      </div>
    </div>
  );
}
