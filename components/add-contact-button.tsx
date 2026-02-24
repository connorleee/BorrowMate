'use client'

import { useState } from 'react'
import AddContactModal from '@/components/add-contact-modal'
import { Button } from '@/components/ui'

export default function AddContactButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        + Add Contact
      </Button>
      <AddContactModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
