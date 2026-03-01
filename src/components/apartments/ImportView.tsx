'use client'

import { useRouter } from 'next/navigation'
import { ApartmentForm, type ImportedApartmentData } from './ApartmentForm'

interface ImportViewProps {
  defaultValues: ImportedApartmentData
}

export function ImportView({ defaultValues }: ImportViewProps) {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Importer une annonce</h1>
        <p className="text-muted-foreground">
          Vérifiez et complétez les informations extraites, puis cliquez sur Ajouter.
        </p>
      </div>
      <ApartmentForm
        open={true}
        defaultValues={defaultValues}
        onOpenChange={(open) => {
          if (!open) router.push('/')
        }}
      />
    </div>
  )
}
