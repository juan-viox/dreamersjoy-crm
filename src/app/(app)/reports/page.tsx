import { createServerSupabaseClient } from '@/lib/supabase/server'
import ReportsClient from './ReportsClient'

export default async function ReportsPage() {
  const supabase = await createServerSupabaseClient()

  // Fetch all raw data for reports
  const [
    dealsRes,
    contactsRes,
    activitiesRes,
    stagesRes,
    profilesRes,
  ] = await Promise.all([
    supabase
      .from('deals')
      .select('id, title, amount, status, probability, stage_id, created_at, updated_at, close_date'),
    supabase
      .from('contacts')
      .select('id, source, created_at'),
    supabase
      .from('activities')
      .select('id, type, user_id, created_at, completed'),
    supabase
      .from('deal_stages')
      .select('id, name, color, position')
      .order('position'),
    supabase
      .from('profiles')
      .select('id, full_name'),
  ])

  // Fetch companies with deal counts
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name')

  const { data: dealCompanies } = await supabase
    .from('deals')
    .select('company_id')
    .not('company_id', 'is', null)

  const companyDealCounts: Record<string, number> = {}
  ;(dealCompanies ?? []).forEach((d) => {
    const cid = d.company_id as string
    companyDealCounts[cid] = (companyDealCounts[cid] || 0) + 1
  })

  return (
    <ReportsClient
      deals={dealsRes.data ?? []}
      contacts={contactsRes.data ?? []}
      activities={activitiesRes.data ?? []}
      stages={stagesRes.data ?? []}
      profiles={profilesRes.data ?? []}
      companies={(companies ?? []).map(c => ({
        ...c,
        dealCount: companyDealCounts[c.id] || 0,
      }))}
    />
  )
}
