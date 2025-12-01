'use client'

import { useState } from 'react'
import AddContactModal from '@/components/add-contact-modal'

export default function AddContactButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors font-medium"
      >
        + Add Contact
      </button>
      <AddContactModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
