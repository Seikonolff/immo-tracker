'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function uploadAvatar(formData: FormData): Promise<{ error: string | null; url: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Non authentifié', url: null }

  const file = formData.get('avatar') as File
  if (!file || file.size === 0) return { error: 'Aucun fichier sélectionné', url: null }

  const ext = file.name.split('.').pop()
  const path = `${user.id}/avatar.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })

  if (uploadError) return { error: uploadError.message, url: null }

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(path)

  // Append cache-bust so Next.js Image refetches the new avatar
  const urlWithBust = `${publicUrl}?t=${Date.now()}`

  await supabase
    .from('profiles')
    .update({ avatar_url: urlWithBust })
    .eq('user_id', user.id)

  revalidatePath('/settings')
  revalidatePath('/', 'layout')
  return { error: null, url: urlWithBust }
}

export async function updateProfile(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return

  const fullName = formData.get('fullName') as string

  await supabase
    .from('profiles')
    .update({ full_name: fullName })
    .eq('user_id', user.id)

  revalidatePath('/settings')
}

interface ProfileData {
  full_name: string | null
  avatar_url: string | null
}

export async function getProfile(): Promise<{
  data: ProfileData | null
  user: { id: string; email?: string } | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, user: null }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('user_id', user.id)
    .single()

  return { data: profile as ProfileData | null, user: { id: user.id, email: user.email } }
}
