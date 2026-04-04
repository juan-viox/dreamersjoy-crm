'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell,
  Trophy,
  XCircle,
  UserPlus,
  Clock,
  AtSign,
  ClipboardList,
  Info,
  Check,
  CheckCheck,
  Inbox,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatRelativeTime } from '@/lib/utils'

interface Notification {
  id: string
  type: string
  title: string
  message: string | null
  entity_type: string | null
  entity_id: string | null
  is_read: boolean
  created_at: string
}

const typeConfig: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  deal_won: { icon: Trophy, color: '#00b894', bg: 'rgba(0,184,148,0.12)' },
  deal_lost: { icon: XCircle, color: '#e17055', bg: 'rgba(225,112,85,0.12)' },
  new_lead: { icon: UserPlus, color: '#6c5ce7', bg: 'rgba(108,92,231,0.12)' },
  task_due: { icon: Clock, color: '#fdcb6e', bg: 'rgba(253,203,110,0.12)' },
  mention: { icon: AtSign, color: '#74b9ff', bg: 'rgba(116,185,255,0.12)' },
  assignment: { icon: ClipboardList, color: '#a29bfe', bg: 'rgba(162,155,254,0.12)' },
  system: { icon: Info, color: '#8888a0', bg: 'rgba(136,136,160,0.12)' },
}

function getEntityRoute(entityType: string | null, entityId: string | null): string | null {
  if (!entityType || !entityId) return null
  const routes: Record<string, string> = {
    deal: `/deals/${entityId}`,
    contact: `/contacts/${entityId}`,
    lead: `/leads/${entityId}`,
    company: `/companies/${entityId}`,
    activity: '/activities',
  }
  return routes[entityType] ?? null
}

export default function NotificationPanel() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const fetchNotifications = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)

    if (data) setNotifications(data)
  }, [supabase])

  // Initial fetch
  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Poll every 30s
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function markAsRead(id: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
  }

  async function markAllAsRead() {
    setLoading(true)
    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id)
    if (unreadIds.length > 0) {
      await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    }
    setLoading(false)
  }

  function handleNotificationClick(notif: Notification) {
    if (!notif.is_read) markAsRead(notif.id)
    const route = getEntityRoute(notif.entity_type, notif.entity_id)
    if (route) {
      router.push(route)
      setOpen(false)
    }
  }

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
        style={{ color: 'var(--muted)' }}
      >
        <Bell className="w-[1.125rem] h-[1.125rem]" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1"
            style={{ background: 'var(--danger, #e17055)' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="dropdown-menu absolute right-0 top-full mt-1.5 w-96 max-h-[28rem] flex flex-col"
          style={{ zIndex: 50 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <p className="text-sm font-semibold">Notifications</p>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={loading}
                className="text-xs font-medium hover:underline flex items-center gap-1"
                style={{ color: 'var(--accent-light)' }}
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all as read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
                  style={{ background: 'rgba(108,92,231,0.08)' }}
                >
                  <Inbox className="w-6 h-6" style={{ color: 'var(--accent-light)' }} />
                </div>
                <p className="text-sm font-medium">All caught up!</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                  No notifications to show
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const config = typeConfig[notif.type] || typeConfig.system
                const Icon = config.icon
                const isClickable = !!getEntityRoute(notif.entity_type, notif.entity_id)

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                      isClickable ? 'cursor-pointer hover:bg-[var(--surface-2)]' : ''
                    }`}
                    style={{
                      background: notif.is_read ? 'transparent' : 'rgba(108,92,231,0.04)',
                      borderLeft: notif.is_read ? '2px solid transparent' : `2px solid ${config.color}`,
                    }}
                  >
                    <div
                      className="p-2 rounded-lg shrink-0 mt-0.5"
                      style={{ background: config.bg }}
                    >
                      <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm ${notif.is_read ? '' : 'font-semibold'}`}>
                        {notif.title}
                      </p>
                      {notif.message && (
                        <p
                          className="text-xs mt-0.5 line-clamp-2"
                          style={{ color: 'var(--muted)' }}
                        >
                          {notif.message}
                        </p>
                      )}
                      <p
                        className="text-[11px] mt-1"
                        style={{ color: 'var(--muted)' }}
                      >
                        {formatRelativeTime(notif.created_at)}
                      </p>
                    </div>
                    {!notif.is_read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          markAsRead(notif.id)
                        }}
                        className="p-1 rounded hover:bg-[var(--surface-2)] shrink-0 mt-1"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
