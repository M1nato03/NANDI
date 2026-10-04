# 03 · Train: beginner workouts that pay for the finished plan

Evidence: `docs/research-brief.md`, section "Training pays for the finished plan, not the extra set".

**Principles:**

- **Train all major muscle groups ≥2×/week and build gradually.** This comes from ACSM's April 2026 position stand and WHO 2020. Going from no training to any training is the biggest gain. Failure training, special equipment and complex periodisation don't reliably help beginners.
- **Default: full-body, 3×/week.** **Two-day mode** (weekly target 2) is a first-class choice in settings, not a failure. Meeting it earns the full weekly bonus.
- **Every working set targets "solid" effort** (1–3 reps left in the tank). Failure sets earn nothing extra. The game never pays for soreness, extra volume or "going harder".
- **"General fitness information, not medical advice"** appears on first run and in settings.

## 1. Onboarding (first run of Train, ≈3 min, themed as the "rank assessment")

1. **Equipment:**
   - gym access yes/no;
   - dumbbells (fixed steps, e.g. 2.5 kg);
   - barbell 15/20 kg and the smallest plate available;
   - resistance band;
   - pull-up bar;
   - a sturdy table edge for inverted rows.
2. **Track:** `gym` ("Gym Foundations") or `bodyweight` ("Hostel Bodyweight"). He can switch any time.
3. **Days:** pick 3 (default Mon/Wed/Fri), or 2 in two-day mode, plus one weekly rest day for the streak.
4. **Placement tests**, one per ladder (bodyweight) or a light first session (gym):
   - **Bodyweight:** start on the ladder's middle step and test max clean reps in one set.
     - ≥ 12 → test the next step up.
     - < 5 → test the step below.
     - Stop at the first step where max reps falls in 5–12; that's the starting step, beginning at 3×5.
     - **If moving up drops below 5, start on the lower step** (the one where he got ≥12) at 3×5.
     - Cap: at most 3 tests per pattern per session; if the cap is hit, start on the last step with ≥5.
     - Holds use the same logic with 20–60 s.
   - **Gym:** for each lift he picks a load he can lift 12 times with good form, guided by the app: start very light and add the smallest increment until reps would drop below 12. The first two sessions use that load at 3×8–12.
5. **Heat check:** the city defaults to Ahmedabad, so offer "hot-day mode" (section 6).

## 2. Default programs

### Gym Foundations (A/B alternating, 3×/week, ~45 min)

| Day A | Sets × reps | Day B | Sets × reps |
|---|---|---|---|
| Goblet squat or leg press | 3 × 8–12 | Lat pulldown | 3 × 8–12 |
| DB bench or machine chest press | 3 × 8–12 | Split squat (DB optional) | 3 × 8–12 / leg |
| Seated cable row or 1-arm DB row | 3 × 8–12 | Seated DB overhead press | 3 × 8–12 |
| DB Romanian deadlift | 2 × 8–12 | Hip thrust or back extension | 2 × 10–15 |
| Plank | 3 × 20–40 s | Pallof press or side plank | 3 × 20–40 s / side |

- **Warm-up:** 5 min easy cardio, plus auto-generated ramp sets for the first two lifts at ~50% × 8 and ~75% × 4 of working load. Warm-up sets never count for XP or PRs.
- **Rest:** 90 s between compound sets, 60 s between core sets.

### Hostel Bodyweight (3×/week, ~35–45 min)

1. **Pair 1:** Squat ladder + Push-up ladder (90 s rest within the pair).
2. **Pair 2:** Hinge ladder + Row ladder. Rows appear only if he confirmed a sturdy anchor. Otherwise substitute prone Y-T-W raises or a backpack row and flag "limited pulling" (a band or doorway bar widens the options).
3. **Core triplet** (60 s rest): plank ladder (anti-extension), side plank / Pallof (anti-rotation), reverse hyper / superman (extension).

