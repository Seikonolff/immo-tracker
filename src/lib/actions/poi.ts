'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function getPOIs() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: 'Non authentifié' }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('team_id')
    .eq('user_id', user.id)
    .single()

  if (!profileData?.team_id) {
    return { data: [], error: 'Aucune équipe trouvée' }
  }

  const { data, error } = await supabase
    .from('points_of_interest')
    .select('*')
    .eq('team_id', profileData.team_id)
    .order('created_at', { ascending: true })

  if (error) {
    return { data: [], error: error.message }
  }

  return { data, error: null }
}

export async function createPOI(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('team_id')
    .eq('user_id', user.id)
    .single()

  if (!profileData?.team_id) {
    return { error: 'Aucune équipe trouvée' }
  }

  const { error } = await supabase
    .from('points_of_interest')
    .insert({
      team_id: profileData.team_id,
      name: formData.get('name') as string,
      type: formData.get('type') as 'friend' | 'bar' | 'work',
      latitude: parseFloat(formData.get('latitude') as string),
      longitude: parseFloat(formData.get('longitude') as string),
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  return { error: null }
}

export async function updatePOI(id: string, formData: FormData) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('points_of_interest')
    .update({
      name: formData.get('name') as string,
      type: formData.get('type') as 'friend' | 'bar' | 'work',
      latitude: parseFloat(formData.get('latitude') as string),
      longitude: parseFloat(formData.get('longitude') as string),
    })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  return { error: null }
}

export async function deletePOI(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('points_of_interest')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  return { error: null }
}
