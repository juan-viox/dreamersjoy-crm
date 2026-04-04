'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Loader2 } from 'lucide-react'
import crmConfig from '@/crm.config'

export default function PortalLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const branding = crmConfig.branding

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push('/portal')
    router.refresh()
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: branding.secondaryColor }}
    >
      <link
        href={`https://fonts.googleapis.com/css2?family=${branding.displayFont.replace(/ /g, '+')}:ital,wght@0,400;0,500;0,600;0,700;1,400&family=${branding.bodyFont.replace(/ /g, '+')}:wght@300;400;500;600&display=swap`}
        rel="stylesheet"
      />
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          {branding.logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={branding.logoUrl}
              alt={crmConfig.name}
              className="mx-auto mb-4"
              style={{ height: 56, objectFit: 'contain' }}
            />
          ) : (
            <div
              className="inline-flex items-center justify-center rounded-full mx-auto mb-5"
              style={{
                width: 64,
                height: 64,
                background: branding.primaryColor,
                color: branding.lightColor,
                fontFamily: `'${branding.displayFont}', Georgia, serif`,
                fontSize: '1.75rem',
                fontWeight: 600,
              }}
            >
              {crmConfig.name.charAt(0)}
            </div>
          )}
          <h1
            style={{
              fontFamily: `'${branding.displayFont}', Georgia, serif`,
              fontSize: '2.25rem',
              fontWeight: 600,
              color: branding.primaryColor,
              letterSpacing: '-0.02em',
              marginBottom: '0.5rem',
            }}
          >
            Welcome Back
          </h1>
          <p
            style={{
              fontFamily: `'${branding.bodyFont}', system-ui, sans-serif`,
              fontSize: '1rem',
              color: branding.accentColor,
              fontWeight: 400,
            }}
          >
            {crmConfig.tagline || 'Access your account'}
          </p>
        </div>

        {/* Login card */}
        <div
          style={{
            background: '#FFFFFF',
            border: `1px solid ${branding.accentColor}20`,
            borderRadius: '0.75rem',
            padding: '2rem',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
          }}
        >
          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div
                className="p-3 rounded-lg text-sm"
                style={{
                  background: 'rgba(196, 91, 75, 0.08)',
                  color: '#C45B4B',
                  fontFamily: `'${branding.bodyFont}', system-ui, sans-serif`,
                }}
              >
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="portal-email"
                style={{
                  fontFamily: `'${branding.bodyFont}', system-ui, sans-serif`,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: branding.primaryColor,
                  marginBottom: '0.375rem',
                  display: 'block',
                }}
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  size={16}
                  style={{ color: branding.accentColor }}
                />
                <input
                  id="portal-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full pl-10"
                  style={{
                    fontFamily: `'${branding.bodyFont}', system-ui, sans-serif`,
                    height: '2.75rem',
                  }}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="portal-password"
                style={{
                  fontFamily: `'${branding.bodyFont}', system-ui, sans-serif`,
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: branding.primaryColor,
                  marginBottom: '0.375rem',
                  display: 'block',
                }}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  size={16}
                  style={{ color: branding.accentColor }}
                />
                <input
                  id="portal-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Your password"
                  required
                  className="w-full pl-10"
                  style={{
                    fontFamily: `'${branding.bodyFont}', system-ui, sans-serif`,
                    height: '2.75rem',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-opacity"
              style={{
                background: branding.primaryColor,
                color: branding.secondaryColor,
                fontFamily: `'${branding.bodyFont}', system-ui, sans-serif`,
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                height: '2.75rem',
                fontSize: '0.9375rem',
                borderRadius: '0.5rem',
              }}
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p
            className="text-center mt-6"
            style={{
              fontFamily: `'${branding.bodyFont}', system-ui, sans-serif`,
              fontSize: '0.875rem',
              color: branding.accentColor,
            }}
          >
            Don&apos;t have an account?{' '}
            <a
              href={`mailto:${crmConfig.email}`}
              style={{ color: branding.accentColor, fontWeight: 500, textDecoration: 'underline' }}
            >
              Contact us
            </a>
          </p>
        </div>

        {/* Branding footer */}
        <p
          className="text-center mt-8"
          style={{
            fontFamily: `'${branding.displayFont}', Georgia, serif`,
            fontSize: '0.875rem',
            color: branding.accentColor,
            fontStyle: 'italic',
            opacity: 0.6,
          }}
        >
          {crmConfig.name}
        </p>
      </div>
    </div>
  )
}
