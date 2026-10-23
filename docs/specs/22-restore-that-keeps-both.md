# Spec 22 · A restore that keeps both (merge restore)

Status: DRAFT v3 for Jenil (idea engine, 24 Oct 2026; v2 and v3 after two Codex B reviews, idea-engine/codex-review-spec22.md). Not approved. Until it is, restore stays **replace**, with a clear
warning in the preview (Jenil, 23 Oct: "for now replace it is, but I would like if you found a way to keep them").

## Why
Today a restore clears the phone and loads the backup (`src/data/backup/index.ts` `importBackup`,
`clearTablesBeforeImport: true`). Measured on ship-32 (cloud jobs cj3-clock-fuzz C1 and cj3-old-backups §2.2):
- A Rest day or banner bought today, before the restore, is gone. Its Shards are refunded or lost.
- Tasks, Learn answers and Mind runs done on this phone since the backup are gone. The preview warns, but people lose
  real work. The usual case is a new phone, used for a few days before the old backup is found.
- Closed days can show fewer Shards after the merge (99 -> 84), because the backup's purchases are charged against
  this phone's close.

The architecture planned the answer from day one: every row has a ULID `id`, `updatedAt`, a `deleted` tombstone and
`deviceId`, and "ledgers from two devices merge by set union" (`docs/specs/01-architecture.md:90, :135, :160`; research
brief: "sync by file … import on device B with a merge by `updatedAt`, reusing the backup code"). Spec 22 builds that
merge and makes it the default restore.

## What the person sees
The restore preview gets two choices:
- **Add this backup to this phone** (default). "Nothing on this phone is removed. Where the same item was changed in
  both, the newer change wins." It also shows the counts it will add, e.g. "Adds 412 answers, 38 tasks, 61 days".
- **Replace this phone with the backup** (secondary). "Everything on this phone, including today's purchases and
  Shards, is replaced by the backup's."
After a merge: XP, level, Shards and owned items are never lower than this phone showed just before. Nothing the
backup had is missing.

## The promise, stated exactly
- **Ledger facts are never lost**, with two stated exceptions: a malformed fact is skipped (and counted in the message),
  and two different facts that share one id keep one of them by a fixed rule, the same whichever side came first.
- **Shown XP, level, Shards and owned items never go below what this phone showed just before the merge.** Neither does a
  finished day's XP, streak or Shards as recorded in either side's close.
