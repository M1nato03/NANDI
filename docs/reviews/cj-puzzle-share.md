# Daily puzzle shareability (cloud job 7)

Date: 2026-10-22. Code read on `origin/main` at `78d1a28`.
Question: what is the smallest change that makes one NANDI result worth posting in a WhatsApp group?

## Short answer

- The groundwork is already there. Every player gets the same daily board, it is safe for India's time zone, and a challenge link rebuilds the exact board on a friend's phone with no sign-up.
- What is missing is the post itself. The result card has two buttons. **Share** sends an image with text but no link. **Challenge a friend** sends a link in a long sentence. Neither has a puzzle number, so nobody in a group can tell that their posts are about the same board.
- The fix is about 6 small changes, all in code that already exists: a board number, a short 2–3 line result text with one emoji mark and the link, one primary share button, open the friend's link as their own daily board when it matches, and link-preview tags. Don't add a streak, a fake grid or a leaderboard.

## 1. What the reference games do

| Game | Same puzzle for all | When it changes | Share text (verbatim where sourced) | Link in post | Streak in post |
|---|---|---|---|---|---|
| Wordle | "A single puzzle is released daily, with all players attempting to solve the same word." ([Wikipedia](https://en.wikipedia.org/wiki/Wordle)) | Local midnight: "Wordle resets at 12:00 AM every day in your local time zone." ([Beebom](https://beebom.com/puzzle/when-does-wordle-reset/)) | `Wordle 196 4/6` and then rows of emoji squares ([Wikipedia](https://en.wikipedia.org/wiki/Wordle)) | No, on purpose (see below) | No |
| LinkedIn Queens | Yes (one puzzle number per day) | "New puzzles are released daily at midnight Pacific Time (PT)." ([LinkedIn Help](https://www.linkedin.com/help/linkedin/answer/a6863543)) | `Queens #179 \| 0:14 and flawless First 👑s: 🟨 🟧 🟩 lnkd.in/queens` ([LinkedIn post comments](https://www.linkedin.com/posts/queens-game_queens-no-179-activity-7255835565193863168-ucD3)) | Yes, a short link | Sometimes: `🏅 I'm on a 106-day win streak!` (same page) |
| LinkedIn Zip / Wend | Yes | Same as above | `Zip #510 \| 0:28 🏁 With no hints lnkd.in/zip.` and `Wend #89 \| 1:16 🌀 With no hints & no backtracks 🏅 I'm on a 6-day win streak! lnkd.in/wend.` ([discussions.ie thread](https://www.discussions.ie/threads/linkedin-games.1172/)) | Yes | Sometimes |
| NYT Connections | Yes, numbered (`#1,229` on 22 Oct 2026, [Tom's Guide](https://www.tomsguide.com/news/todays-connections-answer)) | Local midnight, like Wordle | Game name, puzzle number, then one row of 4 coloured squares per guess. I could not open an NYT page that shows the exact text, so this comes from third-party descriptions only. | No | No |

What the evidence says about why sharing works:

- **Spoiler-free first.** Wardle: "The emoji grid just leaves the colours and it's a way for you to share how you did without ruining the game for others", "which has really led to this communal aspect specifically on Twitter" ([The Spinoff](https://thespinoff.co.nz/media/13-01-2022/those-coloured-boxes-on-twitter-are-new-zealands-fault)).
- **Players did it before the button existed.** "Wardle noticed players sharing their results by typing out a grid of green, yellow and black emojis". Also: "The breakthrough, he said, was limiting players to one game per day." Players went from "90 people" on 1 Nov 2021 to "more than 300,000" two months later ([Boston.com / AP](https://www.boston.com/news/national-news/2022/01/04/he-made-wordle-for-his-partner-now-its-an-online-hit/)).
- **The link is a trade-off.** Wardle left the link out because he thought it would look "trashy". At GDC he later "noted previous criticism that the shareable results page did not include a link back to the game" ([PocketGamer.biz](http://www.pocketgamer.biz/gdc-josh-wardle-shares-his-incorrect-tips-for-wordles-success/)). He also said: "knowing that any players could click on this link and play it immediately was really important" (same article). I found the "trashy" quote only in a reprint summary, not in the original interview. LinkedIn's games do put a short link in the post.
- **Timed logic puzzles don't use a grid.** Queens, Zip and Tango posts are one line: number, time, one emoji, a clean-run phrase ("flawless", "no hints", "no backtracks") and the link. Wordle and Connections have grids because their guesses carry information. A logic board solved by deduction has nothing like that to show.

What this means for NANDI: copy the LinkedIn logic-game line, not the Wordle grid. Put a puzzle number up front so a group can see the posts are about the same board. Add one emoji per type and a clean-run phrase. Keep the link, because NANDI has no store listing or brand recognition yet, and the link is the whole growth path.

## 2. NANDI today

### 2.1 Same board for everyone?

Yes, for daily boards.

- `src/core/time/dayKey.ts:2-16`: the day is the local date with a 04:00 boundary.
- `src/core/puzzles/daily.ts:9-19`: `featuredSpec(day)` picks the type and difficulty from the weekday. It parses the date at local **noon** (`T12:00:00`), so a daylight-saving change cannot shift the weekday.
- `src/core/puzzles/daily.ts:21-29`: `dailyBoard(day)` seeds from `daily:${day}:${type}:${diff}` and retries with `seed + attempt*7919`.
- `src/ui/screens/Mind.tsx:58`, `:265`, `src/workers/puzzle.worker.ts:15`: the screen sends `{ kind: 'daily', day: today }` and the worker calls `dailyBoard`. No device state goes into the seed.
- Tested: `src/core/puzzles/challenge.test.ts:7-15` rebuilds 7 days of boards from the link. `tests/e2e/challenge.spec.ts:5-28` does the same on a second, empty browser.

I checked it myself with a script in the scratchpad, not in the repo, using `tsx`:

| TZ | `dailyBoard('2026-10-22')` | `dailyBoard('2026-10-25')` (Sunday boss) |
|---|---|---|
| Asia/Kolkata | crowns medium, seed 797416356 | path hard, seed 2780999206 |
| UTC | same | same |
| America/New_York | same | same |

**Time zones for India.** All of India is on one zone, IST (UTC+5:30), with no daylight saving. So every Indian player switches to the new board at the same moment, 04:00 IST. That is better than LinkedIn's drop at midnight PT, which lands at 12:30 or 13:30 IST. The risks that remain are small:

- A friend abroad is on a different `dayKey` for part of the day. For example, 2026-10-22T01:00Z is the 22nd in Kolkata but the 21st in UTC and New York (from my script). Their "today" is then a different board. The challenge link already handles this, because it carries the seed and not the date.
- A phone with a wrong clock or time zone gets a different board. Wordle has the same limit.
- The case is **not** always the same for everyone. `cases.js:367-368` seeds the case from the date, but the difficulty is an input, and `Mind.tsx:105` forces `easy` for a player's first 3 cases. On a Sunday, a new player gets the easy case while a regular gets the hard one. This matches the onboarding rule in `docs/specs/04-mind.md:35`, but a "Case #6" post would compare different cases.
- `RULES.mind.dropUnlockTime: '07:00'` (`src/core/rules.config.ts:84`) is not used anywhere in `src/`. Boards change at 04:00, while `04-mind.md:35` says they unlock at 07:00. Sharing doesn't depend on this, but the spec and code disagree.

### 2.2 Current share text (verbatim, from running the real functions)

Thursday 2026-10-22, Crowns medium, 4:12, no hints:

| Button | Code | What gets sent |
|---|---|---|
| **Share** (image plus text) | `share.ts:3-9`, tile `share.ts:11-26`, sent by `files.ts:7-51` | `NANDI · Crowns (Medium) · 4:12 · no hints` with a 900×600 dark PNG reading "NANDI · MIND / Crowns / MEDIUM / 4:12 · no hints" |
| Same, 1 hint | | `NANDI · Crowns (Medium) · 4:12 · 1 hint` |
| Case share | `CaseScreen.tsx:428` | `NANDI · Case (Medium) · 3:10 · 2 hints` (image plus text, no link) |
| **Challenge a friend** (daily only) | `challenge.ts:23-29`, sent by `files.ts:120-128` | `I solved today's Crowns on NANDI in 4:12 with no hints. Same board, your turn (no sign-up): https://nandi.nandi11.workers.dev/#mind/challenge/crowns/medium/797416356` |
| **Send your time back** (friend's reply) | same | `I took your Crowns challenge on NANDI and solved it in 4:12 with no hints. Same board: https://nandi.nandi11.workers.dev/#mind/challenge/crowns/medium/797416356` |

Both share buttons sit on the result card at `Mind.tsx:392`, and both appear only when `night === 'day'`.

### 2.3 Gaps, against what makes a post worth making

| What works in the reference games | NANDI now | Gap |
|---|---|---|
| A puzzle number, so posts can be compared | None. The tile and text show only type and difficulty (`share.ts:8`, `:17-22`). | Two posts in one group can't be matched. A practice result looks the same as a daily one. |
| One short, scannable line and a recognisable mark | The share line is short but plain. The challenge line is 150+ characters of prose. | Nothing to recognise at a glance in a chat list |
| A clean-run badge ("flawless", "no hints") | "no hints" is there. The app already computes `noHintClear` (`Mind.tsx:392`), but it isn't shared. | Small |
| A link to play the same puzzle | Only on the second button, and it is not the same text as the first | Two buttons, and the one labelled "Share" has no link |
| A link preview | `index.html:7` has only `<title>NANDI</title>`. There are no `og:` tags. | WhatsApp shows a bare link. Meta's docs say the preview needs `og:title`, `og:description`, `og:url` and `og:image`, with the image "under 600KB" and "300px or more in width" ([WhatsApp link previews](https://developers.facebook.com/docs/whatsapp/link-previews)). |
| The friend's play counts as their own daily | `Mind.tsx:332-336` always opens a challenge as **practice** (`daily: false`, attempt `2_000_000+`) | A friend who has NANDI solves today's board from the link, and their Today chip still says "Not done". They have to solve the identical board again. |
| The link opens in the app | `android/app/src/main/AndroidManifest.xml:38-41` has only the MAIN/LAUNCHER filter. There are no App Links, and `@capacitor/app` is not in `package.json`. | On Android, a friend with the app installed opens the link in Chrome, which has separate IndexedDB storage. This is not a small fix (see §4). |

## 3. Recommended smallest changes

In order of value per line of code. Every number goes in `rules.config.ts`. No new dependency. The copy uses Crowns, Sun & Moon, Number Path and Calcudoku only.

| # | Change | Where | Size |
|---|---|---|---|
| 1 | **Board number.** Add `boardNumber(day)`, the days since an epoch plus 1, calculated with `Date.UTC` on the `dayKey` parts so it is the same in every time zone. Put the epoch in `RULES.mind.boardNumberEpoch = '2026-10-17'` (the first changelog date), which makes 2026-10-22 board #6. Show it in the daily eyebrow too: "Daily board #6 · Thu 22 Oct". | new export in `src/core/puzzles/daily.ts` (next to `featuredSpec`, `:9`); `rules.config.ts:85` block; eyebrow `Mind.tsx:388` | ~8 lines + test |
| 2 | **One result text with the link.** Replace the body of `shareText` with a 2–3 line format (below). Pass the challenge URL in for daily and challenge runs. Add one emoji mark per type. | `share.ts:3-9`; callers `Mind.tsx:392`, `CaseScreen.tsx:428` | ~15 lines |
| 3 | **One primary button.** On daily and challenge results, make **Share result** call `shareLink(resultText)`, which shares text only, so WhatsApp shows it in full and it can be quoted and replied to. Keep the image tile as a secondary "Share as image", or drop it. Retire `challengeMessage`, or make it call `shareText`. | `Mind.tsx:392`; `challenge.ts:23-29`; `files.ts:120-128` needs no change | ~5 lines |
| 4 | **The friend's link counts as their daily.** In the challenge branch, if `challenge.type/diff` equal `featured` and `challenge.seed` equals `PZ.hash(\`daily:${today}:${type}:${diff}\`) + k*7919` for some k < 6, open `{ ...featured, daily: true }` instead of practice. (I checked: today's seed matches with k = 0.) Then a friend's run lands on `daily:${today}:…`, and XP, the Today chip and the story panel all work. | `Mind.tsx:332-336` (export the 7919 step from `daily.ts:25` so the two places can't drift) | ~6 lines + e2e |
| 5 | **Link preview tags.** Add `og:title` ("NANDI · today's board"), `og:description` ("Same board for everyone. Free, no sign-up, works offline."), `og:url`, and an `og:image` of 1200×630 PNG under 300 KB in `public/`. Crawlers never receive the `#…` fragment, so every challenge link gets the same generic preview. That is fine, because the result is in the text. | `index.html:7`, `public/` | ~5 lines + 1 image |
| 6 | **Case number only when it is truly shared.** Include `Case #N` only when the run's difficulty equals the weekday difficulty (`RULES.mind.caseDiffByWeekday`). For onboarding easy cases, leave the number off so nobody compares different cases. No link for cases yet. | `CaseScreen.tsx:428`, through the same `shareText` | ~2 lines |

Tests to update: `challenge.test.ts:24-26` (exact string), `tests/e2e/challenge.spec.ts:12-13` (button name and regex), plus one new unit test that `boardNumber` gives the same result under `TZ=Asia/Kolkata` and `TZ=America/New_York`.

### Proposed share text

These are the real outputs of the sketch, run on today's daily board (`2026-10-22`, Crowns medium):

```
NANDI 👑 Crowns #6 · Medium
4:12 · no hints ✨ · my best
Same board, your turn: https://nandi.nandi11.workers.dev/#mind/challenge/crowns/medium/797416356
```

```
NANDI 👑 Crowns #6 · Medium
6:31 · 💡💡 2 hints
Same board, your turn: https://nandi.nandi11.workers.dev/#mind/challenge/crowns/medium/797416356
```

```
NANDI 🔎 Case #6 · Medium
3:10 · 💡 1 hint
```

Rules for the text:

- **Marks:** Mini Sudoku 🔢, Crowns 👑, Sun & Moon 🌗, Number Path 〰️, Calcudoku ➗, Case 🔎. Use one per post, at the start of line 1, so it is easy to spot in a chat list.
- **Hints:** use `💡` once per hint, capped at 5, then the count. This is neutral. Don't use a red square or "failed" wording.
- **"my best":** add it only when the solve equals `bestPuzzleMs`. It is never replaced by a negative ("slower than usual").
- **Length:** 142 characters with the link. Line 1 fits in a WhatsApp notification preview.
- **Practice boards:** no number and no link, so they can't be mistaken for the daily board.
- **The friend's reply:** the same text. Line 3 becomes `My time on your board: <link>`.

### What not to add

| Idea | Why not |
|---|---|
| Streak in the post (LinkedIn's "🏅 I'm on a 106-day win streak!") | A visible streak in a group chat creates public pressure to keep it, and a visible loss when it breaks. This conflicts with NANDI's no-guilt and no-loss-state rules. It would also be the app-wide streak (`rules.config.ts:153`), not a puzzle streak. If a count is wanted, a total that only grows ("12th daily board") fits better. That is optional and not part of the smallest change. |
| An emoji "grid" of the board, or the first-placement colours like Queens | It reveals board state, and `04-mind.md:52` says "Share tiles contain no board state". The grid has nothing honest to show, because a logic board has no guess history. |
| Leaderboard or rank against friends | It needs accounts or a server, which conflicts with offline-first. A group chat already works as the leaderboard. |
| Sharing after bedtime | Keep the `night === 'day'` gate (`Mind.tsx:392`, `CaseScreen.tsx:428`). A 23:30 post pulls other people into late play. |
| An urgent call to action ("beat me now!") | It conflicts with the copy rules. "Same board, your turn" is enough. |

## 4. Later, not small

- **Android App Links**, so a friend with the app opens the board in the app and not in Chrome. This needs an `assetlinks.json` under `public/.well-known/`, an `autoVerify` intent filter in `AndroidManifest.xml`, and `@capacitor/app` (a new dependency, which needs a `DECISIONS.md` line) to route `appUrlOpen` into the hash router. Don't touch `server.hostname` (`capacitor.config.ts`).
- **A case challenge link** that carries `day` and `diff`, so a case result can be played by a friend as well.
- **Settle 04:00 against 07:00** for the drop (`rules.config.ts:84` against `04-mind.md:35`).

## 5. Limits of this review

- I could not open an NYT page that shows Connections' exact share text, or a working Reddit sample. That row comes from third-party descriptions only.
- The Wardle "trashy" quote comes from a secondary summary. The GDC criticism comes from PocketGamer.biz's paraphrase.
- I did not test how WhatsApp linkifies a URL containing `#…` on a real phone. The e2e test only checks the text.
- Emoji rendering (〰️, 🌗) was not checked on older Android fonts. If 〰️ looks wrong, use 🔀 or ➰ for Number Path.
