'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import PortalNav from '@/components/portal/PortalNav'
import { Save, Loader2, CheckCircle2 } from 'lucide-react'

interface ContactData {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
}

export default function PortalProfilePage() {
  const [contact, setContact] = useState<ContactData | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/portal-login')
        return
      }

      const { data: contacts } = await supabase
        .from('contacts')
        .select('*')
        .eq('email', user.email)
        .limit(1)

      if (contacts && contacts.length > 0) {
        const c = contacts[0]
        setContact(c)
        setFirstName(c.first_name || '')
        setLastName(c.last_name || '')
        setEmail(c.email || '')
        setPhone(c.phone || '')
      }

      setLoading(false)
    }

    loadData()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!contact) return

    setSaving(true)
    setError('')
    setSaved(false)

    const { error: updateError } = await supabase
      .from('contacts')
      .update({
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
      })
      .eq('id', contact.id)

    if (updateError) {
      setError(updateError.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <>
        <PortalNav userName="" />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="animate-spin" size={32} style={{ color: '#8B7355' }} />
        </div>
      </>
    )
  }

  return (
    <>
      <PortalNav userName={contact ? `${contact.first_name} ${contact.last_name}` : ''} />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1
            className="portal-heading"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: '2rem',
              fontWeight: 600,
              color: '#334155',
              marginBottom: '0.375rem',
            }}
          >
            Your Profile
          </h1>
          <p
            style={{
              fontFamily: "'Jost', system-ui, sans-serif",
              fontSize: '1rem',
              color: '#8B7355',
            }}
          >
            Update your personal information.
          </p>
        </div>

        <div className="portal-card">
          <form onSubmit={handleSave} className="space-y-6">
            {error && (
              <div
                className="p-3 rounded-lg text-sm"
                style={{
                  background: 'rgba(196, 91, 75, 0.08)',
                  color: '#C45B4B',
                  fontFamily: "'Jost', system-ui, sans-serif",
                }}
              >
                {error}
              </div>
            )}

            {saved && (
              <div
                className="p-3 rounded-lg text-sm flex items-center gap-2"
                style={{
                  background: 'rgba(107, 124, 110, 0.08)',
                  color: '#6B7C6E',
                  fontFamily: "'Jost', system-ui, sans-serif",
                }}
              >
                <CheckCircle2 size={16} />
                Profile updated successfully.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="first-name"
                  style={{
                    fontFamily: "'Jost', system-ui, sans-serif",
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#334155',
                  }}
                >
                  First Name
                </label>
                <input
                  id="first-name"
                  type="text"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className="w-full"
                  style={{ fontFamily: "'Jost', system-ui, sans-serif", height: '2.75rem' }}
                />
              </div>
              <div>
                <label
                  htmlFor="last-name"
                  style={{
                    fontFamily: "'Jost', system-ui, sans-serif",
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: '#334155',
                  }}
                >
                  Last Name
                </label>
                <input
                  id="last-name"
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className="w-full"
                  style={{ fontFamily: "'Jost', system-ui, sans-serif", height: '2.75rem' }}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="profile-email"
                style={{
                  fontFamily: "'Jost', system-ui, sans-serif",
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#334155',
                }}
              >
                Email
              </label>
              <input
                id="profile-email"
                type="email"
                value={email}
                disabled
                className="w-full"
                style={{
                  fontFamily: "'Jost', system-ui, sans-serif",
                  height: '2.75rem',
                  opacity: 0.6,
                  cursor: 'not-allowed',
                }}
              />
              <p
                style={{
                  fontFamily: "'Jost', system-ui, sans-serif",
                  fontSize: '0.75rem',
                  color: '#C9B8A8',
                  marginTop: '0.25rem',
                }}
              >
                Contact us to change your email address.
              </p>
            </div>

            <div>
              <label
                htmlFor="phone"
                style={{
                  fontFamily: "'Jost', system-ui, sans-serif",
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: '#334155',
                }}
              >
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
                className="w-full"
                style={{ fontFamily: "'Jost', system-ui, sans-serif", height: '2.75rem' }}
              />
            </div>

            {/* Notification preferences */}
            <div>
              <h3
                className="portal-heading"
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '0.75rem',
                  paddingTop: '0.5rem',
                  borderTop: '1px solid #E8E0D8',
                }}
              >
                Preferences
              </h3>
              <div className="space-y-3">
                <label
                  className="flex items-center gap-3"
                  style={{
                    fontFamily: "'Jost', system-ui, sans-serif",
                    fontSize: '0.875rem',
                    color: '#334155',
                    fontWeight: 400,
                    cursor: 'pointer',
                    marginBottom: 0,
                  }}
                >
                  <input
                    type="checkbox"
                    defaultChecked
                    style={{
                      width: 18,
                      height: 18,
                      accentColor: '#334155',
                      cursor: 'pointer',
                    }}
                  />
                  Email me about upcoming workshops
                </label>
                <label
                  className="flex items-center gap-3"
                  style={{
                    fontFamily: "'Jost', system-ui, sans-serif",
                    fontSize: '0.875rem',
                    color: '#334155',
                    fontWeight: 400,
                    cursor: 'pointer',
                    marginBottom: 0,
                  }}
                >
                  <input
                    type="checkbox"
                    defaultChecked
                    style={{
                      width: 18,
                      height: 18,
                      accentColor: '#334155',
                      cursor: 'pointer',
                    }}
                  />
                  Notify me when photos are ready
                </label>
                <label
                  className="flex items-center gap-3"
                  style={{
                    fontFamily: "'Jost', system-ui, sans-serif",
                    fontSize: '0.875rem',
                    color: '#334155',
                    fontWeight: 400,
                    cursor: 'pointer',
                    marginBottom: 0,
                  }}
                >
                  <input
                    type="checkbox"
                    style={{
                      width: 18,
                      height: 18,
                      accentColor: '#334155',
                      cursor: 'pointer',
                    }}
                  />
                  Receive promotional updates
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="portal-btn portal-btn-primary"
              style={{ fontSize: '0.9375rem' }}
            >
              {saving ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Save size={16} />
              )}
              Save Changes
            </button>
          </form>
        </div>

        {/* Branding footer */}
        <p
          className="text-center mt-12"
          style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: '0.875rem',
            color: '#C9B8A8',
            fontStyle: 'italic',
          }}
        >
          Part of DreamersJoy Floral Studio
        </p>
      </main>
    </>
  )
}
