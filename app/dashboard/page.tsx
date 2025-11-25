export default function DashboardPage() {
    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded shadow-sm">
                    <h2 className="font-semibold mb-2">Items I'm Borrowing</h2>
                    <p className="text-gray-500 text-sm">No active borrows.</p>
                </div>
                <div className="p-4 border rounded shadow-sm">
                    <h2 className="font-semibold mb-2">My Items Out</h2>
                    <p className="text-gray-500 text-sm">No items lent out.</p>
                </div>
            </div>
        </div>
    )
}
