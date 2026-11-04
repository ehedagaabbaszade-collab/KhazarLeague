# Khazar League 2.0 — UI/UX Pro Max Design System

## Methodology source
Applied from the public `nextlevelbuilder/ui-ux-pro-max-skill` repository. The repository describes a workflow of requirements analysis, design-system generation, targeted UX/style guidance, stack-specific implementation, and pre-delivery anti-pattern checks. This project uses React + Vite and a dark sports tournament platform archetype.

## Product direction
Premium football competition portal + operations console. Dark-only. Azerbaijani UI. Responsive desktop/tablet/mobile. No live score UI; only admin-confirmed completed match information.

## Tokens
- Canvas: `#050b14`
- Elevated canvas: `#071321`
- Surface: `#0b1522`
- Surface raised: `#101f30`
- Border: `#20344a`
- Primary text: `#f2f7fc`
- Muted text: `#8fa4b9`
- Electric blue: `#2aa9f5`
- Cyan: `#54c4ff`
- Success: `#38c99a`
- Danger: `#ff667d`
- Typography: Barlow + Barlow Condensed
- Radius: 7–18px depending on control/card hierarchy
- Motion: 140–420ms, reduced-motion respected

## Layout principles
- Public portal: editorial sports landing page, compact sticky navigation, strong display headline, fixture control panel, real data stats, group tables, club cards, news and footer.
- Admin: persistent dark operations sidebar, sticky top bar, dense but readable data workspace, consistent dark tables/forms/modals.
- Responsive: desktop sidebar collapses to icon rail on narrow screens; public navigation becomes a compact menu; grids collapse to one column on phones.

## UX requirements
- Visible focus states for keyboard users.
- High-contrast text and clear active/hover states.
- No decorative fake live indicators.
- Real database values only; no fabricated scores, dates or player data.
- Respect reduced-motion preference.
- Preserve touch-friendly controls and horizontal table overflow where necessary.
