'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  ArrowLeft,
  Loader2,
  Save,
  Building2,
  Palette,
  Users,
  Globe,
  Settings,
  Eye,
} from 'lucide-react'

const GOLD = '#C9A96E'

interface OrgFull {
  id: string
  name: string
  slug: string
  plan: string | null
  created_at: string
  is_active: boolean
  primary_color: string | null
  secondary_color: string | null
  accent_color: string | null
  display_font: string | null
  body_font: string | null
  logo_url: string | null
  tagline: string | null
  website: string | null
  phone: string | null
  email: string | null
}

interface Profile {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
  created_at: string
  last_sign_in_at: string | null
}

const tabs = [
  { id: 'overview', label: 'Overview', icon: Building2 },
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'sites', label: 'Sites', icon: Globe },
  { id: 'settings', label: 'Settings', icon: Settings },
]

const FONT_OPTIONS = [
  'Cormorant Garamond',
  'Jost',
  'Inter',
  'Playfair Display',
  'Montserrat',
  'Raleway',
  'Open Sans',
  'Lato',
  'Poppins',
  'Roboto',
  'Merriweather',
  'DM Sans',
  'Work Sans',
  'Nunito',
  'Source Sans 3',
]

export default function OrgDetailPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const initialTab = searchParams.get('tab') ?? 'overview'

  const [org, setOrg] = useState<OrgFull | null>(null)
  const [users, setUsers] = useState<Profile[]>([])
  const [activeTab, setActiveTab] = useState(initialTab)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  // Branding form state
  const [branding, setBranding] = useState({
    primary_color: '#334155',
    secondary_color: '#F5F0EB',
    accent_color: '#8B7355',
    display_font: 'Cormorant Garamond',
    body_font: 'Jost',
    logo_url: '',
    tagline: '',
    website: '',
    phone: '',
    email: '',
  })

  const supabase = createClient()

  useEffect(() => {
    loadOrg()
  }, [id])

  async function loadOrg() {
    const { data } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .single()

    if (data) {
      setOrg(data)
      setBranding({
        primary_color: data.primary_color ?? '#334155',
        secondary_color: data.secondary_color ?? '#F5F0EB',
        accent_color: data.accent_color ?? '#8B7355',
        display_font: data.display_font ?? 'Cormorant Garamond',
        body_font: data.body_font ?? 'Jost',
        logo_url: data.logo_url ?? '',
        tagline: data.tagline ?? '',
        website: data.website ?? '',
        phone: data.phone ?? '',
        email: data.email ?? '',
      })
    }

    // Load users
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, created_at, last_sign_in_at')
      .eq('organization_id', id)
      .order('created_at', { ascending: false })

    if (profiles) setUsers(profiles)

    setLoading(false)
  }

  async function saveBranding() {
    setSaving(true)
    setSaveMessage('')

    const { error } = await supabase
      .from('organizations')
      .update({
        primary_color: branding.primary_color,
        secondary_color: branding.secondary_color,
        accent_color: branding.accent_color,
        display_font: branding.display_font,
        body_font: branding.body_font,
        logo_url: branding.logo_url || null,
        tagline: branding.tagline || null,
        website: branding.website || null,
        phone: branding.phone || null,
        email: branding.email || null,
      })
      .eq('id', id)

    if (error) {
      setSaveMessage('Error saving branding')
    } else {
      setSaveMessage('Branding saved successfully')
      setTimeout(() => setSaveMessage(''), 3000)
    }
    setSaving(false)
  }

  if (loading || !org) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="animate-spin" size={32} style={{ color: GOLD }} />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/organizations"
          className="p-2 rounded-lg hover:bg-[var(--surface-2)] transition-colors no-underline"
          style={{ color: 'var(--muted)' }}
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{org.name}</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            /{org.slug} &middot; {org.plan ?? 'free'} plan
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b" style={{ borderColor: 'var(--border)' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors -mb-px"
            style={{
              color: activeTab === tab.id ? GOLD : 'var(--muted)',
              borderBottom:
                activeTab === tab.id ? `2px solid ${GOLD}` : '2px solid transparent',
              background: 'transparent',
              cursor: 'pointer',
              border: 'none',
              borderBottomWidth: '2px',
              borderBottomStyle: 'solid',
              borderBottomColor: activeTab === tab.id ? GOLD : 'transparent',
            }}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab org={org} usersCount={users.length} />
      )}
      {activeTab === 'branding' && (
        <BrandingTab
          branding={branding}
          setBranding={setBranding}
          orgName={org.name}
          saving={saving}
          saveMessage={saveMessage}
          onSave={saveBranding}
        />
      )}
      {activeTab === 'users' && <UsersTab users={users} />}
      {activeTab === 'sites' && <SitesTab orgId={org.id} />}
      {activeTab === 'settings' && <SettingsTab org={org} />}
    </div>
  )
}

