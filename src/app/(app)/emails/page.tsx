'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Mail, Plus, Send, FileEdit, Search, Trash2, Clock } from 'lucide-react'
import EmptyState from '@/components/shared/EmptyState'
import type { EmailTemplate } from '@/types'

export default function EmailsPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    const { data } = await supabase
      .from('email_templates')
      .select('*')
      .order('updated_at', { ascending: false })

    setTemplates(data ?? [])
    setLoading(false)
  }

  const filtered = templates.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.subject.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())
  )

  const categories = [...new Set(templates.map(t => t.category))]

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Emails</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="card animate-shimmer h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Emails</h1>
        <div className="flex items-center gap-3">
          <Link href="/emails/templates" className="btn btn-secondary">
            <FileEdit className="w-4 h-4" /> Templates
          </Link>
          <Link href="/emails/compose" className="btn btn-primary">
            <Send className="w-4 h-4" /> Compose
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg" style={{ background: 'var(--surface-2)' }}>
              <Mail className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Templates</p>
              <p className="text-2xl font-bold">{templates.length}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg" style={{ background: 'var(--surface-2)' }}>
              <Send className="w-5 h-5" style={{ color: 'var(--success)' }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Categories</p>
              <p className="text-2xl font-bold">{categories.length}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg" style={{ background: 'var(--surface-2)' }}>
              <Clock className="w-5 h-5" style={{ color: 'var(--warning)' }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Quick Actions</p>
              <Link href="/emails/compose" className="text-sm font-medium" style={{ color: 'var(--accent-light)' }}>
                Send an email &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      {templates.length === 0 ? (
        <EmptyState
          icon={Mail}
          title="No email templates yet"
          description="Create your first template to start sending professional emails"
          actionLabel="Create Template"
          actionHref="/emails/templates"
        />
      ) : (
        <>
          {/* Search */}
          <div className="card p-4 mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted)' }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search templates..."
                className="w-full pl-10"
              />
            </div>
          </div>

          {/* Template cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(template => (
              <div key={template.id} className="card hover:border-[var(--accent)] transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{template.name}</h3>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{template.category}</p>
                  </div>
                  <span className="badge" style={{ background: 'rgba(108,92,231,0.15)', color: 'var(--accent-light)' }}>
                    {template.variables.length} vars
                  </span>
                </div>
                <p className="text-sm mb-3 truncate" style={{ color: 'var(--muted)' }}>
                  Subject: {template.subject}
                </p>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/emails/compose?template=${template.id}`}
                    className="btn btn-primary text-xs py-1.5 px-3"
                  >
                    <Send className="w-3 h-3" /> Use
                  </Link>
                  <Link
                    href={`/emails/templates?edit=${template.id}`}
                    className="btn btn-secondary text-xs py-1.5 px-3"
                  >
                    <FileEdit className="w-3 h-3" /> Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
