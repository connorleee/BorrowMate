'use client'

import { useState } from 'react'
import Link from 'next/link'
import ItemDetailModal from './item-detail-modal'

interface BorrowRecord {
  id: string
  item_id: string
  group_id?: string
  item?: {
    id: string
    name: string
    description?: string
  }
  lender?: {
    name: string
  }
  due_date?: string
}

interface Item {
  id: string
  name: string
  description?: string
  status: string
  groups?: { id: string; name: string } | null
}

interface DashboardContentProps {
  borrowed: BorrowRecord[]
  userItems: Item[]
  lentGroupedByContact: any[]
}

export default function DashboardContent({
  borrowed,
  userItems,
  lentGroupedByContact,
}: DashboardContentProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  return (
    <>
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
              {borrowed.map((record) => (
                <div
                  key={record.id}
                  className="p-4 border rounded-lg bg-white flex justify-between items-center cursor-pointer hover:border-blue-300 hover:shadow-md transition-colors"
                  onClick={() => setSelectedItemId(record.item_id)}
                >
                  <div>
                    <h3 className="font-bold">{record.item?.name || 'Unknown Item'}</h3>
                    <p className="text-sm text-gray-600">From: {record.lender?.name || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">
                      Due: {record.due_date ? new Date(record.due_date).toLocaleDateString() : 'No due date'}
                    </p>
                  </div>
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
              {lentGroupedByContact.map((group) => (
                <div key={group.contactId} className="border rounded-lg overflow-hidden bg-white">
                  {/* Contact Header */}
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <h3 className="font-bold text-lg">{group.contact?.name || 'Unknown Contact'}</h3>
                    {group.contact?.email && <p className="text-sm text-gray-600">{group.contact.email}</p>}
                  </div>

                  {/* Items for this contact */}
                  <div className="divide-y">
                    {group.items?.map((record: any) => (
                      <div
                        key={record.id}
                        className="p-4 flex justify-between items-center hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => setSelectedItemId(record.item_id)}
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">{record.item?.name || 'Unknown Item'}</h4>
                          {record.item?.description && (
                            <p className="text-sm text-gray-600">{record.item.description}</p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            Due:{' '}
                            {record.due_date ? new Date(record.due_date).toLocaleDateString() : 'No due date'}
                          </p>
                        </div>
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
              {userItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border rounded-lg bg-white flex justify-between items-center cursor-pointer hover:border-blue-300 hover:shadow-md transition-colors"
                  onClick={() => setSelectedItemId(item.id)}
                >
                  <div>
                    <h3 className="font-bold">{item.name}</h3>
                    <p className="text-sm text-gray-600">{item.description || 'No description'}</p>
                    {item.status === 'unavailable' && (
                      <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-800 inline-block mt-1">
                        Unavailable
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Item Detail Modal */}
      {selectedItemId && (
        <ItemDetailModal
          isOpen={!!selectedItemId}
          onClose={() => setSelectedItemId(null)}
          itemId={selectedItemId}
        />
      )}
    </>
  )
}