**Ladders** (from the r/bodyweightfitness Recommended Routine; steps the library lacks become custom entries with original text and original stick-figure art):

| Pattern | Steps (easier → harder) |
|---|---|
| Push-up | Wall → Incline → Full → Diamond → Pseudo-planche push-up |
| Row | Vertical → Incline → Horizontal (inverted) → Wide → Archer row |
| Squat | Assisted → Bodyweight → Split squat → Bulgarian split squat → Shrimp squat (beginner → intermediate → advanced) |
| Hinge | Bodyweight Romanian deadlift → Single-leg RDL → Banded Nordic curl → Nordic curl |
| Pull-up (if bar) | Scapular pulls → Arch hangs → Negatives → Pull-ups |
| Dip (if bars) | Support hold → Negatives → Parallel-bar dips |
| Core | Plank (timed) → harder variants; Side plank (timed); Reverse hyper / superman |

## 3. Progression engine (pure TS in `src/core/train`, unit-tested)

```
GYM LIFT (rep range repMin–repMax, e.g. 8–12), evaluated after each session:
  every working set ≥ repMax AND no pain flag AND effort ≠ 'near'
      → successStreak += 1
      → if successStreak == 2: load += smallestIncrement(exercise, equipment)
                               (upper ≈ 1–2.5 kg, lower ≈ 2.5–5 kg, from his equipment settings, never a constant)
                               reset target to repMin; successStreak = 0
                               (max 1 increase per exercise per week during weeks 1–6)
  any working set < repMin
      → failStreak += 1;  failStreak == 2 → hold;  failStreak == 3 → load −10% (rounded to equipment), reset
  pain flag in session → no increase this time (and successStreak doesn't advance)

BODYWEIGHT LADDER (target 3 × 5–8):
  3 × 8 clean (may be confirmed across 2 sessions) → next step, start at 3 × 5
  any working set < 5 → previous step
  TIMED HOLDS: 3 × 20–60 s, advance at 3 × 60 s

WEEKLY VOLUME GUARD: a planned week may add at most +20% hard sets over the previous week (heuristic).
RE-TEST WEEK: every 8 weeks counted from program start (not tied to seasons), re-run placement tests with ~30% lighter volume.
```

The smallest increment comes from his equipment: fixed dumbbells in 2.5 kg steps, a 15 or 20 kg bar, and sometimes no small plates. The plate calculator handles Indian gym realities.

## 4. Logging UX (one tap per set)

- Each set row is pre-filled with last session's load × reps. **One tap completes it unchanged**; tapping a number edits it.
- Completing a set **auto-starts the rest timer**. The timer screen keeps the screen awake (wake lock, re-acquired on `visibilitychange`). In the APK, an exact rest-end notification is the backstop, cancelled if he skips or adjusts.
- After the last set of an exercise: an optional three-way effort tap, **easy · solid · near max**. This is used by the engine; there's no 1–10 RPE scale.
- Live PR badges when a set beats a stored best (load PR, reps at a load, estimated 1RM, ladder unlock, hold time). Warm-up and pain-flagged sets are excluded, and plausibility bounds reject typos (e.g. a load jump of more than 50% needs confirmation).
- Free features that rivals charge for: unlimited routines, full history, plate calculator, warm-up calculator, weekly hard sets per muscle.
- **Pain button** on every set: ends that exercise, records it, and suggests the easier ladder step or a rest day. Shows "If pain persists, consult a qualified professional." A safety stop earns the same XP as a minimum session.
- **Readiness check** (optional, two taps before a session): "Slept OK?" and "Very sore?". If either answer is bad, suggest the minimum session (1 set of each) instead of skipping.
- **Rest days:** on any non-session day, a 10-minute walk or mobility check-in (one tap, optionally timed; max 1/day). This counts as the "Body" slot of the daily Hat-trick and nudges toward the WHO aerobic minutes.

## 5. Metrics (priority order on the Train screen)

