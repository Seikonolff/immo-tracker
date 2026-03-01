'use client'

import { useEffect, useState } from 'react'
import { Hash, MapPin, Plus } from 'lucide-react'
import { createApartment, updateApartment } from '@/lib/actions/apartments'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import type { ApartmentWithRatings, ApartmentStatus } from '@/types/database'
import { STATUS_CONFIG, STATUS_ORDER } from '@/lib/apartment-status'

export interface ImportedApartmentData {
  title?: string
  url?: string
  price?: number | string
  surface?: number | string
  rooms?: number | string
  charges?: number | string
  photo_url?: string
  address?: string
  is_furnished?: boolean
  latitude?: number
  longitude?: number
}

interface ApartmentFormProps {
  apartment?: ApartmentWithRatings
  defaultValues?: ImportedApartmentData
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ApartmentForm({ apartment, defaultValues, open: controlledOpen, onOpenChange }: ApartmentFormProps) {
  const isEditMode = !!apartment

  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  const [loading, setLoading] = useState(false)

  // Controlled form fields
  const [title, setTitle] = useState(defaultValues?.title ?? '')
  const [url, setUrl] = useState(defaultValues?.url ?? '')
  const [price, setPrice] = useState(defaultValues?.price?.toString() ?? '')
  const [surface, setSurface] = useState(defaultValues?.surface?.toString() ?? '')
  const [rooms, setRooms] = useState(defaultValues?.rooms?.toString() ?? '')
  const [charges, setCharges] = useState(defaultValues?.charges?.toString() ?? '')
  const [photoUrl, setPhotoUrl] = useState(defaultValues?.photo_url ?? '')
  const [isFurnished, setIsFurnished] = useState(defaultValues?.is_furnished ?? false)
  const [hasTerrace, setHasTerrace] = useState(false)
  const [hasParking, setHasParking] = useState(false)

  const [status, setStatus] = useState<ApartmentStatus>('to_visit')

  const hasCoords = !!(defaultValues?.latitude && defaultValues?.longitude)
  const [locMode, setLocMode] = useState<'address' | 'coords'>(
    hasCoords ? 'coords' : defaultValues?.address ? 'address' : 'address'
  )
  const [addressText, setAddressText] = useState(defaultValues?.address ?? '')
  const [geoLat, setGeoLat] = useState<number | null>(null)
  const [geoLng, setGeoLng] = useState<number | null>(null)
  const [coordLat, setCoordLat] = useState(defaultValues?.latitude?.toString() ?? '')
  const [coordLng, setCoordLng] = useState(defaultValues?.longitude?.toString() ?? '')

  useEffect(() => {
    if (open && apartment) {
      setTitle(apartment.title)
      setUrl(apartment.url ?? '')
      setPrice(apartment.price.toString())
      setSurface(apartment.surface.toString())
      setRooms(apartment.rooms?.toString() ?? '')
      setCharges(apartment.charges?.toString() ?? '')
      setPhotoUrl(apartment.photo_url ?? '')
      setIsFurnished(apartment.is_furnished)
      setHasTerrace(apartment.terrace)
      setHasParking(apartment.parking)
      setStatus(apartment.status ?? 'to_visit')
      setAddressText(apartment.address ?? '')
      setGeoLat(apartment.latitude ?? null)
      setGeoLng(apartment.longitude ?? null)
      setCoordLat(apartment.latitude?.toString() ?? '')
      setCoordLng(apartment.longitude?.toString() ?? '')
      setLocMode(apartment.address ? 'address' : 'coords')
    }
    if (!open) {
      setTitle('')
      setUrl('')
      setPrice('')
      setSurface('')
      setRooms('')
      setCharges('')
      setPhotoUrl('')
      setIsFurnished(false)
      setHasTerrace(false)
      setHasParking(false)
      setStatus('to_visit')
      setLocMode('address')
      setAddressText('')
      setGeoLat(null)
      setGeoLng(null)
      setCoordLat('')
      setCoordLng('')
    }
  }, [open, apartment])

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    formData.set('title', title)
    formData.set('url', url)
    formData.set('price', price)
    formData.set('surface', surface)
    formData.set('rooms', rooms)
    formData.set('charges', charges)
    formData.set('photo_url', photoUrl)
    formData.set('is_furnished', isFurnished.toString())
    formData.set('terrace', hasTerrace.toString())
    formData.set('parking', hasParking.toString())
    formData.set('status', status)

    if (locMode === 'address') {
      formData.set('address', addressText)
      formData.set('latitude', geoLat !== null ? geoLat.toString() : '')
      formData.set('longitude', geoLng !== null ? geoLng.toString() : '')
    } else {
      formData.set('address', '')
      formData.set('latitude', coordLat)
      formData.set('longitude', coordLng)
    }

    const result = isEditMode
      ? await updateApartment(apartment.id, formData)
      : await createApartment(formData)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(isEditMode ? 'Appartement modifié' : 'Appartement ajouté')
      setOpen(false)
    }
    setLoading(false)
  }

  const locationSection = (
    <div className="grid gap-3">
      <div className="flex items-center gap-2">
        <Label>Localisation</Label>
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
            placeholder="123 rue de la Paix, Paris"
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
            <Label htmlFor="coordLat">Latitude</Label>
            <Input
              id="coordLat"
              type="number"
              step="any"
              placeholder="48.8566"
              value={coordLat}
              onChange={(e) => setCoordLat(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="coordLng">Longitude</Label>
            <Input
              id="coordLng"
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
    <DialogContent className="sm:max-w-[500px]">
      <form action={handleSubmit}>
        <DialogHeader>
          <DialogTitle>{isEditMode ? "Modifier l'appartement" : 'Nouvel appartement'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Modifiez les informations de cet appartement.'
              : 'Ajoutez un nouvel appartement à votre liste de recherche.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              name="title"
              placeholder="Studio Paris 11e"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="url">Lien de l&apos;annonce</Label>
            <Input
              id="url"
              name="url"
              type="url"
              placeholder="https://www.seloger.com/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="price">Prix (€/mois) *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                placeholder="1200"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="surface">Surface (m²) *</Label>
              <Input
                id="surface"
                name="surface"
                type="number"
                min="0"
                placeholder="25"
                value={surface}
                onChange={(e) => setSurface(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rooms">Nb de pièces</Label>
              <Input
                id="rooms"
                name="rooms"
                type="number"
                min="1"
                placeholder="2"
                value={rooms}
                onChange={(e) => setRooms(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="charges">Charges (€/mois)</Label>
              <Input
                id="charges"
                name="charges"
                type="number"
                min="0"
                placeholder="150"
                value={charges}
                onChange={(e) => setCharges(e.target.value)}
              />
            </div>
          </div>
          {locationSection}
          <div className="grid gap-2">
            <Label>Statut</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as ApartmentStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_ORDER.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_CONFIG[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_furnished"
                checked={isFurnished}
                onCheckedChange={(checked) => setIsFurnished(checked === true)}
              />
              <Label htmlFor="is_furnished" className="cursor-pointer">
                Meublé
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terrace"
                checked={hasTerrace}
                onCheckedChange={(checked) => setHasTerrace(checked === true)}
              />
              <Label htmlFor="terrace" className="cursor-pointer">
                Terrasse
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="parking"
                checked={hasParking}
                onCheckedChange={(checked) => setHasParking(checked === true)}
              />
              <Label htmlFor="parking" className="cursor-pointer">
                Parking
              </Label>
            </div>
          </div>
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
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un appartement
          </Button>
        </DialogTrigger>
      )}
      {content}
    </Dialog>
  )
}
