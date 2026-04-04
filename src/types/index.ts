export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  role: 'owner' | 'admin' | 'member'
  created_at: string
  updated_at: string
}

export interface Company {
  id: string
  name: string
  domain?: string
  industry?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  notes?: string
  created_at: string
  updated_at: string
  contact_count?: number
}

export interface Contact {
  id: string
  company_id?: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  title?: string
  source?: string
  status: 'active' | 'inactive' | 'lead'
  portal_access?: boolean
  notes?: string
  created_at: string
  updated_at: string
  company?: Company
}

export interface DealStage {
  id: string
  name: string
  position: number
  color: string
  created_at: string
}

export interface Deal {
  id: string
  contact_id?: string
  company_id?: string
  stage_id: string
  title: string
  amount: number
  currency: string
  close_date?: string
  probability?: number
  status: 'open' | 'won' | 'lost'
  notes?: string
  created_at: string
  updated_at: string
  contact?: Contact
  company?: Company
  stage?: DealStage
}

export interface Activity {
  id: string
  contact_id?: string
  deal_id?: string
  user_id?: string
  type: 'call' | 'email' | 'meeting' | 'task' | 'note' | 'voice_agent'
  title: string
  description?: string
  due_date?: string
  completed: boolean
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
  contact?: Contact
  deal?: Deal
}

export interface Note {
  id: string
  contact_id?: string
  deal_id?: string
  company_id?: string
  user_id?: string
  content: string
  created_at: string
  updated_at: string
}

export interface Tag {
  id: string
  name: string
  color?: string
  created_at: string
}

export interface EntityTag {
  id: string
  tag_id: string
  entity_type: 'contact' | 'company' | 'deal'
  entity_id: string
}

export interface Document {
  id: string
  contact_id?: string
  deal_id?: string
  company_id?: string
  name: string
  file_url: string
  file_type?: string
  file_size?: number
  created_at: string
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  category: string
  variables: string[]
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  unit: string
  is_active: boolean
  created_at: string
}

export interface Invoice {
  id: string
  contact_id?: string
  deal_id?: string
  invoice_number: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  issue_date: string
  due_date?: string
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  notes?: string
  created_at: string
  updated_at: string
  contact?: Contact
  deal?: Deal
  items?: InvoiceItem[]
}

export interface InvoiceItem {
  id: string
  invoice_id: string
  product_id?: string
  description: string
  quantity: number
  unit_price: number
  total: number
  sort_order: number
}

export interface CinematicSite {
  id: string
  name: string
  slug: string
  domain?: string
  api_key: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export type WorkflowTrigger = 'contact_created' | 'deal_created' | 'deal_stage_changed' | 'deal_won' | 'deal_lost' | 'activity_created' | 'form_submitted' | 'manual'

export type WorkflowActionType = 'send_email' | 'create_activity' | 'update_field' | 'create_deal' | 'add_tag' | 'notify_user' | 'wait'

export interface WorkflowAction {
  id: string
  type: WorkflowActionType
  config: Record<string, unknown>
}

export interface Workflow {
  id: string
  name: string
  description?: string
  trigger_type: WorkflowTrigger
  trigger_config: Record<string, unknown>
  actions: WorkflowAction[]
  is_active: boolean
  run_count: number
  last_run_at?: string
  created_at: string
  updated_at: string
}
