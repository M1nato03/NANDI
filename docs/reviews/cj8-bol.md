# cj8-bol · Bol sets: safe tempo and the vocabulary

Job 4 of cloud batch 8 (25 Oct 2026). Branch `ideas/cj8-bol`, cut from `origin/main`.
Inputs read: `CLAUDE.md` (main), `docs/specs/24-signature-mechanics.md` (ideas/spec-24-signature),
`src/core/train/*` and the `train` block of `src/core/rules.config.ts` (main).
No app code changed. This is a proposal; every number below would live in `RULES.train.bol` if built.

## 0. Short answer

- Six syllables: **DHA, TI, NA, GE, KA, — (khali)**. Each has a fixed shape in counts; one count is about 1 s.
- I changed one thing in the brief: **TI is a steady full rep, not a quick half rep.** The ladder counts
  full reps only (`RULES.train.ladder` 5-8 reps), so a half rep in the main slot makes "how many reps
  did I do" unclear. The half rep moves to **KA**, counts 0 reps, and is for the strong level only.
- Tempo limits come from three sources: ACSM 2009 (untrained: slow and moderate speed), Schoenfeld 2015
  (0.5-8 s per rep gives similar growth; over 10 s looks worse), Wilk 2021 (8-12 reps is about 24-60 s
  under tension). So: **every rep 8 s or less, every set 60 s or less (45 s at first), beat 50-72 BPM.**
- One rule keeps any user bol inside the plan: the bol only shapes the plan's set. It never sets
  reps outside `repMin..repMax`, never changes sets, load or rest, and never pays extra XP.
- **Nothing is judged on the beat.** No tap, no "miss", no score. That removes the hard latency problem.
  Latency then only affects sound vs screen sync, which a single offset fixes.
- With audio off the bol still works: big syllable on screen, a vibration per syllable, and the
  person says the bol out loud. A self-paced mode ("Nandi waits") needs no beat at all.
- One code risk to fix first: a slow bol can make a set fall below `repMin`, and
  `evaluateBodyweightLadder` then **moves the ladder down**. A bol set must never do that (§4.3).

## 1. What the code has today (origin/main)

| Thing | Where | Value | Matters for bols because |
|---|---|---|---|
| Ladders | `library.ts` `LADDERS` | push-up 5 steps, row 5, squat 5, hinge 4, pull-up 4, dip 3, core 1-2 each | Level comes from rank |
| Ladder reps | `RULES.train.ladder` | 3 sets, 5-8 reps, holds 20-60 s | Bol reps must sit inside this |
| Gym reps | `programs.ts` | 8-12 reps (hip thrust 10-15), holds 20-40 s | Same rule, other range |
| Step down | `progression.ts` `evaluateBodyweightLadder` | any set under 5 reps (or 20 s) and rank > 1 → rank − 1 | A slow bol could trigger it |
| Gym deload | `evaluateGymLift` | 3 failed sessions → −10 % load | Same risk on the gym track |
| Early weeks | `RULES.train.progression.earlyWeeks` | 6 | Used to cap level in weeks 1-6 |
| Negatives | `pull-up-negative`, `dip-negative`, `banded-nordic`, `nordic-curl` | lowering-only moves | GE fits them exactly |
| Cues | `form-cues.json` | e.g. `sl-rdl:slow`: "Lower for a slow count of 3. Pause for 1 at the bottom" | The app already speaks in counts; DHA NA is that cue |
| Sound | `src/ui/cast/sound.ts` | new `AudioContext` per cue, closed after 800 ms; muted under reduced motion and the night deck | Bol player needs one long-lived context and its own toggle (§6.4) |
| Haptics | `src/platform/haptics.ts` | `navigator.vibrate`, then Capacitor Haptics | Usable as the silent beat |
| Wake lock | `src/platform/awake.ts` | KeepAwake | Keep screen on during a bol set |

## 2. Sources (what each one says, quoted)

