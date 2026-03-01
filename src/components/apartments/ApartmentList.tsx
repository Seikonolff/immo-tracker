'use client'

import { ApartmentCard } from './ApartmentCard'
import { ApartmentRow } from './ApartmentRow'
import { useView } from './view-context'
import type { ApartmentWithRatings } from '@/types/database'

interface ApartmentListProps {
  apartments: ApartmentWithRatings[]
}

export function ApartmentList({ apartments }: ApartmentListProps) {
  const { view } = useView()

  if (apartments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">Aucun appartement trouvé.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Ajoutez votre premier appartement pour commencer.
        </p>
      </div>
    )
  }

  if (view === 'list') {
    return (
      <div className="flex flex-col gap-2">
        {apartments.map((apartment) => (
          <ApartmentRow key={apartment.id} apartment={apartment} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {apartments.map((apartment) => (
        <ApartmentCard key={apartment.id} apartment={apartment} />
      ))}
    </div>
  )
}
