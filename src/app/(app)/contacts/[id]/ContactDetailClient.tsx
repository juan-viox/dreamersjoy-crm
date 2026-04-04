'use client'

import { useState, useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone as PhoneIcon,
  Clock,
  Briefcase,
  CheckCircle2,
  MessageSquare,
  Activity,
  FileText,
  Paperclip,
} from 'lucide-react'
import Avatar from '@/components/shared/Avatar'
import ContactTimeline from '@/components/contacts/ContactTimeline'
import FileAttachments from '@/components/shared/FileAttachments'
import NotesPanel from '@/components/shared/NotesPanel'
import CustomFieldsRenderer from '@/components/shared/CustomFieldsRenderer'
import { formatDate, formatCurrency } from '@/lib/utils'

const tabs = [
  { key: 'activity', label: 'Activity', icon: Activity },
  { key: 'deals', label: 'Deals', icon: Briefcase },
  { key: 'notes', label: 'Notes', icon: MessageSquare },
  { key: 'files', label: 'Files', icon: Paperclip },
]

const quickActions = [
  { label: 'Call', icon: PhoneIcon, color: '#6c5ce7' },
  { label: 'Email', icon: Mail, color: '#74b9ff' },
  { label: 'Note', icon: FileText, color: '#fdcb6e' },
  { label: 'Task', icon: CheckCircle2, color: '#00b894' },
]

