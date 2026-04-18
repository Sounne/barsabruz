import { supabase } from '../lib/supabase'

// Image map: bar id → local asset (images stay local)
import ostalImg from '../assets/bars/ostal.jpg'
import pignomImg from '../assets/bars/pignom.jpg'
import arriereCourtImg from '../assets/bars/arriere-cour.jpg'

const BAR_IMAGES = {
  ostal: ostalImg,
  pignom: pignomImg,
  'arriere-cour': arriereCourtImg,
}

export async function fetchBars() {
  const { data: bars, error: barsError } = await supabase
    .from('bars')
    .select('*, events(*)')
    .order('name')

  if (barsError) throw barsError

  return bars.map(bar => ({
    ...bar,
    image: BAR_IMAGES[bar.id] ?? null,
    events: bar.events ?? [],
  }))
}

export async function fetchAnnonces() {
  const { data, error } = await supabase
    .from('annonces')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function fetchUser(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('*, sorties(*), groups(*), annonces(*)')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

export async function joinEvent(eventId, userId) {
  const { error } = await supabase
    .from('event_attendees')
    .insert({ event_id: eventId, user_id: userId })

  if (error) throw error
}

export async function createAnnonce(annonce) {
  const { data, error } = await supabase
    .from('annonces')
    .insert(annonce)
    .select()
    .single()

  if (error) throw error
  return data
}
