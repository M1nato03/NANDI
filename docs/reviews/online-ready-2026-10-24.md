# Offline now, online later: rethinking the ideas (idea engine, 24 Oct 2026)

Jenil (24 Oct): "NANDI is offline for now because we can't rent servers yet. That does not mean it will always be
offline. Rethink everything with this in mind."

## The rule from now on: offline-first, online-ready
1. **The core loop always works with no network.** That is plan, train, learn, puzzles, night, the courtyard and the
   economy. This is still a real feature for Indian users (patchy data, hostels, metro), not only a cost limit.
2. **Online adds what one phone cannot do:** real people (duels, friends, real leagues), sync between devices, learning
   from many learners, content without an app update, and server push.
3. **Every feature is designed in two stages.** v1 offline now. v2 online when servers exist. v1 must store its data so that
   v2 can use it without a migration (the ULID ids, `updatedAt`, tombstones and idempotent ledger ids already allow this;
   `docs/specs/01-architecture.md`).
4. **Personal data goes online only with an account, consent and a privacy notice** (DPDP before 13 May 2027; master
   plan Phase 4). Features that send **no personal data** (a puzzle seed and a score in a share link) can come earlier.
5. **Unchanged:** no dark patterns, no random rewards, no endless feeds, 18+, no firearm content, never collect
   Claude/ChatGPT logins, and AI at runtime only in Premium+ with the user's own key.

**Cost note.** NANDI already runs on Cloudflare Workers (`nandi.nandi11.workers.dev`). Cloudflare's free tier
(Workers, D1, Durable Objects) can carry small, no-personal-data features before any rented server. The research brief
(`docs/research-brief.md`) estimated sync at "about 150 lines of Worker code on Cloudflare D1". Exact free-tier limits
are re-checked in batch 5, job 7, before anything is planned on them.

## What changes, item by item
| Item | Was designed as | Online-ready version |
|---|---|---|
| **Season ladder** | 500 seats; every rival is a made-up name generated on the phone (`core/economy/ladder.ts` `rivalName`). The UI shows them like people. | Fine for Jenil alone. **Before friends test it (Phase 3), label them as pace-setters, not people**: invented people presented as real is fake social proof (a dark-pattern risk). v2: real leagues of about 30 people, with server-checked scores. |
| **Mind / puzzles (Matiks idea)** | v1 only: a duel against your past best, or a friend's share link raced on your own time. | v1 as before. v2: **live 1v1 duels** and weekly contests with real ratings. Puzzles are seeded and deterministic, so a server can check every solution: cheating is hard to hide. Realtime needs WebSockets (Durable Objects). |
| **Economy trust** | All XP is computed on the phone, and the clock-fuzz work defends against the phone's clock. | Anything shown to other people (leagues, duel ratings) is **checked on the server**: replay the facts, or verify puzzle seeds and solutions. Personal XP can stay computed on the phone. Server time becomes the reference for shared events, which removes the clock problem for those. Offline mode keeps today's defences. |
| **Spec 22, a restore that keeps both** | A file merge between two backups. | **It becomes the sync engine's merge function.** Same rules: ledger union, combine progress, last-writer-wins for edits. Change for online: use the server's order (a checkpoint, or a hybrid logical clock) instead of device clocks for "newer". This makes spec 22 the first step to sync, not a side feature. |
| **Spec 23, Learn at Duolingo level** | Middle-band difficulty from the on-phone Elo model, which learns from one person. | v2: **item difficulty calibrated from all learners** (with consent, anonymous `itemId`, right or wrong, time). That is Birdbrain's real edge: one person's answers cannot rate an item well. The calibrated ratings ship back in content packs. Also: the postponed pack updater becomes worth building (lessons without an app update). |
| **Spec 20, fast capture (Hinglish)** | Rules plus a variant lexicon, on the phone, no server. | Keep it on the phone: task text is personal, and offline capture must stay instant. v2 option: users who opt in donate ✕-corrections (the word and its context, no full lines) to grow the shared lexicon. That is the same gold-set process, at scale. |
| **Spec 19, shares** | Day-bound links, no account. | Already online-ready. v2: a friend's result comes back to you ("Riya solved your board in 3:10"), and becomes a friend duel. |
| **Spec 21, life skills + Field try** (from batch 4) | A solo real-world try, checked off the next day. | v2: **try it with a friend.** Both get the same try, and each sees whether the other did it, without competing. Accountability is one of the few social mechanics with evidence behind it. Opt-in, friends only, no public feed. |
| **Try-it hobbies** (batch 4) | NANDI never opens the camera or mic; your work stays in your gallery. | v1 unchanged. v2: share one piece with a friend or a small circle by choice, never a public feed. **Moderation is a real cost** (images from 18-25s), so the first step is friends-only, with report and block. |
| **Plan / focus** | Phone-down time, solo. | v2: **focus together**. Friends start a session at the same time, and everyone's tree grows only if nobody breaks (Forest's "plant together" pattern, to check in batch 5). |
| **Courtyard** | Your own courtyard. | v2: visit a friend's courtyard, leave a small fixed gift (no randomness). |
| **Notifications** | Local only; Android exact alarms. | v2: server push becomes possible (research brief), but the notification budget and the no-guilt rules stay. |
| **Calm (new mode, batch 5)** | Offline text, haptic and synthesized-sound guidance. | v2: guided audio by streaming or download, and an optional group sit at a fixed time. |
| **Clock-fuzz work (item 42)** | Defends the economy against phone clock changes. | Still needed: offline mode never goes away. Online, server time settles shared events. |
| **Owner panel** | Local numbers for Jenil. | v2: anonymous, consented app-wide numbers (retention, lesson metrics) for real product decisions. This is what Phase 3-4 validation needs. |

## What to build NOW so v2 is cheap later
1. Keep every new record sync-ready (ULID, `updatedAt`, `deleted`, `deviceId`), with idempotent ledger ids. This is already the rule; keep it.
2. Build spec 22's merge as a **pure function** (two databases in, one out), so the sync service can reuse it unchanged.
3. Keep puzzle generation seeded and deterministic (already true), so a server can check results later.
4. Put a `source` on facts that other people will see (local / shared), so server checks can be added without a migration.
5. Label the ladder's rivals as pace-setters before anyone but Jenil uses NANDI.

## Next steps for the idea engine
- Batch 5 is updated: every job designs v1 (offline) and v2 (online), and a new **job 7** covers going online: free-tier
  limits, accounts, DPDP, anti-cheat, moderation, and what to put online first.
- Specs 20, 22 and 23 each get an "Online later" section. Spec 21 is written online-ready from the start.
