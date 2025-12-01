'use client'

import { useState } from 'react'
import AddItemForm from './add-item-form'
import MyInventorySection from './my-inventory-section'
import ItemDetailModal from './item-detail-modal'

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
                <div className="space-y-4">
                  {borrowedItems.map((record) => (
                    <div
                      key={record.id}
                      className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center cursor-pointer hover:border-primary-300 hover:shadow-md transition-colors"
                      onClick={() => setSelectedItemId(record.item_id)}
                    >
                      <div>
                        <h3 className="font-medium text-lg">{record.item?.name || 'Unknown Item'}</h3>
                        <p className="text-sm text-gray-500">
                          Borrowed from{' '}
                          <span className="font-medium text-gray-700">{record.item?.owner?.name || 'Unknown'}</span>
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Since {new Date(record.start_date).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                        Borrowed
                      </span>
                    </div>
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
