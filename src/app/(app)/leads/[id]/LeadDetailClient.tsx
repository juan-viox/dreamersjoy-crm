'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import Link from 'next/link'
import {
  ArrowLeft,
  Mail,
  Phone as PhoneIcon,
  Building2,
  Tag,
  Briefcase,
  Clock,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Zap,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/shared/Avatar'
import ContactTimeline from '@/components/contacts/ContactTimeline'
import { formatDate } from '@/lib/utils'

export default function LeadDetailClient({
  contact,
  activities,
  hasDeal,
  firstStageId,
  firstStageName,
}: {
  contact: any
  activities: any[]
  hasDeal: boolean
  firstStageId: string | null
  firstStageName: string | null
}) {
  const [converting, setConverting] = useState(false)
  const [converted, setConverted] = useState(hasDeal)
  const router = useRouter()
  const supabase = createClient()
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!containerRef.current) return
    gsap.from(containerRef.current, {
      opacity: 0,
      y: 12,
      duration: 0.35,
      ease: 'power2.out',
    })
  }, [])

  async function handleConvert() {
    if (!firstStageId || converting) return
    setConverting(true)

    try {
      // Create a deal from this lead
      const { data: deal, error } = await supabase
        .from('deals')
        .insert({
          contact_id: contact.id,
          company_id: contact.company_id || null,
          stage_id: firstStageId,
          title: `${contact.first_name} ${contact.last_name} - Deal`,
          amount: 0,
          currency: 'USD',
          status: 'open',
        })
        .select()
        .single()

      if (error) throw error

      // Update contact status to active
      await supabase
        .from('contacts')
        .update({ status: 'active' })
        .eq('id', contact.id)

      setConverted(true)

      // Navigate to the new deal
      setTimeout(() => {
        router.push(`/deals/${deal.id}`)
      }, 1500)
    } catch (err) {
      console.error('Failed to convert lead:', err)
      setConverting(false)
    }
  }

  const sourceColors: Record<string, string> = {
    web_form: '#74b9ff',
    newsletter: '#a29bfe',
    voice_agent: '#fd79a8',
    booking: '#00b894',
    manual: '#fdcb6e',
    referral: '#6c5ce7',
    unknown: '#8888a0',
  }

  const srcColor = sourceColors[contact.source || 'unknown'] || '#8888a0'

  return (
    <div ref={containerRef}>
      <Link
        href="/leads"
        className="inline-flex items-center gap-1.5 text-sm mb-6 hover:underline transition-colors"
        style={{ color: 'var(--muted)' }}
      >
        <ArrowLeft className="w-4 h-4" /> Back to leads
      </Link>

      {/* Hero */}
      <div className="card mb-6 p-0 overflow-hidden">
        <div
          className="h-1"
          style={{
            background: `linear-gradient(135deg, ${srcColor} 0%, var(--accent) 100%)`,
          }}
        />
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <Avatar
              name={`${contact.first_name} ${contact.last_name}`}
              size="lg"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h1 className="text-2xl font-bold">
                    {contact.first_name} {contact.last_name}
                  </h1>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {contact.title && (
                      <span
                        className="text-sm"
                        style={{ color: 'var(--muted)' }}
                      >
                        {contact.title}
                      </span>
                    )}
                    {contact.company?.name && (
                      <span
                        className="text-sm"
                        style={{ color: 'var(--muted)' }}
                      >
                        at {contact.company.name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="badge badge-accent badge-dot">Lead</span>
                  {contact.source && (
                    <span
                      className="badge"
                      style={{
                        background: `${srcColor}15`,
                        color: srcColor,
                      }}
                    >
                      {contact.source.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>

              {/* Convert CTA */}
              <div className="mt-4">
                {converted ? (
                  <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--success)' }}>
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-medium">
                      Converted to deal! Redirecting...
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={handleConvert}
                    disabled={converting || !firstStageId}
                    className="btn btn-primary"
                  >
                    {converting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4" />
                    )}
                    Convert to Deal
                    {firstStageName && (
                      <span className="flex items-center gap-1 text-xs opacity-80">
                        <ArrowRight className="w-3 h-3" />
                        {firstStageName}
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline */}
        <div className="lg:col-span-2">
          <div className="card">
            <h3
              className="text-sm font-semibold mb-4"
              style={{ color: 'var(--muted)' }}
            >
              Activity Timeline
            </h3>
            <ContactTimeline activities={activities} />
          </div>
        </div>

        {/* Info */}
        <div className="space-y-4">
          <div className="card">
            <h3
              className="text-sm font-semibold mb-4"
              style={{ color: 'var(--muted)' }}
            >
              Lead Information
            </h3>

            <div className="space-y-3.5">
              {contact.email && (
                <div className="flex items-center gap-3 text-sm">
                  <div
                    className="p-1.5 rounded-md"
                    style={{ background: 'rgba(116,185,255,0.12)' }}
                  >
                    <Mail
                      className="w-3.5 h-3.5"
                      style={{ color: 'var(--info)' }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-xs"
                      style={{ color: 'var(--muted)' }}
                    >
                      Email
                    </p>
                    <p className="truncate">{contact.email}</p>
                  </div>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <div
                    className="p-1.5 rounded-md"
                    style={{ background: 'rgba(0,184,148,0.12)' }}
                  >
                    <PhoneIcon
                      className="w-3.5 h-3.5"
                      style={{ color: 'var(--success)' }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-xs"
                      style={{ color: 'var(--muted)' }}
                    >
                      Phone
                    </p>
                    <p>{contact.phone}</p>
                  </div>
                </div>
              )}
              {contact.company?.name && (
                <div className="flex items-center gap-3 text-sm">
                  <div
                    className="p-1.5 rounded-md"
                    style={{ background: 'rgba(108,92,231,0.12)' }}
                  >
                    <Building2
                      className="w-3.5 h-3.5"
                      style={{ color: 'var(--accent-light)' }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-xs"
                      style={{ color: 'var(--muted)' }}
                    >
                      Company
                    </p>
                    <p>{contact.company.name}</p>
                  </div>
                </div>
              )}
              {contact.source && (
                <div className="flex items-center gap-3 text-sm">
                  <div
                    className="p-1.5 rounded-md"
                    style={{ background: 'rgba(253,203,110,0.12)' }}
                  >
                    <Tag
                      className="w-3.5 h-3.5"
                      style={{ color: 'var(--warning)' }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p
                      className="text-xs"
                      style={{ color: 'var(--muted)' }}
                    >
                      Source
                    </p>
                    <p>{contact.source.replace('_', ' ')}</p>
                  </div>
                </div>
              )}
            </div>

            {contact.notes && (
              <div
                className="mt-4 pt-4 border-t"
                style={{ borderColor: 'var(--border)' }}
              >
                <p
                  className="text-xs font-medium mb-1.5"
                  style={{ color: 'var(--muted)' }}
                >
                  Notes
                </p>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {contact.notes}
                </p>
              </div>
            )}

            <div
              className="mt-4 pt-4 border-t flex items-center gap-1.5"
              style={{ borderColor: 'var(--border)' }}
            >
              <Clock
                className="w-3.5 h-3.5"
                style={{ color: 'var(--muted)' }}
              />
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Created {formatDate(contact.created_at)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
