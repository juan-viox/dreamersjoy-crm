-- VioX CRM — Initial Schema
-- Multi-tenant CRM for cinematic site clients

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ═══════════════════════════════════════════
-- HELPER FUNCTIONS
-- ═══════════════════════════════════════════

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- NOTE: get_user_org_id() is created AFTER profiles table (see below)

-- ═══════════════════════════════════════════
-- 1. ORGANIZATIONS (multi-tenant root)
-- ═══════════════════════════════════════════
CREATE TABLE organizations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE TRIGGER organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════
-- 2. PROFILES (users linked to orgs)
-- ═══════════════════════════════════════════
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name text,
  avatar_url text,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_profiles_org ON profiles(organization_id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Get current user's organization ID (for RLS) — must be after profiles table
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS uuid AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ═══════════════════════════════════════════
-- 3. COMPANIES (accounts)
-- ═══════════════════════════════════════════
CREATE TABLE companies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  domain text,
  industry text,
  phone text,
  email text,
  address text,
  city text,
  state text,
  zip text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_companies_org ON companies(organization_id);
CREATE INDEX idx_companies_name ON companies(organization_id, name);
CREATE TRIGGER companies_updated_at BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════
-- 4. CONTACTS
-- ═══════════════════════════════════════════
CREATE TABLE contacts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text,
  email text,
  phone text,
  job_title text,
  source text DEFAULT 'manual' CHECK (source IN ('manual', 'web_form', 'newsletter', 'voice_agent', 'booking', 'referral', 'import')),
  source_site_slug text,
  avatar_url text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, email)
);
CREATE INDEX idx_contacts_org ON contacts(organization_id);
CREATE INDEX idx_contacts_email ON contacts(organization_id, email);
CREATE INDEX idx_contacts_company ON contacts(company_id);
CREATE TRIGGER contacts_updated_at BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════
-- 5. DEAL STAGES (configurable pipeline)
-- ═══════════════════════════════════════════
CREATE TABLE deal_stages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#6c5ce7',
  sort_order int NOT NULL DEFAULT 0,
  is_won boolean DEFAULT false,
  is_lost boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_deal_stages_org ON deal_stages(organization_id, sort_order);

-- Seed default stages when org is created
CREATE OR REPLACE FUNCTION seed_deal_stages()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO deal_stages (organization_id, name, color, sort_order, is_won, is_lost) VALUES
    (NEW.id, 'Lead', '#a29bfe', 0, false, false),
    (NEW.id, 'Qualified', '#6c5ce7', 1, false, false),
    (NEW.id, 'Proposal', '#fdcb6e', 2, false, false),
    (NEW.id, 'Negotiation', '#e17055', 3, false, false),
    (NEW.id, 'Won', '#00b894', 4, true, false),
    (NEW.id, 'Lost', '#636e72', 5, false, true);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER seed_stages_on_org_create
  AFTER INSERT ON organizations
  FOR EACH ROW EXECUTE FUNCTION seed_deal_stages();

-- ═══════════════════════════════════════════
-- 6. DEALS (pipeline)
-- ═══════════════════════════════════════════
CREATE TABLE deals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  stage_id uuid NOT NULL REFERENCES deal_stages(id) ON DELETE RESTRICT,
  owner_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  amount decimal(12,2) DEFAULT 0,
  probability int DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  close_date date,
  closed_at timestamptz,
  sort_order int DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_deals_org ON deals(organization_id);
CREATE INDEX idx_deals_stage ON deals(stage_id, sort_order);
CREATE INDEX idx_deals_contact ON deals(contact_id);
CREATE INDEX idx_deals_close_date ON deals(organization_id, close_date);
CREATE TRIGGER deals_updated_at BEFORE UPDATE ON deals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════
-- 7. ACTIVITIES
-- ═══════════════════════════════════════════
CREATE TABLE activities (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES deals(id) ON DELETE SET NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  type text NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'task', 'note', 'voice_agent', 'form_submission')),
  title text NOT NULL,
  description text,
  status text DEFAULT 'completed' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date timestamptz,
  completed_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_activities_org ON activities(organization_id);
CREATE INDEX idx_activities_contact ON activities(contact_id);
CREATE INDEX idx_activities_deal ON activities(deal_id);
CREATE INDEX idx_activities_due ON activities(organization_id, due_date) WHERE status = 'pending';
CREATE TRIGGER activities_updated_at BEFORE UPDATE ON activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════
-- 8. NOTES
-- ═══════════════════════════════════════════
CREATE TABLE notes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('contact', 'company', 'deal', 'activity')),
  entity_id uuid NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_notes_entity ON notes(entity_type, entity_id);
