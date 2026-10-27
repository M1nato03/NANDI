# 35. Calm v1.1: longer sits, three ways to sit, sounds

Status: APPROVED by Jenil, 28 Oct 2026 ("calm go ahead"). Builds on spec 34's Calm corner (yatra/calm).

## Why

Jenil, 27 Oct: Calm "is only 1, 3, 5 minutes … it should not be limited", and "add preset sounds or even an option to add your own sounds for meditation".
Research (D:\nandi-gate-logs\idea-engine\gemini-1027\report.md): Calm, Headspace, Insight Timer and Oak offer long and open-ended timers with interval bells, and several ship ambient sounds.
Jenil asked whether longer sits create a pull to sit longer. Answer, and a rule here: **length never earns more**.

## Lengths

- Chips: **3 · 5 · 10 · 20 · 30 · 60 min**, plus **Other**, which opens a small sheet with 1, 15 and 45 min, **Custom** (1–120 min, minute steps) and **Until I stop**.
- The last choice is remembered (calm.minutes). Keep everything in the CALM_MINUTES constant.
- There are no warnings or pressure on long choices.

## Three ways to sit

| Way | What happens | Kachhua |
|---|---|---|
| **Paced breath** (default) | Today's guide: "Breathe in / Breathe out", 4 in / 6 out, adjustable. | His shell rises and settles with the breath. |
| **Body scan** | The 6 body-scan lines, now shown one at a time and spread evenly across the session, with a soft tick between lines. Voice comes later, with Listen mode. | Sits with his eyes half closed and a slow idle. |
| **Quiet sit** | No guide, just the chosen sound (or silence) and the interval bells. | Sits with his eyes closed and breathes slowly. |

For sits of 10 minutes or more in Paced breath, show a small "Let the guide fade" toggle (on by default). After the first 3 minutes the in/out text fades out, and the session continues as a quiet sit.

## Bells

- Start bell: on/off (default on).
- End bell: always on, using today's 3-note bell.
- Interval bells: Off / every 5 / 10 / 15 min (default Off). One soft single strike, quieter than the end bell.

## Sounds

- A sound row on the Calm screen: **None** · River · Rain on the tent · Campfire · Ridge wind · Night crickets · Temple bell (distant, every 40-60 s, seeded) · Tanpura drone · Soft noise · **Your sound**.
- **v1.1: every preset is generated in code** (WebAudio, or Tone.js under MIT with its notice kept). No audio files and no licence risk, and the app gets almost no bigger. They're deterministic and seeded, so no randomness appears in the UI.
  - Tanpura: a Sa–Pa–Sa–Sa cycle with rich harmonics and a soft jivari buzz, at a pitch the user can set from 4 options.
  - River: brown noise, band-passed, with a slow swell.
  - Rain: pink noise plus soft drop ticks.
  - Campfire: a low rumble plus sparse crackles.
  - Wind: filtered noise with slow gusts.
  - Crickets: patterned chirps.
- Sound volume and bell volume are separate sliders.
- **Later (not this spec):** real recorded loops (CC0 only, with each file's licence checked by the idea engine), once Jenil has heard v1.1.
- Sound fades in over 3 s and out over 4 s at the end.

## Your sound (add your own)

- "Add your sound": `<input type="file" accept="audio/*">`. The file is stored as a Blob in IndexedDB (Dexie) and **never leaves the phone**.
- **Limits:** 3 sounds, 50 MB each. If one is over the limit, say so plainly ("This file is over 50 MB.").
- **Accepted:** whatever the WebView can play (mp3, m4a/aac, ogg, wav). If decoding fails: "NANDI can't play this file."
- **Playback:** an HTMLAudioElement with loop=true, routed through a MediaElementSource into the same gain/limiter as the presets. Don't decode whole files into memory (a 10-min file decoded is about 200 MB).
- Rename or remove from the sound row (long-press or a ⋯ menu).
- **Not in backups:** user sounds are excluded from backup/export (size), and the backup screen says so in one line.
- **Privacy copy:** "Your sounds stay on this phone."

## Long sits and the screen

- The timer runs on the wall clock (start timestamp), never on a count of ticks, so it stays correct if the app is backgrounded or the screen locks.
- During a session: a wake lock (as today) plus **Dim screen**. After 20 s with no touch, the screen fades to near-black with a small breathing dot and the time left. Tap to wake.
- v1.1 limit, said honestly in one line under Start for sits of 10 min or more: "Keep NANDI open. The sound and bells play here." Locked-screen playback needs a native media service plus a Play Store declaration, so it comes in a later spec.
- If the app comes back after the end time passed while hidden, the session finishes as complete and the end bell rings once on return.

## What a session counts for

- A session counts once it has lasted **at least 1 minute**, whether it ran to the end or was stopped. Under 1 minute, nothing is saved and nothing is said (as today).
- Until I stop: it counts when stopped, if ≥1 min.
- One ledger row per session, as today: kind 'calm', 0 XP, plus `minutes` (whole minutes sat) and `way` ('paced' | 'scan' | 'quiet').
- **Yatra:** every counted session moves the trek one stretch and lights one star, whatever its length (the existing 3-a-day cap applies).
- No totals, no "minutes this week", no badges for length.
- Done screen: "<N> quiet minutes, together." (Use "A quiet minute, together." for 1.)

## Night Calm (spec 34)

- Paced breath: a star brightens on each out-breath, as today.
- Body scan and Quiet sit: tonight's next star brightens at each interval bell or line change, or once a minute if bells are off.

## Copy rules

Spec 34's banned-words list applies. Describe what it is, never what it does to you. Under Start: "A quiet few minutes with your breath."

## Tests

- **Durations:** every chip, Custom 1 and 120, and Until I stop all run and end correctly using page.clock.
- **Counting:**
  - Stop at 0:59 saves nothing.
  - Stop at 1:00 saves one row with minutes 1.
  - A 30-min sit saves minutes 30 and moves the trek one stretch.
- **Bells:** interval bells fire at 5/10/15 and are off by default.
- **Wall clock:** hide the page for 5 min mid-session (mock visibility plus clock); the remaining time is right on return.
- **Your sound:** a 1 MB test file is stored, shows in the row, plays (the audio element is not paused) and is removed again. A 51 MB file is refused.
- **Screen:** dim appears after 20 s idle, and a tap wakes it.
- **Shots:** 360x800 light + dark for the Calm setup (each way), the Other sheet, the sound row with Your sound, a running Quiet sit, the dim screen and done.
