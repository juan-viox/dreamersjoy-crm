-- VioX CRM — Migration 002: Org Branding + Super Admin
-- Run this AFTER migration 001 has already been applied

-- ═══════════════════════════════════════════
-- 1. ADD BRANDING COLUMNS TO ORGANIZATIONS
-- ═══════════════════════════════════════════
DO $$ BEGIN
  ALTER TABLE organizations ADD COLUMN logo_url text;
  EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE organizations ADD COLUMN primary_color text DEFAULT '#334155';
  EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE organizations ADD COLUMN secondary_color text DEFAULT '#F5F0EB';
  EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE organizations ADD COLUMN accent_color text DEFAULT '#8B7355';
  EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE organizations ADD COLUMN accent2_color text DEFAULT '#C9B8A8';
  EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE organizations ADD COLUMN accent3_color text DEFAULT '#6B7C6E';
  EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE organizations ADD COLUMN dark_color text DEFAULT '#1A1A2E';
  EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE organizations ADD COLUMN light_color text DEFAULT '#FAFAF8';
  EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE organizations ADD COLUMN display_font text DEFAULT 'Cormorant Garamond';
  EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE organizations ADD COLUMN body_font text DEFAULT 'Jost';
  EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE organizations ADD COLUMN tagline text;
  EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE organizations ADD COLUMN website text;
  EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE organizations ADD COLUMN phone text;
  EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE organizations ADD COLUMN email text;
  EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE organizations ADD COLUMN address text;
  EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE organizations ADD COLUMN city text;
  EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE organizations ADD COLUMN state text;
  EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE organizations ADD COLUMN instagram text;
  EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE organizations ADD COLUMN business_type text;
  EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE organizations ADD COLUMN is_active boolean DEFAULT true;
  EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE organizations ADD COLUMN plan text DEFAULT 'free';
  EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE organizations ADD COLUMN max_users int DEFAULT 3;
  EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE organizations ADD COLUMN max_contacts int DEFAULT 500;
  EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ═══════════════════════════════════════════
-- 2. SUPER ADMIN TABLE
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS super_admins (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Super admin check function
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Update RLS policies for super admin access
DROP POLICY IF EXISTS org_select ON organizations;
CREATE POLICY org_select ON organizations FOR SELECT
  USING (id = get_user_org_id() OR is_super_admin());

DROP POLICY IF EXISTS org_update ON organizations;
CREATE POLICY org_update ON organizations FOR UPDATE
  USING (id = get_user_org_id() OR is_super_admin());

DROP POLICY IF EXISTS org_insert ON organizations;
CREATE POLICY org_insert ON organizations FOR INSERT
  WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS profiles_select ON profiles;
CREATE POLICY profiles_select ON profiles FOR SELECT
  USING (organization_id = get_user_org_id() OR is_super_admin());

DROP POLICY IF EXISTS contacts_select ON contacts;
CREATE POLICY contacts_select ON contacts FOR SELECT
  USING (organization_id = get_user_org_id() OR is_super_admin());

DROP POLICY IF EXISTS deals_select ON deals;
CREATE POLICY deals_select ON deals FOR SELECT
  USING (organization_id = get_user_org_id() OR is_super_admin());

DROP POLICY IF EXISTS activities_select ON activities;
CREATE POLICY activities_select ON activities FOR SELECT
  USING (organization_id = get_user_org_id() OR is_super_admin());

DROP POLICY IF EXISTS companies_select ON companies;
CREATE POLICY companies_select ON companies FOR SELECT
  USING (organization_id = get_user_org_id() OR is_super_admin());

DROP POLICY IF EXISTS sites_select ON cinematic_sites;
CREATE POLICY sites_select ON cinematic_sites FOR SELECT
  USING (organization_id = get_user_org_id() OR is_super_admin());

DROP POLICY IF EXISTS stages_select ON deal_stages;
CREATE POLICY stages_select ON deal_stages FOR SELECT
  USING (organization_id = get_user_org_id() OR is_super_admin());

-- RLS for super_admins table
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sa_select ON super_admins;
CREATE POLICY sa_select ON super_admins FOR SELECT
  USING (user_id = auth.uid() OR is_super_admin());

-- ═══════════════════════════════════════════
-- 3. PORTAL USERS TABLE
-- ═══════════════════════════════════════════
CREATE TABLE IF NOT EXISTS portal_users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  email text NOT NULL,
  full_name text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, organization_id)
);
CREATE INDEX IF NOT EXISTS idx_portal_users_org ON portal_users(organization_id);
CREATE INDEX IF NOT EXISTS idx_portal_users_email ON portal_users(email);

DO $$ BEGIN
  CREATE TRIGGER portal_users_updated_at BEFORE UPDATE ON portal_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE portal_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS portal_select ON portal_users;
CREATE POLICY portal_select ON portal_users FOR SELECT
  USING (organization_id = get_user_org_id() OR user_id = auth.uid() OR is_super_admin());
DROP POLICY IF EXISTS portal_insert ON portal_users;
CREATE POLICY portal_insert ON portal_users FOR INSERT
  WITH CHECK (organization_id = get_user_org_id() OR is_super_admin());
DROP POLICY IF EXISTS portal_update ON portal_users;
CREATE POLICY portal_update ON portal_users FOR UPDATE
  USING (organization_id = get_user_org_id() OR user_id = auth.uid() OR is_super_admin());

-- ═══════════════════════════════════════════
-- 4. EXPAND PROFILE ROLES
-- ═══════════════════════════════════════════
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('owner', 'admin', 'member', 'viewer'));
