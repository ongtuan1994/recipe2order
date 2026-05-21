export default function PrepRecipesLoading() {
  return (
    <main className="flex-1 p-6 pb-20 md:pb-6 space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="h-8 w-40 rounded-md bg-muted animate-pulse" />
        <div className="h-9 w-24 rounded-md bg-muted animate-pulse" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-lg border bg-card animate-pulse" />
        ))}
      </div>
    </main>
  );
}
