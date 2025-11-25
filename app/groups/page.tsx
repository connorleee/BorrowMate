export default function GroupsPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">My Households</h1>
                <button className="bg-foreground text-background px-4 py-2 rounded text-sm">
                    Create New
                </button>
            </div>
            <div className="grid gap-4">
                <div className="p-4 border rounded shadow-sm">
                    <h3 className="font-semibold">Roommates 2025</h3>
                    <p className="text-sm text-gray-500">4 members</p>
                </div>
                <div className="p-4 border rounded shadow-sm">
                    <h3 className="font-semibold">Family Home</h3>
                    <p className="text-sm text-gray-500">3 members</p>
                </div>
            </div>
        </div>
    )
}
