import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const { email, role, invitedBy } = await request.json()

    if (!email || !role) {
      return NextResponse.json({ error: 'Missing required fields: email, role' }, { status: 400 })
    }

    if (!['admin', 'member', 'viewer'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role. Must be admin, member, or viewer.' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Send invite via Supabase Auth
    const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: {
        role,
        invited_by: invitedBy,
      },
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Create profile for the invited user if it does not exist
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: email.split('@')[0],
        role,
      }, { onConflict: 'id' })
    }

    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${email}`,
      userId: data.user?.id,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
