'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { notifyTeam } from '@/lib/notify'

export async function getRemarks(apartmentId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('remarks')
    .select(`
      *,
      profiles:user_id (
        full_name,
        avatar_url
      )
    `)
    .eq('apartment_id', apartmentId)
    .order('created_at', { ascending: true })

  if (error) {
    return { data: [], error: error.message }
  }

  return { data, error: null }
}

export async function createRemark(apartmentId: string, content: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Non authentifié' }
  }

  const { error } = await supabase
    .from('remarks')
    .insert({ apartment_id: apartmentId, user_id: user.id, content })

  if (error) {
    return { error: error.message }
  }

  void notifyTeam({ actorId: user.id, apartmentId, type: 'remark_added' })

  revalidatePath(`/apartments/${apartmentId}`)
  return { error: null }
}

export async function deleteRemark(remarkId: string, apartmentId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('remarks')
    .delete()
    .eq('id', remarkId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/apartments/${apartmentId}`)
  return { error: null }
}
