# 30. Teach Chiku, one card: Chiku acts out the answer

Status: DRAFT, waiting for Jenil's yes. Not for the builder until then.
Idea engine, 25 Oct 2026. Demo (round 3, Chiku tab): https://claude.ai/artifact/LVWKWGavbn6VpE6uxRvWEA

## Why

Jenil's notes on Chiku across three rounds:
- Round 1: "good but it needs to be simpler, it is pretty confusing as of now"
- Round 2: "the Chiku answer needs rework"
- Round 3: "Chiku's better, but make sure he is still there in the answer, not like these artifacts. Animate him
  or something."

So the game stays one question, three cards and one tap, and Chiku visibly acts out the answer on a small stage
instead of showing two text boxes.

## The game (about 20 seconds, at the end of a Learn lesson)

1. **Chiku is stuck.** On the stage, Chiku (think pose) asks about the lesson's idea in one line: "Kunal opens his
   flashcard app every time his train pulls out of the station. Why does he open it? Give me one card."
2. **Three big cards.** One names the real cause. Two are the idea's real `misconceptions` from the pack. The
   right card's position rotates.
3. **The new day, acted out.** A one-line caption sets it up: "New day: Kunal's train is cancelled, so he
   takes the bus." Then Chiku acts out its guess, using only your card:
   - Chiku walks on and the prop appears (a bus).
   - Chiku shows its guess with a thought bubble ("Your card says the train makes him open it. No train…") and
     then acts it: if the guess is "No", Chiku pats its pocket and leaves the phone; if "Yes", Chiku pulls the
     phone out.
4. **What really happened.** The scene replays the truth as a short action (on the bus, the phone stays in the
   pocket), with a caption: "What happened: on the bus, Kunal forgot the app."
   - If Chiku's guess matches, Chiku cheers: "Got it, because your card named the real trigger."
   - If not, Chiku scratches its head: "My card said wanting to revise, but he still wanted to and didn't open
     it. The train was the trigger. Got another card?" The other cards stay tappable.
5. The mistake always belongs to Chiku and the card, never to "you". No red, no score, no loss.

## How the stage works (no custom art per idea)

- One stage component: Chiku (existing Cast poses idle, think, cheer, rest, plus simple CSS moves: walk on,
  hop, pat, reach, scratch) and ONE prop from a small library of about 24 simple SVG props (bus, train, phone,
  book, clock, bed, plate, cup, laptop, coin, shop, tree, rain, sun, door, bag, cricket bat, gym weight,
  notebook, alarm, fan, road, crowd, mirror).
- Each scene is data, so editors write it without code:

```json
"chiku": {
  "ask": "Kunal opens his flashcard app every time his train pulls out of the station. Why does he open it?",
  "cards": [
    { "text": "The train leaving the station", "correct": true },
    { "text": "Wanting to revise", "misconceptionId": "goal-starts-habit" },
    { "text": "Having free time", "misconceptionId": "free-time-starts-habit" }
  ],
  "newDay": { "caption": "New day: Kunal's train is cancelled, so he takes the bus.", "prop": "bus", "question": "Will he open the app on the bus?" },
  "guesses": [
    { "answer": "no",  "why": "Your card says the train makes him open it. No train today, so no app.", "act": "pat-pocket" },
    { "answer": "yes", "why": "Your card says wanting to revise makes him open it. He still wants to.", "act": "pull-phone" },
    { "answer": "yes", "why": "Your card says free time makes him open it. He has free time on the bus too.", "act": "pull-phone" }
  ],
  "truth": { "answer": "no", "caption": "On the bus, Kunal forgot the app.", "act": "pat-pocket" }
}
```

- Acts are a fixed set of about 10 (pull-phone, pat-pocket, open-book, close-book, eat, skip, sleep, wake,
  pay, walk-away), each a short pose-plus-prop motion.

## Content

- Pilot: 10 Psychology ideas (the pack with the best `misconceptions` coverage). Every card and the truth must
  trace to the idea's claims; quote the claim id in an editor column. Draft them with Codex, then editors
  sign off.
- An idea without a scene simply has no Chiku step. Nothing is faked.

## Rules

- Optional, once per lesson, after the lesson's last step. "Skip" is always visible.
- XP: flat for playing, the same whichever card is chosen first. After bedtime: no Chiku step.
- No timer, no streak, no "teach more" feed.
- Claims: the evidence is the "protégé effect" (Chase et al. 2009) and Betty's Brain (Biswas et al. 2005),
  both with schoolchildren. The app makes no learning claims for adults.

## Chiku's animations (standing rule; this IS the game)

| Moment | Size | Animation |
|---|---|---|
| Chiku is stuck | minor | Think pose, head tilt, a "?" bubble. |
| Card tapped | minor | Chiku takes the card and tucks it under its arm. |
| New day | major | Chiku walks on; the prop slides in. |
| Chiku's guess | major | Thought bubble with the reason, then the act (pull-phone, pat-pocket and so on). |
| What happened | major | The truth act replays; the caption fades in. |
| Right | major | Chiku cheers and hops. |
| Wrong | minor | Chiku scratches its head and holds out its hand for another card. |

Reduced motion: each beat is a still frame with its caption; nothing moves. Total length under 6 seconds per
playthrough; a tap anywhere skips to the end of the current beat.

## Tests

- 3 cards, the right one's position rotates, misconceptions link to real ids.
- Each card plays its own guess and act; the truth always plays after.
- A wrong card leaves the others tappable; there's no red anywhere.
- Reduced motion shows still frames with all captions.
- Tap-to-skip; Skip works; after bedtime the step is absent.
- 360 px with root font-size 20 px: the stage, cards and captions fit with nothing clipped.
- Content lint: every scene field is present; acts and props come from the fixed lists.
