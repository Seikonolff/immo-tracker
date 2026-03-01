import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Vérifier si l'utilisateur a une équipe
      const { data: profile } = await supabase
        .from('profiles')
        .select('team_id')
        .eq('user_id', data.user.id)
        .single()

      // Si pas d'équipe, créer/rejoindre selon les metadata
      if (!profile?.team_id) {
        const teamName = data.user.user_metadata?.team_name
        const inviteCode = data.user.user_metadata?.invite_code

        let teamId: string | null = null

        if (inviteCode) {
          // Rejoindre une équipe existante
          const { data: team } = await supabase
            .from('teams')
            .select('id')
            .eq('invite_code', inviteCode)
            .single()

          if (team) {
            teamId = team.id
          }
        } else if (teamName) {
          // Créer une nouvelle équipe
          const { data: team } = await supabase
            .from('teams')
            .insert({ name: teamName })
            .select('id')
            .single()

          if (team) {
            teamId = team.id
          }
        }

        // Mettre à jour le profil avec l'équipe
        if (teamId) {
          await supabase
            .from('profiles')
            .update({ team_id: teamId })
            .eq('user_id', data.user.id)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not authenticate`)
}