- **Editable rows** (a task title, a setting) follow "the newer change wins". Where a row holds progress (quest taps, a
  day's flags, a puzzle grid, practice state), progress from both sides is **combined, not chosen**.
"Nothing is lost" is promised for facts and progress. A text edit made on both sides keeps the newer one. That is the one
honest exception, and the preview says so.

## Before anything changes (inside `duringRestore`, under the `nandi-economy` lock)
1. **Validate every backup row**, not only the table list (`backup/index.ts:112` checks metadata only): required fields
   and types per table. A malformed row is skipped and counted in the result message ("3 damaged rows skipped").
2. **Snapshot what the phone shows now:** `deriveEconomy` for today gives XP, level, Shards and owned. Raise and write
   `economy.peak` from it before any table is touched. Today has no close, and the peak is otherwise written only by
   reconcile (`gamify.ts:65`). This closes the gap Codex found: an after-bedtime answer from the backup can cancel a
   perfect-drop award, and a season rank can move.

## Merge rules per table
| Data | Rule |
|---|---|
| `ledger` | **Union by id.** Same id and identical payload: one fact. Same id with a **different** payload (e.g. `card:<day>:<card>` answered on both phones): keep the variant whose canonical-JSON hash is lower. It is one award per card per day either way, so nothing is paid twice, and the result does not depend on order. |
| `ledger` purchases | The same purchase id must agree on item, price and day; if not, the lower hash wins as above. **Every accepted purchase fact is charged.** Owned is deduplicated. A second purchase of an item already owned (bought on both phones) gets a recorded `refund:<purchaseId>` fact for the later-id purchase, so nobody pays twice for one item. |
| `tasks`, `plans`, `reminders`, `exercises`, `programs`, `flags`, `ratings`, `unlocks`, `inventory` | The newer `updatedAt` wins. A tombstone is a row, so a newer delete beats an older edit. A tie is broken by the higher canonical hash, never by `deviceId` alone. |
| `taskEvents`, `focus`, `sessions`, `sets`, `prs` | Union by id (append-style records); same-id conflicts by hash. |
| `quests` | Per quest: **union of `tapIds`**, `progress` = taps x step (capped at target). `status` = done if the merged taps reach the target; otherwise the newer side's status. |
| `dailyLog` (key = day) | The newer row wins, so a correction (e.g. `planDone: false`) is kept. One exception: a field the newer row does not have at all (undefined) is filled from the older row, so `shutdownDone` from one phone and `planDone` from the other both survive. Rows have one `updatedAt`, not one per field, so this is the most a row-level rule can honestly do. |
| `puzzleRuns` | Solved beats unsolved. Between two solved runs, the faster one. Otherwise the newer one. Mind awards come from ledger facts, not this row. |
| `learnDrops` | The whole drop with the **further cursor** wins (more progress); with the same cursor, the newer one. Answers live in ledger facts, so the other side's answers are not lost. |
| `learnItems`, `learnConcepts`, `cards`, `deckProg` | v1: the row with the **later `lastSeen`** wins (it holds the more recent schedule), with `attempts` = the larger of the two. Accepted loss: one branch's attempts on the same item are not replayed. v2 (a follow-up): rebuild practice state from the union of answer facts, once every answer fact carries what the scheduler needs. |
| `lessonProg` | Per field: `doneDayKey` = the earlier one; the `*Ok` flags are OR'd; `conf` takes the newer side. |
| `packs` | Keep the phone's (shipped with the app). The backup's pack rows are ignored. This is order-dependent by design, like the cutoffs. |
| `settings` | Device-local keys stay the phone's. Cutoffs (`v2From`, `v3From`) stay the phone's: the one documented order-dependent rule, since they describe the receiving phone. `economy.peak` and `economy.seenUpTo` take the max. Away plans: the union, then checked against the rest-bank cap (a later plan that no longer fits is dropped and its days go back to the bank). Per-week rest-day picks: the newer wins. Close rows: never generic; see Shards. Everything else: the newer `updatedAt`. |

**What is promised about order.** Merging the same file twice changes nothing (idempotent). For one pair, A+B equals B+A,
except for the phone-owned rows (cutoffs, packs, device-local keys). Merging three or more histories is NOT promised to
give identical rows in every order, because earlier grants and closes feed later merges. What IS promised in every order
is the floor: nothing shown goes down, no fact is lost beyond the two stated exceptions, and nothing is paid twice. The
fuzz checks those properties over random 3-way merges, not row equality.

## Shards after a merge (Codex B's rule, adopted)
1. Replay the merged ledger with every accepted purchase charged once (including the refunds above).
2. Walk the days in order. For each closed day, the protected balance is the higher balance recorded by **either side's
   close** for that day. If the replay ends that day lower, add **the smallest grant dated on that day** that meets it:
   one replayable fact `grant:merge:<day>:<hash>`. The hash covers the day, both closes and the ids of grants already
   dated on that day, so a later, new deficit on the same day gets a new id (a top-up), and the same merge run again
   finds nothing to add.
3. Do the same for today, against the phone's pre-merge Shards (the snapshot).
4. Recompute every close from this replay, then floor each **non-Shard** field (XP, SP, streak) at the larger of both
   sides' old closes. For Shards the replay already meets both closes after the grants, so the floor is the replay
   itself. An old close must never be kept as a separate Shard floor on top of a grant: that would count the deficit twice
   through `shardFloors` (`deriveEconomy.ts:225`).
5. `awards.ts` gets a `grant` kind and a `refund` kind. Both add Shards and no XP, and both are dated on the merge day.
   Without that replay support, writing the facts pays nothing.
6. **Refunds are deterministic.** Duplicate ownership: the purchase with the larger id is refunded (`refund:<purchaseId>`).
   Rest-bank overflow after the merge: the extra days are taken from the purchases with the largest ids first, each
   refunded at its own price (`refund:bank:<purchaseId>`). The same purchase can never be refunded twice, because the id
   is the purchase's own.

The grant id is content-based: the day plus the closes it reconciles. Running the same merge again finds the closes already
met and writes nothing. A later merge after new changes computes from the new state, and adds a new grant only if a
new deficit exists.

**Accepted cost, to record in DECISIONS.md:** Shards can be minted offline. This works on ONE phone too: back up, buy A,
restore an older snapshot (Replace), buy B, then merge the backup, and you own both. NANDI is offline with no server, so it
cannot tell a second phone from a rollback. Bounds: Shards buy cosmetics and rest days only, never money; the rest bank
keeps its cap after every merge; each loop needs a real backup, a full replace and a merge. Not worth more complexity.
For rest days in particular: if a merge would push the bank over its cap, the extra days are refunded as Shards (rule 6), not kept.

## Not doing
No cloud sync, no account and no server (offline rule). No automatic merge: the person picks the file. No merge of
device-local keys. Old builds' backups are merged with the same rules (their rows already carry `updatedAt` and `deleted`).

## Kill test
- The fuzz from cj3-clock-fuzz, in a new `merge` mode: after every merge, XP, level, Shards and owned are at least what
  was shown before it, every backup fact is present, and a second merge of the same file changes nothing.
- The three old-backup pairs from cj3-old-backups (ship-22/25/27 onto a phone with 5 own days): no shown number drops,
  the Rest day bought that day survives, and the 5 own days of tasks and Learn stay.
- If a real merge ever shows a lower number, or loses a row from either side, ship Replace only until it is fixed.

## Tests (written first)
1. Union of the ledger: shared ids once; phone-only and backup-only facts both present.
2. Last-writer-wins: an edit on each side (the newer wins); a newer delete beats an older edit; a tie goes to the higher canonical hash.
3. Spaced practice: the later `lastSeen` wins per item, and attempts = the max. dailyLog: a newer `planDone: false` beats an older true, and a field missing on the newer row is filled from the older one.
4. Idempotent: merging the same file twice gives the same database. For one pair, A+B equals B+A apart from the phone-owned rows. A 3-way fuzz checks the floor properties in every order.
5. Grant: diverged purchases with the union balance below the phone's -> the smallest grant, dated on the day of the deficit; the shown Shards equal the phone's and both items are owned. Merge again -> no second grant. Codex's 3-close associativity case (A 100; B 10 with p at 10; C 10 with p at 20) gives one canonical price for p and the same result for (A+B)+C and A+(B+C).
5b. The same item bought on both phones -> owned once, and the later-id purchase is refunded.
5c. The same ledger id with different payloads -> the lower hash is kept, whatever the order.
5d. An after-bedtime answer in the backup that would cancel today's perfect drop -> XP stays at the pre-merge snapshot (the peak is written first).
5e. dailyLog: planDone on one side and shutdownDone on the other -> both true. Quests: taps from both sides are counted once each.
6. Not diverged (backup is an older copy of this phone): no grant is written.
7. cj3 C1 repro: banner bought at 15:00, merge the 09:00 backup -> banner still owned, Shards 210.
8. Old-backups §2.2: closes 16-19 Nov keep the phone's values; Shards stay at least 111.
9. Speed: one `bulkPut` per table (cj3 heavy-data: per-row puts made a restore take 212 s).

## Open question for Jenil
Should "Add" be the default, or should the person have to choose each time? Recommendation: "Add" is the default,
because it cannot lose anything.
