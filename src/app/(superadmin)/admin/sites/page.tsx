'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Globe,
  Search,
  Loader2,
  Copy,
  Check,
} from 'lucide-react'

const GOLD = '#C9A96E'

interface SiteRow {
  id: string
  name: string
  domain: string | null
  api_key: string | null
  status: string | null
  organization_id: string
  org_name: string
  ingest_count: number
  created_at: string
}

export default function AdminSitesPage() {
  const [sites, setSites] = useState<SiteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('sites')
        .select('id, name, domain, api_key, status, organization_id, created_at, organization:organizations(name)')
        .order('created_at', { ascending: false })

      if (data) {
        const withCounts = await Promise.all(
          data.map(async (s: any) => {
            const { count } = await supabase
              .from('site_ingestions')
              .select('id', { count: 'exact', head: true })
              .eq('site_id', s.id)

            return {
              id: s.id,
              name: s.name,
              domain: s.domain,
              api_key: s.api_key,
              status: s.status,
              organization_id: s.organization_id,
              org_name: s.organization?.name ?? '—',
              ingest_count: count ?? 0,
              created_at: s.created_at,
            }
          })
        )
        setSites(withCounts)
      }

      setLoading(false)
    }

    load()
  }, [])

  function copyApiKey(siteId: string, key: string) {
    navigator.clipboard.writeText(key)
    setCopiedId(siteId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filtered = sites.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.domain ?? '').toLowerCase().includes(search.toLowerCase()) ||
      s.org_name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="animate-spin" size={32} style={{ color: GOLD }} />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Cinematic Sites</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          All sites across all organizations ({sites.length} total)
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--muted)' }}
        />
        <input
          type="text"
          placeholder="Search sites by name, domain, or org..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9"
        />
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Domain</th>
                <th>Organization</th>
                <th>API Key</th>
                <th>Status</th>
                <th>Ingestions</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td className="font-medium">{s.name}</td>
                  <td style={{ color: 'var(--muted)' }}>{s.domain ?? '—'}</td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background: 'rgba(201,169,110,0.12)',
                        color: GOLD,
                      }}
                    >
                      {s.org_name}
                    </span>
                  </td>
                  <td>
                    {s.api_key ? (
                      <div className="flex items-center gap-1">
                        <code
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: 'var(--surface-2)' }}
                        >
                          {s.api_key.slice(0, 12)}...
                        </code>
                        <button
                          onClick={() => copyApiKey(s.id, s.api_key!)}
                          className="p-1 rounded hover:bg-[var(--surface-2)] transition-colors"
                          style={{
                            color: copiedId === s.id ? 'var(--success)' : 'var(--muted)',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                          title="Copy API Key"
                        >
                          {copiedId === s.id ? (
                            <Check size={14} />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--muted)' }}>—</span>
                    )}
                  </td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        background:
                          s.status === 'active'
                            ? 'rgba(0,184,148,0.12)'
                            : 'rgba(225,112,85,0.12)',
                        color:
                          s.status === 'active'
                            ? 'var(--success)'
                            : 'var(--danger)',
                      }}
                    >
                      {s.status ?? 'active'}
                    </span>
                  </td>
                  <td>{s.ingest_count}</td>
                  <td style={{ color: 'var(--muted)' }}>
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-8"
                    style={{ color: 'var(--muted)' }}
                  >
                    No sites found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