Status: "opened" means I read the text myself. "Snippet" means only a search result summary; those are
marked and not used for numbers.

| # | Source | Status |
|---|---|---|
| S1 | ACSM 2009 position stand, *Progression Models in Resistance Training for Healthy Adults*, MSSE 41(3). Copy: https://sfu.ca/~ryand/kin343/ACSMresistance.pdf | opened (PDF text) |
| S2 | Schoenfeld, Ogborn, Krieger 2015, *Effect of repetition duration during resistance training on muscle hypertrophy*, Sports Med. doi:10.1007/s40279-015-0304-0. Abstract via Europe PMC (PMID 25601394) | opened (abstract) |
| S3 | Wilk, Zajac, Tufano 2021, *The Influence of Movement Tempo During Resistance Training on Muscular Strength and Hypertrophy Responses: A Review*, Sports Med 51:1629-1650. Open copy: https://pmc.ncbi.nlm.nih.gov/articles/PMC8310485/ | opened (full text via Europe PMC) |
| S4 | Burd et al. 2012, *Muscle time under tension during resistance exercise stimulates differential muscle protein sub-fractional synthetic responses in men*, J Physiol. doi:10.1113/jphysiol.2011.221200 | opened (abstract) |
| S5 | Childs 1999, *The Impact of the Valsalva Maneuver During Resistance Exercise*, Strength and Conditioning Journal 21(2):54-55. Copy: https://paulogentil.com/pdf/C17.pdf | opened (PDF text) |
| S6 | Terry et al. 2020, *Effects of music in exercise and sport: A meta-analytic review*, Psychol Bull. doi:10.1037/bul0000216 | opened (abstract) |
| S7 | NHS, strength exercises: https://www.nhs.uk/live-well/exercise/strength-exercises/ | opened |
| — | AHA 2007 resistance exercise statement (ahajournals.org) and BJSM 1992 breathing study | **could not open (HTTP 403)**; not used |
| — | PubMed pages | blocked by a cookie wall; I used Europe PMC for the same abstracts |

**Tempo for beginners (S1, ACSM 2009):**
> "Evidence category A. For untrained individuals, it is recommended that slow and moderate velocities be used"

> "Evidence category B. For intermediate training, it is recommended that moderate velocity be used for RT"

Moderate is defined in the summary: "a moderate contraction velocity (1–2 s CON; 1–2 s ECC)".
Intermediate is "individuals with approximately 6 months of consistent RT experience".

**Very slow is not better (S1):**
> "Substantially, less peak force, power, and number of repetitions performed were observed with 'super slow' repetition velocity (10:10) compared with a self-selected fast velocity when matched for intensity"

> "The number of repetitions performed is based upon a continuum depending on the lifting velocity where the largest numbers of repetitions are performed with a fast velocity and decreases proportionately as velocity becomes slower"

(The PDF prints the quote marks as `B` and `[`; I restored them.) The second quote is why §4.3 matters:
slow bols mean fewer reps, and bodyweight moves cannot drop load.

**Range of rep durations (S2):**
> "Results indicate that hypertrophic outcomes are similar when training with repetition durations ranging from 0.5 to 8 s."

> "Findings suggest that training at volitionally very slow durations (>10s per repetition) is inferior from a hypertrophy standpoint, although a lack of controlled studies on the topic makes it difficult to draw definitive conclusions."

Only eight studies met the criteria, and all trained to failure. So 8 s is a sensible cap, not a proven optimum.

**Notation and time under tension per set (S3, Wilk 2021):**
> "For example, 2/0/3/0 denotes a 2-s eccentric phase, no intentional isometric pause during the transition phase, a 3-s concentric phase, and no pause between the completion of the concentric phase and the beginning (eccentric phase) of the next repetition."

> "For maximum strength gains, the ACSM [23] recommends that novice to intermediate individuals should use loads corresponding to 60–70%1RM for 8–12 repetitions (which translates to a total TUT of 24–60 s per set)"

