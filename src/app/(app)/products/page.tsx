'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Plus, Save, Trash2, Loader2, X, Package, Pencil } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Product } from '@/types'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')

  // Form
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState(0)
  const [unit, setUnit] = useState('each')

  const supabase = createClient()

  useEffect(() => {
    loadProducts()
  }, [])

  async function loadProducts() {
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('name')

    setProducts(data ?? [])
    setLoading(false)
  }

  function resetForm() {
    setEditingId(null)
    setName('')
    setDescription('')
    setPrice(0)
    setUnit('each')
    setShowForm(false)
    setError('')
  }

  function startEdit(product: Product) {
    setEditingId(product.id)
    setName(product.name)
    setDescription(product.description ?? '')
    setPrice(Number(product.price))
    setUnit(product.unit)
    setShowForm(true)
  }

  async function handleSave() {
    if (!name.trim()) { setError('Product name is required'); return }
    setSaving(true)
    setError('')

    if (editingId) {
      const { error: updateError } = await supabase
        .from('products')
        .update({ name, description: description || null, price, unit })
        .eq('id', editingId)

      if (updateError) { setError(updateError.message); setSaving(false); return }
    } else {
      const { error: insertError } = await supabase
        .from('products')
        .insert({ name, description: description || null, price, unit })

      if (insertError) { setError(insertError.message); setSaving(false); return }
    }

    setSaving(false)
    resetForm()
    loadProducts()
  }

  async function toggleActive(product: Product) {
    await supabase.from('products').update({ is_active: !product.is_active }).eq('id', product.id)
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: !p.is_active } : p))
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this product?')) return
    await supabase.from('products').delete().eq('id', id)
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Products</h1>
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="card animate-shimmer h-16" />)}
        </div>
      </div>
    )
  }

  return (
    <div>
      <Link href="/invoices" className="inline-flex items-center gap-1 text-sm mb-6 hover:underline" style={{ color: 'var(--muted)' }}>
        <ArrowLeft className="w-4 h-4" /> Back to invoices
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Products</h1>
        {!showForm && (
          <button onClick={() => { resetForm(); setShowForm(true) }} className="btn btn-primary">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        )}
      </div>

      {/* Form */}
      {showForm && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{editingId ? 'Edit Product' : 'New Product'}</h2>
            <button onClick={resetForm} className="p-1.5 rounded-md hover:bg-[var(--surface-2)]">
              <X className="w-4 h-4" style={{ color: 'var(--muted)' }} />
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-lg text-sm mb-4" style={{ background: 'rgba(225,112,85,0.1)', color: 'var(--danger)' }}>
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="col-span-2">
              <label>Name *</label>
              <input value={name} onChange={e => setName(e.target.value)} className="w-full" placeholder="Product name" />
            </div>
            <div>
              <label>Price</label>
              <input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(parseFloat(e.target.value) || 0)} className="w-full" />
            </div>
            <div>
              <label>Unit</label>
              <select value={unit} onChange={e => setUnit(e.target.value)} className="w-full">
                <option value="each">Each</option>
                <option value="hour">Hour</option>
                <option value="day">Day</option>
                <option value="month">Month</option>
                <option value="project">Project</option>
                <option value="unit">Unit</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full" placeholder="Optional description" />
          </div>

          <div className="flex justify-end gap-3">
            <button onClick={resetForm} className="btn btn-secondary">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* Product list */}
      {products.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--surface-2)' }}>
            <Package className="w-8 h-8" style={{ color: 'var(--muted)' }} />
          </div>
          <h3 className="text-lg font-semibold mb-1">No products yet</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>Add products to use them in your invoices</p>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            <Plus className="w-4 h-4" /> Add Product
          </button>
        </div>
      ) : (
        <div className="card p-0">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th className="text-right">Price</th>
                  <th>Unit</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} style={{ opacity: p.is_active ? 1 : 0.5 }}>
                    <td className="font-medium">{p.name}</td>
                    <td style={{ color: 'var(--muted)' }} className="max-w-[200px] truncate">{p.description ?? '-'}</td>
                    <td className="text-right font-semibold">{formatCurrency(Number(p.price))}</td>
                    <td style={{ color: 'var(--muted)' }}>{p.unit}</td>
                    <td>
                      <button
                        onClick={() => toggleActive(p)}
                        className="badge cursor-pointer"
                        style={{
                          background: p.is_active ? 'rgba(0,184,148,0.15)' : 'rgba(136,136,160,0.15)',
                          color: p.is_active ? 'var(--success)' : 'var(--muted)',
                        }}
                      >
                        {p.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button onClick={() => startEdit(p)} className="p-1.5 rounded-md hover:bg-[var(--surface-2)] transition-colors" style={{ color: 'var(--muted)' }}>
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-md hover:bg-[var(--surface-2)] transition-colors" style={{ color: 'var(--danger)' }}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
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
