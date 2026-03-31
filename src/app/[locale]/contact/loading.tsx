export default function ContactLoading() {
  return (
    <>
      {/* Hero banner skeleton */}
      <section className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-secondary-900 py-20 md:py-28">
        <div className="container-wide">
          <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
          <div className="h-12 w-72 bg-white/10 rounded animate-pulse mt-4" />
          <div className="h-6 w-96 max-w-full bg-white/10 rounded animate-pulse mt-4" />
        </div>
      </section>

      {/* Form skeleton */}
      <section className="section-padding bg-white">
        <div className="container-wide">
          <div className="grid lg:grid-cols-5 gap-12">
            <div className="lg:col-span-3 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="h-12 bg-slate-100 rounded-lg animate-pulse" />
                <div className="h-12 bg-slate-100 rounded-lg animate-pulse" />
              </div>
              <div className="h-12 bg-slate-100 rounded-lg animate-pulse" />
              <div className="h-12 bg-slate-100 rounded-lg animate-pulse" />
              <div className="h-32 bg-slate-100 rounded-lg animate-pulse" />
              <div className="h-12 w-40 bg-slate-100 rounded-lg animate-pulse" />
            </div>
            <div className="lg:col-span-2 space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
