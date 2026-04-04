'use client'

import { BarChart3 } from 'lucide-react'

const GOLD = '#C9A96E'

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          Cross-organization analytics and reporting
        </p>
      </div>

      <div className="card flex flex-col items-center justify-center py-20 text-center">
        <BarChart3 size={48} style={{ color: GOLD, marginBottom: '1rem' }} />
        <h2 className="text-lg font-semibold mb-2">Analytics Dashboard</h2>
        <p className="text-sm" style={{ color: 'var(--muted)', maxWidth: 400 }}>
          Advanced analytics with revenue trends, user activity, and conversion metrics will be available here.
        </p>
      </div>
    </div>
  )
}