> "This led to the conclusion that relatively small changes in movement tempo do not affect strength gains."

> "Conclusions The results presented in this review indicate that changing the tempo of movement during resistance training may have an impact on the level of muscle hypertrophy and strength, however the results are not conclusive."

Wilk also reports that a 4/0/2/0 tempo "yielded greater RPE compared to 2/0/2/0" (felt harder). Slow bols feel
harder; the copy should say so plainly.

**Time under tension, one lab study (S4):** 6 s up and 6 s down at 30 % 1RM vs 1 s each, eight men:
> "These data show that greater muscle time under tension increased the acute amplitude of mitochondrial and sarcoplasmic protein synthesis and also resulted in a robust, but delayed stimulation of myofibrillar protein synthesis 24-30 h after resistance exercise."

This is one acute study with eight people. It is not a reason to promise results. The app should make no
claim that slow bols "build more muscle".

**Breathing during holds and slow reps (S5, Childs 1999):**
> "This situation most commonly occurs in isometric or heavy resistance exercise when a client exerts a strenuous and prolonged effort."

> "During repetitive lifts of low intensity, the client can talk or count during the lift to minimize breath holding (1). Although beginners often stop breathing during repetitive lifts of low intensity, they should inhale and exhale during execution of the lift"

> "Fitness professionals should not prescribe many exercises requiring maximal or near-maximal efforts to beginners."

This is the strongest design hook found: **saying the bol out loud is the coaching cue to keep breathing.**
It also supports the khali (breath) beat and the cap on long NA runs. It is a 1999 practitioner column,
not a trial, so it backs a cue, not a claim.

**Slow and controlled (S7, NHS):** "The slower the repetitions, the better." (sit-to-stand) and
"The movement should be slow and controlled." (calf raises). General-public guidance, no numbers.

**Music (S6, Terry 2020)**, for context only:
> "Performance effects were moderated by study domain (exercise > sport) and music tempo (fast > slow-to-medium)."

Bol beats are slow (50-72 BPM), so S6 gives no support for a performance effect of the bol beat.
The bol is a pacing and fun tool. No copy may say it makes training better.

## 3. The vocabulary (6 syllables)

One **count** = one beat. Default 60 BPM, so 1 count = 1 s. "Hard point" and "easy point" depend on the move.

| Syllable | Shape (counts) | Reps it counts | Sound idea (synthesized, offline) |
|---|---|---|---|
| **DHA** | full rep, slow: 3 lowering, 2 lifting (Wilk 3/0/2/0) | 1 | low + high tone together (like the two-drum dha) |
| **TI** | full rep, steady: 2 lowering, 1 lifting (2/0/1/0, ACSM "moderate") | 1 | short high tick |
| **NA** | +1 count still at the hard point, added to the rep before it | 0 (part of that rep) | soft held note |
| **GE** | lowering only: 4 lowering, 2 to reset (step, knee down or jump back up) | 1 | low falling note |
| **KA** | half rep in the bottom half: 1 down, 1 up | 0 | muted click |
| **— (khali)** | 1 count at the easy point; breathe out | 0 | silence |

"Khali" is the empty beat of a taal cycle, which fits a breath beat and matches spec 24's Taal week.

### Per move type

| Move type | Hard point (NA) | Easy point (—) | DHA | GE | KA |
|---|---|---|---|---|---|
| **Push** (push-up ladder, dip ladder, db-bench, machine press, seated press) | chest just above floor / elbows at a right angle | arms straight, body in one line | 3 down, 2 up | lower 4, knees down, reset | bottom half only |
| **Squat** (squat ladder, goblet, split squats, hinge ladder) | bottom you can control; for the hinge, where the back is still flat | standing tall | 3 down, 2 up | lower 4, stand back up with help | bottom half only |
| **Pull** (row ladder, pull-up ladder, cable row, pulldown) | chest to bar / handle in, shoulders down | arms long, shoulders gently active | 2 pull, 3 lower (still 5) | step/jump to the top, lower 4 | top half only (arms half bent) |
| **Core, dynamic** (reverse hyper, back extension, Pallof press) | lifted / pressed out | lowered / handle at chest | 3 out, 2 back | not used | not used |
| **Core, hold** (plank, side plank, long-lever, star side plank, arch hang, support hold) | NA = 1 count of hold | — = breathe out, **still holding** | not used | not used | not used |

