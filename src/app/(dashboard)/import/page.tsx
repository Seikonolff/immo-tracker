import { ImportView } from '@/components/apartments/ImportView'
import type { ImportedApartmentData } from '@/components/apartments/ApartmentForm'

interface ImportPageProps {
  searchParams: Promise<{ data?: string }>
}

export default async function ImportPage({ searchParams }: ImportPageProps) {
  const { data } = await searchParams
  let defaultValues: ImportedApartmentData = {}

  if (data) {
    try {
      const decoded = Buffer.from(data, 'base64').toString('utf-8')
      defaultValues = JSON.parse(decoded)
    } catch {
      // Données invalides, formulaire vide
    }
  }

  return <ImportView defaultValues={defaultValues} />
}
