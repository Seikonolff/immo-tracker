'use client'

import { useEffect, useState } from 'react'
import { Hash, Loader2, MapPin, Plus, Sparkles } from 'lucide-react'
import { createApartment, updateApartment } from '@/lib/actions/apartments'
import { scrapeApartment } from '@/lib/actions/scrape'
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

interface ApartmentFormProps {
  apartment?: ApartmentWithRatings
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ApartmentForm({ apartment, open: controlledOpen, onOpenChange }: ApartmentFormProps) {
  const isEditMode = !!apartment

  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange ?? setInternalOpen

  const [loading, setLoading] = useState(false)
  const [scrapeLoading, setScrapeLoading] = useState(false)

  // Controlled form fields
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [price, setPrice] = useState('')
  const [surface, setSurface] = useState('')
  const [rooms, setRooms] = useState('')
  const [charges, setCharges] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [isFurnished, setIsFurnished] = useState(false)
  const [hasTerrace, setHasTerrace] = useState(false)
  const [hasParking, setHasParking] = useState(false)

  const [status, setStatus] = useState<ApartmentStatus>('to_visit')

  const [locMode, setLocMode] = useState<'address' | 'coords'>('address')
  const [addressText, setAddressText] = useState('')
  const [geoLat, setGeoLat] = useState<number | null>(null)
  const [geoLng, setGeoLng] = useState<number | null>(null)
  const [coordLat, setCoordLat] = useState('')
  const [coordLng, setCoordLng] = useState('')

  // SeLoger import
  const [scrapeUrl, setScrapeUrl] = useState('')

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
      setScrapeUrl('')
    }
  }, [open, apartment])

  async function handleScrape() {
    if (!scrapeUrl) return
    setScrapeLoading(true)
    const { data, error } = await scrapeApartment(scrapeUrl)
    setScrapeLoading(false)

    if (error) { toast.error(error); return }
    if (!data || Object.keys(data).length === 0) { toast.warning('Aucune donnée récupérée'); return }

    let filled = 0
    if (data.title) { setTitle(data.title); filled++ }
    if (data.price) { setPrice(data.price.toString()); filled++ }
    if (data.surface) { setSurface(data.surface.toString()); filled++ }
    if (data.address) { setAddressText(data.address); filled++ }
    if (data.latitude && data.longitude) {
      setGeoLat(data.latitude)
      setGeoLng(data.longitude)
      setCoordLat(data.latitude.toString())
      setCoordLng(data.longitude.toString())
      if (!data.address) setLocMode('coords')
      filled++
    }
    if (data.rooms) { setRooms(data.rooms.toString()); filled++ }
    if (data.charges) { setCharges(data.charges.toString()); filled++ }
    if (data.photoUrl) { setPhotoUrl(data.photoUrl); filled++ }
    if (data.isFurnished !== undefined) { setIsFurnished(data.isFurnished); filled++ }
    if (data.hasTerrace) { setHasTerrace(true); filled++ }
    if (data.hasParking) { setHasParking(true); filled++ }
    if (!url) { setUrl(scrapeUrl); filled++ }

    toast.success(`${filled} champ${filled > 1 ? 's' : ''} pré-rempli${filled > 1 ? 's' : ''} — vérifiez et corrigez si besoin`)
  }

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
          {/* SeLoger import — create mode only */}
          {!isEditMode && (
            <div className="grid gap-2 rounded-lg border border-dashed p-3">
              <Label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5" />
                Import SeLoger / LeBonCoin
              </Label>
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://www.seloger.com/... ou leboncoin.fr/..."
                  value={scrapeUrl}
                  onChange={(e) => setScrapeUrl(e.target.value)}
                  className="h-8 text-xs"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="h-8 shrink-0"
                  disabled={!scrapeUrl || scrapeLoading}
                  onClick={handleScrape}
                >
                  {scrapeLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Remplir'}
                </Button>
              </div>
            </div>
          )}

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
