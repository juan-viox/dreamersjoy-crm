'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import type { Contact, DealStage } from '@/types'

export default function NewDealPage() {
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [stageId, setStageId] = useState('')
  const [contactId, setContactId] = useState('')
  const [closeDate, setCloseDate] = useState('')
  const [probability, setProbability] = useState('50')
  const [notes, setNotes] = useState('')
  const [contacts, setContacts] = useState<Contact[]>([])
  const [stages, setStages] = useState<DealStage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const [contactsRes, stagesRes] = await Promise.all([
        supabase.from('contacts').select('*').order('first_name'),
        supabase.from('deal_stages').select('*').order('position'),
      ])
      setContacts(contactsRes.data ?? [])
      setStages(stagesRes.data ?? [])
      if (stagesRes.data && stagesRes.data.length > 0) {
        setStageId(stagesRes.data[0].id)
      }
    }
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const selectedContact = contacts.find(c => c.id === contactId)

    const { error: insertError } = await supabase.from('deals').insert({
      title,
      amount: parseFloat(amount) || 0,
      stage_id: stageId,
      contact_id: contactId || null,
      company_id: selectedContact?.company_id || null,
      close_date: closeDate || null,
      probability: parseInt(probability) || null,
      status: 'open',
      notes: notes || null,
    })

    if (insertError) { setError(insertError.message); setLoading(false); return }

    router.push('/deals')
    router.refresh()
  }

  return (
    <div className="max-w-2xl">
      <Link href="/deals" className="inline-flex items-center gap-1 text-sm mb-6 hover:underline" style={{ color: 'var(--muted)' }}>
        <ArrowLeft className="w-4 h-4" /> Back to pipeline
      </Link>

      <h1 className="text-2xl font-bold mb-6">New Deal</h1>

      <form onSubmit={handleSubmit} className="card space-y-4">
        {error && (
          <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(225,112,85,0.1)', color: 'var(--danger)' }}>{error}</div>
        )}

        <div>
          <label>Deal Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} required className="w-full" placeholder="e.g. Website Redesign" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label>Amount ($) *</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} required min="0" step="0.01" className="w-full" />
          </div>
          <div>
            <label>Stage *</label>
            <select value={stageId} onChange={e => setStageId(e.target.value)} required className="w-full">
              {stages.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
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
            <label>Close Date</label>
            <input type="date" value={closeDate} onChange={e => setCloseDate(e.target.value)} className="w-full" />
          </div>
        </div>

        <div>
          <label>Probability (%)</label>
          <input type="number" value={probability} onChange={e => setProbability(e.target.value)} min="0" max="100" className="w-full" />
        </div>

        <div>
          <label>Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full" />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/deals" className="btn btn-secondary">Cancel</Link>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Deal
          </button>
        </div>
      </form>
    </div>
  )
}
