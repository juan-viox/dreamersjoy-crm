import { createServerSupabaseClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Building2 } from 'lucide-react'
import EmptyState from '@/components/shared/EmptyState'
import Avatar from '@/components/shared/Avatar'
import CompanyExportButton from '@/components/companies/CompanyExportButton'

export default async function CompaniesPage() {
  const supabase = await createServerSupabaseClient()

  const { data: companies } = await supabase
    .from('companies')
    .select('*, contacts:contacts(count)')
    .order('name')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Companies</h1>
        <div className="flex items-center gap-3">
          {companies && companies.length > 0 && <CompanyExportButton companies={companies} />}
          <Link href="/companies/new" className="btn btn-primary">
            <Plus className="w-4 h-4" /> Add Company
          </Link>
        </div>
      </div>

      {!companies || companies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No companies yet"
          description="Add your first company to organize your contacts"
          actionLabel="Add Company"
          actionHref="/companies/new"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company: any) => {
            const contactCount = company.contacts?.[0]?.count ?? 0
            return (
              <Link key={company.id} href={`/companies/${company.id}`} className="card hover:border-[var(--accent)] transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar name={company.name} size="md" />
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{company.name}</h3>
                    {company.industry && (
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>{company.industry}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm" style={{ color: 'var(--muted)' }}>
                  <span>{contactCount} contact{contactCount !== 1 ? 's' : ''}</span>
                  {company.domain && <span>{company.domain}</span>}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
