# Khazar League 2.0

Khazar League — Xəzər Universiteti tələbə futbol liqası üçün Azərbaycan dilində idarəetmə və ictimai turnir platforması.

## 2.0 təsdiqlənmiş məhsul istiqaməti

- Premium football + futuristic technology + sports broadcast vizual dili.
- Midnight navy, açıq mavi və gümüşü rənglər; glassmorphism panellər.
- Yalnız Dark Mode; Light Mode və tema dəyişdiricisi yoxdur.
- Bütün ictimai interfeys Azərbaycan dilində.
- Canlı hesab və canlı matç izləmə yoxdur. Nəticələr oyun bitdikdən sonra yalnız Super Admin tərəfindən daxil edilir.
- Yalnız bir Super Admin hesabı aktivdir.
- Komanda kartına klik tam komanda profilini açır; taktiki meydança, köynək markerləri, forma nömrələri, oyunçu xülasəsi və mövqe dəyişmə mövcuddur.
- 6 nəfərlik format və 11 nəfərlik gələcək format üçün hazır sxemlər; drag/drop ilə fərdi düzülüş.
- Oyunçu statistikası yalnız oyun sayı, qol və assistdir. Fərdi mükafatlar Super Admin tərəfindən əl ilə təyin olunur.
- Desktop, mobil və planşet uyğunluğu; animasiyalarda `prefers-reduced-motion` dəstəyi.

Tam qərarlar: `docs/KHAZAR_LEAGUE_2_SPEC_AZ.md`.

## Mövcud məlumatların qorunması

Mövcud başlanğıc məlumatları qorunur: 16 komanda, 128 oyunçu, 4 qrup, 24 ilkin matç və 16 komanda loqosu. İlkin mənbələr `data/`, `imports/` və `uploads/` qovluqlarındadır. `imports/lineup-reference.jpg` taktiki görünüş üçün dizayn istinadıdır. Mənbədə olmayan matç tarixi, stadion, hesab və statistika uydurulmur.


## 2026/2027 rəsmi heyət və oyun təqvimi

- `imports/oyunçular-source.txt` — heyətlər üçün verilmiş ilkin mənbə.
- `imports/khazar_league_rosters_2026_az.json` — 16 komanda və 128 oyunçu üzrə strukturlaşdırılmış heyət məlumatı.
- `imports/khazar-league-position-approval-v5-full-128.json` — 128 oyunçunun ingiliscə mövqe adları və standart kodları (GK, DF, MF, FW, LW, RW, CDM, CF).
- `imports/official-match-calendar-2026-2027.json` — rəsmi PDF-dəki 24 qrup oyunu.
- Admin → Oyun təqvimi bölməsində **Rəsmi 24 oyunu idxal et** düyməsi mövcud oyunları yeniləyir, çatışmayanları yaradır, tamamlanmış nəticələri və pley-off oyunlarını qoruyur.
- Mövqe metadata yenilənməsi üçün `database/migrations/2026-11-05-player-position-metadata.sql` tətbiq edilməlidir; sonra Admin → Mövqələrin toplu təsdiqi bölməsindən mövqe JSON-u yoxlanıb tətbiq olunur.

## Platforma arxitekturası

- GitHub — layihənin mənbə kodu və versiyalara nəzarət.
- Vercel — React/Vite frontend; production ünvanı `https://khazar-league.vercel.app/`.
- Render — Node.js/Express backend; mövcud API ünvanı `https://khazarleague.onrender.com/api`.
- Supabase — PostgreSQL əsas məlumat yaddaşı.

Supabase service-role açarı yalnız Render environment variables-də saxlanmalıdır. Onu frontend-ə, Vercel-in `VITE_` dəyişənlərinə və GitHub-a yerləşdirmək olmaz. Vercel-in ephemeral filesystem-i daimi verilənlər bazası deyil.

## Lokal preview

1. ZIP-i yeni qovluğa çıxarın.
2. Node.js 18+ quraşdırılmış olsun.
3. `START_KHAZAR_LEAGUE.bat` faylını başladın. İlk başladılmada backend və frontend asılılıqları avtomatik quraşdırılır.
4. İctimai sayt: `http://127.0.0.1:4174`
5. Admin girişi: `http://127.0.0.1:4174/login`
6. API health: `http://127.0.0.1:3000/api/health`

Preview paketinə `.env` daxil edilmir. Bu, lokal baxışın production Supabase-ə qoşulmasının və təsadüfən canlı məlumatların dəyişdirilməsinin qarşısını alır. Lokal preview paketdəki JSON məlumatı ilə işləyir.

## Backup və bərpa

- Hər uzaq dəyişiklikdən əvvəl mövcud Supabase `league_state` payload-u `league_backups` cədvəlinə snapshot edilir.
- Backup yazıla bilməzsə, uzaq state yenilənmir.
- Lokal JSON yaddaşında əvvəlki fayl `backups/` qovluğuna kopyalanır.
- Super Admin → Parametrlər bölməsində backup siyahısı göstərilə və bərpa edilə bilər.
- Bərpadan əvvəl cari vəziyyət də backup kimi saxlanılır.
- Supabase-də `database/supabase-schema.sql` bir dəfə SQL Editor-də icra edilməlidir.

## Yoxlama

- `node tests/run-tests.js` — heyət qaydaları, səsvermə köməkçi siyasətləri və mövcud məlumatların bütövlüyü.
- `node --check backend/server.js`
- `node --check database/json-db.js`
- Frontend JS/JSX parser yoxlaması.

## Yayımlanma qaydası

Hazırkı paket yalnız review/preview üçündür. İstifadəçi ayrıca təsdiq etməyənə qədər GitHub push, Render deploy, Supabase production schema migration və Vercel production deploy edilməməlidir. Yayımlanma addımları `DEPLOY_SUPABASE_RENDER.md` sənədindədir.
