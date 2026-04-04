'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Menu, X, LogOut, LayoutDashboard, CalendarDays, Image, UserCircle } from 'lucide-react'

const navLinks = [
  { href: '/portal', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/portal/bookings', label: 'Bookings', icon: CalendarDays },
  { href: '/portal/gallery', label: 'Gallery', icon: Image },
  { href: '/portal/profile', label: 'Profile', icon: UserCircle },
]

interface PortalNavProps {
  userName: string
}

export default function PortalNav({ userName }: PortalNavProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/portal-login')
    router.refresh()
  }

  function isActive(href: string) {
    if (href === '/portal') return pathname === '/portal'
    return pathname.startsWith(href)
  }

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E8E0D8',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/portal" className="flex items-center gap-3 no-underline">
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: 36,
                height: 36,
                background: '#334155',
                color: '#FAFAF8',
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: '1.125rem',
                fontWeight: 600,
              }}
            >
              D
            </div>
            <span
              className="hidden sm:block portal-heading"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#334155',
                letterSpacing: '-0.01em',
              }}
            >
              DreamersJoy
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => {
              const active = isActive(link.href)
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className="no-underline flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors"
                  style={{
                    fontFamily: "'Jost', system-ui, sans-serif",
                    fontWeight: active ? 500 : 400,
                    color: active ? '#334155' : '#8B7355',
                    background: active ? '#F5F0EB' : 'transparent',
                    borderBottom: active ? '2px solid #8B7355' : '2px solid transparent',
                  }}
                >
                  <link.icon size={16} />
                  {link.label}
                </a>
              )
            })}
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-4">
            <span
              className="text-sm"
              style={{
                fontFamily: "'Jost', system-ui, sans-serif",
                color: '#8B7355',
              }}
            >
              {userName}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition-colors"
              style={{
                fontFamily: "'Jost', system-ui, sans-serif",
                color: '#8B7355',
                background: 'transparent',
                border: '1px solid #E8E0D8',
                cursor: 'pointer',
              }}
            >
              <LogOut size={14} />
              Logout
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex items-center justify-center"
            style={{
              width: 40,
              height: 40,
              background: 'transparent',
              border: 'none',
              color: '#334155',
              cursor: 'pointer',
            }}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="md:hidden"
          style={{
            background: '#FFFFFF',
            borderTop: '1px solid #E8E0D8',
          }}
        >
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(link => {
              const active = isActive(link.href)
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="no-underline flex items-center gap-3 px-3 py-2.5 rounded-md text-sm"
                  style={{
                    fontFamily: "'Jost', system-ui, sans-serif",
                    fontWeight: active ? 500 : 400,
                    color: active ? '#334155' : '#8B7355',
                    background: active ? '#F5F0EB' : 'transparent',
                  }}
                >
                  <link.icon size={18} />
                  {link.label}
                </a>
              )
            })}
            <div style={{ borderTop: '1px solid #E8E0D8', margin: '0.5rem 0' }} />
            <div className="px-3 py-2 flex items-center justify-between">
              <span
                className="text-sm"
                style={{
                  fontFamily: "'Jost', system-ui, sans-serif",
                  color: '#8B7355',
                }}
              >
                {userName}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md"
                style={{
                  fontFamily: "'Jost', system-ui, sans-serif",
                  color: '#C45B4B',
                  background: 'transparent',
                  border: '1px solid #E8E0D8',
                  cursor: 'pointer',
                }}
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
