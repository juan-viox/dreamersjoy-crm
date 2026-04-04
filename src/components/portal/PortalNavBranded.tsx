'use client'

import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Menu, X, LogOut, LayoutDashboard, CalendarDays, Image, UserCircle } from 'lucide-react'

interface OrgBranding {
  name: string
  primary_color: string
  secondary_color: string
  accent_color: string
  display_font: string
  body_font: string
  logo_url: string | null
}

interface PortalNavBrandedProps {
  branding: OrgBranding
  userName: string
  basePath: string // e.g. "/portal/dreamersjoy"
}

export default function PortalNavBranded({ branding, userName, basePath }: PortalNavBrandedProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const navLinks = [
    { href: basePath, label: 'Dashboard', icon: LayoutDashboard },
    { href: `${basePath}/bookings`, label: 'Bookings', icon: CalendarDays },
    { href: `${basePath}/gallery`, label: 'Gallery', icon: Image },
    { href: `${basePath}/profile`, label: 'Profile', icon: UserCircle },
  ]

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push(`${basePath}/login`)
    router.refresh()
  }

  function isActive(href: string) {
    if (href === basePath) return pathname === basePath
    return pathname.startsWith(href)
  }

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: '#FFFFFF',
        borderBottom: `1px solid ${branding.accent_color}20`,
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href={basePath} className="flex items-center gap-3 no-underline">
            {branding.logo_url ? (
              <img
                src={branding.logo_url}
                alt={branding.name}
                style={{ height: 36, objectFit: 'contain' }}
              />
            ) : (
              <div
                className="flex items-center justify-center rounded-full text-white text-sm font-bold"
                style={{
                  width: 36,
                  height: 36,
                  background: branding.primary_color,
                  fontFamily: `'${branding.display_font}', Georgia, serif`,
                  fontSize: '1.125rem',
                  fontWeight: 600,
                }}
              >
                {branding.name.charAt(0)}
              </div>
            )}
            <span
              className="hidden sm:block"
              style={{
                fontFamily: `'${branding.display_font}', Georgia, serif`,
                fontSize: '1.25rem',
                fontWeight: 600,
                color: branding.primary_color,
                letterSpacing: '-0.01em',
              }}
            >
              {branding.name}
            </span>
          </a>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = isActive(link.href)
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className="no-underline flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors"
                  style={{
                    fontFamily: `'${branding.body_font}', system-ui, sans-serif`,
                    fontWeight: active ? 500 : 400,
                    color: active ? branding.primary_color : branding.accent_color,
                    background: active ? branding.secondary_color : 'transparent',
                    borderBottom: active ? `2px solid ${branding.accent_color}` : '2px solid transparent',
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
                fontFamily: `'${branding.body_font}', system-ui, sans-serif`,
                color: branding.accent_color,
              }}
            >
              {userName}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md transition-colors"
              style={{
                fontFamily: `'${branding.body_font}', system-ui, sans-serif`,
                color: branding.accent_color,
                background: 'transparent',
                border: `1px solid ${branding.accent_color}30`,
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
              width: 40, height: 40,
              background: 'transparent', border: 'none',
              color: branding.primary_color, cursor: 'pointer',
            }}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div style={{ background: '#FFFFFF', borderTop: `1px solid ${branding.accent_color}20` }}>
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => {
              const active = isActive(link.href)
              return (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="no-underline flex items-center gap-3 px-3 py-2.5 rounded-md text-sm"
                  style={{
                    fontFamily: `'${branding.body_font}', system-ui, sans-serif`,
                    fontWeight: active ? 500 : 400,
                    color: active ? branding.primary_color : branding.accent_color,
                    background: active ? branding.secondary_color : 'transparent',
                  }}
                >
                  <link.icon size={18} />
                  {link.label}
                </a>
              )
            })}
            <div style={{ borderTop: `1px solid ${branding.accent_color}20`, margin: '0.5rem 0' }} />
            <div className="px-3 py-2 flex items-center justify-between">
              <span className="text-sm" style={{ fontFamily: `'${branding.body_font}', system-ui, sans-serif`, color: branding.accent_color }}>
                {userName}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md"
                style={{
                  fontFamily: `'${branding.body_font}', system-ui, sans-serif`,
                  color: '#C45B4B', background: 'transparent',
                  border: `1px solid ${branding.accent_color}30`, cursor: 'pointer',
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
