'use server'

export interface ScrapedListing {
  title?: string
  price?: number
  surface?: number
  rooms?: number
  charges?: number
  address?: string
  latitude?: number
  longitude?: number
  photoUrl?: string
  isFurnished?: boolean
  hasTerrace?: boolean
  hasParking?: boolean
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

async function geocodePhoton(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=1&lang=fr`,
    )
    if (!res.ok) return null
    const json = await res.json()
    const coords = json.features?.[0]?.geometry?.coordinates
    if (coords?.length === 2) return { lng: coords[0], lat: coords[1] }
  } catch { /* ignore */ }
  return null
}

function parseEuro(str: string): number | undefined {
  const n = parseFloat(str.replace(/\s/g, '').replace(',', '.').replace(/[^\d.]/g, ''))
  return isNaN(n) || n <= 0 ? undefined : n
}

// ─── SeLoger ──────────────────────────────────────────────────────────────────
// window["__UFRN_LIFECYCLE_SERVERREQUEST__"] = JSON.parse("...")
// └── app_cldp.data.classified.sections
//     ├── mainDescription.headline          → title
//     ├── hardFacts.price.value             → "900 €"  → price
//     ├── hardFacts.facts[type=livingSpace] → surface
//     ├── location.geometry.coordinates     → [lng, lat]
//     ├── location.address                  → { zipCode, city, district }
//     ├── gallery.images[0].url             → photo
//     └── features.preview[].icon           → furnished / terrace / parking
// ─────────────────────────────────────────────────────────────────────────────

interface SeLogerSections {
  mainDescription?: { headline?: string }
  hardFacts?: {
    price?: { value?: string }
    facts?: { type: string; splitValue?: string }[]
  }
  price?: {
    base?: {
      details?: { value?: { main?: { ariaLabel?: string } } }[]
    }
  }
  location?: {
    geometry?: { coordinates?: [number, number] }
    address?: { zipCode?: string; city?: string; district?: string }
  }
  gallery?: { images?: { url: string }[] }
  features?: { preview?: { icon: string; value: string }[] }
}

function extractFromSeLogerSections(sections: SeLogerSections): ScrapedListing {
  const result: ScrapedListing = {}

  if (sections.mainDescription?.headline) {
    result.title = sections.mainDescription.headline
  }

  const rawPrice = sections.hardFacts?.price?.value
  if (rawPrice) result.price = parseEuro(rawPrice)

  const livingSpace = sections.hardFacts?.facts?.find((f) => f.type === 'livingSpace')
  if (livingSpace?.splitValue) {
    const n = parseFloat(livingSpace.splitValue.replace(',', '.'))
    if (!isNaN(n) && n > 0) result.surface = n
  }

  const coords = sections.location?.geometry?.coordinates
  if (coords?.length === 2) {
    result.longitude = coords[0]
    result.latitude = coords[1]
  }

  const addr = sections.location?.address
  if (addr) {
    const parts = [
      addr.district,
      addr.zipCode && addr.city ? `${addr.zipCode} ${addr.city}` : addr.city,
    ].filter(Boolean)
    if (parts.length > 0) result.address = parts.join(', ')
  }

  const firstImage = sections.gallery?.images?.[0]?.url
  if (firstImage) result.photoUrl = firstImage

  const roomsFact = sections.hardFacts?.facts?.find((f) => f.type === 'numberOfRooms')
  if (roomsFact?.splitValue) {
    const n = parseInt(roomsFact.splitValue)
    if (!isNaN(n) && n > 0) result.rooms = n
  }

  const chargesRaw = sections.price?.base?.details?.[0]?.value?.main?.ariaLabel
  if (chargesRaw) result.charges = parseEuro(chargesRaw)

  const preview = sections.features?.preview ?? []
  const furnishedFeature = preview.find((f) => f.icon === 'furnished')
  if (furnishedFeature) {
    result.isFurnished = !furnishedFeature.value.toLowerCase().startsWith('non')
  }
  result.hasTerrace = preview.some((f) => ['terrace', 'balcony'].includes(f.icon))
  result.hasParking = preview.some((f) => ['parking', 'garage', 'parking-space'].includes(f.icon))

  return result
}

function parseSeLogerHtml(html: string): ScrapedListing {
  const match = html.match(
    /window\["__UFRN_LIFECYCLE_SERVERREQUEST__"\]=JSON\.parse\("([\s\S]*?)"\);/
  )
  if (match) {
    try {
      const jsonStr = JSON.parse('"' + match[1] + '"') as string
      const data = JSON.parse(jsonStr)
      const sections: SeLogerSections = data?.app_cldp?.data?.classified?.sections
      if (sections) return extractFromSeLogerSections(sections)
    } catch { /* fall through */ }
  }

  // Fallback: og meta tags
  const result: ScrapedListing = {}
  const titleMatch = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/)
  if (titleMatch) result.title = titleMatch[1]
  const imageMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/)
  if (imageMatch) result.photoUrl = imageMatch[1]
  return result
}

// ─── LeBonCoin ────────────────────────────────────────────────────────────────
// Data is in the server-rendered HTML.
// Criteria items:  data-qa-id="criteria_item_*" → <p title="VALUE">VALUE</p>
// Price detail:    "Loyer hors charges" → xxx €/mois
//                  "Charges locatives"  → yyy €/mois
// Location:        aria-label="CITY ZIP, Quartier ..." href="...#map"
// Photo:           <meta property="og:image" content="...">
// ─────────────────────────────────────────────────────────────────────────────

function getLbcCriteria(html: string, id: string): string | undefined {
  // Each criteria block: data-qa-id="criteria_item_X" ... <p title="VALUE">VALUE</p>
  const re = new RegExp(
    `data-qa-id="${id}"[\\s\\S]{0,3000}?<p[^>]+title="([^"]+)"[^>]*>\\1<\\/p>`
  )
  return html.match(re)?.[1]
}

