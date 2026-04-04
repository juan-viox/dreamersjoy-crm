import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const { survivorId, duplicateId, selectedFields, userId } = await request.json()

    if (!survivorId || !duplicateId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 1. Get both contacts for the merge log
    const [{ data: survivor }, { data: duplicate }] = await Promise.all([
      supabase.from('contacts').select('*').eq('id', survivorId).single(),
      supabase.from('contacts').select('*').eq('id', duplicateId).single(),
    ])

    if (!survivor || !duplicate) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    // 2. Update survivor with selected fields
    if (selectedFields && Object.keys(selectedFields).length > 0) {
      await supabase.from('contacts').update(selectedFields).eq('id', survivorId)
    }

    // 3. Transfer all related records from duplicate to survivor
    await Promise.all([
      // Activities
      supabase
        .from('activities')
        .update({ contact_id: survivorId })
        .eq('contact_id', duplicateId),
      // Deals
      supabase
        .from('deals')
        .update({ contact_id: survivorId })
        .eq('contact_id', duplicateId),
      // Notes
      supabase
        .from('notes')
        .update({ contact_id: survivorId })
        .eq('contact_id', duplicateId),
      // Entity tags
      supabase
        .from('entity_tags')
        .update({ entity_id: survivorId })
        .eq('entity_type', 'contact')
        .eq('entity_id', duplicateId),
      // Documents
      supabase
        .from('documents')
        .update({ contact_id: survivorId })
        .eq('contact_id', duplicateId),
      // Invoices
      supabase
        .from('invoices')
        .update({ contact_id: survivorId })
        .eq('contact_id', duplicateId),
    ])

    // 4. Delete the duplicate contact
    await supabase.from('contacts').delete().eq('id', duplicateId)

    // 5. Log the merge as an activity
    await supabase.from('activities').insert({
      contact_id: survivorId,
      user_id: userId || null,
      type: 'note',
      title: 'Contacts merged',
      description: `Merged "${duplicate.first_name} ${duplicate.last_name}" (${duplicate.email ?? 'no email'}) into this contact. All activities, deals, notes, and tags were transferred.`,
      completed: true,
      metadata: {
        action: 'contact_merge',
        merged_contact_id: duplicateId,
        merged_contact_name: `${duplicate.first_name} ${duplicate.last_name}`,
        merged_contact_email: duplicate.email,
      },
    })

    return NextResponse.json({
      success: true,
      message: `Merged "${duplicate.first_name} ${duplicate.last_name}" into "${survivor.first_name} ${survivor.last_name}"`,
    })
  } catch (err: any) {
    console.error('Merge error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
