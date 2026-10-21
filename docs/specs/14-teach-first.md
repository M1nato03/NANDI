# 14 · Teach first: small steps, then practice (owner feedback, 2026-10-21)

Jenil, after using Learn: "It just asks you questions and gives you the answer. It feels like repetition ... you are
trying to just get me to memorize things. You are not teaching me." Duolingo "teaches you a simple thing, a bit
smaller thing" and spends a whole lesson on it.

## 1. Diagnosis (measured on main beb423b)
- A drop is only questions. The concept `hook` is shown only on the topic card; the `rule` appears only after an
  answer, as a paragraph under the feedback. Nothing is taught before the first question.
- Spec 09 promised "concrete → abstract: one vivid example, then the rule, then a second example" and "worked
  example → faded". Neither was built. Only the "question first" half of the research shipped.
- One concept packs 3–4 ideas into one rule (habits = cue + repetition + 18–254 days + one miss is fine), then asks
  8 questions of 10 different types about all of it. Big chunk, zero teaching, many formats: it feels like a quiz on
  facts you were never told.

## 2. What the evidence says (opened sources)
- **Guessing first helps only when a lesson follows, and only for the guessed fact.** Meta-analysis of prequestions:
  g = 0.54 for the prequestioned facts, g = 0.04 for anything else; smaller for conceptual questions (0.28 vs 0.58).
  The studies all have a study phase (text or video) after the prequestions. NANDI asks with no study phase.
  St. Hilaire, Chan & Ahn, Psychonomic Bulletin & Review 2024, doi 10.3758/s13423-023-02353-8.
- **Retrieval practice works on material already studied.** Roediger & Karpicke recalled prose they had read first.
  Quizzing is for keeping what was taught, not a way to teach it (already in docs/research/learning-science.md).
- **Small steps, practice after each, about 80% success.** "Only present small amounts of new material at any time,
  and then assist students as they practice this material. Only after the students have mastered the first step do
  teachers proceed to the next step." Best teachers: 82% correct answers vs 73% for the least effective; "the
  optimal success rate ... appears to be about 80 percent." Rosenshine, Principles of Instruction, American
  Educator, Spring 2012 (aft.org/sites/default/files/Rosenshine.pdf).
- **Novices learn more from being shown, then guided.** Worked examples: g = 0.48 across 55 studies (Barbieri et al.,
  Educational Psychology Review 2023). Minimal guidance overloads novices (Kirschner, Sweller & Clark 2006); the
  benefit fades as expertise grows, so support must be removed step by step (Kalyuga et al. 2003).
- **Split explanations into learner-paced pieces; teach key terms first.** Segmenting (median effect 0.79) and
  pre-training (0.75) in Mayer's multimedia principles (Cambridge Handbook of Multimedia Learning, 2014).
- **What Duolingo actually says it does:** each lesson introduces a handful of new words placed in familiar sentences,
  exercises start simple and lead to "more challenging examples so you can apply what you've learned to new contexts",
  with "optional hints and bite-sized explanations" (blog.duolingo.com/duolingo-teaching-method,
  blog.duolingo.com/right-level-of-difficulty). Brilliant does problem-first too, but the problem is a guided,
  visual, one-idea-at-a-time interactive that the learner can solve, not a fact they cannot know
  (brilliant.org/resources/choosing-brilliant/how-brilliant-teaches-math).

So: keep spacing, retrieval and interleaving for review. Add the missing half: teach one small idea, show it, guide
the first tries, then let the learner apply it alone.

## 3. The new shape
**Concept → 2–3 steps.** A step is one idea that fits in one short sentence. Habits becomes:
1. A cue starts a habit. 2. Repeats in the same setting make the link stronger. 3. It takes weeks, it varies,
and one missed day does not reset it.

**A lesson teaches one step in about 2 minutes, 6–7 screens ("show, guide, try"):**
1. *Hook* — one relatable question with a quick tap guess (a prequestion, now followed by the lesson).
2. *Teach card* — the idea in at most 2 short sentences (≤ 30 words) plus a simple diagram drawn from data
   (flow: chips with arrows; compare: two columns; scale: a bar). Tap to continue.
