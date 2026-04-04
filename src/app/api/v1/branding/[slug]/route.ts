import { NextResponse } from 'next/server'
import crmConfig from '@/crm.config'

// Returns branding from crm.config.ts (standalone mode - no DB lookup needed)
export async function GET() {
  const b = crmConfig.branding

  return NextResponse.json({
    name: crmConfig.name,
    slug: crmConfig.slug,
    primary_color: b.primaryColor,
    secondary_color: b.secondaryColor,
    accent_color: b.accentColor,
    display_font: b.displayFont,
    body_font: b.bodyFont,
    logo_url: b.logoUrl,
    tagline: crmConfig.tagline,
    phone: crmConfig.phone,
    email: crmConfig.email,
    website: crmConfig.website,
    instagram: crmConfig.instagram,
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      'Access-Control-Allow-Origin': '*',
    }
  })
}
