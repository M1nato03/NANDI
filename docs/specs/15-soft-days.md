# 15 · Soft days: help on tired or low days

Status: proposal from the idea engine (jenil-04), 21 Oct 2026. Build only after Jenil says yes.
Owner ask: "on days people are too tired or feel down, how can we help them feel good … it will leave a massive
psychological positive … help with maintaining their streaks … help us with word of mouth."

## 1. The problem, measured in today's build

To keep a day, NANDI asks for one of: a planned task, a workout or a 10-minute walk, a 5-answer drop, the daily
board, a case, or 10 due cards (`deriveEconomy.ts` `mark`). On a drained day all of these feel like work. So the
user either skips (a rest day is spent, or the streak pauses) or pushes through and feels worse. Either way, the
last thing they remember about NANDI that day is bad.

People remember a day mostly by its strongest moment and its last moment (the peak-end rule). A hard day that ends
with something small, kind and finished is remembered well. That memory is what brings someone back, and it is
what they tell a friend about.

**Goal:** a tired person opens NANDI, does one kind thing that takes about 2 minutes, and closes the app feeling a
little better than when they opened it. What they remember: "NANDI was easy on me when I was tired."

**Pull, not a hook.** Jenil asked to "make it addictive". We make people *want* to come back, not *unable to stop*.
Every piece below keeps the hard rules: no guilt, no loss screens, no random rewards, no endless feed, no nagging
notification. The pull comes from four things: a visible record of kind days (lanterns), a storybook page about
them, a fixed welcome-back gift, and a card a friend is glad to get.

## 2. Evidence (opened sources)

| Finding | What it means for NANDI | Source |
|---|---|---|
| Learners who studied hard items and then **15 less hard ones** remembered the session as less hard and less uncomfortable; 73–82% chose that version to repeat, even though it was longer. | End a hard day on something easy and finished. The last screen decides the memory. | Finn 2010, JEP:LMC 36(6) — https://pmc.ncbi.nlm.nih.gov/articles/PMC2970645 |
| In a 60,000+ person gym megastudy, the **best of 54 ideas** was a small fixed bonus for coming back after a missed workout: **+27% visits** (during the 4 weeks; long-term effect not shown). | A fixed "welcome back" gift on the first day after a miss. | Milkman et al. 2021, Nature — https://penntoday.upenn.edu/news/wharton-study-best-ways-boost-workout-habits |
| After a failed test, students given a **3-minute self-kindness message** studied longer for the retest than students given a self-esteem boost. | Copy on a low day is kind, never "you missed". Kindness makes people try again; it does not make them lazy. | Breines & Chen 2012, PSPB — https://pubmed.ncbi.nlm.nih.gov/22645164/ |
| A visibly broken streak lowers continuation (66% → 58%); a repairable one does less harm. Small emergency reserves raise rebound (47–55% vs 37%). | Already built: rest-day bank and repair. A soft day should mean the bank is not needed at all. | Barasch & Silverman 2022; Sharif & Shu 2019 (in `05-economy.md` §6) |
| Naming a feeling ("I'm tired") lowers its intensity a little, without feeling like effort. Effect depends on person and context. | One tap to say how today is, as the way into soft mode. No long mood diary. | Torre & Lieberman 2018, Emotion Review — https://journals.sagepub.com/doi/10.1177/1754073917742706 |
| Doing an act of kindness raises the doer's well-being (small to medium, δ = 0.28, 27 studies). | "Send someone a kind word" is one of the gentle choices. | Curry et al. 2018, JESP — https://eprints.bournemouth.ac.uk/30561/ |
| Senders **underestimate** how happy a thank-you or a quick "thinking of you" message makes the receiver, and how little awkward it feels. Surprise makes it land better. | The kind-word card is worth sending, and the person who gets it feels good. That good feeling is now linked to NANDI. | Kumar & Epley 2018, Psych Science — https://pubmed.ncbi.nlm.nih.gov/29949445/ ; Liu et al. 2022, JPSP — https://www.apa.org/news/press/releases/2022/07/friends-enjoy-being-reached |
| Content that stirs **high-energy feelings** (such as awe) is shared more; low-energy sad content is shared less. | Share warmth, never "I had a bad day". The card is a small gift, not a mood report. | Berger & Milkman 2012, JMR 49(2) — https://cssh.northeastern.edu/pandemic-teaching-initiative/wp-content/uploads/sites/43/2020/09/What-Makes-Online-Content-Viral.pdf |
| A new day, week or birthday helps people separate from a bad patch and start again. | The morning after a soft day opens with "a new day" and one line about yesterday's lantern. | Dai, Milkman & Riis 2014, Mgmt Science — https://faculty.wharton.upenn.edu/wp-content/uploads/2014/06/Dai_Fresh_Start_2014_Mgmt_Sci.pdf |
| Small valued activities lift low mood (behavioural activation, SMD −0.74 vs controls in therapy trials). | Gentle choices are tiny real actions (step outside, stretch), not just reading. NANDI is **not** therapy and must never say it treats anything. | Ekers et al. 2014, PLoS ONE — https://durham-repository.worktribe.com/output/1427994 |

