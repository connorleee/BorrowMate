import { getContactWithBorrowHistory, getPublicItemsForContact } from '@/app/contacts/actions'
import { getPendingRequestsForItems } from '@/app/notifications/actions'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import ContactDetailContent from '@/components/contact-detail-content'

interface ContactPageProps {
  params: Promise<{ id: string }>
}

export default async function ContactDetailPage({ params }: ContactPageProps) {
  const { id } = await params
  const result = await getContactWithBorrowHistory(id)

  if ('error' in result) {
    redirect('/contacts')
  }

  const { contact, currentlyBorrowed, borrowedFromContact, history, stats } = result

  // Fetch public items if contact is a linked user
  const publicItems = await getPublicItemsForContact(id)

  // Fetch pending borrow requests for these items
  const itemIds = publicItems.map(item => item.id)
  const pendingRequests = await getPendingRequestsForItems(itemIds)

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/contacts" className="hover:text-primary-600">
          Contacts
        </Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-gray-100">{contact.name}</span>
      </div>

      <ContactDetailContent
        contact={contact}
        currentlyBorrowed={currentlyBorrowed}
        borrowedFromContact={borrowedFromContact}
        history={history}
        stats={stats}
        publicItems={publicItems}
        pendingRequests={pendingRequests}
      />
    </div>
  )
}
