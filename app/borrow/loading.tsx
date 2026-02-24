export default function BorrowLoading() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse">
      {/* Page title */}
      <div className="h-9 w-40 bg-[var(--bg-elevated)] rounded" />

      {/* Borrow record row placeholders */}
      <div className="flex flex-col gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-[var(--bg-elevated)] rounded-lg" />
        ))}
      </div>
    </div>
  )
}
