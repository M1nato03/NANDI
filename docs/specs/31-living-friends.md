# 31. Living friends: every mascot animates, everywhere it appears

Status: APPROVED by Jenil, 26 Oct 2026 ("yes").
Idea engine, 26 Oct 2026.

## Why

Jenil, 25 Oct: "there should be animations for all the mascots, be it minor or major depending on the need."
The new games (Mor's list, Kapi's shelf, Chiku's stage, Moti's haveli, Kachhua's kolam) each bring their own
animation table. The friends that already appear across the app still stand still. This spec gives them
one shared, small animation system, plus a moment table for every existing place.

## One shared system (no new art)

- Add `moment?: FriendMoment` to `<Cast>`. A moment is a short CSS animation on the existing SVG (whole body or
  eyes only). Poses stay as they are.

| Moment | What moves | Length |
|---|---|---|
| blink | eyes scale to 0.1 and back | 0.25 s |
| nod | head and body dip 3 px | 0.5 s |
| hop | whole body rises 8 px and lands | 0.6 s |
| tilt | body rotates ±6° and back | 0.6 s |
| wave | the front limb lifts (as one SVG group) | 0.8 s |
| settle | a slow sink into the rest pose | 0.8 s |
| breathe | a slow 2% scale loop, rest pose only | 4 s loop |

- `useFriendMoment(trigger)` plays a moment once when its trigger changes (the same "key" trick MorList
  already uses). Moments never replay on re-render.
- An idle friend blinks once at a random-looking but seeded interval (8-14 s), and only while on screen
  (IntersectionObserver). No other idle loops, except breathe on rest poses.
- Rules for every moment: at most 1.2 s (breathe excepted); never blocks a tap; never on a timer the user
  didn't cause (blink and breathe excepted); with prefers-reduced-motion, no movement at all, only the pose.
- The Train screen: Jenil parked the Train category, so nothing is added there. Nandi animates wherever it
  already appears (Welcome, courtyard, storybook, unit scenes).

## Moments by place

| Place (file) | Friend | When | Moment |
|---|---|---|---|
| Welcome (Welcome.tsx:94) | Nandi | on mount | wave |
| Welcome, rest step (Welcome.tsx:110) | Kachhua | on mount | settle, then breathe |
| Courtyard (Courtyard.tsx:50-69) | the tapped friend | tap | hop |
| Courtyard | a friend whose area grew today | first view today | nod |
| Storybook (Storybook.tsx:26) | page friend | page turn | cheer pages: hop; quiet or soft pages: settle |
| Storybook cover (Storybook.tsx:68) | Mor | on mount | wave |
| Step lesson (StepLesson.tsx:75) | lesson friend | right answer | nod; wrong answer: tilt (never shake, never red) |
| Learn drop (LearnDrop.tsx:245-273) | lesson friend | lesson finished | hop; the friends row hops one after another (--i delay, 80 ms each) |
| Economy feedback (EconomyFeedback.tsx:191) | the friend shown | reveal | hop |
| Finish moment (FinishMoment.tsx:8) | activity friend | toast shows | nod |
| Soft day (SoftDay.tsx:98-146) | Kachhua | on mount | settle, then breathe; "I feel okay now": blink |
| Plan away line (Plan.tsx:90) | Kachhua | on mount | settle, then breathe |
| Meet the cast (MeetCast.tsx:8) | each pose card | tap | that pose's natural moment (idle blink, cheer hop, think tilt, rest settle) |
| Unit scene (UnitScene.tsx:15) | all six | on mount | hop, one after another |

The new games keep their own tables (specs 26, 27, 29, 30); they can switch to the shared moments when it
helps, but they don't have to.

## Tests

- Each moment plays once per trigger and not on re-render (unit test with a re-render).
- Reduced motion: no animation-name on any .cast element (e2e on 3 screens).
- The idle blink pauses when the friend is off-screen.
- No moment ever blocks a click (e2e: tap a button under a hopping friend mid-animation).
- Performance: 6 friends hopping together stay under one frame budget on the e2e device profile (no layout
  thrash: transform and opacity only).

## Out of scope

New poses or new art; the Train category (parked); sound.