async function parseLeBonCoinHtml(html: string): Promise<ScrapedListing> {
  const result: ScrapedListing = {}

  // Title
  const titleM = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/)
  if (titleM) result.title = titleM[1]

  // Price: prefer "Loyer hors charges", fallback to adview_price
  const hcM = html.match(/Loyer hors charges<\/p><p[^>]*>([^<]*€[^<]*)<\/p>/)
  if (hcM) {
    result.price = parseEuro(hcM[1])
  } else {
    const priceM = html.match(/data-qa-id="adview_price"[\s\S]{0,500}?<p[^>]*>([\d\s]+)&nbsp;€<\/p>/)
    if (priceM) result.price = parseEuro(priceM[1])
  }

  // Charges locatives
  const chargesM = html.match(/Charges locatives<\/p><p[^>]*>([^<]*€[^<]*)<\/p>/)
  if (chargesM) result.charges = parseEuro(chargesM[1])

  // Surface — "28 m²" → 28
  const surfaceRaw = getLbcCriteria(html, 'criteria_item_square')
  if (surfaceRaw) {
    const n = parseFloat(surfaceRaw.replace(',', '.').replace(/[^\d.]/g, ''))
    if (!isNaN(n) && n > 0) result.surface = n
  }

  // Rooms
  const roomsRaw = getLbcCriteria(html, 'criteria_item_rooms')
  if (roomsRaw) {
    const n = parseInt(roomsRaw)
    if (!isNaN(n) && n > 0) result.rooms = n
  }

  // Furnished — "Meublé" | "Non meublé"
  const furnishedRaw = getLbcCriteria(html, 'criteria_item_furnished')
  if (furnishedRaw) {
    result.isFurnished = furnishedRaw.toLowerCase().startsWith('meublé')
  }

  // Specificities — may contain "Terrasse", "Balcon", "Parking", "Garage"
  const specs = getLbcCriteria(html, 'criteria_item_specificities') ?? ''
  result.hasTerrace = /terrasse|balcon/i.test(specs)
  result.hasParking = /parking|garage/i.test(specs)

  // Photo — og:image, upgrade to better quality rule
  const imgM = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/)
  if (imgM) {
    result.photoUrl = imgM[1].replace(/\?rule=[^"&]+/, '?rule=classified-1200x800-jpg')
  }

  // Address — from the map anchor aria-label
  const addrM = html.match(/aria-label="([^"]+)"\s+href="[^"]+#map"/)
  if (addrM) {
    // e.g. "Toulouse 31300, Quartier Fontaine Bayonne-Cartoucherie" → "Toulouse 31300"
    result.address = addrM[1].replace(/,\s*Quartier.*$/i, '').trim()
  }

  // Geocode address → lat/lng via Photon
  if (result.address) {
    const geo = await geocodePhoton(result.address)
    if (geo) {
      result.latitude = geo.lat
      result.longitude = geo.lng
    }
  }

  return result
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function scrapeSeLoger(
  url: string
): Promise<{ data?: ScrapedListing; error?: string }> {
  if (!url.includes('seloger.com')) {
    return { error: 'URL invalide — seloger.com uniquement' }
  }
  let html: string
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9',
        'Cache-Control': 'no-cache',
      },
    })
    if (!res.ok) return { error: `SeLoger a bloqué la requête (HTTP ${res.status})` }
    html = await res.text()
  } catch {
    return { error: 'Impossible de joindre SeLoger' }
  }
  const data = parseSeLogerHtml(html)
  if (Object.keys(data).length === 0) {
    return { error: 'Aucune donnée extraite — SeLoger a probablement bloqué la requête' }
  }
  return { data }
}

export async function scrapeLeBonCoin(
  url: string
): Promise<{ data?: ScrapedListing; error?: string }> {
  if (!url.includes('leboncoin.fr')) {
    return { error: 'URL invalide — leboncoin.fr uniquement' }
  }
  let html: string
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9',
        'Cache-Control': 'no-cache',
      },
    })
    if (!res.ok) return { error: `LeBonCoin a bloqué la requête (HTTP ${res.status})` }
    html = await res.text()
  } catch {
    return { error: 'Impossible de joindre LeBonCoin' }
  }
  const data = await parseLeBonCoinHtml(html)
  if (Object.keys(data).length === 0) {
    return { error: 'Aucune donnée extraite' }
  }
  return { data }
}

/** Unified scraper — auto-detects the site from the URL */
export async function scrapeApartment(
  url: string
): Promise<{ data?: ScrapedListing; error?: string }> {
  if (url.includes('seloger.com')) return scrapeSeLoger(url)
  if (url.includes('leboncoin.fr')) return scrapeLeBonCoin(url)
  return { error: 'Site non supporté — utilisez seloger.com ou leboncoin.fr' }
}
