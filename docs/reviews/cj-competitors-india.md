# Indian competitor teardown, 2026

Job 5 of cloud batch 1. Written 2026-10-22.
Scope: 12 apps that compete with NANDI for the same 2–20 minutes of an Indian adult's day.
Duolingo, Seekho, Kuku FM, Headway, Imprint, Brilliant, Finch, Habitica, TickTick, Structured, LinkedIn Games, NYT Games.

## How this was gathered (read this first)

- **Reviews:** pulled on 2026-10-22 from the Google Play review feed with `hl=en`, `gl=IN`.
  For each app I read the 600 newest and the 400 "most relevant" reviews.
  For LinkedIn I scanned 3,600 reviews and kept the 22 that mention the games.
  Every quote below is copied word for word (typos kept). `…` marks a cut.
  Dates are the date Google Play shows for the review (it can be the last edit).
  Google Play has no permalink per review. Each quote links to the store page it came from.
  The feed is not filtered by reviewer country. Most reviewers cannot be confirmed as Indian.
- **App Store (India):** I opened each `apps.apple.com/in` page for its INR in-app purchase list.
  I did not quote App Store reviews.
- **Prices:** seen 2026-10-22. The Play range is Google's "in-app products" range per item, not a plan list.
  App Store items are the plan names and INR prices Apple lists. Prices change with offers.
- **First 2 minutes:** I could not install apps in this environment.
  This column comes from published screen-recording teardowns (screensdesign.com, Appcues), store listings,
  help pages, and what reviewers describe. Where none of these covered it, the cell says so.
- **Not verified** means I looked and could not confirm it from a page I opened.

## Summary table

| App | First 2 minutes | Daily loop | Streak / rest rules | How it avoids repetition | India price (2026-10-22) | Copy | Never copy |
|---|---|---|---|---|---|---|---|
| **Duolingo** | Pick language, reason and goal. First lesson runs before you make an account | Lessons on a path. Daily XP goal, quests, leagues. Energy limits free play | Up to 2 freezes equipped (200 gems each). Paid repair | Spaced practice model picks what to review. Users still say it repeats easy items | Super ₹199–215/mo, ₹1,199–1,749/yr, Family ₹1,799 (App Store) | Teach before any setup or sign-up | Energy that runs out even when you answer right |
| **Seekho** | Pick a language, then most content is locked behind a ₹1 trial that needs UPI Autopay | Short Hinglish how-to videos (money, jobs, phone tricks) | Not verified | Catalogue of 20,000+ videos | ₹49–149/mo, ₹199–599/yr (App Store). Play ₹99–999 | Practical topics Indian adults pay for, in Hinglish | ₹1 trial that sets up a ₹199 autopay mandate |
| **Kuku FM** | First episodes free. ₹1–2 trial with autopay to go further | Serial audio and vertical dramas, new episodes daily | Not verified | Endless new episodes and cliffhangers | ₹99/mo, ₹299–699/qtr, ₹899/yr, coin packs from ₹39 (App Store) | Indian stories told with good narration | Cliffhanger serials plus pay-per-episode coins |
| **Headway** | Long quiz, a "commitment pact", then a 7-day trial paywall | Daily micro-session, 30-day plan, challenges, flashcards | Has a streak. Exact rules not verified | 2,000+ titles, spaced-repetition flashcards | ₹699–8,300 across many plan items (App Store). Play ₹100–29,999 | Turn key ideas into spaced flashcards | Audio that plays book after book with no stop |
| **Imprint** | Quiz on sub-topics, goals, invite-a-friend, then paywall at about 2:25 | One visual chapter in ≤ 2 min, quizzes, saved cards | Streak resets to 0 on a miss (users ask for freezes, 2025) | Catalogue. Saved cards form a review deck | ₹869/mo, ₹5,400/yr (App Store) | Picture-first chapter under 2 minutes | Payment details before you see anything |
| **Brilliant** | Not verified first-hand. Free tier is 2–3 "keys" (lessons) a day | Interactive problems, streak, leagues, AI tutor | 3 problems or 1 lesson keeps it. Up to 2 Streak Charges, auto-used, do not grow the streak | Content can't be repeated (user complaint). Courses added monthly | ₹1,199/mo, ₹4,799–6,499/yr, with tutor ₹9,799/yr (App Store) | Problem first, explanation when you get it wrong | Hard daily cap on free learning |
| **Finch** | Hatch a pet, name it, pick a trait, quiz, then soft paywall at about 2:35 | Morning mood check gives pet energy. Pet explores. Evening it returns with a story | Streak, streak repair, "App Pause" (unofficial source) | Rotating quests and adventures | Plus ₹99–699/mo, ₹3,499–5,900/yr (App Store) | A "bad day" path that still counts | Progress tied to an account that can vanish |
| **Habitica** | Make an avatar, add tasks | Habits, Dailies, To-Dos give gold and XP. Missed Dailies cost HP | No streak shield. "Pause Damage" in settings. At 0 HP you lose a level, all gold and an item | Your own tasks. Random item drops | ₹389–499/mo, ₹3,699–4,999/yr, gems from ₹99 (App Store) | Let people price their own real-life rewards | HP damage and "death" for missed days |
| **TickTick** | Not verified | Inbox, lists, calendar, reminders, Pomo timer, habits | Habit streaks. Check-ins only 90 days back (user report) | Not applicable (your own tasks) | ₹269/mo, ₹2,599/yr (App Store). Play ₹123.99–1,390 | Reminders that always fire | Alerts that ignore the user's own settings |
| **Structured** | Build your first day's plan inside onboarding, then soft paywall at about 1:26 | One vertical timeline. Inbox for unscheduled items. Energy cost per task | None found | Not applicable | Pro ₹89–95/mo, ₹279–999/yr, lifetime ₹899–950 (App Store) | Timeline where the current task fills as time passes | Paywall shown before the user has used the app |
| **LinkedIn Games** | Open a game and play. Results page shows streak and connections who played | One new puzzle per game per day, at midnight PT (12:30 pm IST until 1 Nov) | Streaks and streak freezes. Earn rule not on the official page | One fixed puzzle per day | Free | One short puzzle a day, same for everyone | Daily nag pushes after one play, and games used to drive invites |
| **NYT Games** | Open the app and play Wordle. No account needed | Wordle, Connections, Strands and more, one each per day | Connections: solve before local midnight or the streak breaks. Broken streaks can't be restored | One human-made puzzle a day. Done puzzles can't be replayed. Archive doesn't touch streaks | Games ₹179–249/mo (App Store). Play ₹65–12,500 | Archive play that never affects the streak | A streak that snaps at midnight with no repair |

