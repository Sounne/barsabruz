# Web Push setup

This project stores browser push subscriptions in `public.push_subscriptions`
and sends notifications through the `send-push-notification` Edge Function.

## 1. Create VAPID keys

```bash
npx web-push generate-vapid-keys
```

Add the public key to the Vite app:

```bash
VITE_WEB_PUSH_PUBLIC_KEY=your_public_key
```

Add the Edge Function secrets in Supabase:

```bash
supabase secrets set WEB_PUSH_PUBLIC_KEY=your_public_key
supabase secrets set WEB_PUSH_PRIVATE_KEY=your_private_key
supabase secrets set WEB_PUSH_SUBJECT=mailto:contact@barsabruz.fr
supabase secrets set PUSH_FUNCTION_SECRET=long_random_secret
```

## 2. Create the table

Run `supabase/push_subscriptions.sql` in the Supabase SQL editor or through
your migration workflow.

## 3. Deploy the function

```bash
supabase functions deploy send-push-notification
```

## 4. Send a test push

```bash
curl -X POST "https://<project-ref>.functions.supabase.co/send-push-notification" \
  -H "Content-Type: application/json" \
  -H "x-push-secret: long_random_secret" \
  -d '{
    "userIds": ["USER_ID"],
    "notification": {
      "title": "Bars a Bruz",
      "body": "Test de notification push",
      "url": "/barsabruz/"
    }
  }'
```

On iOS, the user must add the site to the Home Screen before Web Push can work.
