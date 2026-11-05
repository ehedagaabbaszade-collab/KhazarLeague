# Mövqelərin toplu təsdiqi — istifadə qaydası

1. Layihənin ehtiyat nüsxəsini saxlayın.
2. Backend və frontend-i adi qaydada başladın.
3. Super Admin hesabı ilə daxil olun.
4. Sol menyudan **Mövqe təsdiqi** bölməsini açın.
5. `imports/khazar-league-position-approval-v5-full-128.json` faylını seçin.
6. **Faylı yoxla** düyməsini basın. Sistem 16 komanda və 128 oyunçunun hamısını mövcud bazadakı qeydlərlə uyğunlaşdırmalıdır.
7. Yoxlama uğurludursa, **Təsdiqləri tətbiq et** düyməsini basın.

Tətbiqdən əvvəl server `backups/` qovluğunda bazanın timestamp-li ehtiyat nüsxəsini yaradır. Mövcud oyunçu ID-ləri, əlaqə məlumatları, qeydiyyat və digər profil sahələri saxlanılır; yalnız mövqe metadatası yenilənir. Supabase konfiqurasiya olunubsa, mövcud JSON-state sinxronizasiya mexanizmi ilə dəyişiklik uzaq bazaya da yazılır.

**Vacib:** Faylda mövqelər ingilis dilində (GK, DF, MF, FW və konkret rollar üçün LW, RW, CDM, CF) göstərilir; mənbədəki Azərbaycan dilində mövqe adı da saxlanılır. Bu bölgü ilkin/provisional xarakter daşıyır. Sonradan admin panelindən oyunçuların mövqelərini dəyişmək mümkündür. Import zamanı heç bir oyunçu yaradılmır və silinmir; 128 oyunçunun hamısı mövcud bazada tapılmasa, import dayandırılır və məlumat dəyişdirilmir.
