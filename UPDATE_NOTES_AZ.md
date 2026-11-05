# Khazar League — yenilənmə qeydləri

## Dəyişikliklər
- Oyunçu mənbə faylı `imports/oyunçular-source.txt` kimi əlavə edildi.
- 16 komanda / 128 oyunçu roster JSON-u ingilis dilində mövqe adları və kodları ilə zənginləşdirildi.
- Mövqe təsdiqi JSON-u mövcud oyunçu adları və forma nömrələri ilə yenidən quruldu.
- Mövqe import endpoint-i `position_label_en` sahəsini də saxlayır.
- Oyunçu profilində mövqe ingilis dilində göstərilir; taktiki sıralama ümumi DF/MF/FW kodlarını da tanıyır.
- Supabase/SQL metadata üçün `position_label_en` sütunu migration-a əlavə edildi.
- PDF KL-010126-R1 səhifə 15–16 əsasında 24 qrup oyunu və admin panelində rəsmi təqvim idxalı əlavə edildi.
- Köhnə yanlış tarixlər təqvim təlimatından çıxarıldı.

## Yoxlama
- Backend `node --check` yoxlaması keçdi.
- Dəyişdirilmiş JSX faylları TypeScript JSX parser ilə sintaksis yoxlamasından keçdi.
- Roster: 16 komanda, hərəsində 8 oyunçu, cəmi 128 oyunçu.
- Təqvim: 24 oyun, tarixlər üzrə 5/5/4/5/5 bölgüsü.
- Tam test paketi bu ZIP-də `data/khazar_league.json` faylı olmadığı üçün işə düşmədi; bu fayl layihənin runtime/production məlumatıdır və ZIP-ə daxil edilməyib.
- Frontend production build icra olunmadı: dependency paketləri lokal mühitdə mövcud deyil və offline quraşdırma mümkün olmadı.

## Yayımlama ardıcıllığı
1. `database/migrations/2026-11-05-player-position-metadata.sql` migration-ını Supabase SQL Editor-də tətbiq edin.
2. GitHub `main` branch-ə dəyişiklikləri push edin; Vercel `khazar-league.vercel.app` frontend-i avtomatik deploy etməlidir.
3. Render backend deploy-u edin, çünki mövqe import endpoint-i və yeni metadata sahəsi backend-də dəyişib.
4. Admin panelində **Mövqələrin toplu təsdiqi** bölməsində `imports/khazar-league-position-approval-v5-full-128.json` faylını yoxlayıb tətbiq edin.
5. Admin → **Oyun təqvimi** bölməsində **Rəsmi 24 oyunu idxal et** düyməsini basın.
