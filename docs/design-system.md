# NANDI design system (v2)

NANDI is opened at night instead of Reels. It should feel like a calm, premium object: soft depth, generous space,
one clear action per card, warm colour used on purpose. No hairline borders on everything, no grey slabs.

## 1. Principles
1. **One thing per screen.** Each card has one title, one line of context, one primary action.
2. **Depth, not lines.** Separate things with surface levels and soft shadows; borders only on inputs.
3. **Colour means something.** Each area owns a hue (Do = saffron, Move = coral, Think = violet, Notice = sky,
   Learn = teal, Extra = lime, Night = indigo). Use it for the card's glyph, progress and focus, never for body text.
4. **Big, quiet type.** Headings in Bricolage Grotesque, body in DM Sans. Few sizes, used consistently.
5. **Calm motion.** Short, soft transitions; nothing bounces; everything off under reduced motion.

## 2. Colour tokens

### Dark (default)
| Token | Value | Use |
|---|---|---|
| `--bg` | `#0E0F12` | page |
| `--surface-1` | `#16171C` | cards |
| `--surface-2` | `#1E2027` | raised rows, inputs, chips |
| `--surface-3` | `#272A33` | pressed, selected |
| `--ink` | `#F4F0E8` | primary text (16.6:1 on surface-1) |
| `--ink-2` | `#C9C3B8` | secondary text (10.5:1) |
| `--ink-3` | `#9A958C` | captions, meta (6.1:1) |
| `--accent` | `#FFB25B` | primary action, active state |
| `--on-accent` | `#1A1206` | text on accent buttons (10.9:1) |
| `--teal` | `#5FD4C0` | success, learn, progress |
| `--danger` | `#FF8A80` | destructive |
| `--focus` | `#FFD08A` | focus ring |
| `--shadow-1` | `0 1px 0 rgba(255,255,255,.04) inset, 0 8px 24px rgba(0,0,0,.35)` | cards |
| `--shadow-2` | `0 1px 0 rgba(255,255,255,.06) inset, 0 16px 40px rgba(0,0,0,.45)` | deck card, sheets |

### Light ("warm paper")
| Token | Value |
|---|---|
| `--bg` | `#F6F1E7` |
| `--surface-1` | `#FFFCF6` |
| `--surface-2` | `#F1EADD` |
| `--surface-3` | `#E7DDCC` |
| `--ink` | `#1F1B16` (15.8:1) |
| `--ink-2` | `#4D463C` (9.0:1) |
| `--ink-3` | `#6E665A` (5.6:1) |
| `--accent` | `#C9700F` (buttons; text on it `#FFFFFF` 4.6:1) |
| `--accent-ink` | `#8A4A06` (accent text 6.9:1) |
| `--teal` | `#0F6E61` |
| `--danger` | `#A8322A` |
| `--focus` | `#8A4A06` |
| `--shadow-1` | `0 1px 2px rgba(60,40,10,.06), 0 8px 24px rgba(60,40,10,.08)` |
| `--shadow-2` | `0 2px 4px rgba(60,40,10,.06), 0 18px 40px rgba(60,40,10,.12)` |

### Night deck (applied with `.deck-night`, overrides dark)
`--bg #0B0D16`, `--surface-1 #131726`, `--surface-2 #1A1F33`, `--ink #E6E4F0`, `--ink-2 #B4B1C6`,
`--accent #9FA8FF` (soft indigo; buttons use `--surface-2` with indigo text, never a bright fill).

### Area hues (glyph, progress, focus tint)
Do `#FFB25B` · Move `#FF8A6B` · Think `#B39DFF` · Notice `#7CC4FF` · Learn `#5FD4C0` · Extra `#C6E36A` · Night `#9FA8FF`.
Light-mode versions are darkened to reach 3:1 against `--surface-1` for glyphs.

## 3. Type scale
| Role | Font | Size / line | Weight |
|---|---|---|---|
| Display (screen title) | Bricolage | 32 / 36 (clamp 28–34) | 800 |
| Card title | Bricolage | 26 / 30 | 800 |
| Section heading | Bricolage | 19 / 24 | 700 |
| Body | DM Sans | 16 / 24 | 400 |
| Body strong | DM Sans | 16 / 24 | 600 |
| Small | DM Sans | 14 / 20 | 500 |
| Caption / eyebrow | DM Sans | 12 / 16, letter-spacing .08em, uppercase | 600 |
Never use more than three sizes on one card.

## 4. Space, radius, size
- Spacing scale (4 px grid): 4, 8, 12, 16, 20, 24, 32, 40, 56. Page gutter 16 px (phones), card padding 20 px.
- Radii: 10 (chips, inputs), 16 (rows, buttons), 24 (cards), 28 (deck card, sheets), 999 (pills).
- Tap targets ≥ 48 px high for primary/secondary buttons, ≥ 44 px for everything else.

## 5. Motion
- 160 ms ease-out for press and hover; 240 ms cubic-bezier(.2,.8,.2,1) for cards and sheets; completion check 420 ms.
- Deck card change: 12 px slide + fade. No bounce, no scale above 1.02.
- All motion off under `prefers-reduced-motion: reduce` and `html[data-motion="reduce"]`.

## 6. Components
- **Button / primary:** surface `--accent`, text `--on-accent`, 48 px, radius 16, weight 600, pressed = 4% darker + 1 px down.
- **Button / secondary:** surface `--surface-2`, text `--ink`, no border.
- **Button / ghost:** transparent, text `--accent` (light: `--accent-ink`), used for "Not now", "Skip".
- **Card:** `--surface-1`, radius 24, `--shadow-1`, padding 20, no border.
- **Deck card:** `--surface-1`, radius 28, `--shadow-2`, min-height 0; top row = area glyph in a 36 px rounded square
  tinted with the area hue at 16% + eyebrow; then title, one line of context, content; actions pinned to the bottom.
- **List row:** `--surface-2`, radius 16, 56 px min height, title + meta, trailing action or chevron.
- **Chip:** `--surface-2`, radius 10, 32 px high; selected = area hue at 20% + hue text.
- **Input / select:** `--surface-2`, 1 px border `rgba(255,255,255,.06)` (light: `rgba(0,0,0,.08)`), radius 10, 48 px.
- **Progress bar:** 6 px track `--surface-3`, fill area hue, radius 999.
- **Toggle:** 52×32 track, thumb 26 px; on = `--accent`.
- **Sheet:** bottom sheet, radius 28 top corners, `--shadow-2`, drag handle 36×4.
- **Tab bar:** `--surface-1` at 92% with backdrop blur, top shadow, 64 px; active tab = accent text + 4 px dot.
- **Section header:** caption eyebrow + section heading, 24 px above, 12 px below.
- **Focus:** 3 px outline `--focus`, offset 2 px, on `:focus-visible` only.
