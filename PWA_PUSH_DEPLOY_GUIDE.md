# Khazar League PWA + Push Notifications

## What is included
- Installable PWA manifest and service worker.
- Install button and push subscription controls in the existing site.
- Subscription preferences: all league or one selected team.
- Backend endpoints for subscriptions and VAPID public key.
- Goal event, match start/end and announcement publish push triggers.
- Push subscriptions are stored in the existing JSON/Supabase `league_state` payload as `push_subscriptions`; existing tables/data are preserved.

## Deploy safely (keep the same domain)
1. Keep the existing Vercel project and GitHub repository. Replace repository contents with this project; do not create a new Vercel project/domain.
2. Set Vercel environment variable `VITE_API_BASE_URL=https://khazarleague.onrender.com/api` for Production, Preview and Development; redeploy.
3. On the existing Render service, add `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT=mailto:admin@khazarleague.az` and `CORS_ORIGIN=https://khazar-league.vercel.app`. Generate key pair locally with `npx web-push generate-vapid-keys`; never put the private key in Vercel or frontend.
4. Deploy backend to the existing Render service. Render must install root dependencies so `web-push` is installed. Keep existing `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` unchanged.
5. Deploy frontend to the existing Vercel project. Same domain/URL remains unchanged.

## Test
- Open the same site in Chrome/Android or Safari on iOS 16.4+. On iPhone, first use Share > Add to Home Screen, open the installed icon, then enable notifications.
- Choose all league or a team and enable notifications.
- In admin, add a goal event; goal push should arrive. Change match status to `live` or `completed`; match push should arrive. Publish an announcement; news push should arrive.

## Notes
- Push delivery requires HTTPS and user permission. iOS web push requires an installed Home Screen web app on supported iOS versions.
- The VAPID private key is a server secret. Do not commit it to GitHub or set it in Vercel.
- No existing domain, Supabase credentials or tournament data are changed by this patch.
- The UI currently fetches the public overview for team options; if the overview response nests teams differently, adjust the mapping after checking its live response.
