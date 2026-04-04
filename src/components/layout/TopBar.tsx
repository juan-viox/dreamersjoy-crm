'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Search,
  Plus,
  ChevronRight,
  Settings,
  LogOut,
  UserPlus,
  Handshake,
  Activity,
  Command,
} from 'lucide-react'
import Avatar from '@/components/shared/Avatar'
import NotificationPanel from '@/components/shared/NotificationPanel'
import ThemeToggle from '@/components/shared/ThemeToggle'

const quickAddItems = [
  { label: 'New Contact', href: '/contacts/new', icon: UserPlus },
  { label: 'New Deal', href: '/deals/new', icon: Handshake },
  { label: 'New Lead', href: '/leads/new', icon: UserPlus },
  { label: 'Log Activity', href: '/activities', icon: Activity },
]

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  const crumbs: { label: string; href: string }[] = []
  let path = ''
  for (const seg of segments) {
    path += '/' + seg
    if (seg.length > 20) continue
    crumbs.push({
      label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '),
      href: path,
    })
  }
  return crumbs
}

export default function TopBar({
  userName,
  orgName,
}: {
  userName: string
  orgName?: string
}) {
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const pathname = usePathname()
  const breadcrumbs = getBreadcrumbs(pathname)
  const quickAddRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (quickAddRef.current && !quickAddRef.current.contains(e.target as Node)) {
        setShowQuickAdd(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between px-6 py-2.5 border-b glass-strong"
      style={{ borderColor: 'var(--border)' }}
    >
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        <nav className="flex items-center gap-1 text-sm">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.href} className="flex items-center gap-1">
              {i > 0 && (
                <ChevronRight
                  className="w-3.5 h-3.5"
                  style={{ color: 'var(--muted)' }}
                />
              )}
              {i === breadcrumbs.length - 1 ? (
                <span className="font-medium">{crumb.label}</span>
              ) : (
                <Link
                  href={crumb.href}
                  className="hover:underline"
                  style={{ color: 'var(--muted)' }}
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* Center: Search — opens CommandPalette */}
      <button
        onClick={() => {
          document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))
        }}
        className="search-input-wrapper flex-1 max-w-md mx-6 cursor-pointer"
      >
        <Search className="search-icon w-4 h-4" />
        <span className="flex-1 text-sm text-left" style={{ color: 'var(--muted)' }}>
          Search contacts, deals, companies...
        </span>
        <span className="search-shortcut flex items-center gap-0.5">
          <Command className="w-3 h-3" />K
        </span>
      </button>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Quick Add */}
        <div ref={quickAddRef} className="relative">
          <button
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className="btn btn-primary btn-sm"
            style={{ padding: '0.375rem 0.75rem' }}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Quick Add</span>
          </button>

          {showQuickAdd && (
            <div className="dropdown-menu absolute right-0 top-full mt-1.5">
              {quickAddItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="dropdown-item"
                  onClick={() => setShowQuickAdd(false)}
                >
                  <item.icon className="w-4 h-4" style={{ color: 'var(--accent-light)' }} />
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <ThemeToggle compact />

        {/* Notifications */}
        <NotificationPanel />

        {/* User menu */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[var(--surface-2)] transition-colors"
          >
            <Avatar name={userName} size="sm" />
            <span className="text-sm font-medium hidden lg:block">{userName}</span>
          </button>

          {showUserMenu && (
            <div className="dropdown-menu absolute right-0 top-full mt-1.5 w-56">
              <div className="px-3 py-2 mb-1">
                <p className="text-sm font-semibold">{userName}</p>
                {orgName && (
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    {orgName}
                  </p>
                )}
              </div>
              <div className="dropdown-divider" />
              <Link
                href="/settings"
                className="dropdown-item"
                onClick={() => setShowUserMenu(false)}
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <div className="dropdown-divider" />
              <button
                className="dropdown-item"
                style={{ color: 'var(--danger)' }}
                onClick={() => setShowUserMenu(false)}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
