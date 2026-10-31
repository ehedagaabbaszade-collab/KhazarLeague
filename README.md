# Khazar League 2026

Khazar League management platform built on the existing Express + JSON database + React/Vite project.

## Confirmed source data imported

The original user-provided `khazar-league-ehtiyat-nusxe (1)(1).json` is preserved as `data/khazar-league-source.json`.

The database import preserves:
- 16 teams and their exact IDs/names
- 128 registered player records
- 4 group assignments
- 24 original group fixtures and IDs
- All 16 original team logos as image files under `uploads/teams/`
- Original registration-status and coordinator fields where present

The JSON has no match dates, kickoff times, venue, or completed scores. These remain unset. Its knockout array is empty and remains empty. No missing player or match data is fabricated.

Private phone numbers and student-ticket identifiers are stored in the database but are not returned by public endpoints. The source JSON is retained for exact data provenance; do not expose it as a public static asset.

## Run on Windows

Requirements: Node.js 18+.

1. Extract the project to `C:\KhazarLeague`.
2. Run `START_KHAZAR_LEAGUE.bat`.
3. Open `http://localhost:4173`.
4. Admin login: `http://localhost:4173/login`.

The existing initial administrator is `admin@khazar.org`. The initial password from the supplied project is `KhazarLeague2024!`. Change it before publishing the platform on the internet.

## Development

Backend:
```cmd
node backend\server.js
```

Frontend:
```cmd
cd frontend
npm install
npm run dev
```

Data integrity tests:
```cmd
npm test
```

Frontend production build:
```cmd
cd frontend
npm run build
```

## Implemented in this delivery

- Dark Sports Dashboard visual system, responsive layout, Azerbaijani UI
- Public tournament home page with actual team names, original logos, groups and fixtures
- Admin dashboard
- Team, player, match, tournament, season, award, announcement, document and media-template management screens
- Manual match score entry and result locking
- Weekend-only automatic schedule generator; admin selects start date, kickoff, daily match count and interval
- Group standings recalculation from completed matches only
- Correct 3/1/0 points and configured tie-break sequence
- Super Admin user creation for admin, captain and player account roles
- Individual permission assignment and backend permission enforcement
- Knockout progression from quarter-finals to semi-finals, final and third-place match
- Penalty shootout validation for tied knockout matches
- Automatic team awards after final and third-place matches
- Tournament settings for team/player limits, match duration, weekend schedule and registration/payment mode
- Sponsor management and public sponsor section
- PDF/DOCX document upload with file-size/type validation
- Canvas-based Instagram post/story editor with PNG export and server-side media archive
- Captain and player read-only cabinet entry points
- Server-side authentication checks for protected API routes
- Public API responses exclude phone numbers and student-ticket data
- Original data and logo integrity tests

## Remaining integrations / next implementation phase

The current delivery is a working core and data-integrity foundation, not a claim that every advanced module is production-finished.

Still requiring a dedicated implementation and testing phase:
- Full online team registration application workflow and waiting list
- Payment provider integration (requires provider credentials); manual receipt review UI
- Layer-based design editor, template editing and JPG export in Media Studio (current canvas editor supports editable text/format/accent color and PNG export)
- PDF/DOCX document generation and signature-sheet templates (upload/download is implemented)
- Email and WhatsApp delivery integrations (require API credentials)
- Full role-permission matrix UI is implemented; audit-log viewer remains pending
- Season cloning and full season archival workflows
- Advanced public player profile pages and team detail routes

Do not treat an integration as connected until valid credentials are supplied and a delivery test succeeds.