/* ---------- Overview Tab ---------- */
function OverviewTab({ org, usersCount }: { org: OrgFull; usersCount: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="card space-y-3">
        <h3 className="font-semibold">Organization Details</h3>
        <InfoRow label="Name" value={org.name} />
        <InfoRow label="Slug" value={org.slug} />
        <InfoRow label="Plan" value={org.plan ?? 'free'} />
        <InfoRow label="Status" value={org.is_active ? 'Active' : 'Inactive'} />
        <InfoRow
          label="Created"
          value={new Date(org.created_at).toLocaleDateString()}
        />
        <InfoRow label="Users" value={usersCount.toString()} />
      </div>
      <div className="card space-y-3">
        <h3 className="font-semibold">Contact Info</h3>
        <InfoRow label="Email" value={org.email ?? '—'} />
        <InfoRow label="Phone" value={org.phone ?? '—'} />
        <InfoRow label="Website" value={org.website ?? '—'} />
        <InfoRow label="Tagline" value={org.tagline ?? '—'} />
      </div>
      <div className="card space-y-3">
        <h3 className="font-semibold">Portal URL</h3>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Clients access their portal at:
        </p>
        <code
          className="text-sm block p-2 rounded"
          style={{ background: 'var(--surface-2)' }}
        >
          /portal/{org.slug}/login
        </code>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span style={{ color: 'var(--muted)' }}>{label}</span>
      <span>{value}</span>
    </div>
  )
}

/* ---------- Branding Tab ---------- */
function BrandingTab({
  branding,
  setBranding,
  orgName,
  saving,
  saveMessage,
  onSave,
}: {
  branding: Record<string, string>
  setBranding: (b: Record<string, string>) => void
  orgName: string
  saving: boolean
  saveMessage: string
  onSave: () => void
}) {
  function update(key: string, value: string) {
    setBranding({ ...branding, [key]: value })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Editor */}
      <div className="space-y-6">
        {/* Colors */}
        <div className="card space-y-4">
          <h3 className="font-semibold">Colors</h3>
          <div className="grid grid-cols-3 gap-4">
            <ColorPicker
              label="Primary"
              value={branding.primary_color}
              onChange={(v) => update('primary_color', v)}
            />
            <ColorPicker
              label="Secondary"
              value={branding.secondary_color}
              onChange={(v) => update('secondary_color', v)}
            />
            <ColorPicker
              label="Accent"
              value={branding.accent_color}
              onChange={(v) => update('accent_color', v)}
            />
          </div>
        </div>

        {/* Fonts */}
        <div className="card space-y-4">
          <h3 className="font-semibold">Typography</h3>
          <div>
            <label>Display Font (Headings)</label>
            <select
              value={branding.display_font}
              onChange={(e) => update('display_font', e.target.value)}
              className="w-full"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Body Font</label>
            <select
              value={branding.body_font}
              onChange={(e) => update('body_font', e.target.value)}
              className="w-full"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Contact & Branding */}
        <div className="card space-y-4">
          <h3 className="font-semibold">Brand Details</h3>
          <div>
            <label>Logo URL</label>
            <input
              type="url"
              value={branding.logo_url}
              onChange={(e) => update('logo_url', e.target.value)}
              className="w-full"
              placeholder="https://example.com/logo.png"
            />
          </div>
          <div>
            <label>Tagline</label>
            <input
              type="text"
              value={branding.tagline}
              onChange={(e) => update('tagline', e.target.value)}
              className="w-full"
              placeholder="Your brand tagline"
            />
          </div>
          <div>
            <label>Website</label>
            <input
              type="url"
              value={branding.website}
              onChange={(e) => update('website', e.target.value)}
              className="w-full"
              placeholder="https://example.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Phone</label>
              <input
                type="tel"
                value={branding.phone}
                onChange={(e) => update('phone', e.target.value)}
                className="w-full"
                placeholder="(555) 555-5555"
              />
            </div>
            <div>
              <label>Email</label>
              <input
                type="email"
                value={branding.email}
                onChange={(e) => update('email', e.target.value)}
                className="w-full"
                placeholder="contact@example.com"
              />
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-4">
          <button
            onClick={onSave}
            disabled={saving}
            className="btn btn-primary flex items-center gap-2"
            style={{ background: GOLD, color: '#1a1a2e' }}
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Branding'}
          </button>
          {saveMessage && (
            <span
              className="text-sm"
              style={{
                color: saveMessage.includes('Error')
                  ? 'var(--danger)'
                  : 'var(--success)',
              }}
            >
              {saveMessage}
            </span>
          )}
        </div>
      </div>

      {/* Live Preview */}
      <div className="card" style={{ padding: 0 }}>
        <div className="p-4 border-b flex items-center gap-2" style={{ borderColor: 'var(--border)' }}>
          <Eye size={16} style={{ color: GOLD }} />
          <h3 className="font-semibold text-sm">Portal Preview</h3>
        </div>
        <div
          className="p-6 rounded-b-xl"
          style={{
            background: branding.secondary_color,
            minHeight: 400,
          }}
        >
          {/* Preview header */}
          <div
            className="flex items-center gap-3 p-4 rounded-lg mb-4"
            style={{ background: '#FFFFFF', border: `1px solid ${branding.accent_color}20` }}
          >
            {branding.logo_url ? (
              <img
                src={branding.logo_url}
                alt="Logo"
                style={{ width: 36, height: 36, borderRadius: 999, objectFit: 'cover' }}
              />
            ) : (
              <div
                className="flex items-center justify-center rounded-full text-white text-sm font-bold"
                style={{
                  width: 36,
                  height: 36,
                  background: branding.primary_color,
                }}
              >
                {orgName.charAt(0)}
              </div>
            )}
            <span
              style={{
                fontFamily: `'${branding.display_font}', Georgia, serif`,
                fontSize: '1.25rem',
                fontWeight: 600,
                color: branding.primary_color,
              }}
            >
              {orgName}
            </span>
          </div>

          {/* Preview welcome */}
          <div className="p-4 rounded-lg mb-4" style={{ background: '#FFFFFF' }}>
            <h2
              style={{
                fontFamily: `'${branding.display_font}', Georgia, serif`,
                fontSize: '1.5rem',
                fontWeight: 600,
                color: branding.primary_color,
                marginBottom: '0.5rem',
              }}
            >
              Welcome back, Client
            </h2>
            <p
              style={{
                fontFamily: `'${branding.body_font}', system-ui, sans-serif`,
                fontSize: '0.875rem',
                color: branding.accent_color,
              }}
            >
              {branding.tagline || `Your ${orgName} experience`}
            </p>
          </div>

          {/* Preview button */}
          <button
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              background: branding.primary_color,
              color: branding.secondary_color,
              fontFamily: `'${branding.body_font}', system-ui, sans-serif`,
              border: 'none',
              cursor: 'default',
            }}
          >
            View Bookings
          </button>
        </div>
      </div>
    </div>
  )
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div>
      <label className="text-xs">{label}</label>
      <div className="flex items-center gap-2 mt-1">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 p-0 border-0 rounded cursor-pointer"
          style={{ background: 'transparent' }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 text-xs"
          style={{ padding: '0.375rem 0.5rem' }}
        />
      </div>
    </div>
  )
}

