import { supabase } from '../lib/supabase'

// Image map: bar id → local asset (images stay local)
import ostalImg from '../assets/bars/ostal.jpg'
import pignomImg from '../assets/bars/pignom.jpg'
import arriereCourtImg from '../assets/bars/arriere-cour.jpg'
import { normalizeBarEvent } from '../utils/events'

const BAR_IMAGES = {
  ostal: ostalImg,
  pignom: pignomImg,
  'arriere-cour': arriereCourtImg,
}

const BAR_COORDINATES = {
  ostal: { lat: 48.0240253, lng: -1.7473235 },
  pignom: { lat: 48.0290344, lng: -1.7619397 },
  'arriere-cour': { lat: 48.0217208, lng: -1.7501470 },
}

// ─────────── BARS ───────────

export async function fetchBars() {
  const [{ data: bars, error: barsError }, { data: events, error: eventsError }] = await Promise.all([
    supabase.from('bars').select('*').order('rating', { ascending: false }),
    supabase.from('events').select('*'),
  ])

  if (barsError) throw barsError
  if (eventsError) throw eventsError

  return bars.map(bar => ({
    ...bar,
    mapsUrl: bar.mapsurl,
    priceLevel: bar.pricelevel,
    coordinates: BAR_COORDINATES[bar.id],
    image: BAR_IMAGES[bar.id] ?? null,
    events: (events ?? []).filter(e => e.bar_id === bar.id).map(event => normalizeBarEvent(event, bar)),
  }))
}

// ─────────── ANNONCES ───────────

export async function fetchAnnonces() {
  const { data, error } = await supabase
    .from('annonces')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error

  const userIds = [...new Set(data.map(a => a.user_id).filter(Boolean))]
  let profilesById = {}
  if (userIds.length > 0) {
    const { data: profiles, error: pErr } = await supabase
      .from('profiles')
      .select('id, name, avatar_letter, avatar_url, color')
      .in('id', userIds)
    if (pErr) throw pErr
    profilesById = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))
  }

  return data.map(a => {
    const p = profilesById[a.user_id]
    return {
      ...a,
      when: a.when_text,
      maxAttending: a.max_attending,
      avatar_url: p?.avatar_url ?? a.avatar_url ?? null,
      avatar: p?.avatar_letter ?? a.avatar,
      color: p?.color ?? a.color,
      author: p?.name ?? a.author,
    }
  })
}

export async function createAnnonce(annonce) {
  const { data, error } = await supabase
    .from('annonces')
    .insert(annonce)
    .select()
    .single()

  if (error) throw error
  return { ...data, when: data.when_text, maxAttending: data.max_attending }
}

export async function joinAnnonce(annonceId, currentAttending) {
  const { data, error } = await supabase
    .from('annonces')
    .update({ attending: currentAttending + 1 })
    .eq('id', annonceId)
    .select('attending')
    .single()
  if (error) throw error
  return data.attending
}

export async function joinAnnonceUser(annonceId, userId) {
  try {
    const { data, error } = await supabase.rpc('join_annonce', {
      p_annonce_id: annonceId,
      p_user_id: userId,
    })
    if (error) throw error
    return data
  } catch (rpcError) {
    console.warn('joinAnnonceUser RPC failed, falling back to direct participant insert:', rpcError?.message ?? rpcError)
    const { error: insertError } = await supabase
      .from('annonce_participants')
      .insert([{ annonce_id: annonceId, user_id: userId }])
    if (insertError && !/duplicate key/i.test(insertError.message)) throw insertError

    const { count, error: countError } = await supabase
      .from('annonce_participants')
      .select('annonce_id', { count: 'exact', head: true })
      .eq('annonce_id', annonceId)
    if (countError) throw countError
    return count ?? 0
  }
}

export async function unjoinAnnonceUser(annonceId, userId) {
  try {
    const { data, error } = await supabase.rpc('unjoin_annonce', {
      p_annonce_id: annonceId,
      p_user_id: userId,
    })
    if (error) throw error
    return data
  } catch (rpcError) {
    console.warn('unjoinAnnonceUser RPC failed, falling back to direct participant delete:', rpcError?.message ?? rpcError)
    const { error: deleteError } = await supabase
      .from('annonce_participants')
      .delete()
      .eq('annonce_id', annonceId)
      .eq('user_id', userId)
    if (deleteError) throw deleteError

    const { count, error: countError } = await supabase
      .from('annonce_participants')
      .select('annonce_id', { count: 'exact', head: true })
      .eq('annonce_id', annonceId)
    if (countError) throw countError
    return count ?? 0
  }
}

export async function fetchJoinedAnnonceIds(userId) {
  const { data, error } = await supabase
    .from('annonce_participants')
    .select('annonce_id')
    .eq('user_id', userId)
  if (error) throw error
  return new Set(data.map(r => r.annonce_id))
}

export async function fetchAnnonceParticipants(annonceId) {
  const { data, error } = await supabase
    .from('annonce_participants')
    .select('user_id, joined_at, profiles(name, avatar_letter, avatar_url, color)')
    .eq('annonce_id', annonceId)
    .order('joined_at')
  if (error) throw error
  return data.map(r => ({ ...r.profiles, user_id: r.user_id, joined_at: r.joined_at }))
}

