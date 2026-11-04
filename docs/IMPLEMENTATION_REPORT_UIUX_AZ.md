# Khazar League 2.0 — UI/UX and Roster Update

- Reviewed the user's supplied roster workbook: 16 team worksheets plus the consolidated sheet, 128 player rows, 8 players per team.
- Compared Excel players to existing JSON database records by team, full name and jersey number: 128/128 matched; no missing or duplicate roster rows found.
- Position roles were not guessed from broad categories. 97 records are flagged for Super Admin review; 24 Excel-exact categories and 7 user-confirmed Khazar Waves roles are coded.
- Khazar Waves roles preserved from user confirmation: Fuad Cumayev ST, Büsat Əsədov LW, Ayxan Sultanlı RW, Məmməd Məmmədli CAM, Əli Manaflı CB, Ziyad Hacızadə CB, Məlik Əliyev GK. Yusif Mehdizadə remains pending exact defender role.
- The workbook says Fuad Cumayev LW; the user's explicit prior confirmation ST was retained.
- Məmməd Məmmədli exists once in the Khazar Waves roster. The prior MAMED alias has not been merged as a second record; identity confirmation is still pending.
- Added public team profile lineup bench display, role codes, captain marker and requested 6-a-side formation presets.
- Added admin position code selection and backend role normalization for Super Admin edits.
- Applied a unified dark-only design token system to public pages, profile pages and admin workspace.
- Added a Pro Max master design system and a Supabase migration file for later deployment. Migration has not been applied to any hosted database.
- No Vercel, Render, GitHub or Supabase deployment/push was performed.
