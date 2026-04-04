import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Globe } from 'lucide-react'
import EmptyState from '@/components/shared/EmptyState'
import SitesClient from './SitesClient'

export default async function SitesPage() {
  const supabase = await createServerSupabaseClient()

  const { data: sites } = await supabase
    .from('cinematic_sites')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Connected Sites</h1>
        <Link href="/sites/new" className="btn btn-primary">
          <Plus className="w-4 h-4" /> Add Site
        </Link>
      </div>

      {!sites || sites.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="No sites connected"
          description="Connect your cinematic sites to receive leads and data"
          actionLabel="Add Site"
          actionHref="/sites/new"
        />
      ) : (
        <SitesClient sites={sites} />
      )}
    </div>
  )
}
