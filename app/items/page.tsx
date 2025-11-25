export default function ItemsPage() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Household Items</h1>
                <button className="bg-foreground text-background px-4 py-2 rounded text-sm">
                    Add Item
                </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Placeholders */}
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="aspect-square border rounded flex items-center justify-center bg-gray-50">
                        <span className="text-gray-400">Item {i}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}
