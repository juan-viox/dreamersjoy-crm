-- VioX CRM — Org Branding + Super Admin
-- Adds per-org branding and super-admin role

-- ═══════════════════════════════════════════
-- 1. ADD BRANDING TO ORGANIZATIONS
-- ═══════════════════════════════════════════
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#334155';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT '#F5F0EB';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS accent_color text DEFAULT '#8B7355';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS accent2_color text DEFAULT '#C9B8A8';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS accent3_color text DEFAULT '#6B7C6E';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS dark_color text DEFAULT '#1A1A2E';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS light_color text DEFAULT '#FAFAF8';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS display_font text DEFAULT 'Cormorant Garamond';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS body_font text DEFAULT 'Jost';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS tagline text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS instagram text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS business_type text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan text DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'enterprise'));
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_users int DEFAULT 3;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_contacts int DEFAULT 500;

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

-- Super admins can see ALL organizations (bypass normal RLS)
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM super_admins WHERE user_id = auth.uid())
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Update organizations RLS to allow super admin access
DROP POLICY IF EXISTS org_select ON organizations;
CREATE POLICY org_select ON organizations FOR SELECT
  USING (id = get_user_org_id() OR is_super_admin());

DROP POLICY IF EXISTS org_update ON organizations;
CREATE POLICY org_update ON organizations FOR UPDATE
  USING (id = get_user_org_id() OR is_super_admin());

-- Super admin can INSERT new organizations
CREATE POLICY org_insert ON organizations FOR INSERT
  WITH CHECK (is_super_admin());

-- Super admin can see all profiles
DROP POLICY IF EXISTS profiles_select ON profiles;
CREATE POLICY profiles_select ON profiles FOR SELECT
  USING (organization_id = get_user_org_id() OR is_super_admin());

-- Super admin can see all contacts
DROP POLICY IF EXISTS contacts_select ON contacts;
CREATE POLICY contacts_select ON contacts FOR SELECT
  USING (organization_id = get_user_org_id() OR is_super_admin());

-- Super admin can see all deals
DROP POLICY IF EXISTS deals_select ON deals;
CREATE POLICY deals_select ON deals FOR SELECT
  USING (organization_id = get_user_org_id() OR is_super_admin());

-- Super admin can see all activities
DROP POLICY IF EXISTS activities_select ON activities;
CREATE POLICY activities_select ON activities FOR SELECT
  USING (organization_id = get_user_org_id() OR is_super_admin());

-- Super admin can see all companies
DROP POLICY IF EXISTS companies_select ON companies;
CREATE POLICY companies_select ON companies FOR SELECT
  USING (organization_id = get_user_org_id() OR is_super_admin());

-- Super admin can see all cinematic sites
DROP POLICY IF EXISTS sites_select ON cinematic_sites;
CREATE POLICY sites_select ON cinematic_sites FOR SELECT
  USING (organization_id = get_user_org_id() OR is_super_admin());

-- Super admin can see all deal stages
DROP POLICY IF EXISTS stages_select ON deal_stages;
CREATE POLICY stages_select ON deal_stages FOR SELECT
  USING (organization_id = get_user_org_id() OR is_super_admin());

-- RLS for super_admins table itself
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY sa_select ON super_admins FOR SELECT
  USING (user_id = auth.uid() OR is_super_admin());

-- ═══════════════════════════════════════════
-- 3. ADD ROLE TO PROFILES (expand check)
-- ═══════════════════════════════════════════
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('owner', 'admin', 'member', 'viewer'));

-- ═══════════════════════════════════════════
-- 4. PORTAL USERS TABLE
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
CREATE TRIGGER portal_users_updated_at BEFORE UPDATE ON portal_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE portal_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY portal_select ON portal_users FOR SELECT
  USING (organization_id = get_user_org_id() OR user_id = auth.uid() OR is_super_admin());
CREATE POLICY portal_insert ON portal_users FOR INSERT
  WITH CHECK (organization_id = get_user_org_id() OR is_super_admin());
CREATE POLICY portal_update ON portal_users FOR UPDATE
  USING (organization_id = get_user_org_id() OR user_id = auth.uid() OR is_super_admin());
