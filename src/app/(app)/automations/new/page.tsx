'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  ArrowLeft, Save, Loader2, Plus, Trash2, ChevronDown, ChevronUp,
  Zap, Mail, Activity, Tag, Bell, Clock, ArrowRight, GripVertical,
} from 'lucide-react'
import type { WorkflowAction, WorkflowTrigger, WorkflowActionType, EmailTemplate, DealStage } from '@/types'

const TRIGGERS: { value: WorkflowTrigger; label: string; description: string }[] = [
  { value: 'contact_created', label: 'Contact Created', description: 'Fires when a new contact is added' },
  { value: 'deal_created', label: 'Deal Created', description: 'Fires when a new deal is created' },
  { value: 'deal_stage_changed', label: 'Deal Stage Changed', description: 'Fires when a deal moves to a different stage' },
  { value: 'deal_won', label: 'Deal Won', description: 'Fires when a deal is marked as won' },
  { value: 'deal_lost', label: 'Deal Lost', description: 'Fires when a deal is marked as lost' },
  { value: 'activity_created', label: 'Activity Created', description: 'Fires when a new activity is logged' },
  { value: 'form_submitted', label: 'Form Submitted', description: 'Fires when a web form is submitted' },
  { value: 'manual', label: 'Manual Trigger', description: 'Run manually from the automations page' },
]

const ACTION_TYPES: { value: WorkflowActionType; label: string; icon: typeof Mail; description: string }[] = [
  { value: 'send_email', label: 'Send Email', icon: Mail, description: 'Send an email using a template' },
  { value: 'create_activity', label: 'Create Activity', icon: Activity, description: 'Log a new activity' },
  { value: 'add_tag', label: 'Add Tag', icon: Tag, description: 'Add a tag to the entity' },
  { value: 'notify_user', label: 'Notify User', icon: Bell, description: 'Send a notification to a team member' },
  { value: 'wait', label: 'Wait', icon: Clock, description: 'Wait for a specified duration' },
]

