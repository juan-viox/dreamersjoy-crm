'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import TaskItem, { type TaskData, type TaskPriority } from '@/components/tasks/TaskItem'
import EmptyState from '@/components/shared/EmptyState'
import {
  CheckSquare,
  List,
  LayoutGrid,
  Plus,
  Filter,
  X,
  Loader2,
  ArrowUpDown,
  ChevronDown,
} from 'lucide-react'

type ViewMode = 'list' | 'board'
type SortBy = 'due_date' | 'priority' | 'created_at'
type StatusFilter = 'all' | 'todo' | 'in_progress' | 'done'
type PriorityFilter = 'all' | TaskPriority

const BOARD_COLUMNS = [
  { key: 'todo', label: 'To Do', color: 'var(--muted)' },
  { key: 'in_progress', label: 'In Progress', color: 'var(--accent-light)' },
  { key: 'done', label: 'Done', color: 'var(--success)' },
]

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 }

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskData[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<ViewMode>('list')
  const [sortBy, setSortBy] = useState<SortBy>('due_date')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Quick add state
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium')
  const [newDueDate, setNewDueDate] = useState('')
  const [adding, setAdding] = useState(false)

  // Edit state
  const [editTask, setEditTask] = useState<TaskData | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPriority, setEditPriority] = useState<TaskPriority>('medium')
  const [editDueDate, setEditDueDate] = useState('')
  const [editStatus, setEditStatus] = useState('todo')
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  const loadTasks = useCallback(async () => {
    const { data } = await supabase
      .from('activities')
      .select('*, contact:contacts(first_name, last_name), deal:deals(title)')
      .eq('type', 'task')
      .order('created_at', { ascending: false })

    setTasks(data ?? [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  async function toggleTask(id: string, completed: boolean) {
    await supabase
      .from('activities')
      .update({
        completed,
        metadata: {
          ...tasks.find((t) => t.id === id)?.metadata,
          task_status: completed ? 'done' : 'todo',
        },
      })
      .eq('id', id)

    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              completed,
              metadata: { ...t.metadata, task_status: completed ? 'done' : 'todo' },
            }
          : t
      )
    )
  }

  async function addTask() {
    if (!newTitle.trim()) return
    setAdding(true)

    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('activities').insert({
      user_id: user?.id,
      type: 'task',
      title: newTitle.trim(),
      due_date: newDueDate || null,
      completed: false,
      metadata: { priority: newPriority, task_status: 'todo' },
    })

    setNewTitle('')
    setNewDueDate('')
    setNewPriority('medium')
    setShowQuickAdd(false)
    setAdding(false)
    await loadTasks()
  }

  function openEdit(task: TaskData) {
    setEditTask(task)
    setEditTitle(task.title)
    setEditDescription(task.description ?? '')
    setEditPriority((task.metadata?.priority as TaskPriority) || 'medium')
    setEditDueDate(task.due_date ? task.due_date.split('T')[0] : '')
    setEditStatus(task.completed ? 'done' : (task.metadata?.task_status as string) || 'todo')
  }

  async function saveEdit() {
    if (!editTask) return
    setSaving(true)
    const completed = editStatus === 'done'

    await supabase
      .from('activities')
      .update({
        title: editTitle,
        description: editDescription || null,
        due_date: editDueDate || null,
        completed,
        metadata: {
          ...editTask.metadata,
          priority: editPriority,
          task_status: editStatus,
        },
      })
      .eq('id', editTask.id)

    setSaving(false)
    setEditTask(null)
    await loadTasks()
  }

  // Filtering & sorting
  function getTaskStatus(t: TaskData): string {
    if (t.completed) return 'done'
    return (t.metadata?.task_status as string) || 'todo'
  }

  function getTaskPriority(t: TaskData): TaskPriority {
    return (t.metadata?.priority as TaskPriority) || 'medium'
  }

  let filtered = tasks.filter((t) => {
    if (statusFilter !== 'all' && getTaskStatus(t) !== statusFilter) return false
    if (priorityFilter !== 'all' && getTaskPriority(t) !== priorityFilter) return false
    return true
  })

  filtered.sort((a, b) => {
    if (sortBy === 'due_date') {
      const ad = a.due_date ? new Date(a.due_date).getTime() : Infinity
      const bd = b.due_date ? new Date(b.due_date).getTime() : Infinity
      return ad - bd
    }
    if (sortBy === 'priority') {
      return (PRIORITY_ORDER[getTaskPriority(a)] ?? 2) - (PRIORITY_ORDER[getTaskPriority(b)] ?? 2)
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6">Tasks</h1>
        <div className="card animate-shimmer h-96" />
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <button
              onClick={() => setView('list')}
              className="p-2 transition-colors"
              style={{
                background: view === 'list' ? 'var(--surface-2)' : 'transparent',
                color: view === 'list' ? 'var(--text)' : 'var(--muted)',
              }}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('board')}
              className="p-2 transition-colors"
              style={{
                background: view === 'board' ? 'var(--surface-2)' : 'transparent',
                color: view === 'board' ? 'var(--text)' : 'var(--muted)',
              }}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn btn-secondary btn-sm"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>

          <button
            onClick={() => setShowQuickAdd(true)}
            className="btn btn-primary btn-sm"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>
      </div>

      {/* Filters bar */}
      {showFilters && (
        <div className="card mb-4 p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="input text-sm py-1.5"
              >
                <option value="all">All</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="done">Done</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
                className="input text-sm py-1.5"
              >
                <option value="all">All</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Sort</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="input text-sm py-1.5"
              >
                <option value="due_date">Due Date</option>
                <option value="priority">Priority</option>
                <option value="created_at">Created</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Form */}
      {showQuickAdd && (
        <div className="card mb-4 p-4">
          <div className="flex items-center gap-3 flex-wrap">
            <input
              autoFocus
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTask()}
              placeholder="Task title..."
              className="input flex-1 min-w-[200px]"
            />
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
              className="input text-sm w-28"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className="input text-sm w-40"
            />
            <button onClick={addTask} disabled={adding || !newTitle.trim()} className="btn btn-primary btn-sm">
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Add
            </button>
            <button onClick={() => setShowQuickAdd(false)} className="btn btn-secondary btn-sm">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {tasks.length === 0 && (
        <EmptyState
          icon={CheckSquare}
          title="No tasks yet"
          description="Create tasks to track your to-dos, follow-ups, and action items"
        />
      )}

      {/* List View */}
      {tasks.length > 0 && view === 'list' && (
        <div className="card p-0 divide-y" style={{ borderColor: 'var(--border)' }}>
          {filtered.length === 0 ? (
            <p className="text-sm text-center py-12" style={{ color: 'var(--muted)' }}>
              No tasks match your filters
            </p>
          ) : (
            filtered.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onEdit={openEdit}
              />
            ))
          )}
        </div>
      )}

      {/* Board View */}
      {tasks.length > 0 && view === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {BOARD_COLUMNS.map((col) => {
            const colTasks = filtered.filter((t) => getTaskStatus(t) === col.key)
            return (
              <div key={col.key}>
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: col.color }}
                  />
                  <h3 className="text-sm font-semibold">{col.label}</h3>
                  <span
                    className="text-xs px-1.5 py-0.5 rounded-full"
                    style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}
                  >
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-2 min-h-[200px] p-2 rounded-lg" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                  {colTasks.length === 0 ? (
                    <p className="text-xs text-center py-8" style={{ color: 'var(--muted)' }}>
                      No tasks
                    </p>
                  ) : (
                    colTasks.map((task) => (
                      <div key={task.id} className="card p-0">
                        <TaskItem task={task} onToggle={toggleTask} onEdit={openEdit} />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setEditTask(null)}
        >
          <div
            className="card w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Edit Task</h2>
              <button onClick={() => setEditTask(null)} className="p-1 rounded hover:bg-[var(--surface-2)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="input w-full"
                />
              </div>

              <div>
                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="input w-full"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="input w-full"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>Priority</label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value as TaskPriority)}
                    className="input w-full"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>Due Date</label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="input w-full"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button onClick={() => setEditTask(null)} className="btn btn-secondary">
                Cancel
              </button>
              <button onClick={saveEdit} disabled={saving || !editTitle.trim()} className="btn btn-primary">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
