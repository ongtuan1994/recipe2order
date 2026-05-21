export default function StockLoading() {
  return (
    <main className="flex-1 p-6 pb-20 md:pb-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="h-8 w-32 rounded-md bg-muted animate-pulse" />
        <div className="h-9 w-28 rounded-md bg-muted animate-pulse" />
      </div>
      <div className="h-10 w-full sm:w-[260px] rounded-md bg-muted animate-pulse" />
      <div className="rounded-lg border bg-card divide-y">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-12 px-4 flex items-center gap-3">
            <div className="h-4 w-4 rounded bg-muted animate-pulse" />
            <div className="h-4 w-40 rounded bg-muted animate-pulse" />
            <div className="ml-auto h-4 w-20 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    </main>
  );
}