export default function NewWorkflowPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [triggerType, setTriggerType] = useState<WorkflowTrigger>('contact_created')
  const [actions, setActions] = useState<WorkflowAction[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)
  const [showActionPicker, setShowActionPicker] = useState(false)

  // Reference data
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [stages, setStages] = useState<DealStage[]>([])

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [templatesRes, stagesRes] = await Promise.all([
      supabase.from('email_templates').select('*'),
      supabase.from('deal_stages').select('*').order('position'),
    ])

    setTemplates(templatesRes.data ?? [])
    setStages(stagesRes.data ?? [])
  }

  function addAction(type: WorkflowActionType) {
    const newAction: WorkflowAction = {
      id: crypto.randomUUID(),
      type,
      config: {},
    }

    // Set defaults
    switch (type) {
      case 'send_email':
        newAction.config = { template_id: '', to_field: 'contact_email' }
        break
      case 'create_activity':
        newAction.config = { type: 'task', title: '', description: '' }
        break
      case 'add_tag':
        newAction.config = { tag_name: '' }
        break
      case 'notify_user':
        newAction.config = { user_id: '', message: '' }
        break
      case 'wait':
        newAction.config = { duration_minutes: 60 }
        break
    }

    setActions(prev => [...prev, newAction])
    setShowActionPicker(false)
  }

  function removeAction(id: string) {
    setActions(prev => prev.filter(a => a.id !== id))
  }

  function updateActionConfig(id: string, key: string, value: unknown) {
    setActions(prev => prev.map(a =>
      a.id === id ? { ...a, config: { ...a.config, [key]: value } } : a
    ))
  }

  function moveAction(id: string, direction: 'up' | 'down') {
    setActions(prev => {
      const idx = prev.findIndex(a => a.id === id)
      if (idx < 0) return prev
      const newIdx = direction === 'up' ? idx - 1 : idx + 1
      if (newIdx < 0 || newIdx >= prev.length) return prev
      const copy = [...prev]
      ;[copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]]
      return copy
    })
  }

  async function handleSave() {
    if (!name.trim()) { setError('Workflow name is required'); return }
    if (actions.length === 0) { setError('Add at least one action'); return }

    setSaving(true)
    setError('')

    const { error: insertError } = await supabase
      .from('workflows')
      .insert({
        name,
        description: description || null,
        trigger_type: triggerType,
        trigger_config: {},
        actions,
        is_active: true,
      })

    if (insertError) { setError(insertError.message); setSaving(false); return }

    router.push('/automations')
    router.refresh()
  }

  function renderActionConfig(action: WorkflowAction) {
    switch (action.type) {
      case 'send_email':
        return (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs">Email Template</label>
              <select
                value={(action.config.template_id as string) ?? ''}
                onChange={e => updateActionConfig(action.id, 'template_id', e.target.value)}
                className="w-full text-sm"
              >
                <option value="">Select template</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs">Send To</label>
              <select
                value={(action.config.to_field as string) ?? 'contact_email'}
                onChange={e => updateActionConfig(action.id, 'to_field', e.target.value)}
                className="w-full text-sm"
              >
                <option value="contact_email">Contact Email</option>
                <option value="deal_contact_email">Deal Contact Email</option>
              </select>
            </div>
          </div>
        )
      case 'create_activity':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs">Activity Type</label>
                <select
                  value={(action.config.type as string) ?? 'task'}
                  onChange={e => updateActionConfig(action.id, 'type', e.target.value)}
                  className="w-full text-sm"
                >
                  <option value="task">Task</option>
                  <option value="call">Call</option>
                  <option value="email">Email</option>
                  <option value="meeting">Meeting</option>
                  <option value="note">Note</option>
                </select>
              </div>
              <div>
                <label className="text-xs">Title</label>
                <input
                  value={(action.config.title as string) ?? ''}
                  onChange={e => updateActionConfig(action.id, 'title', e.target.value)}
                  className="w-full text-sm"
                  placeholder="Follow up with contact"
                />
              </div>
            </div>
            <div>
              <label className="text-xs">Description</label>
              <textarea
                value={(action.config.description as string) ?? ''}
                onChange={e => updateActionConfig(action.id, 'description', e.target.value)}
                className="w-full text-sm"
                rows={2}
                placeholder="Activity details..."
              />
            </div>
          </div>
        )
      case 'add_tag':
        return (
          <div>
            <label className="text-xs">Tag Name</label>
            <input
              value={(action.config.tag_name as string) ?? ''}
              onChange={e => updateActionConfig(action.id, 'tag_name', e.target.value)}
              className="w-full text-sm"
              placeholder="e.g. hot-lead"
            />
          </div>
        )
      case 'notify_user':
        return (
          <div>
            <label className="text-xs">Notification Message</label>
            <input
              value={(action.config.message as string) ?? ''}
              onChange={e => updateActionConfig(action.id, 'message', e.target.value)}
              className="w-full text-sm"
              placeholder="New lead requires attention"
            />
          </div>
        )
      case 'wait':
        return (
          <div>
            <label className="text-xs">Wait Duration (minutes)</label>
            <input
              type="number"
              min="1"
              value={(action.config.duration_minutes as number) ?? 60}
              onChange={e => updateActionConfig(action.id, 'duration_minutes', parseInt(e.target.value) || 60)}
              className="w-full text-sm"
            />
          </div>
        )
      default:
        return null
    }
  }

  const selectedTrigger = TRIGGERS.find(t => t.value === triggerType)

  return (
    <div className="max-w-3xl">
      <Link href="/automations" className="inline-flex items-center gap-1 text-sm mb-6 hover:underline" style={{ color: 'var(--muted)' }}>
        <ArrowLeft className="w-4 h-4" /> Back to automations
      </Link>

      <h1 className="text-2xl font-bold mb-6">New Workflow</h1>

      {error && (
        <div className="p-3 rounded-lg text-sm mb-4" style={{ background: 'rgba(225,112,85,0.1)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {/* Step indicators */}
      <div className="flex items-center gap-3 mb-6">
        {[1, 2, 3].map(s => (
          <button
            key={s}
            onClick={() => setStep(s)}
            className="flex items-center gap-2"
          >
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
              style={{
                background: step >= s ? 'var(--accent)' : 'var(--surface-2)',
                color: step >= s ? 'white' : 'var(--muted)',
              }}
            >
              {s}
            </div>
            <span className="text-sm font-medium" style={{ color: step >= s ? 'var(--text)' : 'var(--muted)' }}>
              {s === 1 ? 'Trigger' : s === 2 ? 'Actions' : 'Review'}
            </span>
            {s < 3 && <div className="w-8 h-px mx-1" style={{ background: step > s ? 'var(--accent)' : 'var(--border)' }} />}
          </button>
        ))}
      </div>

      {/* Step 1: Trigger */}
      {step === 1 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-2">Choose a Trigger</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>What event should start this workflow?</p>

          <div className="mb-6">
            <label>Workflow Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full" placeholder="e.g. Welcome New Leads" />
          </div>

          <div className="mb-4">
            <label>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full" placeholder="What does this workflow do?" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TRIGGERS.map(trigger => (
              <button
                key={trigger.value}
                onClick={() => setTriggerType(trigger.value)}
                className="p-4 rounded-lg border text-left transition-all"
                style={{
                  borderColor: triggerType === trigger.value ? 'var(--accent)' : 'var(--border)',
                  background: triggerType === trigger.value ? 'rgba(108,92,231,0.08)' : 'var(--surface-2)',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4" style={{ color: triggerType === trigger.value ? 'var(--accent)' : 'var(--muted)' }} />
                  <span className="font-medium text-sm">{trigger.label}</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>{trigger.description}</p>
              </button>
            ))}
          </div>

          <div className="flex justify-end mt-6">
            <button onClick={() => setStep(2)} className="btn btn-primary">
              Next: Add Actions <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Actions */}
      {step === 2 && (
        <div className="space-y-4">
          {/* Trigger summary */}
          <div className="card flex items-center gap-3 py-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(108,92,231,0.15)' }}>
              <Zap className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>When</p>
              <p className="text-sm font-medium">{selectedTrigger?.label}</p>
            </div>
          </div>

          {/* Action list */}
          {actions.map((action, idx) => {
            const actionType = ACTION_TYPES.find(a => a.value === action.type)
            if (!actionType) return null
            const Icon = actionType.icon

            return (
              <div key={action.id}>
                {/* Arrow connector */}
                <div className="flex justify-center py-1">
                  <div className="w-px h-4" style={{ background: 'var(--border)' }} />
                </div>

                <div className="card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
                        <Icon className="w-3.5 h-3.5" style={{ color: 'var(--accent-light)' }} />
                      </div>
                      <span className="text-sm font-medium">{actionType.label}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>
                        Step {idx + 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveAction(action.id, 'up')}
                        disabled={idx === 0}
                        className="p-1 rounded hover:bg-[var(--surface-2)]"
                        style={{ color: idx === 0 ? 'var(--border)' : 'var(--muted)' }}
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveAction(action.id, 'down')}
                        disabled={idx === actions.length - 1}
                        className="p-1 rounded hover:bg-[var(--surface-2)]"
                        style={{ color: idx === actions.length - 1 ? 'var(--border)' : 'var(--muted)' }}
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeAction(action.id)}
                        className="p-1 rounded hover:bg-[var(--surface-2)]"
                        style={{ color: 'var(--danger)' }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {renderActionConfig(action)}
                </div>
              </div>
            )
          })}

          {/* Add action */}
          <div className="flex justify-center py-1">
            <div className="w-px h-4" style={{ background: 'var(--border)' }} />
          </div>

          {showActionPicker ? (
            <div className="card">
              <h3 className="text-sm font-semibold mb-3">Choose an Action</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {ACTION_TYPES.map(action => {
                  const Icon = action.icon
                  return (
                    <button
                      key={action.value}
                      onClick={() => addAction(action.value)}
                      className="flex items-center gap-3 p-3 rounded-lg text-left transition-colors hover:bg-[var(--surface-2)]"
                      style={{ border: '1px solid var(--border)' }}
                    >
                      <Icon className="w-4 h-4 shrink-0" style={{ color: 'var(--accent-light)' }} />
                      <div>
                        <p className="text-sm font-medium">{action.label}</p>
                        <p className="text-[11px]" style={{ color: 'var(--muted)' }}>{action.description}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => setShowActionPicker(false)}
                className="btn btn-secondary text-xs mt-3 w-full"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowActionPicker(true)}
              className="w-full py-3 rounded-lg border-2 border-dashed text-sm font-medium transition-colors hover:border-[var(--accent)]"
              style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
            >
              <Plus className="w-4 h-4 inline mr-1" /> Add Action
            </button>
          )}

          <div className="flex justify-between mt-4">
            <button onClick={() => setStep(1)} className="btn btn-secondary">Back</button>
            <button onClick={() => setStep(3)} className="btn btn-primary" disabled={actions.length === 0}>
              Review <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Review Workflow</h2>

          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-2 text-sm">
              <span style={{ color: 'var(--muted)' }}>Name:</span>
              <span className="font-medium">{name || 'Unnamed'}</span>
            </div>
            {description && (
              <div className="flex items-center gap-2 text-sm">
                <span style={{ color: 'var(--muted)' }}>Description:</span>
                <span>{description}</span>
              </div>
            )}
          </div>

          {/* Visual flow */}
          <div className="p-4 rounded-lg" style={{ background: 'var(--surface-2)' }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(108,92,231,0.2)' }}>
                <Zap className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>When</p>
                <p className="text-sm font-semibold">{selectedTrigger?.label}</p>
              </div>
            </div>

            {actions.map((action, idx) => {
              const actionType = ACTION_TYPES.find(a => a.value === action.type)
              if (!actionType) return null
              const Icon = actionType.icon

              return (
                <div key={action.id}>
                  <div className="flex items-center gap-2 pl-3 py-1">
                    <ArrowRight className="w-3 h-3" style={{ color: 'var(--muted)' }} />
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>then</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--surface)' }}>
                      <Icon className="w-4 h-4" style={{ color: 'var(--accent-light)' }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{actionType.label}</p>
                      <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                        {action.type === 'send_email' && `Template: ${templates.find(t => t.id === action.config.template_id)?.name || 'Not set'}`}
                        {action.type === 'create_activity' && `${action.config.type}: ${action.config.title || 'Not set'}`}
                        {action.type === 'add_tag' && `Tag: ${action.config.tag_name || 'Not set'}`}
                        {action.type === 'notify_user' && `Message: ${action.config.message || 'Not set'}`}
                        {action.type === 'wait' && `${action.config.duration_minutes} minutes`}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex justify-between mt-6">
            <button onClick={() => setStep(2)} className="btn btn-secondary">Back</button>
            <button onClick={handleSave} disabled={saving} className="btn btn-primary">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Create & Activate
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
