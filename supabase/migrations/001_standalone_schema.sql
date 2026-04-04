-- VioX CRM Standalone Schema
-- Single-tenant: no organization_id, no RLS policies
-- Run this in your Supabase SQL Editor to set up the database

-- ============================================================
-- PROFILES (CRM users)
-- ============================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  avatar_url text,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- COMPANIES
-- ============================================================
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text,
  industry text,
  phone text,
  address text,
  city text,
  state text,
  zip text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- CONTACTS (with portal_access flag for client portal)
-- ============================================================
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references companies(id) on delete set null,
  first_name text not null,
  last_name text not null default '',
  email text,
  phone text,
  title text,
  source text,
  status text not null default 'lead' check (status in ('active', 'inactive', 'lead')),
  portal_access boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contacts_email on contacts(email);
create index if not exists idx_contacts_status on contacts(status);

-- ============================================================
-- DEAL STAGES
-- ============================================================
create table if not exists deal_stages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default '#6c5ce7',
  position int not null default 0,
  created_at timestamptz not null default now()
);

-- ============================================================
-- DEALS
-- ============================================================
create table if not exists deals (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references contacts(id) on delete set null,
  company_id uuid references companies(id) on delete set null,
  stage_id uuid references deal_stages(id) on delete set null,
  title text not null,
  amount numeric not null default 0,
  currency text not null default 'USD',
  close_date date,
  probability int,
  status text not null default 'open' check (status in ('open', 'won', 'lost')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_deals_status on deals(status);
create index if not exists idx_deals_stage on deals(stage_id);

-- ============================================================
-- ACTIVITIES
-- ============================================================
create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references contacts(id) on delete set null,
  deal_id uuid references deals(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  type text not null check (type in ('call', 'email', 'meeting', 'task', 'note', 'voice_agent')),
  title text not null,
  description text,
  due_date timestamptz,
  completed boolean not null default false,
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_activities_contact on activities(contact_id);
create index if not exists idx_activities_deal on activities(deal_id);
create index if not exists idx_activities_due on activities(due_date);

-- ============================================================
-- NOTES
-- ============================================================
create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references contacts(id) on delete set null,
  deal_id uuid references deals(id) on delete set null,
  company_id uuid references companies(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- TAGS + ENTITY TAGS
-- ============================================================
create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text default '#6c5ce7',
  created_at timestamptz not null default now()
);

create table if not exists entity_tags (
  id uuid primary key default gen_random_uuid(),
  tag_id uuid not null references tags(id) on delete cascade,
  entity_type text not null check (entity_type in ('contact', 'company', 'deal')),
  entity_id uuid not null,
  unique(tag_id, entity_type, entity_id)
);

-- ============================================================
-- EMAIL TEMPLATES
-- ============================================================
create table if not exists email_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null,
  body text not null,
  category text not null default 'general',
  variables jsonb not null default '[]',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- PRODUCTS
-- ============================================================
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric not null default 0,
  unit text not null default 'each',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- INVOICES + INVOICE ITEMS
-- ============================================================
create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references contacts(id) on delete set null,
  deal_id uuid references deals(id) on delete set null,
  invoice_number text not null unique,
  status text not null default 'draft' check (status in ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  issue_date date not null default current_date,
  due_date date,
  subtotal numeric not null default 0,
  tax_rate numeric not null default 0,
  tax_amount numeric not null default 0,
  total numeric not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  description text not null,
  quantity numeric not null default 1,
  unit_price numeric not null default 0,
  total numeric not null default 0,
  sort_order int not null default 0
);

-- ============================================================
-- WORKFLOWS (Automations)
-- ============================================================
create table if not exists workflows (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  trigger_type text not null,
  trigger_config jsonb not null default '{}',
  actions jsonb not null default '[]',
  is_active boolean not null default true,
  run_count int not null default 0,
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- DOCUMENTS
-- ============================================================
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references contacts(id) on delete set null,
  deal_id uuid references deals(id) on delete set null,
  company_id uuid references companies(id) on delete set null,
  name text not null,
  file_url text not null,
  file_type text,
  file_size bigint,
  created_at timestamptz not null default now()
);

-- ============================================================
-- CINEMATIC SITES (for site integration tracking)
-- ============================================================
create table if not exists cinematic_sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  domain text,
  api_key text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- DEFAULT DEAL STAGES (inserted on first setup)
-- ============================================================
insert into deal_stages (name, color, position) values
  ('Lead', '#a29bfe', 0),
  ('Qualified', '#6c5ce7', 1),
  ('Proposal', '#fdcb6e', 2),
  ('Negotiation', '#e17055', 3),
  ('Won', '#00b894', 4),
  ('Lost', '#636e72', 5)
on conflict do nothing;
