'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import PortalNav from '@/components/portal/PortalNav'
import crmConfig from '@/crm.config'
import { CalendarDays, Image, UserCircle, ArrowRight, Loader2 } from 'lucide-react'

interface Contact {
  id: string
  first_name: string
  last_name: string
  email: string
}

interface Deal {
  id: string
  title: string
  value: number
  stage: string
  created_at: string
}

export default function PortalDashboard() {
  const [contact, setContact] = useState<Contact | null>(null)
  const [upcomingDeals, setUpcomingDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/portal-login')
        return
      }

      // Find contact by auth user email
      const { data: contacts } = await supabase
        .from('contacts')
        .select('*')
        .eq('email', user.email)
        .limit(1)

      if (contacts && contacts.length > 0) {
        setContact(contacts[0])

        // Get deals linked to this contact
        const { data: deals } = await supabase
          .from('deals')
          .select('*')
          .eq('contact_id', contacts[0].id)
          .order('created_at', { ascending: false })
          .limit(5)

        if (deals) setUpcomingDeals(deals)
      }

      setLoading(false)
    }

    loadData()
  }, [])

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

  const firstName = contact?.first_name || 'there'

  return (
    <>
      <PortalNav userName={contact ? `${contact.first_name} ${contact.last_name}` : ''} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Welcome */}
        <div className="mb-10">
          <h1
            className="portal-heading"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: '2rem',
              fontWeight: 600,
              color: '#334155',
              marginBottom: '0.5rem',
            }}
          >
            Welcome back, {firstName}
          </h1>
          <p
            style={{
              fontFamily: "'Jost', system-ui, sans-serif",
              fontSize: '1rem',
              color: '#8B7355',
            }}
          >
            Here is an overview of your {crmConfig.name} experience.
          </p>
        </div>

        {/* Dashboard cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Upcoming Workshops */}
          <a
            href="/portal/bookings"
            className="portal-card no-underline group"
            style={{ display: 'block' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="flex items-center justify-center rounded-lg"
                style={{
                  width: 40,
                  height: 40,
                  background: 'rgba(107, 124, 110, 0.1)',
                  color: '#6B7C6E',
                }}
              >
                <CalendarDays size={20} />
              </div>
              <h2
                className="portal-heading"
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: '#334155',
                }}
              >
                Upcoming Workshops
              </h2>
            </div>
            <p
              style={{
                fontFamily: "'Jost', system-ui, sans-serif",
                fontSize: '2rem',
                fontWeight: 500,
                color: '#334155',
                marginBottom: '0.25rem',
              }}
            >
              {upcomingDeals.filter(d => d.stage !== 'closed_won' && d.stage !== 'closed_lost').length}
            </p>
            <div className="flex items-center gap-1" style={{ color: '#8B7355', fontSize: '0.875rem' }}>
              <span style={{ fontFamily: "'Jost', system-ui, sans-serif" }}>View bookings</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </a>

          {/* Recent Photos */}
          <a
            href="/portal/gallery"
            className="portal-card no-underline group"
            style={{ display: 'block' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="flex items-center justify-center rounded-lg"
                style={{
                  width: 40,
                  height: 40,
                  background: 'rgba(212, 184, 160, 0.2)',
                  color: '#8B7355',
                }}
              >
                <Image size={20} />
              </div>
              <h2
                className="portal-heading"
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: '#334155',
                }}
              >
                Recent Photos
              </h2>
            </div>
            <p
              style={{
                fontFamily: "'Jost', system-ui, sans-serif",
                fontSize: '0.875rem',
                color: '#8B7355',
                lineHeight: 1.6,
              }}
            >
              View photos from your recent workshops and events.
            </p>
            <div className="flex items-center gap-1 mt-3" style={{ color: '#8B7355', fontSize: '0.875rem' }}>
              <span style={{ fontFamily: "'Jost', system-ui, sans-serif" }}>View gallery</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </a>

          {/* Account Info */}
          <a
            href="/portal/profile"
            className="portal-card no-underline group"
            style={{ display: 'block' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="flex items-center justify-center rounded-lg"
                style={{
                  width: 40,
                  height: 40,
                  background: 'rgba(51, 65, 85, 0.08)',
                  color: '#334155',
                }}
              >
                <UserCircle size={20} />
              </div>
              <h2
                className="portal-heading"
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: '#334155',
                }}
              >
                Account Info
              </h2>
            </div>
            <p
              style={{
                fontFamily: "'Jost', system-ui, sans-serif",
                fontSize: '0.875rem',
                color: '#8B7355',
                lineHeight: 1.6,
              }}
            >
              {contact?.email || 'Manage your profile and preferences.'}
            </p>
            <div className="flex items-center gap-1 mt-3" style={{ color: '#8B7355', fontSize: '0.875rem' }}>
              <span style={{ fontFamily: "'Jost', system-ui, sans-serif" }}>Edit profile</span>
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </a>
        </div>

        {/* Recent bookings table */}
        {upcomingDeals.length > 0 && (
          <div>
            <h2
              className="portal-heading mb-4"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: '1.5rem',
                fontWeight: 600,
                color: '#334155',
              }}
            >
              Recent Activity
            </h2>
            <div
              className="portal-card overflow-hidden"
              style={{ padding: 0 }}
            >
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#F5F0EB' }}>
                    <th
                      style={{
                        fontFamily: "'Jost', system-ui, sans-serif",
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#8B7355',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        padding: '0.75rem 1rem',
                        textAlign: 'left',
                        borderBottom: '1px solid #E8E0D8',
                      }}
                    >
                      Workshop
                    </th>
                    <th
                      style={{
                        fontFamily: "'Jost', system-ui, sans-serif",
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#8B7355',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        padding: '0.75rem 1rem',
                        textAlign: 'left',
                        borderBottom: '1px solid #E8E0D8',
                      }}
                    >
                      Status
                    </th>
                    <th
                      style={{
                        fontFamily: "'Jost', system-ui, sans-serif",
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: '#8B7355',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        padding: '0.75rem 1rem',
                        textAlign: 'right',
                        borderBottom: '1px solid #E8E0D8',
                      }}
                    >
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingDeals.map(deal => (
                    <tr key={deal.id}>
                      <td
                        style={{
                          fontFamily: "'Jost', system-ui, sans-serif",
                          fontSize: '0.875rem',
                          color: '#334155',
                          padding: '0.75rem 1rem',
                          borderBottom: '1px solid #E8E0D8',
                        }}
                      >
                        {deal.title}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #E8E0D8' }}>
                        <span
                          className={`portal-badge ${
                            deal.stage === 'closed_won'
                              ? 'portal-badge-completed'
                              : deal.stage === 'proposal' || deal.stage === 'negotiation'
                              ? 'portal-badge-confirmed'
                              : 'portal-badge-pending'
                          }`}
                        >
                          {deal.stage === 'closed_won'
                            ? 'Completed'
                            : deal.stage === 'proposal' || deal.stage === 'negotiation'
                            ? 'Confirmed'
                            : 'Pending'}
                        </span>
                      </td>
                      <td
                        style={{
                          fontFamily: "'Jost', system-ui, sans-serif",
                          fontSize: '0.875rem',
                          color: '#334155',
                          padding: '0.75rem 1rem',
                          textAlign: 'right',
                          borderBottom: '1px solid #E8E0D8',
                        }}
                      >
                        ${deal.value?.toLocaleString() ?? '0'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
