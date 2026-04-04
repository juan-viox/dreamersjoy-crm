'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Users,
  UserPlus,
  Loader2,
  Shield,
  ShieldCheck,
  Eye,
  Trash2,
  Mail,
  X,
} from 'lucide-react'
import Avatar from '@/components/shared/Avatar'
import { formatDate } from '@/lib/utils'

interface TeamMember {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  role: string
  created_at: string
  last_sign_in_at?: string
}

const roleConfig: Record<string, { label: string; icon: typeof Shield; color: string; bg: string; description: string }> = {
  owner: {
    label: 'Owner',
    icon: ShieldCheck,
    color: '#6c5ce7',
    bg: 'rgba(108,92,231,0.12)',
    description: 'Full access, billing, and account management',
  },
  admin: {
    label: 'Admin',
    icon: ShieldCheck,
    color: '#00b894',
    bg: 'rgba(0,184,148,0.12)',
    description: 'Full access including settings',
  },
  member: {
    label: 'Member',
    icon: Shield,
    color: '#74b9ff',
    bg: 'rgba(116,185,255,0.12)',
    description: 'Create, read, update, and delete records',
  },
  viewer: {
    label: 'Viewer',
    icon: Eye,
    color: '#fdcb6e',
    bg: 'rgba(253,203,110,0.12)',
    description: 'Read-only access',
  },
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [currentUserId, setCurrentUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('member')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadTeam()
  }, [])

  async function loadTeam() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    setCurrentUserId(user.id)

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url, role, created_at')
      .order('created_at', { ascending: true })

    setMembers(
      (profiles ?? []).map((p) => ({
        ...p,
        last_sign_in_at: undefined,
      }))
    )
    setLoading(false)
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    setInviteError('')
    setInviteSuccess('')

    try {
      const res = await fetch('/api/v1/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
          invitedBy: currentUserId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setInviteError(data.error || 'Failed to send invite')
      } else {
        setInviteSuccess(`Invitation sent to ${inviteEmail}`)
        setInviteEmail('')
        setInviteRole('member')
        setTimeout(() => {
          setShowInvite(false)
          setInviteSuccess('')
        }, 2000)
        loadTeam()
      }
    } catch {
      setInviteError('Network error. Please try again.')
    }

    setInviting(false)
  }

  async function handleChangeRole(memberId: string, newRole: string) {
    await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', memberId)

    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
    )
  }

  async function handleRemove(memberId: string) {
    // Remove from profiles (soft remove - keeps auth user)
    await supabase.from('profiles').delete().eq('id', memberId)
    setMembers((prev) => prev.filter((m) => m.id !== memberId))
    setConfirmRemove(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6" style={{ color: 'var(--accent)' }} />
            Team Management
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Manage team members, roles, and permissions
          </p>
        </div>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="btn btn-primary"
        >
          <UserPlus className="w-4 h-4" />
          Invite User
        </button>
      </div>

      {/* Invite Form */}
      {showInvite && (
        <div className="card mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Mail className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              Invite Team Member
            </h3>
            <button
              onClick={() => {
                setShowInvite(false)
                setInviteError('')
                setInviteSuccess('')
              }}
              className="p-1 rounded hover:bg-[var(--surface-2)]"
              style={{ color: 'var(--muted)' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {inviteError && (
            <div className="p-3 rounded-lg text-sm mb-4" style={{ background: 'rgba(225,112,85,0.1)', color: 'var(--danger)' }}>
              {inviteError}
            </div>
          )}
          {inviteSuccess && (
            <div className="p-3 rounded-lg text-sm mb-4" style={{ background: 'rgba(0,184,148,0.1)', color: 'var(--success)' }}>
              {inviteSuccess}
            </div>
          )}

          <form onSubmit={handleInvite} className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>
                Email Address
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="teammate@company.com"
                required
                className="w-full"
              />
            </div>
            <div className="w-40">
              <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>
                Role
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full"
              >
                <option value="admin">Admin</option>
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={inviting}
              className="btn btn-primary"
            >
              {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              Send Invite
            </button>
          </form>

          {/* Role descriptions */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            {['admin', 'member', 'viewer'].map((r) => {
              const cfg = roleConfig[r]
              const Icon = cfg.icon
              return (
                <div key={r} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: cfg.bg }}>
                  <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: cfg.color }} />
                  <div>
                    <p className="text-xs font-semibold">{cfg.label}</p>
                    <p className="text-[11px]" style={{ color: 'var(--muted)' }}>{cfg.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Team Members Table */}
      <div className="card overflow-hidden" style={{ padding: 0 }}>
        <div className="px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <p className="text-sm font-semibold">
            Team Members ({members.length})
          </p>
        </div>

        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
          {members.map((member) => {
            const cfg = roleConfig[member.role] || roleConfig.member
            const Icon = cfg.icon
            const isCurrentUser = member.id === currentUserId
            const isOwner = member.role === 'owner'

            return (
              <div
                key={member.id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-[var(--surface-2)] transition-colors"
              >
                <Avatar name={member.full_name || member.email} src={member.avatar_url} />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">
                      {member.full_name || member.email.split('@')[0]}
                    </p>
                    {isCurrentUser && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--surface-2)', color: 'var(--muted)' }}>
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>
                    {member.email}
                  </p>
                </div>

                {/* Role Badge */}
                <div
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ background: cfg.bg, color: cfg.color }}
                >
                  <Icon className="w-3 h-3" />
                  {cfg.label}
                </div>

                {/* Joined Date */}
                <div className="hidden md:block text-xs text-right" style={{ color: 'var(--muted)', minWidth: '80px' }}>
                  <p>Joined</p>
                  <p>{formatDate(member.created_at)}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {!isOwner && !isCurrentUser && (
                    <>
                      <select
                        value={member.role}
                        onChange={(e) => handleChangeRole(member.id, e.target.value)}
                        className="text-xs py-1 px-2 rounded-md"
                        style={{
                          background: 'var(--surface-2)',
                          border: '1px solid var(--border)',
                          color: 'var(--text)',
                        }}
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                      </select>

                      {confirmRemove === member.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleRemove(member.id)}
                            className="text-[11px] px-2 py-1 rounded-md font-medium"
                            style={{ background: 'rgba(225,112,85,0.15)', color: 'var(--danger)' }}
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setConfirmRemove(null)}
                            className="text-[11px] px-2 py-1 rounded-md"
                            style={{ color: 'var(--muted)' }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmRemove(member.id)}
                          className="p-1.5 rounded-md hover:bg-[var(--surface-2)] transition-colors"
                          style={{ color: 'var(--muted)' }}
                          title="Remove member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
