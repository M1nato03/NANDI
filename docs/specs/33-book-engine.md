# 33. The book engine (Phase 1 of the NANDI v2 plan)

Status: APPROVED by Jenil, 27 Oct 2026. He accepted all the recommendations in the v2 plan
(https://claude.ai/artifact/XdFNiwDziBSMHBTxdanhoE): "yep your recommendations are good".
Idea engine, 27 Oct 2026. This spec absorbs spec 32 (made for you): its later parts are listed under Phases 2-3 below.

## Decisions this rests on (Jenil, 27 Oct)

1. Tab bar: **Read · Plan · You**. Night stays as today's full-screen evening deck.
2. Train is parked: it leaves the tab bar, is reachable from You, and all data is kept.
3. The 6 topics become **NANDI Originals** books. No progress is lost.
4. First public-domain book: **How to Win Friends and Influence People** (1936 original text, public domain in India).
5. Private test books (Jenil owns physical copies): *Atomic Habits*, *The Psychology of Money*, *The 7 Habits of Highly
   Effective People*, *The 5 AM Club*. They're written by the idea engine and imported only on Jenil's phone (section 7).
6. Roadmap: Phase 1 (this spec) → Phase 2 voice and rigs → Phase 3 made for you → Phase 4 beta and SSIP. The next phase
   starts only after a gate is passed.

Unchanged: offline-first, no dark patterns, 18+, sourced facts only, one friend per panel, 360x800 screenshots before SHIP,
nothing pushed without Jenil's OK.

## 1. A book is a topic pack with book details

No new pack kind. `topic` packs gain an optional `book` block, and the validator requires it for every topic pack after the
migration (section 5).

```ts
book: {
  title: string; author: string; year?: number;
  rights: 'original' | 'public-domain' | 'private' | 'licensed';
  region?: 'IN';                       // a public-domain book that is only free in India
  edition?: string;                    // e.g. "1936 original text"; required when rights = public-domain
  authorDied?: number;                 // required when rights = public-domain; the validator checks year + 60 < this year
  cover: { palette: 'saffron'|'teal'|'rose'|'indigo'|'violet'|'leaf'; motif: 'kolam'|'stamp'|'halftone'|'stripes' };
  blurb: string;                       // one line, copy-linted
}
```

- **Chapters are the existing modules.** A module gains `minutes` (an estimate) and `check` (section 3).
- **Idea cards are the existing concepts,** unchanged: steps, claims, sources, recall, chiku.
- **New claim field `voice: 'author' | 'research'`.** The default is `research`. An `author` claim is shown as "Carnegie argues…" or
  "Clear says…", and it needs a source that is the book itself (chapter or page). Where the author's view differs from the
  research, the idea card adds one "What research says" line backed by a `research` claim. This keeps "sourced facts only" true for
  bestsellers.
- **Covers are typographic only:** the title in the display face on the palette, plus the motif. A real cover image is never used.

## 2. The Read tab (replaces Learn and Mind)

Top to bottom, at 360x800:
1. **Stage:** Chiku's teal FriendStage (until Phase 2's narrator pick), with the line "Your books".
2. **Continue:** the current book's next chapter as one big card: cover thumb, book title, "Chapter 3 · 9 min", and Start.
   This replaces "Today's drop". The night drop stays in the night deck.
3. **Review with Moti:** today's rose card, unchanged (idea checks, haveli, matka).
4. **Library:** shelves in this order: NANDI Originals, Classics (public domain), Private (only if a private pack is imported).
   Each shelf scrolls sideways with covers. Tapping a cover opens the book page.
5. **Games (optional):** a closed fold holding Kapi's shelf exactly as Mind has it today. Mind routes redirect here.

**Book page:** cover, title, author, year, the blurb, total minutes, and the chapter list with states (not started, in progress,
done, due for review). Start or Continue. For public-domain books: a line "Original 1936 text, free to read in India".
For private books: a small "Private copy on this phone" mark.

## 3. The chapter flow

Start a chapter →
1. Each idea card plays through today's step lesson (StepLesson/LearnDrop components): hook, rule, example, claim
   with its source, recall question. The mastery engine (BKT and FSRS per concept) is unchanged.
2. Then **one check**, set per chapter in `check`:
   - `recall`: Moti's haveli rebuild of the chapter's main takeaway (today's recall format).
   - `chiku`: Teach Chiku with the chapter's scene (today's chiku format).
   - `quiz`: three of the chapter's existing items, mixed.

   Kapi content games are Phase 3. Puzzles stay in the Games fold.
