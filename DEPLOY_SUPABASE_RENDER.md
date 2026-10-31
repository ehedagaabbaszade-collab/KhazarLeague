# Khazar League deployment

1. Run `database/supabase-schema.sql` in Supabase Dashboard → SQL Editor.
2. Render environment variables:
   - `SUPABASE_URL`: project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: server-side service-role secret. Never put this in Vercel/browser code.
   - `CORS_ORIGIN`: `https://khazar-league.vercel.app`
3. Render settings: Node, root blank, build `npm install`, start `node backend/server.js`, Free instance.
4. Vercel environment variable `VITE_API_BASE_URL` = `https://YOUR-RENDER-SERVICE.onrender.com/api`, then redeploy.
5. Keep GitHub repository private. The bundled data file includes the existing admin password hash; rotate the admin password after first successful login.

The first backend boot seeds the Supabase `league_state` row from `data/khazar_league.json` if empty. Subsequent mutations are persisted to that row. Captain accounts are created in Super Admin → Users and must be assigned one team. Captains can edit safe team contact fields and manage players only for their own team.
