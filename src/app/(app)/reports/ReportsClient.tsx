'use client'

import { useState, useMemo } from 'react'
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  DollarSign,
  Target,
  Users,
  Activity,
  Trophy,
  XCircle,
  Clock,
  Percent,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

const COLORS = ['#6c5ce7', '#a29bfe', '#00b894', '#fdcb6e', '#e17055', '#74b9ff', '#fd79a8', '#55efc4', '#fab1a0', '#81ecec']

const tooltipStyle = {
  contentStyle: {
    background: 'var(--surface-2)',
    border: '1px solid var(--border)',
    borderRadius: '0.5rem',
    color: 'var(--text)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    fontSize: '12px',
  },
}

interface Deal {
  id: string
  title: string
  amount: number
  status: string
  probability?: number
  stage_id: string
  created_at: string
  updated_at: string
  close_date?: string
}

interface Contact {
  id: string
  source: string | null
  created_at: string
}

interface ActivityRecord {
  id: string
  type: string
  user_id?: string
  created_at: string
  completed: boolean
}

interface Stage {
  id: string
  name: string
  color: string
  position: number
}

type DateRange = '7d' | '30d' | '90d' | 'year' | 'all'

function getDateFilter(range: DateRange): Date {
  const now = new Date()
  switch (range) {
    case '7d': return new Date(now.getTime() - 7 * 86400000)
    case '30d': return new Date(now.getTime() - 30 * 86400000)
    case '90d': return new Date(now.getTime() - 90 * 86400000)
    case 'year': return new Date(now.getFullYear(), 0, 1)
    case 'all': return new Date(2000, 0, 1)
  }
}

function getMonthsBetween(start: Date, end: Date): string[] {
  const months: string[] = []
  const d = new Date(start.getFullYear(), start.getMonth(), 1)
  while (d <= end) {
    months.push(d.toLocaleString('en-US', { month: 'short', year: '2-digit' }))
    d.setMonth(d.getMonth() + 1)
  }
  return months
}

function exportCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return
  const headers = Object.keys(data[0])
  const rows = data.map((row) => headers.map((h) => JSON.stringify(row[h] ?? '')).join(','))
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function ReportsClient({
  deals,
  contacts,
  activities,
  stages,
  teamMembers,
  topCompanies,
}: {
  deals: Deal[]
  contacts: Contact[]
  activities: ActivityRecord[]
  stages: Stage[]
  teamMembers: { id: string; name: string }[]
  topCompanies: { name: string; deals: number }[]
}) {
  const [dateRange, setDateRange] = useState<DateRange>('90d')

  const filterDate = useMemo(() => getDateFilter(dateRange), [dateRange])

  // Filtered data
  const filteredDeals = useMemo(
    () => deals.filter((d) => new Date(d.created_at) >= filterDate),
    [deals, filterDate]
  )
  const filteredContacts = useMemo(
    () => contacts.filter((c) => new Date(c.created_at) >= filterDate),
    [contacts, filterDate]
  )
  const filteredActivities = useMemo(
    () => activities.filter((a) => new Date(a.created_at) >= filterDate),
    [activities, filterDate]
  )

  // ---- SALES REPORTS ----

  // Revenue by month
  const revenueByMonth = useMemo(() => {
    const wonDeals = filteredDeals.filter((d) => d.status === 'won')
    const months = getMonthsBetween(filterDate, new Date())
    const monthMap: Record<string, number> = {}
    months.forEach((m) => (monthMap[m] = 0))
    wonDeals.forEach((d) => {
      const dt = new Date(d.close_date || d.updated_at)
      const key = dt.toLocaleString('en-US', { month: 'short', year: '2-digit' })
      if (monthMap[key] !== undefined) monthMap[key] += d.amount || 0
    })
    return months.map((m) => ({ month: m, revenue: monthMap[m] }))
  }, [filteredDeals, filterDate])

  // Deals by stage
  const dealsByStage = useMemo(() => {
    const openDeals = filteredDeals.filter((d) => d.status === 'open')
    return stages.map((s) => ({
      name: s.name,
      count: openDeals.filter((d) => d.stage_id === s.id).length,
      value: openDeals.filter((d) => d.stage_id === s.id).reduce((sum, d) => sum + (d.amount || 0), 0),
      color: s.color,
    }))
  }, [filteredDeals, stages])

  // Win/Loss ratio
  const winLossData = useMemo(() => {
    const won = filteredDeals.filter((d) => d.status === 'won').length
    const lost = filteredDeals.filter((d) => d.status === 'lost').length
    const open = filteredDeals.filter((d) => d.status === 'open').length
    return [
      { name: 'Won', value: won, color: '#00b894' },
      { name: 'Lost', value: lost, color: '#e17055' },
      { name: 'Open', value: open, color: '#6c5ce7' },
    ].filter((d) => d.value > 0)
  }, [filteredDeals])

  const winRate = useMemo(() => {
    const won = filteredDeals.filter((d) => d.status === 'won').length
    const closed = filteredDeals.filter((d) => d.status === 'won' || d.status === 'lost').length
    return closed > 0 ? Math.round((won / closed) * 100) : 0
  }, [filteredDeals])

  // Average deal size
  const avgDealSize = useMemo(() => {
    const wonDeals = filteredDeals.filter((d) => d.status === 'won' && d.amount > 0)
    if (wonDeals.length === 0) return 0
    return wonDeals.reduce((sum, d) => sum + d.amount, 0) / wonDeals.length
  }, [filteredDeals])

  // Sales cycle length
  const avgSalesCycle = useMemo(() => {
    const wonDeals = filteredDeals.filter((d) => d.status === 'won')
    if (wonDeals.length === 0) return 0
    const totalDays = wonDeals.reduce((sum, d) => {
      const created = new Date(d.created_at)
      const closed = new Date(d.close_date || d.updated_at)
      return sum + Math.max(1, Math.round((closed.getTime() - created.getTime()) / 86400000))
    }, 0)
    return Math.round(totalDays / wonDeals.length)
  }, [filteredDeals])

  // ---- CONTACT REPORTS ----

  // Contacts by source
  const contactsBySource = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredContacts.forEach((c) => {
      const src = c.source || 'Unknown'
      counts[src] = (counts[src] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [filteredContacts])

  // New contacts over time
  const contactsOverTime = useMemo(() => {
    const months = getMonthsBetween(filterDate, new Date())
    const monthMap: Record<string, number> = {}
    months.forEach((m) => (monthMap[m] = 0))
    filteredContacts.forEach((c) => {
      const key = new Date(c.created_at).toLocaleString('en-US', { month: 'short', year: '2-digit' })
      if (monthMap[key] !== undefined) monthMap[key]++
    })
    return months.map((m) => ({ month: m, contacts: monthMap[m] }))
  }, [filteredContacts, filterDate])

  // ---- ACTIVITY REPORTS ----

  // Activities by type
  const activitiesByType = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredActivities.forEach((a) => {
      counts[a.type] = (counts[a.type] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
      .sort((a, b) => b.value - a.value)
  }, [filteredActivities])

  // Activities by team member
  const activitiesByMember = useMemo(() => {
    const counts: Record<string, number> = {}
    filteredActivities.forEach((a) => {
      if (a.user_id) counts[a.user_id] = (counts[a.user_id] || 0) + 1
    })
    return Object.entries(counts)
      .map(([userId, value]) => ({
        name: teamMembers.find((m) => m.id === userId)?.name || 'Unknown',
        value,
      }))
      .sort((a, b) => b.value - a.value)
  }, [filteredActivities, teamMembers])

  // Activity trends
  const activityTrends = useMemo(() => {
    const months = getMonthsBetween(filterDate, new Date())
    const monthMap: Record<string, number> = {}
    months.forEach((m) => (monthMap[m] = 0))
    filteredActivities.forEach((a) => {
      const key = new Date(a.created_at).toLocaleString('en-US', { month: 'Short', year: '2-digit' })
      // Fix: use same format
      const key2 = new Date(a.created_at).toLocaleString('en-US', { month: 'short', year: '2-digit' })
      if (monthMap[key2] !== undefined) monthMap[key2]++
    })
    return months.map((m) => ({ month: m, activities: monthMap[m] }))
  }, [filteredActivities, filterDate])

  // ---- PIPELINE REPORTS ----

  // Pipeline value by stage
  const pipelineValue = useMemo(() => {
    const openDeals = deals.filter((d) => d.status === 'open')
    return stages.map((s) => {
      const stageDeals = openDeals.filter((d) => d.stage_id === s.id)
      return {
        name: s.name,
        value: stageDeals.reduce((sum, d) => sum + (d.amount || 0), 0),
        count: stageDeals.length,
        color: s.color,
      }
    })
  }, [deals, stages])

  // Conversion rates (simplified: deals that moved past each stage)
  const conversionRates = useMemo(() => {
    if (stages.length < 2) return []
    const allDeals = deals.filter((d) => d.status === 'won' || d.status === 'open')
    return stages.map((s, i) => {
      const inOrPast = allDeals.filter((d) => {
        const stagePos = stages.find((st) => st.id === d.stage_id)?.position ?? 0
        return stagePos >= s.position || d.status === 'won'
      }).length
      const total = allDeals.length
      return {
        name: s.name,
        rate: total > 0 ? Math.round((inOrPast / total) * 100) : 0,
        color: s.color,
      }
    })
  }, [deals, stages])

  // Forecast
  const forecast = useMemo(() => {
    const openDeals = deals.filter((d) => d.status === 'open')
    return openDeals.reduce((sum, d) => sum + (d.amount || 0) * ((d.probability ?? 50) / 100), 0)
  }, [deals])

  const totalPipelineValue = useMemo(() => {
    return deals.filter((d) => d.status === 'open').reduce((sum, d) => sum + (d.amount || 0), 0)
  }, [deals])

  const totalRevenue = useMemo(() => {
    return filteredDeals.filter((d) => d.status === 'won').reduce((sum, d) => sum + (d.amount || 0), 0)
  }, [filteredDeals])

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6" style={{ color: 'var(--accent)' }} />
            Reports & Analytics
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Insights across your sales pipeline, contacts, and team activity
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Range Filter */}
          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: 'var(--surface-2)' }}>
            {([
              { key: '7d', label: '7D' },
              { key: '30d', label: '30D' },
              { key: '90d', label: '90D' },
              { key: 'year', label: 'YTD' },
              { key: 'all', label: 'All' },
            ] as { key: DateRange; label: string }[]).map((r) => (
              <button
                key={r.key}
                onClick={() => setDateRange(r.key)}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                style={{
                  background: dateRange === r.key ? 'var(--accent)' : 'transparent',
                  color: dateRange === r.key ? 'white' : 'var(--muted)',
                }}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              const allData = filteredDeals.map((d) => ({
                title: d.title,
                amount: d.amount,
                status: d.status,
                created_at: d.created_at,
                close_date: d.close_date,
              }))
              exportCSV(allData, `viox-deals-report-${dateRange}`)
            }}
            className="btn btn-secondary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MetricCard
          icon={DollarSign}
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
          color="#00b894"
        />
        <MetricCard
          icon={Trophy}
          label="Win Rate"
          value={`${winRate}%`}
          color="#6c5ce7"
        />
        <MetricCard
          icon={Clock}
          label="Avg Sales Cycle"
          value={`${avgSalesCycle} days`}
          color="#74b9ff"
        />
        <MetricCard
          icon={Target}
          label="Avg Deal Size"
          value={formatCurrency(avgDealSize)}
          color="#fdcb6e"
        />
      </div>

      {/* SALES REPORTS */}
      <SectionHeader title="Sales Reports" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {/* Revenue by Month */}
        <div className="card">
          <ChartHeader title="Revenue by Month" icon={TrendingUp} />
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueByMonth}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6c5ce7" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6c5ce7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [formatCurrency(v), 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#6c5ce7" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Deals by Stage */}
        <div className="card">
          <ChartHeader title="Deals by Stage" icon={Target} />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={dealsByStage} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} width={100} />
              <Tooltip {...tooltipStyle} formatter={(v: number, name: string) => {
                if (name === 'count') return [v, 'Deals']
                return [formatCurrency(v), 'Value']
              }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {dealsByStage.map((entry, i) => (
                  <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Win/Loss Ratio */}
        <div className="card">
          <ChartHeader title="Win/Loss Ratio" icon={Trophy} />
          <div className="flex items-center">
            <ResponsiveContainer width="60%" height={220}>
              <PieChart>
                <Pie data={winLossData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" strokeWidth={0}>
                  {winLossData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {winLossData.map((d) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>{d.name}: {d.value}</span>
                </div>
              ))}
              <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                <p className="text-lg font-bold" style={{ color: '#00b894' }}>{winRate}%</p>
                <p className="text-[11px]" style={{ color: 'var(--muted)' }}>Win Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Average Deal Size + Sales Cycle */}
        <div className="card">
          <ChartHeader title="Deal Metrics" icon={DollarSign} />
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="p-4 rounded-xl" style={{ background: 'var(--surface-2)' }}>
              <DollarSign className="w-5 h-5 mb-2" style={{ color: '#00b894' }} />
              <p className="text-2xl font-bold">{formatCurrency(avgDealSize)}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Average Deal Size</p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'var(--surface-2)' }}>
              <Clock className="w-5 h-5 mb-2" style={{ color: '#74b9ff' }} />
              <p className="text-2xl font-bold">{avgSalesCycle}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Avg Days to Close</p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'var(--surface-2)' }}>
              <Trophy className="w-5 h-5 mb-2" style={{ color: '#6c5ce7' }} />
              <p className="text-2xl font-bold">{filteredDeals.filter((d) => d.status === 'won').length}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Deals Won</p>
            </div>
            <div className="p-4 rounded-xl" style={{ background: 'var(--surface-2)' }}>
              <XCircle className="w-5 h-5 mb-2" style={{ color: '#e17055' }} />
              <p className="text-2xl font-bold">{filteredDeals.filter((d) => d.status === 'lost').length}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Deals Lost</p>
            </div>
          </div>
        </div>
      </div>

      {/* CONTACT REPORTS */}
      <SectionHeader title="Contact Reports" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Contacts by Source */}
        <div className="card">
          <ChartHeader title="Contacts by Source" icon={Users} />
          {contactsBySource.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: 'var(--muted)' }}>No data</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={contactsBySource} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {contactsBySource.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-2">
                {contactsBySource.map((s, i) => (
                  <div key={s.name} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span style={{ color: 'var(--muted)' }}>{s.name} ({s.value})</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* New Contacts Over Time */}
        <div className="card lg:col-span-2">
          <ChartHeader title="New Contacts Over Time" icon={Users} />
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={contactsOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip {...tooltipStyle} />
              <Line type="monotone" dataKey="contacts" stroke="#6c5ce7" strokeWidth={2.5} dot={{ fill: '#6c5ce7', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Companies */}
      {topCompanies.length > 0 && (
        <div className="card mb-8">
          <ChartHeader title="Top Companies by Deal Count" icon={Target} />
          <ResponsiveContainer width="100%" height={Math.max(200, topCompanies.length * 40)}>
            <BarChart data={topCompanies} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="name" stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} width={120} />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="deals" fill="#6c5ce7" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ACTIVITY REPORTS */}
      <SectionHeader title="Activity Reports" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Activities by Type */}
        <div className="card">
          <ChartHeader title="Activities by Type" icon={Activity} />
          {activitiesByType.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: 'var(--muted)' }}>No data</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={activitiesByType}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {activitiesByType.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Activities by Team Member */}
        <div className="card">
          <ChartHeader title="Activities by Team Member" icon={Users} />
          {activitiesByMember.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: 'var(--muted)' }}>No data</p>
          ) : (
            <div className="space-y-2 mt-2">
              {activitiesByMember.slice(0, 8).map((m, i) => {
                const max = activitiesByMember[0]?.value || 1
                return (
                  <div key={m.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium truncate">{m.name}</span>
                      <span className="text-xs" style={{ color: 'var(--muted)' }}>{m.value}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(m.value / max) * 100}%`,
                          background: COLORS[i % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Activity Trends */}
        <div className="card">
          <ChartHeader title="Activity Trends" icon={TrendingUp} />
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={activityTrends}>
              <defs>
                <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00b894" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#00b894" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip {...tooltipStyle} />
              <Area type="monotone" dataKey="activities" stroke="#00b894" strokeWidth={2} fill="url(#actGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* PIPELINE REPORTS */}
      <SectionHeader title="Pipeline Reports" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {/* Pipeline Value by Stage */}
        <div className="card">
          <ChartHeader title="Pipeline Value by Stage" icon={DollarSign} />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={pipelineValue}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [formatCurrency(v), 'Value']} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {pipelineValue.map((entry, i) => (
                  <Cell key={i} fill={entry.color || COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Conversion Rates */}
        <div className="card">
          <ChartHeader title="Stage Conversion Rates" icon={Percent} />
          {conversionRates.length === 0 ? (
            <p className="text-sm text-center py-10" style={{ color: 'var(--muted)' }}>No stages configured</p>
          ) : (
            <div className="space-y-3 mt-2">
              {conversionRates.map((s) => (
                <div key={s.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{s.name}</span>
                    <span className="text-xs font-semibold" style={{ color: s.color }}>{s.rate}%</span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${s.rate}%`, background: s.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Forecast Card */}
        <div className="card lg:col-span-2">
          <ChartHeader title="Revenue Forecast" icon={TrendingUp} />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="p-5 rounded-xl text-center" style={{ background: 'var(--surface-2)' }}>
              <p className="text-3xl font-bold" style={{ color: 'var(--accent-light)' }}>
                {formatCurrency(totalPipelineValue)}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Total Pipeline Value</p>
            </div>
            <div className="p-5 rounded-xl text-center" style={{ background: 'var(--surface-2)' }}>
              <p className="text-3xl font-bold" style={{ color: '#00b894' }}>
                {formatCurrency(forecast)}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Weighted Forecast</p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>(amount x probability)</p>
            </div>
            <div className="p-5 rounded-xl text-center" style={{ background: 'var(--surface-2)' }}>
              <p className="text-3xl font-bold" style={{ color: '#fdcb6e' }}>
                {deals.filter((d) => d.status === 'open').length}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Open Deals</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// --- Sub-components ---

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4 mt-2">
      <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
        {title}
      </h2>
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
    </div>
  )
}

function ChartHeader({ title, icon: Icon }: { title: string; icon: typeof BarChart3 }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-4 h-4" style={{ color: 'var(--accent-light)' }} />
      <h3 className="text-sm font-semibold">{title}</h3>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof DollarSign
  label: string
  value: string
  color: string
}) {
  return (
    <div className="card flex items-center gap-3">
      <div
        className="p-2.5 rounded-xl shrink-0"
        style={{ background: `${color}15` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-lg font-bold">{value}</p>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>{label}</p>
      </div>
    </div>
  )
}
