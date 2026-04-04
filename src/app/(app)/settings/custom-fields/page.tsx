'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Save,
  Loader2,
  X,
  Type,
  Hash,
  Calendar,
  List,
  CheckSquare,
  Link2,
  Mail,
  Phone,
  AlignLeft,
  ListChecks,
  Eye,
} from 'lucide-react'
import Link from 'next/link'

type EntityType = 'contact' | 'company' | 'deal'
type FieldType = 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'checkbox' | 'url' | 'email' | 'phone' | 'textarea'

interface FieldDefinition {
  id: string
  entity_type: EntityType
  field_name: string
  field_label: string
  field_type: FieldType
  options: string[]
  is_required: boolean
  sort_order: number
  created_at: string
}

const ENTITY_TABS: { key: EntityType; label: string }[] = [
  { key: 'contact', label: 'Contacts' },
  { key: 'company', label: 'Companies' },
  { key: 'deal', label: 'Deals' },
]

const FIELD_TYPES: { value: FieldType; label: string; icon: typeof Type }[] = [
  { value: 'text', label: 'Text', icon: Type },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'select', label: 'Select', icon: List },
  { value: 'multiselect', label: 'Multi-Select', icon: ListChecks },
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { value: 'url', label: 'URL', icon: Link2 },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'phone', label: 'Phone', icon: Phone },
  { value: 'textarea', label: 'Long Text', icon: AlignLeft },
]

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function getFieldIcon(type: FieldType) {
  const found = FIELD_TYPES.find((f) => f.value === type)
  return found ? found.icon : Type
}

