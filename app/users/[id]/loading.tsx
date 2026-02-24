export default function UserProfileLoading() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse">
      {/* Profile header */}
      <div className="h-12 w-48 bg-[var(--bg-elevated)] rounded" />

      {/* Stats section */}
      <div className="h-24 bg-[var(--bg-elevated)] rounded-lg" />

      {/* Items grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-[var(--bg-elevated)] rounded-lg" />
        ))}
      </div>
    </div>
  )
}
