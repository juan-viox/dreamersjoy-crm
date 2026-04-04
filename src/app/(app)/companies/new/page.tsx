'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save } from 'lucide-react'

export default function NewCompanyPage() {
  const [name, setName] = useState('')
  const [domain, setDomain] = useState('')
  const [industry, setIndustry] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zip, setZip] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: insertError } = await supabase.from('companies').insert({
      name,
      domain: domain || null,
      industry: industry || null,
      phone: phone || null,
      address: address || null,
      city: city || null,
      state: state || null,
      zip: zip || null,
      notes: notes || null,
    })

    if (insertError) { setError(insertError.message); setLoading(false); return }

    router.push('/companies')
    router.refresh()
  }

  return (
    <div className="max-w-2xl">
      <Link href="/companies" className="inline-flex items-center gap-1 text-sm mb-6 hover:underline" style={{ color: 'var(--muted)' }}>
        <ArrowLeft className="w-4 h-4" /> Back to companies
      </Link>

      <h1 className="text-2xl font-bold mb-6">New Company</h1>

      <form onSubmit={handleSubmit} className="card space-y-4">
        {error && (
          <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(225,112,85,0.1)', color: 'var(--danger)' }}>{error}</div>
        )}

        <div>
          <label>Company Name *</label>
          <input value={name} onChange={e => setName(e.target.value)} required className="w-full" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label>Domain</label>
            <input value={domain} onChange={e => setDomain(e.target.value)} placeholder="example.com" className="w-full" />
          </div>
          <div>
            <label>Industry</label>
            <input value={industry} onChange={e => setIndustry(e.target.value)} className="w-full" />
          </div>
        </div>

        <div>
          <label>Phone</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full" />
        </div>

        <div>
          <label>Address</label>
          <input value={address} onChange={e => setAddress(e.target.value)} className="w-full" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label>City</label>
            <input value={city} onChange={e => setCity(e.target.value)} className="w-full" />
          </div>
          <div>
            <label>State</label>
            <input value={state} onChange={e => setState(e.target.value)} className="w-full" />
          </div>
          <div>
            <label>ZIP</label>
            <input value={zip} onChange={e => setZip(e.target.value)} className="w-full" />
          </div>
        </div>

        <div>
          <label>Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full" />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/companies" className="btn btn-secondary">Cancel</Link>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Company
          </button>
        </div>
      </form>
    </div>
  )
}