export default function CustomFieldsPage() {
  const supabase = createClient()
  const [activeTab, setActiveTab] = useState<EntityType>('contact')
  const [fields, setFields] = useState<FieldDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // New field form state
  const [newLabel, setNewLabel] = useState('')
  const [newType, setNewType] = useState<FieldType>('text')
  const [newRequired, setNewRequired] = useState(false)
  const [newOptions, setNewOptions] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // No org ID needed in standalone mode

  const fetchFields = useCallback(async () => {
    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('custom_field_definitions')
      .select('*')
      .eq('entity_type', activeTab)
      .order('sort_order', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setFields((data as FieldDefinition[]) ?? [])
    }
    setLoading(false)
  }, [activeTab, supabase])

  useEffect(() => {
    fetchFields()
  }, [fetchFields])

  function resetForm() {
    setNewLabel('')
    setNewType('text')
    setNewRequired(false)
    setNewOptions('')
    setEditingId(null)
    setShowForm(false)
  }

  function startEdit(field: FieldDefinition) {
    setEditingId(field.id)
    setNewLabel(field.field_label)
    setNewType(field.field_type)
    setNewRequired(field.is_required)
    setNewOptions((field.options ?? []).join(', '))
    setShowForm(true)
  }

  async function handleSave() {
    if (!newLabel.trim()) {
      setError('Field label is required')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')

    const fieldName = slugify(newLabel)
    const options =
      newType === 'select' || newType === 'multiselect'
        ? newOptions
            .split(',')
            .map((o) => o.trim())
            .filter(Boolean)
        : []

    if (editingId) {
      const { error: updateError } = await supabase
        .from('custom_field_definitions')
        .update({
          field_label: newLabel.trim(),
          field_name: fieldName,
          field_type: newType,
          is_required: newRequired,
          options,
        })
        .eq('id', editingId)

      if (updateError) {
        setError(updateError.message)
        setSaving(false)
        return
      }
      setSuccess('Field updated')
    } else {
      const maxSort = fields.length > 0 ? Math.max(...fields.map((f) => f.sort_order)) + 1 : 0
      const { error: insertError } = await supabase
        .from('custom_field_definitions')
        .insert({
          entity_type: activeTab,
          field_name: fieldName,
          field_label: newLabel.trim(),
          field_type: newType,
          is_required: newRequired,
          options,
          sort_order: maxSort,
        })

      if (insertError) {
        setError(insertError.message)
        setSaving(false)
        return
      }
      setSuccess('Field created')
    }

    resetForm()
    await fetchFields()
    setSaving(false)
    setTimeout(() => setSuccess(''), 3000)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this custom field and all its values?')) return
    setError('')
    const { error: deleteError } = await supabase
      .from('custom_field_definitions')
      .delete()
      .eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      return
    }
    await fetchFields()
  }

  function handleDragStart(index: number) {
    setDragIndex(index)
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    setDragOverIndex(index)
  }

  async function handleDrop(index: number) {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null)
      setDragOverIndex(null)
      return
    }

    const reordered = [...fields]
    const [moved] = reordered.splice(dragIndex, 1)
    reordered.splice(index, 0, moved)

    // Optimistic update
    setFields(reordered)
    setDragIndex(null)
    setDragOverIndex(null)

    // Persist sort order
    const updates = reordered.map((f, i) =>
      supabase
        .from('custom_field_definitions')
        .update({ sort_order: i })
        .eq('id', f.id)
    )
    await Promise.all(updates)
  }

  const showOptionsInput = newType === 'select' || newType === 'multiselect'

  return (
    <div className="max-w-3xl">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-sm mb-6 hover:underline transition-colors"
        style={{ color: 'var(--muted)' }}
      >
        <ArrowLeft className="w-4 h-4" /> Back to settings
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Custom Fields</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="btn btn-secondary btn-sm"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={() => {
              resetForm()
              setShowForm(true)
            }}
            className="btn btn-primary btn-sm"
          >
            <Plus className="w-4 h-4" />
            Add Field
          </button>
        </div>
      </div>

      {/* Entity Type Tabs */}
      <div className="tab-list mb-6">
        {ENTITY_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key)
              resetForm()
            }}
            className={`tab-item ${activeTab === tab.key ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div
          className="p-3 rounded-lg text-sm mb-4"
          style={{ background: 'rgba(225,112,85,0.1)', color: 'var(--danger)' }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          className="p-3 rounded-lg text-sm mb-4"
          style={{ background: 'rgba(0,184,148,0.1)', color: 'var(--success)' }}
        >
          {success}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">
              {editingId ? 'Edit Field' : 'New Custom Field'}
            </h3>
            <button
              onClick={resetForm}
              className="p-1 rounded hover:bg-[var(--surface-2)]"
              style={{ color: 'var(--muted)' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Field Label</label>
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. LinkedIn URL, Contract Value..."
                className="w-full"
              />
              {newLabel && (
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                  Field name: <code className="px-1 py-0.5 rounded" style={{ background: 'var(--surface-2)' }}>{slugify(newLabel)}</code>
                </p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Field Type</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {FIELD_TYPES.map((ft) => {
                  const Icon = ft.icon
                  return (
                    <button
                      key={ft.value}
                      type="button"
                      onClick={() => setNewType(ft.value)}
                      className="flex flex-col items-center gap-1 p-2.5 rounded-lg border text-xs transition-all"
                      style={{
                        borderColor: newType === ft.value ? 'var(--accent)' : 'var(--border)',
                        background: newType === ft.value ? 'rgba(108,92,231,0.08)' : 'transparent',
                        color: newType === ft.value ? 'var(--accent-light)' : 'var(--muted)',
                      }}
                    >
                      <Icon className="w-4 h-4" />
                      {ft.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {showOptionsInput && (
              <div>
                <label className="text-sm font-medium mb-1 block">
                  Options <span style={{ color: 'var(--muted)' }}>(comma-separated)</span>
                </label>
                <input
                  value={newOptions}
                  onChange={(e) => setNewOptions(e.target.value)}
                  placeholder="Option 1, Option 2, Option 3"
                  className="w-full"
                />
              </div>
            )}

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={newRequired}
                onChange={(e) => setNewRequired(e.target.checked)}
                className="rounded"
              />
              Required field
            </label>

            <div className="flex justify-end gap-2">
              <button onClick={resetForm} className="btn btn-secondary btn-sm">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !newLabel.trim()}
                className="btn btn-primary btn-sm"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fields List */}
      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--muted)' }} />
          </div>
        ) : fields.length === 0 ? (
          <div className="text-center py-12">
            <Type className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--muted)' }} />
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              No custom fields for {activeTab}s yet
            </p>
            <button
              onClick={() => {
                resetForm()
                setShowForm(true)
              }}
              className="btn btn-primary btn-sm mt-4"
            >
              <Plus className="w-4 h-4" /> Add First Field
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {fields.map((field, index) => {
              const Icon = getFieldIcon(field.field_type)
              return (
                <div
                  key={field.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={() => handleDrop(index)}
                  onDragEnd={() => {
                    setDragIndex(null)
                    setDragOverIndex(null)
                  }}
                  className="flex items-center gap-3 p-3 rounded-lg transition-all"
                  style={{
                    background:
                      dragOverIndex === index
                        ? 'rgba(108,92,231,0.08)'
                        : 'var(--surface-2)',
                    opacity: dragIndex === index ? 0.5 : 1,
                    cursor: 'grab',
                  }}
                >
                  <GripVertical
                    className="w-4 h-4 shrink-0"
                    style={{ color: 'var(--muted)' }}
                  />
                  <div
                    className="p-1.5 rounded-md shrink-0"
                    style={{ background: 'rgba(108,92,231,0.12)' }}
                  >
                    <Icon
                      className="w-4 h-4"
                      style={{ color: 'var(--accent-light)' }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {field.field_label}
                      {field.is_required && (
                        <span className="ml-1 text-xs" style={{ color: 'var(--danger)' }}>*</span>
                      )}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                      {FIELD_TYPES.find((ft) => ft.value === field.field_type)?.label}
                      {field.options && field.options.length > 0 && (
                        <span> &middot; {field.options.length} options</span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(field)}
                      className="p-1.5 rounded hover:bg-[var(--surface)] transition-colors"
                      style={{ color: 'var(--muted)' }}
                      title="Edit"
                    >
                      <Type className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(field.id)}
                      className="p-1.5 rounded hover:bg-[var(--surface)] transition-colors"
                      style={{ color: 'var(--danger)' }}
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Preview Panel */}
      {showPreview && fields.length > 0 && (
        <div className="card mt-6">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--muted)' }}>
            <Eye className="w-4 h-4 inline mr-1.5" />
            Field Preview
          </h3>
          <div className="space-y-4">
            {fields.map((field) => (
              <div key={field.id}>
                <label className="text-sm font-medium mb-1 block">
                  {field.field_label}
                  {field.is_required && (
                    <span className="ml-1" style={{ color: 'var(--danger)' }}>*</span>
                  )}
                </label>
                {field.field_type === 'text' && (
                  <input disabled placeholder={`Enter ${field.field_label.toLowerCase()}`} className="w-full opacity-60" />
                )}
                {field.field_type === 'number' && (
                  <input type="number" disabled placeholder="0" className="w-full opacity-60" />
                )}
                {field.field_type === 'date' && (
                  <input type="date" disabled className="w-full opacity-60" />
                )}
                {field.field_type === 'email' && (
                  <input type="email" disabled placeholder="email@example.com" className="w-full opacity-60" />
                )}
                {field.field_type === 'phone' && (
                  <input type="tel" disabled placeholder="+1 (555) 000-0000" className="w-full opacity-60" />
                )}
                {field.field_type === 'url' && (
                  <input type="url" disabled placeholder="https://..." className="w-full opacity-60" />
                )}
                {field.field_type === 'textarea' && (
                  <textarea disabled placeholder={`Enter ${field.field_label.toLowerCase()}`} className="w-full opacity-60" rows={3} />
                )}
                {field.field_type === 'checkbox' && (
                  <label className="flex items-center gap-2 text-sm opacity-60">
                    <input type="checkbox" disabled className="rounded" />
                    {field.field_label}
                  </label>
                )}
                {(field.field_type === 'select' || field.field_type === 'multiselect') && (
                  <select disabled className="w-full opacity-60">
                    <option>Select {field.field_label.toLowerCase()}...</option>
                    {(field.options ?? []).map((opt: string) => (
                      <option key={opt}>{opt}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
