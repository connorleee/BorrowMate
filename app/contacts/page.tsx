import { getContacts } from '@/app/contacts/actions'
import Link from 'next/link'
import AddContactButton from '@/components/add-contact-button'
import ContactListSection from '@/components/contact-list-section'

export default async function ContactsPage() {
  const contacts = await getContacts()

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Contacts</h1>
        <AddContactButton />
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">You haven't created any contacts yet.</p>
          <p className="text-sm text-gray-400 mb-6">
            Add contacts to lend items to friends and family.
          </p>
          <AddContactButton />
        </div>
      ) : (
        <div>
          <p className="text-gray-600 mb-4">{contacts.length} contact{contacts.length !== 1 ? 's' : ''}</p>
          <ContactListSection initialContacts={contacts} />
        </div>
      )}

      <div className="mt-8 text-center">
        <Link
          href="/items"
          className="text-blue-600 hover:underline"
        >
          ← Back to Items
        </Link>
      </div>
    </div>
  )
}
