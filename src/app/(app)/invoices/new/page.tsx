'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Loader2, Save } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Contact, Product } from '@/types'

interface LineItem {
  key: string
  productId: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export default function NewInvoicePage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Invoice fields
  const [contactId, setContactId] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [taxRate, setTaxRate] = useState(0)
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<LineItem[]>([
    { key: crypto.randomUUID(), productId: '', description: '', quantity: 1, unitPrice: 0, total: 0 }
  ])

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [contactsRes, productsRes, invoiceCountRes] = await Promise.all([
      supabase.from('contacts').select('*').order('first_name'),
      supabase.from('products').select('*').eq('is_active', true).order('name'),
      supabase.from('invoices').select('id', { count: 'exact', head: true }),
    ])

    setContacts(contactsRes.data ?? [])
    setProducts(productsRes.data ?? [])

    // Auto-generate invoice number
    const count = invoiceCountRes.count ?? 0
    setInvoiceNumber(`INV-${String(count + 1).padStart(4, '0')}`)

    setLoading(false)
  }

  function addItem() {
    setItems(prev => [...prev, {
      key: crypto.randomUUID(),
      productId: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      total: 0,
    }])
  }

  function removeItem(key: string) {
    if (items.length <= 1) return
    setItems(prev => prev.filter(i => i.key !== key))
  }

  function updateItem(key: string, field: keyof LineItem, value: string | number) {
    setItems(prev => prev.map(item => {
      if (item.key !== key) return item
      const updated = { ...item, [field]: value }

      // If product selected, fill description and price
      if (field === 'productId' && value) {
        const product = products.find(p => p.id === value)
        if (product) {
          updated.description = product.name
          updated.unitPrice = Number(product.price)
        }
      }

      updated.total = updated.quantity * updated.unitPrice
      return updated
    }))
  }

  const subtotal = items.reduce((sum, i) => sum + i.total, 0)
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!invoiceNumber.trim()) { setError('Invoice number is required'); return }
    if (items.every(i => !i.description)) { setError('Add at least one line item'); return }

    setSaving(true)
    setError('')

    // Create invoice
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .insert({
        contact_id: contactId || null,
        invoice_number: invoiceNumber,
        issue_date: issueDate,
        due_date: dueDate || null,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total,
        notes: notes || null,
        status: 'draft',
      })
      .select('id')
      .single()

    if (invError) { setError(invError.message); setSaving(false); return }

    // Create line items
    const lineItems = items
      .filter(i => i.description)
      .map((item, idx) => ({
        invoice_id: invoice.id,
        product_id: item.productId || null,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total: item.total,
        sort_order: idx,
      }))

    if (lineItems.length > 0) {
      const { error: itemsError } = await supabase.from('invoice_items').insert(lineItems)
      if (itemsError) { setError(itemsError.message); setSaving(false); return }
    }

    router.push(`/invoices/${invoice.id}`)
    router.refresh()
  }

  if (loading) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">New Invoice</h1>
        <div className="card animate-shimmer h-96" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <Link href="/invoices" className="inline-flex items-center gap-1 text-sm mb-6 hover:underline" style={{ color: 'var(--muted)' }}>
        <ArrowLeft className="w-4 h-4" /> Back to invoices
      </Link>

      <h1 className="text-2xl font-bold mb-6">New Invoice</h1>

      <form onSubmit={handleSubmit}>
        {error && (
          <div className="p-3 rounded-lg text-sm mb-4" style={{ background: 'rgba(225,112,85,0.1)', color: 'var(--danger)' }}>
            {error}
          </div>
        )}

        {/* Invoice details */}
        <div className="card mb-4">
          <h2 className="text-lg font-semibold mb-4">Invoice Details</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label>Invoice # *</label>
              <input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="w-full" required />
            </div>
            <div>
              <label>Contact</label>
              <select value={contactId} onChange={e => setContactId(e.target.value)} className="w-full">
                <option value="">No contact</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Issue Date</label>
              <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} className="w-full" />
            </div>
            <div>
              <label>Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full" />
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Line Items</h2>
            <button type="button" onClick={addItem} className="btn btn-secondary text-sm">
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>

          <div className="space-y-3">
            {/* Header */}
            <div className="grid grid-cols-12 gap-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              <div className="col-span-2">Product</div>
              <div className="col-span-4">Description</div>
              <div className="col-span-2">Qty</div>
              <div className="col-span-2">Unit Price</div>
              <div className="col-span-1 text-right">Total</div>
              <div className="col-span-1" />
            </div>

            {items.map(item => (
              <div key={item.key} className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-2">
                  <select
                    value={item.productId}
                    onChange={e => updateItem(item.key, 'productId', e.target.value)}
                    className="w-full text-sm"
                  >
                    <option value="">Custom</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-4">
                  <input
                    value={item.description}
                    onChange={e => updateItem(item.key, 'description', e.target.value)}
                    className="w-full text-sm"
                    placeholder="Item description"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.quantity}
                    onChange={e => updateItem(item.key, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-full text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={e => updateItem(item.key, 'unitPrice', parseFloat(e.target.value) || 0)}
                    className="w-full text-sm"
                  />
                </div>
                <div className="col-span-1 text-right text-sm font-medium">
                  {formatCurrency(item.total)}
                </div>
                <div className="col-span-1 text-right">
                  <button
                    type="button"
                    onClick={() => removeItem(item.key)}
                    className="p-1.5 rounded-md hover:bg-[var(--surface-2)] transition-colors"
                    style={{ color: items.length <= 1 ? 'var(--border)' : 'var(--danger)' }}
                    disabled={items.length <= 1}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="card mb-4">
          <div className="max-w-xs ml-auto space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: 'var(--muted)' }}>Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm" style={{ color: 'var(--muted)' }}>Tax Rate (%)</span>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={taxRate}
                onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
                className="w-24 text-sm"
              />
              <span className="text-sm font-medium ml-auto">{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <span className="font-semibold">Total</span>
              <span className="text-xl font-bold" style={{ color: 'var(--accent-light)' }}>
                {formatCurrency(total)}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="card mb-4">
          <label>Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full" placeholder="Payment terms, additional notes..." />
        </div>

        <div className="flex justify-end gap-3">
          <Link href="/invoices" className="btn btn-secondary">Cancel</Link>
          <button type="submit" disabled={saving} className="btn btn-primary">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Create Invoice
          </button>
        </div>
      </form>
    </div>
  )
}
