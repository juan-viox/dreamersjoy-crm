import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ContactDetailClient from './ContactDetailClient'

export default async function ContactDetailPage({
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

  const { data: deals } = await supabase
    .from('deals')
    .select('*, stage:deal_stages(name, color)')
    .eq('contact_id', id)
    .order('created_at', { ascending: false })

  return (
    <ContactDetailClient
      contact={contact}
      activities={activities ?? []}
      deals={deals ?? []}
    />
  )
}
