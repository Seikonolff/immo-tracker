import { BookmarkletSection } from '@/components/settings/BookmarkletSection'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookMarked, MousePointer, ClipboardList, CheckCircle } from 'lucide-react'

const STEPS = [
  {
    icon: BookMarked,
    title: 'Installer le bookmarklet',
    description:
      'Affichez votre barre de favoris Chrome avec ⌘ Shift B, puis glissez le bouton "Importer dans Immo Tracker" dans la barre.',
  },
  {
    icon: MousePointer,
    title: 'Ouvrir une annonce',
    description:
      'Naviguez vers une annonce sur seLoger.com ou leboncoin.fr et attendez que la page soit complètement chargée.',
  },
  {
    icon: ClipboardList,
    title: 'Cliquer sur le bookmarklet',
    description:
      "Cliquez sur le bouton dans votre barre de favoris. Un nouvel onglet s'ouvre avec le formulaire pré-rempli.",
  },
  {
    icon: CheckCircle,
    title: 'Vérifier et enregistrer',
    description:
      'Vérifiez les données extraites, complétez les champs manquants si besoin, puis cliquez sur Ajouter.',
  },
]

const FIELDS = {
  seLoger: [
    { field: 'Titre', source: 'Balise og:title' },
    { field: 'Prix', source: 'Parsé depuis og:title (regex €)' },
    { field: 'Surface', source: 'Parsé depuis og:title (regex m²)' },
    { field: 'Pièces', source: 'Parsé depuis meta description (regex pièces)' },
    { field: 'Adresse', source: 'Parsé depuis og:title (après le €)' },
    { field: 'Photo', source: 'Balise og:image' },
    { field: 'Lien', source: 'Balise og:url' },
  ],
  leboncoin: [
    { field: 'Titre', source: '__NEXT_DATA__ → ad.subject' },
    { field: 'Prix', source: '__NEXT_DATA__ → ad.price[0]' },
    { field: 'Surface', source: '__NEXT_DATA__ → attributes.square' },
    { field: 'Pièces', source: '__NEXT_DATA__ → attributes.rooms' },
    { field: 'Charges', source: '__NEXT_DATA__ → attributes.monthly_charges' },
    { field: 'Meublé', source: '__NEXT_DATA__ → attributes.furnished' },
    { field: 'Coordonnées GPS', source: '__NEXT_DATA__ → location.lat / lng' },
    { field: 'Photo', source: '__NEXT_DATA__ → images.urls[0]' },
    { field: 'Lien', source: '__NEXT_DATA__ → ad.url' },
  ],
}

export default function GuidePage() {
  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Guide d&apos;import</h1>
        <p className="text-muted-foreground mt-1">
          Importez une annonce depuis seLoger ou Leboncoin en un clic grâce au bookmarklet.
        </p>
      </div>

      {/* Bookmarklet */}
      <BookmarkletSection />

      {/* Steps */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Comment ça marche</h2>
        <div className="grid gap-3">
          {STEPS.map((step, i) => (
            <div key={i} className="flex gap-4 items-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                {i + 1}
              </div>
              <div className="pt-1">
                <div className="flex items-center gap-2 font-medium">
                  <step.icon className="h-4 w-4 text-muted-foreground" />
                  {step.title}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fields extracted per site */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Données extraites automatiquement</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">seLoger</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-1.5">
                {FIELDS.seLoger.map(({ field, source }) => (
                  <li key={field} className="text-sm flex flex-col">
                    <span className="font-medium">{field}</span>
                    <span className="text-xs text-muted-foreground">{source}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Leboncoin</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-1.5">
                {FIELDS.leboncoin.map(({ field, source }) => (
                  <li key={field} className="text-sm flex flex-col">
                    <span className="font-medium">{field}</span>
                    <span className="text-xs text-muted-foreground">{source}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
