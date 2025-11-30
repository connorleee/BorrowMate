import { getActiveBorrows, returnItem, getActiveBorrowsGroupedByContact } from '@/app/borrow/actions'
import { getUserItems } from '@/app/items/actions'
import Link from 'next/link'

export default async function DashboardPage() {
    const [{ borrowed, lent }, userItems, lentGroupedByContact] = await Promise.all([
        getActiveBorrows(),
        getUserItems(),
        getActiveBorrowsGroupedByContact()
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
                                    <h3 className="font-bold">{record.item?.name || 'Unknown Item'}</h3>
                                    <p className="text-sm text-gray-600">From: {record.lender?.name || 'Unknown'}</p>
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

            {/* Items I lent out - grouped by contact */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Items I've Lent Out</h2>
                    <Link href="/contacts" className="text-sm text-blue-600 hover:underline">
                        Manage Contacts
                    </Link>
                </div>
                {lentGroupedByContact.length === 0 ? (
                    <p className="text-gray-500">You haven't lent anything out.</p>
                ) : (
                    <div className="space-y-6">
                        {lentGroupedByContact.map((group: any) => (
                            <div key={group.contactId} className="border rounded-lg overflow-hidden bg-white">
                                {/* Contact Header */}
                                <div className="bg-gray-50 px-4 py-3 border-b">
                                    <h3 className="font-bold text-lg">{group.contact?.name || 'Unknown Contact'}</h3>
                                    {group.contact?.email && (
                                        <p className="text-sm text-gray-600">{group.contact.email}</p>
                                    )}
                                </div>

                                {/* Items for this contact */}
                                <div className="divide-y">
                                    {group.items?.map((record: any) => (
                                        <div key={record.id} className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                            <div className="flex-1">
                                                <h4 className="font-medium">{record.item?.name || 'Unknown Item'}</h4>
                                                {record.item?.description && (
                                                    <p className="text-sm text-gray-600">{record.item.description}</p>
                                                )}
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Due: {record.due_date ? new Date(record.due_date).toLocaleDateString() : 'No due date'}
                                                </p>
                                            </div>
                                            <form action={async () => {
                                                'use server'
                                                await returnItem(record.id, record.item_id, record.group_id)
                                            }}>
                                                <button className="ml-4 text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 transition-colors">
                                                    Mark Returned
                                                </button>
                                            </form>
                                        </div>
                                    ))}
                                </div>
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
