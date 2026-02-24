export default function ContactsLoading() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse">
      {/* Page title + add button row */}
      <div className="flex items-center justify-between">
        <div className="h-9 w-40 bg-[var(--bg-elevated)] rounded" />
        <div className="h-10 w-32 bg-[var(--bg-elevated)] rounded-lg" />
      </div>

      {/* Contact row placeholders */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-[var(--bg-elevated)] rounded-lg" />
        ))}
      </div>
    </div>
  )
}
