export default function SalesLoading() {
  return (
    <main className="flex-1 p-6 pb-20 md:pb-6 space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="h-8 w-32 rounded-md bg-muted animate-pulse" />
        <div className="h-9 w-24 rounded-md bg-muted animate-pulse" />
      </div>
      <div className="rounded-lg border bg-card p-6">
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-6 w-full rounded bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    </main>
  );
}
