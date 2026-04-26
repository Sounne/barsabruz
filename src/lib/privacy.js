import { supabase } from './supabase'

const DEFAULT_PRIVACY = {
  profile_public: true,
  discoverable: true,
  show_stats: true,
  messages_from_all: true,
  invites_from_all: true,
  share_joined_sorties: true,
}

const COLS = 'profile_public, discoverable, show_stats, messages_from_all, invites_from_all, share_joined_sorties'

export function dbToJs(row) {
  if (!row) return null
  return {
    profilePublic: row.profile_public,
    discoverable: row.discoverable,
    showStats: row.show_stats,
    messagesFromAll: row.messages_from_all,
    invitesFromAll: row.invites_from_all,
    shareJoinedSorties: row.share_joined_sorties,
  }
}

const JS_TO_DB = {
  profilePublic: 'profile_public',
  discoverable: 'discoverable',
  showStats: 'show_stats',
  messagesFromAll: 'messages_from_all',
  invitesFromAll: 'invites_from_all',
  shareJoinedSorties: 'share_joined_sorties',
}

export async function getPrivacyPreferences(userId) {
  if (!userId) return dbToJs(DEFAULT_PRIVACY)

  const { data, error } = await supabase
    .from('privacy_preferences')
    .select(COLS)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) return dbToJs(DEFAULT_PRIVACY)
  if (data) return dbToJs({ ...DEFAULT_PRIVACY, ...data })

  const { data: inserted } = await supabase
    .from('privacy_preferences')
    .insert({ user_id: userId, ...DEFAULT_PRIVACY })
    .select(COLS)
    .single()

  return dbToJs({ ...DEFAULT_PRIVACY, ...(inserted ?? {}) })
}

export async function updatePrivacyPreference(userId, key, value) {
  if (!userId || !key) return
  const dbKey = JS_TO_DB[key]
  if (!dbKey) return

  await supabase
    .from('privacy_preferences')
    .upsert({ user_id: userId, ...DEFAULT_PRIVACY }, { onConflict: 'user_id', ignoreDuplicates: true })

  const { error } = await supabase
    .from('privacy_preferences')
    .update({ [dbKey]: value, updated_at: new Date().toISOString() })
    .eq('user_id', userId)

  if (error) throw error
}