export default function ContactDetailClient({
  contact,
  activities,
  deals,
}: {
  contact: any
  activities: any[]
  deals: any[]
}) {
  const [activeTab, setActiveTab] = useState('activity')
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

  const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
    active: { bg: 'rgba(0,184,148,0.12)', color: 'var(--success)', label: 'Active' },
    lead: { bg: 'rgba(108,92,231,0.12)', color: 'var(--accent-light)', label: 'Lead' },
    inactive: { bg: 'rgba(136,136,160,0.12)', color: 'var(--muted)', label: 'Inactive' },
  }

  const status = statusConfig[contact.status] || statusConfig.inactive

  return (
    <div ref={containerRef}>
      {/* Back link */}
      <Link
        href="/contacts"
        className="inline-flex items-center gap-1.5 text-sm mb-6 hover:underline transition-colors"
        style={{ color: 'var(--muted)' }}
      >
        <ArrowLeft className="w-4 h-4" /> Back to contacts
      </Link>

      {/* Hero Header */}
      <div
        className="card mb-6 p-0 overflow-hidden"
      >
        {/* Gradient accent bar */}
        <div
          className="h-1"
          style={{ background: 'var(--gradient-accent)' }}
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
                      <span className="text-sm" style={{ color: 'var(--muted)' }}>
                        {contact.title}
                      </span>
                    )}
                    {contact.company?.name && (
                      <span className="text-sm" style={{ color: 'var(--muted)' }}>
                        at {contact.company.name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="badge badge-dot"
                    style={{ background: status.bg, color: status.color }}
                  >
                    {status.label}
                  </span>
                  {contact.source && (
                    <span className="badge badge-accent">{contact.source}</span>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 mt-4">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    className="btn btn-sm btn-secondary"
                    style={{ gap: '0.375rem' }}
                  >
                    <action.icon
                      className="w-3.5 h-3.5"
                      style={{ color: action.color }}
                    />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <div className="tab-list">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`tab-item flex items-center gap-1.5 ${activeTab === tab.key ? 'active' : ''}`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.key === 'deals' && deals.length > 0 && (
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full ml-1"
                    style={{
                      background: 'var(--surface-2)',
                      color: 'var(--muted)',
                    }}
                  >
                    {deals.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'activity' && (
            <div className="card">
              <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--muted)' }}>
                Activity Timeline
              </h3>
              <ContactTimeline activities={activities} />
            </div>
          )}

          {activeTab === 'deals' && (
            <div className="space-y-3">
              {deals.length === 0 ? (
                <div className="card text-center py-12">
                  <Briefcase className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--muted)' }} />
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    No deals for this contact
                  </p>
                  <Link href="/deals/new" className="btn btn-primary btn-sm mt-4">
                    Create Deal
                  </Link>
                </div>
              ) : (
                deals.map((deal: any) => (
                  <Link
                    key={deal.id}
                    href={`/deals/${deal.id}`}
                    className="card card-hover block p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{deal.title}</p>
                        <p className="text-lg font-bold mt-0.5" style={{ color: 'var(--accent-light)' }}>
                          {formatCurrency(deal.amount ?? 0)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className="badge"
                          style={{
                            background: `${deal.stage?.color ?? 'var(--muted)'}20`,
                            color: deal.stage?.color ?? 'var(--muted)',
                          }}
                        >
                          {deal.stage?.name}
                        </span>
                        {deal.close_date && (
                          <p className="text-xs mt-1.5" style={{ color: 'var(--muted)' }}>
                            Close: {formatDate(deal.close_date)}
                          </p>
                        )}
                      </div>
                    </div>
                    {deal.probability != null && (
                      <div className="mt-3">
                        <div className="probability-bar">
                          <div
                            className="probability-bar-fill"
                            style={{
                              width: `${deal.probability}%`,
                              background: deal.stage?.color ?? 'var(--accent)',
                            }}
                          />
                        </div>
                        <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                          {deal.probability}% probability
                        </p>
                      </div>
                    )}
                  </Link>
                ))
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="card">
              <NotesPanel entityType="contact" entityId={contact.id} />
            </div>
          )}

          {activeTab === 'files' && (
            <FileAttachments entityType="contact" entityId={contact.id} />
          )}
        </div>

        {/* Right Sidebar - Contact Info Card */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--muted)' }}>
              Contact Information
            </h3>

            <div className="space-y-3.5">
              {contact.email && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-1.5 rounded-md" style={{ background: 'rgba(116,185,255,0.12)' }}>
                    <Mail className="w-3.5 h-3.5" style={{ color: 'var(--info)' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>Email</p>
                    <p className="truncate">{contact.email}</p>
                  </div>
                </div>
              )}
              {contact.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-1.5 rounded-md" style={{ background: 'rgba(0,184,148,0.12)' }}>
                    <PhoneIcon className="w-3.5 h-3.5" style={{ color: 'var(--success)' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>Phone</p>
                    <p>{contact.phone}</p>
                  </div>
                </div>
              )}
              {contact.company?.name && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-1.5 rounded-md" style={{ background: 'rgba(108,92,231,0.12)' }}>
                    <Building2 className="w-3.5 h-3.5" style={{ color: 'var(--accent-light)' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>Company</p>
                    <p>{contact.company.name}</p>
                  </div>
                </div>
              )}
              {contact.title && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="p-1.5 rounded-md" style={{ background: 'rgba(253,203,110,0.12)' }}>
                    <Briefcase className="w-3.5 h-3.5" style={{ color: 'var(--warning)' }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>Title</p>
                    <p>{contact.title}</p>
                  </div>
                </div>
              )}
            </div>

            {contact.notes && (
              <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                <p className="text-xs font-medium mb-1.5" style={{ color: 'var(--muted)' }}>Notes</p>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {contact.notes}
                </p>
              </div>
            )}

            <div className="mt-4 pt-4 border-t flex items-center gap-1.5" style={{ borderColor: 'var(--border)' }}>
              <Clock className="w-3.5 h-3.5" style={{ color: 'var(--muted)' }} />
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Created {formatDate(contact.created_at)}
              </p>
            </div>
          </div>

          {/* Custom Fields */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--muted)' }}>
              Custom Fields
            </h3>
            <CustomFieldsRenderer entityType="contact" entityId={contact.id} />
          </div>

          {/* Stats Summary */}
          <div className="card">
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--muted)' }}>
              Summary
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 rounded-lg" style={{ background: 'var(--surface-2)' }}>
                <p className="text-lg font-bold">{activities.length}</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>Activities</p>
              </div>
              <div className="text-center p-3 rounded-lg" style={{ background: 'var(--surface-2)' }}>
                <p className="text-lg font-bold">{deals.length}</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>Deals</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
