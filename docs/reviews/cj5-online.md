# cj5 · Going online: what first, and what it costs (batch 5, job 7)

Idea engine, research only. Prices and limits were read on the official pages on **23 Oct 2026**. No account was made,
nothing was signed up for, and nothing was deployed. Repo facts are from `origin/main` at 55fd409, plus the
online-ready review (`ideas/online-ready`), spec 22 (`ideas/spec-22-merge-restore`) and spec 23
(`ideas/spec-23-learn-duolingo-level`).

**How the batch rules were applied here.** This is not a mode job, so the 8-column table covers six *online
mechanics* (what NANDI would put online), not app features. "Why it works" quotes only papers I opened. Where I did
not research the social evidence, the cell says so. The "3 ranked proposals" are the three things to put online first.
One is marked ORIGINAL, with what came closest in the search.

## Short answer
1. **First online feature: the reply to a share link.** A friend's solve comes back to the sender. No account,
   no name, no personal data. Cost: $0 up to about 16,000 daily users on Workers Free.
2. **Second: anonymous item calibration with an open receipt.** It needs consent but no account. Cost: $0. The fitting
   runs in CI, not on the Worker.
3. **Accounts come next, with Google sign-in** ($0) and an email-link fallback. Phone OTP costs about $0.07 per SMS
   in India and needs a billing account. Do it only if asked.
4. **Sync comes last.** It becomes spec 22's merge, ordered by a hybrid logical clock (HLC) plus a server sequence.
   D1 Free runs out at about 600 to 1,000 heavy users, so plan on Workers Paid ($5 a month) from there.
5. **The first hard limit is CPU, not money.** Hard Sudoku and Path boards take 33 to 53 ms (median) to generate.
   Workers Free allows 10 ms of CPU per request. So the server must never regenerate a board: it only checks the
   grid against the rules (about 0.02 ms).

## What the repo already gives (and lacks)
| Fact | Where | Why it matters online |
|---|---|---|
| Rows carry ULID `id`, `updatedAt`, `deleted`, `deviceId` | `src/data/types.ts` `RowMeta`; `docs/specs/01-architecture.md:90` | Sync-ready with no migration. Non-indexed fields can be added without a Dexie version bump. |
| Ledger ids are idempotent, ledgers merge by union | `01-architecture.md:135` | The server can store facts as a set. |
| XP is replayed from facts under the day's rules | `src/core/economy/awards.ts` `replayFactXp`, `calculateTasksDayXp`, `replayFactShards` | The server can recompute any shown score from facts. It is pure TS, so it runs in a Worker. |
| Daily caps bound any day | `rules.config.ts`: `tasks.dailyCap` 200, `train.dailyCapExclWeekly` 100, `mind.dailyCap` 80, `season.spDailyCap` 300 | A cheater can at most hit the cap every day. |
| Boards are seeded | `src/core/puzzles/daily.ts` `dailyBoard` (seed = `PZ.hash('daily:<day>:<type>:<diff>')`); `challenge.ts` links carry `type/diff/seed` | The server can know which board was played. |
| Grid is checked against the rules | `src/core/puzzles/rules/index.ts` `checkRules` | A cheap check, the same on the server. |
| **Board facts do not carry the seed or the grid** | `src/data/repos/learn.ts` `putDailyBoardFact`: inputs are `{ daily, afterBedtime, type, diff, hintsUsed }` | From facts alone, a server cannot check a Mind score. Build-now step 2. |
| **Learn answers do not carry the time taken** | `src/data/repos/learn-engine.ts`: inputs are `{ itemId, conceptId, correct, score, confidence, dropId, retentionDay, afterBedtime }` | Spec 23's calibration wants "(itemId, right/wrong, seconds)". Build-now step 2. |
| **Mood is in the ledger** | `src/data/repos/soft.ts`: `soft-start` fact with `inputs: { state }` (`tired`/`low`/`okay`) | DECISIONS 2026-10-22 and spec 15 promise that mood "never" leaves the phone. A plain ledger-union sync would break that promise. |
| App-use numbers in `dailyLog` | `appMinutes`, `reelsBucket`, `agency1to5` (`src/data/repos/guard.ts`, `economy.ts`) | DECISIONS 2026-10-16: "usage events never leave the phone". Spec 10 test 6: "totals never leave the device". |
| Hosting is static only | `wrangler.jsonc` has `assets` and no `main` script | Today every request is a free static-asset request. An API Worker adds billable requests. |
| Earlier research still holds | `docs/research-brief.md:101`: D1 10 x 500 MB, Dexie Cloud 3 users / 100 MB | Both re-checked below. They still match. |

## 1. Free tiers, checked 23 Oct 2026

