import type { Metadata } from 'next'
import crmConfig from '@/crm.config'

export const metadata: Metadata = {
  title: `Client Portal | ${crmConfig.name}`,
  description: 'View your bookings, photos, and account info',
}

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const branding = crmConfig.branding

  return (
    <div data-theme="portal" className="min-h-screen" style={{ background: branding.lightColor }}>
      <link
        href={`https://fonts.googleapis.com/css2?family=${branding.displayFont.replace(/ /g, '+')}:ital,wght@0,400;0,500;0,600;0,700;1,400&family=${branding.bodyFont.replace(/ /g, '+')}:wght@300;400;500;600&display=swap`}
        rel="stylesheet"
      />
      {children}
    </div>
  )
}
