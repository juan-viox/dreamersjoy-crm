'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  Building2,
  Plus,
  Eye,
  Palette,
  Users,
  Ban,
  Loader2,
  Search,
} from 'lucide-react'

const GOLD = '#C9A96E'

interface Org {
  id: string
  name: string
  slug: string
  plan: string | null
  created_at: string
  contacts_count: number
  deals_count: number
  users_count: number
  revenue: number
  is_active: boolean
}

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Org[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadOrgs()
  }, [])

  async function loadOrgs() {
    const { data: organizations } = await supabase
      .from('organizations')
      .select('id, name, slug, plan, created_at, is_active')
      .order('created_at', { ascending: false })

    if (!organizations) {
      setLoading(false)
      return
    }

    const summaries: Org[] = await Promise.all(
      organizations.map(async (org) => {
        const [contactsRes, dealsRes, usersRes, revenueRes] = await Promise.all([
          supabase
            .from('contacts')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', org.id),
          supabase
            .from('deals')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', org.id),
          supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('organization_id', org.id),
          supabase
            .from('deals')
            .select('value')
            .eq('organization_id', org.id)
            .eq('stage', 'closed_won'),
        ])

        const revenue = (revenueRes.data ?? []).reduce(
          (sum, d) => sum + (d.value ?? 0),
          0
        )

        return {
          id: org.id,
          name: org.name,
          slug: org.slug,
          plan: org.plan,
          created_at: org.created_at,
          contacts_count: contactsRes.count ?? 0,
          deals_count: dealsRes.count ?? 0,
          users_count: usersRes.count ?? 0,
          revenue,
          is_active: org.is_active ?? true,
        }
      })
    )

    setOrgs(summaries)
    setLoading(false)
  }

  const filtered = orgs.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.slug.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="animate-spin" size={32} style={{ color: GOLD }} />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Organizations</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Manage all tenant organizations
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary flex items-center gap-2"
          style={{ background: GOLD, color: '#1a1a2e' }}
        >
          <Plus size={16} /> Add Organization
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--muted)' }}
        />
        <input
          type="text"
          placeholder="Search organizations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9"
        />
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Plan</th>
                <th>Users</th>
                <th>Contacts</th>
                <th>Deals</th>
                <th>Revenue</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((org) => (
                <tr key={org.id}>
                  <td className="font-medium">{org.name}</td>
                  <td style={{ color: 'var(--muted)' }}>{org.slug}</td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background: 'rgba(201,169,110,0.12)',
                        color: GOLD,
                      }}
                    >
                      {org.plan ?? 'free'}
                    </span>
                  </td>
                  <td>{org.users_count}</td>
                  <td>{org.contacts_count}</td>
                  <td>{org.deals_count}</td>
                  <td>${org.revenue.toLocaleString()}</td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background: org.is_active
                          ? 'rgba(0,184,148,0.12)'
                          : 'rgba(225,112,85,0.12)',
                        color: org.is_active ? 'var(--success)' : 'var(--danger)',
                      }}
                    >
                      {org.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--muted)' }}>
                    {new Date(org.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/admin/organizations/${org.id}`}
                        className="p-1.5 rounded hover:bg-[var(--surface-2)] transition-colors no-underline"
                        style={{ color: 'var(--muted)' }}
                        title="View"
                      >
                        <Eye size={15} />
                      </Link>
                      <Link
                        href={`/admin/organizations/${org.id}?tab=branding`}
                        className="p-1.5 rounded hover:bg-[var(--surface-2)] transition-colors no-underline"
                        style={{ color: 'var(--muted)' }}
                        title="Edit Branding"
                      >
                        <Palette size={15} />
                      </Link>
                      <Link
                        href={`/admin/organizations/${org.id}?tab=users`}
                        className="p-1.5 rounded hover:bg-[var(--surface-2)] transition-colors no-underline"
                        style={{ color: 'var(--muted)' }}
                        title="Manage Users"
                      >
                        <Users size={15} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    className="text-center py-8"
                    style={{ color: 'var(--muted)' }}
                  >
                    No organizations found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Organization Modal */}
      {showAddModal && (
        <AddOrgModal
          onClose={() => setShowAddModal(false)}
          onCreated={() => {
            setShowAddModal(false)
            setLoading(true)
            loadOrgs()
          }}
        />
      )}
    </div>
  )
}

function AddOrgModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [plan, setPlan] = useState('free')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  function handleNameChange(value: string) {
    setName(value)
    setSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase.from('organizations').insert({
      name,
      slug,
      plan,
    })

    if (!error) {
      onCreated()
    }
    setSaving(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-4">Add Organization</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label>Organization Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              className="w-full"
              placeholder="e.g. DreamersJoy"
            />
          </div>
          <div>
            <label>Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              className="w-full"
              placeholder="e.g. dreamersjoy"
            />
          </div>
          <div>
            <label>Plan</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full"
            >
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ background: GOLD, color: '#1a1a2e' }}
              disabled={saving}
            >
              {saving ? 'Creating...' : 'Create Organization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
