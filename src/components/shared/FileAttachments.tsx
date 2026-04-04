'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Upload,
  FileText,
  Image,
  FileSpreadsheet,
  File,
  Download,
  Trash2,
  Loader2,
  X,
  Paperclip,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface FileDoc {
  id: string
  name: string
  file_url: string
  file_type: string | null
  file_size: number | null
  created_at: string
}

const MAX_SIZE = 10 * 1024 * 1024 // 10MB

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return { icon: File, color: '#888' }
  if (mimeType.startsWith('image/')) return { icon: Image, color: '#74b9ff' }
  if (mimeType.includes('pdf')) return { icon: FileText, color: '#e17055' }
  if (mimeType.includes('sheet') || mimeType.includes('csv') || mimeType.includes('excel'))
    return { icon: FileSpreadsheet, color: '#00b894' }
  if (mimeType.includes('doc') || mimeType.includes('word') || mimeType.includes('text'))
    return { icon: FileText, color: '#6c5ce7' }
  return { icon: File, color: '#888' }
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return '--'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function FileAttachments({
  entityType,
  entityId,
}: {
  entityType: 'contact' | 'company' | 'deal'
  entityId: string
}) {
  const [files, setFiles] = useState<FileDoc[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const loadFiles = useCallback(async () => {
    const query = supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false })

    if (entityType === 'contact') query.eq('contact_id', entityId)
    else if (entityType === 'company') query.eq('company_id', entityId)
    else if (entityType === 'deal') query.eq('deal_id', entityId)

    const { data } = await query
    setFiles(data ?? [])
  }, [entityType, entityId, supabase])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  async function uploadFile(file: globalThis.File) {
    if (file.size > MAX_SIZE) {
      setError(`File "${file.name}" exceeds 10MB limit`)
      return
    }
    setError(null)
    setUploading(true)

    try {
      const ext = file.name.split('.').pop()
      const path = `${entityType}/${entityId}/${Date.now()}-${file.name}`

      const { error: uploadErr } = await supabase.storage
        .from('documents')
        .upload(path, file, { contentType: file.type })

      if (uploadErr) throw uploadErr

      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path)

      const insertData: Record<string, unknown> = {
        name: file.name,
        file_url: urlData.publicUrl,
        file_type: file.type || null,
        file_size: file.size,
      }
      if (entityType === 'contact') insertData.contact_id = entityId
      else if (entityType === 'company') insertData.company_id = entityId
      else if (entityType === 'deal') insertData.deal_id = entityId

      await supabase.from('documents').insert(insertData)
      await loadFiles()
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function deleteFile(doc: FileDoc) {
    // Extract storage path from URL
    const url = new URL(doc.file_url)
    const storagePath = url.pathname.split('/documents/')[1]
    if (storagePath) {
      await supabase.storage.from('documents').remove([decodeURIComponent(storagePath)])
    }
    await supabase.from('documents').delete().eq('id', doc.id)
    setFiles((prev) => prev.filter((f) => f.id !== doc.id))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const droppedFiles = Array.from(e.dataTransfer.files)
    droppedFiles.forEach(uploadFile)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    selected.forEach(uploadFile)
    e.target.value = ''
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--muted)' }}>
          <Paperclip className="w-4 h-4" />
          Files
          {files.length > 0 && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full"
              style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
            >
              {files.length}
            </span>
          )}
        </h3>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className="border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer mb-4"
        style={{
          borderColor: dragOver ? 'var(--accent-light)' : 'var(--border)',
          background: dragOver ? 'rgba(108,92,231,0.06)' : 'transparent',
        }}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="w-6 h-6 mx-auto animate-spin mb-2" style={{ color: 'var(--accent-light)' }} />
        ) : (
          <Upload className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--muted)' }} />
        )}
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          {uploading ? 'Uploading...' : 'Drag & drop files here or click to browse'}
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--muted)', opacity: 0.6 }}>
          Max 10MB per file
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {error && (
        <div
          className="flex items-center gap-2 text-sm p-3 rounded-lg mb-4"
          style={{ background: 'rgba(225,112,85,0.1)', color: 'var(--danger)' }}
        >
          <X className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((doc) => {
            const { icon: Icon, color } = getFileIcon(doc.file_type)
            return (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--surface-2)] transition-colors group"
              >
                <div
                  className="p-2 rounded-md shrink-0"
                  style={{ background: `${color}18` }}
                >
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.name}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    {formatFileSize(doc.file_size)} &middot; {formatDate(doc.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-md hover:bg-[var(--surface-2)] transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                  </a>
                  <button
                    onClick={() => deleteFile(doc)}
                    className="p-1.5 rounded-md hover:bg-[var(--surface-2)] transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" style={{ color: 'var(--danger)' }} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