### Cloudflare (where NANDI already runs)
| Product | Free limit (quoted) | When it is hit | Source |
|---|---|---|---|
| Workers requests | "100,000 requests, resetting at midnight UTC" | "Error 1027". Fail open "Bypasses the Worker"; fail closed returns the 1027 page | [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) |
| Workers CPU | "10 ms per HTTP request"; subrequests "50 per invocation"; memory "128 MB"; cron "5 per account" | — | same |
| Static assets | "Requests to static assets are free and unlimited." | — | [Static assets billing](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/) |
| D1 | rows read "5 million / day"; rows written "100,000 / day"; storage "5 GB (total)"; "10" databases, "500 MB" each; "50" queries per invocation; Time Travel "7 days" | "you will not be able to run queries against D1"; "Free limits reset daily at 00:00 UTC" | [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), [D1 limits](https://developers.cloudflare.com/d1/platform/limits/) |
| D1 index cost | "Indexes will add an additional written row when writes include the indexed column" | — | [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/) |
| D1 location | hints "wnam, enam, weur, eeur, apac, oc"; jurisdictions "eu, fedramp, us" | No India option; `apac` is the closest | [D1 data location](https://developers.cloudflare.com/d1/configuration/data-location/) |
| Durable Objects | requests "100,000 / day"; duration "13,000 GB-s / day"; SQLite rows read "5 million / day", written "100,000 / day"; stored "5 GB (total)"; key-value backend "only available on the Workers Paid plan" | "further operations of that type will fail with an error" | [DO pricing](https://developers.cloudflare.com/durable-objects/platform/pricing/) |
| DO duration rule | "charges for the 128 MB of memory ... regardless of actual usage"; "Calling accept() on a WebSocket ... will incur duration charges for the entire time the WebSocket is connected"; "use the WebSocket Hibernation API to avoid incurring duration charges"; "a 20:1 ratio is applied to incoming WebSocket messages" (stated as a paid-plan footnote) | — | same |
| DO limits | objects "Unlimited"; storage "5GB (Free)"; per object "10 GB" in the table, "1 GB on the Free plan" in the FAQ (the page contradicts itself); soft limit "1,000 requests per second" per object; "100" classes | — | [DO limits](https://developers.cloudflare.com/durable-objects/platform/limits/) |
| KV | reads "100,000 / day"; writes "1,000 / day"; deletes "1,000 / day"; lists "1,000 / day"; storage "1 GB" | "further operations of that type will fail with an error" | [KV pricing](https://developers.cloudflare.com/kv/platform/pricing/) |
| R2 | storage "10 GB-month / month"; Class A "1 million requests / month"; Class B "10 million requests / month"; egress "Free" | Page does not say whether a payment method is needed | [R2 pricing](https://developers.cloudflare.com/r2/pricing/) |
| Analytics Engine | "100,000 included per day" data points written; "10,000" reads; "Currently, you will not be billed" | — | [AE pricing](https://developers.cloudflare.com/analytics/analytics-engine/pricing/) |
| Email sending | "Sending to arbitrary recipients requires the Workers Paid plan"; Paid: "3,000 included per month", then "$0.35 per 1,000 emails" | — | [Email Service pricing](https://developers.cloudflare.com/email-service/platform/pricing/) |
| Turnstile | "Up to 20 widgets", "Free" | — | [Turnstile plans](https://developers.cloudflare.com/turnstile/plans/) |
| Rate-limit binding | period "Must be either 10 or 60"; counts are "eventually consistent" and local to each location | Plan availability not stated | [Rate limit binding](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/) |
| Workers Paid | "minimum charge of $5 USD per month"; requests "10 million included per month" then "+$0.30 per additional million"; CPU "30 million CPU milliseconds" included; D1 writes "First 50 million / month included + $1.00 / million rows", storage "First 5 GB included + $0.75 / GB-mo"; DO requests "1 million / month, + $0.15/million", duration "400,000 GB-s / month", SQLite storage "5 GB-month, + $0.20/ GB-month"; KV writes "1 million/month" | — | [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) |
| R2 paid | "$0.015 / GB-month"; Class A "$4.50 / million"; Class B "$0.36 / million"; PutObject and ListObjects are Class A, GetObject is Class B | — | [R2 pricing](https://developers.cloudflare.com/r2/pricing/) |

**Good news.** A limit hit stops only the online parts. The app shell is static and "free and unlimited", and the core
loop is offline. The phone must treat 1027, 429 and 5xx as "offline right now" and say nothing alarming.

### The others
| Service | Free limit (quoted) | Catch | Source |
|---|---|---|---|
| Supabase Free | "500 MB database size"; "50,000 monthly active users"; "5 GB egress"; "1 GB file storage"; Edge Functions "500,000"; Realtime "200" peak connections, "2 Million" messages | "Free projects are paused after 1 week of inactivity." "Limit of 2 active projects." Phone MFA "Not included". Pro "from $25/month" | [Supabase pricing](https://supabase.com/pricing) |
| Firebase Spark | Auth "50K MAUs"; Firestore "1 GiB total", "20K writes/day", "50K reads/day", "20K deletes/day"; Realtime DB "100" connections, "1 GB", "10 GB/month" | Phone Auth "Not applicable" on Spark; Cloud Storage and Cloud Functions "Not applicable" | [Firebase pricing](https://firebase.google.com/pricing) |
| Firebase / Identity Platform SMS | "The first ten SMS that you send per day are not billed." India: "$0.07" per SMS | Needs the paid (Blaze) plan, because Spark has no phone auth | [Identity Platform pricing](https://cloud.google.com/identity-platform/pricing) |
| Identity Platform MAU | "0 count to 50,000 count $0.00 (Free)" for Email, Phone, Anonymous, Social | — | same |
| Dexie Cloud Free | "3 production users"; "50,000 evaluation users" for "up to 30 active days"; "100 MB storage"; "20 requests per second" | After evaluation, sync stops unless upgraded. Pro "€0.12 per user / month" (the table also says "€3/mo per 25 seats"). Self-host "€3,495" once. The page has conflicting storage figures | [Dexie pricing](https://dexie.org/pricing) |
| Resend Free (email link) | "3,000" per month; "limited to 100 emails per day" | Pro "$20/mo" | [Resend pricing](https://resend.com/pricing) |
| MSG91 (Indian SMS) | From "₹0.25" (5,000 SMS) to "₹0.16"; "up to ₹0.13" on request | Page does not mention DLT | [MSG91 SMS pricing](https://msg91.com/in/pricing/sms) |

### What breaks first at 100, 1,000 and 10,000 users
Assumptions, stated so they can be checked:
- **Upper bound:** every user is active every day.
- **Sync, heavy day:** about 80 rows change (my count of the write paths in `src/data/repos`: about 10 Learn answers,
  plus their item and concept rows, tasks and events, a session with about 15 sets, a board, closes and settings).
  About 55 of those are new rows.
- **Row size:** about 290 bytes as JSON. I measured synthetic rows: ledger 421, set 264, task event 184.
- **Result:** about 6 MB per heavy user per year. A typical user is lower; I did not measure one.
- **Generation timings:** Node 22 in this container, 30 seeds per type and difficulty. Workers CPUs differ, so read
  them as orders of magnitude.

| Measured here | Median | p90 | Max |
|---|---|---|---|
| `PZ.generate` sudoku hard | 33.3 ms | 36.3 ms | 113.5 ms |
| `PZ.generate` path medium / hard | 28.8 / 53.0 ms | 79.7 / 210.1 ms | 82.9 / 246.1 ms |
| `PZ.generate` crowns hard | 18.0 ms | 46.4 ms | 96.9 ms |
| every easy board, and all calc and sunmoon | 0.3–4.7 ms | ≤ 9 ms | ≤ 15 ms |
| `checkRules`, one call | 0.001–0.024 ms | — | — |

| Users | Stage 1 (no personal data) | Stage 2 (accounts, leagues) | Stage 3 (sync) |
|---|---|---|---|
| 100 | Nothing breaks. | Nothing breaks. | Nothing breaks (16,000 D1 writes a day; 0.6 GB a year). |
| 1,000 | Live duels **without** hibernation: DO duration runs out at about 350 five-minute duels a day (13,000 / (300 s x 0.125 GB)). With hibernation, about 20,000. | Nothing breaks. | **D1 rows written:** 80 rows x 2 (index) = 160 per user, so 160,000 a day, over 100,000. **D1 storage:** 6 GB a year, over 5 GB. First wall: about 600 heavy users. |
| 10,000 | Workers requests reach about 60,000 of 100,000 a day. Wall: about 16,000 users. | **Workers requests:** about 110,000 a day, over the limit. D1 per-database 500 MB if league facts are not pruned. | Everything is past the free tier. Needs Workers Paid. |
| Other stacks | — | Supabase: a quiet pilot week pauses it. Firebase: no phone auth on Spark. | Firestore Spark: 20,000 writes a day, so about 250 users. Supabase: 500 MB, so about 80 heavy users a year. Dexie Cloud: 3 users free. |

## 2. Accounts and the 18+ check
| Option | Cost | Setup | Risk | Verdict |
|---|---|---|---|---|
| **Google sign-in** (Android Credential Manager, ID token checked in the Worker) | $0. Verifying needs Google's public keys plus checks of `aud`, `iss` and `exp` ([Google](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token)) | One OAuth client. A Capacitor plugin would be a new dependency, so it needs a DECISIONS line | Google recommends "a Google API client library" over writing your own checks. In a Worker, use a small JWT library | **Default.** Most Android users already have a Google account. |
| **Email magic link** | Resend Free: 100 a day. Cloudflare sending needs Paid ($5) | One sender domain | Mail can be slow or land in spam. Links opened in another browser | **Fallback** for people without Google. |
| **Phone OTP** | Firebase: 10 free a day, then $0.07 per SMS in India; needs Blaze. MSG91: ₹0.16–0.25 per SMS plus DLT registration | Under TRAI's TCCCPR, senders register headers and templates on DLT (Infobip: "Headers must be registered for each category", templates "must be registered by the Principal Entity"). TRAI's own PDF could not be opened (reset / 503) | SMS cost per retry, and SMS-pumping abuse | **Not in the first account release.** 10,000 sign-ups at 1.2 SMS each is about $840 on Firebase. |

**What an 18+ check can honestly be.**
- **Self-declaration only.** The first run already has an 18+ tick (`src/core/welcome.ts`; e2e
  `tests/e2e/welcome.spec.ts`). Make it a neutral birth-year question with no pre-filled answer, and send nothing
  online without it.
- **It is not verification.** Google's Play Age Signals API is "(beta)". It returns signals only for Brazil and for
  some Texas accounts. It "may only" be used "to provide age-appropriate content and experiences in compliance with
  laws". It is "limited to apps that are updated by Google Play", and NANDI's APK is sideloaded
  ([Play Age Signals](https://developer.android.com/google/play/age-signals/overview)).
- **Why it matters.** DPDP s.9(3) bans "tracking or behavioural monitoring of children" (under 18, s.2(f)). NANDI's
  economy *is* behavioural tracking.
- **The honest line, in the privacy notice:** "NANDI is for 18+. We do not check ID. If we learn an account belongs to
  someone under 18, we delete its online data."
- Never ask for Aadhaar. The DigiLocker tokens in Rule 10 are for verifying a *parent*. They are not a general age check.

## 3. DPDP Act 2023 and DPDP Rules 2025: what must exist before personal data goes online
Official texts:
- Act: [meity.gov.in Act PDF](https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf)
  (Gazette No. 25, 11 Aug 2023).
- Rules: G.S.R. 846(E), dated 13 Nov 2025, Gazette CG-DL-E-14112025-267650
  ([meity.gov.in Rules PDF](https://www.meity.gov.in/static/uploads/2025/11/53450e6e5dc0bfa85ebd78686cadad39.pdf)).
- Commencement, Rule 1(4): "Rules 3, 5 to 16, 22 and 23 shall come into force eighteen months after the date of
  publication", so mid-May 2027 (the repo uses 13 May 2027).

This is a reading by a researcher, not legal advice. Jenil and a lawyer sign off on the notice (`Welcome.tsx:98`
already says so).

| Duty | Official text (quoted) | What NANDI builds |
|---|---|---|
| Notice before consent | s.5(1): consent "shall be accompanied or preceded by a notice". Rule 3: "presented and be understandable independently", with "an itemised description of such personal data" and "the specified purpose" | One standalone screen per purpose. It is generated from the outbound registry (build-now step 4), so it cannot drift from the code. |
| Language | s.5(3): "in English or any language specified in the Eighth Schedule" | English plus Hindi (and Gujarati if wanted). The notice is short, so translation is cheap. |
| Consent quality | s.6(1): "free, specific, informed, unconditional and unambiguous with a clear affirmative action ... limited to such personal data as is necessary" | Separate switches for calibration, account, friends and sync. Nothing pre-ticked. The core app never depends on any of them. |
| Withdrawal | s.6(4): "with the ease of doing so being comparable to the ease with which such consent was given"; Rule 3(c)(i) | The same toggle, one tap, in You > Online. |
| Erasure | s.8(7)(a): erase "upon the Data Principal withdrawing her consent or as soon as it is reasonable to assume that the specified purpose is no longer being served". s.12(3): right to erasure | "Delete my online data" deletes server rows at once. The phone keeps its own data (it is the source). |
| **Log retention (catch)** | Rule 8(3): retain "such personal data, associated traffic data and other logs of the processing for a minimum period of one year" for Seventh Schedule purposes | Keep a minimal processing log (account id, action, time) for one year after deletion, then erase. **Lawyer check:** how this sits with s.8(7). |
| Security | s.8(5): "reasonable security safeguards". Rule 6(1)(a): "encryption, obfuscation, masking"; (c) "logs, monitoring and review"; (d) "data-backups" | Sync rows are end-to-end encrypted (§6). Secrets go in Worker secrets, never `VITE_*` (CLAUDE.md). D1 Time Travel (7 days free) serves as the backup. |
| Breach | s.8(6). Rule 7(1): tell each affected user "without delay". Rule 7(2): tell the Board "without delay", then the details "within seventy-two hours" | A written breach plan, with the Board form and in-app message text ready before Stage 2. |
| Contact person | s.8(9). Rule 9: "prominently publish" a contact who can answer | An email address in the notice and in About. |
| Grievances | s.8(10), s.13. Rule 14(3): respond "within a reasonable period not exceeding ninety days" | A published 30-day target, inside 90. |
| Children | s.2(f): child = under 18. s.9(1): "verifiable consent of the parent". s.9(3): no "tracking or behavioural monitoring" | 18+ only (§2). No child accounts. |
| Transfer abroad | Rule 15: allowed, "subject to the restriction" of Government orders | D1 has no India location. Name the region (`apac`) in the notice and watch for orders. |
| Penalties | Schedule: up to "two hundred and fifty crore rupees" for security failures; "two hundred crore" for breach notice and for children | — |
| Possible exemption | s.17(3): the Government "may ... notify certain Data Fiduciaries ... including startups" exempt from s.5, s.8(3), s.8(7), s.10 and s.11 | I did not find or check any such notification. Plan as if none applies. |

**Stage 1 and DPDP.** "Personal data" is data "about an individual who is identifiable by or in relation to such data"
(s.2(t)).
- Stage 1 sends no account, no name and no `deviceId`. The `deviceId` is a ULID created on the phone
  (`src/data/device.ts`): it is stable and encodes the install time.
- Cloudflare still sees IP addresses at its edge. So Stage 1 still gets a consent switch, one line in the notice, and
  a Worker that never stores `CF-Connecting-IP`.

## 4. Anti-cheat for shared scores
The economy is computed on the phone (`deriveEconomy`). Three ways to trust a shared number:

| Method | What the server does | Catches | Misses | Cost on Workers Free | Use for |
|---|---|---|---|---|---|
| **A. Verify seeded solutions** | Gets the board's clues (or, for daily boards, a hash from a CI-built manifest) and the final grid, then runs `checkRules` | Fake "solved" and wrong grids. "Check the player's grid against the rules, never the stored solution" (CLAUDE.md) stays true | The solve time. `solveMs` is claimed by the phone. A server-issued start token gives an upper bound only. | About 0.02 ms per check. **Regenerating is not affordable:** 33–53 ms median for hard boards against 10 ms CPU | Duels, weekly contests, puzzle ratings |
| **B. Replay ledger facts** | Gets the day's facts and runs `replayFactXp` / `calculateTasksDayXp` under `RULES_HISTORY` | Edited totals, broken caps, rule-version tricks | Invented facts. Inputs such as `plannedSize`, `postpones` and `createdToDoneMin` are claimed by the phone | Under 1 ms for about 30 facts. One D1 row per user-day | Real leagues (SP) |
| **C. Trust the phone, with limits** | Accepts a total. Enforces caps (`season.spDailyCap` 300 a day), per-endpoint rate limits and plausibility floors (e.g. no hard Sudoku under N s, N taken from all learners) | Bursts and impossible numbers | A steady cheater at the cap every day | Cheapest | Anything without a ranking |

Recommendation:
- **A for Mind. B plus C for leagues.**
- Keep leagues small (about 30, friends or cohort). There, people know each other and nothing is worth money (Shards
  buy cosmetics and rest days only; spec 22).
- Yan and Randell: "Cheating is rampant in current game play on the Internet" and "fairness becomes a vital additional
  aspect" of security ([Strathclyde record](https://pureportal.strath.ac.uk/en/publications/a-systematic-classification-of-cheating-in-online-games/),
  NetGames 2005, DOI 10.1145/1103599.1103606).
- Play Integrity ("up to 10,000 total requests per day"; "not as your sole anti-abuse mechanism",
  [Android](https://developer.android.com/google/play/integrity/overview)) works only for Play-distributed apps. It
  helps only after NANDI is on Play.

**Calibration poisoning** is the other cheat: fake answers that skew item ratings. Defences:
- Cap answers per batch (`mind.cardsMaxPerDay` 20 is the right scale).
- Ignore items with few batches, and fit with a trimmed estimator.
- Have a human review any rating that moves a lot. The ratings ship in content packs, which already pass a gate
  (spec 09).

## 5. Moderation before anything user-made is visible
| Content | Rule | Moderation cost |
|---|---|---|
| Names | Stage 1: no names at all ("Your friend's time"). Stage 2: a nickname from a fixed word list (e.g. adjective + neem/kite), so free text is never public. Free-text names only between accepted friends | $0 |
| Custom quests, task text | Stay on the phone (spec 20 already says task text is personal). Friends see only fixed templates ("Try it together: Field try #4") | $0 |
| Hobby photos, v2a | **Share through the OS share sheet** (WhatsApp, as spec 19 does). NANDI hosts nothing | $0. NANDI is not hosting, so the intermediary duties below do not start |
| Hobby photos, v2b (only if v2a is not enough) | Friends-only circle (max 8). Auto-delete after 30 days. Report and block on every item; a reported item hides at once for the reporter and goes to a queue | SafeSearch: first 1,000 a month free, then $1.50 per 1,000 ([Vision pricing](https://cloud.google.com/vision/pricing)). At 2 photos per user a week: 100 users $0; 1,000 users about $11 a month; 10,000 users about $128 a month. R2 storage below $1 |
| Public feed | **Rejected.** It is an endless feed (hard rule) | — |

**Legal duties once NANDI hosts images** (IT Rules 2021, Gazette text via
[thc.nic.in](https://www.thc.nic.in/Central%20Governmental%20Rules/IT(Intermediary%20Guidelines%20and%20Digital%20Media%20Ethics%20Code)%20Rules,%202021.pdf);
the meity.gov.in copy was not found, and later amendments were not checked):
- Rule 3(2)(a): publish a Grievance Officer, who must "acknowledge the complaint within twenty four hours and dispose
  off such complaint within a period of fifteen days".
- Rule 3(2)(b): within "twenty-four hours" of a complaint about nudity, sexual content or "artificially morphed
  images", "remove or disable access".
- Cloudflare's CSAM Scanning Tool compares "content served ... through the Cloudflare cache" to known lists
  ([docs](https://developers.cloudflare.com/cache/reference/csam-scanning/)). The page does not say whether R2 or
  Worker-served images are covered, or which plans can use it.

## 6. Sync: spec 22 becomes the merge
| Spec 22 rule | In sync |
|---|---|
| `ledger`: union by id; same id with a different payload, the lower canonical hash wins | The same. The server stores facts as a set. |
| Editable rows: newer `updatedAt` wins; a tombstone beats an older edit; a tie goes to the hash | "Newer" compares the **HLC** instead of `updatedAt`. `updatedAt` stays for display. |
| Progress rows combined (`quests` `tapIds` union, `puzzleRuns` solved beats unsolved, `learnDrops` further cursor) | The same functions, run on the phone after a pull. |
| `dailyLog`: newer row wins, missing fields filled | Same. Note: `appMinutes` is a counter in a last-writer-wins row, so two phones' minutes do not add. That is acceptable: it is a guard metric that must not leave the phone anyway. |
| Device-local keys (`deviceLocalKeys` in `src/data/backup/index.ts`), cutoffs, `packs` | Never synced. |
| Shards `grant:merge:<day>:<hash>` and `refund:<purchaseId>` | **Risk:** two offline phones can each write a grant for the same deficit, and a union pays both. In sync mode the floor grant must be written in one place. Either the server, after replaying, or the rule becomes "one grant per day, the larger one". To decide in spec 22 v4. |
| (new) Mood and app-use data | **Exclude** `soft-start` facts, `dailyLog.reelsBucket`, `appMinutes` and `agency1to5`, or sync them only end-to-end encrypted. Otherwise the promises in DECISIONS 2026-10-16 and 2026-10-22 break. |

### Which clock decides "newer"
| Clock | How it orders | Fails when | Verdict |
|---|---|---|---|
| Device clocks (`updatedAt` = `Date.now()`) | Wall time on each phone | A phone set ahead wins every edit until real time catches up. This is the clock-fuzz problem (item 42), and sync makes it permanent | File merge only (spec 22 today) |
| Server checkpoint (sequence number per accepted write) | Order of arrival at the server | A week of offline edits arriving late overwrites newer edits made meanwhile on the other phone. Simple: the research brief's "about 150 lines" | Use as the **pull cursor**, not as "newer" |
| Hybrid logical clock | max(own wall time, highest clock seen) plus a counter. Kulkarni et al.: HLC "captures the causality relationship like logical clocks" and stays "always close to the NTP clock"; it "fits in to 64 bits" ([paper](https://cse.buffalo.edu/tech-reports/2014-04.pdf)) | A phone with a wild clock can push HLCs ahead. The server clamps any HLC more than a few minutes past server time | **Use for "newer".** Store as an unindexed `hlc` field: no Dexie version bump, and old rows fall back to `updatedAt` |

**Sync shape:**
- Each account gets one **Durable Object with its own SQLite**. That avoids D1's 500 MB per database, isolates users,
  and costs $0.20 per GB-month on Paid (vs D1's $0.75).
- Rows are **end-to-end encrypted** blobs plus plain metadata (`table`, `id`, `hlc`, `deleted`, server `seq`). The
  server orders rows but cannot read them, and the phone runs spec 22's pure merge. Rule 6(1)(a) names encryption.
- The key comes from a recovery code the person keeps. Losing the code loses only the *server copy*: the phone and the
  file backups still hold everything.
- Leagues use the separate day-facts post (§4 B), so the server never needs to read synced rows.
- "Never ship a migration without a backup round-trip test" (CLAUDE.md) applies to the sync format too: a restore from
  the server must pass the same round-trip test as a file.

## 7. The online mechanics (8-column table)
| App | Mechanic | What the user does and sees | Why it works (evidence, quoted) | Dark-pattern risk | NANDI v1 (offline) | NANDI v2 (online) | Kill test |
|---|---|---|---|---|---|---|---|
| Sudoku Race, SudokuTournament.com (store listings via search: share a puzzle or code, race on it) | Same board by link, result returns | Sends a link. Later sees "Your friend: 4:12, no hints" on that board | Not researched here (social evidence is jobs 1 and 6). Fairness: "fairness becomes a vital additional aspect" (Yan & Randell 2005) | Low. Watch for nagging ("your friend is waiting"). No push for it | Today's spec 19 link; the friend's time comes back only if they paste their result | A 7-day mailbox token in the link. The reply is verified by `checkRules` against the sender's uploaded clues. No names, no account | Fewer than 1 in 10 shared links get a reply in 2 weeks of pilot, or any reply that fails verification gets shown |
| Matiks / Lichess (live 1v1) | Live duel | Both open the same board. Each sees the other's progress bar. No timer that punishes | Not researched here (job 1) | Medium: live play can pull late-night use. **Off after bedtime**, same as Mind XP | Ghost race against your past best | DO WebSocket with hibernation, two animal avatars, no chat | Any duel after bedtime, or median session length rises above the board's normal time |
| Duolingo leagues | Real leagues | A group of about 30 friends or a cohort. Weekly SP | Not researched here | High: demotion and loss (hard rule). **Rewritten:** no demotion, no "you'll drop" copy, rank never shown as lost | 500-seat ladder; rivals must be labelled pace-setters before others use it (online-ready review) | Server replay (§4 B) plus caps | Any copy that implies loss, or a league score the replay cannot reproduce |
| Duolingo Birdbrain-style calibration | Item difficulty from all learners | Weekly, an **open receipt**: "This week: 38 answers (item, right or wrong, seconds). No name, no ids." Send / Not this week | Pelánek (2016): "each item is answered by many students, whereas for students the number of answer is typically smaller (often by orders of magnitude)" ([manuscript](https://www.fi.muni.cz/~xpelanek/publications/CAE-elo.pdf)) | Low. Risk: a reward for sending. **No XP, no count for sending** (as spec 15 does for shares) | On-phone Elo (`teachingEngine.eloK` 24) | One D1 row per batch. The fit runs in GitHub Actions, and ratings ship in packs | The batch contains any id, a time of day or free text, or the opt-out rate passes 70% (then the receipt is too much to ask) |
| Dexie Cloud / Firebase sync | Sync between phones | Signs in on a new phone; everything appears | HLC: "captures the causality relationship" (Kulkarni et al. 2014) | Low. Risk: making sync feel required. Core stays offline | Spec 22 file merge | Sealed-row sync (§6) | Any shown XP, level or Shards drop after a sync, or mood data found in a server row |
| Strava photos / Instagram | Show your hobby work | Shares one piece with a friend | Not researched here | High if public: an endless feed. **Public rejected** | Work stays in the gallery (batch 4) | v2a: share sheet. v2b: friends-only circle, 30-day auto-delete | Any public surface, or any reported image still visible after 24 h |

## 8. Three ranked proposals (what goes online first)
| Rank | Proposal | Stage | Personal data | Cost | Original? |
|---|---|---|---|---|---|
| 1 | **The reply comes home.** A share link carries a 7-day mailbox token. The friend's reply (time, hints, grid) is rules-checked on arrival and shown on the sender's board | 1 | None (no name, no id) | $0 to about 16,000 daily users | No. Closest: Sudoku Race and SudokuTournament.com share codes (store listings, via search). Lichess advertises "No registration" play with friends ([FAQ](https://lichess.org/faq)) |
| 2 | **Open-receipt calibration (ORIGINAL for a learning app).** The phone builds the week's anonymous batch and shows it as a readable receipt before every send. Ratings return in packs. The receipt history stays on the phone | 1 | None, plus consent | $0 (1 row a day per user; fit in CI) | Searched the web for per-batch, preview-before-send learning telemetry. Closest: DONA (Bielefeld): "Vor dem Hochladen zeigen wir Ihnen eine Vorschau der Daten" ([DONA](https://www.dona.tf.uni-bielefeld.de/learn-more)), a one-off research donation; and Apple's Analytics Data viewer, which shows data after collection behind one switch ([Apple](https://www.apple.com/legal/privacy/data/en/device-analytics/)). App stores were searched only through web search |
| 3 | **Accounts, then sealed-row sync.** Google sign-in, friends by invite code, small leagues with server replay, then end-to-end encrypted sync on one DO per account | 2, then 3 | Yes. Needs the full §3 list first | $0 to about 600–1,000 heavy users; then $5 a month, about $11–46 a month by 10,000 users | No. Closest: Dexie Cloud, Standard Notes-style encrypted sync |

## 9. Staged plan and cost per stage
| Stage | What goes online | Needs first | 100 users | 1,000 users | 10,000 users |
|---|---|---|---|---|---|
| 0 · now | Nothing. Build the five steps below | — | $0 | $0 | $0 |
| 1 · no personal data | Reply-comes-home duels; open-receipt calibration; optionally live duels (DO, hibernation required) | Pace-setter labels; notice lines; consent switch; Worker ignores IPs | $0 | $0 | $0 (about 60% of the request limit) |
| 2 · accounts | Google sign-in plus email link; birth-year 18+; friends; leagues of about 30; delete account | All of §3: notice, consent, withdrawal, breach plan, contact, grievance, one-year log rule | $0 | $0 | **$5 a month** (requests over 100,000 a day). Phone OTP instead of Google: about $840 one-off at 10,000 sign-ups |
| 3 · sync | Sealed-row sync, HLC, spec 22 merge | Spec 22 v4 (grant rule, exclusions); restore-from-server round-trip test | $0 | **$5 a month** (D1 writes and storage; or DO SQLite) | About $5 + $11 a month on DO storage, or $5 + $41 on D1, by month 12 (60 GB a year heavy; estimate) |
| Optional · images | Friends-only photo circle | IT Rules grievance officer; 24-hour removal | $0 | about $11 a month | about $128 a month |

Same load on the alternatives:
- **Dexie Cloud:** about €12, €120 and €1,200 a month (€0.12 per user), or €3,495 to self-host.
- **Supabase:** free until about 80 heavy users (500 MB), then $25 a month.
- **Firebase:** sync passes Spark at about 250 users (20,000 writes a day). Phone auth always needs Blaze.

## 10. The five build-now steps that make v2 cheap
1. **Spec 22's merge as a pure function with a pluggable clock.** `mergeDatabases(a, b, newer)` in `src/core`, where
   `newer` compares `updatedAt` today and the HLC later. Include the per-table rules and an `excludeFromSync` list:
   device-local keys, `soft-start`, the `dailyLog` usage fields.
2. **Make Mind and Learn facts checkable, going forward only.**
   - `putDailyBoardFact` adds `seed`, a hash of the board's clues, and the final grid (or its hash).
   - Learn answer facts add `ms`.
   - Old facts stay as they are: no migration, and replay ignores the new fields. CLAUDE.md: "rule changes apply
     forward from `effectiveFrom`".
3. **One row-stamp helper.** Every write goes through `stamp(row, now)`, which sets `updatedAt`, `deviceId` and an
   unindexed `hlc`. Writes now set `updatedAt: now` by hand in each repo (`learn.ts`, `soft.ts`, `guard.ts`, ...).
   One helper makes the HLC a one-line change later.
4. **An outbound registry and one network client.** A typed list in `src/core` of every payload that may ever leave
   the phone: purpose, fields, personal yes/no, consent key.
   - Tests prove that `deviceId`, mood and usage fields never appear in any payload. That implements spec 10 test 6.
   - The privacy notice and the open receipt are generated from the registry.
   - The client treats 1027, 429 and 5xx as "offline", silently.
5. **A daily-board manifest from CI.** GitHub Actions writes the next 90 days of daily boards' clue hashes
   (`dailyBoard(day)`) to a static JSON file, served free as an asset. A Worker can then verify a daily solve without
   regenerating it, which hard boards cannot do inside 10 ms. Friend boards use the sender's uploaded clues instead.

Not a build step but a must before anyone else uses NANDI: label the ladder's rivals as pace-setters
(`ladder.ts` `rivalName`; online-ready review item 5).

## Sources that could not be opened
- TRAI press release PR 47/2023 (`cms.trai.gov.in`): HTTP 503, then connection reset. The DLT facts come from
  Infobip's page instead.
- The MeitY DPDP Rules web page is a client-rendered shell. The PDF was opened directly from `meity.gov.in/static/uploads`.
- Google's Identity Platform pricing page was too long for the fetch tool. The SMS table was read from the downloaded
  HTML.
- Firefox telemetry support page: did not load. The Apple support guide page: truncated. Apple's privacy page was used
  instead.
- The meity.gov.in copy of the IT Rules 2021 was not found. A Gazette copy on thc.nic.in was used, and amendments after
  2021 were not checked.
- The Lichess FAQ does not describe link challenges or how cheat detection works.
