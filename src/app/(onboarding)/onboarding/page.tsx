import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // If already fully onboarded, skip to dashboard
  const { data: profile } = await supabase
    .from('profiles')
    .select('team_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profile?.team_id) redirect('/')

  const initialName = (user.user_metadata?.full_name as string | undefined) ?? ''

  return <OnboardingFlow initialName={initialName} />
}