What others do:
- **Apple Fitness (watchOS 11)** lets you pause rings for a day or longer and set a smaller goal for some days, and the
  award streak continues (https://www.macworld.com/article/2446605/how-to-pause-apple-watch-activity-rings.html).
  NANDI already has the bank; soft days go one step further: a smaller goal that still counts.
- **Finch** (4.9★ from 766K ratings, App Store Editors' Choice) is loved for "quick mood checks", couch yoga for
  days you can't get up, and never making you feel bad for skipping (https://apps.apple.com/app/id1528595748).
  Its pet and coins are not our model; the no-shame tone and tiny options are.

## 3. What to build (in this order)

### A. "Low on energy?" chip (the way in)
- A small chip on Home, always there before bedtime: **"Low on energy today?"**. NANDI never asks by notification.
- Tap → a sheet: **"What kind of day is it?"** with **Tired** · **Feeling low** · **Not now**.
- Store a fact `soft-start` with `{ state: 'tired' | 'low' }` for today. One per day; the user can switch back with
  "I feel okay now" on the soft Home.
- After bedtime the chip opens the existing night routine instead (the night rule stays: no late screen work).

### B. Soft Home: one gentle thing
When today has `soft-start`, Home shows **one card only**. Season rank, ladder, quests and the shop are hidden for
the day. Kachhua (the tortoise, already the Sleep friend) hosts in the `rest` pose. Sounds are quieter.

- Tired: Kachhua says **"Slow is still moving. Pick one small thing."**
  1. **Breathe with Kachhua · 1 min** (slow in-out circle, CSS only).
  2. **Stretch in bed · 2 min** (3 drawn stretches, reuse Train's form-cue drawings).
  3. **Do one tiny task** (the smallest open task, or type one like "fill my water bottle").
- Feeling low: Kachhua says **"Low days happen. Pick one kind thing."**
  1. **Step outside · 5 min** (honour check-in, like the rest-day check).
  2. **Send someone a kind word** (part E).
  3. **One good thing from today** (one line, stays on the phone, shows in the storybook only if the user allows).

The list is fixed per state. Never random, never more than three, no "do more" list after.

Doing any one writes a fact `soft` `{ choice }`. In `deriveEconomy`:
- `soft` makes the day **marked** (the streak grows; no rest day is spent; gold continues — the user showed up).
- It is not a Hat-trick slot and gives a flat **10 XP**. Season, Clean Week and quests need the real slots as today.
- No cap. If someone is low every day, NANDI keeps welcoming them (and part F checks in on them).

### C. Soft finish and the lantern (the memory)
- Finishing the gentle thing shows a calm finish (reuse the finish moment, no count-up, soft haptic):
  **"That counts. Kachhua lit a lantern for today."**
  Then **"You can stop here."** with one button **Close for today** and a quiet text link **"I feel better, show me
  more"** for anyone who perked up. The finish is the last screen; nothing auto-continues.
- The courtyard gains **one lantern per soft day** (a fixed object in Kachhua's area, derived from `soft` facts).
  Lanterns never go away. This is the visible record of kind days.
- **Next morning**, the first open shows one line: **"Yesterday was a soft day. You still showed up."**
- **Sunday storybook** gets a soft-day page (human-written lines, picked by week like the current pages), e.g.
  **"On Wednesday you were tired and still lit a lantern."** · **"{n} lanterns this week. Kachhua kept every one glowing."**

### D. Welcome-back gift (after a miss)
- The first marked day after an unmarked day (rest day spent or streak paused) gets a fixed **+15 XP "Welcome
  back"**, shown as **"Welcome back. Here is a small gift for coming back."** Same amount every time, announced, never
  random. A soft day counts as that first marked day, so the easiest way back is always open.
- Repair (2 Hat-tricks in 48 h) stays as it is.

### E. Kind word to a friend (word of mouth that is a gift, not an ask)
- The user picks a line or writes their own. Starter lines (Jenil approves or rewrites them; no AI lines ship):
  "Thinking of you today." · "Hope today is gentle with you." · "No reply needed. Just sending a little warmth." ·
  "You make things better. Just saying." · "Drink some water and take a breath. You've got this."
- NANDI draws a small card on a canvas: a courtyard friend, the line, and a tiny footer **"sent with NANDI"** plus
  the app link. It opens the system share sheet (`@capacitor/share`, already installed). No contacts are read, no
  account, nothing is uploaded.
- **No XP or reward for sharing**, and no count of shares shown. Paying for shares makes them spam and breaks trust.
  The kind act already marks the day as a gentle choice.
- Why it spreads: the friend gets a surprise warm message (Kumar & Epley, Liu et al.) and meets NANDI inside that
  feeling. That is the word of mouth we want.

### F. Care card (safety, for an 18+ app)
- If **Feeling low** is chosen on **4 or more of the last 14 days**, show this once, then at most once every 14 days:
  **"Low days come to everyone. If they keep coming, talking to someone helps. Tele-MANAS is free, open day and night,
  in 20 languages."** with **Call 14416** (a `tel:` link) and **Not now**.
- Tele-MANAS is India's national helpline (NIMHANS, Ministry of Health): 14416 or 1-800-891-4416, 24×7
  (https://telemanas.mohfw.gov.in ; https://vikaspedia.in/health/mental-health/tele-manas). The builder re-checks the
  number on the official site before shipping.
- No diagnosis words, no "are you okay?" pop-ups, never in a notification.

## 4. Data and rules
- New ledger kinds: `soft-start`, `soft`. Both stay on the phone, go into backup, and are deleted with the account
  data. Mood state is personal data: add one line to the privacy notice before DPDP (13 May 2027). Never sent anywhere.
- Notifications never mention soft days, mood or the care card. Once today is marked by a soft day, today's streak
  reminder is cancelled.
- All new copy passes copy-lint (no "lost", "fail…", "you should", "streak broken").
- No new dependency. Breathing circle and lantern are CSS/SVG. A Rive Kachhua can come later with the Rive cast (spec
  13 step 5), only after Jenil OKs Rive.

## 5. Build cost
Small. Two fact kinds and two lines in `deriveEconomy`; one sheet; one Home variant; one finish variant; one
courtyard object; one storybook page set; one canvas card; one rule for the care card. Owner panel: three numbers
(below). Tests: economy unit tests for mark/no-bank/gold/welcome-back; e2e for chip → gentle thing → finish → lantern.

## 6. Kill test
Measured locally, shown in the owner panel, over Jenil's next 2 weeks (plus any testers):
1. **Finish rate:** soft days started → gentle thing done. Keep if **≥ 70%**. Lower means the options still feel like work.
2. **Time on a soft day:** median **≤ 4 minutes**. Longer means it has become a session, not a rest.
3. **Next-day return:** after a soft day vs after an unmarked day. Soft days must be higher.
4. **Jenil's verdict** after his next 3 tired days: "Did you close NANDI feeling a bit better?" If it felt like a
   chore or a guilt trip, cut B and C and keep only D.
5. **Cannibal check:** if soft days pass **half of all active days** for a user over 2 weeks *and* real slots drop,
   soft mode has become the default. Then show the chip only after 6 pm. (Not a cap, just later.)
6. **Kind word:** if fewer than 2 cards are sent across all testers in 2 weeks, drop E.

## 7. Not doing
- Mood diary, charts of sad days, or streak counts of low days (shame dashboards).
- "Your friend is waiting" or "don't lose your streak" style nudges.
- Random gifts, spin wheels, mystery lanterns.
- Rewards for invites or shares.
- Any claim that NANDI treats stress, anxiety or depression.
