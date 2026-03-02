'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Bike, Briefcase, Car, GlassWater, Home, Maximize, Minimize, Pencil, PersonStanding, Trash2, Users } from 'lucide-react'
import type { ApartmentWithRatings, PointOfInterest } from '@/types/database'
import { deletePOI } from '@/lib/actions/poi'
import { toast } from 'sonner'

import {
  Map,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MapRoute,
  type MapViewport,
} from "@/components/ui/map"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { POIForm } from '@/components/map/POIForm'

const POI_COLORS: Record<PointOfInterest['type'], string> = {
  friend: '#3b82f6',
  bar: '#f97316',
  work: '#a855f7',
}

const POI_LABELS: Record<PointOfInterest['type'], string> = {
  friend: 'Ami',
  bar: 'Bar',
  work: 'Travail',
}

const POI_ICONS = {
  friend: Users,
  bar: GlassWater,
  work: Briefcase,
} as const

type TransportMode = 'driving' | 'walking' | 'cycling'

const TRANSPORT_MODES: { mode: TransportMode; label: string; Icon: typeof Car }[] = [
  { mode: 'driving', label: 'Voiture', Icon: Car },
  { mode: 'walking', label: 'À pieds', Icon: PersonStanding },
  { mode: 'cycling', label: 'Vélo', Icon: Bike },
]

const VALHALLA_COSTING: Record<TransportMode, string> = {
  driving: 'auto',
  walking: 'pedestrian',
  cycling: 'bicycle',
}

const MAP_VIEWPORT_KEY = 'immo-tracker-map-viewport'

function getInitialViewport(
  apartments: ApartmentWithRatings[],
  pois: PointOfInterest[]
): { center: [number, number]; zoom: number } {
  // 1. Premier appartement avec coordonnées (priorité aux données)
  const firstApt = apartments.find((a) => a.latitude && a.longitude)
  if (firstApt) {
    return { center: [firstApt.longitude!, firstApt.latitude!], zoom: 14 }
  }

  // 2. Premier POI
  if (pois.length > 0) {
    return { center: [pois[0].longitude, pois[0].latitude], zoom: 14 }
  }

  // 3. Position précédente sauvegardée (si aucune donnée à afficher)
  try {
    const saved = localStorage.getItem(MAP_VIEWPORT_KEY)
    if (saved) {
      const { center, zoom } = JSON.parse(saved)
      if (Array.isArray(center) && center.length === 2 && typeof zoom === 'number') {
        return { center: center as [number, number], zoom }
      }
    }
  } catch {}

  // 4. Paris par défaut
  return { center: [2.3522, 48.8566], zoom: 12 }
}

// Decode Valhalla's precision-6 encoded polyline → [lng, lat][] (GeoJSON order)
function decodePolyline6(encoded: string): [number, number][] {
  const coords: [number, number][] = []
  let index = 0, lat = 0, lng = 0
  while (index < encoded.length) {
    let b, shift = 0, result = 0
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 31) << shift; shift += 5 } while (b >= 32)
    lat += result & 1 ? ~(result >> 1) : result >> 1
    shift = 0; result = 0
    do { b = encoded.charCodeAt(index++) - 63; result |= (b & 31) << shift; shift += 5 } while (b >= 32)
    lng += result & 1 ? ~(result >> 1) : result >> 1
    coords.push([lng / 1e6, lat / 1e6])
  }
  return coords
}

interface RouteInfo {
  distanceKm: number
  durationMin: number
}

interface ApartmentsMapProps {
  apartments: ApartmentWithRatings[]
  pois: PointOfInterest[]
}

