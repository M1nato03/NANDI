# 32. Made for you: friend narrators, a first lesson in 60 seconds, your own path

Status: DRAFT for Jenil. The builder gets it only after his yes.
Idea engine, 26 Oct 2026.

## Why

On 26 Oct Jenil recorded BeFreed (screen-20261026-214059.mp4) and picked out what NANDI should take from it:
- the friend-style pick
- the first lesson in 60 seconds
- above all, the customisation and personalisation: a learning path built for you, audiobooks curated to your goal, and recommendations when you ask

The current look stays. For the intro he wants two versions to compare (prototype:
https://claude.ai/artifact/HJWc2VkiTgFDNxySHXMHiw).

What we don't copy from BeFreed, because it breaks NANDI's rules:
- the endless swipe-up "For you" feed
- a July 4th "40% OFF" paywall shown in October
- the notification ask straight after onboarding
- the unsourced "10x faster than scrolling" chart
- the always-on "Your Gift" badge
- AI-written book summaries of in-copyright books

## The honest limit

NANDI is offline-first, with no AI on the phone. Today it has 54 fact-checked ideas across 6 topics. So in v1 "personal" means
choosing, ordering, voicing and pacing those ideas around you. Ideas written to order on any subject need the online v2 (below).
Every v1 screen says plainly what's there and what isn't yet.

## 1. Pick your friend (learning style)

One onboarding screen: "How do you like to learn?" Five friends, each with a 5-second voice sample on tap. You can change it any time in
You, and per topic.

| Friend | Style | What changes in a lesson |
|---|---|---|
| Moti (elephant, remembers) | Deep dive | Full lesson order: hook, rule, example, claim with its source, recall question. Calm pace. |
| Chiku (squirrel, acts it out) | Story first | Opens with the idea's everyday scene (the hook as a little story), then the rule. |
| Kapi (monkey, puzzles) | Question first | Asks the recall question before the rule, then explains. |
| Mor (peacock, planner) | Just the steps | The rule plus a 2-3 line takeaway and the quest; the example is one tap away. |
| Kachhua (tortoise, slow) | Slow and gentle | Shorter sentences per screen, slower voice; the default for night listening. |

Nandi isn't a style: Train is parked, and Nandi stays the app's host.

v1 changes the ORDER, PACE, VOICE and the framing lines (one short intro and outro line per friend, written by hand and passed
through copy lint). It doesn't rewrite the fact-checked text. v2 (online): style-specific rewrites, generated on a server and checked
against the same claims before shipping.

## 2. Listen mode (voices)

- Every lesson can be read or played. Read-aloud uses the phone's own voice through `@capacitor-community/text-to-speech`
  (MIT, v8.0.2, Capacitor 8). It forwards Android's `onRangeStart` (API 26+), so the spoken word lights up as it's read, like
  BeFreed's narrated insight.
- Each friend has a fixed pitch and rate. Speed is 0.8x, 1x or 1.2x.
- Offline voices for en-IN and hi-IN aren't always installed. In setup, check for a local voice, and if there isn't one, offer
  Android's voice-install screen. Without a voice, Listen is hidden and reading works as today.
- Night: Listen plays only before bedtime, and under the night rules after it. No autoplay chains.

## 3. First lesson in 60 seconds (onboarding)

This replaces today's 3 Welcome steps with 5 short screens, one question each, and a progress bar:

1. Hello and the 18+ tick (as today).
2. "What do you want more of?" Pick up to 3: Calm and sleep, Focus and getting things done, Money sense, Understand people,
   How the world works, Fitness basics. This replaces today's single-pick GOALS.
3. "How do you like to learn?" (section 1).
4. **Your first idea, now:** a 60-second lesson picked from your top goal (Calm: sleep-memory; Focus: if-then-plans;
   Money: compounding; People: social-proof; World: pressure-cooker; Fitness: showing-up). It plays in your friend's voice with
   the words lighting up, then one tap-to-answer question. Every pick must be a fully fact-checked idea; if one isn't, the
   builder uses the topic's starter idea.
5. "Your path is ready", plus bedtime (as today). No notification ask here: it stays where it is now, the first time you schedule.

Skip is on every screen. The whole flow takes under 2 minutes.

## 4. Your path (personalised learning path)

- Learn opens on **Your path**: an ordered trail of ideas from your goals, grouped into short named stretches (about 4 ideas each).
  Example for Calm and Money: "Quiet the noise" (sleep-memory, if-then-plans, spotlight-effect, planning-fallacy), "Money that
  stays" (emergency-fund, inflation, compounding, upi-scams). Each idea shows one line on why it's on your path.
- **Refine:** add or remove goals, skip a topic, move a stretch up, change the friend for a topic, and set the lesson length
  (1, 3 or 5 minutes). Changes apply at once and never reset progress.
- The order comes from a small offline table: goal to idea ids with a rank. The prerequisites already in the packs are kept.
  Topics stay reachable in a "All topics" fold.
- Finite: one path, no feed. When the path runs out, it says so and offers to add a goal.

## 5. Ask for anything (recommendations on request)

- A box on Your path: "What do you want to understand?" v1 searches offline over idea titles, hooks, rules and a hand-written
  synonym list (for example "stress" also matches calm and sleep, "EMI" matches loan-emi). It shows up to 3 closest ideas with
  "Add to my path".
- If nothing fits, it says so plainly ("We don't have this yet") and saves the request to a local wishlist, visible in You.
- v2 (online, opt-in): wishlists are sent anonymously and counted to choose new packs; later, a path for any request is generated
  on a server from vetted sources and fact-checked before it reaches you. Premium+ (your own key) can come later still, per the
  master plan.

## 6. The Listening shelf (curated audio for your goal)

- **v1 offline:** NANDI's own ideas in Listen mode, gathered into 10-15 minute "listens" per path stretch.
- **Classics, India-safe:** a small shelf of public-domain books matched to goals, with the text from Project Gutenberg and the
  audio from LibriVox:

  | Book | Edition | Goal |
  |---|---|---|
  | Marcus Aurelius, *Meditations* | George Long translation | Calm |
  | Epictetus, *Enchiridion* | George Long translation | Calm |
  | *Bhagavad Gita* | Edwin Arnold, *The Song Celestial*, 1885 | Calm |
  | Franklin, *Autobiography* | his own text | Focus |
  | Smiles, *Self-Help* | original text | Focus |
  | Allen, *As a Man Thinketh* | original text | Focus |
  | *Arthashastra* | Shamasastry translation, 1915 | World |

  LibriVox audio is public domain in the US, so each title is checked for India: author's death year + 60 years, with the
  translation counted separately (digest: idea-engine/r32-research.md). Credit LibriVox and the reader on every title.
  - v1: these are downloads you choose (online once, then offline). They're labelled "Classic, read by volunteers" and never
    mixed with fact-checked lessons.
  - Each book gets a short NANDI "why read this" card, written by us. No summaries of in-copyright books.
- v2: licensed summaries only through a publisher deal, or our own original write-ups of ideas with editorial review.

## 7. The intro (two versions; Jenil picks)

Prototype: https://claude.ai/artifact/HJWc2VkiTgFDNxySHXMHiw. The end line for both is "NANDI: Peace of mind, one small step
a day." It plays once, on first run only, and Skip is always there. Under reduced motion it goes straight to the end card.
- **A, paper collage, a calmer feel:** a fast cut-paper rhythm with Indian craft paper (block print, kolam dots, marigold,
  indigo). Each friend pops in as a cut-out with one word: Plan, Move, Learn, Think, Wonder, Rest.
- **B, happy friends:** the sky turns from morning to night, the friends arrive one by one, with "Plan a little. Move a
  little. Learn a little. Rest well."

The friends' motion in the prototype is still the old rigid kind. Real motion comes with the rig work (item 136: Kapi first,
then all six), so the intro ships after that.

