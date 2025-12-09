'use client'

import { useState } from 'react'
import AddItemForm from './add-item-form'
import MyInventorySection from './my-inventory-section'
import ItemDetailModal from './item-detail-modal'
import { Card } from './Card'

interface BorrowRecord {
  id: string
  item_id: string
  start_date: string
  item?: {
    id: string
    name: string
    description?: string
    owner?: {
      name: string
    }
  }
}

interface Item {
  id: string
  name: string
  description?: string
  status: string
  groups?: { id: string; name: string } | null
}

interface ItemsPageContentProps {
  borrowedItems: BorrowRecord[]
  userItems: Item[]
}

export default function ItemsPageContent({ borrowedItems, userItems }: ItemsPageContentProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)

  return (
    <>
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">My Items</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="md:col-span-2 space-y-8">
            {/* Borrowed Items Section */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">Borrowed Items</h2>
              {borrowedItems.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-6 text-center text-gray-500">
                  You are not currently borrowing any items.
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {borrowedItems.map((record) => (
                    <Card
                      key={record.id}
                      interactive
                      onClick={() => setSelectedItemId(record.item_id)}
                      className="h-full"
                      variant="compact"
                    >
                      <div className="flex flex-col h-full justify-between">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-sm text-gray-900 mb-1 truncate">
                            {record.item?.name || 'Unknown Item'}
                          </h3>
                          <p className="text-xs text-gray-600 mb-2 truncate">
                            from{' '}
                            <span className="font-medium text-gray-700">
                              {record.item?.owner?.name || 'Unknown'}
                            </span>
                          </p>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <p className="text-[10px] text-gray-400">
                            Since {new Date(record.start_date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                          </p>
                          <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 text-[10px] font-medium rounded-full flex-shrink-0">
                            Borrowed
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* My Inventory Section */}
            <MyInventorySection items={userItems} />
          </div>

          {/* Sidebar / Add Item Form */}
          <div className="md:col-span-1">
            <div className="sticky top-6">
              <AddItemForm />
            </div>
          </div>
        </div>
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
