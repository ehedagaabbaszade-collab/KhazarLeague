# Khazar League 2.0 — ilkin yenidənqurma qeydi

Bu paket istifadəçinin təsdiqlədiyi 30 suallıq spesifikasiya əsasında hazırlanır. Bu mərhələ yalnız baxış və sınaq üçündür; production yayımlanması edilmir.

## Təsdiqlənmiş platforma arxitekturası
- GitHub: mənbə kodu və versiyalara nəzarət.
- Vercel: ictimai React/Vite frontend; yekun ünvan `https://khazar-league.vercel.app/`.
- Render: Node.js/Express backend.
- Supabase: PostgreSQL əsas məlumat yaddaşı.

## Məhsul tələbləri
- Yalnız Dark Mode; midnight navy, açıq mavi, gümüşü və glassmorphism.
- Azərbaycan dili.
- Canlı hesab / canlı matç izləmə yoxdur. Nəticəni oyun bitdikdən sonra yalnız Super Admin daxil edir.
- Bir Super Admin hesabı.
- Komanda kartı tam profilə açılır; profil taktiki meydança, futbol köynəyi markerləri, forma nömrəsi, oyunçu adı və interaktiv mövqe dəyişmə ilə təqdim olunur.
- 6 nəfərlik format və 11 nəfərlik gələcək format üçün düzülüş dəstəyi.
- Oyunçu statistikası: oyun sayı, qol, assist. Fərdi mükafatları Super Admin əl ilə təyin edir.
- Mobil, planşet və desktop uyğunluğu.

## Qorunan ilkin məlumat
16 komanda, 128 oyunçu, 4 qrup, 24 matç və 16 komanda loqosu. Mənbə məlumatlarında olmayan tarix, stadion, hesab və oyunçu göstəriciləri yaradılmır.

## Dəyişikliklər
- İctimai komanda kartları komanda profilinə yönləndirildi.
- Komanda profilinə interaktiv taktiki meydança və forma markerləri əlavə edildi.
- MVP səsverməsi və kapitan/oyunçu kabinetləri ictimai naviqasiyadan çıxarıldı.
- Admin girişləri Super Admin roluna məhdudlaşdırıldı.
- İctimai profil, admin paneli, taktiki qurucu və ümumi dizayn üçün daimi dark glass UI qatları əlavə edildi.
- Supabase uzaq yaddaşına yazılmadan əvvəl əvvəlki state `league_backups` cədvəlinə yazılacaq.

## Vacib tətbiq addımı
`database/supabase-schema.sql` faylının yenilənmiş versiyası Supabase SQL Editor-də tətbiq edilməlidir ki, `league_backups` cədvəli yaradılsın. Bu preview mərhələsində Supabase-ə heç bir dəyişiklik göndərilmir.

## Yoxlama statusu
- Backend və database JavaScript sintaksis yoxlaması: keçdi.
- Frontend production build: bu mühitdə Vite executable mövcud deyil; `npm ci` quraşdırılması vaxt limitinə düşdü. Buna görə build nəticəsi hələ təsdiqlənməyib.
- İstehsalat yayımlanması: edilməyib.
