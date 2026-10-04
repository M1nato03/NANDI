# 07 · Content packs and the Claude bridge

**Claude is an author, never a runtime service.** When Jenil has a Claude plan, Claude Code writes new content as JSON into `content/`. CI validates it with the same schemas the app uses and deploys it to `/packs/`. The app downloads it with no login and keeps it forever. In the other direction, the app exports a **weekly summary** JSON that Jenil can attach to a Claude chat for a review. Without a plan, the app is complete. With one, it gets better.

## 1. Pipeline

```
content/<kind>/<packId>.json  ──git push──▶  CI: validate-packs (Valibot, same schemas as app)
                                             build-packs → dist/packs/v/<packId>@<version>.json (immutable)
                                                         → dist/packs/index.json (no-cache, CORS *)
App (launch, ≤1×/day, or "Check for content"):
  fetch ${PACKS_ORIGIN}/packs/index.json (network-first; absolute origin in the APK) → for each newer pack: download → sha256 check → schema check → minAppVersion check
  → store in Dexie `packs` (keep the old version until the new one passes) → UI reads the latest valid version
Bundled seed: the build also embeds the current packs, so a fresh install works offline on first launch.
```

**`index.json`:**

```ts
type PackIndex = {
  generatedAt: string;               // ISO
  packs: Array<{
    id: string;                      // stable, e.g. "lessons.gita-restless-mind"
    kind: 'lessons'|'deck'|'puzzles'|'program'|'rules'|'mystery-arc'|'shop';
    version: string;                 // semver; bump on any change
    schema: number;                  // integer major of the pack schema
    minAppVersion: string;           // semver
    url: string;                     // "/packs/v/<id>@<version>.json" (relative to PACKS_ORIGIN)
    sha256: string;
    bytes: number;
  }>;
};
```

**Common envelope** (every pack file):

```ts
type PackEnvelope<K, B> = {
  id: string; kind: K; version: string; schema: number; minAppVersion: string;
  title: string; description?: string; author: 'claude'|'jenil'|'legacy';
  createdAt: string; changelog?: string;
  body: B;
};
```

**Progress-safety rules:**

- Item IDs inside a pack are **stable and never reused**. Progress is keyed by `packId + itemId`. Lesson recall cards have no IDs in the pack; their ID is derived as `<courseId>-<lessonId>-<n>` (n = 1, 2), matching the prototype.
- Removing an item hides it but keeps its history.
- Packs are untrusted input: validate them, never `eval`, and render text as plain text or a minimal sanitised markdown (bold, italic, line breaks).

## 2. Pack kinds and schemas

### 2.1 `lessons`: courses like the Gita and Charaka tracks

The body mirrors the prototype's lesson objects (`legacy/src/lessons_gita.js`, `lessons_charaka.js`). Convert them with `scripts/convert-legacy.ts`.

```ts
type LessonsBody = {
  course: { id: string; name: string; short: string; tint: 'gita'|'charaka'|'money'|'bias'|string;
            blurb: string; note: string };                   // note = footer (e.g. "Educational, not medical advice…")
  lessons: Lesson[];
};
type Lesson = {
  id: string; t: string; bonus?: boolean;
  scene: string; q: string; o: string[]; a: number;             // guess (options shuffled at display)
  rv: string; pic: Diagram;                                     // reveal + one diagram
  term: { w: string; g: string };
  v?: Verse[];                                                  // scripture sources, OR:
  src?: { ref: string; line: string; s?: string; n?: string };  // text sources (e.g. Charaka, New Edition numbering)
  grade?: { g: string; n?: string }; sci?: string;              // evidence grade + "what research says"
  par?: string;                                                 // modern parallel
  st: [string, string]; rule: string;
  tr: { s: string; q: string; o: string[]; a: number; w: string };   // transfer check
  wy: { q: string; o: string[]; a: number; f: string };              // why pick
  pl: { i: string[]; t: string[] };                                  // if-then presets
  cards: Array<[string, string]>;                                    // 2 recall cards
  sl: string;                                                        // sleep thought (night mode)
};
type Verse = { ref: string; who: string; s: string; i: string; m: string; n?: string };
type Diagram =
  | { k:'split'; l:string; ls?:string; r:string; rs?:string; hi:'l'|'r' }
  | { k:'chain'; steps:string[]; hi?:number }
  | { k:'three'; top:string; items:[string,string,string] }
  | { k:'thirds'; items:[string,string,string] }
  | { k:'stairs'; steps:Array<[string,string]>; label?:string; desc?:boolean }
  | { k:'meter'; zones:string[]; hi:number; label?:string }
  | { k:'ring'; center:string; outer:string[]; shell?:string }
  | { k:'cycle'; nodes:[string,string,string,string]; hi?:number }
  | { k:'curves'; a:string; b:string }
  | { k:'wave'; top:string; bot:string; line:string; cap:string }
  | { k:'balance'; l:string; r:string; mid:string };
```

