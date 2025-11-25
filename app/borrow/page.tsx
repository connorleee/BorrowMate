export default function BorrowPage() {
    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-bold">Borrow an Item</h1>
            <div className="flex flex-col gap-4">
                <input
                    type="text"
                    placeholder="Search for items..."
                    className="p-3 border rounded w-full"
                />
                <p className="text-sm text-gray-500">
                    Scan a QR code or search for an item to borrow.
                </p>
                <button className="bg-foreground text-background p-3 rounded font-semibold">
                    Scan QR Code
                </button>
            </div>
        </div>
    )
}
