export default function AboutLoading() {
  return (
    <>
      {/* Hero banner skeleton */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 py-20 md:py-28">
        <div className="container-wide">
          <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
          <div className="h-12 w-80 bg-white/10 rounded animate-pulse mt-4" />
          <div className="h-6 w-[32rem] max-w-full bg-white/10 rounded animate-pulse mt-4" />
        </div>
      </section>

      {/* Content skeleton */}
      <div className="section-padding bg-white">
        <div className="container-wide">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <div className="h-6 w-48 bg-slate-200 rounded animate-pulse" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-4 bg-slate-100 rounded animate-pulse" />
                ))}
              </div>
            </div>
            <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    </>
  );
}
