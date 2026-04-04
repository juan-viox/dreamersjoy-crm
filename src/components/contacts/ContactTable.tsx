'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Tag,
  Download,
  Users,
} from 'lucide-react'
import Avatar from '@/components/shared/Avatar'
import type { Contact } from '@/types'

type SortField = 'first_name' | 'last_name' | 'email' | 'company' | 'created_at'
type SortDir = 'asc' | 'desc'

const PAGE_SIZE = 20

export default function ContactTable({ contacts }: { contacts: Contact[] }) {
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const router = useRouter()

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return contacts.filter((c) =>
      `${c.first_name} ${c.last_name} ${c.email ?? ''} ${c.company?.name ?? ''}`
        .toLowerCase()
        .includes(q)
    )
  }, [contacts, search])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal: string, bVal: string
      switch (sortField) {
        case 'company':
          aVal = a.company?.name ?? ''
          bVal = b.company?.name ?? ''
          break
        default:
          aVal = String(
            (a as unknown as Record<string, unknown>)[sortField] ?? ''
          )
          bVal = String(
            (b as unknown as Record<string, unknown>)[sortField] ?? ''
          )
      }
      const cmp = aVal.localeCompare(bVal)
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortField, sortDir])

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir('asc')
    }
    setPage(0)
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selected.size === paginated.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(paginated.map((c) => c.id)))
    }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field)
      return (
        <span className="inline-block w-3 h-3 ml-1 opacity-0 group-hover:opacity-30">
          <ChevronUp className="w-3 h-3" />
        </span>
      )
    return sortDir === 'asc' ? (
      <ChevronUp className="w-3 h-3 inline ml-1" style={{ color: 'var(--accent-light)' }} />
    ) : (
      <ChevronDown className="w-3 h-3 inline ml-1" style={{ color: 'var(--accent-light)' }} />
    )
  }

  function exportCSV(contactsToExport: Contact[]) {
    const csvHeaders = ['First Name', 'Last Name', 'Email', 'Phone', 'Company', 'Title', 'Status', 'Source']
    const csvRows = contactsToExport.map(c => [
      c.first_name,
      c.last_name,
      c.email ?? '',
      c.phone ?? '',
      c.company?.name ?? '',
      c.title ?? '',
      c.status,
      c.source ?? '',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))

    const csv = [csvHeaders.join(','), ...csvRows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `contacts-export-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const statusConfig: Record<string, { bg: string; color: string }> = {
    active: { bg: 'rgba(0,184,148,0.12)', color: 'var(--success)' },
    lead: { bg: 'rgba(108,92,231,0.12)', color: 'var(--accent-light)' },
    inactive: { bg: 'rgba(136,136,160,0.12)', color: 'var(--muted)' },
  }

  // Empty state
  if (contacts.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-16 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: 'var(--surface-2)' }}
        >
          <Users className="w-8 h-8" style={{ color: 'var(--muted)' }} />
        </div>
        <h3 className="text-lg font-semibold mb-1">No contacts yet</h3>
        <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
          Add your first contact to get started
        </p>
        <Link href="/contacts/new" className="btn btn-primary">
          Add Contact
        </Link>
      </div>
    )
  }

  return (
    <div className="card p-0 overflow-hidden">
      {/* Bulk Actions Bar */}
      {selected.size > 0 && (
        <div className="bulk-bar mx-4 mt-4">
          <span className="text-sm font-medium">
            {selected.size} selected
          </span>
          <div className="flex items-center gap-2">
            <button className="btn btn-sm" style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
              <Tag className="w-3.5 h-3.5" /> Tag
            </button>
            <button
              className="btn btn-sm"
              style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}
              onClick={() => exportCSV(contacts.filter(c => selected.has(c.id)))}
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            <button className="btn btn-sm" style={{ background: 'rgba(225,112,85,0.3)', color: 'white' }}>
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div
        className="p-4 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="search-input-wrapper max-w-sm flex-1">
            <Search className="search-icon w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(0)
              }}
              placeholder="Search contacts..."
              className="w-full text-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              {filtered.length} of {contacts.length} contacts
            </span>
            <button
              onClick={() => exportCSV(filtered)}
              className="btn btn-secondary text-xs py-1.5 px-3"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <input
                  type="checkbox"
                  checked={paginated.length > 0 && selected.size === paginated.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th
                className="sortable cursor-pointer select-none group"
                onClick={() => toggleSort('first_name')}
              >
                Name <SortIcon field="first_name" />
              </th>
              <th
                className="sortable cursor-pointer select-none group"
                onClick={() => toggleSort('email')}
              >
                Email <SortIcon field="email" />
              </th>
              <th
                className="sortable cursor-pointer select-none group"
                onClick={() => toggleSort('company')}
              >
                Company <SortIcon field="company" />
              </th>
              <th>Phone</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    No contacts match your search
                  </p>
                </td>
              </tr>
            ) : (
              paginated.map((c) => {
                const isSelected = selected.has(c.id)
                return (
                  <tr
                    key={c.id}
                    className={`cursor-pointer ${isSelected ? 'selected' : ''}`}
                    onClick={() => router.push(`/contacts/${c.id}`)}
                  >
                    <td onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(c.id)}
                      />
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={`${c.first_name} ${c.last_name}`}
                          size="sm"
                        />
                        <div>
                          <span className="font-medium text-sm">
                            {c.first_name} {c.last_name}
                          </span>
                          {c.title && (
                            <p className="text-xs" style={{ color: 'var(--muted)' }}>
                              {c.title}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--muted)' }}>
                      {c.email ?? '-'}
                    </td>
                    <td style={{ color: 'var(--muted)' }}>
                      {c.company?.name ?? '-'}
                    </td>
                    <td style={{ color: 'var(--muted)' }}>
                      {c.phone ?? '-'}
                    </td>
                    <td>
                      <span
                        className="badge badge-dot"
                        style={{
                          background: statusConfig[c.status]?.bg ?? statusConfig.inactive.bg,
                          color: statusConfig[c.status]?.color ?? statusConfig.inactive.color,
                        }}
                      >
                        {c.status}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          className="flex items-center justify-between p-4 border-t"
          style={{ borderColor: 'var(--border)' }}
        >
          <span className="text-sm" style={{ color: 'var(--muted)' }}>
            Showing {page * PAGE_SIZE + 1}-
            {Math.min((page + 1) * PAGE_SIZE, sorted.length)} of{' '}
            {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="btn btn-ghost btn-sm btn-icon"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page numbers */}
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i
              } else if (page < 3) {
                pageNum = i
              } else if (page > totalPages - 4) {
                pageNum = totalPages - 5 + i
              } else {
                pageNum = page - 2 + i
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className="btn btn-sm btn-icon"
                  style={{
                    background:
                      page === pageNum
                        ? 'var(--accent)'
                        : 'transparent',
                    color:
                      page === pageNum
                        ? 'white'
                        : 'var(--muted)',
                    minWidth: '2rem',
                  }}
                >
                  {pageNum + 1}
                </button>
              )
            })}

            <button
              onClick={() =>
                setPage((p) => Math.min(totalPages - 1, p + 1))
              }
              disabled={page >= totalPages - 1}
              className="btn btn-ghost btn-sm btn-icon"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
