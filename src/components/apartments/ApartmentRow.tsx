'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Archive, ArchiveRestore, ExternalLink, MapPin, Pencil, ParkingSquare, Star, Trash2, Trees } from 'lucide-react'
import { archiveApartment, unarchiveApartment, deleteApartment, updateApartmentStatus } from '@/lib/actions/apartments'
import { StatusBadge } from '@/components/apartments/StatusBadge'
import { STATUS_CONFIG, STATUS_ORDER } from '@/lib/apartment-status'
import type { ApartmentStatus } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { ApartmentForm } from '@/components/apartments/ApartmentForm'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import type { ApartmentWithRatings } from '@/types/database'
import { toast } from 'sonner'

interface ApartmentRowProps {
  apartment: ApartmentWithRatings
}

export function ApartmentRow({ apartment }: ApartmentRowProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleArchive() {
    const result = await archiveApartment(apartment.id)
    if (result.error) toast.error(result.error)
    else toast.success('Appartement archivé')
  }

  async function handleUnarchive() {
    const result = await unarchiveApartment(apartment.id)
    if (result.error) toast.error(result.error)
    else toast.success('Appartement restauré')
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
    if (result.error) toast.error(result.error)
    else { setDeleteOpen(false); toast.success('Appartement supprimé') }
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
      <div className={`flex items-center gap-4 rounded-lg border bg-card px-4 py-3 shadow-sm transition-opacity ${apartment.is_archived ? 'opacity-60' : ''}`}>

        {/* Thumbnail */}
        <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
          {apartment.photo_url ? (
            <Image
              src={apartment.photo_url}
              alt={apartment.title}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground/40">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/>
              </svg>
            </div>
          )}
        </div>

        {/* Title + address + badges */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link href={`/apartments/${apartment.id}`} className="truncate font-semibold text-sm hover:underline">
              {apartment.title}
            </Link>
            <StatusBadge status={apartment.status ?? 'to_visit'} />
            {apartment.is_archived && <Badge variant="secondary" className="shrink-0">Archivé</Badge>}
          </div>
          {apartment.address && (
            <p className="text-xs text-muted-foreground flex items-center gap-1 truncate mt-0.5">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{apartment.address}</span>
            </p>
          )}
          <div className="flex items-center gap-2 mt-1">
            {apartment.terrace && (
              <span className="flex items-center gap-0.5 text-[11px] text-green-600 font-medium">
                <Trees className="h-3 w-3" /> Terrasse
              </span>
            )}
            {apartment.parking && (
              <span className="flex items-center gap-0.5 text-[11px] text-blue-600 font-medium">
                <ParkingSquare className="h-3 w-3" /> Parking
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-6 shrink-0 text-sm">
          <div className="text-right">
            <p className="font-bold text-primary">{apartment.price.toLocaleString('fr-FR')} €<span className="text-xs font-normal text-muted-foreground">/mois</span></p>
            {apartment.charges ? <p className="text-[11px] text-muted-foreground">+ {apartment.charges} € cc</p> : null}
          </div>
          <div className="text-right">
            <p className="font-semibold">{apartment.surface} m²</p>
            {apartment.rooms ? <p className="text-[11px] text-muted-foreground">{apartment.rooms} pièces</p> : null}
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
            <span className="font-medium text-sm">
              {apartment.average_rating ? apartment.average_rating.toFixed(1) : '—'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <span className="sr-only">Menu</span>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.625 7.5C3.625 8.12132 3.12132 8.625 2.5 8.625C1.87868 8.625 1.375 8.12132 1.375 7.5C1.375 6.87868 1.87868 6.375 2.5 6.375C3.12132 6.375 3.625 6.87868 3.625 7.5ZM8.625 7.5C8.625 8.12132 8.12132 8.625 7.5 8.625C6.87868 8.625 6.375 8.12132 6.375 7.5C6.375 6.87868 6.87868 6.375 7.5 6.375C8.12132 6.375 8.625 6.87868 8.625 7.5ZM12.5 8.625C13.1213 8.625 13.625 8.12132 13.625 7.5C13.625 6.87868 13.1213 6.375 12.5 6.375C11.8787 6.375 11.375 6.87868 11.375 7.5C11.375 8.12132 11.8787 8.625 12.5 8.625Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/>
              </svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" /> Modifier
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
                  <ExternalLink className="mr-2 h-4 w-4" /> Voir l&apos;annonce
                </a>
              </DropdownMenuItem>
            )}
            {apartment.is_archived ? (
              <DropdownMenuItem onClick={handleUnarchive}>
                <ArchiveRestore className="mr-2 h-4 w-4" /> Restaurer
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={handleArchive}>
                <Archive className="mr-2 h-4 w-4" /> Archiver
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" /> Supprimer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}
