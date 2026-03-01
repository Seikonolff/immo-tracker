'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { updateApartmentStatus } from '@/lib/actions/apartments'
import { STATUS_CONFIG, STATUS_ORDER } from '@/lib/apartment-status'
import type { ApartmentStatus } from '@/types/database'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function StatusSelector({
  apartmentId,
  current,
}: {
  apartmentId: string
  current: ApartmentStatus
}) {
  const [optimistic, setOptimistic] = useState<ApartmentStatus>(current)
  const { label, className } = STATUS_CONFIG[optimistic]

  async function handleChange(status: ApartmentStatus) {
    if (status === optimistic) return
    setOptimistic(status)
    const result = await updateApartmentStatus(apartmentId, status)
    if (result.error) {
      setOptimistic(current)
      toast.error(result.error)
    } else {
      toast.success(`Statut : ${STATUS_CONFIG[status].label}`)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border ${className}`}
        >
          {label}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {STATUS_ORDER.map((s) => {
          const { label: l, className: cn } = STATUS_CONFIG[s]
          return (
            <DropdownMenuItem
              key={s}
              onClick={() => handleChange(s)}
              className="gap-2"
            >
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium border ${cn}`}>
                {l}
              </span>
              {s === optimistic && <span className="ml-auto text-xs text-muted-foreground">✓</span>}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