## Five things that cut across all 12

1. **In India the loudest complaint is the ₹1/₹2 trial with UPI Autopay (Seekho, Kuku FM).**
   It shows up in the top reviews with thousands of thumbs-up.
   The Ken (22 May 2025, paywalled) described a user who started a "Rs 1 free trial" on Seekho and later found "Rs 199 had been deducted".
   India's dark-pattern guidelines (notified 30 Nov 2023) list 13 banned patterns. They include "subscription trap", "nagging", "false urgency" and "forced action".
   NANDI is free and takes no payment. Say so on the first screen. It is a real trust gap in this market.
2. **People get angry when the free amount shrinks.**
   Examples: Duolingo Energy (from July 2025), Brilliant's daily keys, NYT moving the Mini and Letter Boxed behind the paywall (August 2025).
   NANDI has no limits to shrink. Never add one later.
3. **People want rest without guilt.**
   Imprint users asked for streak charges because of a "day off from the phone". NYT users lose 147-day streaks.
   Brilliant charges are auto-applied and don't grow the streak.
   NANDI already has a rest-day bank, days away and a 48-hour repair (spec 05 §6). This supports that design.
4. **Losing data kills trust faster than anything else.**
   Finch (account lost on update), Structured (uninstall lost all tasks), Habitica (no offline mode).
   NANDI's backup export is a selling point. Show it early, not only in settings.
5. **Many users want game layers they can switch off.**
   Imprint ("forces you to watch visual indicators of streaks"), NYT ("I don't care about rankings, stats or badges"), Headway ("start three summaries today!!"), Brilliant ("Leagues and streaks are not necessary").
   NANDI should have one "quiet mode" switch that hides the ladder, badges and combo pop-ups but keeps the learning. Check whether the motion toggle covers this. It probably doesn't.

## Per app

Quotes: ★ is the star rating the reviewer gave.

---

### 1. Duolingo

