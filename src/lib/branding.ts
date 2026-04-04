import crmConfig from '@/crm.config'

export interface OrgBranding {
  name: string
  slug: string
  primary_color: string
  secondary_color: string
  accent_color: string
  display_font: string
  body_font: string
  logo_url: string | null
  tagline: string | null
  website: string | null
  phone: string | null
  email: string | null
}

/**
 * Get branding from crm.config.ts (standalone mode - no DB lookup needed).
 */
export function getBranding(): OrgBranding {
  return {
    name: crmConfig.name,
    slug: crmConfig.slug,
    primary_color: crmConfig.branding.primaryColor,
    secondary_color: crmConfig.branding.secondaryColor,
    accent_color: crmConfig.branding.accentColor,
    display_font: crmConfig.branding.displayFont,
    body_font: crmConfig.branding.bodyFont,
    logo_url: crmConfig.branding.logoUrl,
    tagline: crmConfig.tagline,
    website: crmConfig.website,
    phone: crmConfig.phone,
    email: crmConfig.email,
  }
}

/**
 * Build CSS variables object from branding for inline styles.
 */
export function brandingToCssVars(branding: OrgBranding): Record<string, string> {
  return {
    '--portal-primary': branding.primary_color,
    '--portal-secondary': branding.secondary_color,
    '--portal-accent': branding.accent_color,
    '--portal-display-font': `'${branding.display_font}', Georgia, serif`,
    '--portal-body-font': `'${branding.body_font}', system-ui, sans-serif`,
  }
}

/**
 * Build a Google Fonts URL for the org's chosen fonts.
 */
export function buildGoogleFontsUrl(branding: OrgBranding): string {
  const display = branding.display_font.replace(/ /g, '+')
  const body = branding.body_font.replace(/ /g, '+')
  return `https://fonts.googleapis.com/css2?family=${display}:ital,wght@0,400;0,500;0,600;0,700;1,400&family=${body}:wght@300;400;500;600&display=swap`
}
