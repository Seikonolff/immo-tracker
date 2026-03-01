'use client'

import { useState } from 'react'
import { Home, MapPin, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ApartmentForm } from '@/components/apartments/ApartmentForm'
import { POIForm } from '@/components/map/POIForm'

export function AddActions() {
  const [aptOpen, setAptOpen] = useState(false)
  const [poiOpen, setPoiOpen] = useState(false)

  return (
    <>
      <ApartmentForm open={aptOpen} onOpenChange={setAptOpen} />
      <POIForm open={poiOpen} onOpenChange={setPoiOpen} />

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => setAptOpen(true)}>
          <Plus className="h-4 w-4" />
          Appartement
        </Button>
        <Button variant="outline" size="sm" onClick={() => setPoiOpen(true)}>
          <MapPin className="h-4 w-4" />
          Point d&apos;intérêt
        </Button>
      </div>
    </>
  )
}
