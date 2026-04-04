import { type LucideIcon } from 'lucide-react'
import Link from 'next/link'

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  actionHref?: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{
          background: 'rgba(108, 92, 231, 0.08)',
          border: '1px solid rgba(108, 92, 231, 0.12)',
        }}
      >
        <Icon className="w-7 h-7" style={{ color: 'var(--accent-light)' }} />
      </div>
      <h3 className="text-lg font-semibold mb-1.5">{title}</h3>
      <p
        className="text-sm mb-6 max-w-sm"
        style={{ color: 'var(--muted)' }}
      >
        {description}
      </p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn btn-primary">
          {actionLabel}
        </Link>
      )}
    </div>
  )
}
