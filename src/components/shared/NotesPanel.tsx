'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, Plus, Trash2, Pencil, X, Check, Loader2 } from 'lucide-react'
import Avatar from '@/components/shared/Avatar'
import { formatRelativeTime } from '@/lib/utils'

interface NoteRecord {
  id: string
  content: string
  user_id: string | null
  created_at: string
  updated_at: string
  profile?: { full_name: string | null } | null
}

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^[\s]*[-*]\s+(.+)/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul class="list-disc pl-4 space-y-0.5">$1</ul>')
    .replace(/\n/g, '<br />')
}

export default function NotesPanel({
  entityType,
  entityId,
}: {
  entityType: 'contact' | 'company' | 'deal'
  entityId: string
}) {
  const supabase = createClient()
  const [notes, setNotes] = useState<NoteRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [newContent, setNewContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUserId(user.id)
      // No org ID needed in standalone mode
    }
    loadUser()
  }, [supabase])

  const fetchNotes = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('notes')
      .select('*, profile:profiles(full_name)')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })

    setNotes((data as NoteRecord[]) ?? [])
    setLoading(false)
  }, [entityType, entityId, supabase])

  useEffect(() => {
    fetchNotes()
  }, [fetchNotes])

  async function handleAdd() {
    if (!newContent.trim()) return
    setSaving(true)

    const { error } = await supabase.from('notes').insert({
      entity_type: entityType,
      entity_id: entityId,
      user_id: currentUserId,
      content: newContent.trim(),
    })

    if (!error) {
      setNewContent('')
      await fetchNotes()
    }
    setSaving(false)
  }

  async function handleUpdate(id: string) {
    if (!editContent.trim()) return
    setSaving(true)

    await supabase
      .from('notes')
      .update({ content: editContent.trim() })
      .eq('id', id)

    setEditingId(null)
    setEditContent('')
    await fetchNotes()
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this note?')) return
    await supabase.from('notes').delete().eq('id', id)
    await fetchNotes()
  }

  function startEdit(note: NoteRecord) {
    setEditingId(note.id)
    setEditContent(note.content)
  }

  return (
    <div>
      {/* Add Note */}
      <div className="mb-4">
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Add a note... (supports **bold**, *italic*, - bullet lists)"
          className="w-full"
          rows={3}
          style={{
            background: 'var(--surface-2)',
            borderColor: 'var(--border)',
            borderRadius: '0.5rem',
            padding: '0.75rem',
            fontSize: '0.875rem',
            resize: 'vertical',
          }}
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={handleAdd}
            disabled={saving || !newContent.trim()}
            className="btn btn-primary btn-sm"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Add Note
          </button>
        </div>
      </div>

      {/* Notes List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--muted)' }} />
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-8">
          <MessageSquare className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--muted)' }} />
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            No notes yet
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => {
            const authorName = note.profile?.full_name ?? 'Unknown'
            const isEditing = editingId === note.id

            return (
              <div
                key={note.id}
                className="rounded-lg p-4 transition-colors"
                style={{ background: 'var(--surface-2)' }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Avatar name={authorName} size="sm" />
                    <div>
                      <p className="text-sm font-medium">{authorName}</p>
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>
                        {formatRelativeTime(note.created_at)}
                        {note.updated_at !== note.created_at && (
                          <span> (edited)</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {!isEditing && (
                      <>
                        <button
                          onClick={() => startEdit(note)}
                          className="p-1.5 rounded hover:bg-[var(--surface)] transition-colors"
                          style={{ color: 'var(--muted)' }}
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(note.id)}
                          className="p-1.5 rounded hover:bg-[var(--surface)] transition-colors"
                          style={{ color: 'var(--danger)' }}
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Content */}
                {isEditing ? (
                  <div>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full"
                      rows={3}
                      style={{
                        background: 'var(--surface)',
                        borderColor: 'var(--border)',
                        borderRadius: '0.375rem',
                        padding: '0.5rem',
                        fontSize: '0.875rem',
                      }}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                      <button
                        onClick={() => {
                          setEditingId(null)
                          setEditContent('')
                        }}
                        className="btn btn-secondary btn-sm"
                      >
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                      <button
                        onClick={() => handleUpdate(note.id)}
                        disabled={saving || !editContent.trim()}
                        className="btn btn-primary btn-sm"
                      >
                        {saving ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5" />
                        )}
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="text-sm leading-relaxed prose-dark"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(note.content) }}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
