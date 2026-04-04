import { createServerSupabaseClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user!.id)
    .single()

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

  // Fetch all stats in parallel
  const [contactsRes, dealsRes, wonDealsRes, activitiesRes, recentActivitiesRes, stagesRes, upcomingRes] = await Promise.all([
    supabase.from('contacts').select('id', { count: 'exact', head: true }),
    supabase.from('deals').select('id, amount').eq('status', 'open'),
    supabase.from('deals').select('amount, created_at').eq('status', 'won'),
    supabase.from('activities')
      .select('id', { count: 'exact', head: true })
      .eq('completed', false)
      .lte('due_date', new Date().toISOString().split('T')[0] + 'T23:59:59'),
    supabase.from('activities')
      .select('*, contact:contacts(first_name, last_name)')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('deal_stages')
      .select('id, name, color, position')
      .order('position'),
    supabase.from('activities')
      .select('id, title, type, due_date, completed')
      .eq('completed', false)
      .gte('due_date', new Date().toISOString().split('T')[0])
      .order('due_date', { ascending: true })
      .limit(5),
  ])

  const totalContacts = contactsRes.count ?? 0
  const openDeals = dealsRes.data ?? []
  const openDealCount = openDeals.length
  const wonDeals = wonDealsRes.data ?? []
  const revenue = wonDeals.reduce((sum, d) => sum + (d.amount || 0), 0)
  const tasksDueToday = activitiesRes.count ?? 0
  const recentActivities = recentActivitiesRes.data ?? []
  const stages = stagesRes.data ?? []
  const upcomingTasks = upcomingRes.data ?? []

  // Revenue by month (last 6 months)
  const revenueByMonth: { month: string; revenue: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const monthLabel = d.toLocaleString('en-US', { month: 'short' })
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString()
    const monthDeals = wonDeals.filter(
      deal => deal.created_at >= monthStart && deal.created_at <= monthEnd
    )
    revenueByMonth.push({
      month: monthLabel,
      revenue: monthDeals.reduce((sum, d) => sum + (d.amount || 0), 0),
    })
  }

  // Lead sources
  const { data: contactsBySource } = await supabase
    .from('contacts')
    .select('source')

  const sourceCounts: Record<string, number> = {}
  ;(contactsBySource ?? []).forEach(c => {
    const src = c.source || 'unknown'
    sourceCounts[src] = (sourceCounts[src] || 0) + 1
  })

  const leadSources = Object.entries(sourceCounts).map(([name, value]) => ({ name, value }))

  // Pipeline snapshot
  const { data: dealsWithStages } = await supabase
    .from('deals')
    .select('stage_id, amount')
    .eq('status', 'open')

  const pipelineData = stages.map(stage => {
    const stDeals = (dealsWithStages ?? []).filter(d => d.stage_id === stage.id)
    return {
      name: stage.name,
      color: stage.color,
      count: stDeals.length,
      amount: stDeals.reduce((sum, d) => sum + (d.amount || 0), 0),
    }
  })

  return (
    <DashboardClient
      firstName={firstName}
      stats={{
        totalContacts,
        openDealCount,
        revenue: formatCurrency(revenue),
        revenueRaw: revenue,
        tasksDueToday,
      }}
      revenueByMonth={revenueByMonth}
      leadSources={leadSources}
      recentActivities={recentActivities.map(a => ({
        id: a.id,
        type: a.type,
        title: a.title,
        contactName: a.contact ? `${a.contact.first_name} ${a.contact.last_name}` : null,
        createdAt: a.created_at,
      }))}
      pipelineData={pipelineData}
      upcomingTasks={upcomingTasks.map(t => ({
        id: t.id,
        title: t.title,
        type: t.type,
        dueDate: t.due_date,
        completed: t.completed,
      }))}
    />
  )
}
