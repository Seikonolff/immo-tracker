import { createClient } from '@/lib/supabase/server'

export type NotificationType =
  | 'apartment_added'
  | 'rating_added'
  | 'remark_added'
  | 'status_changed'

/**
 * Inserts a notification for every team member except the actor.
 * Fire-and-forget — call with `void notifyTeam(...)` to avoid blocking.
 */
export async function notifyTeam(opts: {
  actorId: string
  apartmentId: string
  type: NotificationType
  extra?: string // score for rating, status label for status_changed
}) {
  try {
    const supabase = await createClient()

    // Fetch apartment title + team_id
    const { data: apt } = await supabase
      .from('apartments')
      .select('title, team_id')
      .eq('id', opts.apartmentId)
      .single()

    if (!apt) return

    // Fetch actor display name
    const { data: actor } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', opts.actorId)
      .single()

    const actorName = actor?.full_name ?? 'Un coéquipier'

    let message: string
    switch (opts.type) {
      case 'apartment_added':
        message = `${actorName} a ajouté l'appartement « ${apt.title} »`
        break
      case 'rating_added':
        message = `${actorName} a noté « ${apt.title} » : ${opts.extra}`
        break
      case 'remark_added':
        message = `${actorName} a commenté « ${apt.title} »`
        break
      case 'status_changed':
        message = `${actorName} a changé le statut de « ${apt.title} » en ${opts.extra}`
        break
    }

    // Fetch all other team members
    const { data: members } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('team_id', apt.team_id)
      .neq('user_id', opts.actorId)

    if (!members || members.length === 0) return

    await supabase.from('notifications').insert(
      members.map((m) => ({
        team_id: apt.team_id,
        user_id: m.user_id,
        actor_id: opts.actorId,
        type: opts.type,
        apartment_id: opts.apartmentId,
        message,
      }))
    )
  } catch {
    // Notifications are non-critical — never throw
  }
}