export async function fetchAllAnnonceParticipants(annonceIds) {
  if (!annonceIds?.length) return {}
  const { data, error } = await supabase
    .from('annonce_participants')
    .select('annonce_id, user_id, joined_at, profiles(name, avatar_letter, avatar_url, color)')
    .in('annonce_id', annonceIds)
    .order('joined_at')
  if (error) throw error
  const map = {}
  for (const r of data) {
    if (!map[r.annonce_id]) map[r.annonce_id] = []
    map[r.annonce_id].push({ ...r.profiles, user_id: r.user_id, joined_at: r.joined_at })
  }
  return map
}

export async function deleteAnnonce(annonceId) {
  const { error } = await supabase
    .from('annonces')
    .delete()
    .eq('id', annonceId)
  if (error) throw error
}

// ─────────── ANNONCE INVITATIONS ───────────

export async function sendAnnonceInvitations(annonceId, inviterId, inviteeIds) {
  if (!inviteeIds?.length) return []
  const rows = inviteeIds.map(id => ({
    annonce_id: annonceId,
    inviter_id: inviterId,
    invitee_id: id,
  }))
  const { data, error } = await supabase
    .from('annonce_invitations')
    .upsert(rows, { onConflict: 'annonce_id,invitee_id', ignoreDuplicates: true })
    .select()
  if (error) throw error
  return data ?? []
}

export async function fetchPendingInvitations(userId) {
  const { data, error } = await supabase
    .from('annonce_invitations')
    .select('id, annonce_id, inviter_id, status, created_at')
    .eq('invitee_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
  if (error) throw error
  if (!data?.length) return []

  const annonceIds = [...new Set(data.map(r => r.annonce_id))]
  const inviterIds = [...new Set(data.map(r => r.inviter_id))]

  const [{ data: annonces, error: aErr }, { data: profiles, error: pErr }] = await Promise.all([
    supabase.from('annonces').select('*').in('id', annonceIds),
    supabase.from('profiles').select('id, name, avatar_letter, avatar_url, color').in('id', inviterIds),
  ])
  if (aErr) throw aErr
  if (pErr) throw pErr

  const annonceById = Object.fromEntries((annonces ?? []).map(a => [a.id, a]))
  const profileById = Object.fromEntries((profiles ?? []).map(p => [p.id, p]))

  return data
    .map(r => {
      const a = annonceById[r.annonce_id]
      if (!a) return null
      return {
        invitationId: r.id,
        createdAt: r.created_at,
        inviter: profileById[r.inviter_id] ?? null,
        annonce: {
          ...a,
          when: a.when_text,
          maxAttending: a.max_attending,
        },
      }
    })
    .filter(Boolean)
}

export async function fetchAnnonceInvitees(annonceId) {
  const { data, error } = await supabase
    .from('annonce_invitations')
    .select('id, invitee_id, status, profiles:invitee_id(name, avatar_letter, avatar_url, color)')
    .eq('annonce_id', annonceId)
  if (error) throw error
  return (data ?? []).map(r => ({
    invitationId: r.id,
    user_id: r.invitee_id,
    status: r.status,
    ...(r.profiles ?? {}),
  }))
}

export async function acceptAnnonceInvitation(invitationId) {
  const { data, error } = await supabase.rpc('accept_annonce_invitation', { p_invitation_id: invitationId })
  if (error) throw error
  return data
}

export async function declineAnnonceInvitation(invitationId) {
  const { error } = await supabase.rpc('decline_annonce_invitation', { p_invitation_id: invitationId })
  if (error) throw error
}

export function subscribeToAnnonces(callback) {
  return supabase
    .channel('public:annonces')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'annonces' }, callback)
    .subscribe()
}

export function subscribeToAnnonceParticipants(callback) {
  return supabase
    .channel('public:annonce_participants')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'annonce_participants' }, callback)
    .subscribe()
}

export function subscribeToAnnonceInvitations(userId, callback) {
  if (!userId) return null
  return supabase
    .channel(`public:annonce_invitations:${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'annonce_invitations', filter: `invitee_id=eq.${userId}` },
      callback
    )
    .subscribe()
}

export function unsubscribeChannel(channel) {
  supabase.removeChannel(channel)
}

// ─────────── EVENTS ───────────

export async function joinEvent(eventId, userId) {
  const { error } = await supabase
    .from('event_attendees')
    .insert({ event_id: eventId, user_id: userId })

  if (error) throw error
}

// ─────────── AUTH ───────────

export async function signUp(email, password, name) {
  const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}`
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
      emailRedirectTo: redirectTo,
    },
  })
  if (error) throw error
  return data
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// ─────────── PROFILE ───────────

export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function uploadAvatar(userId, file) {
  const ext = file.name.split('.').pop().toLowerCase()
  const path = `${userId}/avatar.${ext}`
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })
  if (error) throw error
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  return data.publicUrl
}
