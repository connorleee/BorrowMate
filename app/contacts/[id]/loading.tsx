export default function ContactDetailLoading() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse">
      {/* Contact name */}
      <div className="h-10 w-48 bg-[var(--bg-elevated)] rounded" />

      {/* Info section */}
      <div className="h-20 bg-[var(--bg-elevated)] rounded-lg" />

      {/* Borrow history rows */}
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 bg-[var(--bg-elevated)] rounded-lg" />
        ))}
      </div>
    </div>
  )
}
