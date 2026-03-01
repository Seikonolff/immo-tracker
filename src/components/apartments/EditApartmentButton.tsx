'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ApartmentForm } from '@/components/apartments/ApartmentForm'
import type { ApartmentWithRatings } from '@/types/database'

interface EditApartmentButtonProps {
  apartment: ApartmentWithRatings
}

export function EditApartmentButton({ apartment }: EditApartmentButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Pencil className="mr-2 h-4 w-4" />
        Modifier
      </Button>
      <ApartmentForm apartment={apartment} open={open} onOpenChange={setOpen} />
    </>
  )
}
