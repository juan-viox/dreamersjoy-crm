'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Plus, Save, Trash2, Loader2, X, Mail } from 'lucide-react'
import type { EmailTemplate } from '@/types'

const CATEGORIES = ['general', 'welcome', 'follow-up', 'proposal', 'invoice', 'reminder', 'thank-you']
const COMMON_VARIABLES = ['{{first_name}}', '{{last_name}}', '{{email}}', '{{company}}', '{{deal_title}}', '{{deal_amount}}', '{{invoice_number}}', '{{due_date}}']

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [userId, setUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState('general')
  const [variables, setVariables] = useState<string[]>([])

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const { data } = await supabase
      .from('email_templates')
      .select('*')
      .order('updated_at', { ascending: false })

    setTemplates(data ?? [])
    setLoading(false)

    // Check for edit param
    const params = new URLSearchParams(window.location.search)
    const editId = params.get('edit')
    if (editId && data) {
      const t = data.find(t => t.id === editId)
      if (t) startEdit(t)
    }
  }

  function startEdit(template: EmailTemplate) {
    setEditingId(template.id)
    setName(template.name)
    setSubject(template.subject)
    setBody(template.body)
    setCategory(template.category)
    setVariables(template.variables)
    setShowForm(true)
  }

  function resetForm() {
    setEditingId(null)
    setName('')
    setSubject('')
    setBody('')
    setCategory('general')
    setVariables([])
    setShowForm(false)
    setError('')
  }

  function insertVariable(v: string) {
    setBody(prev => prev + v)
    if (!variables.includes(v)) {
      setVariables(prev => [...prev, v])
    }
  }

  async function handleSave() {
    if (!name.trim() || !subject.trim() || !body.trim()) {
      setError('Name, subject, and body are required')
      return
    }
    setSaving(true)
    setError('')

    // Auto-detect variables in body
    const detectedVars = body.match(/\{\{[a-z_]+\}\}/g) ?? []
    const allVars = [...new Set([...variables, ...detectedVars])]

    if (editingId) {
      const { error: updateError } = await supabase
        .from('email_templates')
        .update({ name, subject, body, category, variables: allVars })
        .eq('id', editingId)

      if (updateError) { setError(updateError.message); setSaving(false); return }
    } else {
      const { error: insertError } = await supabase
        .from('email_templates')
        .insert({
          name, subject, body, category,
          variables: allVars,
          created_by: userId,
        })

      if (insertError) { setError(insertError.message); setSaving(false); return }
    }

    setSaving(false)
    resetForm()
    loadData()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this template?')) return
    await supabase.from('email_templates').delete().eq('id', id)
    setTemplates(prev => prev.filter(t => t.id !== id))
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Email Templates</h1>
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="card animate-shimmer h-20" />)}
        </div>
      </div>
    )
  }

  return (
    <div>
      <Link href="/emails" className="inline-flex items-center gap-1 text-sm mb-6 hover:underline" style={{ color: 'var(--muted)' }}>
        <ArrowLeft className="w-4 h-4" /> Back to emails
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Email Templates</h1>
        {!showForm && (
          <button onClick={() => { resetForm(); setShowForm(true) }} className="btn btn-primary">
            <Plus className="w-4 h-4" /> New Template
          </button>
        )}
      </div>

      {/* Template form */}
      {showForm && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">
              {editingId ? 'Edit Template' : 'New Template'}
            </h2>
            <button onClick={resetForm} className="p-1.5 rounded-md hover:bg-[var(--surface-2)]">
              <X className="w-4 h-4" style={{ color: 'var(--muted)' }} />
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-lg text-sm mb-4" style={{ background: 'rgba(225,112,85,0.1)', color: 'var(--danger)' }}>
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label>Template Name *</label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full" placeholder="Welcome Email" />
              </div>
              <div>
                <label>Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full">
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label>Subject *</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full" placeholder="Welcome to {{company}}, {{first_name}}!" />
            </div>

            <div>
              <label>Body *</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {COMMON_VARIABLES.map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => insertVariable(v)}
                    className="text-[11px] px-2 py-0.5 rounded-md transition-colors"
                    style={{ background: 'var(--surface-2)', color: 'var(--accent-light)' }}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={10}
                className="w-full font-mono text-sm"
                placeholder="Hi {{first_name}},&#10;&#10;Thank you for your interest..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={resetForm} className="btn btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn btn-primary">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingId ? 'Update' : 'Create'} Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template list */}
      {templates.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--surface-2)' }}>
            <Mail className="w-8 h-8" style={{ color: 'var(--muted)' }} />
          </div>
          <h3 className="text-lg font-semibold mb-1">No templates yet</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>Create your first email template to get started</p>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            <Plus className="w-4 h-4" /> Create Template
          </button>
        </div>
      ) : (
        <div className="card p-0">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Subject</th>
                  <th>Category</th>
                  <th>Variables</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.map(t => (
                  <tr key={t.id}>
                    <td className="font-medium">{t.name}</td>
                    <td style={{ color: 'var(--muted)' }} className="max-w-[250px] truncate">{t.subject}</td>
                    <td>
                      <span className="badge" style={{ background: 'rgba(108,92,231,0.15)', color: 'var(--accent-light)' }}>
                        {t.category}
                      </span>
                    </td>
                    <td style={{ color: 'var(--muted)' }}>{t.variables.length}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button onClick={() => startEdit(t)} className="btn btn-secondary text-xs py-1 px-2">
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(t.id)}
                          className="p-1.5 rounded-md hover:bg-[var(--surface-2)] transition-colors"
                          style={{ color: 'var(--danger)' }}
                        >
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
