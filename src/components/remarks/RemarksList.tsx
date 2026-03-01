'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteRemark } from '@/lib/actions/remarks'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { toast } from 'sonner'
import type { RemarkWithProfile } from '@/types/database'

interface RemarksListProps {
  remarks: RemarkWithProfile[]
  currentUserId: string | undefined
  apartmentId: string
}

function formatRelativeDate(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "À l'instant"
  if (diffMins < 60) return `Il y a ${diffMins} min`
  if (diffHours < 24) return `Il y a ${diffHours}h`
  if (diffDays < 7) return `Il y a ${diffDays}j`
  return date.toLocaleDateString('fr-FR')
}

export function RemarksList({ remarks, currentUserId, apartmentId }: RemarksListProps) {
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!pendingId) return
    setDeleting(true)
    const result = await deleteRemark(pendingId, apartmentId)
    setDeleting(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      setPendingId(null)
    }
  }

  if (remarks.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucune remarque pour l&apos;instant.
      </p>
    )
  }

  return (
    <>
    <ConfirmDialog
      open={!!pendingId}
      onOpenChange={(o) => { if (!o) setPendingId(null) }}
      title="Supprimer la remarque"
      description="Cette remarque sera définitivement supprimée."
      onConfirm={handleDelete}
      loading={deleting}
    />
    <div className="space-y-4">
      {remarks.map((remark) => {
        const name = remark.profiles?.full_name ?? 'Membre'
        const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

        return (
          <div key={remark.id} className="flex gap-3">
            <Avatar className="h-8 w-8 shrink-0">
              <AvatarImage src={remark.profiles?.avatar_url ?? ''} alt={name} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeDate(remark.created_at)}
                  </span>
                </div>
                {remark.user_id === currentUserId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-red-500 shrink-0"
                    onClick={() => setPendingId(remark.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              <p className="text-sm mt-1 break-words">{remark.content}</p>
            </div>
          </div>
        )
      })}
    </div>
    </>
  )
}
