'use client'

import { useState, useMemo, useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { createClient } from '@/lib/supabase/client'
import {
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  FileText,
  Mic,
  Plus,
  X,
  Loader2,
  Save,
  Clock,
} from 'lucide-react'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const activityTypeColors: Record<string, string> = {
  call: '#6c5ce7',
  email: '#74b9ff',
  meeting: '#00b894',
  task: '#fdcb6e',
  note: '#8888a0',
  voice_agent: '#fd79a8',
}

const activityIcons: Record<string, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  task: CheckCircle2,
  note: FileText,
  voice_agent: Mic,
}

interface CalendarActivity {
  id: string
  title: string
  type: string
  due_date: string | null
  completed: boolean
  created_at: string
  contact_id: string | null
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export default function CalendarClient({
  activities: initialActivities,
  contacts,
  deals,
}: {
  activities: CalendarActivity[]
  contacts: { id: string; first_name: string; last_name: string }[]
  deals: { id: string; title: string }[]
}) {
  const now = new Date()
  const [currentYear, setCurrentYear] = useState(now.getFullYear())
  const [currentMonth, setCurrentMonth] = useState(now.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [activities, setActivities] = useState(initialActivities)

  // Form state
  const [formType, setFormType] = useState('meeting')
  const [formTitle, setFormTitle] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formDueDate, setFormDueDate] = useState('')
  const [formContactId, setFormContactId] = useState('')
  const [formDealId, setFormDealId] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const supabase = createClient()
  const containerRef = useRef<HTMLDivElement>(null)

  useGSAP(() => {
    if (!containerRef.current) return
    gsap.from(containerRef.current, {
      opacity: 0,
      y: 12,
      duration: 0.35,
      ease: 'power2.out',
    })
  }, [])

  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfWeek(currentYear, currentMonth)
  const prevMonthDays = getDaysInMonth(
    currentMonth === 0 ? currentYear - 1 : currentYear,
    currentMonth === 0 ? 11 : currentMonth - 1
  )

  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7

  // Map activities by date string
  const activityByDate = useMemo(() => {
    const map: Record<string, CalendarActivity[]> = {}
    activities.forEach((a) => {
      const date = a.due_date?.split('T')[0]
      if (date) {
        if (!map[date]) map[date] = []
        map[date].push(a)
      }
    })
    return map
  }, [activities])

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  function prevMonth() {
    if (currentMonth === 0) {
      setCurrentYear((y) => y - 1)
      setCurrentMonth(11)
    } else {
      setCurrentMonth((m) => m - 1)
    }
  }

  function nextMonth() {
    if (currentMonth === 11) {
      setCurrentYear((y) => y + 1)
      setCurrentMonth(0)
    } else {
      setCurrentMonth((m) => m + 1)
    }
  }

  function openAddForm(dateStr?: string) {
    setFormType('meeting')
    setFormTitle('')
    setFormDescription('')
    setFormDueDate(dateStr || todayStr)
    setFormContactId('')
    setFormDealId('')
    setFormError('')
    setShowForm(true)
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormLoading(true)
    setFormError('')

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setFormError('Not authenticated')
      setFormLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('activities')
      .insert({
        user_id: user.id,
        type: formType,
        title: formTitle,
        description: formDescription || null,
        due_date: formDueDate || null,
        contact_id: formContactId || null,
        deal_id: formDealId || null,
        completed: false,
      })
      .select()
      .single()

    if (error) {
      setFormError(error.message)
      setFormLoading(false)
      return
    }

    setActivities((prev) => [...prev, data])
    setShowForm(false)
    setFormLoading(false)
  }

  // Activities for selected date
  const selectedActivities = selectedDate
    ? activityByDate[selectedDate] ?? []
    : []

  return (
    <div ref={containerRef}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            View and manage your activities
          </p>
        </div>
        <button
          onClick={() => openAddForm()}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" /> Add Activity
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-3">
          <div className="card p-0 overflow-hidden">
            {/* Month navigation */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: 'var(--border)' }}
            >
              <button
                onClick={prevMonth}
                className="btn btn-ghost btn-icon btn-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <h2 className="text-lg font-semibold">
                {MONTHS[currentMonth]} {currentYear}
              </h2>
              <button
                onClick={nextMonth}
                className="btn btn-ghost btn-icon btn-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Calendar grid */}
            <div className="calendar-grid">
              {/* Day headers */}
              {DAYS.map((day) => (
                <div key={day} className="calendar-header-cell">
                  {day}
                </div>
              ))}

              {/* Day cells */}
              {Array.from({ length: totalCells }, (_, i) => {
                let dayNumber: number
                let isOtherMonth = false
                let dateStr: string

                if (i < firstDay) {
                  // Previous month
                  dayNumber = prevMonthDays - firstDay + i + 1
                  isOtherMonth = true
                  const m = currentMonth === 0 ? 12 : currentMonth
                  const y =
                    currentMonth === 0 ? currentYear - 1 : currentYear
                  dateStr = `${y}-${String(m).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`
                } else if (i - firstDay >= daysInMonth) {
                  // Next month
                  dayNumber = i - firstDay - daysInMonth + 1
                  isOtherMonth = true
                  const m = currentMonth === 11 ? 1 : currentMonth + 2
                  const y =
                    currentMonth === 11
                      ? currentYear + 1
                      : currentYear
                  dateStr = `${y}-${String(m).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`
                } else {
                  dayNumber = i - firstDay + 1
                  dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dayNumber).padStart(2, '0')}`
                }

                const isToday = dateStr === todayStr
                const isSelected = dateStr === selectedDate
                const dayActivities = activityByDate[dateStr] ?? []

                return (
                  <div
                    key={i}
                    className={`calendar-cell ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedDate(dateStr)}
                  >
                    <div className={isToday ? 'calendar-day-number' : ''}>
                      <span className="text-sm font-medium">
                        {dayNumber}
                      </span>
                    </div>

                    {/* Activity dots */}
                    {dayActivities.length > 0 && (
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {dayActivities.slice(0, 3).map((a) => (
                          <div
                            key={a.id}
                            className="calendar-dot"
                            style={{
                              background:
                                activityTypeColors[a.type] ||
                                'var(--muted)',
                            }}
                            title={a.title}
                          />
                        ))}
                        {dayActivities.length > 3 && (
                          <span
                            className="text-[9px]"
                            style={{ color: 'var(--muted)' }}
                          >
                            +{dayActivities.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right panel: Selected day / Upcoming */}
        <div className="space-y-4">
          {/* Selected day details */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">
                {selectedDate
                  ? new Date(selectedDate + 'T12:00:00').toLocaleDateString(
                      'en-US',
                      {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                      }
                    )
                  : 'Select a day'}
              </h3>
              {selectedDate && (
                <button
                  onClick={() => openAddForm(selectedDate)}
                  className="btn btn-ghost btn-sm btn-icon"
                  title="Add activity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>

            {selectedDate ? (
              selectedActivities.length === 0 ? (
                <p
                  className="text-sm py-4 text-center"
                  style={{ color: 'var(--muted)' }}
                >
                  No activities this day
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedActivities.map((a) => {
                    const Icon = activityIcons[a.type] || FileText
                    const color =
                      activityTypeColors[a.type] || 'var(--muted)'
                    return (
                      <div
                        key={a.id}
                        className="flex items-start gap-2.5 p-2.5 rounded-lg"
                        style={{ background: 'var(--surface-2)' }}
                      >
                        <div
                          className="p-1.5 rounded-md shrink-0"
                          style={{ background: `${color}15` }}
                        >
                          <Icon
                            className="w-3.5 h-3.5"
                            style={{ color }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">
                            {a.title}
                          </p>
                          <p
                            className="text-xs"
                            style={{ color: 'var(--muted)' }}
                          >
                            {a.type}
                            {a.completed && ' - Done'}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            ) : (
              <p
                className="text-sm py-4 text-center"
                style={{ color: 'var(--muted)' }}
              >
                Click a day to see its activities
              </p>
            )}
          </div>

          {/* Legend */}
          <div className="card">
            <h3
              className="text-sm font-semibold mb-3"
              style={{ color: 'var(--muted)' }}
            >
              Activity Types
            </h3>
            <div className="space-y-2">
              {Object.entries(activityTypeColors).map(([type, color]) => {
                const Icon = activityIcons[type] || FileText
                return (
                  <div
                    key={type}
                    className="flex items-center gap-2 text-xs"
                  >
                    <div
                      className="calendar-dot"
                      style={{ background: color }}
                    />
                    <Icon className="w-3 h-3" style={{ color }} />
                    <span style={{ color: 'var(--muted)' }}>
                      {type.replace('_', ' ')}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Add Activity Modal */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div
            className="modal-content w-full max-w-lg p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Add Activity</h2>
              <button
                onClick={() => setShowForm(false)}
                className="btn btn-ghost btn-icon btn-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div
                className="p-3 rounded-lg text-sm mb-4"
                style={{
                  background: 'rgba(225,112,85,0.1)',
                  color: 'var(--danger)',
                }}
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Type *</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                  >
                    <option value="call">Call</option>
                    <option value="email">Email</option>
                    <option value="meeting">Meeting</option>
                    <option value="task">Task</option>
                    <option value="note">Note</option>
                  </select>
                </div>
                <div>
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label>Title *</label>
                <input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                  placeholder="Activity title"
                />
              </div>

              <div>
                <label>Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  placeholder="Optional description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label>Contact</label>
                  <select
                    value={formContactId}
                    onChange={(e) => setFormContactId(e.target.value)}
                  >
                    <option value="">None</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.first_name} {c.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>Deal</label>
                  <select
                    value={formDealId}
                    onChange={(e) => setFormDealId(e.target.value)}
                  >
                    <option value="">None</option>
                    {deals.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="btn btn-primary"
                >
                  {formLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