Holds use only NA and —. A hold bol is a breathing-paced hold, nothing more.

## 4. Levels and tempo limits

### 4.1 Which level a person is on

| Track / ladder | Level A "First steps" | Level B "Building" | Level C "Strong" |
|---|---|---|---|
| Push-up, row, squat, hinge, pull-up, dip ladders | rank 1-2 | rank 3 | rank 4+ |
| Core ladders (1-2 steps) and gym track | weeks 1-6 | weeks 7-26 | week 27+ |
| Cap for everyone | weeks 1-6 are never above B | — | — |

Weeks 1-6 reuse `RULES.train.progression.earlyWeeks`. Week 27 is ACSM's "approximately 6 months" (S1).

### 4.2 Limits (proposed `RULES.train.bol`)

| Limit | A | B | C | Source / reason |
|---|---|---|---|---|
| Syllables allowed | DHA, TI, NA, — (GE only on negative moves) | + GE on any rep move | + KA | ACSM: slow and moderate for untrained (S1) |
| Beat | 50-66 BPM | 50-72 BPM | 50-72 BPM | At 66 BPM the TI lift is 0.9 s, close to ACSM's 1-2 s |
| Longest rep (rep syllable + its NAs), seconds | 7 | 8 | 8 | S2: 0.5-8 s similar; over 10 s worse |
| NAs in a row | 2 | 3 | 3 | Breath holding risk in long holds (S5) |
| KA per set | 0 | 0 | 4 | Half reps only once form is settled |
| Khali in a row | 2 | 2 | 2 | It is a breath, not a rest; rest stays on the rest timer |
| Set time (all counts × beat), seconds | 45 | 60 | 60 | S3: 8-12 reps ≈ 24-60 s TUT |
| Hold run before a khali (holds only), counts | 4 | 5 | 6 | Keeps a breath cue every few seconds (S5) |
| Hold total | plan's hold range (`repMin..repMax` s) | same | same | `RULES.train.ladder` 20-60 s; gym 20-40 s |

All limits apply at the chosen BPM, in real seconds. A bol valid at 60 BPM can be invalid at 50 BPM (see sample 3).

### 4.3 The ladder must never drop because of a bol

ACSM (S1) says reps fall as speed falls. On bodyweight moves load cannot drop, so a slow bol can end a set at
4 reps. Today `evaluateBodyweightLadder` then sets `stepRank − 1`, and `evaluateGymLift` counts a fail toward
the 10 % deload. That is a loss state caused by a game.

Rule: **a set logged with a bol that is slower than the plan's steady default (any DHA, NA, GE or KA) never
counts toward a step down or a deload.** It can still count toward moving up (3 × 8 clean), which is harder at
slow tempo, so it never makes progress easier. This needs a small change in `progression.ts` and a test-first
spec line; it is a product trade-off, so it goes to Jenil (§9).

## 5. The rule for any user-written bol

A bol is a string of syllables for **one set**. It is checked against the person's own plan exercise and level,
on their phone, every time it is used, including bols that arrive in a share link (untrusted input, Valibot).

