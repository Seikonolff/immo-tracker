'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Notification } from '@/types/database'

export async function getNotifications(): Promise<{
  data: Notification[]
  unreadCount: number
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: [], unreadCount: 0 }

  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  const notifications = (data ?? []) as Notification[]
  const unreadCount = notifications.filter((n) => !n.read_at).length

  return { data: notifications, unreadCount }
}

export async function markAsRead(id: string) {
  const supabase = await createClient()
  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/', 'layout')
}

export async function markAllAsRead() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('read_at', null)

  revalidatePath('/', 'layout')
}

export async function deleteNotification(id: string) {
  const supabase = await createClient()
  await supabase.from('notifications').delete().eq('id', id)
  revalidatePath('/', 'layout')
}
