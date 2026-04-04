'use client'

import { useState, useEffect } from 'react'
import { Key, Eye, EyeOff, Check, ExternalLink, Plug } from 'lucide-react'

interface Integration {
  id: string
  name: string
  description: string
  keyPlaceholder: string
  docsUrl: string
  icon: string
  fields: { id: string; label: string; placeholder: string; type?: string }[]
}

const INTEGRATIONS: Integration[] = [
  {
    id: 'blotato',
    name: 'Blotato',
    description: 'Social media management — publish to Instagram, Facebook, LinkedIn, X, and TikTok from VioX CRM',
    keyPlaceholder: 'blotato_...',
    docsUrl: 'https://blotato.com',
    icon: '📱',
    fields: [
      { id: 'api_key', label: 'API Key', placeholder: 'Enter Blotato API key' },
      { id: 'workspace_id', label: 'Workspace ID', placeholder: 'Your Blotato workspace ID' },
    ]
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Payment processing — invoicing, workshop payments, and subscription billing',
    keyPlaceholder: 'sk_live_...',
    docsUrl: 'https://dashboard.stripe.com/apikeys',
    icon: '💳',
    fields: [
      { id: 'secret_key', label: 'Secret Key', placeholder: 'sk_live_...' },
      { id: 'publishable_key', label: 'Publishable Key', placeholder: 'pk_live_...' },
      { id: 'webhook_secret', label: 'Webhook Secret', placeholder: 'whsec_...' },
    ]
  },
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'Phone integration — powers AI voice agents on cinematic sites',
    keyPlaceholder: 'AC...',
    docsUrl: 'https://console.twilio.com/',
    icon: '📞',
    fields: [
      { id: 'account_sid', label: 'Account SID', placeholder: 'AC...' },
      { id: 'auth_token', label: 'Auth Token', placeholder: 'Enter Twilio auth token' },
    ]
  },
  {
    id: 'resend',
    name: 'Resend',
    description: 'Email delivery — transactional emails, campaigns, and automated follow-ups',
    keyPlaceholder: 're_...',
    docsUrl: 'https://resend.com/api-keys',
    icon: '✉️',
    fields: [
      { id: 'api_key', label: 'API Key', placeholder: 're_...' },
      { id: 'from_email', label: 'From Email', placeholder: 'hello@yourdomain.com', type: 'email' },
    ]
  },
]

export default function IntegrationsPage() {
  const [values, setValues] = useState<Record<string, Record<string, string>>>({})
  const [visibility, setVisibility] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const stored = localStorage.getItem('viox-crm-integrations')
    if (stored) setValues(JSON.parse(stored))
  }, [])

  function updateField(integrationId: string, fieldId: string, value: string) {
    setValues(prev => ({
      ...prev,
      [integrationId]: { ...(prev[integrationId] || {}), [fieldId]: value }
    }))
    setSaved(prev => ({ ...prev, [integrationId]: false }))
  }

  function saveIntegration(integrationId: string) {
    localStorage.setItem('viox-crm-integrations', JSON.stringify(values))
    setSaved(prev => ({ ...prev, [integrationId]: true }))
    setTimeout(() => setSaved(prev => ({ ...prev, [integrationId]: false })), 2000)
  }

  function isConnected(integrationId: string) {
    const fields = values[integrationId]
    return fields && Object.values(fields).some(v => v && v.length > 5)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text)]">Integrations</h1>
        <p className="text-sm text-[var(--muted)] mt-1">
          Connect third-party services to power payments, email campaigns, social media, and phone.
        </p>
      </div>

      <div className="grid gap-4">
        {INTEGRATIONS.map(integration => (
          <div
            key={integration.id}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 hover:border-[var(--accent)]/30 transition-colors"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{integration.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-[var(--text)]">{integration.name}</h3>
                    {isConnected(integration.id) && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--success)]/15 text-[var(--success)]">
                        Connected
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--muted)] mt-0.5">{integration.description}</p>
                </div>
              </div>
              <a href={integration.docsUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--muted)] hover:text-[var(--accent)]">
                <ExternalLink size={16} />
              </a>
            </div>

            <div className="space-y-3">
              {integration.fields.map(field => (
                <div key={field.id}>
                  <label className="text-xs text-[var(--muted)] mb-1 block">{field.label}</label>
                  <div className="relative">
                    <input
                      type={field.type || (visibility[`${integration.id}-${field.id}`] ? 'text' : 'password')}
                      value={values[integration.id]?.[field.id] || ''}
                      onChange={(e) => updateField(integration.id, field.id, e.target.value)}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] placeholder:text-[var(--muted)]/50 focus:border-[var(--accent)] focus:outline-none transition-colors pr-10"
                    />
                    {!field.type && (
                      <button
                        onClick={() => setVisibility(prev => ({ ...prev, [`${integration.id}-${field.id}`]: !prev[`${integration.id}-${field.id}`] }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)]"
                      >
                        {visibility[`${integration.id}-${field.id}`] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => saveIntegration(integration.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  saved[integration.id]
                    ? 'bg-[var(--success)]/20 text-[var(--success)]'
                    : 'bg-[var(--accent)] text-white hover:opacity-90'
                }`}
              >
                {saved[integration.id] ? 'Saved!' : 'Save'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