```ts
// Sketch only (would live in src/core/train/bol.ts, test-first).
type Syl = 'DHA' | 'TI' | 'NA' | 'GE' | 'KA' | '-';
const COUNTS = { DHA: 5, TI: 3, NA: 1, GE: 6, KA: 2, '-': 1 } as const;
const REP: Record<Syl, number> = { DHA: 1, TI: 1, NA: 0, GE: 1, KA: 0, '-': 0 };

function checkBol(bol: Syl[], plan: RoutineExercise, level: 'A'|'B'|'C', bpm: number, isNegativeMove: boolean): string[] {
  const L = RULES.train.bol[level];          // the table in §4.2
  const sec = 60 / bpm, problems: string[] = [];
  if (bpm < L.bpmMin || bpm > L.bpmMax) problems.push('beat');
  if (bol.length === 0 || bol.length > 64) problems.push('length');
  const hold = !!plan.isHold;
  for (const s of bol) if (!L.allowed.includes(s) && !(s === 'GE' && isNegativeMove)) problems.push(`syllable ${s}`);
  if (hold) {
    if (bol.some(s => s !== 'NA' && s !== '-')) problems.push('holds use NA and - only');
    const total = bol.length * sec;           // khali is still holding
    if (total < plan.repMin || total > plan.repMax) problems.push('hold time');
    if (longestRun(bol, 'NA') > L.holdRun) problems.push('breathe more often');
  } else {
    if (bol[0] === 'NA' || bol[0] === 'KA') problems.push('start with a rep');
    const reps = bol.reduce((n, s) => n + REP[s], 0);
    if (reps < plan.repMin || reps > plan.repMax) problems.push('reps');
    if (longestRun(bol, 'NA') > L.naRun) problems.push('pause');
    if (bol.filter(s => s === 'KA').length > L.kaMax) problems.push('half reps');
    if (longestRun(bol, '-') > 2) problems.push('khali');
    if (longestRepSeconds(bol, sec) > L.repMaxS) problems.push('rep too slow');
  }
  const setSeconds = bol.reduce((t, s) => t + COUNTS[s], 0) * sec;
  if (setSeconds > L.setMaxS) problems.push('set too long');
  return problems;                             // empty = allowed
}
```

What the rule fixes no matter what the bol says:

| Never changed by a bol | Why |
|---|---|
| Sets, load, rest timer, exercise | The plan owns them (`programs.ts`, `progression.ts`) |
| Rep range | `repMin..repMax` of the plan exercise; per-side moves count per side |
| XP | Same XP as the set without a bol. Writing or sharing a bol is 0 XP. "Clean bests" only inside the plan (spec 24) |
| Level | A shared bol from a friend on level C is checked against *my* level; if it fails, it is shown with the reason and a "make it fit" button that trims it (drop KA, shorten NA runs, set BPM to 60) |
| Night | After bedtime the bol plays with haptics only, no tones (matches the night deck mute in `sound.ts`) |

Copy for a refused bol (plain, no shame): "This bol has 10 reps. Today's plan is 5 to 8. Trim it?"

## 6. Twelve sample bols (all pass §5 at 60 BPM)

Spaces separate syllables. Time is at 60 BPM. "Longest rep" includes its NAs.

