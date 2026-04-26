const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const INSTAGRAM_APP_ID = '936619743392459'

const BARS = [
  {
    id: 'ostal',
    name: "L'Ostal",
    instagram: 'lostalbruz',
    websites: ['https://www.lostal-bar.fr/'],
  },
  {
    id: 'pignom',
    name: 'Le Pignom',
    instagram: 'lepignom_bruz',
    websites: ['https://www.lepignombruz.com/agenda'],
  },
  {
    id: 'arriere-cour',
    name: "L'Arriere-Cour",
    instagram: 'larriere_cour.bruz',
    extraInstagram: ['brunch_larriere_cour'],
    websites: ['https://larrierecour-bruz.com/', 'https://brunch.larrierecour-bruz.com/'],
  },
]

const MONTHS = new Map([
  ['janvier', 0],
  ['fevrier', 1],
  ['février', 1],
  ['mars', 2],
  ['avril', 3],
  ['mai', 4],
  ['juin', 5],
  ['juillet', 6],
  ['aout', 7],
  ['août', 7],
  ['septembre', 8],
  ['octobre', 9],
  ['novembre', 10],
  ['decembre', 11],
  ['décembre', 11],
])

const WEEKDAY_LABELS = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.']
const MONTH_LABELS = [
  'janvier',
  'fevrier',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'aout',
  'septembre',
  'octobre',
  'novembre',
  'decembre',
]

function log(message) {
  console.log(`[refresh-events] ${message}`)
}

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function slugify(value) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

function isoDateInParis(date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function parisParts(date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris',
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .formatToParts(date)
    .reduce((acc, part) => {
      acc[part.type] = part.value
      return acc
    }, {})

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  }
}

function zonedDateToUtcIso(year, month, day, hour, minute) {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0))
  const actual = parisParts(utcGuess)
  const diffMinutes =
    (Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute) -
      Date.UTC(year, month - 1, day, hour, minute)) /
    60000
  return new Date(utcGuess.getTime() - diffMinutes * 60000).toISOString()
}

function frenchDateLabel(date) {
  const local = parisParts(date)
  const localDate = new Date(Date.UTC(local.year, local.month - 1, local.day))
  const weekday = WEEKDAY_LABELS[localDate.getUTCDay()]
  const day = local.day === 1 ? '1er' : String(local.day)
  return `${weekday} ${day} ${MONTH_LABELS[local.month - 1]}`
}

function timeLabel(date) {
  const local = parisParts(date)
  return `${String(local.hour).padStart(2, '0')}:${String(local.minute).padStart(2, '0')}`
}

function nextWeekdayAt(reference, weekday, hour, minute) {
  const parts = parisParts(reference)
  const todayUtc = Date.UTC(parts.year, parts.month - 1, parts.day)
  const todayWeekday = new Date(todayUtc).getUTCDay()
  let daysToAdd = (weekday - todayWeekday + 7) % 7
  if (daysToAdd === 0 && (parts.hour > hour || (parts.hour === hour && parts.minute >= minute))) {
    daysToAdd = 7
  }

  const target = new Date(todayUtc + daysToAdd * 86400000)
  return new Date(zonedDateToUtcIso(
    target.getUTCFullYear(),
    target.getUTCMonth() + 1,
    target.getUTCDate(),
    hour,
    minute,
  ))
}

function inferTitle(text) {
  const normalized = normalizeText(text)
  if (normalized.includes('ambiance latine')) return 'Ambiance latine'
  if (normalized.includes('poker') || normalized.includes('redcactus')) return 'Soiree poker RedCactus'
  if (normalized.includes('stand-up') || normalized.includes('comedy')) return 'Plateau stand-up'
  if (normalized.includes('concert')) return 'Concert'
  if (normalized.includes('tournoi')) return 'Tournoi'
  if (normalized.includes('brunch')) return 'Brunch du moment'
  return 'Evenement du bar'
}

function inferTag(text) {
  const normalized = normalizeText(text)
  if (normalized.includes('brunch')) return 'Brunch'
  if (normalized.includes('concert')) return 'Musique'
  if (normalized.includes('poker') || normalized.includes('tournoi')) return 'Jeu'
  if (normalized.includes('stand-up') || normalized.includes('comedy')) return 'Spectacle'
  return 'Soiree'
}

