# Khazar League 2.0 — Master Design System

Source methodology: UI/UX Pro Max (NextLevelBuilder, MIT repository), locally available project skill and its searchable catalogs. Repository README and guidance reviewed before implementation.

## Product profile
- Product type: Sports Team/Club + Tournament Management.
- Core audience: university football fans, team representatives, Super Admin.
- Platform: responsive React web application.
- Visual direction: premium dark sports broadcast + motion-driven sports UI + restrained glassmorphism.
- Theme: dark only; no theme switch.
- Language: Azerbaijani. Position abbreviations remain international.

## Visual tokens
- Deep Navy background: `#06111F`
- Elevated navy: `#091A2B`
- Graphite/blue surface: `#0C2034`
- Secondary surface: `#102941`
- Electric Blue: `#27A9F2`
- Cyan: `#63D4F5`
- White: `#F4F8FC`
- Soft Gray: `#9BB0C3`
- Silver: `#C6D4DF`
- Success: `#37C98A`
- Warning: `#F3BD59`
- Danger: `#FF647B`
- Borders: `rgba(130,184,222,.18)`
- Glass blur: 16px, used only where it clarifies layered surfaces.

## Typography
- Display/headings: Barlow Condensed (sports/fitness pairing recommended by Pro Max).
- Body: Barlow.
- Numeric IDs / compact stats: tabular numerals; monospace only for technical identifiers.
- Body copy 16px minimum on mobile; avoid overly tight line-height.

## Layout and components
- 4/8px spacing rhythm.
- 10/16/22px radius scale.
- One primary action per screen; secondary actions remain visually subordinate.
- Shared navigation, cards, forms, tables, badges, empty states, loading states, error states.
- Sidebar desktop; collapsible/mobile navigation at narrow widths.
- Tables remain readable and horizontally contained; mobile gets stacked or scroll-contained presentation.
- Team profile contains pitch, starters, substitutes, squad list and stats.
- Pitch is a 6-player display for the current 6+2 tournament; 11-a-side presets remain available for future formats.

## UX and accessibility rules
- Text contrast target at least WCAG AA 4.5:1 for normal text.
- Visible keyboard focus ring and semantic labels.
- Touch targets at least 44px where practical, with spacing between controls.
- Drag interactions must have click/tap and keyboard alternatives.
- Reduced-motion preference must be respected.
- Never rely on color alone for status; include text labels.
- Do not use emoji as interface icons; use the existing icon system/SVG.
- Use skeleton/clear loading and inline error feedback.
- Avoid layout shifts by reserving image/pitch dimensions.
- No fake live status, no invented fixtures, results, player roles or statistics.

## Motion
- Short 150–250ms state transitions.
- Motion communicates selection, navigation or feedback.
- Avoid continuous decorative animation on data-heavy admin pages.
- Disable nonessential motion under `prefers-reduced-motion`.

## Data integrity
- Existing teams, players, match records and user accounts must be preserved.
- Excel is the roster source of truth for names, jersey numbers, birth dates, nationality, preferred foot and captain flags.
- Broad player position categories are not automatically converted to specific roles.
- Uncertain roles stay in `needs_admin_review`.
- Khazar Waves user-confirmed roles override conflicting generic Excel labels.
- Never merge the MAMED alias with Məmməd Məmmədli without user confirmation.