| # | Move (ladder, rank) | Level | Bol | Reps | Set time | Longest rep | Check |
|---|---|---|---|---|---|---|---|
| 1 | Wall push-up (push 1) | A | `DHA — DHA — DHA — DHA — DHA —` | 5 | 30 s | 5 s | pass |
| 2 | Push-up (push 3) | B | `GE DHA NA TI TI — DHA NA TI TI` | 7 | 31 s | 6 s | pass |
| 3 | Diamond push-up (push 4) | C | `DHA NA NA NA KA KA TI — DHA NA NA NA KA KA TI — TI TI` | 6 | 38 s | 8 s | pass at 60; **fails at 50 BPM** (rep 9.6 s > 8) |
| 4 | Assisted squat (squat 1) | A | `DHA DHA — DHA DHA — DHA DHA` | 6 | 32 s | 5 s | pass |
| 5 | Split squat (squat 3), per side | B | `DHA NA NA TI TI TI — DHA NA NA TI TI` | 7 | 30 s | 7 s | pass |
| 6 | Bulgarian split squat (squat 4), per side | C | `GE NA DHA NA NA NA KA KA TI — DHA NA NA NA TI` | 5 | 34 s | 8 s | pass |
| 7 | Vertical row (row 1) | A | `DHA NA — DHA NA — DHA NA — DHA NA — DHA NA` | 5 | 34 s | 6 s | pass (NA = chest to hands) |
| 8 | Pull-up negative (pull-up 3) | B | `GE — GE — GE — GE — GE` | 5 | 34 s | 6 s | pass |
| 9 | Archer row (row 5), per side | C | `DHA NA NA NA TI TI KA KA — DHA NA NA NA TI` | 5 | 30 s | 8 s | pass |
| 10 | Plank (core-anti-ext 1), hold | A, week 2 | `(NA NA NA NA —) × 5` | hold | 25 s | run 4 | pass (20-60 s) |
| 11 | Reverse hyper (core-ext 1) | B, week 10 | `DHA NA NA — DHA NA NA — DHA NA NA — DHA NA NA — DHA NA NA — GE` | 6 | 45 s | 7 s | pass |
| 12 | Long-lever plank (core-anti-ext 2), hold | C, week 30 | `(NA NA NA NA NA NA —) × 6` | hold | 42 s | run 6 | pass |

Sample 11 uses GE on a non-negative move, which is allowed from level B.

Three bols the rule refuses (for tests):

| Bol | Plan | Level | Refused because |
|---|---|---|---|
| `TI TI TI` | push-up 5-8 | A | 3 reps < 5 |
| `DHA NA NA NA TI TI TI TI TI` | wall push-up | A | 3 NAs in a row (A allows 2); rep 8 s > 7 s |
| `KA KA KA KA KA DHA DHA DHA DHA DHA` | squat | B | KA not allowed below C |

## 7. Beat sync on Android web views

### 7.1 What the sources say

| Source | Quote | Status |
|---|---|---|
| Android NDK, audio latency: https://developer.android.com/ndk/guides/audio/audio-latency | "**Audio output latency** is the time between an audio sample being generated by an app and the sample being played through the headphone jack or built-in speaker." | opened |
| same | "`android.hardware.audio.low_latency` indicates a continuous output latency of 45 ms or less." | opened |
| MDN `outputLatency`: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/outputLatency | "This is the time, in seconds, between the browser passing an audio buffer out of an audio graph over to the host system's audio subsystem to play, and the time at which the first sample in the buffer is actually processed by the audio output device." and "It varies depending on the platform and the available hardware." | opened |
| MDN `getOutputTimestamp`: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/getOutputTimestamp | `performanceTime`: "An estimation of the moment when the sample frame corresponding to the stored `contextTime` value was rendered by the audio output device, in the same units and origin as `performance.now()`." | opened |
| web.dev, A tale of two clocks: https://web.dev/articles/audio-scheduling | JS timers "can easily be skewed by tens of milliseconds or more by layout, rendering, garbage collection"; "A good place to start is probably 100ms of "lookahead" time, with intervals set to 25ms." | opened |
| web.dev, audio output latency: https://web.dev/articles/audio-output-latency | outputLatency "allows the demo to determine when a given audio timestamp is reaching the user's ears" | opened |
| Chrome autoplay policy: https://developer.chrome.com/blog/autoplay | "If an `AudioContext` is created before the document receives a user gesture, it will be created in the "suspended" state" and "you will need to call `resume()` after the user gesture." | opened |
| Rhythm Quest devlog 10: https://rhythmquestgame.com/devlog/10.html | "usually, audio latency is the largest of the three latencies."; "Android devices which are notorious for having high amounts of audio latency"; "we can never measure a single type of latency by itself using a tap test." | opened |
| SoundGuys: https://soundguys.com/android-bluetooth-latency-22732 | "Android system latency for wireless audio can be in the region of 100ms" and "a further 100ms or more for the Bluetooth data transfer"; "UPDATE 3/21: As of 2021, the situation has improved some, but isn't perfect" | opened |
| MDN Vibration API: https://developer.mozilla.org/en-US/docs/Web/API/Vibration_API | "Does nothing if vibration support isn't available." | opened |
| WebView Android support for `outputLatency` from version 102 | from the MDN compat table as mirrored on docs.w3cub.com | **snippet only**; check on device |
| Android Authority Bluetooth test (about 244-250 ms best averages) | — | **could not open (403)**; not used |

