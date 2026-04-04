'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import crmConfig from '@/crm.config'
import {
  LayoutDashboard,
  Users,
  Building2,
  Kanban,
  Activity,
  Globe,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Bot,
  Plug,
  UserPlus,
  CalendarDays,
  Zap,
  SlidersHorizontal,
  CheckSquare,
  BarChart3,
  UsersRound,
} from 'lucide-react'
import Avatar from '@/components/shared/Avatar'
import ThemeToggle from '@/components/shared/ThemeToggle'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/leads', label: 'Leads', icon: UserPlus },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/companies', label: 'Companies', icon: Building2 },
  { href: '/deals', label: 'Pipeline', icon: Kanban },
  { href: '/activities', label: 'Activities', icon: Activity },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/automations', label: 'Automations', icon: Zap },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/sites', label: 'Sites', icon: Globe },
]

const settingsItems = [
  { href: '/settings', label: 'General', icon: Settings },
  { href: '/settings/pipeline', label: 'Pipeline', icon: Kanban },
  { href: '/settings/ai-providers', label: 'AI Providers', icon: Bot },
  { href: '/settings/integrations', label: 'Integrations', icon: Plug },
  { href: '/settings/team', label: 'Team', icon: UsersRound },
  { href: '/settings/custom-fields', label: 'Custom Fields', icon: SlidersHorizontal },
]

export default function Sidebar({
  orgName,
  userName,
  userRole,
}: {
  orgName: string
  userName?: string
  userRole?: string
}) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const branding = crmConfig.branding

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const accentBg = `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.accentColor} 100%)`
  const accentShadow = `0 2px 8px ${branding.primaryColor}4D`

  return (
    <aside
      className="flex flex-col h-screen sticky top-0 border-r overflow-hidden"
      style={{
        width: collapsed ? '4.5rem' : '16rem',
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Logo / Org header */}
      <div
        className="flex items-center justify-between p-4 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            {branding.logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={branding.logoUrl}
                alt={orgName}
                className="w-9 h-9 rounded-lg object-cover shrink-0"
              />
            ) : (
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                style={{
                  background: accentBg,
                  boxShadow: accentShadow,
                }}
              >
                {orgName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <span className="font-semibold text-sm block truncate">{orgName}</span>
              <span className="text-[10px] block" style={{ color: 'var(--muted)' }}>
                Powered by VioX AI
              </span>
            </div>
          </div>
        )}
        {collapsed && (
          branding.logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={branding.logoUrl}
              alt={orgName}
              className="w-9 h-9 rounded-lg object-cover shrink-0 mx-auto"
            />
          ) : (
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0 mx-auto"
              style={{
                background: accentBg,
                boxShadow: accentShadow,
              }}
            >
              {orgName.charAt(0).toUpperCase()}
            </div>
          )
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-md hover:bg-[var(--surface-2)] transition-colors shrink-0"
            style={{ color: 'var(--muted)' }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {collapsed && (
        <div className="flex justify-center py-2 border-b" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={() => setCollapsed(false)}
            className="p-1.5 rounded-md hover:bg-[var(--surface-2)] transition-colors"
            style={{ color: 'var(--muted)' }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
              style={collapsed ? { justifyContent: 'center', paddingLeft: '0.75rem', paddingRight: '0.75rem', marginLeft: 0, borderLeft: 'none' } : undefined}
            >
              <item.icon className="w-[1.125rem] h-[1.125rem] shrink-0 sidebar-icon" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}

        {/* Settings divider */}
        <div
          className="mx-2 my-3"
          style={{ height: '1px', background: 'var(--border)' }}
        />

        {!collapsed && (
          <p
            className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--muted)' }}
          >
            Settings
          </p>
        )}

        {settingsItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : undefined}
              style={collapsed ? { justifyContent: 'center', paddingLeft: '0.75rem', paddingRight: '0.75rem', marginLeft: 0, borderLeft: 'none' } : undefined}
            >
              <item.icon className="w-4 h-4 shrink-0 sidebar-icon" />
              {!collapsed && (
                <span className="text-[13px] truncate">{item.label}</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User section at bottom */}
      <div className="border-t p-3" style={{ borderColor: 'var(--border)' }}>
        {!collapsed ? (
          <div className="flex items-center gap-3 mb-3 px-1">
            <Avatar name={userName || 'User'} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{userName || 'User'}</p>
              {userRole && (
                <span className="badge badge-accent text-[10px] mt-0.5">
                  {userRole}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex justify-center mb-3">
            <Avatar name={userName || 'User'} size="sm" />
          </div>
        )}

        {collapsed ? (
          <div className="flex justify-center mb-1">
            <ThemeToggle compact />
          </div>
        ) : (
          <ThemeToggle showLabel />
        )}

        <button
          onClick={handleLogout}
          className="sidebar-item w-full"
          title={collapsed ? 'Logout' : undefined}
          style={collapsed ? { justifyContent: 'center', paddingLeft: '0.75rem', paddingRight: '0.75rem', marginLeft: 0, borderLeft: 'none' } : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="text-[13px]">Logout</span>}
        </button>

        {/* Powered by VioX AI */}
        {!collapsed && (
          <p className="text-center text-[9px] mt-3 tracking-wide" style={{ color: 'var(--muted)', opacity: 0.6 }}>
            Powered by VioX AI
          </p>
        )}
      </div>
    </aside>
  )
}
