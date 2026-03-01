'use client'

import { useEffect, useState, useRef, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Hash, MapPin, Plus } from 'lucide-react'
import { createPOI, updatePOI } from '@/lib/actions/poi'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlaceAutocomplete } from '@/components/ui/place-autocomplete'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import type { PointOfInterest } from '@/types/database'

interface POIFormProps {
  poi?: PointOfInterest
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function POIForm({ poi, open: controlledOpen, onOpenChange }: POIFormProps) {
  const isEditMode = !!poi
  const router = useRouter()

  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(poi?.name ?? '')
  const [type, setType] = useState<'friend' | 'bar' | 'work'>('friend')

  const [locMode, setLocMode] = useState<'address' | 'coords'>('coords')
  const [addressText, setAddressText] = useState('')
  const [geoLat, setGeoLat] = useState<number | null>(null)
  const [geoLng, setGeoLng] = useState<number | null>(null)
  const [coordLat, setCoordLat] = useState('')
  const [coordLng, setCoordLng] = useState('')

  useEffect(() => {
    if (open && poi) {
      setName(poi.name)
      setType(poi.type)
      setCoordLat(poi.latitude.toString())
      setCoordLng(poi.longitude.toString())
      setGeoLat(poi.latitude)
      setGeoLng(poi.longitude)
      setLocMode('coords')
      setAddressText('')
    }
    if (!open) {
      setName('')
      setType('friend')
      setLocMode('coords')
      setAddressText('')
      setGeoLat(null)
      setGeoLng(null)
      setCoordLat('')
      setCoordLng('')
    }
  }, [open, poi])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)

    const lat = locMode === 'address' ? geoLat?.toString() ?? '' : coordLat
    const lng = locMode === 'address' ? geoLng?.toString() ?? '' : coordLng

    if (!lat || !lng) {
      toast.error('Veuillez renseigner la localisation')
      setLoading(false)
      return
    }

    const formData = new FormData()
    formData.set('name', name)
    formData.set('type', type)
    formData.set('latitude', lat)
    formData.set('longitude', lng)

    const result = isEditMode
      ? await updatePOI(poi.id, formData)
      : await createPOI(formData)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(isEditMode ? 'Point d\'intérêt modifié' : 'Point d\'intérêt ajouté')
      setOpen(false)
      router.refresh()
    }
    setLoading(false)
  }

  const locationSection = (
    <div className="grid gap-3">
      <div className="flex items-center gap-2">
        <Label>Localisation *</Label>
        <div className="ml-auto flex rounded-md border overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setLocMode('address')}
            className={`px-3 py-1 transition-colors flex items-center gap-1 ${
              locMode === 'address' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            <MapPin className="h-3 w-3" />
            Adresse
          </button>
          <button
            type="button"
            onClick={() => setLocMode('coords')}
            className={`px-3 py-1 transition-colors flex items-center gap-1 ${
              locMode === 'coords' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            <Hash className="h-3 w-3" />
            Coordonnées
          </button>
        </div>
      </div>

      {locMode === 'address' ? (
        <div className="grid gap-1.5">
          <PlaceAutocomplete
            lang="fr"
            limit={5}
            placeholder="Bureau, chez Alice..."
            value={addressText}
            onChange={setAddressText}
            onPlaceSelect={(feature) => {
              const [lng, lat] = feature.geometry.coordinates
              setGeoLat(lat)
              setGeoLng(lng)
            }}
          />
          {geoLat !== null && geoLng !== null && (
            <p className="text-xs text-muted-foreground">
              Coordonnées : {geoLat.toFixed(5)}, {geoLng.toFixed(5)}
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="poi-latitude">Latitude</Label>
            <Input
              id="poi-latitude"
              type="number"
              step="any"
              placeholder="48.8566"
              value={coordLat}
              onChange={(e) => setCoordLat(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="poi-longitude">Longitude</Label>
            <Input
              id="poi-longitude"
              type="number"
              step="any"
              placeholder="2.3522"
              value={coordLng}
              onChange={(e) => setCoordLng(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  )

  const content = (
    <DialogContent className="sm:max-w-[400px]">
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Modifier le point d\'intérêt' : 'Nouveau point d\'intérêt'}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="poi-name">Nom *</Label>
            <Input
              id="poi-name"
              placeholder="Bureau, Chez Alice..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label>Type *</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="friend">Ami</SelectItem>
                <SelectItem value="bar">Bar</SelectItem>
                <SelectItem value="work">Travail</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {locationSection}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button type="submit" disabled={loading}>
            {loading
              ? isEditMode ? 'Modification...' : 'Ajout...'
              : isEditMode ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  )

  if (isEditMode) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        {content}
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un POI
          </Button>
        </DialogTrigger>
      )}
      {content}
    </Dialog>
  )
}
