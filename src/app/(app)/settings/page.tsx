'use client'

import Link from 'next/link'
import { Settings, Kanban, Upload, SlidersHorizontal, UsersRound } from 'lucide-react'
import crmConfig from '@/crm.config'

export default function SettingsPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="card space-y-4 mb-6">
        <h2 className="font-semibold flex items-center gap-2">
          <Settings className="w-5 h-5" style={{ color: 'var(--accent)' }} />
          Organization
        </h2>

        <div>
          <label>Business Name</label>
          <input value={crmConfig.name} readOnly className="w-full" />
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            Edit src/crm.config.ts to change business settings
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <Link href="/settings/pipeline" className="card flex items-center justify-between hover:border-[var(--accent)] transition-colors">
          <div className="flex items-center gap-3">
            <Kanban className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            <div>
              <p className="font-semibold">Pipeline Stages</p>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Manage deal stages, colors, and order</p>
            </div>
          </div>
          <span style={{ color: 'var(--muted)' }}>&rarr;</span>
        </Link>

        <Link href="/settings/team" className="card flex items-center justify-between hover:border-[var(--accent)] transition-colors">
          <div className="flex items-center gap-3">
            <UsersRound className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            <div>
              <p className="font-semibold">Team Management</p>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Invite users, manage roles and permissions</p>
            </div>
          </div>
          <span style={{ color: 'var(--muted)' }}>&rarr;</span>
        </Link>

        <Link href="/settings/import" className="card flex items-center justify-between hover:border-[var(--accent)] transition-colors">
          <div className="flex items-center gap-3">
            <Upload className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            <div>
              <p className="font-semibold">Import Data</p>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Import contacts, companies, or deals from CSV</p>
            </div>
          </div>
          <span style={{ color: 'var(--muted)' }}>&rarr;</span>
        </Link>

        <Link href="/settings/custom-fields" className="card flex items-center justify-between hover:border-[var(--accent)] transition-colors">
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            <div>
              <p className="font-semibold">Custom Fields</p>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Add custom fields to contacts, companies, and deals</p>
            </div>
          </div>
          <span style={{ color: 'var(--muted)' }}>&rarr;</span>
        </Link>
      </div>
    </div>
  )
}
