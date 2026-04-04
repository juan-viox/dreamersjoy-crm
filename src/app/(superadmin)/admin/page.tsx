'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  Building2,
  Users,
  UserCheck,
  DollarSign,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

const GOLD = '#C9A96E'

interface OrgSummary {
  id: string
  name: string
  slug: string
  plan: string | null
  created_at: string
  contacts_count: number
  deals_count: number
  users_count: number
  revenue: number
}

export default function SuperAdminOverview() {
  const [orgs, setOrgs] = useState<OrgSummary[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      // Fetch all organizations
      const { data: organizations } = await supabase
        .from('organizations')
        .select('id, name, slug, plan, created_at')
        .order('created_at', { ascending: false })

      if (!organizations) {
        setLoading(false)
        return
      }

      // For each org, get counts
      const summaries: OrgSummary[] = await Promise.all(
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
          }
        })
      )

      setOrgs(summaries)
      setLoading(false)
    }

    load()
  }, [])

  const totalContacts = orgs.reduce((s, o) => s + o.contacts_count, 0)
  const totalUsers = orgs.reduce((s, o) => s + o.users_count, 0)
  const totalRevenue = orgs.reduce((s, o) => s + o.revenue, 0)

  const chartData = orgs.map((o) => ({
    name: o.name.length > 14 ? o.name.slice(0, 14) + '...' : o.name,
    revenue: o.revenue,
  }))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="animate-spin" size={32} style={{ color: GOLD }} />
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Super Admin Overview</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          Cross-organization metrics and management
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Building2}
          label="Total Organizations"
          value={orgs.length.toString()}
        />
        <StatCard
          icon={Users}
          label="Total Users"
          value={totalUsers.toString()}
        />
        <StatCard
          icon={UserCheck}
          label="Total Contacts"
          value={totalContacts.toLocaleString()}
        />
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
        />
      </div>

      {/* Revenue by Organization Chart */}
      {chartData.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Revenue by Organization</h2>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'var(--muted)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--border)' }}
                />
                <YAxis
                  tick={{ fill: 'var(--muted)', fontSize: 12 }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    color: 'var(--text)',
                  }}
                  formatter={(value: number) => [
                    `$${value.toLocaleString()}`,
                    'Revenue',
                  ]}
                />
                <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={index} fill={GOLD} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Org List */}
      <div className="card" style={{ padding: 0 }}>
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <h2 className="text-lg font-semibold">Organizations</h2>
          <Link
            href="/admin/organizations"
            className="text-sm flex items-center gap-1 no-underline"
            style={{ color: GOLD }}
          >
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Plan</th>
                <th>Contacts</th>
                <th>Deals</th>
                <th>Users</th>
                <th>Revenue</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => (
                <tr key={org.id}>
                  <td>
                    <Link
                      href={`/admin/organizations/${org.id}`}
                      className="font-medium no-underline hover:underline"
                      style={{ color: GOLD }}
                    >
                      {org.name}
                    </Link>
                  </td>
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
                  <td>{org.contacts_count}</td>
                  <td>{org.deals_count}</td>
                  <td>{org.users_count}</td>
                  <td>${org.revenue.toLocaleString()}</td>
                  <td style={{ color: 'var(--muted)' }}>
                    {new Date(org.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {orgs.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8" style={{ color: 'var(--muted)' }}>
                    No organizations found
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

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="card flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: 'rgba(201,169,110,0.12)', color: GOLD }}
      >
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
          {label}
        </p>
        <p className="text-xl font-bold mt-0.5">{value}</p>
      </div>
    </div>
  )
}
