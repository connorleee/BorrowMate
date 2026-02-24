export default function ItemsLoading() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse">
      {/* Page title + action button row */}
      <div className="flex items-center justify-between">
        <div className="h-9 w-40 bg-[var(--bg-elevated)] rounded" />
        <div className="h-10 w-28 bg-[var(--bg-elevated)] rounded-lg" />
      </div>

      {/* Item card grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 bg-[var(--bg-elevated)] rounded-lg" />
        ))}
      </div>
    </div>
  )
}
