# KHAZAR LEAGUE 2.0 — Təsdiqlənmiş məhsul, dizayn və texniki spesifikasiya

## Layihə qərarları

- Yekun ictimai ünvan: `https://khazar-league.vercel.app/` (mövcud URL dəyişdirilməyəcək).
- Hazırkı mərhələ yalnız preview və istifadəçi yoxlamasıdır. Təsdiq olmadan GitHub push, Render deploy və Vercel production deploy edilməyəcək.
- Xidmətlər: GitHub (mənbə kodu), Vercel (frontend), Render (Node/Express backend), Supabase (PostgreSQL).
- Yalnız bir Super Admin hesabı. Gələcəkdə rolları artırmağa imkan verən arxitektura saxlanıla bilər, amma digər hesab növləri aktiv deyil.
- Supabase/PostgreSQL canlı məlumat yaddaşıdır; mövcud JSON məlumatları qorunan import mənbəyi olaraq saxlanılır.

## Dizayn

- İstiqamət: premium football + futuristic technology + sports broadcast.
- Palitra: midnight navy, açıq mavi, gümüşü.
- Glassmorphism kartlar, panellər və modallar.
- Yalnız Dark Mode; Light Mode və tema dəyişdiricisi yoxdur.
- Yüksək keyfiyyətli, lakin performans nəzərə alınan animasiyalar; `prefers-reduced-motion` dəstəyi.
- Bütün interfeys Azərbaycan dilində.
- Vahid dizayn sistemi ana səhifə, komanda/oyunçu/matç profilləri, statistika və admin panelinə tətbiq olunur.

## İctimai səhifələr

- Ana səhifə: liqa təqdimatı, komanda/oyunçu/matç göstəriciləri, qrup cədvəlləri, komanda siyahısı, matç nəticələri və xəbərlər.
- Turnir: 4 qrup, vizual qrup kartları və ətraflı turnir cədvəli.
- Komandalar: 16 komanda; hər komanda kartı tam komanda profilinə açılır.
- Komanda profili: komanda məlumatları, taktiki meydança, oyunçu heyəti və matçlar.
- Oyunçu profili: yalnız oyun sayı, qol və assist göstəriciləri; əlavə göstəricilər ictimai statistikaya daxil edilmir.
- Matç mərkəzi: komandalar, loqolar, yekun hesab, tarix, stadion, heyətlər, qollar, assistlər, əvəzetmələr, vərəqələr, hakim və protokol.
- Mükafatlar: yalnız Super Admin-in əl ilə təyin etdiyi mükafatlar.
- Canlı hesab, canlı matç izləmə, canlı nəticə axını və canlı status UI-si yoxdur. Nəticə oyun bitdikdən sonra Super Admin tərəfindən daxil edilir.

## Komanda taktiki meydançası

- Realistik yaşıl meydança, perspektiv effekti və premium vizual qatlar.
- Oyunçular futbol köynəyi markerləri ilə göstərilir; forma nömrəsi köynəyin üzərində, ad aşağıda görünür.
- Oyunçu seçildikdə onun daxil edilmiş məlumatlarından qısa xülasə açılır.
- Hazır sxemlər və xüsusi sxem yaratmaq üçün əsas.
- İctimai profil görünüşündə mövqe dəyişiklikləri vizual preview-dur; yadda saxlanılan rəsmi matç heyəti admin heyət qurucusundan idarə olunur.
- 6 nəfərlik format: 1 qapıçı + 5 meydan oyunçusu; 2 ehtiyat. Sxemlər: 2-2-1, 1-3-1, 2-1-2.
- 11 nəfərlik gələcək format üçün: 4-3-3, 4-4-2, 4-2-3-1, 3-5-2, 4-1-4-1, 3-4-3.
- Admin heyət qurucusunda avtomatik heyət doldurma və drag/drop mövqe dəyişmə saxlanılır.

## Admin paneli

- Football Manager üslubunda vahid dark glass idarəetmə paneli.
- Yalnız Super Admin daxil olur və bütün idarəetmə API-lərini istifadə edə bilər.
- Komanda, oyunçu, turnir, qrup, matç, nəticə, matç protokolu, heyət, turnir cədvəli, pley-off, mükafat, elan və sponsor idarəetməsi.
- Matç nəticələrini yalnız Super Admin daxil edir.
- Komanda kapitanı, oyunçu, matç operatoru və digər ayrıca hesablar aktiv deyil.

## Məlumatların qorunması

Mövcud layihədə yoxlanmış başlanğıc məlumatlar:

| Məlumat | Say |
|---|---:|
| Komanda | 16 |
| Oyunçu | 128 |
| Qrup | 4 |
| İlkin matç | 24 |
| Komanda loqosu | 16 |

Məlumat mənbələri: `data/`, `imports/`, `uploads/` və `imports/lineup-reference.jpg`. Mövcud adlar, loqolar, heyətlər və oyunlar qorunur. Mənbədə olmayan hesab, tarix, stadion və statistika uydurulmur.

## Texniki arxitektura

- Frontend: React + Vite → Vercel.
- Backend: Node.js + Express → Render.
- Database: Supabase PostgreSQL.
- Repo: GitHub.
- Vercel `VITE_API_BASE_URL` Render API ünvanına yönəlir.
- Supabase service-role açarı yalnız Render backend environment variables-də saxlanılır; brauzer bundle-ına daxil edilmir.
- Vercel-in ephemeral filesystem-i daimi məlumat bazası kimi istifadə edilmir.

## Backup və bərpa

- Hər dəyişiklikdən əvvəl Supabase-dəki əvvəlki `league_state` payload `league_backups` cədvəlinə yazılır.
- Backup yazıla bilməzsə, uzaq state-in üzərinə yazılmır.
- Lokal JSON saxlanılan mühitdə əvvəlki fayl `backups/` qovluğuna kopyalanır.
- Super Admin parametrlər səhifəsində backup siyahısını görə və bərpa edə bilər.
- Bərpadan əvvəl cari state də yeni backup kimi saxlanılır.
- Supabase SQL Editor-də `database/supabase-schema.sql` icra edilməlidir; bu, `league_state` və `league_backups` cədvəllərini yaradır.

## Uyğunluq və keyfiyyət

- Desktop, mobil və planşet üçün responsive.
- Təhlükəsiz autentifikasiya, server-side role check, şifrə hash-i, rate limit və HTTPS.
- Testlər: məlumat bütövlüyü, 6/11 nəfərlik heyət qaydaları, API icazələri, backup/bərpa, mobil görünüş, build və route yoxlamaları.
- Təhvil: tam mənbə kodu, quraşdırma təlimatı, admin təlimatı, texniki sənədləşmə, backup/bərpa təlimatı və test nəticələri.

## Yayımlanma şərti

İstifadəçi preview-i yoxlayıb açıq şəkildə təsdiqlədikdən sonra ayrıca mərhələdə Supabase schema migration, GitHub commit/push, Render deploy və Vercel production deploy aparılır. Bu preview paketinin hazırlanması öz-özlüyündə yayımlanma icazəsi sayılmır.