Store: [Google Play IN](https://play.google.com/store/apps/details?id=com.duolingo&hl=en_IN&gl=IN) · [App Store IN](https://apps.apple.com/in/app/duolingo-language-chess/id570060128)
Play: 4.59 from 51.2M ratings, 500M+ installs. Updated 20 Oct 2026.

- **First 2 minutes:** pick a language, say why, pick a level or take a placement test.
  A "quick translation exercise" comes before sign-up. Sign-up prompts appear "after users complete a language lesson"
  ([Appcues teardown](https://goodux.appcues.com/blog/duolingo-user-onboarding), undated).
- **Daily loop:** lessons on a path, a daily XP goal, quests, weekly leagues, streak.
  From 3 July 2025 Energy began replacing Hearts for some free users. "Each lesson uses a little bit of energy" and it "fully recharges in about a day" ([Duolingo blog](https://blog.duolingo.com/duolingo-energy/)).
  I could not confirm whether the rollout reached all users.
- **Streak and rest:** learners can "equip up to two Freezes at a time" ([Duolingo blog, 2022](https://blog.duolingo.com/how-duolingo-streak-builds-habit)).
  Their own numbers: two freezes raised daily active learners by +0.38%. A 7-day streak makes learners "3.6 times more likely to complete their course".
  Freezes cost 200 gems (third-party [guide](https://duolingoguides.com/how-much-is-a-streak-freeze-on-duolingo/), updated 6 Jan 2025, not official).
  A search snippet says that in June 2026 lost streaks of 30+ days could be revived for free with three lessons in a row ([Android Authority](https://www.androidauthority.com/duolingo-revive-broken-streak-event-3673004/)). The page returned 403, so this is not verified.
- **Repetition:** a model of forgetting picks what to review (see `docs/research/competitors.md`). Users still say it repeats easy items.

Praise:
> "Fun, making it quick, easy, and enjoyable to learn" — ★5, 2025-07-14

> "I am learning Spanish and doing better than I did in high school with a teacher. I can work at my own pace." — ★5, 2025-07-02

> "day 2 and I've not only learned some basic words, but recognized many written words." (learning Hindi) — ★5, 2026-09-16

Hate:
> "Even if you get perfect lessons you are still only able to do 2 or 3 lessons per day" — ★1, 2025-09-14

> "Their free trial is extremely predatory. The page will force you to accept a "gift" of "free days," but that will activate the free trial." — ★1, 2025-04-17

> "too much repetition of some easy things, then" you learned 25 new words today." not enough explanation" — ★4, 2025-03-23

**India price:** Super ₹199 / ₹215 a month, ₹1,199 / ₹1,379 / ₹1,749 a year; Family ₹1,799 (App Store IN). Play range ₹19–19,900.
**Copy:** the first lesson comes before any setup question or sign-up. In NANDI, the first drop should start within about 60 seconds of first open, before module picks.
**Never copy:** Energy. It limits learning even when the answer is right. That makes a wrong answer feel like a loss and pushes people to pay.

---

### 2. Seekho

Store: [Google Play IN](https://play.google.com/store/apps/details?id=com.seekho.android&hl=en_IN&gl=IN) · [App Store IN](https://apps.apple.com/in/app/seekho-short-learning-videos/id6670752585)
Play: 4.48 from 1.39M ratings, 100M+ installs.
Company figures (Aug 2026): 100M lifetime downloads, about 4M paying users, retained users watch "28-29 minutes daily", 20,000+ videos in "Hinglish and regional languages" ([Digital Terminal, 25 Aug 2026](https://digitalterminal.in/trending/seekho-app-crosses-100-million-downloads-adds-2175-million-users-in-2025)).

- **First 2 minutes:** reviewers say most content is locked until you start a ₹1 seven-day trial, which needs UPI Autopay. Then ₹199 a month.
  No teardown found ([screensdesign page](https://screensdesign.com/showcase/seekho-short-learning-videos) returned "App Not Found").
- **Daily loop:** short Hindi/Hinglish videos on mobile tricks, online earning, share market, government jobs, English speaking (Play listing). It sells itself as an "Edutainment OTT".
- **Streak and rest:** not verified.
- **Repetition:** a large catalogue. No sign of spaced review.

Praise:
> "Seekho makes learning simple, engaging, and practical. The short video lessons are easy to understand and cover a wide range of useful topics like finance, AI, productivity, and career skills." — ★5, 2026-07-01

> "the lessons are short and practical, so learning doesn't feel boring." — ★4, 2026-06-27

> "It's gives direction to individual for his/her professional journey." — ★5, 2026-07-28

Hate:
> "They promote a ₹1 trial for 7 days, but as soon as you make the payment, the app demands ₹199, which feels misleading." — ★1, 2025-09-13 (12,766 thumbs-up)

> "We can't even watch what kind of videos does this platform has to offer." — ★1, 2025-07-08

> "Every 10-15 seconds there's an ad interrupting the video, and a banner ad is always sitting on the screen" — ★1, 2025-05-01

**India price:** Monthly ₹49 / ₹149, Quarterly ₹399, Annual ₹199 / ₹599, "Three Day Trial Monthly Plan" ₹149 (App Store IN). Play range ₹99–999.
**Copy:** topic choice. Money, jobs, phone skills and spoken English are what Indian adults pay for. A NANDI "Everyday money" or "Sarkari forms" track in plain Hinglish would meet that need.
**Never copy:** a paywall before any content, and a ₹1 trial that sets up autopay.

---

### 3. Kuku FM

Store: [Google Play IN](https://play.google.com/store/apps/details?id=com.vlv.aravali&hl=en_IN&gl=IN) · [App Store IN](https://apps.apple.com/in/app/kuku-fm-audiobooks-stories/id1551919780)
Play: 4.16 from 1.50M ratings, 100M+ installs. Listing claims "10Cr+ Listeners" in 7 languages.

- **First 2 minutes:** "First episodes free" (Play listing). Reviewers describe a ₹1–2 trial that needs autopay before you get further.
- **Daily loop:** serial audio shows and vertical video dramas. "Fresh episodes daily, new shows weekly" (App Store listing). Coins unlock episodes.
- **Streak and rest:** not verified.
- **Repetition:** never-ending serials and cliffhangers. It is a feed by design.

Praise:
> "Episodes are short yet addictive. Cinematic audio experience — Professional narration + sound effects that feel like a movie in your ears." — ★5, 2026-06-14

> "Really like the flow of vertical format dramas. Easy to watch anytime." — ★5, 2026-07-22

> "This app has some of the best content available" — ★4, 2026-05-11

Hate:
> "paid ₹2 for a subscription. Later, when I tried to cancel the auto-pay through PhonePe, I noticed that your app had progressed ₹499 from 19/08/25 without my knowledge." — ★1, 2025-08-11

> "they would force you to opt for autopay before you can get inside the app" — ★1, 2025-08-20

> "Why do I need internet to play a file I’ve already downloaded? It buffers constantly without a connection." — ★4, 2026-05-11

**India price:** Premium Monthly ₹99, Quarterly ₹299 / ₹499 / ₹699, Yearly ₹899, coins "80 coins + 40 coins free" ₹39 (App Store IN). Play range ₹9–16,800.
**Copy:** Indian stories with good narration. NANDI's planned "Tales" (spec 11) could use Indian settings and names the same way, as one finished story with a stop at the end.
**Never copy:** cliffhanger serials, pay-per-episode coins, and "short yet addictive" as the goal. Also note that "offline" downloads that need the internet are a common complaint. NANDI must stay truly offline.

---

### 4. Headway

Store: [Google Play IN](https://play.google.com/store/apps/details?id=com.headway.books&hl=en_IN&gl=IN) · [App Store IN](https://apps.apple.com/in/app/headway-daily-micro-learning/id1457185832)
Play: 4.28 from 176K ratings, 10M+ installs.

- **First 2 minutes:** a long personalisation quiz, then a "Commitment pact" before any price, then a 7-day trial on the yearly plan.
  After the trial starts, a reward chest unlocks a discount offer ([screensdesign teardown](https://screensdesign.com/showcase/headway-daily-micro-learning)).
- **Daily loop:** "Start your day by tapping through a portion of bite-sized ideas" (App Store listing). A 30-day plan, streak, challenges, spaced-repetition flashcards (Play listing).
- **Streak and rest:** a streak exists (listing). Freeze rules not verified.
- **Repetition:** 2,000+ titles. Flashcards bring ideas back.

Praise:
> "Finished my first book summary and immediately purchased the app!" — ★5, 2026-06-14

> "Headway let's you skip the fluff, and get the unfiltered best ideas on the planet in a few minutes a day." — ★5, 2026-04-24

> "The narrator has a very clear and pleasant voice speaking at a speed that makes it easier to follow each sentence" — ★5, 2026-05-18

Hate:
> "Deceptive and predatory onboarding with every screen designed to mislead customer and lure them into paying for extra services." — ★1, 2026-08-22

> "it is not possible to stop auto play , at least no way I can find, and no sleep timer." — ★4, 2026-06-01

> "I'm so disappointed with the voices which sound like robots." — ★1, 2026-06-15

**India price:** many plan items, e.g. ₹699, ₹1,209, ₹1,999, ₹2,799, ₹4,649, ₹5,500, ₹5,900, ₹8,300 (App Store IN). Play range ₹100–29,999.
**Copy:** turn each lesson's key idea into a card that comes back later. NANDI already has spaced review, so the lesson is to show the card as the takeaway at the end of a drop.
**Never copy:** audio that plays the next item with no stop. A reviewer fell asleep while it played "book after book". This is the exact night habit NANDI exists to break.

---

### 5. Imprint

Store: [Google Play IN](https://play.google.com/store/apps/details?id=com.polywise.lucid&hl=en_IN&gl=IN) · [App Store IN](https://apps.apple.com/in/app/imprint-visual-micro-learning/id1482780647)
Play rating count was not shown on the listing I fetched. App Store IN: 4.7 from 379 ratings.

- **First 2 minutes:** a quiz that "drills down into specific sub-topics". Interests become goals. A character walks a path. Then an invite-a-friend guest pass, then the paywall at about 2:25 to unlock your "personalized plan" ([screensdesign teardown](https://screensdesign.com/showcase/imprint-learn-visually)).
- **Daily loop:** "Complete a chapter in two minutes or less" with visuals (listing). In-lesson quizzes. Saved cards become a review deck.
- **Streak and rest:** a miss resets to 0. In 2025 users were asking for freezes (quotes below).
- **Repetition:** catalogue plus saved cards. One user said the home page keeps showing lessons already done.

Praise:
> "the lessons are interactive, it's very easy to use, and also fun." — ★5, 2025-01-09

> "it's small digestible bits that I can easily do on break at work." — ★5, 2025-01-24

> "Great way to learn instead of doom scrolling!" — ★4, 2025-11-07

Hate:
> "requiring users to provide payment information for a “free” trial before offering any access is an immediate turn-off." — ★1, 2025-10-20

> "after ever chapter it forces you to watch visual indicators of streaks and how far you are from reaching rewards." — ★2, 2025-03-27

> "I do regularly have a day off from the phone so, I don't build a streak! This is causing me a conflict of my values" — ★2, 2025-03-12

**India price:** Monthly ₹869, Yearly ₹5,400, "Imprint premium" ₹2,999 (App Store IN). Play range ₹869–9,700.
**Copy:** the picture-first chapter under 2 minutes, which is close to Jenil's "picture first" preference. Also "save this card" from any screen.
**Never copy:** a reward animation after every chapter that the user can't skip. Make NANDI's finish moments skippable and covered by quiet mode.

---

### 6. Brilliant

Store: [Google Play IN](https://play.google.com/store/apps/details?id=org.brilliant.android&hl=en_IN&gl=IN) · [App Store IN](https://apps.apple.com/in/app/brilliant-learn-math-coding/id913335252)
Play: 4.67 from 114K ratings, 5M+ installs.

- **First 2 minutes:** not verified (the screensdesign page returned "App Not Found"). The listing now leads with an AI tutor that "can sketch right on your screen".
- **Daily loop:** interactive problems, streak, leagues. Reviewers say free users get 2 "keys" (lessons) a day, and one says it went up to "3 free keys per day" (2026-06-19).
- **Streak and rest:** "you must complete either 3 problems or a full lesson in a single day" ([help](https://brilliant.org/help/using-brilliant/what-is-a-streak)).
  Streak Charges are earned by completing a concept or practice. "you can hold a maximum of two". A charge is "automatically applied" and "does not count as a day of activity" ([help](https://brilliant.org/help/features/what-is-a-streak-charge/)).
- **Repetition:** one user says "Content cannot be repeated." New courses every month (listing).

Praise:
> "the methods are very engaging and I feel like I'm learning more quickly than I did back in school" — ★5, 2025-05-07

> "it's the questions I get wrong I remember the most because the explanations are always helpful." — ★5, 2026-09-19

> "I feel like if I rush I won't get the answers right so it kinda slows me down and helps me think." — ★5, 2026-04-12

Hate:
> "Two free lessons a day is a lie: you get one real lesson and one three-question review." — ★2, 2026-03-29

> "now they added an awful AI that just talks non stop adding literally nothing to it. it is genuinely dreadful and with no option to turn it off" — ★1, 2026-05-28

> "there is no way to quickly access the explanations of past quizzes" — ★4, 2026-05-31

**India price:** Premium ₹1,199 a month; ₹4,799, ₹5,199, ₹6,000, ₹6,499 a year; with Tutor ₹1,200 / ₹9,799 (App Store IN). Play range ₹840–19,500.
**Copy:** problem first, then an explanation that works best when you got it wrong. Also a "past explanations" list users can reopen, which reviewers ask for.
**Never copy:** a hard daily cap on free learning, and an assistant that can't be turned off.

---

### 7. Finch

Store: [Google Play IN](https://play.google.com/store/apps/details?id=com.finch.finch&hl=en_IN&gl=IN) · [App Store IN](https://apps.apple.com/in/app/finch-self-care-pet/id1528595748)
Play: 4.88 from 634K ratings, 10M+ installs.

- **First 2 minutes:** hatch a pet, name it, pick a trait (the pet reacts), a quiz on large cards, then a soft paywall at about 2:35 with a 7-day trial and a timeline of when billing starts ([screensdesign teardown](https://screensdesign.com/showcase/finch-self-care-pet)).
  A [Pratt critique (Sept 2025)](https://ixd.prattsi.org/2025/09/design-critique-finch-ios-app-2/) says the choices come "all at once".
- **Daily loop:** "Start mornings with quick mood checks and energize your pet to go exploring". "End days in moments of gratitude with your self-care pet where they'll return from adventures to share stories" (Play listing).
- **Streak and rest:** a streak exists. A reviewer mentions a "streak repair". A Finch Team Reddit post describes "App Pause" that keeps the streak (community source, not official). The official help site returned 403.
- **Repetition:** rotating daily quests, adventures and reflection prompts.

Praise:
> "Finch has honestly changed my life, and, unlike a lot of others, is actually free and not super limited." — ★5, 2025-10-08

> "If you have bad days, you're not pressured into completing tasks, but you can vent your frustrations for a reward instead." — ★5, 2025-06-29

> "I have severe inattentive adhd and have never stuck with anything but I've managed a 63 day streak" — ★5, 2026-03-02

Hate:
> "None of my email addresses are working to get my account back so I guess it's just lost forever. Whatever you do, don't do the new upgrade unless you are positive everything is backed up." — ★1, 2025-07-02

> "no dark mode makes it incredibly difficult to log things at night" — ★1, 2026-02-17

> "you can simply just click and say "Yeah, I did this." When you didn't." — ★2, 2026-02-21

**India price:** Finch Plus ₹99, ₹399, ₹699 (monthly offers); ₹3,499, ₹3,599, ₹4,999, ₹5,900 (yearly) (App Store IN). Play range ₹99–24,300.
**Copy:** a "rough day" option. Logging one honest line or a 1-minute breathing step counts as the day's mark. Also the evening return, where something comes back at a fixed time with a short story. It is delayed and fixed, not random.
**Never copy:** progress that lives only behind an account and can be lost. NANDI's export is the answer. Put "Your data stays on this phone. Back it up here." in the first week.

---

### 8. Habitica

Store: [Google Play IN](https://play.google.com/store/apps/details?id=com.habitrpg.android.habitica&hl=en_IN&gl=IN) · [App Store IN](https://apps.apple.com/in/app/habitica-gamified-taskmanager/id994882113)
Play: 4.61 from 76K ratings, 5M+ installs.

- **First 2 minutes:** "Create an avatar then add tasks, chores, or goals" (App Store listing).
- **Daily loop:** Habits, Dailies and To-Dos earn gold and XP. "Missing Dailies causes you to lose HP" ([Habitica FAQ API](https://habitica.com/api/v4/faq?language=en)).
- **Streak and rest:** "If your HP reaches zero, you'll lose one level, that level's stat point, all of your Gold, and a piece of equipment". There is a "Pause Damage" button in Settings (same FAQ).
- **Repetition:** your own tasks. Item drops are chance-based (the FAQ's Perception stat "Increases item drop chance").

Praise:
> "Managing them well is close to two hours of work daily and fifteen different (mostly small) tasks. This app helps that daily work feel less onerous" — ★5, 2025-05-06

> "the custom reward feature is really cool too. locking my irl rewards behind a few coins? Great!" — ★5, 2025-03-28

> "such a good habit tracker, without ads, that I have used it for almost 2 years" — ★5, 2025-12-24

Hate:
> "then you lose all of your gold If you were saving. yeah that sucks to suck. You lose a level … And is extremely discouraging." — ★1, 2026-02-27

> "Broke yet again..., an offline mode is needed. A TODO list you can't use at any point is worthless" — ★1, 2026-02-07

> "Unfinished tasks also do a ton of damage compared to the rewards when you complete them" — ★1, 2026-04-03

**India price:** 1 month ₹389 / ₹499, 3 months ₹1,499, 6 months ₹2,299, 12 months ₹3,699 / ₹4,999; gems ₹99–1,999 (App Store IN). Play range ₹30–4,050.
**Copy:** custom real-life rewards. The user names a treat (chai out, a film) and sets its Shard price. It is fixed and chosen by the user, not random.
**Never copy:** HP loss and "death" that takes away level and savings. This breaks NANDI's rule that XP, level and Shards never go down. Also no random drops.

---

### 9. TickTick

Store: [Google Play IN](https://play.google.com/store/apps/details?id=com.ticktick.task&hl=en_IN&gl=IN) · [App Store IN](https://apps.apple.com/in/app/ticktick-to-do-list-calendar/id626144601)
Play: 4.61 from 166K ratings, 10M+ installs.

- **First 2 minutes:** not verified.
- **Daily loop:** inbox, lists, calendar views, reminders, Pomo timer, habit check-ins (App Store listing).
- **Streak and rest:** habit streaks. One user says you can't check in more than 90 days back.
- **Repetition:** not applicable. It is the user's own list.

Praise:
> "TickTick is the best. It never misses a reminder, others often do." — ★5, 2026-10-10

> "The free version offers everything I need, including reminders, recurring tasks, subtasks, labels, habits, and due dates." — ★5, 2026-07-28

> "It's completely replaced my hand written weekly to-do." — ★5, 2026-05-12

Hate:
> "WARNING TO LIGHT SLEEPERS … my phone vibrates exactly three times WAKING ME UP every day at 9AM despite not having an alarm" — ★1, 2026-04-13

> "No option for a cheaper local device only use, instead wants to push a subscription" — ★2, 2025-03-28

> "the jump from 35.99 to 49.99 has crossed the border for me" — ★2, 2026-10-16

**India price:** Premium ₹269 a month, ₹2,599 a year (App Store IN). Play range ₹123.99–1,390.
**Copy:** reliability. People stay because reminders fire. NANDI's Notifier needs a device test on Nothing OS for each channel, including after a reboot.
**Never copy:** any vibration or alert that ignores the user's settings, and anything that buzzes in sleep hours.

---

### 10. Structured

Store: [Google Play IN](https://play.google.com/store/apps/details?id=io.unorderly.structured&hl=en_IN&gl=IN) · [App Store IN](https://apps.apple.com/in/app/id1499198946)
Play: 4.54 from 32K ratings.

- **First 2 minutes:** users build their first day's plan inside onboarding. Then a soft paywall at about 1:26 with a 3-day trial on the yearly plan ([screensdesign teardown](https://screensdesign.com/showcase/structured-daily-planner)).
- **Daily loop:** a vertical timeline, an inbox for unscheduled items, an energy value per task (Play listing: "Energy-based planning").
- **Streak and rest:** none found.
- **Repetition:** not applicable.

Praise:
> "it shows the time remaining for tasks and the bubbles fill in as time passes. The energy feature and task suggestions are useful." — ★4, 2025-01-17

> "whenever I enter the app I'm NEVER pressured to get premium." — ★5, 2026-07-22

> "planning my tasks and rest breaks helps with fatigue and cognitive dysfunction" — ★5, 2025-08-06

Hate:
> "Notifications don't work … While trying to fix this issue I uninstalled the app and in the process lost all of my tasks." — ★1, 2025-03-18

> "If something takes longer than expected you have to reschedule everything after it one by one." — ★4, 2025-01-17

> "you have to pay for tasks to display more times than when you add them." — ★2, 2026-03-08

**India price:** Pro ₹89 / ₹95 a month, ₹279 / ₹299 / ₹999 a year, lifetime ₹899 / ₹950 (App Store IN). Play range ₹24.99–899.
**Copy:** the current task fills as time passes, and onboarding builds tomorrow's plan. Also fix their gap: when a block overruns, offer one "shift the rest later" action.
**Never copy:** a paywall inside onboarding, before the user has used the app once.

---

### 11. LinkedIn Games (Queens, Zip and others)

Store: [Google Play IN](https://play.google.com/store/apps/details?id=com.linkedin.android&hl=en_IN&gl=IN) · [App Store IN](https://apps.apple.com/in/app/linkedin-community-career/id288429040)
Games live inside the LinkedIn app. Only 22 of 3,600 recent reviews mention them, so the quotes are thin.

- **First 2 minutes:** open a game and play. Streaks show "on the game's launch page and the results page" ([LinkedIn Help](https://www.linkedin.com/help/linkedin/answer/a6863543)).
- **Daily loop:** "New puzzles are released daily at midnight Pacific Time (PT)" (same page). In India that is 12:30 pm IST until 1 Nov 2026, then 1:30 pm IST.
  LinkedIn said "84% of players returning the next day and 80% still playing a week later" ([Social Media Today, 18 Mar 2025](https://www.socialmediatoday.com/news/linkedin-adds-zip-puzzle-game/742847/)).
- **Streak and rest:** streaks "can now be frozen" (same article). The official help page does not say how freezes are earned. A third-party blog says one freeze per five wins, up to two. Not verified.
- **Repetition:** one fixed puzzle per game per day, the same for everyone.

Praise:
> "i like to play daily puzzles. If i got boring while exploring." — ★5, 2026-09-10

> "One of my most used apps for the posts and the puzzles." — ★5, 2026-09-20

> "I enjoy the games and my feed isn't just about work work work" — ★5, 2026-09-03

Hate:
> "I played it ONCE and every day for the last 4 days since it has been reminding me and using duolingo esque streak freezes to try and get me to play zip" — ★2, 2026-09-14

> "new app features, like the quality games, are bogged down with rewards exclusively for spamming connections with invites." — ★4, 2025-06-08

> "games & premium advertising everywhere, this is just funny!" — ★1, 2026-08-23

**India price:** games are free. LinkedIn Premium Career ₹999–1,899 (App Store IN).
**Copy:** one small daily puzzle, the same for everyone, that takes a minute or two, plus a result you can share without spoilers. NANDI's Mind boards already use a date seed. Add a share card that shows a grid of times or moves, not the answer.
**Never copy:** daily reminders and streak freezes aimed at someone who played once, and game rewards tied to inviting people.

---

### 12. NYT Games

Store: [Google Play IN](https://play.google.com/store/apps/details?id=com.nytimes.crossword&hl=en_IN&gl=IN) · [App Store IN](https://apps.apple.com/in/app/nyt-games-wordle-crossword/id307569751)
Play: 4.78 from 149K ratings, 10M+ installs.

- **First 2 minutes:** "Free to download, the app offers new puzzles daily" (listing). Wordle plays without an account.
- **Daily loop:** Wordle, Connections, Strands, Spelling Bee, Pips, Mini, Midi and the Crossword, one each per day. The Crossword "increase[s] in difficulty throughout the week" (listing).
- **Streak and rest (Connections):** "Puzzles must be solved before midnight local time". "Connections streaks cannot be reset once they are broken." Archive play doesn't affect streaks. "Completed Connections puzzles cannot be replayed." ([NYT Help](https://thenewyorktimeshelpcenter.helpjuice.com/28525912587924-Connections)).
- **Repetition:** one human-made puzzle a day. No replays. A difficulty curve across the week.

Praise:
> "we team up together for Strands … and we finish the round with Connections which is our most absolute favorite!" — ★5, 2026-07-18

> "I LOVE not having the annoying ads and other nonsense that comes with other games." — ★5, 2026-09-02

> "Connections and Wordle keep me coming back every day." — ★5, 2026-07-04

Hate:
> "As of this week both the Mini crossword and Letter Boxed are suddenly paywalled." — ★1, 2025-08-28

> "I just want to relax with a puzzle without the anxiety of having to beat a time, breaking a streak, or earning a badge." — ★2, 2026-06-20

> "I honestly wish I didn't lose my streak if I've missed doing it in the 24h window." — ★4, 2026-07-01

**India price:** Games Monthly ₹179, ₹199, ₹249 (App Store IN). Play range ₹65–12,500.
**Copy:** past puzzles never touch the streak, a finished puzzle can't be replayed (so there is nothing to grind), and difficulty follows the weekday. NANDI's weekday table already does the last one.
**Never copy:** a streak that breaks at midnight with no repair, and timers or badges that can't be hidden.

---

## What this means for NANDI (ranked)

| # | Action | Why (from above) | Already in NANDI? |
|---|---|---|---|
| 1 | First screen says "Free. No sign-up. Works offline. Your data stays on this phone." | The ₹1 autopay trap is the top complaint in Indian learning apps. Data loss is the top trust breaker | Partly. Offline and no account, yes. The message isn't on the first screen |
| 2 | First drop starts within ~60 s, before module picks or settings | Duolingo's lesson-first flow. Headway, Imprint and Finch spend about 2.5 min on quizzes before paywalls | Check onboarding (spec 10 asks "Pick up to 4 things" first) |
| 3 | One "quiet mode" switch hides ladder, badges, combos and finish animations | Imprint, NYT, Headway and Brilliant users ask for an off switch | Not found in specs |
| 4 | A "rough day" mark: one honest line or a 1-minute breath counts for the day | Finch's most-praised feature. It fits rest without guilt | Rest bank exists. A low-effort counted action not found |
| 5 | A "past explanations" list and a save-card button in drops | Brilliant and Imprint reviews | Spaced review exists. Reopening explanations not found |
| 6 | "Shift the rest later" when a task overruns | Structured's top complaint | Check spec 02 |
| 7 | A share card for the daily Mind board (moves or time, no answer) | LinkedIn and NYT social pull, without a feed | Not found |
| 8 | Device test that every notification channel fires after a reboot, and nothing buzzes in lights-out | TickTick's praise (reliable) and hate (woke a sleeper) | Notification budget exists (spec 05 §10). Device test not confirmed |

## Sources opened

Store pages (all opened 2026-10-22): the Google Play and App Store India links in each section above.

Other pages:
- Duolingo blog, Energy (3 Jul 2025): https://blog.duolingo.com/duolingo-energy/
- Duolingo blog, streaks (31 Jan 2022): https://blog.duolingo.com/how-duolingo-streak-builds-habit
- Android Authority, streak revive event (2026; returned 403, snippet only): https://www.androidauthority.com/duolingo-revive-broken-streak-event-3673004/
- Duolingo freeze price (third-party guide): https://duolingoguides.com/how-much-is-a-streak-freeze-on-duolingo/
- Appcues, Duolingo onboarding: https://goodux.appcues.com/blog/duolingo-user-onboarding
- Digital Terminal, Seekho 100M downloads (25 Aug 2026): https://digitalterminal.in/trending/seekho-app-crosses-100-million-downloads-adds-2175-million-users-in-2025
- The Ken, UPI Autopay dark patterns (22 May 2025, paywalled; summary only): https://the-ken.com/kaching/dark-patterns-shadow-upi-autopays-ascent/
- Mondaq, India's 13 dark patterns (20 Dec 2023): https://www.mondaq.com/india/consumer-trading-unfair-trading/1402846/protection-from-dark-patters-guidelines-to-regulate-the-unregulated
- screensdesign teardowns (no dates on page): Headway https://screensdesign.com/showcase/headway-daily-micro-learning · Imprint https://screensdesign.com/showcase/imprint-learn-visually · Finch https://screensdesign.com/showcase/finch-self-care-pet · Structured https://screensdesign.com/showcase/structured-daily-planner
- Pratt IXD, Finch critique (16 Sep 2025): https://ixd.prattsi.org/2025/09/design-critique-finch-ios-app-2/
- Brilliant help, streak: https://brilliant.org/help/using-brilliant/what-is-a-streak · Streak Charge: https://brilliant.org/help/features/what-is-a-streak-charge/
- Habitica FAQ (public API): https://habitica.com/api/v4/faq?language=en
- LinkedIn Help, Games: https://www.linkedin.com/help/linkedin/answer/a6863543
- Social Media Today, LinkedIn Zip and freezes (18 Mar 2025): https://www.socialmediatoday.com/news/linkedin-adds-zip-puzzle-game/742847/
- NYT Help, Connections: https://thenewyorktimeshelpcenter.helpjuice.com/28525912587924-Connections

Could not open: Android Authority (403), Finch help centre (403), Habitica wiki (402), JSA dark-pattern note (403), screensdesign pages for Brilliant and Seekho ("App Not Found").
