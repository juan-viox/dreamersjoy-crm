'use client'

import { Phone, Mail, Calendar, CheckCircle2, FileText, Mic } from 'lucide-react'
import { formatRelativeTime, formatDateTime } from '@/lib/utils'
import type { Activity } from '@/types'

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

export default function ContactTimeline({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-3"
          style={{ background: 'var(--surface-2)' }}
        >
          <Calendar className="w-6 h-6" style={{ color: 'var(--muted)' }} />
        </div>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          No activity yet
        </p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="timeline-line" />

      <div className="space-y-4">
        {activities.map((a) => {
          const Icon = activityIcons[a.type] || FileText
          const color = activityColors[a.type] || 'var(--muted)'
          return (
            <div key={a.id} className="flex gap-4 relative animate-fade-in">
              <div
                className="timeline-dot"
                style={{ borderColor: color }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div className="flex-1 card py-3 px-4 card-hover">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{a.title}</p>
                    {a.description && (
                      <p
                        className="text-sm mt-1 leading-relaxed"
                        style={{ color: 'var(--text-secondary)' }}
                      >
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
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
