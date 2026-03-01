'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

interface TeamData {
  id: string
  name: string
  invite_code: string
  created_at: string
}

interface MemberData {
  id: string
  full_name: string | null
  avatar_url: string | null
  user_id: string
}

interface TeamInfoResult {
  data: {
    team: TeamData
    members: MemberData[]
    currentUserId: string
  } | null
  error: string | null
}

export async function getTeamInfo(): Promise<TeamInfoResult> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { data: null, error: 'Non authentifié' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('team_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.team_id) {
    return { data: null, error: 'Aucune équipe trouvée' }
  }

  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('*')
    .eq('id', profile.team_id)
    .single()

  if (teamError || !team) {
    return { data: null, error: teamError?.message || 'Équipe non trouvée' }
  }

  const { data: members, error: membersError } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, user_id')
    .eq('team_id', profile.team_id)

  if (membersError) {
    return { data: null, error: membersError.message }
  }

  return {
    data: {
      team: team as unknown as TeamData,
      members: (members || []) as unknown as MemberData[],
      currentUserId: user.id,
    },
    error: null,
  }
}

export async function updateTeamName(formData: FormData): Promise<void> {
  const supabase = await createClient()

  const name = formData.get('name') as string

  if (!name || name.trim().length === 0) {
    return
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('team_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.team_id) {
    return
  }

  await supabase
    .from('teams')
    .update({ name: name.trim() })
    .eq('id', profile.team_id)

  revalidatePath('/team')
}

export async function regenerateInviteCode() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Non authentifié' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('team_id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.team_id) {
    return { error: 'Aucune équipe trouvée' }
  }

  const newCode = crypto.randomUUID()

  const { error } = await supabase
    .from('teams')
    .update({ invite_code: newCode })
    .eq('id', profile.team_id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/team')
  return { error: null, newCode }
}
