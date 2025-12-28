import { getContactWithBorrowHistory } from '@/app/contacts/actions'
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

  const { contact, currentlyBorrowed, history, stats } = result

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
        history={history}
        stats={stats}
      />
    </div>
  )
}