3. *Show me* — a worked example: a 1–2 sentence story; the learner taps the part of the sentence that is the idea
   (new `spot` item: sentence split into chips, one is right). Wrong tap shows the answer highlighted; no penalty.
4. *Guided try* — an easy choice question with a "Show hint" button; aim for ~90% first-try correct.
5. *Second example, new setting* — same idea in a different life area, still with a hint.
6. *Your turn* — a harder scenario with no hint (from the existing items, tagged to this step).
7. *Takeaway* — one line to remember, plus the diagram again. Then the finish moment (spec 13 E).

**Drops:** a daily drop = one new lesson (if a step is unlocked) + 3–4 review questions from earlier steps
(the existing items, spaced and interleaved as today). About 4 minutes. No new step until the previous one has had
its first review, so new material never piles up (Rosenshine: master one step before the next).
**On a wrong review answer** show that step's teach card and diagram again ("See the idea again"), not a paragraph.

## 4. Content model change
```
concept.steps: [{
  id, title,                      // "A cue starts a habit"
  hook: { stem, options[3] },     // guess question, feedback on each option
  teach: string,                  // ≤ 30 words, Flesch ≥ 70
  visual: { kind: 'flow', nodes: string[] } | { kind: 'compare', left: {title, lines[]}, right: {...} }
        | { kind: 'scale', label, min, max, marks: {at, text}[] },
  example: { text, spot: string, feedback },   // spot = exact substring of text that is the idea
  guided: [ itemId, itemId ],     // choice items with a new optional `hint` field
  practice: [ itemId… ],          // existing items, now tagged to one step
  takeaway: string                // ≤ 15 words
}]
```
Existing items stay as the review and practice pool. Every teach, takeaway and example sentence is a claim and goes
through the same fact-check gate as rules (validator: claims + verdicts).

## 5. Worked example — Psychology › Habits › step 1 "A cue starts a habit"
1. Hook: "Why do many people grab their phone the moment they get home?"
   - "Something about getting home sets it off." ✓ — "Right. Something just before the act can start it. That is a cue."
   - "They decide to, every single time." — "Often there is no fresh decision. Something before the act sets it off."
   - "Phones send more alerts in the evening." — "Alerts can pull us in, but the grab happens even with no alert."
2. Teach: "A habit often starts with a cue: a place, a time or an action just before it. The cue sets the act off,
   with little thought." Visual: flow [Cue] → [Act] → [Small reward].
3. Show me: "After brushing his teeth, Arun does ten push-ups." Tap the cue → "After brushing his teeth".
4. Guided: "Every time Meera sits on the bus, she opens a game. What is the cue?" — Sitting on the bus ✓ / Opening
   the game / Winning a level. Hint: "The cue comes just before the act."
5. Second example: "Ravi studies best at the library desk, but not at home. What might be missing at home?" —
   The desk cue ✓ / His goal / His books. Hint: "Which thing only exists in one place?"
6. Your turn: existing habits-4 (bag on the hook) and habits-1 (hostel dinner and desk).
7. Takeaway: "Find the cue, and you find what starts the habit." Diagram again.

## 6. Pilot, then roll out
- **Pilot: Psychology only** (10 concepts → about 25 steps). The other topics keep today's drop until the pilot is
  judged. A topic without `steps` falls back to today's behaviour, so nothing breaks.
- Build: `spot` renderer, teach card + 3 data diagrams, hint button, lesson sequencer, drop composer change,
  "See the idea again" on a miss, validator rules for steps (lengths, Flesch ≥ 70, spot is a substring, every
  practice item tagged to exactly one step).
- Content: writer drafts steps; every step goes through the existing editorial + fact-check pass.

## 7. How we will know (kill test)
- Guided tries: first-try correct 85–95%. Below 80% means the teach card is unclear; above 95% means too easy.
- Your-turn questions: ~80% (Rosenshine's target).
- 7-day review accuracy on pilot steps vs the other topics on today's drop (existing retention checks).
- Jenil's phone test after one week: "it teaches me" or not. If not, the pilot stops before any other topic is converted.
