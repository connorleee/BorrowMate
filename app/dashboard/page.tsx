import { getActiveBorrows, returnItem } from '@/app/borrow/actions'
import { getUserItems } from '@/app/items/actions'
import Link from 'next/link'

export default async function DashboardPage() {
    const [{ borrowed, lent }, userItems] = await Promise.all([
        getActiveBorrows(),
        getUserItems()
    ])

    return (
        <div className="flex flex-col gap-12 w-full">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <Link
                    href="/discover"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Discover Items
                </Link>
            </div>

            {/* Items I am borrowing */}
            <section>
                <h2 className="text-xl font-bold mb-4">Items I'm Borrowing</h2>
                {borrowed.length === 0 ? (
                    <p className="text-gray-500">You aren't borrowing anything right now.</p>
                ) : (
                    <div className="grid gap-4">
                        {borrowed.map((record: any) => (
                            <div key={record.id} className="p-4 border rounded-lg bg-white flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold">{record.items.name}</h3>
                                    <p className="text-sm text-gray-600">From: {record.lender?.name}</p>
                                    <p className="text-xs text-gray-400">Due: {record.due_date ? new Date(record.due_date).toLocaleDateString() : 'No due date'}</p>
                                </div>
                                <form action={async () => {
                                    'use server'
                                    await returnItem(record.id, record.item_id, record.group_id)
                                }}>
                                    <button className="text-sm bg-gray-100 px-3 py-1 rounded hover:bg-gray-200">
                                        Mark Returned
                                    </button>
                                </form>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Items I lent out */}
            <section>
                <h2 className="text-xl font-bold mb-4">Items I've Lent Out</h2>
                {lent.length === 0 ? (
                    <p className="text-gray-500">You haven't lent anything out.</p>
                ) : (
                    <div className="grid gap-4">
                        {lent.map((record: any) => (
                            <div key={record.id} className="p-4 border rounded-lg bg-white flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold">{record.items.name}</h3>
                                    <p className="text-sm text-gray-600">To: {record.borrower_name || record.borrower?.name || 'Unknown'}</p>
                                    <p className="text-xs text-gray-400">Due: {record.due_date ? new Date(record.due_date).toLocaleDateString() : 'No due date'}</p>
                                </div>
                                <form action={async () => {
                                    'use server'
                                    await returnItem(record.id, record.item_id, record.group_id)
                                }}>
                                    <button className="text-sm bg-gray-100 px-3 py-1 rounded hover:bg-gray-200">
                                        Mark Returned
                                    </button>
                                </form>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* My Items */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">My Items</h2>
                    <Link href="/items" className="text-sm text-blue-600 hover:underline">
                        Manage Items
                    </Link>
                </div>
                {userItems.length === 0 ? (
                    <p className="text-gray-500">You haven't added any items yet.</p>
                ) : (
                    <div className="grid gap-4">
                        {userItems.map((item: any) => (
                            <div key={item.id} className="p-4 border rounded-lg bg-white flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold">{item.name}</h3>
                                    <p className="text-sm text-gray-600">{item.description || 'No description'}</p>
                                    <div className="flex gap-2 mt-1">
                                        <span className={`text-xs px-2 py-0.5 rounded ${item.visibility === 'shared' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                            {item.visibility === 'shared' ? 'Shared' : 'Personal'}
                                        </span>
                                        {item.status === 'unavailable' && (
                                            <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-800">
                                                Unavailable
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}
