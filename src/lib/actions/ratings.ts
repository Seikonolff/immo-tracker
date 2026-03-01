'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { notifyTeam } from '@/lib/notify'
import type { NewRating } from '@/types/database'

export async function createOrUpdateRating(apartmentId: string, formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Non authentifié' }
  }

  const score = parseInt(formData.get('score') as string)
  const comment = (formData.get('comment') as string) || null

  if (score < 1 || score > 5) {
    return { error: 'La note doit être entre 1 et 5' }
  }

  // Check if user already rated this apartment
  const { data: existingRating } = await supabase
    .from('ratings')
    .select('id')
    .eq('apartment_id', apartmentId)
    .eq('user_id', user.id)
    .single()

  if (existingRating) {
    // Update existing rating
    const { error } = await supabase
      .from('ratings')
      .update({ score, comment })
      .eq('id', existingRating.id)

    if (error) {
      return { error: error.message }
    }
  } else {
    // Create new rating
    const rating: NewRating = {
      apartment_id: apartmentId,
      user_id: user.id,
      score,
      comment,
    }

    const { error } = await supabase
      .from('ratings')
      .insert(rating)

    if (error) {
      return { error: error.message }
    }

    void notifyTeam({ actorId: user.id, apartmentId, type: 'rating_added', extra: `${score}/5` })
  }

  revalidatePath(`/apartments/${apartmentId}`)
  revalidatePath('/')
  return { error: null }
}

export async function deleteRating(ratingId: string, apartmentId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('ratings')
    .delete()
    .eq('id', ratingId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/apartments/${apartmentId}`)
  revalidatePath('/')
  return { error: null }
}
