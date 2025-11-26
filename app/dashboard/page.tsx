import { getActiveBorrows, returnItem } from '@/app/borrow/actions'
import Link from 'next/link'

export default async function DashboardPage() {
    const { borrowed, lent } = await getActiveBorrows()

    return (
        <div className="flex flex-col gap-12 w-full">
            <h1 className="text-3xl font-bold">Dashboard</h1>

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
        </div>
    )
}
