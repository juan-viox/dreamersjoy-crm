'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { generateApiKey } from '@/lib/utils'

export default function NewSitePage() {
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [domain, setDomain] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  function handleNameChange(val: string) {
    setName(val)
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const apiKey = generateApiKey()

    const { error: insertError } = await supabase.from('cinematic_sites').insert({
      name,
      slug,
      domain: domain || null,
      api_key: apiKey,
      active: true,
    })

    if (insertError) { setError(insertError.message); setLoading(false); return }

    router.push('/sites')
    router.refresh()
  }

  return (
    <div className="max-w-2xl">
      <Link href="/sites" className="inline-flex items-center gap-1 text-sm mb-6 hover:underline" style={{ color: 'var(--muted)' }}>
        <ArrowLeft className="w-4 h-4" /> Back to sites
      </Link>

      <h1 className="text-2xl font-bold mb-6">Add Site</h1>

      <form onSubmit={handleSubmit} className="card space-y-4">
        {error && (
          <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(225,112,85,0.1)', color: 'var(--danger)' }}>{error}</div>
        )}

        <div>
          <label>Site Name *</label>
          <input value={name} onChange={e => handleNameChange(e.target.value)} required className="w-full" placeholder="My Business Site" />
        </div>

        <div>
          <label>Slug</label>
          <input value={slug} onChange={e => setSlug(e.target.value)} className="w-full" placeholder="my-business-site" />
        </div>

        <div>
          <label>Domain</label>
          <input value={domain} onChange={e => setDomain(e.target.value)} className="w-full" placeholder="mybusiness.com" />
        </div>

        <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>
          An API key will be automatically generated. Use it to authenticate ingest requests from your site.
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/sites" className="btn btn-secondary">Cancel</Link>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Create Site
          </button>
        </div>
      </form>
    </div>
  )
}
