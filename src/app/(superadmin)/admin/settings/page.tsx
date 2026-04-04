'use client'

import { Settings } from 'lucide-react'

const GOLD = '#C9A96E'

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">System Settings</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
          Global configuration for the VioX CRM platform
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Settings size={16} style={{ color: GOLD }} />
            Platform Settings
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--muted)' }}>Default Plan</span>
              <span>Free</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--muted)' }}>Max Users per Org</span>
              <span>Unlimited</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--muted)' }}>Portal Access</span>
              <span>Enabled</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--muted)' }}>API Rate Limit</span>
              <span>1000/min</span>
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Settings size={16} style={{ color: GOLD }} />
            Email Configuration
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--muted)' }}>SMTP Provider</span>
              <span>Not Configured</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--muted)' }}>From Address</span>
              <span>—</span>
            </div>
            <div className="flex justify-between text-sm">
              <span style={{ color: 'var(--muted)' }}>Notifications</span>
              <span>Disabled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