**Validation rules beyond types:**

- `a` is within range.
- Options are unique.
- There are exactly 2 story beats and 2 cards.
- Text-length limits: scene ≤ 300 chars, option ≤ 160.
- Charaka-style packs require `grade` and `sci`.

### 2.2 `deck`: people-reading items (Greene and future topics)

This mirrors `legacy/src/content.js`.

```ts
type DeckBody = {
  topics: Record<string, { name: string; short: string; notes?: string }>;   // e.g. LAWS 4,12,14,19,40
  tactics?: Record<string, string>;     // canonical answer labels for "spot the move"
  types?: string[];                     // person types for "spot the type"
  cards: Array<{ id: string; topic: string; order: number; front: string; back: string }>;   // recall cards
  items: Array<
    | { id:string; t:'scenario'; topic:string; d:number; scene:string; text:string; q:string; opts:string[]; a:number; why:string }
    | { id:string; t:'spot'; kind:'move'|'type'; topic:string; type?:string; avoid?:string[]; d:number; who:string; sub?:string;
        msgs: Array<['t'|'m'|'d', string]>; tell:number; why:string }
    | { id:string; t:'mystery'; d:number; title:string; text:string; clues:string[]; q:string; opts:string[]; a:number; hint?:string; why:string }
    | { id:string; t:'teaser'; d:number; text:string; opts:string[]; a:number; hint?:string; why:string }
  >;
};
```

Here `d` is the difficulty on the Elo scale (about 900–1,200). The 40 law cards in `legacy/data/legacy-export.json` become `cards` in the Greene deck pack. Their SRS state imports separately into the `cards` table.

### 2.3 `puzzles`: handcrafted puzzle packs (Shard sink)

```ts
type PuzzlesBody = {
  theme: string;                                     // e.g. "Monsoon set"
  boards: Array<{ id: string; type: 'sudoku'|'crowns'|'sunmoon'|'path'|'calc'; diff: 'easy'|'medium'|'hard';
                  data: unknown }>;                  // the same shape the generator returns (see legacy/src/puzzles.js)
};
```

**CI must run the uniqueness counter and the logic solver on every board** and reject any that fails. Number Path boards get the uniqueness check only, until its logic solver exists (Phase 3). These packs earn no XP beyond the Mind cap.

### 2.4 `program`: workout programs

```ts
type ProgramBody = {
  track: 'gym'|'bodyweight';
  exercises?: Array<{ id:string; name:string; pattern:string; equipment:string[]; cues:string[]; image?:string; licence:string; attribution?:string }>;
  ladders?: Array<{ id:string; pattern:string; steps:Array<{ exerciseId:string; sets:number; repMin?:number; repMax?:number; holdS?:[number,number] }> }>;
  templates: Array<{ key:string; name:string; slots:Array<{ order:number; exerciseId?:string; ladderId?:string; pair?:string;
                     sets:number; repMin?:number; repMax?:number; holdS?:[number,number]; restS:number;
                     rule:'double'|'ladder'|'time' }> }>;
  weeklyTarget: number; notes?: string;
};
```

The two defaults from `03-train.md` ship as `program.gym-foundations` and `program.hostel-bodyweight`.

### 2.5 `rules`: bounded overrides of `rules.config.ts`

```ts
type RulesBody = { overrides: Partial<DeepWritable<typeof RULES>>; reason: string; effectiveFrom?: string };
```

