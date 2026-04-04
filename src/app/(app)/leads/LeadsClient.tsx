'use client'

import { useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import {
  Search,
  Globe,
  Mic,
  Mail,
  Phone,
  UserPlus,
  Users,
  Megaphone,
  Link as LinkIcon,
} from 'lucide-react'
import Avatar from '@/components/shared/Avatar'
import type { Contact } from '@/types'

const sourceIcons: Record<string, typeof Globe> = {
  web_form: Globe,
  newsletter: Mail,
  voice_agent: Mic,
  booking: Phone,
  manual: UserPlus,
  referral: Users,
  unknown: LinkIcon,
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

const statusConfig: Record<string, { bg: string; color: string }> = {
  lead: { bg: 'rgba(108,92,231,0.12)', color: 'var(--accent-light)' },
  active: { bg: 'rgba(0,184,148,0.12)', color: 'var(--success)' },
  inactive: { bg: 'rgba(136,136,160,0.12)', color: 'var(--muted)' },
}

export default function LeadsClient({
  leads,
}: {
  leads: Contact[]
}) {
  const [search, setSearch] = useState('')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!containerRef.current) return
    gsap.from(containerRef.current.querySelectorAll('.lead-row'), {
      y: 8,
      opacity: 0,
      duration: 0.3,
      stagger: 0.04,
      ease: 'power2.out',
    })
  }, [])

  // Get unique sources
  const sources = useMemo(() => {
    const s = new Set(leads.map((l) => l.source || 'unknown'))
    return ['all', ...Array.from(s)]
  }, [leads])

  const filtered = useMemo(() => {
    let result = leads
    if (search) {
      const q = search.toLowerCase()
      result = result.filter((l) =>
        `${l.first_name} ${l.last_name} ${l.email ?? ''} ${l.company?.name ?? ''}`
          .toLowerCase()
          .includes(q)
      )
    }
    if (sourceFilter !== 'all') {
      result = result.filter(
        (l) => (l.source || 'unknown') === sourceFilter
      )
    }
    return result
  }, [leads, search, sourceFilter])

  return (
    <div ref={containerRef}>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div className="search-input-wrapper max-w-sm flex-1 w-full">
          <Search className="search-icon w-4 h-4" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search leads..."
            className="w-full text-sm"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {sources.map((src) => {
            const isActive = sourceFilter === src
            return (
              <button
                key={src}
                onClick={() => setSourceFilter(src)}
                className="btn btn-sm"
                style={{
                  background: isActive ? 'var(--accent)' : 'var(--surface)',
                  color: isActive ? 'white' : 'var(--muted)',
                  border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`,
                }}
              >
                {src === 'all'
                  ? `All (${leads.length})`
                  : `${src.replace('_', ' ')} (${leads.filter((l) => (l.source || 'unknown') === src).length})`}
              </button>
            )
          })}
        </div>
      </div>

      {/* Leads List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              No leads match your filters
            </p>
          </div>
        ) : (
          filtered.map((lead) => {
            const SourceIcon =
              sourceIcons[lead.source || 'unknown'] || LinkIcon
            const srcColor =
              sourceColors[lead.source || 'unknown'] || '#8888a0'
            const status = statusConfig[lead.status] || statusConfig.lead

            return (
              <div
                key={lead.id}
                className="lead-row card card-hover p-4 cursor-pointer"
                onClick={() => router.push(`/leads/${lead.id}`)}
              >
                <div className="flex items-center gap-4">
                  <Avatar
                    name={`${lead.first_name} ${lead.last_name}`}
                    size="md"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">
                        {lead.first_name} {lead.last_name}
                      </p>
                      <span
                        className="badge badge-dot"
                        style={{
                          background: status.bg,
                          color: status.color,
                        }}
                      >
                        {lead.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      {lead.email && (
                        <span
                          className="text-xs truncate"
                          style={{ color: 'var(--muted)' }}
                        >
                          {lead.email}
                        </span>
                      )}
                      {lead.company?.name && (
                        <span
                          className="text-xs"
                          style={{ color: 'var(--muted)' }}
                        >
                          {lead.company.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Source badge */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="badge flex items-center gap-1.5"
                      style={{
                        background: `${srcColor}15`,
                        color: srcColor,
                      }}
                    >
                      <SourceIcon className="w-3 h-3" />
                      {(lead.source || 'unknown').replace('_', ' ')}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
