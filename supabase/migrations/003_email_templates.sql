-- ============================================
-- 003: Email Templates, Products, Invoices, Workflows
-- ============================================

-- ========== EMAIL TEMPLATES ==========
CREATE TABLE IF NOT EXISTS email_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  category text DEFAULT 'general',
  variables text[] DEFAULT '{}',
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_email_templates_org ON email_templates(organization_id);
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY et_select ON email_templates FOR SELECT USING (organization_id = get_user_org_id() OR is_super_admin());
CREATE POLICY et_insert ON email_templates FOR INSERT WITH CHECK (organization_id = get_user_org_id());
CREATE POLICY et_update ON email_templates FOR UPDATE USING (organization_id = get_user_org_id());
CREATE POLICY et_delete ON email_templates FOR DELETE USING (organization_id = get_user_org_id());
DO $$ BEGIN
  CREATE TRIGGER email_templates_updated_at BEFORE UPDATE ON email_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========== PRODUCTS ==========
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price decimal(12,2) NOT NULL DEFAULT 0,
  unit text DEFAULT 'each',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_products_org ON products(organization_id);
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY prod_all ON products FOR ALL USING (organization_id = get_user_org_id() OR is_super_admin());

-- ========== INVOICES ==========
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id),
  deal_id uuid REFERENCES deals(id),
  invoice_number text NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  issue_date date DEFAULT CURRENT_DATE,
  due_date date,
  subtotal decimal(12,2) DEFAULT 0,
  tax_rate decimal(5,2) DEFAULT 0,
  tax_amount decimal(12,2) DEFAULT 0,
  total decimal(12,2) DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY inv_all ON invoices FOR ALL USING (organization_id = get_user_org_id() OR is_super_admin());
DO $$ BEGIN
  CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ========== INVOICE ITEMS ==========
CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  description text NOT NULL,
  quantity decimal(10,2) DEFAULT 1,
  unit_price decimal(12,2) NOT NULL,
  total decimal(12,2) NOT NULL,
  sort_order int DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY ii_all ON invoice_items FOR ALL USING (
  EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.organization_id = get_user_org_id())
  OR is_super_admin()
);

-- ========== WORKFLOWS ==========
CREATE TABLE IF NOT EXISTS workflows (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  trigger_type text NOT NULL CHECK (trigger_type IN ('contact_created', 'deal_created', 'deal_stage_changed', 'deal_won', 'deal_lost', 'activity_created', 'form_submitted', 'manual')),
  trigger_config jsonb DEFAULT '{}',
  actions jsonb NOT NULL DEFAULT '[]',
  is_active boolean DEFAULT true,
  run_count int DEFAULT 0,
  last_run_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_workflows_org ON workflows(organization_id);
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY wf_all ON workflows FOR ALL USING (organization_id = get_user_org_id() OR is_super_admin());
DO $$ BEGIN
  CREATE TRIGGER workflows_updated_at BEFORE UPDATE ON workflows FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
