'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import PortalNav from '@/components/portal/PortalNav'
import { CalendarDays, Clock, CheckCircle2, Loader2 } from 'lucide-react'

interface Deal {
  id: string
  title: string
  value: number
  stage: string
  created_at: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function getStatusInfo(stage: string) {
  if (stage === 'closed_won') return { label: 'Completed', badge: 'portal-badge-completed', icon: CheckCircle2 }
  if (stage === 'proposal' || stage === 'negotiation') return { label: 'Confirmed', badge: 'portal-badge-confirmed', icon: CalendarDays }
  return { label: 'Pending', badge: 'portal-badge-pending', icon: Clock }
}

export default function PortalBookingsPage() {
  const [userName, setUserName] = useState('')
  const [deals, setDeals] = useState<Deal[]>([])
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

      const { data: contacts } = await supabase
        .from('contacts')
        .select('*')
        .eq('email', user.email)
        .limit(1)

      if (contacts && contacts.length > 0) {
        setUserName(`${contacts[0].first_name} ${contacts[0].last_name}`)

        const { data: dealsData } = await supabase
          .from('deals')
          .select('*')
          .eq('contact_id', contacts[0].id)
          .order('created_at', { ascending: false })

        if (dealsData) setDeals(dealsData)
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

  const upcoming = deals.filter(d => d.stage !== 'closed_won' && d.stage !== 'closed_lost')
  const past = deals.filter(d => d.stage === 'closed_won' || d.stage === 'closed_lost')

  return (
    <>
      <PortalNav userName={userName} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
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
            Your Bookings
          </h1>
          <p
            style={{
              fontFamily: "'Jost', system-ui, sans-serif",
              fontSize: '1rem',
              color: '#8B7355',
            }}
          >
            View and track your workshop bookings.
          </p>
        </div>

        {/* Upcoming */}
        <section className="mb-10">
          <h2
            className="portal-heading mb-4"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: '1.375rem',
              fontWeight: 600,
              color: '#334155',
            }}
          >
            Upcoming
          </h2>

          {upcoming.length === 0 ? (
            <div
              className="portal-card text-center py-12"
              style={{ fontFamily: "'Jost', system-ui, sans-serif" }}
            >
              <CalendarDays
                size={40}
                style={{ color: '#C9B8A8', margin: '0 auto 1rem' }}
              />
              <p style={{ color: '#8B7355', fontSize: '0.9375rem' }}>
                No upcoming workshops scheduled.
              </p>
              <p style={{ color: '#C9B8A8', fontSize: '0.8125rem', marginTop: '0.25rem' }}>
                Contact us to book your next experience.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcoming.map(deal => {
                const status = getStatusInfo(deal.stage)
                const StatusIcon = status.icon
                return (
                  <div key={deal.id} className="portal-card">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className="flex items-center justify-center rounded-lg mt-0.5"
                          style={{
                            width: 40,
                            height: 40,
                            background: 'rgba(107, 124, 110, 0.1)',
                            color: '#6B7C6E',
                            flexShrink: 0,
                          }}
                        >
                          <StatusIcon size={20} />
                        </div>
                        <div>
                          <h3
                            style={{
                              fontFamily: "'Jost', system-ui, sans-serif",
                              fontSize: '1rem',
                              fontWeight: 500,
                              color: '#334155',
                              marginBottom: '0.25rem',
                            }}
                          >
                            {deal.title}
                          </h3>
                          <p
                            style={{
                              fontFamily: "'Jost', system-ui, sans-serif",
                              fontSize: '0.8125rem',
                              color: '#8B7355',
                            }}
                          >
                            Booked {formatDate(deal.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 sm:text-right">
                        <span className={`portal-badge ${status.badge}`}>{status.label}</span>
                        <span
                          style={{
                            fontFamily: "'Jost', system-ui, sans-serif",
                            fontSize: '1rem',
                            fontWeight: 500,
                            color: '#334155',
                          }}
                        >
                          ${deal.value?.toLocaleString() ?? '0'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Past bookings */}
        {past.length > 0 && (
          <section>
            <h2
              className="portal-heading mb-4"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: '1.375rem',
                fontWeight: 600,
                color: '#334155',
              }}
            >
              Past Workshops
            </h2>
            <div className="space-y-3">
              {past.map(deal => {
                const status = getStatusInfo(deal.stage)
                return (
                  <div
                    key={deal.id}
                    className="portal-card"
                    style={{ opacity: 0.75 }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h3
                          style={{
                            fontFamily: "'Jost', system-ui, sans-serif",
                            fontSize: '1rem',
                            fontWeight: 500,
                            color: '#334155',
                            marginBottom: '0.25rem',
                          }}
                        >
                          {deal.title}
                        </h3>
                        <p
                          style={{
                            fontFamily: "'Jost', system-ui, sans-serif",
                            fontSize: '0.8125rem',
                            color: '#8B7355',
                          }}
                        >
                          {formatDate(deal.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`portal-badge ${status.badge}`}>{status.label}</span>
                        <span
                          style={{
                            fontFamily: "'Jost', system-ui, sans-serif",
                            fontSize: '1rem',
                            fontWeight: 500,
                            color: '#334155',
                          }}
                        >
                          ${deal.value?.toLocaleString() ?? '0'}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </main>
    </>
  )
}
