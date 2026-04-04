'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import Link from 'next/link'
import {
  Users,
  DollarSign,
  Target,
  CheckCircle2,
  Phone,
  Mail,
  Calendar,
  FileText,
  Mic,
  UserPlus,
  Handshake,
  Activity,
  FileDown,
  Clock,
  AlertCircle,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import StatCard from '@/components/shared/StatCard'

const PIE_COLORS = ['#6c5ce7', '#a29bfe', '#00b894', '#fdcb6e', '#e17055', '#74b9ff']

const activityIcons: Record<string, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  task: CheckCircle2,
  note: FileText,
  voice_agent: Mic,
}

const activityColors: Record<string, string> = {
  call: '#6c5ce7',
  email: '#74b9ff',
  meeting: '#00b894',
  task: '#fdcb6e',
  note: '#8888a0',
  voice_agent: '#fd79a8',
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function timeAgo(dateStr: string) {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function isOverdue(dateStr: string | null) {
  if (!dateStr) return false
  return new Date(dateStr) < new Date(new Date().toDateString())
}

export default function DashboardClient({
  firstName,
  stats,
  revenueByMonth,
  leadSources,
  recentActivities,
  pipelineData,
  upcomingTasks,
}: {
  firstName: string
  stats: {
    totalContacts: number
    openDealCount: number
    revenue: string
    revenueRaw: number
    tasksDueToday: number
  }
  revenueByMonth: { month: string; revenue: number }[]
  leadSources: { name: string; value: number }[]
  recentActivities: {
    id: string
    type: string
    title: string
    contactName: string | null
    createdAt: string
  }[]
  pipelineData: { name: string; color: string; count: number; amount: number }[]
  upcomingTasks: {
    id: string
    title: string
    type: string
    dueDate: string | null
    completed: boolean
  }[]
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!containerRef.current) return
    gsap.from(containerRef.current.children, {
      y: 16,
      opacity: 0,
      duration: 0.4,
      stagger: 0.08,
      ease: 'power2.out',
    })
  }, [])

  const totalPipelineDeals = pipelineData.reduce((s, p) => s + p.count, 0)

  return (
    <div ref={containerRef}>
      {/* Greeting */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          Here is what is happening in your CRM today.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Contacts"
          value={String(stats.totalContacts)}
          numericValue={stats.totalContacts}
          icon={Users}
          variant="accent"
          index={0}
          trend={12}
          trendLabel="vs last month"
        />
        <StatCard
          label="Active Deals"
          value={String(stats.openDealCount)}
          numericValue={stats.openDealCount}
          icon={Target}
          variant="info"
          index={1}
          trend={8}
          trendLabel="vs last month"
        />
        <StatCard
          label="Revenue (Won)"
          value={stats.revenue}
          numericValue={stats.revenueRaw}
          prefix="$"
          icon={DollarSign}
          variant="success"
          index={2}
          trend={23}
          trendLabel="vs last month"
        />
        <StatCard
          label="Tasks Due"
          value={String(stats.tasksDueToday)}
          numericValue={stats.tasksDueToday}
          icon={CheckCircle2}
          variant="warning"
          index={3}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Revenue Chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold">Revenue Over Time</h3>
            <span className="text-xs badge badge-success">Last 6 months</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueByMonth}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6c5ce7" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#6c5ce7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                stroke="var(--muted)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--muted)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  color: 'var(--text)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                }}
                formatter={(value: number) => [
                  `$${Number(value).toLocaleString()}`,
                  'Revenue',
                ]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#6c5ce7"
                strokeWidth={2.5}
                fill="url(#revenueGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Lead Sources Pie */}
        <div className="card">
          <h3 className="text-sm font-semibold mb-4">Lead Sources</h3>
          {leadSources.length === 0 ? (
            <p
              className="text-sm text-center py-8"
              style={{ color: 'var(--muted)' }}
            >
              No data yet
            </p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={leadSources}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {leadSources.map((_, i) => (
                      <Cell
                        key={i}
                        fill={PIE_COLORS[i % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--surface-2)',
                      border: '1px solid var(--border)',
                      borderRadius: '0.5rem',
                      color: 'var(--text)',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
                {leadSources.map((s, i) => (
                  <div
                    key={s.name}
                    className="flex items-center gap-1.5 text-xs"
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{
                        background: PIE_COLORS[i % PIE_COLORS.length],
                      }}
                    />
                    <span style={{ color: 'var(--muted)' }}>
                      {s.name} ({s.value})
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pipeline + Tasks Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Pipeline Snapshot */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Pipeline Snapshot</h3>
            <Link
              href="/deals"
              className="text-xs hover:underline"
              style={{ color: 'var(--accent-light)' }}
            >
              View all
            </Link>
          </div>

          {/* Mini bar */}
          {totalPipelineDeals > 0 && (
            <div className="pipeline-bar mb-4">
              {pipelineData.map((stage) => (
                <div
                  key={stage.name}
                  className="pipeline-bar-segment"
                  style={{
                    width: `${(stage.count / totalPipelineDeals) * 100}%`,
                    background: stage.color,
                    minWidth: stage.count > 0 ? '8px' : '0',
                  }}
                  title={`${stage.name}: ${stage.count} deals`}
                />
              ))}
            </div>
          )}

          <div className="space-y-2.5">
            {pipelineData.map((stage) => (
              <div
                key={stage.name}
                className="flex items-center justify-between py-2 px-3 rounded-lg"
                style={{ background: 'var(--surface-2)' }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: stage.color }}
                  />
                  <span className="text-sm font-medium">{stage.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs" style={{ color: 'var(--muted)' }}>
                    {stage.count} {stage.count === 1 ? 'deal' : 'deals'}
                  </span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--accent-light)' }}>
                    ${stage.amount.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Upcoming Tasks</h3>
            <Link
              href="/activities"
              className="text-xs hover:underline"
              style={{ color: 'var(--accent-light)' }}
            >
              View all
            </Link>
          </div>

          {upcomingTasks.length === 0 ? (
            <p
              className="text-sm text-center py-8"
              style={{ color: 'var(--muted)' }}
            >
              No upcoming tasks
            </p>
          ) : (
            <div className="space-y-2">
              {upcomingTasks.map((task) => {
                const overdue = isOverdue(task.dueDate)
                return (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-2.5 rounded-lg"
                    style={{ background: 'var(--surface-2)' }}
                  >
                    <div
                      className="p-1.5 rounded-md mt-0.5"
                      style={{
                        background: overdue
                          ? 'rgba(225,112,85,0.12)'
                          : 'rgba(108,92,231,0.12)',
                      }}
                    >
                      {overdue ? (
                        <AlertCircle
                          className="w-3.5 h-3.5"
                          style={{ color: 'var(--danger)' }}
                        />
                      ) : (
                        <Clock
                          className="w-3.5 h-3.5"
                          style={{ color: 'var(--accent-light)' }}
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {task.title}
                      </p>
                      {task.dueDate && (
                        <span
                          className={`text-xs ${overdue ? 'badge badge-danger' : ''}`}
                          style={overdue ? {} : { color: 'var(--muted)' }}
                        >
                          {overdue ? 'Overdue - ' : ''}
                          {new Date(task.dueDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-sm font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/contacts/new" className="quick-action">
              <div
                className="quick-action-icon"
                style={{ background: 'rgba(108,92,231,0.12)' }}
              >
                <UserPlus
                  className="w-5 h-5"
                  style={{ color: 'var(--accent-light)' }}
                />
              </div>
              <span className="text-xs font-medium">Add Contact</span>
            </Link>
            <Link href="/deals/new" className="quick-action">
              <div
                className="quick-action-icon"
                style={{ background: 'rgba(0,184,148,0.12)' }}
              >
                <Handshake
                  className="w-5 h-5"
                  style={{ color: 'var(--success)' }}
                />
              </div>
              <span className="text-xs font-medium">Create Deal</span>
            </Link>
            <Link href="/activities" className="quick-action">
              <div
                className="quick-action-icon"
                style={{ background: 'rgba(253,203,110,0.12)' }}
              >
                <Activity
                  className="w-5 h-5"
                  style={{ color: 'var(--warning)' }}
                />
              </div>
              <span className="text-xs font-medium">Log Activity</span>
            </Link>
            <Link href="/leads/new" className="quick-action">
              <div
                className="quick-action-icon"
                style={{ background: 'rgba(116,185,255,0.12)' }}
              >
                <FileDown
                  className="w-5 h-5"
                  style={{ color: 'var(--info)' }}
                />
              </div>
              <span className="text-xs font-medium">Add Lead</span>
            </Link>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Recent Activity</h3>
            <Link
              href="/activities"
              className="text-xs hover:underline"
              style={{ color: 'var(--accent-light)' }}
            >
              View all
            </Link>
          </div>

          {recentActivities.length === 0 ? (
            <p
              className="text-sm py-4 text-center"
              style={{ color: 'var(--muted)' }}
            >
              No recent activity
            </p>
          ) : (
            <div className="space-y-1">
              {recentActivities.map((a) => {
                const Icon = activityIcons[a.type] || FileText
                const color = activityColors[a.type] || 'var(--muted)'
                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
                  >
                    <div
                      className="p-2 rounded-lg shrink-0"
                      style={{ background: `${color}15` }}
                    >
                      <Icon
                        className="w-3.5 h-3.5"
                        style={{ color }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {a.title}
                      </p>
                      {a.contactName && (
                        <p
                          className="text-xs truncate"
                          style={{ color: 'var(--muted)' }}
                        >
                          {a.contactName}
                        </p>
                      )}
                    </div>
                    <span
                      className="text-xs shrink-0"
                      style={{ color: 'var(--muted)' }}
                    >
                      {timeAgo(a.createdAt)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
