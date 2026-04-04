import { createAdminClient } from '@/lib/supabase/admin'

type NotificationType = 'deal_won' | 'deal_lost' | 'new_lead' | 'task_due' | 'mention' | 'assignment' | 'system'

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message?: string,
  entityType?: string,
  entityId?: string
) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message: message ?? null,
      entity_type: entityType ?? null,
      entity_id: entityId ?? null,
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create notification:', error)
    return null
  }

  return data
}

export async function createNotificationForOrg(
  type: NotificationType,
  title: string,
  message?: string,
  entityType?: string,
  entityId?: string
) {
  const supabase = createAdminClient()

  // Get all users in the org
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id')

  if (!profiles || profiles.length === 0) return []

  const notifications = profiles.map((p) => ({
    user_id: p.id,
    type,
    title,
    message: message ?? null,
    entity_type: entityType ?? null,
    entity_id: entityId ?? null,
  }))

  const { data, error } = await supabase
    .from('notifications')
    .insert(notifications)
    .select()

  if (error) {
    console.error('Failed to create org notifications:', error)
    return []
  }

  return data
}
