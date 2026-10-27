# 34. Yatra: the wellbeing tab (trek by day, sky by night)

Status: APPROVED by Jenil, 27 Oct 2026 ("yeah the yatra option is good", after seeing the prototype).
Prototype: D:\nandi-proto\yatra\index.html (https://claude.ai/artifact/Sbw47gmTxgLKfP9Ceoahha).

## Why

Jenil, 27 Oct, on build 91:
- Mind puzzles and mystery cases were hidden in a closed Games fold at the bottom of Read (spec 33). Train was parked in You.
- His answer: "create a new panel with both mind and train in it and find a way to add an interesting mechanic to make that stand out it should also have meditation so it will be like a separate panel for your wellbeing type thing".
- Of four ideas (week as a song, tree rings, night sky, trek), he chose: "the trek and sky are interesting mechanics try to make them both work together".
- The name must be unique. He said "Well" is "not an instant yes".

## The idea in one line

By day you walk a real trail with the friends. By night you camp, and the stars you lit that day come out over your camp. The trail below and the sky above are the same journey.

## Tab bar

Plan · Read · **Yatra** · You. Four equal tabs (the plan-183 grid already handles any count). Jenil chose the name Yatra.

## What lives here

| Corner | Friend | What it holds |
|---|---|---|
| Train | Nandi | Everything Train has today: workouts, Taal week, Nordic card, reassessment. |
| Mind | Kapi | Kapi's shelf: daily boards, the mystery case, how-tos, tracks. Moved from Read → Games. |
| Calm (new) | Kachhua | Meditation: a breathing timer (1, 3 or 5 min). Kachhua's shell rises on the in-breath and settles on the out-breath (4 in, 6 out, adjustable). A soft bell at the end. An optional slow body-scan script as text, and as voice in Phase 2. |

Calm makes no health claims. Its copy says what it is ("a quiet few minutes with your breath"), never what it does to you.
The Read → Games fold is removed and its routes redirect here. Train leaves You.

## Day: the trek

- The top of Yatra is a side-on trail scene: the friends walking, the next camp ahead, the trail behind.
- **Every finished session moves the group one stretch along the trail**, whatever kind it was. The kind decides what that stretch looks like:
  - Train session: Nandi leads a walking stretch, and footprints appear on the path.
  - Mind board or case: Kapi opens a **landmark gate**, a real place on the trail (a bridge, a temple, a pass). The board or case is themed on the place, and solving it adds that landmark's postcard to your journal (2-3 sourced lines about the real place).
  - Calm session: the group stops at a rest point, and Kachhua sits by the path.
- 3 stretches = 1 day's walk to the next camp. The trek never goes backwards. A day with no session is a **camp day**: the group rests at camp, and the camp shows a fire, not an empty or failed state.
- Trails are real, in this order: Hampta Pass (Himachal) first, then Kumano Kodo (Japan), Camino de Santiago's last 100 km (Spain), and the Milford Track (New Zealand). Each has 6-10 real camps and landmarks, every fact sourced. Distances are not faked: the app says "stretch 2 of 3 to Balu ka Ghera", not kilometres.

## Night: the sky

- After the evening switch (the existing night boundary), the Yatra scene turns to night at your current camp.
- **Each session today lit one star**, in the colour of its kind: Train saffron, Mind teal, Calm pale gold. They appear over tonight's camp.
- A Calm session at night happens at the camp: as you breathe out, one star brightens. That is the only time a star reacts live.
- When a trail section (one week, or one camp-to-camp leg if that comes first) ends, its stars join into a **constellation**. You name it, or keep the suggested name (from the leg, e.g. "The Chika Kite"). It stays in the sky above that part of the trail.
- **Scrolling the trail scrolls the sky too.** Looking back along the path shows the constellations you made on those nights. Finishing a trail gives a full sky map you can share as an image.

## Rules

- Positive only: no loss, no streak breaking, no "missed" marks. Camp days and dim skies are normal and drawn warmly.
- No random rewards. Every star and stretch comes from a session the user did.
- Offline v1: all trails, landmarks and art ship in the app. Online-ready v2: trek a trail with a friend (shared camp, two colours of stars) and new trails as packs.
- Existing XP, quests and the courtyard keep working. Sessions done here count exactly as they do today.

## Animation table

| Moment | Friend | Animation |
|---|---|---|
| Yatra opens (day) | All | The group walks in place; the trail scrolls a little. |
| Train session done | Nandi | Steps forward; the footprints draw in along the path. |
| Gate solved | Kapi | Swings the gate open; the postcard flips into the journal. |
| Calm session (day) | Kachhua | Sits; his shell breathes with the timer. |
| Camp reached | All | Sit by the fire; the fire flickers. |
| Night falls | Kachhua | Looks up; the sky fades in and today's stars appear one by one. |
| Night Calm, out-breath | (sky) | One star brightens and twinkles. |
| Constellation formed | (sky) | Lines draw between the stars; the name writes in. |
Reduced motion: pose changes and fades only.

## Phases

1. Prototype: DONE (round 2, approved 27 Oct). Match its scenes, camps, colours and animations. Its bottom controls strip (Skip a day, Day/Night, Finish the leg) is for the demo only and does not ship.
2. Build: the tab, moving Train and Kapi's shelf in, Calm v1, the trek and sky with Hampta Pass.
3. More trails, the shareable sky map, Calm voice (with Phase 2 Listen mode).

## Tests (for the build)

- 360x800 light and dark: the four tabs are equal, Yatra has day and night, and nothing overlaps the tab bar.
- A Train, a Mind and a Calm session each move one stretch and add one star of the right colour.
- A day with no session shows a camp day, with no failure wording.
- Every old route into Mind, Read → Games and Train (including the entry in You) redirects to the right Yatra corner.
- No health or brain claims in any Calm or Mind copy (banned-words list).
