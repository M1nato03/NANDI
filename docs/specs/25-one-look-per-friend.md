# Spec 25 · One look per friend (area looks)

Status: **proposal, waiting for Jenil's yes.** The idea is Jenil's (24 Oct 2026). Visual comparison:
https://claude.ai/artifact/HZCrkxxrPm8nYEj5kNeGMu (private to Jenil).

## The problem (measured on batch6 bc0458f, 360 px, fresh profile, light and dark)
- Plan, Train, Learn and Mind share one background, one card style and one orange heading label.
- The main button is the same orange-brown on Train and Mind. On Learn, the area colour appears only on one small Start button.
- Area colours already exist as tokens (`--area-do`, `--area-move`, `--area-learn`, `--area-think`, `--area-night` in
  src/ui/theme.css), but they show only in the tab icon and a few accents.
- Train has no friend on screen. Learn has none at the top. Mind's Kapi is 48 px. Only Plan's courtyard is big.
Jenil: "the whole seems like a brick … the mind has to work more to differentiate between different groups."

## What testing the two options showed
Jenil offered (A) the friend's own colour and (B) the opposite colour, so the friend stands out.
- A: three friends are brown (Chiku, Kapi, Kachhua), so three areas look alike. Nandi and Moti fade into their own colour
  (1.4 to 1 contrast).
- B: the six areas look different, but Moti, Chiku and Kapi still blend in (1.2, 1.3 and 1.8 to 1), because an
  opposite colour at the same lightness gives almost no contrast.
- What makes a friend stand out is lightness. Four of the six friends are mid-tone, so the background must be clearly
  lighter or clearly darker than the friend.

## The proposal (version C)
1. **One colour per area.** These are B's hues, five of them close to today's tokens:

| Area | Friend | Colour | Stage (both themes) | Friend body vs stage | Today |
|---|---|---|---|---|---|
| Plan | Mor | marigold | #FAD27A | 4.3 : 1 | orange (do) |
| Train | Nandi | leaf green | #357A42 | 4.8 : 1 | coral (move) |
| Learn (new ideas) | Chiku | teal | #0B3F3A | 3.6 : 1 | teal (learn) |
| Idea checks (review) | Moti | rose | #7A2440 | 4.8 : 1 | teal, shared with Learn |
| Mind | Kapi | violet | #E4DDFF | 3.6 : 1 | violet (think) |
| Night | Kachhua | indigo | #AEB6FF | 6.1 : 1 | indigo (night) |
| You | none | neutral | none | none | blue (notice) |

2. **A friend stage at the top of each tab.** The friend is about 120 px on a band in the area colour. The band is light
   behind a dark friend and deep behind a light friend, at 3 : 1 or more against the friend's body colour (WCAG 2.2
   1.4.11). The stage colour is the same in light and dark mode, because the friends keep fixed colours in both
   (Cast.tsx). On a deep stage the friend gets a 2 px light rim, so its dark outline still reads.
3. **The rest of the screen carries the colour gently:** a tinted background, the main button, progress bars, the
   heading label and the active tab. Cards stay near-neutral. Text is 4.5 : 1 or more on every surface, and button text
   4.5 : 1 or more on the button.
4. **Each friend wears one small thing in their area colour**, taken from their courtyard corner (spec 12): Mor a
   marigold, Chiku a teal satchel, Kapi a violet kite, Moti a rose tassel, Kachhua an indigo lantern, Nandi a green band.
   Nandi keeps his orange scarf. This ties friend and colour together.
5. **Inside an area, screens keep its colour.** A Learn lesson stays teal. Idea checks and Gold review switch to Moti's
   rose, so new and review look different.

## What does not change
- Layout, type, spacing and the tab bar. Only colours and the friend's size change.
- Right and wrong answers keep their own colours plus a word or icon. Colour is never the only signal (WCAG 1.4.1).
- No colour means "bad". Nothing on screen shrinks or turns grey on a missed day.
- The night deck stays dark. Reduced motion, both themes and the high-contrast checks keep working.
- Economy, XP, storage and backups: nothing changes. It is a pure look change.

## Build notes for the builder (after Jenil's yes)
- Tokens: one `[data-area="plan|train|learn|review|mind|night"]` block per area that sets `--area`, `--area-stage`,
  `--area-tint`, `--button` and `--on-accent` for light and dark. The shell sets `data-area` from the route. Lessons and
  drops set `review` when they show Moti.
- A `FriendStage` component (friend, pose, optional caption) replaces the small inline cast on Plan, Train, Learn, Mind
  and the night deck. Plan keeps its courtyard scene as its stage.
- The 6 accessories are small SVG additions in Cast.tsx, one per friend, in all 4 poses.
- Shop themes (`data-economy-theme` linen and lagoon): see decision 3.
- Gate: a contrast unit test over every area token pair in both themes (text 4.5, button text 4.5, friend body vs stage
  3.0), and Playwright screenshots of the 5 tabs in light and dark.

## Offline and online
- **v1 (offline):** everything above.
- **v2 (online):** seasonal stage scenes (Diwali lights, monsoon) that arrive with content-pack updates and follow the
  same contrast rules. No server is needed for the look itself.

## Kill test
After two weeks on Jenil's phone: if he still can't tell which tab he is on from a glance at a screenshot with the tab
bar cropped out, or if any screen reads worse, revert to today's neutral screens and keep only the bigger friends.

## Decisions for Jenil
1. Version A, B or C (recommended: C).
2. Idea checks in Moti's rose, or kept in Learn's teal (recommended: rose).
3. Shop themes: change only the neutral background and leave area colours alone (recommended), or turn area colours off
   while a shop theme is on.
4. Train in leaf green, or another colour for Nandi.
