import React from 'react'

const DAYS_KEY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

function parseTime(str) {
  if (!str) return null
  const [h, m] = String(str).trim().split(':').map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null
  return h * 60 + m
}

function parseSlots(hoursStr) {
  if (!hoursStr) return []

  // Accept both clean punctuation and legacy mojibake separators from seeded data.
  return String(hoursStr)
    .split(/\s*(?:·|Â·)\s*/)
    .map(slot => {
      const [openStr, closeStr] = slot.split(/\s*(?:–|-|â€“)\s*/)
      const open = parseTime(openStr)
      let close = parseTime(closeStr)
      if (open == null || close == null) return null
      if (close <= open) close += 1440
      return { open, close }
    })
    .filter(Boolean)
}

function fmtDuration(min) {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h}h`
  return `${h}h${String(m).padStart(2, '0')}`
}

function fmtTime(min) {
  const h = Math.floor((min % 1440) / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function getBarStatus(bar, now = new Date()) {
  if (!bar?.hours) return { openNow: false, opensIn: 'Horaires indisponibles' }

  const todayIdx = now.getDay()
  const nowMin = now.getHours() * 60 + now.getMinutes()

  const yestIdx = (todayIdx - 1 + 7) % 7
  for (const slot of parseSlots(bar.hours[DAYS_KEY[yestIdx]])) {
    if (slot.close > 1440 && nowMin < slot.close - 1440) {
      const closesMin = slot.close - 1440
      return { openNow: true, closesIn: fmtDuration(closesMin - nowMin), closesAt: fmtTime(closesMin) }
    }
  }

  for (const slot of parseSlots(bar.hours[DAYS_KEY[todayIdx]])) {
    if (nowMin >= slot.open && nowMin < slot.close) {
      return { openNow: true, closesIn: fmtDuration(slot.close - nowMin), closesAt: fmtTime(slot.close) }
    }
    if (nowMin < slot.open) {
      return { openNow: false, opensIn: `Aujourd'hui ${fmtTime(slot.open)}` }
    }
  }

  for (let i = 1; i <= 6; i++) {
    const nextIdx = (todayIdx + i) % 7
    const slots = parseSlots(bar.hours[DAYS_KEY[nextIdx]])
    if (slots.length > 0) {
      return { openNow: false, opensIn: `${i === 1 ? 'Demain' : DAYS_FR[nextIdx]} ${fmtTime(slots[0].open)}` }
    }
  }

  return { openNow: false, opensIn: 'Fermé' }
}

export function useCurrentTime() {
  const [now, setNow] = React.useState(() => new Date())

  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  return now
}
