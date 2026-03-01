import { formatDistanceToNow } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StarRating } from './StarRating'

interface Rating {
  id: string
  score: number
  comment: string | null
  created_at: string
  profiles: {
    full_name: string | null
    avatar_url: string | null
  } | null
}

interface RatingsListProps {
  ratings: Rating[]
  currentUserId?: string
}

export function RatingsList({ ratings }: RatingsListProps) {
  if (ratings.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Aucun avis pour le moment.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {ratings.map((rating) => {
        const initials = rating.profiles?.full_name
          ?.split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2) || '?'

        return (
          <div key={rating.id} className="flex gap-4 p-4 rounded-lg border">
            <Avatar className="h-10 w-10">
              <AvatarImage src={rating.profiles?.avatar_url || ''} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <p className="font-medium">
                  {rating.profiles?.full_name || 'Utilisateur'}
                </p>
                <StarRating value={rating.score} readonly size="sm" />
              </div>
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(rating.created_at)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
