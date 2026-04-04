import { createServerSupabaseClient } from '@/lib/supabase/server'
import ContactTable from '@/components/contacts/ContactTable'
import EmptyState from '@/components/shared/EmptyState'
import { Users } from 'lucide-react'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function ContactsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: contacts } = await supabase
    .from('contacts')
    .select('*, company:companies(name)')
    .order('created_at', { ascending: false })

  if (!contacts || contacts.length === 0) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Contacts</h1>
          <Link href="/contacts/new" className="btn btn-primary">
            <Plus className="w-4 h-4" /> Add Contact
          </Link>
        </div>
        <EmptyState
          icon={Users}
          title="No contacts yet"
          description="Add your first contact to get started"
          actionLabel="Add Contact"
          actionHref="/contacts/new"
        />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Contacts</h1>
        <Link href="/contacts/new" className="btn btn-primary">
          <Plus className="w-4 h-4" /> Add Contact
        </Link>
      </div>
      <ContactTable contacts={contacts} />
    </div>
  )
}
