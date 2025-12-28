'use client'

import { useState } from 'react'
import Link from 'next/link'
import ItemDetailModal from './item-detail-modal'
import { Card, ItemCard } from './Card'

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
            className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
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
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {borrowed.map((record) => (
                <Card
                  key={record.id}
                  interactive
                  onClick={() => setSelectedItemId(record.item_id)}
                  variant="compact"
                  className="h-full"
                >
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <h3 className="font-semibold text-sm truncate">{record.item?.name || 'Unknown Item'}</h3>
                      <p className="text-xs text-gray-600 truncate">From: {record.lender?.name || 'Unknown'}</p>
                    </div>
                    <p className="text-[10px] text-gray-400 mt-2">
                      Due: {record.due_date ? new Date(record.due_date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }) : 'No due date'}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Items I lent out */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Items I've Lent Out</h2>
            <Link href="/contacts" className="text-sm text-primary-600 hover:underline">
              Manage Contacts
            </Link>
          </div>
          {lentGroupedByContact.length === 0 ? (
            <p className="text-gray-500">You haven't lent anything out.</p>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {lentGroupedByContact.flatMap(group =>
                group.items.map((record: any) => ({
                  ...record,
                  contactId: group.contactId,
                  contactName: group.contact?.name || 'Unknown Contact',
                  contactEmail: group.contact?.email
                }))
              ).map((record) => (
                <Card
                  key={record.id}
                  interactive
                  onClick={() => setSelectedItemId(record.item_id)}
                  variant="compact"
                  className="h-full"
                >
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <h3 className="font-semibold text-sm truncate">{record.item?.name || 'Unknown Item'}</h3>
                      <p className="text-xs text-gray-600 truncate">
                        To:{' '}
                        <Link
                          href={`/contacts/${record.contactId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-primary-600 hover:underline"
                        >
                          {record.contactName}
                        </Link>
                      </p>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-[10px] text-gray-400">
                        Due: {record.due_date ? new Date(record.due_date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }) : 'No due date'}
                      </p>
                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full flex-shrink-0 ${record.status === 'overdue' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                        {record.status === 'overdue' ? 'Overdue' : 'Lent'}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* My Items */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">My Items</h2>
            <Link href="/items" className="text-sm text-primary-600 hover:underline">
              Manage Items
            </Link>
          </div>
          {userItems.length === 0 ? (
            <p className="text-gray-500">You haven't added any items yet.</p>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {userItems.map((item) => (
                <ItemCard
                  key={item.id}
                  itemId={item.id}
                  name={item.name}
                  description={item.description}
                  status={item.status}
                  groupName={item.groups?.name}
                  onViewDetails={() => setSelectedItemId(item.id)}
                  variant="compact"
                  className="h-full"
                />
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
