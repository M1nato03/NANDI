# 19 · Shares that bring a friend in

Status: idea engine (jenil-8c), 22 Oct 2026. Small (about a day of build). Evidence: cloud jobs 5, 6 and 7 of batch 1
(`docs/reviews/cj-competitors-india.md`, `cj-word-of-mouth.md`, `cj-puzzle-share.md` on `ideas/cj-*`), all checked
against `origin/main` 78d1a28 and `origin/ship-27`. Needs Jenil's yes before it is built.

## What a share does today (measured)
- The board result text is `NANDI · Crowns (Medium) · 4:12 · no hints` with a dark image. **There is no link**, so a
  friend who sees it in WhatsApp has nowhere to go (`src/core/puzzles/share.ts:3-9`, `Mind.tsx` share button).
- The Case share and the Sunday week card are the same: an image, no link (`CaseScreen.tsx`, `RecapShare.tsx`).
- Only the second button ("Challenge a friend") carries a link, as 150+ characters of prose.
- Pasting our link in WhatsApp shows a bare URL: `index.html` has only `<title>NANDI</title>`, no preview tags.
- Two people posting the same day can't tell they played the same board: there is no board number.
- A friend who already has NANDI and opens today's challenge link plays it as **practice**: their Today chip still says
  "Not done" and they must solve the identical board again (`Mind.tsx` challenge branch, `daily: false`).

Why it matters: in India this age group recommends things in small 1:1 WhatsApp chats, to look useful, not for a
reward (Berger 2025; Barasch & Berger 2014; paid referrals make the receiver suspect the sender, Verlegh et al. 2013).
NANDI already has the best reason to talk: everyone gets the same board and the same idea each day. The share just
has to carry a way in.

## The change (5 parts)
**A. A link preview.** `index.html` gets `og:title` "NANDI · today's board", `og:description` "Same board for everyone.
Free, no sign-up, works offline.", `og:url`, and `og:image` (1200×630 PNG under 300 KB in `public/`, the Nandi mark on
the app background; no faces, no stock art). Crawlers never see the `#…` part, so every link gets this same preview.

**B. A daily board number.** `boardNumber(day)` = days since `RULES.mind.boardNumberEpoch` + 1, computed from the
dayKey parts with `Date.UTC` so it is the same in every time zone. Epoch = the first public release day (Jenil picks;
the builder may default it to the release date). Shown in the daily eyebrow: "Daily board #12 · Thu 5 Nov".

**C. One result, one button, with the link.** On a daily or challenge result, the main button **Share result** sends
text only (so WhatsApp shows it in full and people can reply to it):
```
NANDI 👑 Crowns #12 · Medium
4:12 · no hints ✨
Same board, your turn: https://nandi.nandi11.workers.dev/#mind/challenge/crowns/medium/797416356
```
- One mark per type at the start: Mini Sudoku 🔢, Crowns 👑, Sun & Moon 🌗, Number Path 〰️, Calcudoku ➗, Case 🔎.
- Hints are `💡` once each (up to 5). Nothing red, no "failed", no streak, no board state.
- "my best" is added only when it is the player's best time; never a negative ("slower than usual").
- Practice boards get no number and no link. A Case gets `Case #N` only when it is the weekday's shared case; no link
  for cases yet.
- The image tile stays as a smaller "Share as image" for Status. The week card passes one line + the link as text.
- The friend's reply uses the same text with line 3 "My time on your board: <link>". `challengeMessage` goes away.

**D. A friend's link to today's board counts as their daily.** If the link's type, difficulty and seed match today's
featured board (the seed rule in `src/core/puzzles/daily.ts`; export its step so the two can't drift), open it as the
daily board, so their XP, Today chip and story page all work. Old or other boards stay practice.

**E. "Ask someone" after a lesson.** The Learn finish screen gets one quiet text button, *Ask someone*, for the first
idea met today. It sends the idea's hook as a question, without the answer:
"Quick one: [hook] Guess, then ask me. I learned it on NANDI today. nandi.nandi11.workers.dev". Under it, plain text:
"Or try it on someone at lunch." Explaining to someone else also helps the sender remember (Nestojko et al. 2014,
short-term recall). Content rule for the editors: a hook must make sense alone and must not give the answer away.

## Rules for every share
- The user taps to send. Nothing is sent automatically; no contacts are read; links carry no tracking.
- **0 XP, 0 Shards, no badge for sharing.** No share count is ever shown to the user.
- Hidden after bedtime (the existing `night === 'day'` gate). Shown on stopping screens only, never as a pop-up or a
  repeated nudge.

## Not doing (and why)
Refer-and-earn, invite-only, friend streaks, a leaderboard of friends, "your friend is waiting" nudges, contact import,
an emoji grid of the board. Each one is a paid referral, a loss state, social pressure, or needs accounts.
Later, only if this works: "Send to one person" on the week card (STEP UP trial's support arm), and a one-week friend
pact. Opening links in the installed Android app (App Links) is a separate, bigger job.

## Kill test
- Before release: paste the link into WhatsApp. No preview → fix A before anything else.
- Test group (Jenil + about 10 friends), 3 weeks: ask each receiver "did you tap it?" and "did it read like an ad?"
  Drop the link line if 3 or more of 20 receivers say "ad". Remove *Ask someone* if it is used on fewer than 1 in 15
  finished lessons, or if fewer than half of receivers say they guessed or replied.
- Open question for Jenil: may the weekly summary export count share taps on the phone (never sent anywhere)? If not,
  the kill test runs on asking people alone.

## Tests
Unit: `boardNumber` gives the same number under `TZ=Asia/Kolkata` and `TZ=America/New_York`; result text for daily,
practice, hints 0/1/5+, best time; the friend-link daily match (today's seed → daily, yesterday's → practice).
E2E: update `challenge.spec.ts` for the new button name and text; a friend opening today's link marks the Today chip.
