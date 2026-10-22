# Word of mouth for Indian 18–25s

Cloud job 6 · 22 Oct 2026 · branch `ideas/cj-word-of-mouth` · research only, no app code changed.

Question: what makes Indian college students and young workers recommend an app to friends,
and which NANDI mechanics fit the hard rules (no paid referrals, no guilt, no random rewards,
no loss states, no endless feeds, offline-first)?

Scope note: Job 7 covers the daily-puzzle share grid. This report does not redesign that grid.

---

## Bottom line

1. Recommendations in this group come mostly from close ties, in small chats, about things that make the sender look useful or in the know. Status (broadcast) is for looking good. A 1:1 chat is for being useful.
2. Paid referrals work best on weak ties. They also make receivers suspect the sender's motives. NANDI's no-pay rule costs little in close-friend chats, which is where this group decides.
3. WhatsApp is the main channel. Every share has to make sense as a WhatsApp message: short text, a working link and a link preview. NANDI's link has no preview today (no Open Graph tags), and its solve and week cards carry no link at all.
4. NANDI already has the strongest asset: a reason to talk every day (same board, same idea). The gaps are the way in, the one-to-one messages, and the content that isn't puzzles (Learn ideas, kind words, the week).
5. Five mechanics below. All are small builds on the existing `shareLink`/`shareOrDownload`. None earns XP. All stay hidden after bedtime, as the current share buttons are.

---

## 1. What the evidence says

### 1.1 Indian 18–29 survey data

