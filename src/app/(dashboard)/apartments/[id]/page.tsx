import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink, MapPin, ParkingSquare, Star, Trees } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { StatusBadge } from '@/components/apartments/StatusBadge'
import { StatusSelector } from '@/components/apartments/StatusSelector'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { RatingForm } from '@/components/ratings/RatingForm'
import { RatingsList } from '@/components/ratings/RatingsList'
import { RemarkForm } from '@/components/remarks/RemarkForm'
import { RemarksList } from '@/components/remarks/RemarksList'
import { EditApartmentButton } from '@/components/apartments/EditApartmentButton'
import type { ApartmentStatus, ApartmentWithRatings, RemarkWithProfile } from '@/types/database'

interface PageProps {
  params: Promise<{ id: string }>
}

type RatingRow = {
  id: string
  score: number
  comment: string | null
  user_id: string
  created_at: string
  profiles: { full_name: string | null; avatar_url: string | null } | null
}

export default async function ApartmentDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  // 1. Fetch apartment + ratings (no profiles join — no direct FK exists)
  const { data, error } = await supabase
    .from('apartments')
    .select(`
      *,
      ratings (
        id,
        score,
        comment,
        user_id,
        created_at
      )
    `)
    .eq('id', id)
    .single()

  if (error || !data) {
    notFound()
  }

  const rawRatings = (data.ratings ?? []) as Omit<RatingRow, 'profiles'>[]

  // 2. Fetch profiles for rating authors separately (correct approach without FK ratings→profiles)
  let profilesMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {}
  if (rawRatings.length > 0) {
    const userIds = [...new Set(rawRatings.map((r) => r.user_id))]
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url')
      .in('user_id', userIds)
    if (profilesData) {
      profilesMap = Object.fromEntries(
        profilesData.map((p) => [p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url }])
      )
    }
  }

  const ratings: RatingRow[] = rawRatings.map((r) => ({
    ...r,
    profiles: profilesMap[r.user_id] ?? null,
  }))

  // 3. Fetch remarks (table may not exist before migration)
  let remarks: RemarkWithProfile[] = []
  try {
    const { data: rd } = await supabase
      .from('remarks')
      .select('id, apartment_id, user_id, content, created_at')
      .eq('apartment_id', id)
      .order('created_at', { ascending: true })

    if (rd && rd.length > 0) {
      const remarkUserIds = [...new Set(rd.map((r) => r.user_id))]
      const { data: remarkProfiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', remarkUserIds)

      const remarkProfilesMap = Object.fromEntries(
        (remarkProfiles ?? []).map((p) => [p.user_id, { full_name: p.full_name, avatar_url: p.avatar_url }])
      )

      remarks = rd.map((r) => ({
        ...r,
        profiles: remarkProfilesMap[r.user_id] ?? null,
      })) as RemarkWithProfile[]
    }
  } catch {
    // table not migrated yet
  }

  // 4. Current user
  const { data: { user } } = await supabase.auth.getUser()

  const apartment = data as unknown as {
    id: string
    team_id: string
    title: string
    price: number
    surface: number
    rooms: number | null
    charges: number | null
    photo_url: string | null
    status: string
    is_furnished: boolean
    terrace: boolean
    parking: boolean
    url: string | null
    address: string | null
    latitude: number | null
    longitude: number | null
    is_archived: boolean
    created_by: string | null
    created_at: string
  }

  const userRating = ratings.find((r) => r.user_id === user?.id)

  const averageRating = ratings.length > 0
    ? ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length
    : null

  const pricePerM2 = Math.round(apartment.price / apartment.surface)

  const apartmentForEdit: ApartmentWithRatings = {
    id: apartment.id,
    team_id: apartment.team_id,
    title: apartment.title,
    price: apartment.price,
    surface: apartment.surface,
    is_furnished: apartment.is_furnished,
    terrace: apartment.terrace ?? false,
    parking: apartment.parking ?? false,
    rooms: apartment.rooms ?? null,
    charges: apartment.charges ?? null,
    url: apartment.url,
    address: apartment.address,
    latitude: apartment.latitude,
    longitude: apartment.longitude,
    is_archived: apartment.is_archived,
    created_by: apartment.created_by,
    created_at: apartment.created_at,
    photo_url: apartment.photo_url ?? null,
    status: (apartment.status as ApartmentWithRatings['status']) ?? 'to_visit',
    ratings: [],
    average_rating: averageRating ?? undefined,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-2xl font-bold truncate">{apartment.title}</h1>
            <StatusBadge status={(apartment.status as ApartmentStatus) ?? 'to_visit'} />
            {apartment.is_archived && (
              <Badge variant="secondary" className="shrink-0">Archivé</Badge>
            )}
          </div>
          {apartment.address && (
            <p className="text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-4 w-4" />
              {apartment.address}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <EditApartmentButton apartment={apartmentForEdit} />
          {apartment.url && (
            <Button variant="outline" asChild>
              <a href={apartment.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Voir l&apos;annonce
              </a>
            </Button>
          )}
        </div>
      </div>

      {apartment.photo_url && (
        <div className="relative h-64 w-full overflow-hidden rounded-xl border">
          <Image
            src={apartment.photo_url}
            alt={apartment.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 1200px"
            priority
          />
        </div>
      )}

      <StatusSelector
        apartmentId={apartment.id}
        current={(apartment.status as ApartmentStatus) ?? 'to_visit'}
      />

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground">Prix</p>
                  <p className="text-2xl font-bold">
                    {apartment.price.toLocaleString('fr-FR')} €
                    <span className="text-sm font-normal text-muted-foreground">/mois</span>
                  </p>
                  {apartment.charges && (
                    <p className="text-sm text-muted-foreground">+ {apartment.charges} € de charges</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Surface</p>
                  <p className="text-2xl font-bold">{apartment.surface} m²</p>
                  {apartment.rooms && (
                    <p className="text-sm text-muted-foreground">{apartment.rooms} pièce{apartment.rooms > 1 ? 's' : ''}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Prix au m²</p>
                  <p className="text-lg font-semibold">{pricePerM2} €/m²</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="text-lg font-semibold">
                    {apartment.is_furnished ? 'Meublé' : 'Non meublé'}
                  </p>
                </div>
                {apartment.terrace && (
                  <div>
                    <p className="text-sm text-muted-foreground">Terrasse</p>
                    <p className="text-lg font-semibold flex items-center gap-1 text-green-600">
                      <Trees className="h-4 w-4" />
                      Oui
                    </p>
                  </div>
                )}
                {apartment.parking && (
                  <div>
                    <p className="text-sm text-muted-foreground">Parking</p>
                    <p className="text-lg font-semibold flex items-center gap-1 text-blue-600">
                      <ParkingSquare className="h-4 w-4" />
                      Oui
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Avis de l&apos;équipe</CardTitle>
                {averageRating && (
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-xl font-bold">{averageRating.toFixed(1)}</span>
                    <span className="text-muted-foreground">
                      ({ratings.length} avis)
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <RatingsList ratings={ratings} currentUserId={user?.id} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Remarques de l&apos;équipe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RemarksList remarks={remarks} currentUserId={user?.id} apartmentId={id} />
              <Separator />
              <RemarkForm apartmentId={id} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Votre avis</CardTitle>
            </CardHeader>
            <CardContent>
              <RatingForm
                apartmentId={apartment.id}
                existingRating={userRating ? {
                  score: userRating.score,
                  comment: userRating.comment,
                } : undefined}
              />
            </CardContent>
          </Card>

          {apartment.latitude && apartment.longitude && (
            <Card>
              <CardHeader>
                <CardTitle>Localisation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-square rounded-lg border bg-muted flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">
                    Carte en cours d&apos;intégration...
                  </p>
                </div>
                <Separator className="my-4" />
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Lat: {apartment.latitude}</p>
                  <p>Lng: {apartment.longitude}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
