'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, Send, Loader2, Search, X, CheckCircle } from 'lucide-react'
import type { Contact, EmailTemplate } from '@/types'

export default function ComposeEmailPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  // Compose fields
  const [selectedContactId, setSelectedContactId] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [toEmail, setToEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [contactSearch, setContactSearch] = useState('')
  const [showContactPicker, setShowContactPicker] = useState(false)

  const supabase = createClient()
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const [contactsRes, templatesRes] = await Promise.all([
      supabase.from('contacts').select('*, company:companies(name)').order('first_name'),
      supabase.from('email_templates').select('*').order('name'),
    ])

    setContacts(contactsRes.data ?? [])
    setTemplates(templatesRes.data ?? [])
    setLoading(false)

    // Pre-select template from URL
    const tid = searchParams.get('template')
    if (tid && templatesRes.data) {
      const t = templatesRes.data.find(t => t.id === tid)
      if (t) applyTemplate(t)
    }
  }

  function applyTemplate(template: EmailTemplate) {
    setSelectedTemplateId(template.id)
    setSubject(template.subject)
    setBody(template.body)
  }

  function selectContact(contact: Contact) {
    setSelectedContactId(contact.id)
    setToEmail(contact.email ?? '')
    setContactSearch(`${contact.first_name} ${contact.last_name}`)
    setShowContactPicker(false)

    // Replace variables in subject and body
    const vars: Record<string, string> = {
      '{{first_name}}': contact.first_name,
      '{{last_name}}': contact.last_name,
      '{{email}}': contact.email ?? '',
      '{{company}}': contact.company?.name ?? '',
    }
    let newSubject = subject
    let newBody = body
    for (const [key, val] of Object.entries(vars)) {
      newSubject = newSubject.replaceAll(key, val)
      newBody = newBody.replaceAll(key, val)
    }
    setSubject(newSubject)
    setBody(newBody)
  }

  const filteredContacts = contacts.filter(c =>
    `${c.first_name} ${c.last_name} ${c.email ?? ''}`.toLowerCase().includes(contactSearch.toLowerCase())
  )

  async function handleSend() {
    if (!toEmail.trim()) {
      setError('Recipient email is required')
      return
    }
    if (!subject.trim() || !body.trim()) {
      setError('Subject and body are required')
      return
    }

    setSending(true)
    setError('')

    try {
      const res = await fetch('/api/v1/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: toEmail,
          subject,
          body,
          contactId: selectedContactId || null,
          userId,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send')

      setSent(true)
      setTimeout(() => router.push('/emails'), 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">Compose Email</h1>
        <div className="card animate-shimmer h-96" />
      </div>
    )
  }

  if (sent) {
    return (
      <div className="max-w-3xl">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(0,184,148,0.15)' }}>
            <CheckCircle className="w-8 h-8" style={{ color: 'var(--success)' }} />
          </div>
          <h3 className="text-lg font-semibold mb-1">Email Sent</h3>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Your email has been sent and logged as an activity.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <Link href="/emails" className="inline-flex items-center gap-1 text-sm mb-6 hover:underline" style={{ color: 'var(--muted)' }}>
        <ArrowLeft className="w-4 h-4" /> Back to emails
      </Link>

      <h1 className="text-2xl font-bold mb-6">Compose Email</h1>

      <div className="card space-y-4">
        {error && (
          <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(225,112,85,0.1)', color: 'var(--danger)' }}>
            {error}
          </div>
        )}

        {/* Template selector */}
        <div>
          <label>Template (optional)</label>
          <select
            value={selectedTemplateId}
            onChange={e => {
              const t = templates.find(t => t.id === e.target.value)
              if (t) applyTemplate(t)
              else { setSelectedTemplateId(''); }
            }}
            className="w-full"
          >
            <option value="">No template</option>
            {templates.map(t => (
              <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
            ))}
          </select>
        </div>

        {/* Contact picker */}
        <div className="relative">
          <label>To *</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted)' }} />
              <input
                type="text"
                value={contactSearch}
                onChange={e => { setContactSearch(e.target.value); setShowContactPicker(true) }}
                onFocus={() => setShowContactPicker(true)}
                placeholder="Search contacts..."
                className="w-full pl-10"
              />
              {selectedContactId && (
                <button
                  onClick={() => { setSelectedContactId(''); setContactSearch(''); setToEmail('') }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                </button>
              )}
            </div>
            <input
              type="email"
              value={toEmail}
              onChange={e => setToEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-64"
            />
          </div>

          {showContactPicker && contactSearch && (
            <div
              className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border shadow-lg"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              {filteredContacts.slice(0, 10).map(c => (
                <button
                  key={c.id}
                  onClick={() => selectContact(c)}
                  className="w-full px-4 py-2.5 text-left text-sm hover:bg-[var(--surface-2)] flex items-center justify-between"
                >
                  <span className="font-medium">{c.first_name} {c.last_name}</span>
                  <span style={{ color: 'var(--muted)' }}>{c.email ?? 'No email'}</span>
                </button>
              ))}
              {filteredContacts.length === 0 && (
                <p className="px-4 py-3 text-sm" style={{ color: 'var(--muted)' }}>No contacts found</p>
              )}
            </div>
          )}
        </div>

        {/* Subject */}
        <div>
          <label>Subject *</label>
          <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full" placeholder="Email subject..." />
        </div>

        {/* Body */}
        <div>
          <label>Body *</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={14}
            className="w-full"
            placeholder="Write your email..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link href="/emails" className="btn btn-secondary">Cancel</Link>
          <button onClick={handleSend} disabled={sending} className="btn btn-primary">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Send Email
          </button>
        </div>
      </div>
    </div>
  )
}
