'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

type FieldType = 'text' | 'number' | 'date' | 'select' | 'multiselect' | 'checkbox' | 'url' | 'email' | 'phone' | 'textarea'

interface FieldDefinition {
  id: string
  field_name: string
  field_label: string
  field_type: FieldType
  options: string[]
  is_required: boolean
  sort_order: number
}

interface FieldValue {
  id: string
  field_id: string
  value: string | null
}

export default function CustomFieldsRenderer({
  entityType,
  entityId,
}: {
  entityType: 'contact' | 'company' | 'deal'
  entityId: string
}) {
  const supabase = createClient()
  const [definitions, setDefinitions] = useState<FieldDefinition[]>([])
  const [values, setValues] = useState<Record<string, FieldValue>>({})
  const [loading, setLoading] = useState(true)
  const [savingField, setSavingField] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [defsRes, valsRes] = await Promise.all([
      supabase
        .from('custom_field_definitions')
        .select('*')
        .eq('entity_type', entityType)
        .order('sort_order', { ascending: true }),
      supabase
        .from('custom_field_values')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId),
    ])

    setDefinitions((defsRes.data as FieldDefinition[]) ?? [])

    const valMap: Record<string, FieldValue> = {}
    for (const v of (valsRes.data ?? []) as FieldValue[]) {
      valMap[v.field_id] = v
    }
    setValues(valMap)
    setLoading(false)
  }, [entityType, entityId, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function saveValue(fieldId: string, newValue: string) {
    setSavingField(fieldId)
    const existing = values[fieldId]

    if (existing) {
      await supabase
        .from('custom_field_values')
        .update({ value: newValue, updated_at: new Date().toISOString() })
        .eq('id', existing.id)

      setValues((prev) => ({
        ...prev,
        [fieldId]: { ...existing, value: newValue },
      }))
    } else {
      const { data } = await supabase
        .from('custom_field_values')
        .insert({
          field_id: fieldId,
          entity_type: entityType,
          entity_id: entityId,
          value: newValue,
        })
        .select()
        .single()

      if (data) {
        setValues((prev) => ({
          ...prev,
          [fieldId]: data as FieldValue,
        }))
      }
    }
    setSavingField(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--muted)' }} />
      </div>
    )
  }

  if (definitions.length === 0) return null

  return (
    <div className="space-y-4">
      {definitions.map((def) => {
        const currentValue = values[def.id]?.value ?? ''
        const isSaving = savingField === def.id

        return (
          <div key={def.id}>
            <label className="text-sm font-medium mb-1 block">
              {def.field_label}
              {def.is_required && (
                <span className="ml-1" style={{ color: 'var(--danger)' }}>*</span>
              )}
              {isSaving && (
                <Loader2 className="w-3 h-3 animate-spin inline ml-2" style={{ color: 'var(--muted)' }} />
              )}
            </label>
            <FieldInput
              definition={def}
              value={currentValue}
              onChange={(val) => saveValue(def.id, val)}
            />
          </div>
        )
      })}
    </div>
  )
}

function FieldInput({
  definition,
  value,
  onChange,
}: {
  definition: FieldDefinition
  value: string
  onChange: (val: string) => void
}) {
  const [localValue, setLocalValue] = useState(value)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  function handleBlur() {
    if (localValue !== value) {
      onChange(localValue)
    }
  }

  switch (definition.field_type) {
    case 'text':
      return (
        <input
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          placeholder={`Enter ${definition.field_label.toLowerCase()}`}
          className="w-full"
        />
      )
    case 'number':
      return (
        <input
          type="number"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          placeholder="0"
          className="w-full"
        />
      )
    case 'date':
      return (
        <input
          type="date"
          value={localValue}
          onChange={(e) => {
            setLocalValue(e.target.value)
            onChange(e.target.value)
          }}
          className="w-full"
        />
      )
    case 'email':
      return (
        <input
          type="email"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          placeholder="email@example.com"
          className="w-full"
        />
      )
    case 'phone':
      return (
        <input
          type="tel"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          placeholder="+1 (555) 000-0000"
          className="w-full"
        />
      )
    case 'url':
      return (
        <input
          type="url"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          placeholder="https://..."
          className="w-full"
        />
      )
    case 'textarea':
      return (
        <textarea
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          placeholder={`Enter ${definition.field_label.toLowerCase()}`}
          className="w-full"
          rows={3}
        />
      )
    case 'checkbox':
      return (
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={localValue === 'true'}
            onChange={(e) => {
              const v = e.target.checked ? 'true' : 'false'
              setLocalValue(v)
              onChange(v)
            }}
            className="rounded"
          />
          {definition.field_label}
        </label>
      )
    case 'select':
      return (
        <select
          value={localValue}
          onChange={(e) => {
            setLocalValue(e.target.value)
            onChange(e.target.value)
          }}
          className="w-full"
        >
          <option value="">Select...</option>
          {(definition.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )
    case 'multiselect': {
      const selected = localValue ? localValue.split(',').filter(Boolean) : []
      return (
        <div className="space-y-1.5">
          {(definition.options ?? []).map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={(e) => {
                  let updated: string[]
                  if (e.target.checked) {
                    updated = [...selected, opt]
                  } else {
                    updated = selected.filter((s) => s !== opt)
                  }
                  const joined = updated.join(',')
                  setLocalValue(joined)
                  onChange(joined)
                }}
                className="rounded"
              />
              {opt}
            </label>
          ))}
        </div>
      )
    }
    default:
      return (
        <input
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          className="w-full"
        />
      )
  }
}
