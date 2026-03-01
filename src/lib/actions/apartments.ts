'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { notifyTeam } from '@/lib/notify'
import { STATUS_CONFIG } from '@/lib/apartment-status'
import type { ApartmentStatus, NewApartment, UpdateApartment } from '@/types/database'

interface ProfileTeamId {
  team_id: string | null
}

interface ApartmentRating {
  id: string
  score: number
  user_id: string
}

interface ApartmentData {
  id: string
  team_id: string
  url: string | null
  title: string
  price: number
  surface: number
  rooms: number | null
  charges: number | null
  photo_url: string | null
  is_furnished: boolean
  terrace: boolean
  parking: boolean
  address: string | null
  latitude: number | null
  longitude: number | null
  is_archived: boolean
  created_by: string | null
  created_at: string
  ratings: ApartmentRating[]
}

export async function getApartments(showArchived = false) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], error: 'Non authentifié' }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('team_id')
    .eq('user_id', user.id)
    .single()

  const profile = profileData as ProfileTeamId | null

  if (!profile?.team_id) {
    return { data: [], error: 'Aucune équipe trouvée' }
  }

  let query = supabase
    .from('apartments')
    .select(`
      *,
      ratings (
        id,
        score,
        user_id
      )
    `)
    .eq('team_id', profile.team_id)
    .order('created_at', { ascending: false })

  if (!showArchived) {
    query = query.eq('is_archived', false)
  }

  const { data, error } = await query

  if (error) {
    return { data: [], error: error.message }
  }

  const apartments = data as unknown as ApartmentData[]

  // Calculate average rating for each apartment
  const apartmentsWithAverage = apartments.map((apt) => ({
    ...apt,
    average_rating: apt.ratings.length > 0
      ? apt.ratings.reduce((sum: number, r) => sum + r.score, 0) / apt.ratings.length
      : null,
  }))

  return { data: apartmentsWithAverage, error: null }
}

export async function getApartment(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('apartments')
    .select(`
      *,
      ratings (
        id,
        score,
        comment,
        user_id,
        created_at
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function createApartment(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Non authentifié' }
  }

  const { data: profileData } = await supabase
    .from('profiles')
    .select('team_id')
    .eq('user_id', user.id)
    .single()

  const profile = profileData as ProfileTeamId | null

  if (!profile?.team_id) {
    return { error: 'Aucune équipe trouvée' }
  }

  const apartment: NewApartment = {
    team_id: profile.team_id,
    created_by: user.id,
    title: formData.get('title') as string,
    price: parseInt(formData.get('price') as string),
    surface: parseInt(formData.get('surface') as string),
    rooms: formData.get('rooms') ? parseInt(formData.get('rooms') as string) : null,
    charges: formData.get('charges') ? parseInt(formData.get('charges') as string) : null,
    photo_url: (formData.get('photo_url') as string) || null,
    is_furnished: formData.get('is_furnished') === 'true',
    terrace: formData.get('terrace') === 'true',
    parking: formData.get('parking') === 'true',
    url: (formData.get('url') as string) || null,
    address: (formData.get('address') as string) || null,
    latitude: formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : null,
    longitude: formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : null,
    status: (formData.get('status') as ApartmentStatus) || 'to_visit',
  }

  const { data: inserted, error } = await supabase
    .from('apartments')
    .insert(apartment)
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }

  void notifyTeam({ actorId: user.id, apartmentId: inserted.id, type: 'apartment_added' })

  revalidatePath('/')
  return { error: null }
}

export async function updateApartment(id: string, formData: FormData) {
  const supabase = await createClient()

  const updates: UpdateApartment = {
    title: formData.get('title') as string,
    price: parseInt(formData.get('price') as string),
    surface: parseInt(formData.get('surface') as string),
    rooms: formData.get('rooms') ? parseInt(formData.get('rooms') as string) : null,
    charges: formData.get('charges') ? parseInt(formData.get('charges') as string) : null,
    photo_url: (formData.get('photo_url') as string) || null,
    is_furnished: formData.get('is_furnished') === 'true',
    terrace: formData.get('terrace') === 'true',
    parking: formData.get('parking') === 'true',
    url: (formData.get('url') as string) || null,
    address: (formData.get('address') as string) || null,
    latitude: formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : null,
    longitude: formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : null,
    status: (formData.get('status') as ApartmentStatus) || undefined,
  }

  const { error } = await supabase
    .from('apartments')
    .update(updates)
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  revalidatePath(`/apartments/${id}`)
  return { error: null }
}

export async function archiveApartment(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('apartments')
    .update({ is_archived: true })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  return { error: null }
}

export async function unarchiveApartment(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('apartments')
    .update({ is_archived: false })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  return { error: null }
}

export async function deleteApartment(id: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('apartments')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/')
  return { error: null }
}

export async function updateApartmentStatus(id: string, status: ApartmentStatus) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const { error } = await supabase
    .from('apartments')
    .update({ status })
    .eq('id', id)

  if (error) return { error: error.message }

  void notifyTeam({
    actorId: user.id,
    apartmentId: id,
    type: 'status_changed',
    extra: STATUS_CONFIG[status].label,
  })

  revalidatePath('/')
  revalidatePath(`/apartments/${id}`)
  return { error: null }
}
