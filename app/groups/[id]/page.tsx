import { getGroupDetails } from '../actions'
import { getGroupItems } from '@/app/items/actions'
import Link from 'next/link'

export default async function GroupDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const group = await getGroupDetails(id)
    const items = await getGroupItems(id)

    if (!group) {
        return <div>Group not found</div>
    }

    return (
        <div className="flex flex-col gap-8 w-full">
            <div className="flex flex-col gap-2 border-b pb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold">{group.name}</h1>
                        {group.description && <p className="text-gray-600 mt-2">{group.description}</p>}
                    </div>
                    <Link
                        href={`/groups/${id}/items/new`}
                        className="bg-foreground text-background px-4 py-2 rounded-lg font-medium"
                    >
                        Add Item
                    </Link>
                </div>
            </div>

            <div>
                <h2 className="text-2xl font-bold mb-4">Inventory</h2>
                {items.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <p className="text-gray-500">No items in this group yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map((item: any) => (
                            <div key={item.id} className="p-4 border rounded-lg bg-white">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold">{item.name}</h3>
                                    <span className={`text-xs px-2 py-1 rounded-full ${item.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                        {item.status}
                                    </span>
                                </div>
                                {item.description && <p className="text-sm text-gray-600 mb-2">{item.description}</p>}
                                <div className="text-xs text-gray-400 mt-4 flex justify-between">
                                    <span>Owner: {item.users?.name || 'Unknown'}</span>
                                    <span>{item.visibility}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
