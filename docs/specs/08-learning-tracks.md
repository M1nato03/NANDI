# 08 · Learning tracks (drone tech first)

Status: proposal from Jenil, 8 Oct 2026. Add to `docs/specs/` and build after the core app (tasks, Train, Mind) is stable.

> Imported from Claude’s 8 October handoff. The track request is from Jenil; numerical defaults, reward details, and card-reset behaviour below are proposals awaiting review. Current repository decisions take precedence. See the continuation plan for integration questions.

## 1. The idea in one paragraph

A **track** is a topic broken into small daily **units** (one short video + 3 key points + a 3-question check + 3 cards). Each day NANDI puts **one** unit from the active track into the plan as a default task. Cards from finished units go into the same spaced-repetition deck as everything else. The first track is **Drone technology**; later tracks reuse the same format (Gita, Charaka and other courses can migrate to it).

## 2. The overwhelm problem, and the rules that prevent it

Daily learning feels fine for a week, then the reviews pile up, every track wants time, and the whole thing gets dropped. Spaced repetition makes this predictable: **every new card you learn today becomes reviews over the next weeks**, so new content has to be throttled by the review load, not by enthusiasm.

| Rule | Value | Why |
|---|---|---|
| Active tracks | **1** (max 2 if the second is paused-light) | Other tracks are *parked*, not failing. Parking never breaks a streak. |
| New units per day | **1**, max 4 per week | One video a day is sustainable; seven is not. |
| Unit length | Video ≤ 15 min (or a timestamped slice of a longer one) | Fits a single sitting. |
| Daily learning budget | **25 min total** (unit + check + reviews), shown as a bar | When the bar is full, the app says "done for today". |
| New cards per day | **≤ 5** | Caps tomorrow's review load. |
| Backlog brake | If due reviews > 30, **new units pause** automatically and the day becomes a review day | Prevents the pile-up spiral. Shown plainly, not as a failure. |
| Busy-day minimum | "1 card" or "watch 5 min" counts as the day's learning action | Keeps the habit alive on bad days. |

**Weekly rhythm (default, editable):** 4 new-unit days, 1 review-only day, 1 *apply* day, 1 off.

## 3. A unit (what the user sees)

1. **Watch:** one video (opens in YouTube app/browser at the start timestamp). Shows the 3 key points to look for *before* watching.
2. **Check:** 3 multiple-choice questions immediately after, each with a confidence % (same pattern as the law sessions). Score shown, wrong answers explained.
3. **Explain:** one line "explain it to a friend" box (free text, optional, not graded). Writing it is the strongest memory step.
4. **Cards:** the unit's 3 cards enter the deck (subject to the 5/day cap).

**Apply day (weekly):** one small real-world task per module, e.g. "identify the motor KV, ESC rating and battery C-rating on a real drone listing", "sketch the signal path from RC stick to motor", "change one PID value in a simulator and note what happens".

**Module test (end of each module, ~10 min):** 8–10 mixed questions from all units in that module. Pass ≥ 70% → module done; below → its weak units' cards are reset to box 0.

## 4. Drone technology track (draft outline)

About 7 modules × 3–5 units = ~28 units ≈ 7 weeks at 4 units/week. Order goes from physical to software:

1. **Airframe and materials:** frame types (quad/hexa, X vs H), carbon fibre vs plastic vs aluminium, weight budget.
2. **Propulsion:** brushless motors (KV), ESCs, propellers (size, pitch), LiPo batteries (cells, mAh, C-rating), thrust-to-weight.
3. **Flight controller and sensors:** IMU (gyro + accelerometer), barometer, magnetometer, GPS, sensor fusion basics.
4. **Control:** how a quad moves (roll, pitch, yaw, throttle), PID loops, flight modes (stabilise, altitude hold, position hold).
5. **Communication:** RC transmitter/receiver, telemetry, FPV video links.
6. **Software:** ArduPilot vs PX4, ground control (Mission Planner / QGroundControl), simulation (SITL).
7. **Rules and safety (India):** Drone Rules, DigitalSky registration, zone map. *Verify current rules when authoring; they change.*

Videos are **hand-picked once per unit** while authoring the pack (check: clear, ≤ 15 min or sliced, from a reputable channel). No automatic YouTube search inside the app.

## 5. How content gets in (keeps the app independent of Claude)

- Each track is a **content pack** in the existing pack format (`docs/specs/07-content-packs.md`): `tracks/<id>@<ver>.json`.
- A unit record: `id`, `module`, `order`, `title`, `video: { url, start, end, channel }`, `lookFor: [3 strings]`, `check: [3 × { q, options, answer, why }]`, `cards: [3 × { front, back }]`, `apply?` (on the module's last unit).
- Packs are authored with Claude (or by hand) **outside** the app and published like other packs. The app only reads packs, so it works without a Claude plan.
- Track progress is ledger facts (`unit_watched`, `unit_checked`, `module_test`), same as other Mind facts.

## 6. Economy hooks (no new currency)

- A finished unit (watch + check) counts as **the day's lesson**: it fills the **Mind slot** and uses the existing "only 1 lesson a day pays" rule (15 XP). A second unit the same day earns 0, which nudges against bingeing.
- Module test passed: +15 XP, once per module.
- Track cards are ordinary cards (same per-card XP and caps).
- No separate track streak. The existing daily mark already covers it.

## 7. Acceptance tests

1. With one active track, the planner shows exactly 1 default learning task per new-unit day and none on the review-only/off days.
2. A second unit on the same `dayKey` earns 0 XP and doesn't add a second Mind slot.
3. New cards added per day never exceed 5; extra unit cards queue for the next day.
4. When due reviews > 30, no new unit is offered and the day shows as a review day.
5. Parking a track removes its default tasks and doesn't affect any streak.
6. Module test < 70% resets the weak units' cards to box 0; ≥ 70% marks the module done.
7. The daily budget bar sums unit time + check + due-review estimate and shows "done for today" at 25 min.
8. A pack with a missing/invalid field fails Valibot validation and isn't loaded; the rest of the app keeps working.
