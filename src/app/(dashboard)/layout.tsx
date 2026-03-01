import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { Toaster } from '@/components/ui/sonner'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('team_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!profile?.team_id) {
      redirect('/onboarding')
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container px-4 md:px-6 lg:px-8 py-6 mx-auto animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
        {children}
      </main>
      <Toaster />
    </div>
  )
}
