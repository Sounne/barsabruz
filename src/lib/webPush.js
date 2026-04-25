import { supabase } from './supabase'

const PUBLIC_VAPID_KEY = import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY
const DEFAULT_NOTIFICATION_PREFERENCES = {
  messages: true,
  groups: true,
  events: false,
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

function getStoredRegistrationPromise() {
  const baseUrl = import.meta.env.BASE_URL || '/'
  const swUrl = `${baseUrl}sw.js`

  if (!('serviceWorker' in navigator)) {
    return Promise.reject(new Error('service_worker_unsupported'))
  }

  return navigator.serviceWorker.register(swUrl, { scope: baseUrl })
}

export function isWebPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    window.isSecureContext
  )
}

export async function getWebPushStatus() {
  if (!isWebPushSupported()) return { supported: false, permission: 'unsupported', subscribed: false }

  const registration = await navigator.serviceWorker.ready.catch(() => null)
  const subscription = registration ? await registration.pushManager.getSubscription() : null

  return {
    supported: true,
    configured: !!PUBLIC_VAPID_KEY,
    permission: Notification.permission,
    subscribed: !!subscription,
  }
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return null
  try {
    await getStoredRegistrationPromise()
    return navigator.serviceWorker.ready
  } catch (error) {
    console.warn('Service worker registration failed:', error?.message ?? error)
    return null
  }
}

export async function subscribeUserToPush(userId) {
  if (!userId) throw new Error('Utilisateur requis.')
  if (!isWebPushSupported()) throw new Error('Les notifications push ne sont pas supportees sur cet appareil.')
  if (!PUBLIC_VAPID_KEY) throw new Error('Cle VAPID publique manquante.')

  const registration = await registerServiceWorker()
  if (!registration) throw new Error('Service worker indisponible.')

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error(permission === 'denied'
      ? 'Notifications bloquees dans le navigateur.'
      : 'Autorisation de notification annulee.')
  }

  const existing = await registration.pushManager.getSubscription()
  const subscription = existing || await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
  })
  const json = subscription.toJSON()
  const prefs = await getNotificationPreferences(userId)

  const { data, error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: userId,
      endpoint: json.endpoint,
      keys: json.keys,
      user_agent: navigator.userAgent,
      enabled: true,
      prefs,
      last_seen_at: new Date().toISOString(),
    }, { onConflict: 'endpoint' })
    .select('id')
    .single()

  if (error) throw error
  return { subscription, id: data?.id ?? null }
}

export async function getPushPreferences(userId) {
  return getNotificationPreferences(userId)
}

export async function updatePushPreference(userId, key, value) {
  return updateNotificationPreference(userId, key, value)
}

export async function getNotificationPreferences(userId) {
  if (!userId) return DEFAULT_NOTIFICATION_PREFERENCES

  const { data, error } = await supabase
    .from('notification_preferences')
    .select('messages, groups, events')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    const { data: pushData } = await supabase
      .from('push_subscriptions')
      .select('prefs')
      .eq('user_id', userId)
      .eq('enabled', true)
      .limit(1)
      .maybeSingle()
    return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...(pushData?.prefs ?? {}) }
  }

  if (data) return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...data }

  const { data: inserted, error: insertError } = await supabase
    .from('notification_preferences')
    .insert({ user_id: userId, ...DEFAULT_NOTIFICATION_PREFERENCES })
    .select('messages, groups, events')
    .single()

  if (insertError) return DEFAULT_NOTIFICATION_PREFERENCES
  return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...inserted }
}

export async function updateNotificationPreference(userId, key, value) {
  if (!userId || !key) return

  const { error: createError } = await supabase
    .from('notification_preferences')
    .upsert(
      { user_id: userId, ...DEFAULT_NOTIFICATION_PREFERENCES },
      { onConflict: 'user_id', ignoreDuplicates: true }
    )
  if (createError) throw createError

  const { error: prefsError } = await supabase
    .from('notification_preferences')
    .update({ [key]: value, updated_at: new Date().toISOString() })
    .eq('user_id', userId)

  if (prefsError) throw prefsError

  const { data: subs, error: fetchError } = await supabase
    .from('push_subscriptions')
    .select('id, prefs')
    .eq('user_id', userId)
    .eq('enabled', true)
  if (fetchError) throw fetchError

  await Promise.all((subs ?? []).map(sub =>
    supabase
      .from('push_subscriptions')
      .update({ prefs: { ...(sub.prefs ?? {}), [key]: value } })
      .eq('id', sub.id)
  ))
}

export async function unsubscribeUserFromPush(userId) {
  if (!isWebPushSupported()) return

  const registration = await navigator.serviceWorker.ready.catch(() => null)
  const subscription = registration ? await registration.pushManager.getSubscription() : null
  if (!subscription) return

  const endpoint = subscription.endpoint
  await subscription.unsubscribe().catch(() => {})

  let query = supabase
    .from('push_subscriptions')
    .update({ enabled: false, disabled_at: new Date().toISOString() })
    .eq('endpoint', endpoint)

  if (userId) query = query.eq('user_id', userId)
  const { error } = await query
  if (error) throw error
}
