'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Building2, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { href: '/', label: 'Appartements', icon: Building2, exact: true, also: '/apartments' },
  { href: '/team', label: 'Équipe', icon: Users, exact: false, also: undefined },
]

export function NavLinks() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center space-x-6 text-sm font-medium">
      {links.map(({ href, label, icon: Icon, exact, also }) => {
        const isActive = (exact ? pathname === href : pathname.startsWith(href))
          || (also ? pathname.startsWith(also) : false)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'relative flex items-center gap-1 py-1 transition-colors hover:text-foreground/80',
              isActive ? 'text-foreground' : 'text-muted-foreground',
            )}
          >
            {Icon && <Icon className="h-4 w-4" />}
            {label}
            {isActive && (
              <span className="absolute -bottom-[19px] left-0 right-0 h-0.5 rounded-full bg-foreground" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
