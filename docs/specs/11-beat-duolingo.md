# 11 · Beat Duolingo (owner ask, 2026-10-20)

Owner goal: NANDI must be **more fun to come back to than Duolingo** (and than Instagram), not just as good.
The learning engine is already stronger than Duolingo's (spec 09). The gaps are fun, character, polish and content.
This spec lists every Duolingo pull mechanic, what NANDI does instead, and the rule that keeps it kind.

## 0. Rules for everything below

- **No copying.** Game mechanics are free to use; names, art, sounds, characters and text are not. Never use
  Duolingo's names or words: Duo, owl, Lily, Zari, lingots, gems, hearts, "Diamond League", "Streak Society",
  "Legendary", "Super", "Max", their path shapes, sound effects or colours. All art, sound and copy is our own.
- **Kind, not punishing.** No hearts/lives that stop you learning, no guilt notifications, no random loot, no fake
  scarcity, no endless feed (research: ~/nandi-briefs/research-warmth-restdays-2026-10-20.md). Rewards are fixed and
  predictable; every session ends on a clear stop.
- **Offline and private.** Everything runs on the phone. No accounts until master-plan Phase 4.
- **Reduced motion respected** everywhere; animations ≤ RULES.juice timings; sound is optional.

## 1. Feature map

| Duolingo pull | NANDI version | Status |
|---|---|---|
| XP, levels | XP + levels (spec 05) | done |
| Streak + freeze + repair | Streak, rest-day bank (4/month, cap 12), 48 h repair, days away | done |
| Leagues | Season ladder, 500 seats, rise-only | done |
| Gems + shop | Shards + shop (themes, sounds, packs, rest day) | done |
| Daily quests | **3 Daily quests** (rotate, e.g. "Finish a drop", "Get 5 right in a row", "Plan tomorrow"), fixed Shard reward; **monthly challenge** badge | new (W1) |
| Achievements | **Badges** with 3 tiers (bronze/silver/gold), ~20 badges across Plan/Train/Learn/Mind/Night | new (W1) |
| In-lesson combo | **Combo counter** in a drop ("4 in a row"), **Perfect drop** bonus XP | new (W1) |
| XP boost | **Focus boost**: completing all 3 daily quests gives 15 min of 2× XP (fixed, announced) | new (W1) |
| Learning path | **Trail map** per topic: winding path of concept nodes, checkpoint every 4–5 nodes, unit chest (fixed reward), Gold review when mastered | new (W1) |
| Legendary levels | **Gold review**: a harder no-hint review of a mastered concept; node turns gold | new (W1) |
| Owl + cast | **Nandi** the young bull + 5 friends (§2), original SVG, animated | new (W2) |
| Animations | App-open animation, mascot reactions, finish moments, unit-complete scene | new (W2), finishes done |
| Sound effects | Own synthesized sound set (correct, combo, finish, chest, level-up), opt-in packs | new (W2) |
| Stories | **Tales**: 2-minute illustrated stories per topic with the cast, 3 questions inside | later (W3b) |
| Courses | Topics: money, psychology, how things work, body + **History & civilisations**, **Health & nutrition** | new (W3) |
| Friends / friend quests | Needs accounts → Phase 4 | later |
| Year in review | Weekly recap (done); season recap at season end | partly done |
| Admin analytics | **Owner panel** (local, PIN): opens, streak, drops, accuracy, retention 7/30, pauses, errors | new (W4) |

## 2. The cast (original characters, Indian roots)

| Character | Animal | Role and where they appear | Voice |
|---|---|---|---|
| **Nandi** (lead) | friendly young bull, cream with a soft orange scarf; no religious symbols (owner, 10-20) | guide: app-open, Today, finishes, streak days, Done for today | steady, warm, few words |
| **Moti** | baby elephant | memory keeper: reviews, retention checks, Gold review ("I kept this one for you") | gentle, proud |
| **Chiku** | squirrel | curious quizmaster: Learn drops, Guess-first items, combos | quick, playful |
| **Kapi** | monkey | puzzle friend: Mind boards, hints, cases | cheeky, clever |
| **Mor** | peacock | celebrations: level-up, season ladder, shop, badges | proud, bright |
| **Kachhua** | tortoise | rest and night: rest days, days away, night deck, App pause | slow, calm |

Style: flat, rounded shapes, 2–3 colours each from the theme tokens (light + dark), big eyes, no outlines heavier
than 2 px, drawn as inline SVG so they scale and animate with CSS. Each has 4 poses: idle, cheer, think, rest.

## 3. Workstreams

- **W1 Gamification core** (Codex B): daily quests + monthly challenge, badges, combo + perfect drop, focus boost,
  trail map + checkpoints + unit chest + Gold review. Data in settings rows / ledger facts (no new tables; backups
  must keep restoring). Rules in RULES with bounds.
- **W2 Cast + animation** (Codex A): six SVG characters × 4 poses, app-open animation (≤ 1.2 s, skippable,
  once per cold start), mascot placement per §2, sound set, unit-complete scene.
- **W3 Content**: History & civilisations and Health & nutrition topics, one module each first (8–10 concepts,
  ~80 items, sources for every claim, editorial + fact-check review files like the existing topics). Health content
  is general education, never medical advice; myths cite primary sources.
- **W4 Owner panel** (Claude): hidden entry (long-press the version line in About → PIN), local-only numbers and
  7/30-day charts from the ledger, settings and error ring.

## 4. Acceptance (each workstream)

Full gate (typecheck, lint, copy-lint, banned-words, vitest, packs, build, e2e ×2 at 390 and 360), screenshots in
light and dark at 360 px, no new console errors, every new animation off under reduced motion, no Duolingo term in
code or copy (`grep -i` check in the gate), DECISIONS.md row per workstream.
