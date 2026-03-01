import Link from 'next/link'
import { Home } from 'lucide-react'
import { UserNav } from './UserNav'
import { ThemeToggle } from './ThemeToggle'
import { NavLinks } from './NavLinks'
import { NotificationBell } from './NotificationBell'
import { createClient } from '@/lib/supabase/server'

interface ProfileWithTeam {
  full_name: string | null
  avatar_url: string | null
  team_id: string | null
  teams: { name: string } | null
}

export async function Header() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, team_id, teams(name)')
    .eq('user_id', user?.id ?? '')
    .single()

  const profile = data as ProfileWithTeam | null

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 animate-in slide-in-from-top-2 fade-in-0 duration-300">
      <div className="container flex h-14 items-center flex-1 container px-4 md:px-6 lg:px-8 py-6 mx-auto">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Home className="h-5 w-5" />
            <span className="font-bold">ImmoTracker</span>
          </Link>
          <NavLinks />
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <ThemeToggle />
          {user && <NotificationBell userId={user.id} />}
          <UserNav
            user={{
              email: user?.email ?? '',
              fullName: profile?.full_name ?? '',
              avatarUrl: profile?.avatar_url ?? '',
              teamName: profile?.teams?.name ?? '',
            }}
          />
        </div>
      </div>
    </header>
  )
}