3. **Chapter done:** a card with the takeaway in one line, XP through the existing fact path (a `chapter:<bookId>:<moduleId>`
   fact, inside Learn's existing daily cap; no new currency), and Next chapter / Back to library.
4. **Book done:** the book joins "Finished" on the shelf, the courtyard Learn corner grows as today, and the next book in the
   library order is offered. No streaks and no loss states.

After bedtime: no new chapters (the same rule as today's drops). Reviews follow the existing night rules.

## 4. Tab bar, top dots, and routes

- The tab bar becomes **Read · Plan · You** (order: Plan, Read, You, so Plan stays first). Each target is 44 px or more.
- The top status dots become Plan, Read, Night (Train and Mind are gone).
- Routes: `learn/*` → `read/*`, and `mind/*` → `read/games/*`. Keep redirects so old links, notifications and backups still
  resolve. `train/*` still works and is reachable from You → "Train (paused)".
- Welcome's goal list: "Learn something" opens Read, and "Sharpen my mind" opens Read → Games. Phase 3 replaces Welcome.

## 5. Migration: the 6 topics become NANDI Originals

Concept ids stay the same, so all mastery, reviews, facts and backups carry over. Add a `book` block and split each topic's
single module into chapters of 3-4 ideas, in the order the topic teaches today:

| Topic | Book title | Chapters |
|---|---|---|
| psychology | Why We Do What We Do | 3 (habits and plans; mind tricks; others and us) |
| money-markets | Money, Plainly | 3 (money's value; growing money; staying safe) |
| how-things-work | How Things Work | 3 |
| history-civilisations | Ideas That Built India | 2 |
| health-nutrition | Eat, Drink, Sleep | 2 |
| body-training | Body Basics | 2 |

Rights: `original`. Covers: one palette each. The builder may adjust chapter splits to keep prerequisites in order.

## 6. The first classic: How to Win Friends and Influence People

- Content comes from the idea engine (Codex drafts, I review one full chapter, then a faithful-to-the-book check plus a research
  check). It arrives as `content/topics/book.how-to-win-friends.json` on an ideas branch for the builder to merge.
- It has 6 chapters following the book's parts:
  1. Handling people (3 principles)
  2. Making people like you (6)
  3. Winning people to your way of thinking (12, split over 2 chapters)
  4. Being a leader (9, split over 2)
- `rights: public-domain`, `region: 'IN'`, `edition: '1936 original text'`, `authorDied: 1955`.
- The lessons are our own words about the book's ideas, with short attributed quotes only from the 1936 text, never from the
  1981 revised edition.
- The builder doesn't wait for it: Phase 1 ships with the 6 Originals, and the classic drops in when it passes review.

## 7. Private books (imported on Jenil's phone only)

- **You → "Import a private book":** a file picker for one `.json` pack. It's validated with the same validator and must have
  `rights: 'private'`. It's stored in a new Dexie table `privatePacks`, and a "Remove" button deletes it.
- Private packs never appear in share cards, recaps or anything sent out, and never in the update manifest or app build.
- Local backup files include them, marked private, so a phone reset doesn't lose progress.
- **CI guard:** a test that fails if any file under `content/` (or anywhere in the repo) parses as a pack with `rights` set to
  `private` or `licensed`, or contains the marker `"nandiPrivate": true`.
- The idea engine writes the 4 private packs into `D:\NANDI-private\packs\` (never a git folder) and Jenil checks them against his
  copies. The text is our own write-up of each book's ideas, with short attributed quotes. No DRM is touched; they're written from
  the printed books Jenil owns.

## 8. Not in Phase 1 (planned)

- **Phase 2:** Listen mode (`@capacitor-community/text-to-speech` with `onRangeStart` word highlighting), narrator pick
  (the spec 32 style table), all 6 friends rigged like Kapi (D:\nandi-proto\kapi-motion), and night listening with Kachhua.
- **Phase 3:** a 5-screen onboarding with the first chapter in 60 s, Your path with Refine, Ask with a wishlist, Kapi content
  games as chapter checks, and the production intro A.
- **Phase 4:** a beta with Originals and classics only, plus the SSIP pitch (book list:
  https://claude.ai/artifact/Qct3N1HJ2PwPCeXFVuGuhf).

## Animation table

| Moment | Friend | Motion |
|---|---|---|
| Read tab opens | Chiku (stage) | idle (blink, breathe) |
| Chapter started | Chiku | nod |
| Right answer in a chapter | Chiku | hop |
| Wrong answer | Chiku | tilt, never red |
| Chapter check (recall) | Moti | the haveli moments as today |
| Chapter check (chiku) | Chiku | the stage moments as today |
| Chapter done | Chiku | cheer |
| Book done | Chiku, then the courtyard Learn corner | cheer, then grow (as today) |

Use the spec 31 moments for now. Phase 2 swaps them for rigged motion.

## Tests

- Migration: every existing concept id is still present; mastery, reviews and facts from a pre-migration backup show the same
  states after import.
- Validator: `book` is required on topic packs; a public-domain book needs `edition` and `authorDied` (year + 60 < this year);
  `author` claims need a book source.
- CI guard: a fixture pack with `rights: 'private'` placed under `content/` makes the guard test fail. Run it as a self-test,
  then remove the fixture.
- Private import: a valid private pack shows on the Private shelf and survives reload; Remove deletes it; it's absent from share
  cards and recaps.
- Read tab at 360x800: Continue is above the fold; Games stays closed by default; the old `learn/` and `mind/` links redirect.
- The chapter flow completes with each check kind; chapter XP stays within the cap; there are no new chapters after bedtime.
- Screenshots (360x800, light theme, seeded data) go to the idea engine before SHIP:
  - Read
  - a book page
  - a chapter mid-way
  - each check kind
  - chapter done
  - book done
  - You with the import entry and Train (paused)
  - Plan, to show it's unchanged

## Gate for Phase 2

Jenil finishes one whole book on his phone (an Original, or the classic if it's ready) and wants the next one.
