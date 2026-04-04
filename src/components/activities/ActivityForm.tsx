'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save, X } from 'lucide-react'
import type { Contact, Deal } from '@/types'

export default function ActivityForm({
  onCreated,
  onCancel,
}: {
  onCreated: (activity: any) => void
  onCancel: () => void
}) {
  const [type, setType] = useState('call')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [contactId, setContactId] = useState('')
  const [dealId, setDealId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const [contactsRes, dealsRes] = await Promise.all([
        supabase.from('contacts').select('*').order('first_name'),
        supabase.from('deals').select('*').eq('status', 'open').order('title'),
      ])
      setContacts(contactsRes.data ?? [])
      setDeals(dealsRes.data ?? [])
    }
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not authenticated'); setLoading(false); return }

    const { data, error: insertError } = await supabase
      .from('activities')
      .insert({
        user_id: user.id,
        type,
        title,
        description: description || null,
        contact_id: contactId || null,
        deal_id: dealId || null,
        due_date: dueDate || null,
        completed: false,
      })
      .select('*, contact:contacts(first_name, last_name), deal:deals(title)')
      .single()

    if (insertError) { setError(insertError.message); setLoading(false); return }

    onCreated(data)
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Log Activity</h3>
        <button type="button" onClick={onCancel} className="p-1 rounded hover:bg-[var(--surface-2)]" style={{ color: 'var(--muted)' }}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(225,112,85,0.1)', color: 'var(--danger)' }}>{error}</div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>Type *</label>
          <select value={type} onChange={e => setType(e.target.value)} className="w-full">
            <option value="call">Call</option>
            <option value="email">Email</option>
            <option value="meeting">Meeting</option>
            <option value="task">Task</option>
            <option value="note">Note</option>
          </select>
        </div>
        <div>
          <label>Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full" />
        </div>
      </div>

      <div>
        <label>Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label>Contact</label>
          <select value={contactId} onChange={e => setContactId(e.target.value)} className="w-full">
            <option value="">None</option>
            {contacts.map(c => (
              <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Deal</label>
          <select value={dealId} onChange={e => setDealId(e.target.value)} className="w-full">
            <option value="">None</option>
            {deals.map(d => (
              <option key={d.id} value={d.id}>{d.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Due Date</label>
          <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full" />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="btn btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </button>
      </div>
    </form>
  )
}
