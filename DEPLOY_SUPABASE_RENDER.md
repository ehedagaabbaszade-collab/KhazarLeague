# Khazar League deployment

1. Run `database/supabase-schema.sql` in Supabase Dashboard → SQL Editor. This creates the state table and immutable pre-change backup table.
2. Render environment variables:
   - `SUPABASE_URL`: project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: server-side service-role secret. Never put this in Vercel/browser code.
   - `CORS_ORIGIN`: `https://khazar-league.vercel.app`
3. Render settings: Node, root blank, build `npm install`, start `node backend/server.js`, Free instance.
4. GitHub repository `KhazarLeague`, branch `main` mənbə kodu üçün istifadə olunur.
5. Vercel environment variable `VITE_API_BASE_URL` = `https://khazarleague.onrender.com/api` (mövcud backend ünvanı), then redeploy.
6. Keep GitHub repository private. The bundled data file includes the existing admin password hash; rotate the admin password after first successful login.

The first backend boot seeds the Supabase `league_state` row from `data/khazar_league.json` if empty. Subsequent mutations are persisted to that row only after the previous state is copied into `league_backups`. Local JSON snapshots are also written to `backups/` before each local save; Render ephemeral storage is not treated as the durable backup. Keep Supabase database backups enabled as an additional recovery layer. The platform is configured for one Super Admin account. Public users do not receive management accounts; all management endpoints reject non-Super-Admin roles.


## Khazar League 2.0 mövqe metadata yenilənməsi

Yeni mövqe sahələri üçün `database/migrations/2026-11-05-player-position-metadata.sql` faylını Supabase SQL Editor-də bir dəfə icra edin. Sonra Admin panelində **Mövqələrin toplu təsdiqi** bölməsinə daxil olaraq `imports/khazar-league-position-approval-v5-full-128.json` faylını yoxlayıb tətbiq edin. Tətbiq zamanı backend avtomatik backup yaradır.
