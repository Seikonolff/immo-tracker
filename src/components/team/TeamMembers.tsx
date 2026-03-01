import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface Member {
  id: string
  full_name: string | null
  avatar_url: string | null
  user_id: string
}

interface TeamMembersProps {
  members: Member[]
  currentUserId: string
}

export function TeamMembers({ members, currentUserId }: TeamMembersProps) {
  return (
    <div className="space-y-4">
      {members.map((member) => {
        const initials = member.full_name
          ?.split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2) || '?'

        const isCurrentUser = member.user_id === currentUserId

        return (
          <div
            key={member.id}
            className="flex items-center justify-between p-3 rounded-lg border"
          >
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={member.avatar_url || ''} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {member.full_name || 'Utilisateur'}
                </p>
              </div>
            </div>
            {isCurrentUser && (
              <Badge variant="secondary">Vous</Badge>
            )}
          </div>
        )
      })}
    </div>
  )
}