export function ApartmentsMap({ apartments, pois }: ApartmentsMapProps) {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  const [initialViewport] = useState(() => getInitialViewport(apartments, pois))
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const handleViewportChange = useCallback((vp: MapViewport) => {
    clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      localStorage.setItem(MAP_VIEWPORT_KEY, JSON.stringify({ center: vp.center, zoom: vp.zoom }))
    }, 500)
  }, [])
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([])
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const [transportMode, setTransportMode] = useState<TransportMode>('driving')
  const [currentRouteTarget, setCurrentRouteTarget] = useState<{
    apt: ApartmentWithRatings
    poi: PointOfInterest
  } | null>(null)
  const [editingPOI, setEditingPOI] = useState<PointOfInterest | null>(null)
  const [poiEditOpen, setPoiEditOpen] = useState(false)
  const [deletingPOI, setDeletingPOI] = useState<PointOfInterest | null>(null)
  const [poiDeleting, setPoiDeleting] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const apartmentsWithCoords = apartments.filter(
    (apt) => apt.latitude && apt.longitude
  )

  async function fetchRoute(
    apt: ApartmentWithRatings,
    poi: PointOfInterest,
    mode: TransportMode = transportMode
  ) {
    setRouteLoading(true)
    setRouteCoords([])
    setRouteInfo(null)
    setCurrentRouteTarget({ apt, poi })
    try {
      const res = await fetch('/api/routing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locations: [
            { lon: apt.longitude, lat: apt.latitude },
            { lon: poi.longitude, lat: poi.latitude },
          ],
          costing: VALHALLA_COSTING[mode],
          units: 'kilometers',
        }),
      })
      if (!res.ok) throw new Error(`Erreur ${res.status}`)
      const json = await res.json()
      const trip = json.trip
      if (!trip?.legs?.[0]) throw new Error('Aucun itinéraire trouvé')
      const coords = decodePolyline6(trip.legs[0].shape)
      const distanceKm = Math.round(trip.summary.length * 10) / 10
      const durationMin = Math.round(trip.summary.time / 60)
      setRouteCoords(coords)
      setRouteInfo({ distanceKm, durationMin })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors du calcul d'itinéraire")
    } finally {
      setRouteLoading(false)
    }
  }

  async function handleModeChange(mode: TransportMode) {
    setTransportMode(mode)
    if (currentRouteTarget) {
      await fetchRoute(currentRouteTarget.apt, currentRouteTarget.poi, mode)
    }
  }

  function clearRoute() {
    setRouteCoords([])
    setRouteInfo(null)
    setCurrentRouteTarget(null)
  }

  async function handleDeletePOI() {
    if (!deletingPOI) return
    setPoiDeleting(true)
    const result = await deletePOI(deletingPOI.id)
    setPoiDeleting(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      setDeletingPOI(null)
      toast.success('Point d\'intérêt supprimé')
      router.refresh()
    }
  }

  if (!isClient) {
    return (
      <div className="h-[500px] w-full rounded-xl border bg-muted animate-pulse flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Initialisation de la carte...</p>
      </div>
    )
  }

  return (
    <>
      <ConfirmDialog
        open={!!deletingPOI}
        onOpenChange={(o) => { if (!o) setDeletingPOI(null) }}
        title="Supprimer le point d'intérêt"
        description={deletingPOI ? `« ${deletingPOI.name} » sera définitivement supprimé.` : undefined}
        onConfirm={handleDeletePOI}
        loading={poiDeleting}
      />

      <div className={
        fullscreen
          ? 'fixed inset-0 z-50 bg-background'
          : 'h-[500px] w-full rounded-xl relative overflow-hidden border border-border shadow-sm'
      }>
        {/* Fullscreen toggle */}
        <button
          type="button"
          onClick={() => setFullscreen((f) => !f)}
          className="absolute top-2 right-2 z-10 flex items-center justify-center h-8 w-8 rounded-md bg-background/90 border shadow-sm hover:bg-muted transition-colors"
          aria-label={fullscreen ? 'Quitter le plein écran' : 'Plein écran'}
        >
          {fullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </button>

        <Map center={initialViewport.center} zoom={initialViewport.zoom} onViewportChange={handleViewportChange}>
          {/* Apartment markers */}
          {apartmentsWithCoords.map((apartment) => (
            <MapMarker
              key={apartment.id}
              latitude={apartment.latitude!}
              longitude={apartment.longitude!}
            >
              <MarkerContent>
                <div className="flex items-center justify-center h-7 w-7 rounded-full border-2 border-white bg-primary shadow-lg cursor-pointer">
                  <Home className="h-3.5 w-3.5 text-white" />
                </div>
              </MarkerContent>
              <MarkerPopup className="w-64 overflow-hidden p-0">
                <div className="space-y-2">
                  {apartment.photo_url && (
                    <div className="relative h-32 w-full">
                      <Image
                        src={apartment.photo_url}
                        alt={apartment.title}
                        fill
                        className="object-cover"
                        sizes="256px"
                      />
                    </div>
                  )}
                  <div className={`space-y-2 ${apartment.photo_url ? 'px-3 pb-3' : 'p-3'}`}>
                  <div className="space-y-0.5">
                    <h3 className="font-semibold leading-none tracking-tight text-sm">
                      {apartment.title}
                    </h3>
                    {apartment.address && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1">
                        {apartment.address}
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between items-center py-2 border-y border-border/50 text-sm">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground font-medium uppercase">Prix</span>
                      <span className="font-bold text-primary">
                        {apartment.price.toLocaleString('fr-FR')} €/mois
                      </span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[10px] text-muted-foreground font-medium uppercase">Surface</span>
                      <span className="font-semibold">{apartment.surface} m²</span>
                    </div>
                  </div>

                  {apartment.average_rating && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-yellow-500 text-xs">★</span>
                      <span className="text-xs font-medium">{apartment.average_rating.toFixed(1)}/5</span>
                    </div>
                  )}

                  {pois.length > 0 && (
                    <Select
                      onValueChange={(poiId) => {
                        const poi = pois.find((p) => p.id === poiId)
                        if (poi) fetchRoute(apartment, poi)
                      }}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder={routeLoading ? 'Calcul...' : 'Itinéraire vers...'} />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(POI_LABELS) as PointOfInterest['type'][])
                          .filter((type) => pois.some((p) => p.type === type))
                          .map((type) => {
                            const Icon = POI_ICONS[type]
                            return (
                              <SelectGroup key={type}>
                                <SelectLabel className="flex items-center gap-1.5 text-xs" style={{ color: POI_COLORS[type] }}>
                                  <Icon className="h-3 w-3" />
                                  {POI_LABELS[type]}
                                </SelectLabel>
                                {pois.filter((p) => p.type === type).map((poi) => (
                                  <SelectItem key={poi.id} value={poi.id} className="text-xs pl-6">
                                    {poi.name}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            )
                          })}
                      </SelectContent>
                    </Select>
                  )}

                  <Link
                    href={`/apartments/${apartment.id}`}
                    className="flex h-9 w-full items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none"
                  >
                    Voir les détails
                  </Link>
                  </div>
                </div>
              </MarkerPopup>
            </MapMarker>
          ))}

          {/* POI markers */}
          {pois.map((poi) => {
            const Icon = POI_ICONS[poi.type]
            return (
              <MapMarker
                key={poi.id}
                latitude={poi.latitude}
                longitude={poi.longitude}
              >
                <MarkerContent>
                  <div
                    className="flex items-center justify-center h-6 w-6 rounded-full border-2 border-white shadow-lg cursor-pointer"
                    style={{ backgroundColor: POI_COLORS[poi.type] }}
                  >
                    <Icon className="h-3 w-3 text-white" />
                  </div>
                </MarkerContent>
                <MarkerPopup>
                  <div className="space-y-2 min-w-[160px]">
                    <div>
                      <p className="font-semibold text-sm">{poi.name}</p>
                      <p className="text-xs text-muted-foreground">{POI_LABELS[poi.type]}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 flex-1 text-xs"
                        onClick={() => {
                          setEditingPOI(poi)
                          setPoiEditOpen(true)
                        }}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Modifier
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-7 flex-1 text-xs"
                        onClick={() => setDeletingPOI(poi)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </MarkerPopup>
              </MapMarker>
            )
          })}

          {/* Route */}
          {routeCoords.length > 0 && (
            <MapRoute coordinates={routeCoords} color="#3b82f6" width={4} />
          )}
        </Map>

        {/* Route info + transport mode overlay */}
        {(routeInfo || routeLoading) && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 rounded-lg border bg-background/95 px-4 py-2 shadow-lg backdrop-blur-sm">
            {/* Transport mode buttons */}
            <div className="flex rounded-md border overflow-hidden">
              {TRANSPORT_MODES.map(({ mode, label, Icon }) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleModeChange(mode)}
                  title={label}
                  className={`px-2 py-1 transition-colors ${
                    transportMode === mode
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>

            {routeLoading ? (
              <span className="text-sm text-muted-foreground">Calcul...</span>
            ) : routeInfo ? (
              <span className="text-sm font-medium">
                {routeInfo.durationMin} min — {routeInfo.distanceKm} km
              </span>
            ) : null}

            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={clearRoute}>
              Effacer
            </Button>
          </div>
        )}
      </div>

      {/* POI Edit Dialog — rendered outside map to avoid z-index issues */}
      {editingPOI && (
        <POIForm
          poi={editingPOI}
          open={poiEditOpen}
          onOpenChange={(o) => {
            setPoiEditOpen(o)
            if (!o) setEditingPOI(null)
          }}
        />
      )}
    </>
  )
}
