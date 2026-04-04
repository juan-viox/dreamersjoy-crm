import { createServerSupabaseClient } from '@/lib/supabase/server'
import CalendarClient from './CalendarClient'

export default async function CalendarPage() {
  const supabase = await createServerSupabaseClient()

  // Fetch activities for the next/prev 2 months
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 2, 0)

  const { data: activities } = await supabase
    .from('activities')
    .select('id, title, type, due_date, completed, created_at, contact_id')
    .gte('due_date', start.toISOString().split('T')[0])
    .lte('due_date', end.toISOString().split('T')[0])
    .order('due_date', { ascending: true })

  // Fetch contacts for the form
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, first_name, last_name')
    .order('first_name')

  // Fetch deals for the form
  const { data: deals } = await supabase
    .from('deals')
    .select('id, title')
    .eq('status', 'open')
    .order('title')

  return (
    <CalendarClient
      activities={activities ?? []}
      contacts={contacts ?? []}
      deals={deals ?? []}
    />
  )
}