1. **Consistency:** sessions vs weekly target; a calendar heatmap; consecutive weeks with ≥2 strength sessions.
2. **Progression:** ladder step per pattern ("Push-up · step 3/5 Full"); a PR feed; a best-set line chart per exercise.
3. **Volume:** weekly hard sets per muscle group. Tonnage is never the headline.

## 6. Safety and heat (Ahmedabad)

- **Hot-day mode** (an offline toggle; suggest it from April to October):
  - cuts volume by 20–30% for the first 10–14 days of a routine or a hot spell (ACSM: heat acclimatisation takes 10–14 days);
  - suggests late-evening or indoor sessions;
  - recommends moving indoors above ~27 °C with humidity above 75%;
  - shows ACSM's warning-sign checklist.
  - Tapping "dizzy / confused" shows stop-and-seek-help text.
- Optionally link to Ahmedabad's Heat Action Plan page.
- No load increase after a pain-flagged session. A weekly hard-set increase over +20% shows a confirmation.

## 7. Exercise library

- **Base:** `free-exercise-db` (yuhonas), released under the Unlicense (public domain), with 800+ exercises in JSON plus images. **Verify the upstream image licence before bundling images.**
- Bundle only the ~100–150 exercises the programs and ladders use, converted to WebP.
- **Custom entries** for missing ladder steps (wall push-up, archer row, shrimp squat, scapular pull…): original text and original stick-figure illustrations in the theme style.
- **Phase 1:** text-only exercise cards with cues, or simple SVG line art, are fine. Illustrations can come later.
- **Don't use** ExerciseDB GIFs (paid licence that forbids redistributing raw files) or wger data without per-entry Creative Commons attribution and share-alike tracking.
- Each exercise record carries `licence` and `attribution` fields.

## 8. Economy hooks (numbers in `05-economy.md`)

- **Sessions:**
  - Full planned session: 60 XP.
  - Partial, every exercise touched: `max(40, round(60 × share of planned working sets done))`.
  - Partial, some exercises skipped: `round(60 × share)`, no floor.
  - Minimum session (1 set of each) or safety stop: 40.
- **Other events:** rest-day check 10; PR or ladder unlock +15 each (max 2 a day).
- **Weekly target:**
  - Target 3: 3 of 3 → +60, 2 of 3 → +30.
  - Two-day mode: 2 of 2 → +60.
- **Unplanned extra sets earn 0.** If two sessions are logged on one dayKey, the **better one counts** (a morning minimum never blocks a later full session). Train daily cap: 100 (excluding the weekly bonus).
- **Not in scope:** punitive "penalty quests", XP for raw volume or minutes, ads.

## 9. Acceptance tests

1. A gym lift at 3×12 (repMax 12) for 2 sessions with effort 'solid' → load increases by the smallest equipment increment, and the target resets to 8.
2. The same, but with effort 'near' in session 2 → no increase.
3. A pain flag → no increase, and successStreak doesn't advance.
4. Three consecutive sessions with a set below repMin → load −10%, rounded to available equipment.
5. Bodyweight 3×8 → next ladder step at 3×5. A set below 5 → previous step.
6. Hold 3×60 s → next hold step.
7. A second increase in the same week in weeks 1–6 is blocked.
8. Partial session XP is never less than 40 once every exercise has a set. With exercises skipped it equals `round(60 × share)`. A full plan earns 60. Extra sets don't change XP.
9. A safety stop earns 40.
10. Two sessions on the same `dayKey` → day XP = the higher of the two, never the sum.
11. Placement: max reps ≥ 12 moves the test up; < 5 moves it down; the start is the first step with 5–12. 13 reps on step k then 4 on step k+1 starts at step k. Never more than 3 tests per pattern.
12. The rest timer's remaining time is correct after the app has been backgrounded for 3 minutes (computed from timestamps).
13. The plate calculator returns achievable loads only, given his bar and plate inventory.
