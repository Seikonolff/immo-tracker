import { Suspense } from 'react'
import { LayoutList, Map as MapIcon } from 'lucide-react'
import { getApartments } from '@/lib/actions/apartments'
import { getPOIs } from '@/lib/actions/poi'
import { ApartmentFilters } from '@/components/apartments/ApartmentFilters'
import { ApartmentList } from '@/components/apartments/ApartmentList'
import { ViewToggle } from '@/components/apartments/ViewToggle'
import { ViewProvider } from '@/components/apartments/view-context'
import { MapWrapper } from '@/components/map/MapWrapper'
import { AddActions } from '@/components/layout/AddActions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { ApartmentWithRatings, PointOfInterest } from '@/types/database'

interface PageProps {
  searchParams: Promise<{
    minPrice?: string
    maxPrice?: string
    minSurface?: string
    maxSurface?: string
    furnished?: string
    minRating?: string
    status?: string
    showArchived?: string
  }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams
  const showArchived = params.showArchived === 'true'

  const [{ data: apartments, error }, { data: pois }] = await Promise.all([
    getApartments(showArchived),
    getPOIs(),
  ])

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-red-500">Erreur: {error}</p>
      </div>
    )
  }

  // Apply client-side filters
  let filteredApartments = apartments as ApartmentWithRatings[]

  if (params.minPrice) {
    filteredApartments = filteredApartments.filter(
      (a) => a.price >= parseInt(params.minPrice!)
    )
  }
  if (params.maxPrice) {
    filteredApartments = filteredApartments.filter(
      (a) => a.price <= parseInt(params.maxPrice!)
    )
  }
  if (params.minSurface) {
    filteredApartments = filteredApartments.filter(
      (a) => a.surface >= parseInt(params.minSurface!)
    )
  }
  if (params.maxSurface) {
    filteredApartments = filteredApartments.filter(
      (a) => a.surface <= parseInt(params.maxSurface!)
    )
  }
  if (params.furnished === 'furnished') {
    filteredApartments = filteredApartments.filter((a) => a.is_furnished)
  }
  if (params.furnished === 'unfurnished') {
    filteredApartments = filteredApartments.filter((a) => !a.is_furnished)
  }
  if (params.minRating) {
    const min = parseFloat(params.minRating)
    filteredApartments = filteredApartments.filter(
      (a) => a.average_rating != null && a.average_rating >= min
    )
  }
  if (params.status && params.status !== 'all') {
    filteredApartments = filteredApartments.filter((a) => a.status === params.status)
  }

  return (
    <ViewProvider>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appartements</h1>
          <p className="text-muted-foreground">
            {filteredApartments.length} appartement{filteredApartments.length > 1 ? 's' : ''} trouvé{filteredApartments.length > 1 ? 's' : ''}
          </p>
        </div>
        <AddActions />
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="list" className="gap-1.5">
              <LayoutList className="h-4 w-4" />
              Liste
            </TabsTrigger>
            <TabsTrigger value="map" className="gap-1.5">
              <MapIcon className="h-4 w-4" />
              Carte
            </TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Suspense fallback={null}>
              <ViewToggle />
            </Suspense>
            <Suspense fallback={null}>
              <ApartmentFilters />
            </Suspense>
          </div>
        </div>

        <TabsContent value="list" className="space-y-4">
          <ApartmentList apartments={filteredApartments} />
        </TabsContent>

        <TabsContent value="map">
          <MapWrapper apartments={filteredApartments} pois={(pois ?? []) as PointOfInterest[]} />
        </TabsContent>
      </Tabs>
    </div>
    </ViewProvider>
  )
}
