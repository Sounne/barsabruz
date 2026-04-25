import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type PushSubscriptionRow = {
  id: string
  user_id: string
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

type RequestBody = {
  userIds?: string[]
  subscriptionIds?: string[]
  audience?: 'all'
  notification: {
    title: string
    body?: string
    url?: string
    tag?: string
    icon?: string
    badge?: string
    data?: Record<string, unknown>
  }
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const vapidPublicKey = Deno.env.get('WEB_PUSH_PUBLIC_KEY')
  const vapidPrivateKey = Deno.env.get('WEB_PUSH_PRIVATE_KEY')
  const vapidSubject = Deno.env.get('WEB_PUSH_SUBJECT') || 'mailto:contact@barsabruz.fr'
  const functionSecret = Deno.env.get('PUSH_FUNCTION_SECRET')

  if (!supabaseUrl || !serviceRoleKey || !vapidPublicKey || !vapidPrivateKey || !functionSecret) {
    return jsonResponse({ error: 'Missing Supabase, VAPID, or push function environment variables' }, 500)
  }

  if (req.headers.get('x-push-secret') !== functionSecret) {
    return jsonResponse({ error: 'Unauthorized' }, 401)
  }

  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }

  if (!body.notification?.title) {
    return jsonResponse({ error: 'notification.title is required' }, 400)
  }

  const targetsProvided = Boolean(body.userIds?.length || body.subscriptionIds?.length || body.audience === 'all')
  if (!targetsProvided) {
    return jsonResponse({ error: 'Provide userIds, subscriptionIds, or audience: "all"' }, 400)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

  let query = supabase
    .from('push_subscriptions')
    .select('id, user_id, endpoint, keys')
    .eq('enabled', true)

  if (body.subscriptionIds?.length) {
    query = query.in('id', body.subscriptionIds)
  } else if (body.userIds?.length) {
    query = query.in('user_id', body.userIds)
  }

  const { data: subscriptions, error } = await query
  if (error) return jsonResponse({ error: error.message }, 500)

  const payload = JSON.stringify({
    title: body.notification.title,
    body: body.notification.body,
    url: body.notification.url || '/barsabruz/',
    tag: body.notification.tag || 'barsabruz',
    icon: body.notification.icon || '/barsabruz/icon-192.png',
    badge: body.notification.badge || '/barsabruz/icon-192.png',
    data: body.notification.data || {},
  })

  const results = await Promise.allSettled((subscriptions as PushSubscriptionRow[]).map(async (sub) => {
    try {
      await webpush.sendNotification({
        endpoint: sub.endpoint,
        keys: sub.keys,
      }, payload)
      return { id: sub.id, ok: true }
    } catch (err) {
      const statusCode = typeof err === 'object' && err && 'statusCode' in err
        ? Number((err as { statusCode?: number }).statusCode)
        : undefined

      if (statusCode === 404 || statusCode === 410) {
        await supabase
          .from('push_subscriptions')
          .update({ enabled: false, disabled_at: new Date().toISOString() })
          .eq('id', sub.id)
      }

      return {
        id: sub.id,
        ok: false,
        statusCode,
        error: err instanceof Error ? err.message : 'Push send failed',
      }
    }
  }))

  const sent = results.filter((result) => result.status === 'fulfilled' && result.value.ok).length
  const failed = results.length - sent

  return jsonResponse({
    sent,
    failed,
    total: results.length,
    results: results.map((result) => result.status === 'fulfilled' ? result.value : { ok: false, error: result.reason }),
  })
})
