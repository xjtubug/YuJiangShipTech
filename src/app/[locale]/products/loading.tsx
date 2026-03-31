export default function ProductsLoading() {
  return (
    <>
      {/* Page header skeleton */}
      <div className="bg-gradient-to-b from-primary-50 to-white">
        <div className="container-wide">
          <div className="py-4">
            <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="pb-8">
            <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
            <div className="h-4 w-96 bg-slate-100 rounded animate-pulse mt-3" />
          </div>
        </div>
      </div>

      <div className="container-wide py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar skeleton */}
          <aside className="lg:w-72 flex-shrink-0">
            <div className="space-y-4">
              <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-8 bg-slate-100 rounded animate-pulse" />
                ))}
              </div>
            </div>
          </aside>

          {/* Product grid skeleton */}
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                  <div className="h-48 bg-slate-100 animate-pulse" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 w-20 bg-slate-100 rounded animate-pulse" />
                    <div className="h-5 w-full bg-slate-100 rounded animate-pulse" />
                    <div className="h-6 w-24 bg-slate-100 rounded animate-pulse" />
                    <div className="flex gap-2 pt-2">
                      <div className="h-9 flex-1 bg-slate-100 rounded-lg animate-pulse" />
                      <div className="h-9 flex-1 bg-slate-100 rounded-lg animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