- Only keys listed in `RULES_BOUNDS` can be overridden, within their min/max (e.g. `tasks.postpone.weeklyBudget` 3–15, `mind.dailyCap` 40–120).
- Every rules pack carries `effectiveFrom` (a dayKey, default: the day it's installed). **It applies forward only**: past days keep the rules they were scored with, so XP, level and Shards never decrease.
- The app shows "Rules updated: <reason>" once.

### 2.6 `mystery-arc`: season story framing

```ts
type MysteryArcBody = {
  arc: { id: string; season: string; title: string; logline: string };
  chapters: Array<{ id: string; title: string; panels: Array<{ id: string; text: string; unlock: 'case'|'boss' }> }>;
};
```

Cases stay procedurally generated. The arc only reveals a panel per solved daily case, and a chapter finale on Sunday's case (hard). **Four arcs and four shop catalogues ship bundled** and cycle if no new pack arrives, so seasons never depend on Claude.

### 2.7 `shop`: the season's catalogue

A list of items: id, kind (cardBack | banner | theme | soundPack | puzzlePackRef), price (within the bounds in `RULES.shards.prices`), season, and asset refs. Assets are bundled or downloaded as static files and listed with sha256.

## 3. Authoring workflow for Claude Code

1. Pick the kind and a stable `id`, e.g. `lessons.money-basics`.
2. Write `content/<kind>/<id>.json` against the schema. Bump `version` on any edit.
3. Run `npm run validate-packs`, plus the puzzle checks for `puzzles` packs.
4. Commit with `content(<kind>): <what> (v<version>)` and push. CI deploys.
5. On the phone, use "Check for content", or wait for the daily check.

**Content quality checklist (lessons and decks):**

- **Situation-first:** each item opens with a scene from his life (hostel, IITRAM, hackathons, trading club, Rajkot family, WhatsApp). It must not read like the book.
- **One defensible answer:** exactly one, and the `why` explains why the most tempting wrong option fails.
- **Specific claims:** every factual claim is specific and sourced (in `src`, `sci` or `par`). Evidence grades are honest, including "Contradicted" where it applies.
- **Health:** no medical or disease claims; no herbs or formulations. Charaka references use New Edition numbering.
- **Scripture:** own-words meanings, verified verse text, the sensitivities from `04-mind.md` section 4. No caste content as lessons.
- **Tone:** simple English, short sentences, no "you should".
- **Originality:** no copyrighted quotations beyond short fair use, and no franchise characters.

**Ideas queued for future packs** (from the research): money basics (India-specific; date-stamp every number), bias training and probability, Arthashastra versus 48 Laws debates, Psycho-Cybernetics, and new Arc stories each season.

## 4. Weekly summary export (app → Claude chat)

Ground → "Export week for Claude" shares `prime-pocket-week-YYYY-Www.json`. It contains no free-text diary unless he opts in.

```ts
type WeeklySummary = {
  app: 'prime-pocket'; formatVersion: 1; appVersion: string; rulesVersion: number;
  week: { isoWeek: string; from: string; to: string };           // dayKeys
  tasks: { planned: number; done: number; doneFirstDayPct: number; startAdherencePct: number;
           postpones: number; budget: number; overBudget: boolean; reachedThirdPct: number;
           reasons: Record<'underestimated'|'blocked'|'lowEnergy'|'avoided'|'real', number>;
           estimateRatioByCategory: Record<string, number>; focusMinutes: number; switchesPerBlock: number;
           rituals: { plans: number; shutdowns: number; review: boolean } };
  train: { sessions: number; target: number; minimumSessions: number; safetyStops: number; restDayChecks: number;
           prs: Array<{ exercise: string; kind: string; value: number }>; ladderSteps: Record<string, string>; heatMode: boolean };
  mind: { dropDays: number; mysteriesSolved: number; boards: Record<string, { solved: number; medianSec: number; hints: number }>;
          lessonsDone: string[]; plansFired: { yes: number; partly: number; no: number; na: number };
          cardsReviewed: number; recallRate: number; flaggedItems: string[] };
  economy: { xp: number; level: number; seasonRank?: number; tier?: string; streakDays: number; cleanWeek: boolean;   // rank/tier from Phase 3
             hatTricks: number; freezesUsed: number };
  life: { reelsBuckets: string[]; wellbeingMinutesWeek?: number; lightsOut: string[]; bedtimeTarget: string;
          nightOverrides: number; agencyScore?: number; openedInsteadOfTask?: boolean };
  guard: { appMinutesExclTimers: number };
  errors?: Array<{ at: string; where: string; code: string }>;
};
```

**Suggested prompt** Jenil pastes with the file in a Claude chat: "Here's my Prime Pocket week. Compare it with last week and my baseline, tell me the one change that would help most, and if any rule needs retuning, draft a `rules` pack override with the reason." Claude Code can then add that pack to the repo.
