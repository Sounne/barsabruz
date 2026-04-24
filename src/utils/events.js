const MONTHS = {
  janvier: 0,
  fevrier: 1,
  février: 1,
  mars: 2,
  avril: 3,
  mai: 4,
  juin: 5,
  juillet: 6,
  aout: 7,
  août: 7,
  septembre: 8,
  octobre: 9,
  novembre: 10,
  decembre: 11,
  décembre: 11,
}

const DEFAULT_TAG_ORDER = ['Live', 'Quiz', 'Sport', 'Dégustation', 'Musique', 'Événement']

function toNumber(value, fallback = 0) {
  const num = Number(value)
  return Number.isFinite(num) ? num : fallback
}

function parseTimeParts(value) {
  const match = String(value ?? '').match(/(\d{1,2})[:h](\d{2})/)
  if (!match) return { hours: 20, minutes: 0 }
  return {
    hours: Number(match[1]),
    minutes: Number(match[2]),
  }
}

function parseFrenchDateLabel(label, referenceDate) {
  const match = String(label ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .match(/(\d{1,2})(?:er)?\s+([a-z]+)/)

  if (!match) return null

  const day = Number(match[1])
  const monthIndex = MONTHS[match[2]]
  if (!Number.isInteger(day) || monthIndex == null) return null

  const currentYear = referenceDate.getFullYear()
  const candidate = new Date(currentYear, monthIndex, day)
  const yesterday = new Date(referenceDate)
  yesterday.setHours(0, 0, 0, 0)
  yesterday.setDate(yesterday.getDate() - 1)

  if (candidate < yesterday && monthIndex < referenceDate.getMonth()) {
    candidate.setFullYear(currentYear + 1)
  }

  return candidate
}

function resolveStartDate(event, referenceDate) {
  const directValue = event?.startsAt ?? event?.starts_at ?? event?.datetime ?? event?.date_time ?? event?.date
  if (directValue) {
    const directDate = new Date(directValue)
    if (!Number.isNaN(directDate.getTime())) return directDate
  }

  const parsedDate = parseFrenchDateLabel(event?.date ?? event?.date_label ?? event?.dateLabel, referenceDate)
  if (!parsedDate) return null

  const { hours, minutes } = parseTimeParts(event?.time ?? event?.time_label ?? event?.timeLabel)
  parsedDate.setHours(hours, minutes, 0, 0)
  return parsedDate
}

export function normalizeBarEvent(event, bar, referenceDate = new Date()) {
  const startsAt = resolveStartDate(event, referenceDate)
  return {
    ...event,
    id: event?.id ?? `${bar?.id ?? 'bar'}-${event?.title ?? 'event'}`,
    title: event?.title ?? 'Soirée du bar',
    date: event?.date ?? event?.date_label ?? event?.dateLabel ?? '',
    time: event?.time ?? event?.time_label ?? event?.timeLabel ?? '',
    price: event?.price ?? event?.price_label ?? event?.priceLabel ?? 'Gratuit',
    tag: event?.tag ?? event?.category ?? event?.type ?? 'Événement',
    attending: toNumber(event?.attending ?? event?.interested_count ?? event?.interestedCount, 0),
    startsAt,
    startsAtTs: startsAt?.getTime?.() ?? Number.POSITIVE_INFINITY,
    bar,
  }
}

export function getBarEvents(bars, { includePast = false, referenceDate = new Date() } = {}) {
  const now = new Date(referenceDate)
  return (bars ?? [])
    .flatMap(bar => (bar?.events ?? []).map(event => normalizeBarEvent(event, bar, now)))
    .filter(event => event.startsAt || includePast)
    .filter(event => includePast || event.startsAtTs >= now.getTime())
    .sort((a, b) => a.startsAtTs - b.startsAtTs || String(a.title).localeCompare(String(b.title), 'fr'))
}

export function groupEventsByDate(events) {
  return events.reduce((groups, event) => {
    const key = event.date || 'À venir'
    if (!groups[key]) groups[key] = []
    groups[key].push(event)
    return groups
  }, {})
}

export function getEventTags(events) {
  const tags = [...new Set(events.map(event => event.tag).filter(Boolean))]
  return [
    'all',
    ...DEFAULT_TAG_ORDER.filter(tag => tags.includes(tag)),
    ...tags.filter(tag => !DEFAULT_TAG_ORDER.includes(tag)).sort((a, b) => a.localeCompare(b, 'fr')),
  ]
}
