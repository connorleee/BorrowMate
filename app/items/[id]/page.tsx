import { getItemDetailsWithBorrow, getItemBorrowHistory } from '../actions'
import Link from 'next/link'

export default async function ItemDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const data = await getItemDetailsWithBorrow(id)

    if (!data) {
        return <div>Item not found</div>
    }

    const { item, activeBorrow, contact, isOwner } = data
    const borrowHistory = isOwner ? await getItemBorrowHistory(id) : []

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="mb-6">
                {item.groups ? (
                    <Link href={`/groups/${item.group_id}`} className="text-sm text-gray-500 hover:underline">
                        &larr; Back to {item.groups.name}
                    </Link>
                ) : (
                    <Link href="/items" className="text-sm text-gray-500 hover:underline">
                        &larr; Back to Items
                    </Link>
                )}
            </div>

            <div className="bg-white border rounded-lg p-8 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                    <h1 className="text-3xl font-bold">{item.name}</h1>
                    <div className="flex gap-2">
                        <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                                item.status === 'available'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                            }`}
                        >
                            {item.status === 'available' ? 'Available' : 'Unavailable'}
                        </span>
                        {item.privacy && (
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
                                {item.privacy === 'private' ? 'Private' : 'Public'}
                            </span>
                        )}
                    </div>
                </div>

                <div className="space-y-6">
                    {item.description && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
                                Description
                            </h3>
                            <p className="text-gray-800">{item.description}</p>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
                                Category
                            </h3>
                            <p>{item.category || 'Uncategorized'}</p>
                        </div>
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Owner</h3>
                            <p>{item.users?.name || 'Unknown'}</p>
                        </div>
                    </div>

                    {/* Current Borrow Status */}
                    {activeBorrow && contact ? (
                        <div className="bg-primary-50 p-4 rounded-lg border border-primary-200">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Currently Borrowed By</h3>
                            <p className="font-medium text-gray-900">
                                <Link
                                    href={`/contacts/${contact.id}`}
                                    className="text-primary-600 hover:underline"
                                >
                                    {contact.name}
                                </Link>
                            </p>
                            {contact.email && <p className="text-sm text-gray-600">Email: {contact.email}</p>}
                            {contact.phone && <p className="text-sm text-gray-600">Phone: {contact.phone}</p>}
                            {activeBorrow.due_date && (
                                <p className="text-sm text-gray-600 mt-2">
                                    Due: {new Date(activeBorrow.due_date).toLocaleDateString()}
                                </p>
                            )}
                        </div>
                    ) : null}

                    {/* Advanced Info */}
                    <div className="grid grid-cols-2 gap-4">
                        {item.price_usd && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
                                    Price
                                </h3>
                                <p>${item.price_usd}</p>
                            </div>
                        )}
                        {item.qr_slug && (
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
                                    QR Slug
                                </h3>
                                <p className="text-sm break-all">{item.qr_slug}</p>
                            </div>
                        )}
                    </div>

                    {/* Borrow History - Owner Only */}
                    {isOwner && borrowHistory.length > 0 && (
                        <div className="pt-6 border-t">
                            <h3 className="text-sm font-medium text-gray-700 mb-3">Borrow History</h3>
                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                {borrowHistory.map((record, idx) => (
                                    <div
                                        key={record.id || idx}
                                        className="p-3 bg-gray-50 rounded border border-gray-200"
                                    >
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="flex-1">
                                                <p className="font-medium text-gray-900">
                                                    {record.contact?.id ? (
                                                        <Link
                                                            href={`/contacts/${record.contact.id}`}
                                                            className="text-primary-600 hover:underline"
                                                        >
                                                            {record.contact.name}
                                                        </Link>
                                                    ) : (
                                                        record.contact?.name || 'Unknown'
                                                    )}
                                                </p>
                                                <p className="text-xs text-gray-600 mt-1">
                                                    {new Date(record.start_date).toLocaleDateString()}
                                                    {record.due_date &&
                                                        ` - Due: ${new Date(record.due_date).toLocaleDateString()}`}
                                                </p>
                                                {record.returned_at && (
                                                    <p className="text-xs text-gray-600">
                                                        Returned: {new Date(record.returned_at).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                            <span
                                                className={`text-xs px-2 py-1 rounded whitespace-nowrap ${
                                                    record.status === 'returned'
                                                        ? 'bg-green-100 text-green-800'
                                                        : record.status === 'borrowed'
                                                          ? 'bg-primary-100 text-primary-800'
                                                          : 'bg-gray-100 text-gray-800'
                                                }`}
                                            >
                                                {record.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

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