/* ---------- Users Tab ---------- */
function UsersTab({ users }: { users: Profile[] }) {
  return (
    <div className="card" style={{ padding: 0 }}>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="font-medium">{u.full_name ?? '—'}</td>
                <td style={{ color: 'var(--muted)' }}>{u.email ?? '—'}</td>
                <td>
                  <span
                    className="badge"
                    style={{
                      background: 'rgba(201,169,110,0.12)',
                      color: GOLD,
                    }}
                  >
                    {u.role ?? 'member'}
                  </span>
                </td>
                <td style={{ color: 'var(--muted)' }}>
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8" style={{ color: 'var(--muted)' }}>
                  No users in this organization
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ---------- Sites Tab ---------- */
function SitesTab({ orgId }: { orgId: string }) {
  const [sites, setSites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('sites')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })

      if (data) setSites(data)
      setLoading(false)
    }
    load()
  }, [orgId])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="animate-spin" size={24} style={{ color: GOLD }} />
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: 0 }}>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Domain</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {sites.map((s) => (
              <tr key={s.id}>
                <td className="font-medium">{s.name}</td>
                <td style={{ color: 'var(--muted)' }}>{s.domain ?? '—'}</td>
                <td>
                  <span
                    className="badge"
                    style={{
                      background: 'rgba(0,184,148,0.12)',
                      color: 'var(--success)',
                    }}
                  >
                    {s.status ?? 'active'}
                  </span>
                </td>
                <td style={{ color: 'var(--muted)' }}>
                  {new Date(s.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {sites.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8" style={{ color: 'var(--muted)' }}>
                  No sites for this organization
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ---------- Settings Tab ---------- */
function SettingsTab({ org }: { org: OrgFull }) {
  return (
    <div className="card space-y-4">
      <h3 className="font-semibold">Organization Settings</h3>
      <InfoRow label="Organization ID" value={org.id} />
      <InfoRow label="Status" value={org.is_active ? 'Active' : 'Inactive'} />
      <InfoRow label="Plan" value={org.plan ?? 'free'} />
      <InfoRow
        label="Created"
        value={new Date(org.created_at).toLocaleDateString()}
      />
    </div>
  )
}
