'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function saveProfile(fullName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .upsert({ user_id: user.id, full_name: fullName.trim() }, { onConflict: 'user_id' })

  if (error) return { error: error.message }
  return { error: null }
}

export async function createTeamAndJoin(teamName: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié', inviteCode: null }

  const admin = createAdminClient()

  const { data: team, error: teamError } = await admin
    .from('teams')
    .insert({ name: teamName.trim() })
    .select('id, invite_code')
    .single()

  if (teamError || !team) return { error: "Erreur lors de la création de l'équipe", inviteCode: null }

  const { error: profileError } = await admin
    .from('profiles')
    .upsert({ user_id: user.id, team_id: team.id }, { onConflict: 'user_id' })

  if (profileError) return { error: profileError.message, inviteCode: null }

  return { error: null, inviteCode: team.invite_code as string }
}

export async function joinTeamByCode(inviteCode: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié', inviteCode: null }

  const admin = createAdminClient()

  const { data: team } = await admin
    .from('teams')
    .select('id, invite_code')
    .eq('invite_code', inviteCode.trim())
    .maybeSingle()

  if (!team) return { error: "Code d'invitation invalide", inviteCode: null }

  const { error: profileError } = await admin
    .from('profiles')
    .upsert({ user_id: user.id, team_id: team.id }, { onConflict: 'user_id' })

  if (profileError) return { error: profileError.message, inviteCode: null }

  return { error: null, inviteCode: team.invite_code as string }
}
