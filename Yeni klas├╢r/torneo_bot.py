# -*- coding: utf-8 -*-
"""
Khazar League - Torneo assisted form filler.
The user manually opens the correct team's "Yeni oluştur" player form.
The script fills the visible form fields; the user reviews and saves.
"""
from pathlib import Path
import csv, random, re, unicodedata
from playwright.sync_api import sync_playwright

CSV_FILE = Path(__file__).with_name("oyuncular.csv")
TEAMS_URL = "https://torneo.com/app/my-competitions/46114/season/83062/teams"
PLAYERS_URL = "https://torneo.com/app/my-competitions/46114/season/83062/players"

ALREADY_ADDED = {
    "Khazar Waves": {
        "büsat əsədov",
        "məlik əliyev",
        "fuad cumayev",
        "ayxan sultanlı",
    }
}

def norm(s):
    s = unicodedata.normalize("NFKD", s.casefold())
    s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", " ", s).strip()

def read_rows():
    with CSV_FILE.open(encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))

def fill_player_form(page, first, last, number, dob):
    """
    The observed Torneo form uses placeholders, not reliably associated labels.
    Fill by the exact placeholders visible in the user's screenshot.
    """
    fields = [
        ("first name", page.get_by_placeholder("ör. Ahmet").last, first),
        ("last name", page.get_by_placeholder("ör. Yılmaz").last, last),
        ("shirt number", page.get_by_placeholder("ör. 10").last, str(number)),
    ]
    for label, locator, value in fields:
        locator.wait_for(state="visible", timeout=8000)
        locator.fill(str(value), timeout=5000)

    # Torneo's date field may be rendered as input[type=date] and may have
    # no HTML placeholder attribute even though the browser displays gg.aa.yyyy.
    date_locator = page.locator('input[type="date"]:visible').last
    if date_locator.count() == 0:
        # Fallback: date is the third input row after name, surname, position,
        # shirt number; prefer an input whose type is date or whose name/id
        # contains birth/date.
        candidates = page.locator('input:visible')
        found = None
        for i in range(candidates.count()):
            el = candidates.nth(i)
            try:
                meta = " ".join([
                    el.get_attribute("name") or "",
                    el.get_attribute("id") or "",
                    el.get_attribute("placeholder") or "",
                    el.get_attribute("aria-label") or "",
                ]).casefold()
                if any(word in meta for word in ("birth", "date", "dob", "dogum", "doğum")):
                    found = el
                    break
            except Exception:
                continue
        if found is None:
            # The form layout in the supplied screenshot places the date input
            # after the first-name, last-name and shirt-number inputs. Use the
            # visible date-like input if available; otherwise stop safely.
            raise RuntimeError("Doğum tarixi xanası tapılmadı. Tarix sahəsini əl ilə doldur, sonra davam et.")
        date_locator = found
    date_locator.wait_for(state="visible", timeout=8000)
    # HTML date inputs require ISO format; text inputs accept dd.mm.yyyy.
    input_type = (date_locator.get_attribute("type") or "").casefold()
    if input_type == "date":
        parts = dob.split(".")
        dob_value = f"{parts[2]}-{parts[1]}-{parts[0]}" if len(parts) == 3 else dob
    else:
        dob_value = dob
    date_locator.fill(dob_value, timeout=5000)

def main():
    rows = read_rows()
    teams = {}
    for row in rows:
        teams.setdefault(row["team"], []).append(row)

    print("KHAZAR LEAGUE - TORNEO FORM FILLER")
    print("Bu versiyada komanda dropdown-unu robot seçmir.")
    print("Sən düzgün komandanı və 'Yeni oluştur' formasını açırsan; robot yalnız xanaları doldurur.")
    print("Doğum tarixləri CSV-də müvəqqəti/təsadüfidir; real məlumat deyil.")
    input("Chrome açıq və Torneo hesabına daxil vəziyyətdə olsun. Başlamaq üçün Enter...")

    with sync_playwright() as p:
        browser = p.chromium.connect_over_cdp("http://127.0.0.1:9222")
        context = browser.contexts[0]
        page = context.pages[0] if context.pages else context.new_page()
        page.goto(PLAYERS_URL, wait_until="domcontentloaded")

        for team, roster in teams.items():
            print(f"\n========== {team} ==========")
            for row in roster:
                first = row["first_name"].strip()
                last = row["last_name"].strip()
                full = (first + " " + last).strip()
                key = norm(full)

                existing = {norm(x) for x in ALREADY_ADDED.get(team, set())}
                if key in existing:
                    print(f"[KEÇİLDİ - ARTİQ VAR] {full}")
                    continue
                if team == "Khazar Waves" and norm(first) == norm("Məlik"):
                    print(f"[KEÇİLDİ - ARTİQ VAR] {full} (Torneo-da Məlik Əliyev kimi var)")
                    continue

                number = random.randint(1, 99)
                dob = row.get("birth_date", "").strip()
                if not dob:
                    print(f"[DAYANDI] {full}: CSV-də doğum tarixi yoxdur.")
                    input("CSV-ni düzəlt, sonra Enter...")
                    continue

                print(f"\nNÖVBƏTİ OYUNÇU: {full} | Forma № {number} | {team}")
                input(
                    f"1) Torneo-da '{team}' komandasını seç.\n"
                    "2) 'Oyuncu ekle' bas.\n"
                    "3) 'Yeni oluştur' seç və boş oyunçu formasını aç.\n"
                    "4) Forma açıq olanda burada Enter bas. Robot xanaları dolduracaq..."
                )

                try:
                    # Ensure the player form is open and fill only its visible fields.
                    fill_player_form(page, first, last, number, dob)
                    # Country is already Azerbaijan by default in the user's screenshot.
                    print(f"[DOLDURULDU] {full}. Ölkə Azərbaycan olaraq saxlanıldı.")
                    print("İndi brauzerdə məlumatları yoxla və 'Oyuncu ekle' düyməsini özün bas.")
                    input("Qeydiyyat tamamlanıb siyahıya qayıdandan sonra Enter...")
                    ALREADY_ADDED.setdefault(team, set()).add(full)
                except Exception as e:
                    print(f"[XƏTA] {e}")
                    input("Xanaları əl ilə tamamla, siyahıya qayıt və Enter bas...")

        print("\nBütün siyahı yoxlanıldı.")
        print("Chrome pəncərəsi açıq saxlanılır.")
        # Do not close user's browser.
        browser.close()

if __name__ == "__main__":
    main()
