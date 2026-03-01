'use client'

import dynamic from 'next/dynamic'
import type { ApartmentWithRatings, PointOfInterest } from '@/types/database'

const ApartmentsMap = dynamic(
  () => import('./ApartmentsMap').then((mod) => mod.ApartmentsMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] rounded-lg border bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">Chargement de la carte...</p>
      </div>
    ),
  }
)

interface MapWrapperProps {
  apartments: ApartmentWithRatings[]
  pois: PointOfInterest[]
}

export function MapWrapper({ apartments, pois }: MapWrapperProps) {
  return <ApartmentsMap apartments={apartments} pois={pois} />
}
