'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import type { Company } from '@/types'

const sources = [
  { value: 'web_form', label: 'Web Form' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'voice_agent', label: 'Voice Agent' },
  { value: 'booking', label: 'Booking' },
  { value: 'manual', label: 'Manual' },
  { value: 'referral', label: 'Referral' },
]

export default function NewLeadPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [title, setTitle] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [source, setSource] = useState('manual')
  const [notes, setNotes] = useState('')
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('companies')
        .select('*')
        .order('name')
      setCompanies(data ?? [])
    }
    load()
  }, [supabase])

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
      source,
      status: 'lead',
      notes: notes || null,
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/leads')
    router.refresh()
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/leads"
        className="inline-flex items-center gap-1.5 text-sm mb-6 hover:underline"
        style={{ color: 'var(--muted)' }}
      >
        <ArrowLeft className="w-4 h-4" /> Back to leads
      </Link>

      <div className="card">
        <h1 className="text-xl font-bold mb-6">Add New Lead</h1>

        {error && (
          <div
            className="p-3 rounded-lg text-sm mb-4"
            style={{
              background: 'rgba(225,112,85,0.1)',
              color: 'var(--danger)',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>First Name *</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                placeholder="John"
              />
            </div>
            <div>
              <label>Last Name *</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@example.com"
              />
            </div>
            <div>
              <label>Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Job Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Marketing Manager"
              />
            </div>
            <div>
              <label>Source *</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
              >
                {sources.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label>Company</label>
            <select
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
            >
              <option value="">None</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any additional notes about this lead..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Link href="/leads" className="btn btn-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