I found no published measurement specific to Android System WebView inside Capacitor. The plan below assumes
WebView behaves like Chrome for Android and must be checked on Jenil's phone (§7.4).

### 7.2 Why bols are easier than a rhythm game

Rhythm games judge taps against the beat, so 100-300 ms of Bluetooth delay breaks them and they need tap
calibration. A bol set **judges nothing**: the person is doing push-ups, not tapping. At 60 BPM a count is
1000 ms, so even a 300 ms delay only shifts the cue by a third of a count, and the same shift applies to
every cue. Most people will listen, not watch (the phone is on the floor). So:

- Audio alone: latency does not matter (it is a constant shift).
- Watching and listening together: shift the picture by the measured latency.
- No score, no streak, no "late" or "miss" ever. That also keeps the product rules (no loss states).

### 7.3 What the player does

| Step | How |
|---|---|
| One context | Create one `AudioContext({ latencyHint: 'interactive' })` when the person taps Start (a gesture), call `resume()`. Do not reuse the per-cue pattern in `sound.ts`, which makes and closes a context each time. |
| Schedule | Every 25 ms, schedule every syllable tone that starts within the next 100 ms on `context.currentTime` (web.dev). Never fire tones from `setTimeout`. |
| Store absolute times | Set start = `performance.now()` mapped to `context.currentTime`. Each syllable's time is computed from the start, never accumulated (CLAUDE.md timer rule). |
| Draw | Each frame, read `getOutputTimestamp()` and draw the syllable that is *being heard now*. If missing, use `currentTime − (outputLatency ?? baseLatency ?? 0)`. |
| Bluetooth | If `outputLatency` > 0.15 s, show one line: "Headphones add a small delay. The screen is shifted to match." |
| Manual offset | Settings: "Line up sound and screen", −400 to +400 ms, default from `outputLatency`. Saved per device as a state row (natural key). Optional: tap 8 times with a click, drop the highest and lowest, average (Rhythm Quest: about 10 taps is usual; they used 4). |
| Haptics | Fire `navigator.vibrate` from the draw loop at the heard time. Not precise; fine for a cue. |
| Leaving the app | On `visibilitychange` hidden: stop scheduling and pause the set (do not keep beating in the background). On return, show "Ready?" and continue from the next rep after a tap. Recompute on `pageshow` too. |
| Wake lock | Keep the screen on during a bol set (`awake.ts`), release at the end of the set. |
| End | The set ends on the last syllable. Then the normal rest timer and the normal rep log ("How many clean reps?") prefilled with the bol's reps. The person can lower the number with no penalty (§4.3). |

### 7.4 Device checks before building

| Check | Pass |
|---|---|
| `outputLatency` and `getOutputTimestamp` exist in the Capacitor WebView on Jenil's phone | both return numbers |
| Phone speaker: tone vs screen flash, filmed at 60 fps | under 100 ms apart after the shift |
| Bluetooth earbuds: same test | under 100 ms after the shift or the manual offset |
| 3 minutes screen on, other tab work | no drift (tones stay on the computed times) |
| Lock and unlock mid-set | set pauses, no burst of queued tones on return |

## 8. When audio is off

Audio off is a normal mode, not a broken one. Sources of the beat, in order:

