'use client'

import Link from 'next/link'
import { CheckSquare, Square, AlertCircle, User, Calendar } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface TaskData {
  id: string
  title: string
  description?: string | null
  due_date?: string | null
  completed: boolean
  type: string
  metadata?: Record<string, unknown> | null
  contact_id?: string | null
  deal_id?: string | null
  contact?: { first_name: string; last_name: string } | null
  deal?: { title: string } | null
  created_at: string
}

const PRIORITY_COLORS: Record<TaskPriority, { border: string; bg: string; text: string; label: string }> = {
  low: { border: '#00b894', bg: 'rgba(0,184,148,0.12)', text: 'var(--success)', label: 'Low' },
  medium: { border: '#fdcb6e', bg: 'rgba(253,203,110,0.12)', text: 'var(--warning)', label: 'Medium' },
  high: { border: '#e17055', bg: 'rgba(225,112,85,0.12)', text: 'var(--danger)', label: 'High' },
  urgent: { border: '#d63031', bg: 'rgba(214,48,49,0.15)', text: '#d63031', label: 'Urgent' },
}

function getPriority(task: TaskData): TaskPriority {
  return (task.metadata?.priority as TaskPriority) || 'medium'
}

function getStatus(task: TaskData): string {
  if (task.completed) return 'done'
  return (task.metadata?.task_status as string) || 'todo'
}

function isOverdue(task: TaskData): boolean {
  if (task.completed || !task.due_date) return false
  return new Date(task.due_date) < new Date()
}

export default function TaskItem({
  task,
  onToggle,
  onEdit,
}: {
  task: TaskData
  onToggle: (id: string, completed: boolean) => void
  onEdit?: (task: TaskData) => void
}) {
  const priority = getPriority(task)
  const colors = PRIORITY_COLORS[priority]
  const overdue = isOverdue(task)

  return (
    <div
      className="flex items-start gap-3 p-4 rounded-lg hover:bg-[var(--surface-2)] transition-colors group cursor-pointer"
      style={{ borderLeft: `3px solid ${colors.border}` }}
      onClick={() => onEdit?.(task)}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggle(task.id, !task.completed)
        }}
        className="mt-0.5 shrink-0"
      >
        {task.completed ? (
          <CheckSquare className="w-5 h-5" style={{ color: 'var(--success)' }} />
        ) : (
          <Square className="w-5 h-5" style={{ color: 'var(--muted)' }} />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p
            className={`text-sm font-medium ${task.completed ? 'line-through' : ''}`}
            style={{ color: task.completed ? 'var(--muted)' : 'var(--text)' }}
          >
            {task.title}
          </p>
          <span
            className="badge text-[10px]"
            style={{ background: colors.bg, color: colors.text }}
          >
            {colors.label}
          </span>
        </div>

        {task.description && (
          <p
            className="text-xs mt-1 line-clamp-2"
            style={{ color: 'var(--muted)' }}
          >
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-3 mt-2 flex-wrap">
          {task.due_date && (
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: overdue ? 'var(--danger)' : 'var(--muted)' }}
            >
              {overdue && <AlertCircle className="w-3 h-3" />}
              <Calendar className="w-3 h-3" />
              {formatDate(task.due_date)}
              {overdue && ' (Overdue)'}
            </span>
          )}

          {task.contact && (
            <Link
              href={`/contacts/${task.contact_id}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-xs hover:underline"
              style={{ color: 'var(--accent-light)' }}
            >
              <User className="w-3 h-3" />
              {task.contact.first_name} {task.contact.last_name}
            </Link>
          )}

          {task.deal && (
            <Link
              href={`/deals/${task.deal_id}`}
              onClick={(e) => e.stopPropagation()}
              className="text-xs hover:underline"
              style={{ color: 'var(--accent-light)' }}
            >
              {task.deal.title}
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
