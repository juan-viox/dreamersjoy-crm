import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import LeadDetailClient from './LeadDetailClient'

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: contact } = await supabase
    .from('contacts')
    .select('*, company:companies(name)')
    .eq('id', id)
    .single()

  if (!contact) notFound()

  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .eq('contact_id', id)
    .order('created_at', { ascending: false })

  // Check if lead has any deals
  const { data: deals } = await supabase
    .from('deals')
    .select('id')
    .eq('contact_id', id)
    .limit(1)

  // Get first pipeline stage for conversion
  const { data: firstStage } = await supabase
    .from('deal_stages')
    .select('id, name')
    .order('position', { ascending: true })
    .limit(1)
    .single()

  return (
    <LeadDetailClient
      contact={contact}
      activities={activities ?? []}
      hasDeal={(deals ?? []).length > 0}
      firstStageId={firstStage?.id ?? null}
      firstStageName={firstStage?.name ?? null}
    />
  )
}
