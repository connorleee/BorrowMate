export default function ItemDetailLoading() {
  return (
    <div className="flex flex-col gap-6 w-full animate-pulse">
      {/* Item title */}
      <div className="h-10 w-64 bg-[var(--bg-elevated)] rounded" />

      {/* Detail section */}
      <div className="h-32 bg-[var(--bg-elevated)] rounded-lg" />

      {/* Borrow info */}
      <div className="h-20 bg-[var(--bg-elevated)] rounded-lg" />
    </div>
  )
}
