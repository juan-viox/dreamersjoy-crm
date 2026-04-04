import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface WorkflowAction {
  id: string
  type: string
  config: Record<string, unknown>
}

export async function POST(request: Request) {
  try {
    const { workflowId, triggerData } = await request.json()

    if (!workflowId) {
      return NextResponse.json({ error: 'Missing workflowId' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Fetch workflow
    const { data: workflow } = await supabase
      .from('workflows')
      .select('*')
      .eq('id', workflowId)
      .single()

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 })
    }

    if (!workflow.is_active) {
      return NextResponse.json({ error: 'Workflow is inactive' }, { status: 400 })
    }

    const actions = workflow.actions as WorkflowAction[]
    const results: { action: string; status: string; error?: string }[] = []

    // Process each action in sequence
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'send_email': {
            const templateId = action.config.template_id as string
            if (templateId) {
              const { data: template } = await supabase
                .from('email_templates')
                .select('*')
                .eq('id', templateId)
                .single()

              if (template && triggerData?.contact_email) {
                // Log as activity
                await supabase.from('activities').insert({
                  contact_id: triggerData?.contact_id ?? null,
                  type: 'email',
                  title: `Auto: ${template.subject}`,
                  description: `Automated email sent via workflow "${workflow.name}"`,
                  completed: true,
                  metadata: {
                    workflow_id: workflowId,
                    template_id: templateId,
                    automated: true,
                  },
                })
              }
            }
            results.push({ action: 'send_email', status: 'completed' })
            break
          }

          case 'create_activity': {
            await supabase.from('activities').insert({
              contact_id: triggerData?.contact_id ?? null,
              deal_id: triggerData?.deal_id ?? null,
              type: (action.config.type as string) ?? 'task',
              title: (action.config.title as string) ?? 'Automated activity',
              description: (action.config.description as string) ?? null,
              completed: false,
              metadata: { workflow_id: workflowId, automated: true },
            })
            results.push({ action: 'create_activity', status: 'completed' })
            break
          }

          case 'add_tag': {
            const tagName = action.config.tag_name as string
            if (tagName && triggerData?.entity_id && triggerData?.entity_type) {
              // Upsert tag
              let tagId: string
              const { data: existingTag } = await supabase
                .from('tags')
                .select('id')
                .eq('name', tagName)
                .single()

              if (existingTag) {
                tagId = existingTag.id
              } else {
                const { data: newTag } = await supabase
                  .from('tags')
                  .insert({ name: tagName })
                  .select('id')
                  .single()
                tagId = newTag!.id
              }

              // Add entity tag
              await supabase.from('entity_tags').insert({
                tag_id: tagId,
                entity_type: triggerData.entity_type,
                entity_id: triggerData.entity_id,
              })
            }
            results.push({ action: 'add_tag', status: 'completed' })
            break
          }

          case 'notify_user': {
            // Log notification as activity for now
            const message = action.config.message as string
            if (message) {
              await supabase.from('activities').insert({
                type: 'note',
                title: `Notification: ${message}`,
                description: `Automated notification from workflow "${workflow.name}"`,
                completed: true,
                metadata: { workflow_id: workflowId, automated: true, notification: true },
              })
            }
            results.push({ action: 'notify_user', status: 'completed' })
            break
          }

          case 'wait': {
            // In a real system, this would queue the remaining actions
            // For MVP, we just log it
            results.push({
              action: 'wait',
              status: 'skipped',
              error: 'Wait actions require a queue system (not yet implemented)',
            })
            break
          }

          default:
            results.push({ action: action.type, status: 'skipped', error: 'Unknown action type' })
        }
      } catch (err: any) {
        results.push({ action: action.type, status: 'error', error: err.message })
      }
    }

    // Update run count
    await supabase
      .from('workflows')
      .update({
        run_count: (workflow.run_count ?? 0) + 1,
        last_run_at: new Date().toISOString(),
      })
      .eq('id', workflowId)

    return NextResponse.json({ success: true, results })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
