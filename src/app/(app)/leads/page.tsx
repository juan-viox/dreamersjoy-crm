import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, UserPlus } from 'lucide-react'
import EmptyState from '@/components/shared/EmptyState'
import LeadsClient from './LeadsClient'

export default async function LeadsPage() {
  const supabase = await createServerSupabaseClient()

  const { data: contacts } = await supabase
    .from('contacts')
    .select('*, company:companies(name)')
    .eq('status', 'lead')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Contacts that haven&apos;t been qualified yet
          </p>
        </div>
        <Link href="/leads/new" className="btn btn-primary">
          <Plus className="w-4 h-4" /> Add Lead
        </Link>
      </div>

      {!contacts || contacts.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="No leads yet"
          description="Add your first lead to start tracking prospects"
          actionLabel="Add Lead"
          actionHref="/leads/new"
        />
      ) : (
        <LeadsClient leads={contacts} />
      )}
    </div>
  )
}
