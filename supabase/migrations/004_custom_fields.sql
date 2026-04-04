-- VioX CRM — Custom Fields System
-- Allows users to define custom fields for contacts, companies, and deals

CREATE TABLE IF NOT EXISTS custom_field_definitions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  entity_type text NOT NULL CHECK (entity_type IN ('contact', 'company', 'deal')),
  field_name text NOT NULL,
  field_label text NOT NULL,
  field_type text NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'select', 'multiselect', 'checkbox', 'url', 'email', 'phone', 'textarea')),
  options jsonb DEFAULT '[]',
  is_required boolean DEFAULT false,
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, entity_type, field_name)
);

CREATE INDEX IF NOT EXISTS idx_cfd_org_entity ON custom_field_definitions(organization_id, entity_type);

CREATE TABLE IF NOT EXISTS custom_field_values (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  field_id uuid NOT NULL REFERENCES custom_field_definitions(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  value text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cfv_entity ON custom_field_values(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_cfv_field ON custom_field_values(field_id);

CREATE TRIGGER cfv_updated_at BEFORE UPDATE ON custom_field_values
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS Policies for custom_field_definitions
ALTER TABLE custom_field_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY cfd_select ON custom_field_definitions FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY cfd_insert ON custom_field_definitions FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY cfd_update ON custom_field_definitions FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY cfd_delete ON custom_field_definitions FOR DELETE USING (organization_id = get_user_org_id());

-- RLS Policies for custom_field_values (join through definitions for org check)
ALTER TABLE custom_field_values ENABLE ROW LEVEL SECURITY;
CREATE POLICY cfv_select ON custom_field_values FOR SELECT
  USING (EXISTS (SELECT 1 FROM custom_field_definitions WHERE custom_field_definitions.id = custom_field_values.field_id AND custom_field_definitions.organization_id = get_user_org_id()));
CREATE POLICY cfv_insert ON custom_field_values FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM custom_field_definitions WHERE custom_field_definitions.id = custom_field_values.field_id AND custom_field_definitions.organization_id = get_user_org_id()));
CREATE POLICY cfv_update ON custom_field_values FOR UPDATE
  USING (EXISTS (SELECT 1 FROM custom_field_definitions WHERE custom_field_definitions.id = custom_field_values.field_id AND custom_field_definitions.organization_id = get_user_org_id()));
CREATE POLICY cfv_delete ON custom_field_values FOR DELETE
  USING (EXISTS (SELECT 1 FROM custom_field_definitions WHERE custom_field_definitions.id = custom_field_values.field_id AND custom_field_definitions.organization_id = get_user_org_id()));
