'use client'

import { useState } from 'react'
import { Phone, Mail, Calendar, CheckCircle2, FileText, Mic, Plus } from 'lucide-react'
import { formatRelativeTime, formatDateTime } from '@/lib/utils'
import ActivityForm from './ActivityForm'

const activityIcons: Record<string, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  task: CheckCircle2,
  note: FileText,
  voice_agent: Mic,
}

const activityColors: Record<string, string> = {
  call: '#6c5ce7',
  email: '#74b9ff',
  meeting: '#00b894',
  task: '#fdcb6e',
  note: '#8888a0',
  voice_agent: '#fd79a8',
}

const typeFilters = ['all', 'call', 'email', 'meeting', 'task', 'note', 'voice_agent']

export default function ActivityFeed({
  activities: initialActivities,
}: {
  activities: any[]
}) {
  const [filter, setFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [activities, setActivities] = useState(initialActivities)

  const filtered = filter === 'all'
    ? activities
    : activities.filter(a => a.type === filter)

  return (
    <div>
      {/* Filter + Add */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex gap-1.5 flex-wrap">
          {typeFilters.map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className="btn btn-sm"
              style={{
                background: filter === t ? 'var(--accent)' : 'var(--surface)',
                color: filter === t ? 'white' : 'var(--muted)',
                border: `1px solid ${filter === t ? 'var(--accent)' : 'var(--border)'}`,
              }}
            >
              {t === 'all' ? 'All' : t.replace('_', ' ')}
            </button>
          ))}
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary btn-sm">
          <Plus className="w-4 h-4" /> Log Activity
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="mb-6 animate-slide-in-up">
          <ActivityForm
            onCreated={(activity) => {
              setActivities(prev => [activity, ...prev])
              setShowForm(false)
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Feed */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              No activities match your filter
            </p>
          </div>
        ) : (
          filtered.map((a: any) => {
            const Icon = activityIcons[a.type] || FileText
            const color = activityColors[a.type] || 'var(--muted)'
            const contactName = a.contact ? `${a.contact.first_name} ${a.contact.last_name}` : null
            return (
              <div key={a.id} className="card card-hover p-4 flex items-start gap-4">
                <div
                  className="p-2.5 rounded-xl shrink-0"
                  style={{ background: `${color}12` }}
                >
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{a.title}</p>
                      {a.description && (
                        <p className="text-sm mt-0.5 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                          {a.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {a.completed && (
                        <span className="badge badge-success">Done</span>
                      )}
                      <span
                        className="text-xs whitespace-nowrap"
                        style={{ color: 'var(--muted)' }}
                        title={formatDateTime(a.created_at)}
                      >
                        {formatRelativeTime(a.created_at)}
                      </span>
                    </div>
                  </div>
                  {(contactName || a.deal?.title) && (
                    <div className="flex gap-3 mt-2">
                      {contactName && (
                        <span className="badge badge-neutral text-xs">{contactName}</span>
                      )}
                      {a.deal?.title && (
                        <span className="badge badge-accent text-xs">{a.deal.title}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
