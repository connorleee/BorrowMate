export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-8 w-full animate-pulse">
      {/* Page title */}
      <div className="h-9 w-48 bg-[var(--bg-elevated)] rounded" />

      {/* Section 1 */}
      <div className="flex flex-col gap-4">
        <div className="h-7 w-32 bg-[var(--bg-elevated)] rounded" />
        <div className="h-20 bg-[var(--bg-elevated)] rounded-lg" />
        <div className="h-20 bg-[var(--bg-elevated)] rounded-lg" />
      </div>

      {/* Section 2 */}
      <div className="flex flex-col gap-4">
        <div className="h-7 w-32 bg-[var(--bg-elevated)] rounded" />
        <div className="h-20 bg-[var(--bg-elevated)] rounded-lg" />
        <div className="h-20 bg-[var(--bg-elevated)] rounded-lg" />
        <div className="h-20 bg-[var(--bg-elevated)] rounded-lg" />
      </div>

      {/* Section 3 */}
      <div className="flex flex-col gap-4">
        <div className="h-7 w-32 bg-[var(--bg-elevated)] rounded" />
        <div className="h-20 bg-[var(--bg-elevated)] rounded-lg" />
        <div className="h-20 bg-[var(--bg-elevated)] rounded-lg" />
      </div>
    </div>
  )
}
