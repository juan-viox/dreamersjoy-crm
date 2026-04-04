import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Globe, Phone, MapPin } from 'lucide-react'
import Avatar from '@/components/shared/Avatar'
import FileAttachments from '@/components/shared/FileAttachments'
import NotesPanel from '@/components/shared/NotesPanel'
import CustomFieldsRenderer from '@/components/shared/CustomFieldsRenderer'
import { formatDate, formatCurrency } from '@/lib/utils'

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()

  const { data: company } = await supabase
    .from('companies').select('*').eq('id', id).single()

  if (!company) notFound()

  const [contactsRes, dealsRes] = await Promise.all([
    supabase.from('contacts').select('*').eq('company_id', id).order('first_name'),
    supabase.from('deals').select('*, stage:deal_stages(name, color)').eq('company_id', id).order('created_at', { ascending: false }),
  ])

  const contacts = contactsRes.data ?? []
  const deals = dealsRes.data ?? []

  return (
    <div>
      <Link href="/companies" className="inline-flex items-center gap-1 text-sm mb-6 hover:underline" style={{ color: 'var(--muted)' }}>
        <ArrowLeft className="w-4 h-4" /> Back to companies
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info */}
        <div className="card">
          <div className="flex items-center gap-4 mb-4">
            <Avatar name={company.name} size="lg" />
            <div>
              <h1 className="text-xl font-bold">{company.name}</h1>
              {company.industry && <p className="text-sm" style={{ color: 'var(--muted)' }}>{company.industry}</p>}
            </div>
          </div>

          <div className="space-y-3">
            {company.domain && (
              <div className="flex items-center gap-3 text-sm">
                <Globe className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                <span>{company.domain}</span>
              </div>
            )}
            {company.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                <span>{company.phone}</span>
              </div>
            )}
            {(company.city || company.state) && (
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                <span>{[company.city, company.state].filter(Boolean).join(', ')}</span>
              </div>
            )}
          </div>

          {company.notes && (
            <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>{company.notes}</p>
            </div>
          )}

          <p className="text-xs mt-4" style={{ color: 'var(--muted)' }}>Created {formatDate(company.created_at)}</p>
        </div>

        {/* Contacts & Deals */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--muted)' }}>Contacts ({contacts.length})</h3>
            {contacts.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: 'var(--muted)' }}>No contacts linked</p>
            ) : (
              <div className="space-y-2">
                {contacts.map((c: any) => (
                  <Link key={c.id} href={`/contacts/${c.id}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--surface-2)] transition-colors">
                    <Avatar name={`${c.first_name} ${c.last_name}`} size="sm" />
                    <div>
                      <p className="text-sm font-medium">{c.first_name} {c.last_name}</p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>{c.email ?? c.phone ?? ''}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--muted)' }}>Deals ({deals.length})</h3>
            {deals.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: 'var(--muted)' }}>No deals yet</p>
            ) : (
              <div className="space-y-2">
                {deals.map((deal: any) => (
                  <Link key={deal.id} href={`/deals/${deal.id}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-[var(--surface-2)] transition-colors">
                    <div>
                      <p className="text-sm font-medium">{deal.title}</p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>{formatCurrency(deal.amount ?? 0)}</p>
                    </div>
                    <span
                      className="badge text-xs"
                      style={{ background: `${deal.stage?.color ?? 'var(--muted)'}20`, color: deal.stage?.color ?? 'var(--muted)' }}
                    >
                      {deal.stage?.name}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <FileAttachments entityType="company" entityId={id} />

          {/* Notes */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--muted)' }}>Notes</h3>
            <NotesPanel entityType="company" entityId={id} />
          </div>
        </div>
      </div>

      {/* Custom Fields */}
      <div className="mt-6 max-w-md">
        <div className="card">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--muted)' }}>Custom Fields</h3>
          <CustomFieldsRenderer entityType="company" entityId={id} />
        </div>
      </div>
    </div>
  )
}
