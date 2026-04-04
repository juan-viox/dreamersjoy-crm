'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserPlus, Mail, Lock, Loader2 } from 'lucide-react'
import crmConfig from '@/crm.config'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const branding = crmConfig.branding
  const accentColor = branding.primaryColor

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { full_name: fullName },
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (!authData.user) {
      setError('Signup failed. Please try again.')
      setLoading(false)
      return
    }

    // Create profile via admin API
    const setupRes = await fetch('/api/auth/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: authData.user.id,
        email,
        fullName,
      }),
    })

    const setupData = await setupRes.json()
    if (!setupRes.ok) {
      setError(setupData.error || 'Failed to create account')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)

    if (authData.session) {
      router.push('/dashboard')
      router.refresh()
    }
  }

  if (success) {
    return (
      <div className="card text-center animate-fade-in">
        <Mail className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--success)' }} />
        <h2 className="text-xl font-bold mb-2">Check your email</h2>
        <p style={{ color: 'var(--muted)' }}>
          We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
        </p>
        <Link href="/login" className="btn btn-primary mt-6 mx-auto">
          Back to login
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-8">
        {branding.logoUrl ? (
          <div className="flex flex-col items-center gap-3 mb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={branding.logoUrl}
              alt={crmConfig.name}
              className="w-16 h-16 rounded-xl object-cover"
            />
            <h1 className="text-2xl font-bold">{crmConfig.name}</h1>
          </div>
        ) : (
          <h1 className="text-3xl font-bold mb-2">
            <span style={{ color: accentColor }}>{crmConfig.name}</span>
          </h1>
        )}
        <p style={{ color: 'var(--muted)' }}>Create your account</p>
      </div>

      <div className="card">
        <form onSubmit={handleSignup} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(225, 112, 85, 0.1)', color: 'var(--danger)' }}>
              {error}
            </div>
          )}

          <div>
            <label htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="John Doe"
              required
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="email">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted)' }} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full pl-10"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted)' }} />
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                required
                minLength={6}
                className="w-full pl-10"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full justify-center"
            style={{ background: branding.primaryColor }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Create Account
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--muted)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: branding.accentColor }} className="hover:underline">
            Sign in
          </Link>
        </p>

        <p className="text-center text-[10px] mt-4" style={{ color: 'var(--muted)', opacity: 0.5 }}>
          Powered by VioX AI
        </p>
      </div>
    </div>
  )
}