function inferPrice(text) {
  const normalized = normalizeText(text)
  if (normalized.includes('gratuit')) return 'Gratuit'
  const cocktailMatch = text.match(/cocktails?.{0,20}?(\d+)\s*€/i)
  const mocktailMatch = text.match(/mocktails?.{0,20}?(\d+)\s*€/i)
  if (cocktailMatch && mocktailMatch) {
    return `Cocktails ${cocktailMatch[1]}€ / mocktails ${mocktailMatch[1]}€`
  }
  const priceMatch = text.match(/(\d+\s*(?:€|eur))/i)
  return priceMatch ? priceMatch[1].replace(/\s+/g, '') : null
}

function extractExplicitEvents(bar, post, reference) {
  const text = post.caption ?? ''
  const normalized = normalizeText(text)
  const events = []
  const regex = /(?:^|\D)(\d{1,2})(?:er)?\s+(janvier|février|fevrier|mars|avril|mai|juin|juillet|août|aout|septembre|octobre|novembre|décembre|decembre)(?:[^0-9]{0,80}?(\d{1,2})(?:h|:)(\d{2})?)?/gi
  let match

  while ((match = regex.exec(text)) !== null) {
    const day = Number(match[1])
    const monthIndex = MONTHS.get(match[2].toLowerCase())
    if (!Number.isInteger(day) || monthIndex == null) continue

    const refParts = parisParts(reference)
    let year = refParts.year
    let hour = match[3] ? Number(match[3]) : 20
    let minute = match[4] ? Number(match[4]) : 0

    if (normalized.includes('midi') && !match[3]) hour = 12
    if (normalized.includes('brunch') && !match[3]) hour = 11

    let startsAt = new Date(zonedDateToUtcIso(year, monthIndex + 1, day, hour, minute))
    if (startsAt < reference && monthIndex < refParts.month - 1) {
      year += 1
      startsAt = new Date(zonedDateToUtcIso(year, monthIndex + 1, day, hour, minute))
    }
    if (startsAt < reference) continue

    const title = inferTitle(text)
    events.push({
      id: `social-${bar.id}-${slugify(title)}-${isoDateInParis(startsAt)}`,
      bar_id: bar.id,
      title,
      date: frenchDateLabel(startsAt),
      time: timeLabel(startsAt),
      price: inferPrice(text) ?? 'Voir annonce',
      tag: inferTag(text),
      starts_at: startsAt.toISOString(),
      description: `Source Instagram @${post.username}, post du ${isoDateInParis(post.takenAt)}: ${text.replace(/\s+/g, ' ').trim().slice(0, 420)}`,
    })
  }

  return events
}

function extractRecurringEvents(bar, posts, websiteOk, reference) {
  const events = []
  const combined = posts.map(post => post.caption ?? '').join('\n')
  const normalized = normalizeText(combined)

  if (bar.id === 'ostal' && normalized.includes('tous les vendredis') && normalized.includes('poker')) {
    const startsAt = nextWeekdayAt(reference, 5, 20, 0)
    events.push({
      id: `social-ostal-poker-${isoDateInParis(startsAt)}`,
      bar_id: 'ostal',
      title: 'Soiree poker RedCactus',
      date: frenchDateLabel(startsAt),
      time: timeLabel(startsAt),
      price: 'Gratuit',
      tag: 'Jeu',
      starts_at: startsAt.toISOString(),
      description: "Annonce Instagram RedCactus/L'Ostal: tournoi poker gratuit tous les vendredis a 20h, inscription via RedCactus Poker.",
    })
  }

  if (bar.id === 'arriere-cour' && (websiteOk || normalized.includes('brunch'))) {
    const startsAt = nextWeekdayAt(reference, 0, 11, 0)
    events.push({
      id: `social-arriere-cour-brunch-${isoDateInParis(startsAt)}`,
      bar_id: 'arriere-cour',
      title: 'Brunch du moment',
      date: frenchDateLabel(startsAt),
      time: timeLabel(startsAt),
      price: 'Sur reservation',
      tag: 'Brunch',
      starts_at: startsAt.toISOString(),
      description: "Brunch par L'Arriere-Cour: service dominical sur place ou a emporter, reservation via le site brunch officiel.",
    })
  }

  return events
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; BarsABruzRefresh/1.0)',
      accept: 'application/json,text/html;q=0.9,*/*;q=0.8',
      ...(options.headers ?? {}),
    },
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