| Mode | What happens | For whom |
|---|---|---|
| **Screen** | One big syllable at a time (DHA / TI / NA …) with a phase word: "down", "up", "hold", "breathe". A bar fills for the phase. No numbers counting down. | Watching |
| **Haptic** | One vibration per syllable start. DHA: 120 ms. TI: 40 ms. NA: two 30 ms taps. GE: 200 ms. KA: 20 ms. Khali: none. | Phone in a pocket or on the floor |
| **Say it** | The bol line shows at the top: "Say it out loud as you move." Based on Childs (S5): counting aloud reduces breath holding. Copy makes no health claim. | Everyone; default hint on the first 3 bol sets |
| **Nandi waits** (self-paced) | No beat. The screen shows the next syllable; a tap anywhere (or a volume key on Android) moves on. Nothing ever times out. | TalkBack users, noisy rooms, anyone who wants it |
| **Reduced motion** (phone or in-app) | No scrolling lane. A static row of syllables with the current one outlined. Haptics still run (they carry the beat here, they are not decoration). | `prefers-reduced-motion` or the motion toggle |
| **Night** (after bedtime) | Haptics only, no tones, no celebration; Train still counts (CLAUDE.md). | Late sessions |

The bol's tones need their own toggle ("Bol beat sound"). Today `playCastSound` is silenced by reduced motion;
for bols the sound carries timing, so the motion toggle should remove movement but not the beat. TalkBack: do
not announce every syllable through `aria-live` (too fast and itself delayed); point TalkBack users to
"Nandi waits".

## 9. Product rule check

| Rule | Bol sets | Note |
|---|---|---|
| No loss states | YES, after §4.3 | Without §4.3 a slow bol can drop the ladder |
| No guilt | YES | No "late", "miss" or score |
| No random rewards | YES | Same XP as the set |
| No endless feeds | YES | 12 starter bols plus links friends send. No public bol browser |
| No countdowns | YES | Phase bar fills; no numbers to zero; nothing times out |
| XP never goes down | YES | |
| No health or "brain" claims | YES | Copy never says slow bols build more muscle or improve anything; S4 is one acute study |
| No firearm content | YES | |
| 18+ | YES | |
| Data stays on the phone | YES | A shared bol is only the syllable string and BPM in the link |

Cultural note: dha, ti, na, ge, ka are real tabla bols, "the spoken syllables of the tabla and their
corresponding strokes" (https://digitabla.com/reference/concepts-and-definitions/bol/, opened). NANDI uses
their sound and feel, not their stroke meaning. Say that once on the intro card ("Named after tabla
syllables; these are our own exercise beats."). Ask a tabla player to hear the synthesized set before release.

## 10. Decisions for Jenil

1. TI as a steady full rep, and the half rep moved to KA (level C only)? Recommended: yes.
2. A slow-bol set never counts toward a ladder step down or a gym deload (§4.3)? Recommended: yes.
   This changes `progression.ts` behaviour.
3. Bol tones get their own toggle, separate from the motion toggle? Recommended: yes.

## 11. Kill test (set now, not moved later)

After 4 weeks on the owner panel, kill or rework if any of these hold:
- Fewer than 15 % of Train sessions use a bol, among people who tried bols at least twice.
- Pain flags per set are higher on bol sets than on plain sets.
- Bol sets raise Train opens after bedtime.
- Jenil says it feels like pressure.

## 12. Build cost

| Piece | Size |
|---|---|
| `src/core/train/bol.ts` (parse, check, durations) + Vitest from §5/§6 tables | small |
| `RULES.train.bol` block + bounds in the rules validator | small |
| §4.3 change in `progression.ts` + tests | small, needs decision 2 |
| Bol player (one AudioContext, lookahead scheduler, offset, haptics, pause on hide) | medium |
| Composer screen (syllable buttons, live check, share link segment) | medium |
| Device checks §7.4 | one session on the phone |
