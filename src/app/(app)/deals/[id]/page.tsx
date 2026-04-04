import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, DollarSign, Calendar, User, Building2 } from 'lucide-react'
import Avatar from '@/components/shared/Avatar'
import ContactTimeline from '@/components/contacts/ContactTimeline'
import FileAttachments from '@/components/shared/FileAttachments'
import NotesPanel from '@/components/shared/NotesPanel'
import CustomFieldsRenderer from '@/components/shared/CustomFieldsRenderer'
import { formatCurrency, formatDate } from '@/lib/utils'

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: deal } = await supabase
    .from('deals')
    .select('*, contact:contacts(id, first_name, last_name, email), company:companies(id, name), stage:deal_stages(name, color)')
    .eq('id', id)
    .single()

  if (!deal) notFound()

  const { data: activities } = await supabase
    .from('activities')
    .select('*')
    .eq('deal_id', id)
    .order('created_at', { ascending: false })

  const contactName = deal.contact ? `${deal.contact.first_name} ${deal.contact.last_name}` : null

  return (
    <div>
      <Link href="/deals" className="inline-flex items-center gap-1 text-sm mb-6 hover:underline" style={{ color: 'var(--muted)' }}>
        <ArrowLeft className="w-4 h-4" /> Back to pipeline
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold">{deal.title}</h1>
              <span
                className="badge"
                style={{
                  background: `${deal.stage?.color ?? 'var(--muted)'}20`,
                  color: deal.stage?.color ?? 'var(--muted)',
                }}
              >
                {deal.stage?.name}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <DollarSign className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                <span className="text-lg font-bold" style={{ color: 'var(--accent-light)' }}>
                  {formatCurrency(deal.amount ?? 0)}
                </span>
              </div>

              {deal.close_date && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                  <span>Close: {formatDate(deal.close_date)}</span>
                </div>
              )}

              {contactName && (
                <Link href={`/contacts/${deal.contact.id}`} className="flex items-center gap-3 text-sm hover:underline">
                  <User className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                  <div className="flex items-center gap-2">
                    <Avatar name={contactName} size="sm" />
                    <span>{contactName}</span>
                  </div>
                </Link>
              )}

              {deal.company && (
                <Link href={`/companies/${deal.company.id}`} className="flex items-center gap-3 text-sm hover:underline">
                  <Building2 className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                  <span>{deal.company.name}</span>
                </Link>
              )}
            </div>

            {deal.notes && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>{deal.notes}</p>
              </div>
            )}

            <div className="flex items-center gap-2 mt-4">
              <span
                className="badge"
                style={{
                  background: deal.status === 'won' ? 'rgba(0,184,148,0.15)' : deal.status === 'lost' ? 'rgba(225,112,85,0.15)' : 'rgba(108,92,231,0.15)',
                  color: deal.status === 'won' ? 'var(--success)' : deal.status === 'lost' ? 'var(--danger)' : 'var(--accent-light)',
                }}
              >
                {deal.status}
              </span>
              {deal.probability !== null && deal.probability !== undefined && (
                <span className="text-xs" style={{ color: 'var(--muted)' }}>{deal.probability}% probability</span>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--muted)' }}>Activity</h3>
            <ContactTimeline activities={activities ?? []} />
          </div>

          <FileAttachments entityType="deal" entityId={id} />

          {/* Notes */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--muted)' }}>Notes</h3>
            <NotesPanel entityType="deal" entityId={id} />
          </div>
        </div>
      </div>

      {/* Custom Fields */}
      <div className="mt-6 max-w-md">
        <div className="card">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--muted)' }}>Custom Fields</h3>
          <CustomFieldsRenderer entityType="deal" entityId={id} />
        </div>
      </div>
    </div>
  )
}
