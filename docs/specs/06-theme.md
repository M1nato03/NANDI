# 06 · Theme: The Proving Ground

Evidence: `docs/research-brief.md`, section "The Proving Ground: an original ladder built from genre, not franchise".

Jenil loved a friend's Blue Lock-themed workout app: UI-heavy, competitive, ranked, dramatic. We take the **genre** (sports-anime "selection ladder" energy) and build something **fully original**:

- Copyright protects expression, not ideas or style. WIPO says so, and India's *R.G. Anand* ruling held that ideas, themes and plots are unprotected.
- Characters, names, logos and screenshots *are* protected.
- India has no clear fan-art safe harbour.

Game fiction was one of the two moderators that improved behavioural outcomes in the main meta-analysis (the other was competition combined with collaboration), so this layer does real work.

## 1. The fiction

- **The Proving Ground:** a 500-seat selection programme. Jenil starts as **candidate #500**. The brief said 300; 500 keeps clear of one franchise's signature premise. Each season is an **Arc** (4–5 weeks). The daily logic-grid cases chain into the Arc's mystery story.
- **The coach persona: "Sarthi, the Selector".**
  - An original character: a calm, sharp voice behind a visor, shown as a stylised silhouette with no recognisable likeness.
  - *Sarthi* means charioteer, a quiet nod to the Gita's charioteer-mentor that fits the lessons, without religious imagery.
  - Sarthi speaks in short coach lines. Jenil can rename the coach in settings.
