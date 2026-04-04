'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Users,
  Search,
  Filter,
  Loader2,
  Plus,
} from 'lucide-react'

const GOLD = '#C9A96E'

interface UserRow {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
  created_at: string
  last_sign_in_at: string | null
  organization_id: string
  org_name: string
}

interface OrgOption {
  id: string
  name: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [orgs, setOrgs] = useState<OrgOption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterOrg, setFilterOrg] = useState('')
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      // Load orgs for filter
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id, name')
        .order('name')

      if (orgData) setOrgs(orgData)

      // Load all profiles with org names
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, created_at, last_sign_in_at, organization_id, organization:organizations(name)')
        .order('created_at', { ascending: false })

      if (profiles) {
        setUsers(
          profiles.map((p: any) => ({
            id: p.id,
            full_name: p.full_name,
            email: p.email,
            role: p.role,
            created_at: p.created_at,
            last_sign_in_at: p.last_sign_in_at,
            organization_id: p.organization_id,
            org_name: p.organization?.name ?? '—',
          }))
        )
      }

      setLoading(false)
    }

    load()
  }, [])

  const filtered = users.filter((u) => {
    const matchSearch =
      (u.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email ?? '').toLowerCase().includes(search.toLowerCase())
    const matchOrg = filterOrg ? u.organization_id === filterOrg : true
    return matchSearch && matchOrg
  })

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
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            All users across all organizations ({users.length} total)
          </p>
        </div>
        <button
          className="btn btn-primary flex items-center gap-2"
          style={{ background: GOLD, color: '#1a1a2e' }}
        >
          <Plus size={16} /> Add User to Org
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--muted)' }}
          />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9"
          />
        </div>
        <div className="relative">
          <Filter
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--muted)' }}
          />
          <select
            value={filterOrg}
            onChange={(e) => setFilterOrg(e.target.value)}
            className="pl-9 pr-8"
            style={{ minWidth: 200 }}
          >
            <option value="">All Organizations</option>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Organization</th>
                <th>Role</th>
                <th>Last Active</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id}>
                  <td className="font-medium">{u.full_name ?? '—'}</td>
                  <td style={{ color: 'var(--muted)' }}>{u.email ?? '—'}</td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background: 'rgba(201,169,110,0.12)',
                        color: GOLD,
                      }}
                    >
                      {u.org_name}
                    </span>
                  </td>
                  <td>{u.role ?? 'member'}</td>
                  <td style={{ color: 'var(--muted)' }}>
                    {u.last_sign_in_at
                      ? new Date(u.last_sign_in_at).toLocaleDateString()
                      : '—'}
                  </td>
                  <td style={{ color: 'var(--muted)' }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-8"
                    style={{ color: 'var(--muted)' }}
                  >
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
