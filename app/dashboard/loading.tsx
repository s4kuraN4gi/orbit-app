export default function DashboardLoading() {
  return (
    <main className="container mx-auto py-6">
      <div className="flex flex-col h-full space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="h-9 w-48 bg-muted animate-pulse rounded-md" />
          <div className="hidden lg:flex items-center gap-2">
            <div className="h-8 w-24 bg-muted animate-pulse rounded-md" />
            <div className="h-8 w-20 bg-muted animate-pulse rounded-md" />
            <div className="h-8 w-8 bg-muted animate-pulse rounded-md" />
            <div className="h-8 w-28 bg-muted animate-pulse rounded-md" />
            <div className="h-8 w-20 bg-muted animate-pulse rounded-md" />
          </div>
          <div className="flex lg:hidden items-center gap-2">
            <div className="h-8 w-20 bg-muted animate-pulse rounded-md" />
            <div className="h-8 w-8 bg-muted animate-pulse rounded-md" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 pb-4">
          <div className="h-9 w-28 bg-muted animate-pulse rounded-md" />
          <div className="h-9 w-24 bg-muted animate-pulse rounded-md" />
          <div className="h-9 w-28 bg-muted animate-pulse rounded-md" />
        </div>

        {/* Main content area */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    </main>
  );
}
