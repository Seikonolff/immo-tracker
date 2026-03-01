'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Filter, Star, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { STATUS_CONFIG, STATUS_ORDER } from '@/lib/apartment-status'
import type { ApartmentStatus } from '@/types/database'

export function ApartmentFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const minPrice    = searchParams.get('minPrice')    || ''
  const maxPrice    = searchParams.get('maxPrice')    || ''
  const minSurface  = searchParams.get('minSurface')  || ''
  const maxSurface  = searchParams.get('maxSurface')  || ''
  const furnished   = searchParams.get('furnished')   || 'all'
  const minRating   = searchParams.get('minRating')   || ''
  const status      = searchParams.get('status')      || 'all'
  const showArchived = searchParams.get('showArchived') === 'true'

  function updateFilters(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })
    router.push(`?${params.toString()}`)
  }

  function clearFilters() {
    router.push('/')
  }

  // ── Active filter chips ───────────────────────────────────────────────────
  const activeChips: { label: string; clear: () => void }[] = []

  if (minPrice && maxPrice)
    activeChips.push({ label: `Prix : ${minPrice} – ${maxPrice} €`, clear: () => updateFilters({ minPrice: '', maxPrice: '' }) })
  else if (minPrice)
    activeChips.push({ label: `Prix ≥ ${minPrice} €`, clear: () => updateFilters({ minPrice: '' }) })
  else if (maxPrice)
    activeChips.push({ label: `Prix ≤ ${maxPrice} €`, clear: () => updateFilters({ maxPrice: '' }) })

  if (minSurface && maxSurface)
    activeChips.push({ label: `Surface : ${minSurface} – ${maxSurface} m²`, clear: () => updateFilters({ minSurface: '', maxSurface: '' }) })
  else if (minSurface)
    activeChips.push({ label: `Surface ≥ ${minSurface} m²`, clear: () => updateFilters({ minSurface: '' }) })
  else if (maxSurface)
    activeChips.push({ label: `Surface ≤ ${maxSurface} m²`, clear: () => updateFilters({ maxSurface: '' }) })

  if (furnished === 'furnished')
    activeChips.push({ label: 'Meublé', clear: () => updateFilters({ furnished: '' }) })
  if (furnished === 'unfurnished')
    activeChips.push({ label: 'Non meublé', clear: () => updateFilters({ furnished: '' }) })

  if (status !== 'all')
    activeChips.push({ label: STATUS_CONFIG[status as ApartmentStatus].label, clear: () => updateFilters({ status: '' }) })

  if (minRating)
    activeChips.push({ label: `Note ≥ ${minRating} ★`, clear: () => updateFilters({ minRating: '' }) })

  if (showArchived)
    activeChips.push({ label: 'Archivés inclus', clear: () => updateFilters({ showArchived: '' }) })

  const filterCount = activeChips.length

  return (
    <div className="flex flex-col gap-2 items-end">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-2">
            <Filter className="h-4 w-4" />
            Filtres
            {filterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                {filterCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-80" align="end">
          <div className="grid gap-4">

            {/* Prix */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Prix (€/mois)</p>
              <div className="flex items-center gap-2">
                <Input type="number" placeholder="Min" value={minPrice}
                  onChange={(e) => updateFilters({ minPrice: e.target.value })} className="h-8" />
                <span className="text-muted-foreground">–</span>
                <Input type="number" placeholder="Max" value={maxPrice}
                  onChange={(e) => updateFilters({ maxPrice: e.target.value })} className="h-8" />
              </div>
            </div>

            <Separator />

            {/* Surface */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Surface (m²)</p>
              <div className="flex items-center gap-2">
                <Input type="number" placeholder="Min" value={minSurface}
                  onChange={(e) => updateFilters({ minSurface: e.target.value })} className="h-8" />
                <span className="text-muted-foreground">–</span>
                <Input type="number" placeholder="Max" value={maxSurface}
                  onChange={(e) => updateFilters({ maxSurface: e.target.value })} className="h-8" />
              </div>
            </div>

            <Separator />

            {/* Type — pills */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Type</p>
              <div className="flex gap-2">
                {(['all', 'furnished', 'unfurnished'] as const).map((v) => {
                  const label = v === 'all' ? 'Tous' : v === 'furnished' ? 'Meublé' : 'Non meublé'
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => updateFilters({ furnished: v === 'all' ? '' : v })}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        furnished === v
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'hover:bg-muted'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            <Separator />

            {/* Statut — pills colorées */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Statut</p>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_ORDER.map((s) => {
                  const { label, className } = STATUS_CONFIG[s]
                  const isActive = status === s
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => updateFilters({ status: isActive ? '' : s })}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium border transition-opacity ${className} ${
                        isActive ? 'opacity-100 ring-2 ring-offset-1 ring-current' : 'opacity-40 hover:opacity-70'
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            <Separator />

            {/* Note minimale */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Note minimale</p>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => updateFilters({ minRating: minRating === String(star) ? '' : String(star) })}
                    className="p-1 rounded transition-colors hover:bg-muted"
                  >
                    <Star className={`h-5 w-5 transition-colors ${
                      minRating && star <= parseInt(minRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground/40'
                    }`} />
                  </button>
                ))}
                {minRating && (
                  <span className="ml-1 self-center text-sm text-muted-foreground">
                    ≥ {minRating} ★
                  </span>
                )}
              </div>
            </div>

            <Separator />

            {/* Archivés */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showArchived"
                checked={showArchived}
                onCheckedChange={(checked) => updateFilters({ showArchived: checked ? 'true' : '' })}
              />
              <Label htmlFor="showArchived" className="text-sm cursor-pointer">
                Afficher les archivés
              </Label>
            </div>

            {filterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full">
                Effacer tous les filtres
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Active filter chips */}
      {activeChips.length > 0 && (
        <div className="flex flex-wrap justify-end gap-1.5">
          {activeChips.map((chip) => (
            <span
              key={chip.label}
              className="inline-flex items-center gap-1 rounded-full border bg-muted px-2.5 py-0.5 text-xs font-medium"
            >
              {chip.label}
              <button
                type="button"
                onClick={chip.clear}
                className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5 transition-colors"
                aria-label={`Supprimer le filtre ${chip.label}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
