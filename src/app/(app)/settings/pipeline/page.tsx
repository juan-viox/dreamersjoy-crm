'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Plus, GripVertical, Trash2, Loader2, Save } from 'lucide-react'
import type { DealStage } from '@/types'

interface StageFormItem {
  id?: string
  name: string
  color: string
  position: number
  isNew?: boolean
}

export default function PipelineSettingsPage() {
  const [stages, setStages] = useState<StageFormItem[]>([])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('deal_stages')
        .select('*')
        .order('position')

      setStages((data ?? []).map(s => ({
        id: s.id,
        name: s.name,
        color: s.color,
        position: s.position,
      })))
    }
    load()
  }, [])

  function addStage() {
    setStages(prev => [
      ...prev,
      { name: '', color: '#6c5ce7', position: prev.length, isNew: true },
    ])
  }

  function removeStage(index: number) {
    setStages(prev => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, position: i })))
  }

  function moveStage(index: number, direction: -1 | 1) {
    const newIndex = index + direction
    if (newIndex < 0 || newIndex >= stages.length) return
    const newStages = [...stages]
    ;[newStages[index], newStages[newIndex]] = [newStages[newIndex], newStages[index]]
    setStages(newStages.map((s, i) => ({ ...s, position: i })))
  }

  async function handleSave() {
    setLoading(true)
    setError('')
    setSaved(false)

    try {
      // Delete removed stages
      const existingIds = stages.filter(s => s.id).map(s => s.id!)
      const { data: currentStages } = await supabase
        .from('deal_stages').select('id')
      const toDelete = (currentStages ?? []).filter(s => !existingIds.includes(s.id))
      for (const s of toDelete) {
        await supabase.from('deal_stages').delete().eq('id', s.id)
      }

      // Upsert stages
      for (const stage of stages) {
        if (stage.id) {
          await supabase.from('deal_stages').update({
            name: stage.name,
            color: stage.color,
            position: stage.position,
          }).eq('id', stage.id)
        } else {
          await supabase.from('deal_stages').insert({
            name: stage.name,
            color: stage.color,
            position: stage.position,
          })
        }
      }

      // Reload
      const { data } = await supabase
        .from('deal_stages').select('*').order('position')
      setStages((data ?? []).map(s => ({ id: s.id, name: s.name, color: s.color, position: s.position })))

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl">
      <Link href="/settings" className="inline-flex items-center gap-1 text-sm mb-6 hover:underline" style={{ color: 'var(--muted)' }}>
        <ArrowLeft className="w-4 h-4" /> Back to settings
      </Link>

      <h1 className="text-2xl font-bold mb-6">Pipeline Stages</h1>

      <div className="card space-y-4">
        {error && (
          <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(225,112,85,0.1)', color: 'var(--danger)' }}>{error}</div>
        )}
        {saved && (
          <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(0,184,148,0.1)', color: 'var(--success)' }}>Stages saved</div>
        )}

        <div className="space-y-2">
          {stages.map((stage, i) => (
            <div key={stage.id ?? `new-${i}`} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--surface-2)' }}>
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveStage(i, -1)} disabled={i === 0} className="text-xs" style={{ color: 'var(--muted)' }}>&#9650;</button>
                <button onClick={() => moveStage(i, 1)} disabled={i === stages.length - 1} className="text-xs" style={{ color: 'var(--muted)' }}>&#9660;</button>
              </div>
              <input
                type="color"
                value={stage.color}
                onChange={e => {
                  const updated = [...stages]
                  updated[i].color = e.target.value
                  setStages(updated)
                }}
                className="w-8 h-8 rounded cursor-pointer border-0 p-0"
              />
              <input
                value={stage.name}
                onChange={e => {
                  const updated = [...stages]
                  updated[i].name = e.target.value
                  setStages(updated)
                }}
                placeholder="Stage name"
                className="flex-1"
              />
              <button onClick={() => removeStage(i)} className="p-1.5 rounded hover:bg-[var(--border)]" style={{ color: 'var(--danger)' }}>
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <button onClick={addStage} className="btn btn-secondary w-full justify-center">
          <Plus className="w-4 h-4" /> Add Stage
        </button>

        <div className="flex justify-end">
          <button onClick={handleSave} disabled={loading} className="btn btn-primary">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Stages
          </button>
        </div>
      </div>
    </div>
  )
}
