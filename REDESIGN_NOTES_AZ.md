# Khazar League — Yenilənmiş dizayn

## Görülən işlər
- İctimai ana səhifə Modern Minimal istiqamətində yenidən quruldu.
- Navy + elektrik mavisi rəng sistemi və ağ/tünd rejim əlavə edildi.
- Rəsmi Khazar League loqosu olduğu kimi `frontend/public/khazar-league-logo.jpg` faylına yerləşdirildi.
- Ana banner, matç mərkəzi, qrup blokları, vizual komanda kartları, xəbər/jurnal bölməsi və azarkeş zonası üçün yeni görünüş hazırlandı.
- Matç kartı mövcud matç tarix/status məlumatına əsasən ən uyğun oyunu seçir və başlanğıca geri sayım göstərir. Matç tarixləri təyin edilməyibsə, saxta tarix yaratmır.
- PWA manifesti, Apple touch icon və minimal service worker əlavə edildi.
- Mövcud API, backend, admin səhifələri, məlumat faylları və komanda loqoları dəyişdirilməyib.

## Məlumatların qorunması
- Bu yenilənmə Supabase-ə qoşulmur və uzaq verilənlər bazasına heç bir yazma/silmə əməliyyatı etmir.
- Xəbərlər, komandalar, oyunçular, matçlar və yüklənmiş loqolar layihədə olduğu kimi saxlanılıb.
- `data/` və `uploads/` qovluqları arxivdə saxlanılıb.
- Canlı saytda hazırda olan məlumatlar yenə də canlı Supabase mənbəyindən gəlməlidir; bu paket həmin bazanı dəyişmir.

## Məhdudiyyətlər / növbəti iş
- MVP səsverməsi, proqnozlar və sorğular üçün server API-ləri bu mənbə paketində hazır görünmədiyindən, vizual azarkeş zonası hələ aktiv səs yazmır.
- Google/Apple OAuth provayderləri və push notification server konfiqurasiyası ayrıca qurulmalıdır.
- Matç tarixləri bazada boşdursa, geri sayım üçün admin paneldən tarix/saat daxil etmək lazımdır.
- Bu mühitdə frontend asılılıqlarını quraşdırmaq vaxt məhdudiyyətinə düşdüyündən `vite build` təsdiqlənməyib. Windows-da `npm ci --prefix frontend` və `npm run build --prefix frontend` ilə yoxlanmalıdır.
