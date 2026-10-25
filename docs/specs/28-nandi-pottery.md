# 28. Nandi's pottery: your training shapes a bowl

Status: PARKED by Jenil, 25 Oct 2026: "keep [Train] as it is for now and work on other mascots" (he meant the Train category, not Nandi the mascot). Do not build.
Idea engine, 25 Oct 2026. Research: D:\nandi-gate-logs\idea-engine\codex-kintsugi.md (cloud-sessions item 86).

## Why

Jenil, 25 Oct: "No one keeps their phones with them in places like the gym, so standalone option 2 (kintsugi) is
good. Work out these options with this in mind." He rejected bol sets, the steady diya and the shadow play,
because each needed the phone during the workout.

So nothing here needs the phone while you train. The game lives in a 10-second log afterwards. The in-app
guided sessions feed it automatically.

## The game

- Nandi keeps a potter's wheel. Every training session logged is one shaping step on this week's bowl.
- **The kind of training shapes the clay:**

  | Training | What it does to the clay |
  |---|---|
  | Legs | Raises the walls. |
  | Push | Widens the mouth. |
  | Pull | Curves the neck. |
  | Core | Thickens the base. |
  | Cardio | Adds rings. |
  | Mixed | A little of each. |
  | Rest (logged on purpose) | Smooths the surface. |

- After 6 shaping steps the bowl is fired. It comes out glazed in the month's tradition, rotating through
  celadon, Moroccan cobalt, Talavera, Iznik, blue-and-white, Delft and raku. Each style has a one-line
  description from the research report. Nandi never calls a tradition "ancient wisdom".
- Finished bowls go on Nandi's shelf. Every bowl is unique, nothing is random, and nothing is ever removed.
- **Gold seams (kintsugi).** If you come back after 3 or more days without a session, your next session adds
  a gold seam to the bowl, and the seam is already filled with gold when it appears. You never see a cracked
  or broken bowl. Wording: "Welcome back. This session adds a gold line to your bowl." Settings offers
  "Hide gold seams".
- Nandi says what it sees, never what is better: "A wide bowl this week: lots of push days." Every form can
  become a finished bowl. Copy rule: "the clay's form", never anything about the body. No "balanced",
  "better", "wrong" or "lopsided".

## The log (3 taps, after training)

1. **What kind?** Legs / Push / Pull / Core / Cardio / Mixed / Rest.
2. **How did it feel?** Good / Okay / Tough. It changes only the glaze sheen, never the shape or any score.
3. **Save.** It saves at once and the wheel turns. **Add detail** (duration, note, exercises) comes after,
   optional, and never blocks the save.

- Entry points: a "Log training" button on Train, and a notification-free prompt the next time the app opens
  after a planned training time ("Trained today? Tap to shape the bowl."), shown once.
- A guided session done in the app logs itself: its move types map to the kinds above, and the user only sees
  the wheel turn.
- The date can be corrected later (yesterday, the day before) for people who forget.
- At most one shaping step per day per kind, so logging twice never adds more clay. Rest counts once a day.

## Optional layer: choose your path (later, separate yes needed)

Before training, a short story fork chooses the day's focus ("climb the cliff: legs day" or "cross the river:
upper body"), and the log afterwards continues the story. Parked until Jenil says yes to it separately.

## Nandi's animations (standing rule)

| Moment | Size | Animation |
|---|---|---|
| Train opens | minor | Nandi looks up from the wheel. |
| Kind tapped | minor | Nandi's hooves press the clay in that direction. |
| Save | major | The wheel spins, and the bowl reshapes smoothly into its new form. |
| Firing (6th step) | major | The kiln glows, and the glazed bowl slides out onto the shelf. |
| Gold seam | major | A thin gold line draws itself across the bowl, and Nandi nods. |
| Rest logged | minor | Nandi smooths the bowl with a cloth (rest pose). |

Reduced motion: the bowl jumps straight to its new form, and pose changes only. Every animation plays once and
never blocks a tap.

## Drawing the bowl

- A bowl is a profile curve (a few control points for base, belly, neck and mouth), turned into a 2D
  silhouette with SVG: no 3D and no new art library. Each kind moves specific control points within bounds,
  so every result is a plausible bowl.
- Glazes are fills and patterns per tradition (simple repeating motifs drawn in SVG, original, not copied
  from museum images).
- Performance: one SVG under 4 KB per bowl; the shelf renders lazily.

## Data and online-ready

- `trainLog` rows: date (local, 04:00 boundary), kind, feel, source (manual or guided), optional detail.
  `bowl` rows: steps[], firedAt, glaze, goldSeams[].
- All of it stays on the phone. v2 can sync the same rows, and a bowl can be shared as an image by link
  (no account).

## Tests

- 3-tap log saves in under 2 seconds and shows the new shape; Add detail is optional.
- The mapping: each kind moves only its own control points, and the shape stays inside the bounds.
- 6 steps fire a bowl; the glaze matches the month.
- A gap of 3 or more days, then a session, gives a gold seam on that session's step; no broken state is ever
  rendered; "Hide gold seams" hides them.
- One step per kind per day; a guided session logs itself; editing the date moves the step.
- Wording lint: no body words and no judgement words in Nandi's lines.
- 360 px with root font-size 20 px; reduced motion.

## Kill test (from the research)

In a 2-week trial against the same log without pottery: drop the pottery layer if logging does not improve
AND either the median log time goes over 30 seconds, or more than 10% say the gold seam feels like blame, or
more than 10% think one bowl shape means a better body or workout.

## Originality, honestly

Gold repair after a missed day already exists (the Kintsu habit tracker, Kintsugi Unbroken). The new part
is that training type shapes a bowl, plus the shelf; the research found no close match for that, within a
limited search.
