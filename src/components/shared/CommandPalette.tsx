'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Search,
  Users,
  Building2,
  Handshake,
  Activity,
  Clock,
  X,
  Command,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface SearchResult {
  id: string
  type: 'contact' | 'company' | 'deal' | 'activity'
  title: string
  subtitle: string
  href: string
}

const TYPE_CONFIG = {
  contact: { icon: Users, color: '#6c5ce7', label: 'Contact' },
  company: { icon: Building2, color: '#00b894', label: 'Company' },
  deal: { icon: Handshake, color: '#fdcb6e', label: 'Deal' },
  activity: { icon: Activity, color: '#74b9ff', label: 'Activity' },
}

const RECENT_KEY = 'viox-crm-recent-searches'

function getRecentSearches(): SearchResult[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
  } catch {
    return []
  }
}

function addRecentSearch(result: SearchResult) {
  const recent = getRecentSearches().filter((r) => r.id !== result.id)
  recent.unshift(result)
  localStorage.setItem(RECENT_KEY, JSON.stringify(recent.slice(0, 8)))
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [recentResults, setRecentResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const supabase = createClient()
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Open/close with Cmd+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setRecentResults(getRecentSearches())
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
    }
  }, [open])

  const search = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([])
        return
      }
      setLoading(true)
      const pattern = `%${q}%`

      const [contactsRes, companiesRes, dealsRes, activitiesRes] = await Promise.all([
        supabase
          .from('contacts')
          .select('id, first_name, last_name, email')
          .or(`first_name.ilike.${pattern},last_name.ilike.${pattern},email.ilike.${pattern}`)
          .limit(5),
        supabase
          .from('companies')
          .select('id, name, industry')
          .ilike('name', pattern)
          .limit(5),
        supabase
          .from('deals')
          .select('id, title, amount')
          .ilike('title', pattern)
          .limit(5),
        supabase
          .from('activities')
          .select('id, title, type')
          .ilike('title', pattern)
          .limit(5),
      ])

      const items: SearchResult[] = []

      for (const c of contactsRes.data ?? []) {
        items.push({
          id: c.id,
          type: 'contact',
          title: `${c.first_name} ${c.last_name ?? ''}`.trim(),
          subtitle: c.email ?? '',
          href: `/contacts/${c.id}`,
        })
      }
      for (const c of companiesRes.data ?? []) {
        items.push({
          id: c.id,
          type: 'company',
          title: c.name,
          subtitle: c.industry ?? '',
          href: `/companies/${c.id}`,
        })
      }
      for (const d of dealsRes.data ?? []) {
        items.push({
          id: d.id,
          type: 'deal',
          title: d.title,
          subtitle: d.amount ? formatCurrency(d.amount) : '',
          href: `/deals/${d.id}`,
        })
      }
      for (const a of activitiesRes.data ?? []) {
        items.push({
          id: a.id,
          type: 'activity',
          title: a.title,
          subtitle: a.type,
          href: `/activities`,
        })
      }

      setResults(items)
      setSelectedIndex(0)
      setLoading(false)
    },
    [supabase]
  )

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query), 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, search])

  function handleSelect(result: SearchResult) {
    addRecentSearch(result)
    setOpen(false)
    router.push(result.href)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    const items = query.trim() ? results : recentResults
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && items[selectedIndex]) {
      e.preventDefault()
      handleSelect(items[selectedIndex])
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    }
  }

  // Scroll selected into view
  useEffect(() => {
    if (!resultsRef.current) return
    const el = resultsRef.current.children[selectedIndex] as HTMLElement
    if (el) el.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  if (!open) return null

  const displayItems = query.trim() ? results : recentResults
  const grouped = displayItems.reduce(
    (acc, item) => {
      if (!acc[item.type]) acc[item.type] = []
      acc[item.type].push(item)
      return acc
    },
    {} as Record<string, SearchResult[]>
  )

  let flatIndex = 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      onClick={() => setOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />

      {/* Dialog */}
      <div
        className="relative w-full max-w-xl rounded-xl border overflow-hidden shadow-2xl"
        style={{
          background: 'var(--surface)',
          borderColor: 'var(--border)',
          animation: 'fade-slide-up 150ms ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <Search className="w-5 h-5 shrink-0" style={{ color: 'var(--muted)' }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search contacts, companies, deals..."
            className="flex-1 bg-transparent border-none outline-none text-sm"
            style={{ color: 'var(--text)' }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded hover:bg-[var(--surface-2)]"
              style={{ color: 'var(--muted)' }}
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd
            className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono"
            style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={resultsRef} className="max-h-[400px] overflow-y-auto p-2">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
            </div>
          )}

          {!loading && !query.trim() && recentResults.length === 0 && (
            <div className="text-center py-8">
              <Command className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--muted)' }} />
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Start typing to search across your CRM
              </p>
            </div>
          )}

          {!loading && query.trim() && results.length === 0 && (
            <div className="text-center py-8">
              <Search className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--muted)' }} />
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                No results for &quot;{query}&quot;
              </p>
            </div>
          )}

          {!loading && !query.trim() && recentResults.length > 0 && (
            <div className="px-2 py-1.5 mb-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
                <Clock className="w-3 h-3" /> Recent
              </p>
            </div>
          )}

          {!loading &&
            Object.entries(grouped).map(([type, items]) => {
              const config = TYPE_CONFIG[type as keyof typeof TYPE_CONFIG]
              return (
                <div key={type} className="mb-2">
                  {query.trim() && (
                    <div className="px-2 py-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                        {config.label}s
                      </p>
                    </div>
                  )}
                  {items.map((item) => {
                    const currentIndex = flatIndex++
                    const Icon = config.icon
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelect(item)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors"
                        style={{
                          background:
                            selectedIndex === currentIndex
                              ? 'var(--surface-2)'
                              : 'transparent',
                        }}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                      >
                        <div
                          className="p-1.5 rounded-md shrink-0"
                          style={{ background: `${config.color}20` }}
                        >
                          <Icon className="w-4 h-4" style={{ color: config.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          {item.subtitle && (
                            <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>
                              {item.subtitle}
                            </p>
                          )}
                        </div>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
                          style={{ background: `${config.color}15`, color: config.color }}
                        >
                          {config.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              )
            })}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-4 py-2 border-t text-[10px]"
          style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
        >
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded font-mono" style={{ background: 'var(--surface-2)' }}>&uarr;</kbd>
              <kbd className="px-1 py-0.5 rounded font-mono" style={{ background: 'var(--surface-2)' }}>&darr;</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded font-mono" style={{ background: 'var(--surface-2)' }}>&crarr;</kbd>
              select
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 rounded font-mono" style={{ background: 'var(--surface-2)' }}>esc</kbd>
            close
          </span>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-slide-up {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  )
}
