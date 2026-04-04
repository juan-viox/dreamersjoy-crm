import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import crmConfig from '@/crm.config'
import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import CommandPalette from '@/components/shared/CommandPalette'

/** Build CRM accent CSS variables from config branding. */
function buildBrandingCssVars(): Record<string, string> {
  const b = crmConfig.branding
  const vars: Record<string, string> = {}
  vars['--accent'] = b.primaryColor
  vars['--org-primary'] = b.primaryColor
  vars['--accent-glow'] = hexToRgba(b.primaryColor, 0.25)
  vars['--shadow-glow'] = `0 0 20px ${hexToRgba(b.primaryColor, 0.15)}`
  vars['--gradient-accent'] = `linear-gradient(135deg, ${b.primaryColor} 0%, ${b.accentColor} 100%)`
  vars['--accent-light'] = b.accentColor
  vars['--org-accent'] = b.accentColor
  vars['--org-secondary'] = b.secondaryColor
  return vars
}

function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.replace('#', '')
  const r = parseInt(cleaned.substring(0, 2), 16)
  const g = parseInt(cleaned.substring(2, 4), 16)
  const b = parseInt(cleaned.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const orgName = crmConfig.name
  const userName = profile?.full_name ?? user.email ?? 'User'
  const userRole = profile?.role ?? 'member'

  const orgStyle = buildBrandingCssVars()

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={orgStyle as React.CSSProperties}
    >
      <Sidebar orgName={orgName} userName={userName} userRole={userRole} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar userName={userName} orgName={orgName} />
        <main className="flex-1 overflow-y-auto p-6 animate-page-enter">
          {children}
        </main>
      </div>
      <CommandPalette />
    </div>
  )
}