CREATE INDEX idx_notes_org ON notes(organization_id);
CREATE TRIGGER notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════
-- 9. TAGS
-- ═══════════════════════════════════════════
CREATE TABLE tags (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#6c5ce7',
  UNIQUE(organization_id, name)
);
CREATE INDEX idx_tags_org ON tags(organization_id);

-- ═══════════════════════════════════════════
-- 10. ENTITY TAGS (polymorphic join)
-- ═══════════════════════════════════════════
CREATE TABLE entity_tags (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('contact', 'company', 'deal')),
  entity_id uuid NOT NULL,
  UNIQUE(tag_id, entity_type, entity_id)
);
CREATE INDEX idx_entity_tags_entity ON entity_tags(entity_type, entity_id);

-- ═══════════════════════════════════════════
-- 11. CINEMATIC SITES (integration)
-- ═══════════════════════════════════════════
CREATE TABLE cinematic_sites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  domain text,
  api_key text NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX idx_sites_org ON cinematic_sites(organization_id);
CREATE INDEX idx_sites_api_key ON cinematic_sites(api_key);
CREATE TRIGGER sites_updated_at BEFORE UPDATE ON cinematic_sites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ═══════════════════════════════════════════
-- 12. DOCUMENTS
-- ═══════════════════════════════════════════
CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('contact', 'company', 'deal')),
  entity_id uuid NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  file_path text NOT NULL,
  file_size int,
  mime_type text,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX idx_documents_org ON documents(organization_id);

-- ═══════════════════════════════════════════
-- ROW LEVEL SECURITY POLICIES
-- ═══════════════════════════════════════════

-- Organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_select ON organizations FOR SELECT USING (id = get_user_org_id());
CREATE POLICY org_update ON organizations FOR UPDATE USING (id = get_user_org_id());

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_select ON profiles FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY profiles_insert ON profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (id = auth.uid());

-- Companies
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY companies_select ON companies FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY companies_insert ON companies FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY companies_update ON companies FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY companies_delete ON companies FOR DELETE USING (organization_id = get_user_org_id());

-- Contacts
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY contacts_select ON contacts FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY contacts_insert ON contacts FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY contacts_update ON contacts FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY contacts_delete ON contacts FOR DELETE USING (organization_id = get_user_org_id());

-- Deal Stages
ALTER TABLE deal_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY stages_select ON deal_stages FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY stages_insert ON deal_stages FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY stages_update ON deal_stages FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY stages_delete ON deal_stages FOR DELETE USING (organization_id = get_user_org_id());

-- Deals
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY deals_select ON deals FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY deals_insert ON deals FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY deals_update ON deals FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY deals_delete ON deals FOR DELETE USING (organization_id = get_user_org_id());

-- Activities
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY activities_select ON activities FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY activities_insert ON activities FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY activities_update ON activities FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY activities_delete ON activities FOR DELETE USING (organization_id = get_user_org_id());

-- Notes
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY notes_select ON notes FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY notes_insert ON notes FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY notes_update ON notes FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY notes_delete ON notes FOR DELETE USING (organization_id = get_user_org_id());

-- Tags
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY tags_select ON tags FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY tags_insert ON tags FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY tags_update ON tags FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY tags_delete ON tags FOR DELETE USING (organization_id = get_user_org_id());

-- Entity Tags (join through tags table for org check)
ALTER TABLE entity_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY entity_tags_select ON entity_tags FOR SELECT
  USING (EXISTS (SELECT 1 FROM tags WHERE tags.id = entity_tags.tag_id AND tags.organization_id = get_user_org_id()));
CREATE POLICY entity_tags_insert ON entity_tags FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM tags WHERE tags.id = entity_tags.tag_id AND tags.organization_id = get_user_org_id()));
CREATE POLICY entity_tags_delete ON entity_tags FOR DELETE
  USING (EXISTS (SELECT 1 FROM tags WHERE tags.id = entity_tags.tag_id AND tags.organization_id = get_user_org_id()));

-- Cinematic Sites
ALTER TABLE cinematic_sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY sites_select ON cinematic_sites FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY sites_insert ON cinematic_sites FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY sites_update ON cinematic_sites FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY sites_delete ON cinematic_sites FOR DELETE USING (organization_id = get_user_org_id());

-- Documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY docs_select ON documents FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY docs_insert ON documents FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY docs_delete ON documents FOR DELETE USING (organization_id = get_user_org_id());