- **Tiers:** Bench (#500–301) · Challenger (#300–151) · Contender (#150–51) · Elite (#50–11) · Ace (#10–2) · Apex (#1).
- **Six stats** on a hexagon: **Drive** (tasks), **Body** (training), **Mind** (puzzles), **Recall** (cards), **Wisdom** (lessons), **Discipline** (bedtime and consistency).
- **Ghost rivals:** 499 original rival candidates with generated names and simple original avatar marks (initials on shapes). One named rival sits just above him each week.
- **Moments:**
  - "Matchday" scoreboard card after a workout;
  - "Rank assessment" for the placement tests;
  - "Stat reveal" at level-ups and season end;
  - "Arc finale" when Sunday's case closes the chapter.

## 2. Visual language

**Colour tokens.** Dark is the default, because he uses the app at night. A light variant is provided for daylight. Define them as CSS variables on `:root`, with `prefers-color-scheme` plus an in-app override.

| Token | Dark | Light | Use |
|---|---|---|---|
| `--bg` | #0A0C10 | #F3F4EF | page |
| `--surface` | #12161E | #FFFFFF | cards |
| `--raised` | #1A202B | #E9EBE4 | inputs, chips |
| `--line` | #263042 | #D3D7CC | borders |
| `--ink` | #EEF2F7 | #10141A | text |
| `--muted` | #8A96A8 | #5A6473 | secondary text |
| `--accent` | #C8FF2E (acid lime) | #3F6600 | primary actions, progress, the "electric" feel |
| `--ember` | #FF5B2E | #A8320E | rank-ups, promotions, macro moments |
| `--gold` | #FFC531 | #7A5400 | PRs, perfect streak |
| `--mind` | #A78BFA | #5B3FD1 | Mind mode tint |
| `--danger` / `--ok` | #FF6B6B / #3DDC97 | #B3261E / #17784A | errors / success |

Every accent above passes WCAG AA (≥4.5:1) as text on `--bg`, `--surface` and `--raised` in its mode. Re-check any new pair. Lime is not a text colour on light backgrounds; use the light-mode value.

**Type** (all SIL OFL; self-host; **check each licence file**):

- **Display:** *Big Shoulders Display* (heavy, condensed) for rank numerals, headers and badges. Add speed with a `skewX(-8deg)` style. Uppercase only for short labels.
- **Body:** *Inter*, with tabular numerals for timers and stats.
- **Mono:** *JetBrains Mono* for small data labels.
- **Alternatives:** Anton, Bebas Neue, Oswald, Barlow Condensed.

**Motifs:**

- **Diagonal slashes at about 14°** as the layout signature: card corners, section dividers, progress bars.
- **Halftone screentone** dots as a subtle texture on hero areas (≤6% opacity; off in reduced-motion and low-power mode).
- **Radial concentration lines** for macro moments only.
- **Giant rank numerals** (`#452`) as the hero of the Ground tab.
- **Jersey-style level badges.**
- **"Matchday" scoreboard cards** for workouts and season results.
- **Hexagon stat chart**, animated on reveal.

**Icons:** Lucide or Tabler (ISC/MIT), outline style. **App icon:** an original mark (a lime diagonal slash cutting a dark rounded square, with a small "#" notch). No resemblance to any franchise logo.

**Exercise illustrations:** original stick figures in the theme's line style (lime strokes on dark), used for custom ladder steps and optionally all exercises.

## 3. Motion, sound, haptics

| Tier | When | Motion | Haptic | Sound |
|---|---|---|---|---|
| Micro | Every check-off, cell placement, set logged | 100–200 ms scale/tick | 10 ms | none by default |
| Meso | Task done, puzzle solved, workout logged | 400–800 ms: XP counts up, bar fills with slight overshoot | [20, 40, 20] | soft "thock" if sound is on |
| Macro | Level-up, tier promotion, season end, Arc finale | 1.2–2.5 s full-screen stat reveal, concentration lines, rank numeral slam | [30, 60, 30, 60, 80] | short sting if sound is on |

- **Rules:**
  - Macro moments are always skippable; max 2 a day; only for real-world actions.
  - Animate only `transform` and `opacity`.
  - **Reduced motion** (`prefers-reduced-motion` or the in-app toggle): fades replace slides, slams and speed lines.
  - Scripture cards use micro only.
- **Sound** is **off by default** (hostel). Onboarding asks "Want sound effects?". Sound is always off in wind-down and lights-out and respects silent mode. A "sound pack" is a Shards item.
- **Haptics** have their own toggle. Patterns use `navigator.vibrate`, with Capacitor Haptics impact styles as the fallback (`01-architecture.md` §6).

## 4. Screens: key looks

- **Today:**
  - The Now card dominates: task title in display type, a ring countdown, the first-step line, and an overtime counter in ember.
  - A Next strip below.
  - A slim header with level badge, stamina-pip streak and season rank.
- **Ground:**
  - A giant `#452` with the tier name.
  - "+14 places this week".
  - Rival card: "Next: R. Mehta · 120 SP ahead".
  - Hexagon, streak and Clean Week row, Shards and shop, Backup, Settings.
- **Train session:** set rows as big tappable strips; rest timer as a full-width ring; the Matchday card at the end (sessions this week, PRs, ladder steps).
- **Mind:**
  - The Daily Drop as a "match card" with 4–5 slots that fill in as he completes them.
  - The Arc story panel strip.
  - Stopping screen: "Today's drop complete. Next drop: 7:00".
- **Night:** dimmed palette (`--accent` desaturated); Sarthi's lights-out line; one big "Lights out" button.

## 5. Voice and copy

- **Sarthi's voice:** brief, direct, warm. Never shaming, sarcastic or "you should". Indian English, everyday words. Praise is specific and informational.
- **Examples:**
  - Done on first day: "Said it, did it. ×1.5."
  - Postpone #2: "Make it smaller. First 10 minutes?"
  - Missed day: "Yesterday didn't go to plan. That's data, not a verdict. Pick one Must."
  - Streak paused: "Streak paused. Life happens. Two Hat-trick days in 48 h restores it."
  - Rank up: "Into Contender. #96. Keep the rhythm."
  - Pain button: "Stopped. Smart call. Try the easier step next time."
  - Lights-out: "Day closed. Sleep is where today gets saved."
  - Over budget: "Six this week. Quick reason?"

## 6. IP guardrails

| Use freely (genre, idea, style) | Never use |
|---|---|
| Near-black field + one electric accent + one ember accent | The words **"Blue Lock", "Ego", "Egoist"**; any team or character names from any series |
| Diagonal slashes, halftone, concentration lines | The series logo or its letterforms |
| Heavy condensed italic display type (OFL fonts) | Silhouettes, hairstyles or jerseys that echo a known character |
| Giant rank numerals, jersey-style badges | Screenshots, traced panels, or AI images prompted to resemble a series |
| A large selection ladder (we use 500 seats) | A 300-candidate selection programme (that series' signature premise) |
| Matchday scoreboards, hexagon stat reveals | A series' signature colour pairing used to evoke it; its in-show ranking layouts |
| "Selection programme", "ladder", "arc", "candidate" | Trademarked puzzle names: Queens, Tango, Zip, KenKen (use Crowns, Sun & Moon, Number Path, Calcudoku) |

A private app on one phone carries little practical risk. The original theme is what keeps a later Play Store release possible.

## 7. Accessibility checklist

- AA contrast for all text in both modes.
- Tap targets ≥ 44 px.
- Font scaling up to 130% without layout breaks.
- Labels on every icon button.
- Never rely on colour alone (puzzle regions also get thin borders; sun and moon are different shapes).
- Reduced motion honoured.
- Haptics and sound toggles.
- No flashing above 3 times a second.
