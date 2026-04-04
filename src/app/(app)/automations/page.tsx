'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Plus, Zap, Play, Pause, Clock, Hash } from 'lucide-react'
import EmptyState from '@/components/shared/EmptyState'
import { formatDateTime } from '@/lib/utils'
import type { Workflow } from '@/types'

const TRIGGER_LABELS: Record<string, string> = {
  contact_created: 'Contact Created',
  deal_created: 'Deal Created',
  deal_stage_changed: 'Deal Stage Changed',
  deal_won: 'Deal Won',
  deal_lost: 'Deal Lost',
  activity_created: 'Activity Created',
  form_submitted: 'Form Submitted',
  manual: 'Manual Trigger',
}

const TRIGGER_COLORS: Record<string, string> = {
  contact_created: 'var(--success)',
  deal_created: 'var(--accent-light)',
  deal_stage_changed: 'var(--warning)',
  deal_won: 'var(--success)',
  deal_lost: 'var(--danger)',
  activity_created: 'var(--accent)',
  form_submitted: 'var(--accent-light)',
  manual: 'var(--muted)',
}

export default function AutomationsPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadWorkflows()
  }, [])

  async function loadWorkflows() {
    const { data } = await supabase
      .from('workflows')
      .select('*')
      .order('created_at', { ascending: false })

    setWorkflows(data ?? [])
    setLoading(false)
  }

  async function toggleActive(id: string, currentState: boolean) {
    await supabase.from('workflows').update({ is_active: !currentState }).eq('id', id)
    setWorkflows(prev => prev.map(w =>
      w.id === id ? { ...w, is_active: !currentState } : w
    ))
  }

  async function runManual(id: string) {
    try {
      await fetch('/api/v1/workflows/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workflowId: id }),
      })
      loadWorkflows()
    } catch (err) {
      console.error('Failed to run workflow:', err)
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Automations</h1>
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="card animate-shimmer h-24" />)}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Automations</h1>
        <Link href="/automations/new" className="btn btn-primary">
          <Plus className="w-4 h-4" /> New Workflow
        </Link>
      </div>

      {workflows.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="No automations yet"
          description="Create workflows to automate repetitive tasks"
          actionLabel="Create Workflow"
          actionHref="/automations/new"
        />
      ) : (
        <div className="space-y-3">
          {workflows.map(workflow => (
            <div
              key={workflow.id}
              className="card flex items-center justify-between hover:border-[var(--accent)] transition-colors"
              style={{ opacity: workflow.is_active ? 1 : 0.6 }}
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${TRIGGER_COLORS[workflow.trigger_type]}15` }}
                >
                  <Zap className="w-5 h-5" style={{ color: TRIGGER_COLORS[workflow.trigger_type] }} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold truncate">{workflow.name}</h3>
                    <span
                      className="badge text-[10px]"
                      style={{
                        background: workflow.is_active ? 'rgba(0,184,148,0.15)' : 'rgba(136,136,160,0.15)',
                        color: workflow.is_active ? 'var(--success)' : 'var(--muted)',
                      }}
                    >
                      {workflow.is_active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--muted)' }}>
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {TRIGGER_LABELS[workflow.trigger_type]}
                    </span>
                    <span className="flex items-center gap-1">
                      <Hash className="w-3 h-3" />
                      {workflow.actions.length} action{workflow.actions.length !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <Play className="w-3 h-3" />
                      {workflow.run_count} runs
                    </span>
                    {workflow.last_run_at && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Last: {formatDateTime(workflow.last_run_at)}
                      </span>
                    )}
                  </div>
                  {workflow.description && (
                    <p className="text-xs mt-1 truncate" style={{ color: 'var(--muted)' }}>
                      {workflow.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                {workflow.trigger_type === 'manual' && (
                  <button
                    onClick={() => runManual(workflow.id)}
                    className="btn btn-secondary text-xs py-1.5 px-3"
                  >
                    <Play className="w-3 h-3" /> Run
                  </button>
                )}
                <button
                  onClick={() => toggleActive(workflow.id, workflow.is_active)}
                  className="btn btn-secondary text-xs py-1.5 px-3"
                >
                  {workflow.is_active ? (
                    <><Pause className="w-3 h-3" /> Pause</>
                  ) : (
                    <><Play className="w-3 h-3" /> Enable</>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
