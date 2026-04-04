'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import type { Company } from '@/types'

export default function NewContactPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [title, setTitle] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [source, setSource] = useState('')
  const [status, setStatus] = useState('lead')
  const [notes, setNotes] = useState('')
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('companies').select('*').order('name')
      setCompanies(data ?? [])
    }
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: insertError } = await supabase.from('contacts').insert({
      first_name: firstName,
      last_name: lastName,
      email: email || null,
      phone: phone || null,
      title: title || null,
      company_id: companyId || null,
      source: source || null,
      status,
      notes: notes || null,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/contacts')
    router.refresh()
  }

  return (
    <div className="max-w-2xl">
      <Link href="/contacts" className="inline-flex items-center gap-1 text-sm mb-6 hover:underline" style={{ color: 'var(--muted)' }}>
        <ArrowLeft className="w-4 h-4" /> Back to contacts
      </Link>

      <h1 className="text-2xl font-bold mb-6">New Contact</h1>

      <form onSubmit={handleSubmit} className="card space-y-4">
        {error && (
          <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(225,112,85,0.1)', color: 'var(--danger)' }}>
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label>First Name *</label>
            <input value={firstName} onChange={e => setFirstName(e.target.value)} required className="w-full" />
          </div>
          <div>
            <label>Last Name *</label>
            <input value={lastName} onChange={e => setLastName(e.target.value)} required className="w-full" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full" />
          </div>
          <div>
            <label>Phone</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label>Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full" placeholder="e.g. CEO" />
          </div>
          <div>
            <label>Company</label>
            <select value={companyId} onChange={e => setCompanyId(e.target.value)} className="w-full">
              <option value="">No company</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label>Source</label>
            <select value={source} onChange={e => setSource(e.target.value)} className="w-full">
              <option value="">Select source</option>
              <option value="web_form">Web Form</option>
              <option value="referral">Referral</option>
              <option value="cold_call">Cold Call</option>
              <option value="newsletter">Newsletter</option>
              <option value="voice_agent">Voice Agent</option>
              <option value="booking">Booking</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full">
              <option value="lead">Lead</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div>
          <label>Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full" />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/contacts" className="btn btn-secondary">Cancel</Link>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Contact
          </button>
        </div>
      </form>
    </div>
  )
}
