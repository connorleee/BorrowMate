export default function GroupDetailLoading() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse">
      {/* Group header */}
      <div className="h-12 w-64 bg-[var(--bg-elevated)] rounded" />
      {/* Description */}
      <div className="h-4 w-96 max-w-full bg-[var(--bg-elevated)] rounded" />

      {/* Item grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-[var(--bg-elevated)] rounded-lg" />
        ))}
      </div>
    </div>
  )
}
