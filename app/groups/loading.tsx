export default function GroupsLoading() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse">
      {/* Page title + create button row */}
      <div className="flex items-center justify-between">
        <div className="h-9 w-36 bg-[var(--bg-elevated)] rounded" />
        <div className="h-10 w-32 bg-[var(--bg-elevated)] rounded-lg" />
      </div>

      {/* Group card placeholders */}
      <div className="flex flex-col gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-[var(--bg-elevated)] rounded-lg" />
        ))}
      </div>
    </div>
  )
}
