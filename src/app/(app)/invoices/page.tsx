'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Plus, FileText, Search, DollarSign, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import EmptyState from '@/components/shared/EmptyState'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Invoice } from '@/types'

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  draft: { bg: 'rgba(136,136,160,0.15)', color: 'var(--muted)' },
  sent: { bg: 'rgba(108,92,231,0.15)', color: 'var(--accent-light)' },
  paid: { bg: 'rgba(0,184,148,0.15)', color: 'var(--success)' },
  overdue: { bg: 'rgba(225,112,85,0.15)', color: 'var(--danger)' },
  cancelled: { bg: 'rgba(136,136,160,0.1)', color: 'var(--muted)' },
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    loadInvoices()
  }, [])

  async function loadInvoices() {
    const { data } = await supabase
      .from('invoices')
      .select('*, contact:contacts(first_name, last_name, email), deal:deals(title)')
      .order('created_at', { ascending: false })

    setInvoices(data ?? [])
    setLoading(false)
  }

  const filtered = invoices.filter(inv => {
    const matchesSearch = inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      (inv.contact && `${inv.contact.first_name} ${inv.contact.last_name}`.toLowerCase().includes(search.toLowerCase()))
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.total), 0)
  const totalPending = invoices.filter(i => i.status === 'sent').reduce((sum, i) => sum + Number(i.total), 0)
  const totalOverdue = invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + Number(i.total), 0)

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Invoices</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map(i => <div key={i} className="card animate-shimmer h-24" />)}
        </div>
        <div className="card animate-shimmer h-64" />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Invoices</h1>
        <div className="flex items-center gap-3">
          <Link href="/products" className="btn btn-secondary">
            Products
          </Link>
          <Link href="/invoices/new" className="btn btn-primary">
            <Plus className="w-4 h-4" /> New Invoice
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg" style={{ background: 'rgba(0,184,148,0.15)' }}>
              <CheckCircle className="w-5 h-5" style={{ color: 'var(--success)' }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Paid</p>
              <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg" style={{ background: 'rgba(108,92,231,0.15)' }}>
              <Clock className="w-5 h-5" style={{ color: 'var(--accent-light)' }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Pending</p>
              <p className="text-2xl font-bold">{formatCurrency(totalPending)}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg" style={{ background: 'rgba(225,112,85,0.15)' }}>
              <AlertTriangle className="w-5 h-5" style={{ color: 'var(--danger)' }} />
            </div>
            <div>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Overdue</p>
              <p className="text-2xl font-bold">{formatCurrency(totalOverdue)}</p>
            </div>
          </div>
        </div>
      </div>

      {invoices.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No invoices yet"
          description="Create your first invoice to start tracking revenue"
          actionLabel="Create Invoice"
          actionHref="/invoices/new"
        />
      ) : (
        <div className="card p-0">
          {/* Search + filter */}
          <div className="p-4 border-b flex items-center gap-4" style={{ borderColor: 'var(--border)' }}>
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted)' }} />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search invoices..."
                className="w-full pl-10"
              />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-40">
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Issue Date</th>
                  <th>Due Date</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(inv => (
                  <tr key={inv.id}>
                    <td>
                      <Link href={`/invoices/${inv.id}`} className="font-medium hover:underline" style={{ color: 'var(--accent-light)' }}>
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td style={{ color: 'var(--muted)' }}>
                      {inv.contact ? `${inv.contact.first_name} ${inv.contact.last_name}` : '-'}
                    </td>
                    <td>
                      <span className="badge" style={STATUS_STYLES[inv.status]}>
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--muted)' }}>{formatDate(inv.issue_date)}</td>
                    <td style={{ color: 'var(--muted)' }}>{inv.due_date ? formatDate(inv.due_date) : '-'}</td>
                    <td className="text-right font-semibold">{formatCurrency(Number(inv.total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
