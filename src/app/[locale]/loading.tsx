export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
          <div className="absolute inset-0 rounded-full border-4 border-t-[var(--secondary)] animate-spin" />
        </div>
        <p className="text-sm text-gray-500 animate-pulse">Loading…</p>
      </div>
    </div>
  );
}
