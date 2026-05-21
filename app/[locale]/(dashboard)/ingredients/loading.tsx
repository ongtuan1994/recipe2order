export default function IngredientsLoading() {
  return (
    <main className="flex-1 p-6 pb-20 md:pb-6 space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="h-8 w-40 rounded-md bg-muted animate-pulse" />
        <div className="flex gap-2">
          <div className="h-9 w-24 rounded-md bg-muted animate-pulse" />
          <div className="h-9 w-24 rounded-md bg-muted animate-pulse" />
        </div>
      </div>
      <div className="h-10 w-full sm:w-[260px] rounded-md bg-muted animate-pulse" />
      <div className="rounded-lg border bg-card divide-y">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-12 px-4 flex items-center">
            <div className="h-4 w-full max-w-md rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    </main>
  );
}
