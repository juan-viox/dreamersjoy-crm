'use client'

import { useState } from 'react'
import { Globe, Copy, Check, ExternalLink } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { CinematicSite } from '@/types'

export default function SitesClient({ sites }: { sites: CinematicSite[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  function copyKey(siteId: string, key: string) {
    navigator.clipboard.writeText(key)
    setCopiedId(siteId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-4">
      {sites.map(site => (
        <div key={site.id} className="card">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg" style={{ background: 'var(--surface-2)' }}>
                <Globe className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <h3 className="font-semibold">{site.name}</h3>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  {site.domain || site.slug}
                </p>
              </div>
            </div>
            <span
              className="badge"
              style={{
                background: site.active ? 'rgba(0,184,148,0.15)' : 'rgba(136,136,160,0.15)',
                color: site.active ? 'var(--success)' : 'var(--muted)',
              }}
            >
              {site.active ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div className="mt-4 p-3 rounded-lg flex items-center justify-between" style={{ background: 'var(--bg)' }}>
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>API Key</p>
              <code className="text-sm font-mono">{site.api_key.slice(0, 12)}...{site.api_key.slice(-6)}</code>
            </div>
            <button
              onClick={() => copyKey(site.id, site.api_key)}
              className="btn btn-secondary py-1.5 px-3"
            >
              {copiedId === site.id ? (
                <><Check className="w-4 h-4" style={{ color: 'var(--success)' }} /> Copied</>
              ) : (
                <><Copy className="w-4 h-4" /> Copy</>
              )}
            </button>
          </div>

          <p className="text-xs mt-3" style={{ color: 'var(--muted)' }}>
            Created {formatDate(site.created_at)}
          </p>
        </div>
      ))}
    </div>
  )
}
