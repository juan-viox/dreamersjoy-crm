# VioX CRM

A modern, AI-powered CRM for your business. Built with Next.js, Supabase, and TypeScript.

Each client gets their own standalone CRM instance -- no multi-tenant complexity, no shared database.

## Quick Start

1. Clone this repo into your project:
   ```
   git clone <viox-crm-repo-url> crm/
   cd crm/
   npm install
   ```

2. Create a Supabase project at [supabase.com](https://supabase.com)

3. Run the setup script:
   ```bash
   bash scripts/setup.sh
   ```

4. Run the migration SQL in the Supabase SQL Editor:
   ```
   supabase/migrations/001_standalone_schema.sql
   ```

5. Start the dev server:
   ```bash
   npm run dev
   ```

6. Deploy:
   ```bash
   npx vercel --prod
   ```

## Configuration

Edit `src/crm.config.ts` to customize everything:

- **Business info** -- name, phone, email, address, tagline
- **Branding** -- colors, fonts, logo URL
- **Deal stages** -- default pipeline stages with colors
- **Feature flags** -- enable/disable leads, calendar, emails, invoices, automations, portal
- **Site integration** -- connect your cinematic website

## Architecture

```
src/
  crm.config.ts          # THE single config file
  app/
    (app)/               # Main CRM dashboard (auth required)
    (auth)/              # Login / signup pages
    (portal)/            # Client-facing portal
    api/v1/ingest/       # Webhook endpoints for site integration
  components/            # Shared UI components
  lib/                   # Supabase clients, utilities
  types/                 # TypeScript interfaces
supabase/
  migrations/            # Database schema
scripts/
  setup.sh              # Interactive setup wizard
```

## Connecting to Your Cinematic Site

After setup, add this to your cinematic site's JavaScript:

```js
var CRM = {
  apiUrl: 'https://your-crm-domain.com/api/v1/ingest',
  apiKey: 'your-api-key-from-setup'
};
```

The CRM accepts data from four ingest endpoints:
- `POST /api/v1/ingest/lead` -- Contact form submissions
- `POST /api/v1/ingest/booking` -- Booking requests
- `POST /api/v1/ingest/newsletter` -- Newsletter signups
- `POST /api/v1/ingest/voice-call` -- AI voice agent call logs

All endpoints require the `x-api-key` header matching `SITE_API_KEY` in `.env.local`.

## Features

- **Dashboard** -- Revenue charts, pipeline snapshot, activity feed
- **Contacts & Companies** -- Full contact management with merge, import, export
- **Deal Pipeline** -- Kanban board with drag-and-drop
- **Leads** -- Lead tracking with source attribution and conversion
- **Calendar** -- Activity calendar with task management
- **Email** -- Templates, compose, and send (via Resend)
- **Invoices** -- Create, send, and track invoices with line items
- **Automations** -- Workflow builder with triggers and actions
- **Client Portal** -- Branded portal for your clients
- **AI Providers** -- Configure OpenRouter, Claude, GPT-4o, and more
- **Integrations** -- Stripe, Twilio, Resend, Blotato
- **Reports** -- Revenue, pipeline, activity, and source analytics

## Updating

To pull updates from the VioX CRM source repo:

```bash
git remote add upstream <viox-crm-source-repo>
git pull upstream main
```

Your `crm.config.ts` and `.env.local` will not be overwritten.

---

Powered by VioX AI
