const crmConfig = {
  // Business Info
  name: 'DreamersJoy Floral Studio',
  slug: 'dreamersjoy',
  tagline: 'Refined Floral Design for Intimate Gatherings',
  website: 'https://dreamersjoystudio.com',
  phone: '(551) 465-5200',
  email: 'hello@dreamersjoystudio.com',
  address: 'Wyckoff, NJ',
  instagram: '@dreamersjoy',

  // Branding
  branding: {
    primaryColor: '#334155',
    accentColor: '#8B7355',
    secondaryColor: '#F5F0EB',
    darkColor: '#1A1A2E',
    lightColor: '#FAFAF8',
    displayFont: 'Cormorant Garamond',
    bodyFont: 'Jost',
    logoUrl: null as string | null,
  },

  // CRM Settings
  settings: {
    defaultDealStages: [
      { name: 'Lead', color: '#a29bfe', sort_order: 0 },
      { name: 'Qualified', color: '#6c5ce7', sort_order: 1 },
      { name: 'Proposal', color: '#fdcb6e', sort_order: 2 },
      { name: 'Negotiation', color: '#e17055', sort_order: 3 },
      { name: 'Won', color: '#00b894', sort_order: 4, is_won: true },
      { name: 'Lost', color: '#636e72', sort_order: 5, is_lost: true },
    ] as Array<{ name: string; color: string; sort_order: number; is_won?: boolean; is_lost?: boolean }>,
    currency: 'USD',
    timezone: 'America/New_York',
  },

  // Cinematic Site Integration
  siteIntegration: {
    enabled: true,
    siteUrl: 'https://dreamersjoystudio.com',
    apiKey: '', // Generated during setup
  },

  // Feature Flags
  features: {
    leads: true,
    calendar: true,
    emails: true,
    invoices: true,
    automations: true,
    portal: true,
    aiProviders: true,
  },
}

export default crmConfig
export type CrmConfig = typeof crmConfig
