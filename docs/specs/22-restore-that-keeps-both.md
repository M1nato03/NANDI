# Spec 22 · A restore that keeps both (merge restore)

Status: DRAFT for Jenil (idea engine, 24 Oct 2026). Not approved. Until it is, restore stays **replace**, with a clear
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

## Merge rules (one transaction, inside `duringRestore`, under the `nandi-economy` lock)
| Data | Rule | Why |
|---|---|---|
| `ledger` | **Set union by id.** An id present on both sides is the same fact; keep the phone's row. | Facts are immutable with idempotent ids, so a union never pays twice. |
| Every other table with `id` + `updatedAt` | Per row: **newer `updatedAt` wins**. A tombstone (`deleted: 1`) is just a row, so a newer delete beats an older edit. Tie: higher `deviceId` wins (deterministic). | Last-writer-wins per record (research brief). |
| Spaced-practice rows (`learnConcepts`, `learnItems`, `cards`, `deckProg`, `lessonProg`) | Per row: the side with the **later last review** (`lastSeen` / `last` / `updatedAt`) wins. | The later review holds the more recent schedule. At worst, one review counts once instead of twice. |
| `dailyLog` (key `dayKey`) | Newer `updatedAt` per day. | |
| `settings` | Newer `updatedAt` per key, **except**: device-local keys stay the phone's (as now); `economy.v2From` / `v3From` keep the phone's, else the backup's (as now); `economy.peak` = max of both; `economy.seenUpTo` = max (item 42); closes use the close rule below. | Keeps today's cutoff rules and floors. |
| `economy.close:<day>` | As today, `mergeCloseMaps`, but see "Shards" below. | |
| `packs` | Keep the higher `version`. | Content is shipped with the app. |

A merge is **idempotent**: merging the same backup twice changes nothing the second time. It is also **order-free**:
merging A then B gives the same result as B then A. Both get property tests.

## Shards after a merge (the double-spend question)
After a union, the replay counts every earning once and every purchase once. The balance can only come out below what
the phone showed when the two histories **diverged**: the backup holds purchases this phone never knew about (another
phone, or this phone after an older restore), paid from Shards this phone also spent. Two honest options:
- **Floor with a recorded grant (proposed).** If the union balance is below the phone's Shards shown just before the
  merge, write ONE ledger fact `grant:merge:<backup deviceId>:<exportedAt>` worth the difference. The replay then shows
  exactly what the phone showed, every purchase on both sides stays owned, and the gap is written down rather than
  hidden in a floor. The id comes from the backup file, so merging the same file again cannot grant twice.
  Cost: Shards are minted only in a diverged merge. Shards buy cosmetics and rest days only, never money. Repeating the
  trick needs two phones and repeated backup swaps; record that in DECISIONS.md as accepted.
- Carry a debt (signed balance below 0, new earnings fill it first). Rejected: the screen would show 0 while the person
  earns. That reads as a loss state.

Closed days: past days keep their own close as a floor, as today. The backup's purchases that this phone did not know
about are paid by the grant, not charged against the phone's closes. That removes the §2.2 drop (99 -> 84).

## Owned items and shop settings
Owned = every purchase fact in the union, so nothing bought on either side is lost. The item *in use* (for example
`economy.banner`) follows the newer setting.

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
2. Last-writer-wins: an edit on each side (the newer wins); a newer delete beats an older edit; a tie goes to the higher deviceId.
3. Spaced practice: the later review wins per item.
4. Idempotent: merge(file) twice gives the same database. Order-free: A+B gives the same result as B+A.
5. Grant: diverged purchases, union balance below the phone's -> one grant, the shown Shards equal the phone's, both items owned; merge again -> no second grant.
6. Not diverged (backup is an older copy of this phone): no grant is written.
7. cj3 C1 repro: banner bought at 15:00, merge the 09:00 backup -> banner still owned, Shards 210.
8. Old-backups §2.2: closes 16-19 Nov keep the phone's values; Shards stay at least 111.
9. Speed: one `bulkPut` per table (cj3 heavy-data: per-row puts made a restore take 212 s).

## Open question for Jenil
Should "Add" be the default, or should the person have to choose each time? Recommendation: "Add" is the default,
because it cannot lose anything.
