'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Archive, ArchiveRestore, ExternalLink, MapPin, Pencil, ParkingSquare, Star, Trash2, Trees } from 'lucide-react'
import { archiveApartment, unarchiveApartment, deleteApartment, updateApartmentStatus } from '@/lib/actions/apartments'
import { StatusBadge } from '@/components/apartments/StatusBadge'
import { STATUS_CONFIG, STATUS_ORDER } from '@/lib/apartment-status'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ApartmentStatus } from '@/types/database'
import { ApartmentForm } from '@/components/apartments/ApartmentForm'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import type { ApartmentWithRatings } from '@/types/database'
import { toast } from 'sonner'

interface ApartmentCardProps {
  apartment: ApartmentWithRatings
  index?: number
}

export function ApartmentCard({ apartment, index = 0 }: ApartmentCardProps) {
  const pricePerM2 = Math.round(apartment.price / apartment.surface)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleArchive() {
    const result = await archiveApartment(apartment.id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Appartement archivé')
    }
  }

  async function handleUnarchive() {
    const result = await unarchiveApartment(apartment.id)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Appartement restauré')
    }
  }

  async function handleStatusChange(status: ApartmentStatus) {
    const result = await updateApartmentStatus(apartment.id, status)
    if (result.error) toast.error(result.error)
    else toast.success(`Statut : ${STATUS_CONFIG[status].label}`)
  }

  async function handleDelete() {
    setDeleting(true)
    const result = await deleteApartment(apartment.id)
    setDeleting(false)
    if (result.error) {
      toast.error(result.error)
    } else {
      setDeleteOpen(false)
      toast.success('Appartement supprimé')
    }
  }

  return (
    <>
      <ApartmentForm apartment={apartment} open={editOpen} onOpenChange={setEditOpen} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Supprimer l'appartement"
        description={`« ${apartment.title} » sera définitivement supprimé.`}
        onConfirm={handleDelete}
        loading={deleting}
      />
      <Card
        className={`group overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 animate-in fade-in-0 slide-in-from-bottom-3 [animation-fill-mode:both] ${apartment.is_archived ? 'opacity-60' : ''}`}
        style={{ animationDuration: '300ms', animationDelay: `${Math.min(index * 50, 400)}ms` }}
      >
        {apartment.photo_url && (
          <div className="relative h-40 w-full -mt-6 overflow-hidden">
            <Image
              src={apartment.photo_url}
              alt={apartment.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        )}
        <CardHeader className="pb-2">
          <CardTitle className="text-lg truncate">
            <Link href={`/apartments/${apartment.id}`} className="hover:underline">
              {apartment.title}
            </Link>
          </CardTitle>
          {apartment.address && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{apartment.address}</span>
            </p>
          )}
          <CardAction>
            <div className="flex items-center gap-2">
              <StatusBadge status={apartment.status ?? 'to_visit'} />
              {apartment.is_archived && (
                <Badge variant="secondary">Archivé</Badge>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <span className="sr-only">Menu</span>
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM12.5 8.625C13.1213 8.625 13.625 8.12132 13.625 7.5C13.625 6.87868 13.1213 6.375 12.5 6.375C11.8787 6.375 11.375 6.87868 11.375 7.5C11.375 8.12132 11.8787 8.625 12.5 8.625Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                    </svg>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditOpen(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Modifier
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Statut</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {STATUS_ORDER.map((s) => (
                        <DropdownMenuItem
                          key={s}
                          onClick={() => handleStatusChange(s)}
                          className={apartment.status === s ? 'font-semibold' : ''}
                        >
                          {STATUS_CONFIG[s].label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  {apartment.url && (
                    <DropdownMenuItem asChild>
                      <a href={apartment.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Voir l&apos;annonce
                      </a>
                    </DropdownMenuItem>
                  )}
                  {apartment.is_archived ? (
                    <DropdownMenuItem onClick={handleUnarchive}>
                      <ArchiveRestore className="mr-2 h-4 w-4" />
                      Restaurer
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={handleArchive}>
                      <Archive className="mr-2 h-4 w-4" />
                      Archiver
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Prix</p>
              <p className="font-semibold">
                {apartment.price.toLocaleString('fr-FR')} €/mois
                {apartment.charges ? <span className="text-xs text-muted-foreground font-normal"> + {apartment.charges} € cc</span> : null}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Surface</p>
              <p className="font-semibold">
                {apartment.surface} m²
                {apartment.rooms ? <span className="text-xs text-muted-foreground font-normal"> · {apartment.rooms} p.</span> : null}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Prix/m²</p>
              <p className="font-semibold">{pricePerM2} €/m²</p>
            </div>
            <div>
              <p className="text-muted-foreground">Type</p>
              <p className="font-semibold">{apartment.is_furnished ? 'Meublé' : 'Non meublé'}</p>
            </div>
          </div>
          {(apartment.terrace || apartment.parking) && (
            <div className="flex gap-3 mt-3">
              {apartment.terrace && (
                <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                  <Trees className="h-3.5 w-3.5" />
                  Terrasse
                </span>
              )}
              {apartment.parking && (
                <span className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                  <ParkingSquare className="h-3.5 w-3.5" />
                  Parking
                </span>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-2">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span className="font-medium">
              {apartment.average_rating
                ? apartment.average_rating.toFixed(1)
                : '-'}
            </span>
            <span className="text-muted-foreground text-sm">
              ({apartment.ratings?.length || 0} avis)
            </span>
          </div>
        </CardFooter>
      </Card>
    </>
  )
}
