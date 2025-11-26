import { getItemDetails } from '../actions'
import Link from 'next/link'

export default async function ItemDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const item = await getItemDetails(id)

    if (!item) {
        return <div>Item not found</div>
    }

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="mb-6">
                <Link href={`/groups/${item.group_id}`} className="text-sm text-gray-500 hover:underline">
                    &larr; Back to {item.groups?.name}
                </Link>
            </div>

            <div className="bg-white border rounded-lg p-8 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                    <h1 className="text-3xl font-bold">{item.name}</h1>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${item.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        {item.status}
                    </span>
                </div>

                <div className="space-y-6">
                    {item.description && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Description</h3>
                            <p className="text-gray-800">{item.description}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Category</h3>
                            <p>{item.category || 'Uncategorized'}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Owner</h3>
                            <p>{item.users?.name || 'Unknown'}</p>
                        </div>
                    </div>

                    <div className="pt-6 border-t">
                        {item.status === 'available' ? (
                            <Link
                                href={`/items/${item.id}/borrow`}
                                className="block w-full text-center bg-foreground text-background py-3 rounded-lg font-medium hover:opacity-90"
                            >
                                Borrow This Item
                            </Link>
                        ) : (
                            <div className="text-center p-3 bg-gray-100 rounded-lg text-gray-500">
                                Currently Unavailable
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