async function fetchInstagramPosts(username) {
  const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`
  const json = await fetchJson(url, {
    headers: {
      'x-ig-app-id': INSTAGRAM_APP_ID,
    },
  })
  const edges = json?.data?.user?.edge_owner_to_timeline_media?.edges ?? []
  return edges.slice(0, 12).map(edge => {
    const node = edge.node
    return {
      username,
      shortcode: node.shortcode,
      takenAt: new Date((node.taken_at_timestamp ?? 0) * 1000),
      caption: node.edge_media_to_caption?.edges?.[0]?.node?.text ?? '',
      location: node.location?.name ?? '',
    }
  })
}

async function checkWebsite(url) {
  const response = await fetch(url, {
    headers: { 'user-agent': 'Mozilla/5.0 (compatible; BarsABruzRefresh/1.0)' },
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const text = await response.text()
  return text.slice(0, 200000)
}

async function supabaseFetch(path, options = {}) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  const response = await fetch(`${SUPABASE_URL.replace(/\/$/, '')}${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      authorization: `Bearer ${SUPABASE_KEY}`,
      'content-type': 'application/json',
      ...(options.headers ?? {}),
    },
  })
  const text = await response.text()
  if (!response.ok) {
    throw new Error(`Supabase ${response.status}: ${text}`)
  }
  return text ? JSON.parse(text) : null
}

async function getExistingEvents() {
  return supabaseFetch('/rest/v1/events?select=id,attending,starts_at')
}

async function cleanupExpiredEvents() {
  try {
    await supabaseFetch('/rest/v1/rpc/cleanup_expired_agenda_items', {
      method: 'POST',
      body: JSON.stringify({}),
    })
  } catch (error) {
    log(`Cleanup skipped: ${error.message}`)
  }
}

async function upsertEvents(events, existingById) {
  if (!events.length) return []
  const rows = events.map(event => ({
    ...event,
    attending: existingById.get(event.id)?.attending ?? 0,
  }))

  return supabaseFetch('/rest/v1/events?on_conflict=id', {
    method: 'POST',
    headers: {
      prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(rows),
  })
}

function dedupeEvents(events) {
  const byId = new Map()
  for (const event of events) {
    if (!byId.has(event.id)) byId.set(event.id, event)
  }
  return [...byId.values()].sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))
}

function shouldRunForParisHour() {
  const requiredHour = process.argv.includes('--require-paris-9')
  if (!requiredHour) return true
  const parts = parisParts(new Date())
  return parts.hour === 9
}

async function main() {
  if (!shouldRunForParisHour()) {
    log('Skipping: current Europe/Paris hour is not 09:00.')
    return
  }

  const reference = new Date()
  const collected = []
  const checked = []
  const skipped = []

  for (const bar of BARS) {
    const posts = []
    const usernames = [bar.instagram, ...(bar.extraInstagram ?? [])]
    for (const username of usernames) {
      try {
        const accountPosts = await fetchInstagramPosts(username)
        posts.push(...accountPosts)
        checked.push(`Instagram @${username}`)
      } catch (error) {
        skipped.push(`Instagram @${username}: ${error.message}`)
      }
    }

    let websiteOk = false
    for (const url of bar.websites) {
      try {
        const html = await checkWebsite(url)
        websiteOk = websiteOk || normalizeText(html).includes('brunch')
        checked.push(url)
      } catch (error) {
        skipped.push(`${url}: ${error.message}`)
      }
    }

    for (const post of posts) {
      collected.push(...extractExplicitEvents(bar, post, reference))
    }
    collected.push(...extractRecurringEvents(bar, posts, websiteOk, reference))
  }

  const events = dedupeEvents(collected).filter(event => new Date(event.starts_at) >= reference)
  if (!events.length) {
    log('No reliable future events found. Supabase was not modified.')
    log(`Sources checked: ${checked.join(', ') || 'none'}`)
    if (skipped.length) log(`Skipped sources: ${skipped.join(' | ')}`)
    return
  }

  const existing = await getExistingEvents()
  const existingById = new Map((existing ?? []).map(event => [event.id, event]))
  await cleanupExpiredEvents()
  const upserted = await upsertEvents(events, existingById)

  log(`Sources checked: ${checked.join(', ') || 'none'}`)
  if (skipped.length) log(`Skipped sources: ${skipped.join(' | ')}`)
  log(`Upserted ${upserted?.length ?? events.length} event(s):`)
  for (const event of events) {
    const action = existingById.has(event.id) ? 'updated' : 'added'
    log(`- ${action}: ${event.title} (${event.bar_id}) ${event.date} ${event.time}`)
  }
}

main().catch(error => {
  console.error(error)
  process.exit(1)
})