| Finding | Source | What it means for NANDI |
|---|---|---|
| 76% of Indian Gen Z say the real purchase trigger is "instant feedback from people they trust". 63% share products with friends or family before buying. (n = 1,008, GWI for Snap, June 2026) | [Tech Times, 13 Aug 2026](https://www.techtimes.com/articles/324327/20260813/india-gen-z-trusts-friends-not-creators-close-festive-purchases-new-study.htm) | Peers close the decision. Creators only help discovery. Design for the friend chat, not for reach. |
| In the same study, 75% of daily Snapchat users chat with a friend about an item while it is in their basket. | same | People ask before they commit. A share that says "try this, no sign-up" fits that moment. |
| Indians aged 18–29 trust "their own research most (27%)", then friends (20%) and reviews (15%). Creators drive discovery (29%), but only 6% buy straight after a creator recommends something. (n = 4,002, 18 states, YouGov for Rukam Capital) | [MediaBrief, 25 Sep 2026](https://mediabrief.com/six-in-10-gen-z-consumers-use-ai-for-research/) | A friend's word gets them to look. The product then has to pass their own check fast. The link must open on something real, with no wall. |

Caveat: both studies are about shopping, not apps. I found no India-specific figure for how 18–25s discover apps.
Both reached me through press write-ups. I could not open either full report.

### 1.2 Why people share (primary research)

Berger's 2025 Annual Review of Psychology review lists six drivers of sharing: impression management, accessibility, emotion regulation, information acquisition, social bonding and persuasion.
([Berger 2025, Annu. Rev. Psychol. 76](https://faculty.wharton.upenn.edu/wp-content/uploads/2016/11/WOM-Annual-Rev-of-Psych.pdf), [doi](https://doi.org/10.1146/annurev-psych-013024031524). I read the PDF in full.)

Lines from the review that matter for NANDI:

- "the better something makes people look, the more likely they are to share it"
- Useful things get shared "because it makes sharers seem knowledgeable and helpful".
- "over 40% of what is discussed are things happening right now". Another 25–35% just happened or is less than a day away.
- "almost 6 out of 10 text messages are phatic in nature". In other words, they mainly tell the other person "I'm thinking of you".
- On audience size: "When sharing with just one other person, people tend to be more focused on their audience, which encourages sharing things that audience might find interesting or useful." With a large group, people share "things that make them look good". (Barasch & Berger 2014, [JMR 51(3)](https://vivo.colorado.edu/display/pubid_332679))
- Emotion: high-arousal content (awe, anger, anxiety) is shared more. Low-arousal content such as sadness is shared less. ([Berger & Milkman 2012, JMR](https://faculty.wharton.upenn.edu/wp-content/uploads/2011/11/Virality.pdf))

Most word of mouth happens offline. "Just seven percent of word-of-mouth conversations about brands occurs online" (Keller Fay, n > 32,000, 2011).
([Entrepreneur, 23 Nov 2011](https://www.entrepreneur.com/blog/220776))
The figure is old and US-based. Treat it as a direction, not a benchmark.

### 1.3 STEPPS mapped to NANDI

STEPPS is the framework from Berger's *Contagious* (2013). I could not open the book. Berger's site mentions only "six basic principles" ([jonahberger.com](https://jonahberger.com/books/contagious/)).
The names below are the book's as widely summarised. The evidence behind each one comes from the 2025 review above.

| Principle | NANDI today | Gap |
|---|---|---|
| Social currency (looks smart or in the know) | Time and hints on the solve card; "No-hint clear" stamp | Learn ideas, the most "smart-looking" content, can't be shared |
| Triggers (everyday cues) | One daily board and one daily drop, the same for everyone | Nothing ties NANDI to a daily cue outside the app, such as lunch, the commute or a chai break |
| Emotion | Board solve, finish burst | The kind-word card (coming) is low-arousal. It suits one person, not Status |
| Public (others can see it) | Week card (image) | The card has no link, so seeing it gives no way in |
| Practical value | None shared | Concept hooks (for example the idli inflation question) are useful and short, but stuck inside the app |
| Stories | Courtyard cast, Sunday storybook | Not shareable. Out of scope here |

### 1.4 Paid vs unpaid referrals

| Study | Finding | Use for NANDI |
|---|---|---|
| Ryu & Feick 2007, *J. Marketing* 71(1) | "rewards increase referral likelihood", and are "particularly effective in increasing referral to weak ties and for weaker brands" ([abstract](https://biz.korea.ac.kr/eng/news/academic_view?no=84)) | This is what NANDI gives up. Weak-tie reach is the cost of the no-pay rule. Say so plainly. |
| Verlegh, Ryu, Tuk & Feick 2013, *JAMS* 41(6) | Rewards "lead receiving consumers to infer ulterior motives"; "this effect is stronger for unsolicited and weak tie referrals"; "symbolic rewards can eliminate the negative effect" ([UvA repository](https://dare.uva.nl/id/553a0430-0ee6-4f93-bd73-f97db1105ca2)) | An unpaid message from a friend reads as honest. Even symbolic in-app rewards for sharing would count as paid under NANDI's rules, so give none. |
| Wirtz, Orsingher, Chew & Tambyah 2013, *J. Service Research* 16(1) | Senders worry how the receiver will see them. That worry gets worse when an incentive is present and eases with tie strength ([Unibo record](https://cris.unibo.it/handle/11585/151861)) | No reward means nothing to feel awkward about. Close ties are where unpaid sharing works. |
| Schmitt, Skiera & Van den Bulte 2011, *J. Marketing* 75(1) | Referred customers are worth "at least 16%" more, with higher retention that lasts (German bank, ~10,000 customers) ([PDF](https://faculty.wharton.upenn.edu/wp-content/uploads/2012/04/Schmitt-Skiera-vandenBulte-2011-Referral-Programs-Customer-Value.pdf)) | Friend-brought users tend to stay. That is worth building for, even unpaid. |

### 1.5 WhatsApp-first sharing in India

| Fact | Source |
|---|---|
| WhatsApp had "more than 400 million monthly active users" in India (spokesperson, Jul 2019) | [TechCrunch](https://techcrunch.com/2019/07/26/WhatsApp-india-users-400-million/) |
| "more than 500 million in India alone" (reported with Meta's denial of an ads story, 2023) | [Siasat](https://www.siasat.com/meta-denies-exploring-ads-in-whatsapp-to-boost-revenue-2696064/amp/) |
| Among mainly English-speaking online news users in India, 55% use YouTube and 46% WhatsApp for news | [Reuters Institute DNR 2025, India](https://reutersinstitute.politics.ox.ac.uk/digital-news-report/2025/india) |
| People "consciously decide what to share in which WhatsApp group such as family, friend, work, political groups" (BBC study, 2018, 40 in-depth interviews) | [BOOM summary](https://www.boomlive.in/amp/why-indians-share-fake-news-10-things-to-know-from-the-bbc-study). The BBC report itself was pulled and I could not open it. |
| "one in three smartphone users in India run out of space daily" (Western Digital survey, reported by WSJ), with "Good Morning" images a big cause | [Tribune India, Jan 2018](https://www.tribuneindia.com/news/archive/good-morning-messages-eating-up-smartphone-space-in-india-report-532992) |
| WhatsApp link previews need non-empty `og:title`, `og:description` and `og:url` in the `<head>`, plus an `og:image` "under 600KB" and at least 300px wide. The URL "should be undecorated, without session variables, user identifying parameters and counters." | [Meta developer docs](https://developers.facebook.com/docs/whatsapp/link-previews) |

What this means for NANDI:
- Text plus a link with a preview is the native WhatsApp format. Images are heavy, and people get too many of them.
- Each group gets its own kind of message: the class group gets the board, one friend gets the idea, family gets the week.
- No tracking parameters on links. That is WhatsApp's own advice, and it matches NANDI's offline, no-telemetry stance.

---

## 2. Case notes

| App | What drove sharing | Fits NANDI? | Lesson |
|---|---|---|---|
| **Wordle** | 90 players on 1 Nov 2021, more than 300,000 by 2 Jan 2022, "more than 2 million a week later". Grew after the share feature arrived. "Between January 1 and 13, 1.2 million Wordle results were shared on Twitter." One puzzle a day, about 3 minutes. ([Wikipedia](https://en.wikipedia.org/wiki/Wordle)) Families describe the daily result as "a consistent reason for my family to stay in touch" ([Cavalier Daily](https://www.cavalierdaily.com/article/2022/10/a-word-on-wordle)) | Yes. NANDI already has the daily board and the challenge link | Common ground plus a daily trigger plus no spoilers. Job 7 owns the grid. |
| **LinkedIn Queens** | Games "refreshed daily", "designed to be solved in under five minutes" and "designed to be shared with co-workers, college alumni and associates at rival companies" ([CNN via ABC17, May 2024](https://abc17news.com/money/cnn-business-consumer/2024/05/01/move-over-new-york-times-now-linkedin-is-adding-brain-busting-games/)). Search summaries also mention connection and school leaderboards, but I did not verify that. No India figures found | Partly. Rankings against connections are comparison pressure | The audience is your own circle: classmates and colleagues. NANDI's one-to-one "Send your time back" covers friendly rivalry without a ranking. |
| **Duolingo (India)** | "Word of mouth has been our most powerful growth lever since the beginning"; "the vast majority of our users have been acquired organically" ([Q2 2023 letter, SEC](https://www.sec.gov/Archives/edgar/data/1562088/000156208823000173/duolingo_q2-2023xshareho.htm)). New learners in India rose 400% year on year in 2020 ([Duolingo blog](https://blog.duolingo.com/language-learning-for-the-next-billion-duolingo-in-india/)). India is "the largest English-learning market for Duolingo", and its marketing there aims at "organic virality" ([afaqs, Nov 2024](https://afaqs.com/marketing/duolingos-india-quest-finding-virality-in-a-nation-full-of-polyglots-7601019)) | Partly. Friend Streak and leagues are loss and comparison mechanics (see `docs/research/making-it-cool.md`) | A useful product with a strong character spreads without pay. Copy that, not the streak. |
| **CRED** | Gate: "you need a credit score of 750 or above" ([cred.club](https://cred.club/)). In-app invite links. "CRED rewards both the user and their referrer". Referred users were "50% higher than average" on passing eligibility and "44% higher than average" on first payment ([AppsFlyer case study](https://www.appsflyer.com/customers/CRED/)) | No. Paid referrals and an exclusivity gate | Referred users are better users, which matches Schmitt et al. The invite flow is a direct link with no code to copy. NANDI's challenge link already works that way. |
| **Zepto** | Refer-and-earn credit. Third-party pages list "up to Rs 200" per friend, with a WhatsApp link flow ([NextLeap teardown](https://assets.nextleap.app/submissions/ZeptoReferralProgramProductTeardown-158f4baf-b530-46c6-819c-305cc0446dfc.pdf), [GoPaisa](https://www.gopaisa.com/referral-signup-bonus-code-coupons-offers/zepto-referral-code)). I found no official Zepto terms page | No. Paid referral | Not applicable. Included only as the contrast case. |
| **Finch** | Grew "mostly through word-of-mouth and performance marketing" (reported, not quoted, [MediaPost, May 2026](https://mediapost.com/publications/article/415234/self-care-app-finch-promotes-whatever-it-takes-to.html)). Friends send "good vibes" to each other's pet. User reports only ([Bustle](https://www.bustle.com/wellness/finch-app-review-features-price), [Lemon8](https://www.lemon8-app.com/@brandolphin/7434604044741575223?region=us)) | Partly. NANDI has no accounts or friend graph | Small, warm one-to-one gestures fit a self-care app. NANDI can do that through WhatsApp text, with no friend system. |

---

## 3. What NANDI ships today (origin/main, 78d1a28)

| Piece | Where | Note |
|---|---|---|
| Solve text | `src/core/puzzles/share.ts:3-9` | `NANDI · name (Diff) · m:ss · hints`. **No link.** |
| Solve tile (900×600 PNG) | `src/core/puzzles/share.ts:11-26` | No link or URL drawn |
| Share button (board) | `src/ui/screens/Mind.tsx:392` | Shown only when `night === 'day'`. Passes `shareText` as the share text, so the WhatsApp message carries no way in |
| Share button (Case) | `src/ui/mind/CaseScreen.tsx:428` | Same: tile and text, no link, no challenge |
| Challenge link | `src/core/puzzles/challenge.ts:7,13,23-29`; button `Mind.tsx:392` | Seed in the URL hash, "Same board, your turn (no sign-up)". Shown only on daily or challenge boards |
| Receiver path | `src/ui/screens/Mind.tsx:332-336`, `src/ui/welcome/Welcome.tsx:33-34` | Opens straight onto the board and skips first run. Good |
| Share plumbing | `src/platform/files.ts:7-51` (`shareOrDownload`), `:120-128` (`shareLink`) | Native share sheet, then Web Share, then clipboard. Reusable as is |
| Week card | `src/ui/screens/RecapShare.tsx:28-37`, `WeekEndShare.tsx:6-17` | 1080×1350 image. **No text or link passed** (`RecapShare.tsx:32`) |
| Link preview | `index.html:7` | Only `<title>NANDI</title>`. **No `og:*` or description tags** (checked the live build with curl too), so WhatsApp shows a bare link |
| Learn finish | `src/ui/learn/LearnDrop.tsx:231-236` | Stopping screen lists concepts touched. Nothing can be shared |
| Concept hooks | `content/topics/*.json` (`concepts[].hook`, ≤280 chars per `src/data/packs/schemas.ts:41`) | Ready-made "guess this" questions. Example: "Five ₹20 idlis fit a ₹100 note; after each idli becomes ₹25, only four fit…" |

---

## 4. Five mechanics

Rules for all five:
- User taps to send. Nothing is sent automatically, and no contacts are read.
- **Sharing earns 0 XP and 0 Shards.** Any reward would make it a paid referral (Verlegh et al. 2013).
- Hidden after bedtime, the same as `night === 'day'` at `Mind.tsx:392`.
- Shown once on a stopping screen, never as a pop-up or a repeat nudge. "Not now" is always there and costs nothing.
- No count of shares is shown to the user, so sharing can't become a score.
- Links are undecorated (Meta's own advice). Nothing is tracked on the server.

### M1 · A way in on every share (fix first)

**What.** Every NANDI message carries one short line and the web link, and the link shows a proper preview in WhatsApp.

**Why.**
- Talk follows what is easy to see and act on (Berger 2025, accessibility).
- Seeing a card with no link gives the friend nowhere to go.
- In CRED's invite flow, the link itself installs the app, and referred users did better on every measure it reported ([AppsFlyer](https://www.appsflyer.com/customers/CRED/)).
- WhatsApp needs `og:title`, `og:description`, `og:url` and an `og:image` under 600KB to show a preview ([Meta](https://developers.facebook.com/docs/whatsapp/link-previews)).
- Indian 18–29s trust their own check most (27%), so the link has to open on something they can try at once ([MediaBrief](https://mediabrief.com/six-in-10-gen-z-consumers-use-ai-for-research/)).

**Simplest build.**
1. `index.html`: add `og:title`, `og:description` (about 80 chars, e.g. "Daily puzzles, one small idea, an earlier night. Free, no sign-up."), `og:url`, and `og:image` pointing at a 1200×630 PNG under 300KB in `public/`.
2. `Mind.tsx:392` and `CaseScreen.tsx:428`: pass `` `${shareText(run, name)}\n${WEB_APP}` `` to `shareOrDownload`. Leave the on-screen line unchanged.
3. `RecapShare.tsx:32`: pass a one-line text plus `WEB_APP` as the second argument.

That is about 10 lines and one image. `WEB_APP` is already exported at `challenge.ts:7`.

**Kill test.**
- Paste the link into a WhatsApp chat. If no preview shows, fix the tags before anything else.
- Then send 20 shares across the test group and ask each receiver two things: did you tap it, and did it read like an ad?
- If 3 or more of the 20 say "ad", drop the line and keep only the link.

### M2 · "Ask someone" from today's idea

**What.** The Learn stopping screen gets one quiet button: *Ask someone*. It sends the concept's hook as a question, not the answer:
"Quick one: Five ₹20 idlis fit a ₹100 note… What changed? I learned it on NANDI today. Guess, then ask me. nandi.nandi11.workers.dev"
The answer stays with the sender, so the reply starts a conversation.
A plain line under it covers the offline case: "Or try it on someone at lunch."

**Why.**
- Useful things get shared because they make the sharer "seem knowledgeable and helpful". One-to-one sharing favours what the other person will find useful (Berger 2025; Barasch & Berger 2014).
- Most word of mouth is spoken (Keller Fay: 7% online).
- Expecting to teach improves recall. "learners expecting to teach recalled more material correctly" ([WashU, Nestojko et al. 2014](https://source.washu.edu/2014/07/expecting-to-teach-enhances-learning-recall/)). The study tested short-term recall only.
- So the button can help the sender's learning, not only growth.

**Simplest build.**
- In `LearnDrop.tsx:236`, under "Concepts touched", add one button for the first touched concept that has a `hook`.
- `onClick` calls `shareLink(text)` (`files.ts:120`). Show it only when `!night`, matching the existing pause screen at `LearnDrop.tsx:215`.
- No new content: hooks already exist and are validated at ≤280 chars (`schemas.ts:41`).
- One content rule for the editorial check: a hook must make sense without the answer and must not give it away.

**Kill test.**
- Run for 3 weeks with the test group.
- Kill it if the button is used on fewer than 1 in 15 finished drops.
- Also kill it if, when asked, fewer than half the receivers say they replied or guessed.
- Keep the "try it on someone" line either way, because it costs nothing.

### M3 · Pass on a kind word (extends the coming low-day card)

**What.** The kind-word card NANDI shows on a low day gets a second, optional button: *Send one to someone*.
It shares a short warm line ("Thinking of you today. Hope it's a gentle one.") through `shareLink`.
- **No app link and no NANDI name by default.** It is the person's message, not an ad.
- The message never mentions the sender's low day.

**Why.**
- People "underestimate how much people appreciate being reached out to". The gap grows when the message is unexpected. The studies used "a short note, or a note and a small gift", with more than 5,900 participants ([PsyPost on Liu et al. 2022, JPSP](https://www.psypost.org/2022/08/study-identifies-a-robust-tendency-to-underestimate-how-much-others-appreciate-being-reached-out-to-63627)).
- Gratitude senders likewise "underestimate the level of happiness their expression of gratitude brings" ([APS on Kumar & Epley 2018](https://www.psychologicalscience.org/publications/observer/obsonline/people-underestimate-the-power-of-saying-thanks.html)).
- About 6 in 10 texts are "thinking of you" messages (Berger 2025).
- Low-arousal feelings spread poorly to big audiences (Berger & Milkman 2012), so this is one-to-one only and never Status.
- Finch's friend "good vibes" suggest this fits a self-care app (user reports only).

**Honest limit.** The growth effect is indirect. The gain is a warmer link between NANDI and real friendships, which is the opposite of the scroll NANDI replaces.

**Simplest build.**
- One extra button on the kind-word card, calling `shareLink(line)`.
- Lines come from the same content pack as the card, and the pack validator bans shame words.
- An optional "add NANDI link" toggle, off by default.

**Kill test.**
- Show the card to the test group for 4 weeks, then ask: did the button feel forced or out of place on a low day?
- If 3 of 10 say yes, remove it.
- Also remove it if it is used on fewer than 1 in 20 showings.

### M4 · Your week, to one person

**What.** The Sunday week card gets a second option next to *Share* (which stays the image for Status): *Send to one person*.
That sends three short text lines from the recap plus the link.
On first use the user may type a first name, stored locally, so the button reads "Send to Riya". There is no contact access.

**Why.**
- In the STEP UP trial (n = 602), the *support* arm emailed a weekly report to one family member or friend. It added 689 steps a day over control during the 24-week intervention. "competition was the most effective" (+920), and only competition stayed significant at follow-up ([JAMA Intern Med 2019, PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC6735420)).
- NANDI rules out competition. A weekly note to one supporter is the strongest arm that fits the rules.
- One-to-one sharing is other-focused, while Status is self-presentation (Barasch & Berger 2014). Offering both lets people pick.
- In India, people deliberately choose which group gets what (BBC 2018, via BOOM).

**Simplest build.**
- `RecapShare.tsx:44`: add a button that calls `shareLink(card.lines.slice(0, 3).join('\n') + '\n' + WEB_APP)`.
- The name is one `settings` row (`recap.supporterName`). It uses the natural-key settings pattern and needs no new table.
- It still needs the backup round-trip test before shipping.
- Copy must never imply the supporter is waiting or let down.

**Kill test.**
- Over 4 Sundays, kill it if fewer than 3 in 10 test users send it at least twice.
- Also kill it if any supporter says it feels like being reported to.
- Weak extra check: compare active days in weeks with and without a sent note. This is self-selected, so it is a direction only.

### M5 · Friend pact for one week

**What.** One person picks a small plan for the week from a short list ("3 walks", "phones down at dinner twice", "lights out by 11 on two nights") and sends a link.
The friend's phone opens the same pact card. Each phone tracks only its own ticks.
At the end each person can tap *Send done* to post a pre-written message to the other.
- The pact ends Sunday.
- There is no streak or score, and nothing breaks.
- Missing it costs nothing, and a new pact can start any week.

**Why.**
- Berger lists social bonding as a core reason to share, through common ground: things the other person "can weigh in on" (Berger 2025).
- People describe doing the same Wordle on the same day as a shared goal that keeps families in touch ([Cavalier Daily](https://www.cavalierdaily.com/article/2022/10/a-word-on-wordle)).
- STEP UP's social arms all raised activity during the trial (PMC above).
- Duolingo's Friend Streak shows the demand: a third of daily users had one (cited in `docs/research/making-it-cool.md`). NANDI keeps the "together" and drops the loss state.
- The pact goes to one person, so it suits a strong tie and needs no reward (Wirtz et al. 2013).

**Simplest build.**
- Copy the challenge pattern. Add `src/core/pacts/pact.ts` with `pactRoute`, `pactUrl` and `parsePact`, mirroring `challenge.ts:12-21`.
- The link is `#plan/pact/<pactId>/<weekKey>`. `pactId` picks from a fixed list in `rules.config.ts`.
- Opening it writes one natural-key settings row (`pact.<weekKey>`).
- Ticks reuse existing facts (walks from Train sessions, lights-out from the night check-in) wherever possible, so nothing new is logged.
- *Send done* calls `shareLink`. No server, no accounts.
- Skip first run for pact links, as `Welcome.tsx:34` already does for challenge links.

This is the largest of the five (an estimated 1–2 days). Build it last, and only if M1–M4 survive.

**Kill test.**
- Run 10 pacts in the test group.
- Kill it if fewer than 3 end with both sides tapping *Send done*.
- Also kill it if anyone describes the pact as pressure.

---

## 5. Considered and rejected

| Idea | Seen in | Why not |
|---|---|---|
| Refer-and-earn (cash, credit, XP, Shards, cosmetics) | CRED, Zepto | Hard rule. It also triggers the "ulterior motive" penalty with receivers (Verlegh et al. 2013) |
| Invite-only access or a waitlist | CRED's score gate, Clubhouse-style waitlists | Artificial scarcity is a pressure tactic. NANDI is free and open |
| Friend streak | Duolingo | Loss state |
| Leaderboard against connections | LinkedIn Queens | Comparison pressure. The existing one-to-one "send your time back" already covers friendly rivalry |
| "Your friend is waiting" or "X of your friends played" nudges | Common in social games | Guilt and social pressure. Needs a friend graph NANDI doesn't have |
| Contact-book import or "invite 5 friends" | Many apps | Privacy cost, spammy, and against the offline, no-account design |
| Tracking parameters on links | Growth tooling | Meta advises undecorated URLs. NANDI has no telemetry |
| Status-sized (9:16) week card | WhatsApp Status | Possibly useful, but untested and the overlap with Job 7's card design is high. Revisit after M1 |

---

## 6. Measuring without telemetry

NANDI sends nothing home, so every kill test above uses:
1. **The test group** (Jenil plus about 10 friends). Ask receivers directly, in person or on WhatsApp, after 1–4 weeks. Small numbers, so the thresholds are deliberately blunt.
2. **Local counts in the weekly summary export** (`src/core/weeklySummary.ts`). Example: `shares: { board, case, idea, kind, week, pact }`, counting taps that returned `'shared'`. Jenil already exports this summary. Adding fields changes the export schema, so it needs a version bump and a backup round-trip test (non-negotiable rule).
3. **No server counting.** Hash routes never reach the server, and Meta advises against counters in shared links anyway.

Decision for Jenil (a product trade-off): is a local share count in the export acceptable?
It never leaves the phone unless he exports it. If not, the kill tests run on interviews alone.

---

## 7. What I could not verify

- The full GWI/Snap and YouGov/Rukam reports. I used press summaries only.
- The BBC "Duty, Identity, Credibility" report (pulled in 2018). I used BOOM's summary.
- Zepto's official referral terms. Third-party pages only.
- Finch's friend features. User posts only, with no official documentation found.
- The text of *Contagious* (STEPPS names come from summaries). The 2025 review is the primary source I used.
- Any India-specific data on how 18–25s discover apps, as opposed to products in general.
- YourStory (403) and Android Authority (403) would not open. PubMed blocked the fetch, so I used PsyPost and APS summaries for Liu et al. and Kumar & Epley.
