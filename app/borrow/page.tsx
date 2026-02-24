import { EmptyState } from '@/components/empty-state'

export default function BorrowPage() {
    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-bold">Borrow an Item</h1>
            <div className="flex flex-col gap-4">
                <input
                    type="text"
                    placeholder="Search for items..."
                    className="p-3 border border-[var(--border)] rounded w-full bg-[var(--bg-base)] text-[var(--text-primary)]"
                />
                <p className="text-sm text-[var(--text-secondary)]">
                    Scan a QR code or search for an item to borrow.
                </p>
                <button className="bg-primary-500 text-white p-3 rounded font-semibold hover:bg-primary-600 transition-colors">
                    Scan QR Code
                </button>
            </div>
            <EmptyState
                message="No borrow records yet"
                ctaLabel="Lend Something"
                ctaHref="/dashboard"
            />
        </div>
    )
}
