import { createServerSupabaseClient } from '@/lib/supabase/server'
import KanbanBoard from '@/components/deals/KanbanBoard'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function DealsPage() {
  const supabase = await createServerSupabaseClient()

  const [stagesRes, dealsRes] = await Promise.all([
    supabase.from('deal_stages').select('*').order('position'),
    supabase.from('deals').select('*, contact:contacts(first_name, last_name), stage:deal_stages(name, color)')
      .eq('status', 'open').order('created_at', { ascending: false }),
  ])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Pipeline</h1>
        <Link href="/deals/new" className="btn btn-primary">
          <Plus className="w-4 h-4" /> Add Deal
        </Link>
      </div>
      <KanbanBoard
        stages={stagesRes.data ?? []}
        deals={dealsRes.data ?? []}
      />
    </div>
  )
}
