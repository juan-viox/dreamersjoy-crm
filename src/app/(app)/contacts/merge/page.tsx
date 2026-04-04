'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  ArrowLeft,
  Search,
  Loader2,
  Merge,
  Check,
  AlertTriangle,
  X,
  Users,
  ChevronRight,
} from 'lucide-react'
import Avatar from '@/components/shared/Avatar'
import type { Contact } from '@/types'

interface DuplicatePair {
  left: Contact
  right: Contact
  reason: string
}

interface FieldSelection {
  [field: string]: 'left' | 'right'
}

const MERGE_FIELDS = [
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'email', label: 'Email' },
  { key: 'phone', label: 'Phone' },
  { key: 'title', label: 'Title' },
  { key: 'source', label: 'Source' },
  { key: 'status', label: 'Status' },
  { key: 'company_id', label: 'Company' },
  { key: 'notes', label: 'Notes' },
] as const

export default function ContactMergePage() {
  const [scanning, setScanning] = useState(false)
  const [pairs, setPairs] = useState<DuplicatePair[]>([])
  const [scanned, setScanned] = useState(false)
  const [userId, setUserId] = useState('')

  // Merge flow state
  const [activePair, setActivePair] = useState<DuplicatePair | null>(null)
  const [selections, setSelections] = useState<FieldSelection>({})
  const [merging, setMerging] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [mergeResults, setMergeResults] = useState<string[]>([])

  const supabase = createClient()

  const findDuplicates = useCallback(async () => {
    setScanning(true)
    setPairs([])
    setMergeResults([])

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setScanning(false); return }
    setUserId(user.id)

    const { data: contacts } = await supabase
      .from('contacts')
      .select('*, company:companies(name)')
      .order('first_name')

    if (!contacts || contacts.length < 2) {
      setScanning(false)
      setScanned(true)
      return
    }

    const duplicates: DuplicatePair[] = []
    const seen = new Set<string>()

    for (let i = 0; i < contacts.length; i++) {
      for (let j = i + 1; j < contacts.length; j++) {
        const a = contacts[i]
        const b = contacts[j]
        const pairKey = [a.id, b.id].sort().join('|')
        if (seen.has(pairKey)) continue

        // Check for matching email
        if (a.email && b.email && a.email.toLowerCase() === b.email.toLowerCase()) {
          seen.add(pairKey)
          duplicates.push({ left: a, right: b, reason: 'Same email address' })
          continue
        }

        // Check for similar names (case-insensitive exact match on full name)
        const nameA = `${a.first_name} ${a.last_name}`.toLowerCase().trim()
        const nameB = `${b.first_name} ${b.last_name}`.toLowerCase().trim()
        if (nameA === nameB && nameA.length > 1) {
          seen.add(pairKey)
          duplicates.push({ left: a, right: b, reason: 'Same name' })
          continue
        }

        // Check for similar names (same last name + first name starts with same letter)
        if (
          a.last_name &&
          b.last_name &&
          a.last_name.toLowerCase() === b.last_name.toLowerCase() &&
          a.first_name &&
          b.first_name &&
          a.first_name.charAt(0).toLowerCase() === b.first_name.charAt(0).toLowerCase() &&
          a.first_name.toLowerCase() !== b.first_name.toLowerCase()
        ) {
          // Check phone match as additional signal
          if (a.phone && b.phone && a.phone.replace(/\D/g, '') === b.phone.replace(/\D/g, '')) {
            seen.add(pairKey)
            duplicates.push({ left: a, right: b, reason: 'Similar name + same phone' })
          }
        }
      }
    }

    setPairs(duplicates)
    setScanning(false)
    setScanned(true)
  }, [supabase])

  function startMerge(pair: DuplicatePair) {
    setActivePair(pair)
    // Default: prefer left for all fields
    const defaults: FieldSelection = {}
    MERGE_FIELDS.forEach((f) => {
      const leftVal = (pair.left as any)[f.key]
      const rightVal = (pair.right as any)[f.key]
      // Prefer whichever has a value, defaulting to left
      if (!leftVal && rightVal) defaults[f.key] = 'right'
      else defaults[f.key] = 'left'
    })
    setSelections(defaults)
    setShowConfirm(false)
  }

  async function executeMerge() {
    if (!activePair) return
    setMerging(true)

    const survivorSide = 'left' // Survivor is always left contact
    const survivorId = activePair.left.id
    const duplicateId = activePair.right.id

    // Build the selected field values
    const selectedFields: Record<string, unknown> = {}
    MERGE_FIELDS.forEach((f) => {
      const side = selections[f.key] || 'left'
      const source = side === 'left' ? activePair.left : activePair.right
      const val = (source as any)[f.key]
      if (val !== undefined) selectedFields[f.key] = val
    })

    try {
      const res = await fetch('/api/v1/contacts/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          survivorId,
          duplicateId,
          selectedFields,
          userId,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setMergeResults((prev) => [...prev, data.message])
        setPairs((prev) =>
          prev.filter(
            (p) =>
              !(p.left.id === activePair.left.id && p.right.id === activePair.right.id)
          )
        )
        setActivePair(null)
        setShowConfirm(false)
      } else {
        alert(data.error || 'Merge failed')
      }
    } catch (err) {
      alert('Network error during merge')
    } finally {
      setMerging(false)
    }
  }

  return (
    <div className="max-w-5xl">
      <Link
        href="/contacts"
        className="inline-flex items-center gap-1 text-sm mb-6 hover:underline"
        style={{ color: 'var(--muted)' }}
      >
        <ArrowLeft className="w-4 h-4" /> Back to contacts
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Merge Duplicates</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Find and merge duplicate contacts to keep your CRM clean
          </p>
        </div>
        <button
          onClick={findDuplicates}
          disabled={scanning}
          className="btn btn-primary"
        >
          {scanning ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          {scanning ? 'Scanning...' : 'Find Duplicates'}
        </button>
      </div>

      {/* Merge results */}
      {mergeResults.length > 0 && (
        <div className="mb-4 space-y-2">
          {mergeResults.map((msg, i) => (
            <div
              key={i}
              className="flex items-center gap-2 p-3 rounded-lg text-sm"
              style={{ background: 'rgba(0,184,148,0.1)', color: 'var(--success)' }}
            >
              <Check className="w-4 h-4 shrink-0" />
              {msg}
            </div>
          ))}
        </div>
      )}

      {/* Not scanned yet */}
      {!scanned && !scanning && (
        <div className="card text-center py-16">
          <Users className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--muted)' }} />
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Click &quot;Find Duplicates&quot; to scan your contacts for potential matches
          </p>
        </div>
      )}

      {/* Scanning */}
      {scanning && (
        <div className="card text-center py-16">
          <Loader2 className="w-8 h-8 mx-auto animate-spin mb-3" style={{ color: 'var(--accent-light)' }} />
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Scanning contacts for duplicates...
          </p>
        </div>
      )}

      {/* No duplicates found */}
      {scanned && !scanning && pairs.length === 0 && (
        <div className="card text-center py-16">
          <Check className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--success)' }} />
          <p className="font-semibold mb-1">No duplicates found</p>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Your contact list looks clean
          </p>
        </div>
      )}

      {/* Duplicate pairs */}
      {pairs.length > 0 && !activePair && (
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Found {pairs.length} potential duplicate{pairs.length !== 1 ? 's' : ''}
          </p>

          {pairs.map((pair, idx) => (
            <div key={idx} className="card">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4" style={{ color: 'var(--warning)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--warning)' }}>
                  {pair.reason}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
                {/* Left contact */}
                <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--surface-2)' }}>
                  <Avatar name={`${pair.left.first_name} ${pair.left.last_name}`} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {pair.left.first_name} {pair.left.last_name}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>
                      {pair.left.email || pair.left.phone || 'No contact info'}
                    </p>
                  </div>
                </div>

                {/* Arrow */}
                <div className="hidden md:flex items-center justify-center">
                  <Merge className="w-5 h-5" style={{ color: 'var(--muted)' }} />
                </div>

                {/* Right contact */}
                <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'var(--surface-2)' }}>
                  <Avatar name={`${pair.right.first_name} ${pair.right.last_name}`} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {pair.right.first_name} {pair.right.last_name}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>
                      {pair.right.email || pair.right.phone || 'No contact info'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end mt-4">
                <button onClick={() => startMerge(pair)} className="btn btn-primary btn-sm">
                  <Merge className="w-4 h-4" />
                  Review & Merge
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Merge field selection */}
      {activePair && !showConfirm && (
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold">Select fields to keep</h2>
            <button onClick={() => setActivePair(null)} className="btn btn-secondary btn-sm">
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] gap-0 mb-6">
            {/* Header */}
            <div className="p-3 text-center rounded-tl-lg" style={{ background: 'rgba(108,92,231,0.1)' }}>
              <p className="text-xs font-semibold" style={{ color: 'var(--accent-light)' }}>KEEP (Survivor)</p>
              <p className="text-sm font-medium mt-1">
                {activePair.left.first_name} {activePair.left.last_name}
              </p>
            </div>
            <div className="p-3 text-center" style={{ background: 'var(--surface-2)' }}>
              <p className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>FIELD</p>
            </div>
            <div className="p-3 text-center rounded-tr-lg" style={{ background: 'var(--surface-2)' }}>
              <p className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>DELETE (Duplicate)</p>
              <p className="text-sm font-medium mt-1">
                {activePair.right.first_name} {activePair.right.last_name}
              </p>
            </div>

            {/* Field rows */}
            {MERGE_FIELDS.map((field) => {
              const leftVal = String((activePair.left as any)[field.key] ?? '')
              const rightVal = String((activePair.right as any)[field.key] ?? '')
              const selected = selections[field.key] || 'left'

              return (
                <div key={field.key} className="contents">
                  {/* Left value */}
                  <button
                    onClick={() => setSelections((s) => ({ ...s, [field.key]: 'left' }))}
                    className="p-3 text-left text-sm transition-colors"
                    style={{
                      background: selected === 'left' ? 'rgba(108,92,231,0.08)' : 'transparent',
                      borderLeft: selected === 'left' ? '3px solid var(--accent-light)' : '3px solid transparent',
                      color: leftVal ? 'var(--text)' : 'var(--muted)',
                    }}
                  >
                    {leftVal || '(empty)'}
                    {selected === 'left' && (
                      <Check className="inline w-3.5 h-3.5 ml-2" style={{ color: 'var(--accent-light)' }} />
                    )}
                  </button>

                  {/* Field label */}
                  <div
                    className="p-3 text-center text-xs font-medium flex items-center justify-center"
                    style={{ color: 'var(--muted)', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}
                  >
                    {field.label}
                  </div>

                  {/* Right value */}
                  <button
                    onClick={() => setSelections((s) => ({ ...s, [field.key]: 'right' }))}
                    className="p-3 text-left text-sm transition-colors"
                    style={{
                      background: selected === 'right' ? 'rgba(108,92,231,0.08)' : 'transparent',
                      borderRight: selected === 'right' ? '3px solid var(--accent-light)' : '3px solid transparent',
                      color: rightVal ? 'var(--text)' : 'var(--muted)',
                    }}
                  >
                    {rightVal || '(empty)'}
                    {selected === 'right' && (
                      <Check className="inline w-3.5 h-3.5 ml-2" style={{ color: 'var(--accent-light)' }} />
                    )}
                  </button>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button onClick={() => setActivePair(null)} className="btn btn-secondary">
              Cancel
            </button>
            <button onClick={() => setShowConfirm(true)} className="btn btn-primary">
              <Merge className="w-4 h-4" />
              Continue to Merge
            </button>
          </div>
        </div>
      )}

      {/* Confirmation dialog */}
      {activePair && showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setShowConfirm(false)}
        >
          <div className="card w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="p-2 rounded-lg"
                style={{ background: 'rgba(225,112,85,0.12)' }}
              >
                <AlertTriangle className="w-5 h-5" style={{ color: 'var(--danger)' }} />
              </div>
              <h2 className="text-lg font-bold">Confirm Merge</h2>
            </div>

            <div className="space-y-3 mb-6 text-sm" style={{ color: 'var(--muted)' }}>
              <p>This action will:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Keep <strong className="text-[var(--text)]">{activePair.left.first_name} {activePair.left.last_name}</strong> with selected field values
                </li>
                <li>
                  Transfer all activities, deals, notes, and tags from{' '}
                  <strong className="text-[var(--text)]">{activePair.right.first_name} {activePair.right.last_name}</strong>
                </li>
                <li>
                  Permanently delete the duplicate contact
                </li>
              </ul>
              <p className="font-medium" style={{ color: 'var(--danger)' }}>
                This cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setShowConfirm(false)} className="btn btn-secondary">
                Cancel
              </button>
              <button
                onClick={executeMerge}
                disabled={merging}
                className="btn"
                style={{ background: 'var(--danger)', color: '#fff' }}
              >
                {merging ? <Loader2 className="w-4 h-4 animate-spin" /> : <Merge className="w-4 h-4" />}
                {merging ? 'Merging...' : 'Merge Contacts'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
