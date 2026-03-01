import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/'

  const redirectTo = request.nextUrl.clone()
  redirectTo.pathname = next
  redirectTo.searchParams.delete('token_hash')
  redirectTo.searchParams.delete('type')

  if (token_hash && type) {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

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

      redirectTo.searchParams.delete('next')
      return NextResponse.redirect(redirectTo)
    }
  }

  // Return the user to an error page with some instructions
  redirectTo.pathname = '/login'
  redirectTo.searchParams.set('error', 'Could not verify email')
  return NextResponse.redirect(redirectTo)
}
