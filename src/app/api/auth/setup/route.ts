import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crmConfig from '@/crm.config'

export async function POST(request: Request) {
  try {
    const { userId, email, fullName } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        full_name: fullName,
        role: 'owner',
      })

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // Check if deal stages exist, if not create defaults
    const { data: existingStages } = await supabase
      .from('deal_stages')
      .select('id')
      .limit(1)

    if (!existingStages || existingStages.length === 0) {
      const stages = crmConfig.settings.defaultDealStages.map(s => ({
        name: s.name,
        color: s.color,
        position: s.sort_order,
      }))

      await supabase.from('deal_stages').insert(stages)
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