## Animation table

| Moment | Friend | Motion |
|---|---|---|
| Style pick, tapped | the friend | the rigged "hello" (Kapi: wave plus tail curl) and its voice sample |
| First lesson playing | your friend | small idle (breathing, blink) beside the text; nods at each new sentence |
| Right answer | your friend | cheer |
| Wrong answer | your friend | think (head tilt), never red |
| Path stretch done | your friend | cheer, plus the stretch name lights up |
| Ask box, no result | your friend | think, then "We don't have this yet" |

Rules as in spec 31: transform and opacity only, at most 1.2 s, never blocking a tap, and no motion under reduced motion.

## Tests

- Onboarding: each of the 6 goals gives a valid, fully fact-checked first idea; the flow finishes in 5 screens; Skip works on
  every screen.
- Path: same goals give the same order; prerequisites are respected; Refine changes never reset mastery; the path is finite.
- Ask: synonyms hit (for example "stress" returns a calm idea); with no match, the request goes to the wishlist.
- Listen: highlighting follows `onRangeStart`; with no voice, Listen is hidden; nothing plays after bedtime outside the night rules.
- Shelf: every classic has its India check recorded in the pack (edition, death year, translator) and a LibriVox credit.
- Screenshots: 360x800 of every new screen go to the idea engine before SHIP.

## Out of scope

AI on the phone; summaries of in-copyright books; social or public profiles; any paywall (tiers come in Phase 2).
