# Hindi and Hinglish: what to build, and what it costs

Cloud job 10, batch 2. Written 22 Oct 2026.
Code base: `origin/ship-27` at `b17ec403a85f871b4cb315a5d6da4d2676409767`.
Nothing in the app or content changed. Scripts lived in `/tmp/cj2/job10-tools/`, and their key code is at the end.

## Answer first

- **Recommend (a): Hinglish (Hindi in Roman script) for short "voice" copy only.** Make it an opt-in setting with English as the default. Leave the Learn content in English.
- Measured: the app has **no i18n layer**. Every string is hard-coded English. There are **~1,650 unique strings in `src/ui`** and **~410 more in `src/core`**, plus **76,491 words of content JSON**.
- (a) costs about **4–5 dev days**. (b) Full Hindi UI costs **3–4 dev weeks**. (c) Hindi Learn content costs **₹1.5–4.6 lakh** if paid, or **50–75 reviewer hours**, and doubles every content edit after that. All three costs are estimates.
- The evidence on what Indian 18–25s want leans **English or Roman-script Hinglish, not Devanagari Hindi**, for app interfaces. The data is thin and mostly old. See the sources.
- Kill test (below): run 2–4 weeks with 8–12 testers aged 18–25. Measure from the ledger on the phone, with nothing sent anywhere. Remove the setting if fewer than 25% still have it on at day 14.
- 10 Hinglish kind-word lines are at the end, each checked for gender agreement and length.

---

## 1. What the research says

Sources are quoted as they read. "Could not open" means I could not open the page.

| # | Source (year) | What it says | Weight for NANDI |
|---|---|---|---|
| 1 | IAMAI–Kantar, *Internet in India 2024* (ICUBE 2024), p.13. PDF: https://www.iamai.in/sites/default/files/research/Kantar_%20IAMAI%20report_2024_.pdf | "There are 870 Million internet users (98% of internet users) who have accessed internet in Indic languages in 2024; 57% of internet users mention that they prefer accessing internet content in Indic languages in Urban India." The pie on the same page gives **43% English**, and Hindi is the largest Indic slice (24% as I read the chart; the label positions in the extracted text are unclear). Top Indic-language activities: "Watching videos 81%", "Listening to music 69%", "Online Search 19%". | Strong and recent, but it measures **content consumption** (video, music). It does not measure the language of an app's interface. No age split. |
| 2 | Axis My India, *India Consumer Sentiment Index*, via afaqs (1 Dec 2021): https://www.afaqs.com/news/media/more-indians-preferring-indian-languages-online-over-english-axis-my-india-survey | "the majority of the youngsters (60%) amongst 18-25 prefer digital interactions in English". Overall: "A combined 27%" prefer apps and websites in Hindi or a regional language, and "24% preferred English". | **The only age-split figure I found for 18–25 and the app interface.** It is old, from press coverage only, and gives no sample size. |
| 3 | PayNearby MSME Digital Index 2025, via CXOToday (25 Jun 2025): https://cxotoday.com/media-coverage/73-msmes-report-business-growth-via-digital-adoption-led-by-upi-and-smartphones-paynearby-survey/ | "56% of respondents prefer English for understanding and navigating platforms, followed by Hindi at 25%." n = 10,000 individuals and MSMEs. | Recent and about navigation language, but the sample is shopkeepers, not students. |
| 4 | Milestone Localization Hinglish survey (fieldwork Sep–Oct 2020), guide: https://www.milestoneloc.com/guide-to-hinglish-language/ ; summary: https://www.milestoneloc.com/hinglish-report-pr/ | Gen Z (15–24): "A whopping 75% of Gen Z respondents preferred Latin script". 8% preferred Devanagari and 17% liked both equally. 37% of Gen Z "mix up Hindi and English sometimes", and 25% never mix. All ages: "Nearly 58% … prefer reading Hindi in Latin script", 13% find Devanagari easier, and 83% mix the two in everyday speech. n = 744, with Gen Z at 19.6% (about 146 people). | The best evidence on **script**. It is a small online vendor survey with an English questionnaire, and the page itself says it covers urban and semi-urban smartphone users. |
| 5 | Duolingo blog, "Language learning for the next billion" (24 Sep 2020): https://blog.duolingo.com/language-learning-for-the-next-billion-duolingo-in-india/ | "over 95% of English learners in India had mobile phones set to English." Their Hindi UI used accurate but uncommon words. Swapping some of them for English words in Roman script ("language", "level"), because "Hindi speakers tend to use a lot of English words", raised onboarding completion by 1%. | **Direct product evidence that Hinglish beats formal Hindi in a UI.** The effect was small (+1%). |
| 6 | Duolingo's 28 Indian-interface courses (Hindi, Bengali, Tamil, Telugu UIs), May 2025. Impact article: https://www.impactonnet.com/more-from-impact/duolingo-expands-with-indian-languages-to-teach-global-tongues-across-bharat-10521.html | **Could not open (HTTP 403).** Search snippets say the courses are aimed at learners outside the metros. I am not quoting them. | Shows that a large app is investing in Indic interfaces for non-metro users. Unverified here. |
| 7 | Duolingo "148 new courses" (KTVU, 1 May 2025): https://www.ktvu.com/news/duolingo-148-courses-ai . The investor release https://investors.duolingo.com/news-releases/news-release-details/duolingo-launches-148-new-language-courses **could not be opened (403)**. | von Ahn: "Developing our first 100 courses took about 12 years". Becker: "It used to take a small team years to build a single new course from scratch". | AI drafts plus human review cut translation cost a lot. Review is still the expensive part. |
| 8 | Google Pay Hinglish, TechCrunch (17 Nov 2021): https://techcrunch.com/2021/11/17/google-pay-to-add-hinglish-support-in-india-enable-merchants-to-create-digital-storefronts/ ; Inc42 (4 Jun 2022): https://inc42.com/?p=292927 | Hinglish is "spoken by over 350 million people in India" (TechCrunch). In the UI, "Add your bank account" becomes "Apna bank account add karein" and "Pay to your contacts" becomes "Contacts ko pay karein" (Inc42). Users switch to it under Settings → Personal Info → Language. | **A precedent for Hinglish as an opt-in UI language** in a mass-market Indian app. |
| 9 | Seekho, Digital Terminal (25 Aug 2026): https://digitalterminal.in/trending/seekho-app-crosses-100-million-downloads-adds-2175-million-users-in-2025 ; Inc42 (3 Sep 2025): https://inc42.com/buzz/seekho-bags-28-mn-led-by-bessemer-venture-partners-others | Content is "in Hinglish and regional languages". 100 million lifetime downloads, 21.75 million users added in 2025, 4 million paid subscribers. "English Speaking and Part-Time Income emerged as Seekho's largest categories." Inc42: "2.5 Cr monthly active visitors" (company claim). | The closest analogue (short learning for young Indians) chose Hinglish. Its biggest category is **learning English**. |
| 10 | ASER 2023 *Beyond Basics* (rural, ages 14–18). PDF: https://asercentre.org/wp-content/uploads/2022/12/ASER-2023-Main-Findings_Final-22.2.24-1.pdf | "57.3% of all youth can at least read English sentences. Of those who can read, 73.5% can understand the meaning of the sentence". | So **about 42% of rural 14–18s** (0.573 × 0.735) can read and understand a simple English sentence. An English-only app leaves out most rural youth. |
| 11 | KPMG–Google, *Indian Languages – Defining India's Internet* (Apr 2017): https://assets.kpmg.com/content/dam/kpmg/in/pdf/2017/04/Indian-languages-Defining-Indias-Internet.pdf | p.2: the Indian-language user base grew "to reach 234 million users" by 2016, more than English. p.10: "68% Internet users consider local language digital content to be more reliable than English". p.11: "88% of Indian language internet users are more likely to respond to a digital advertisement in their local language". | Foundational but **9 years old**, and about ads and content, not UI. Its "Indian language users" are defined as people who "prefer their primary language over English" (p.7), which makes the argument circular for our question. |
| 12 | FRND Safe Space Survey, ThePrint (11 Aug 2026): https://theprint.in/feature/indian-social-media-users-voice-messaging-frnd-survey/3011813/ | "About 78 per cent of respondents said they express themselves much better in their mother tongue." n = 12,666 FRND app users, collected by in-app pop-up. | About **self-expression**, which matters for the kind-word card a person sends a friend. Users of one app only. |
| 13 | ShareChat / Moj | I found no primary source with a language split. Search returned only Wikipedia and directories with undated MAU claims. **Not used.** | — |
| 14 | Google/Kantar Gen Z India page (Jun 2025): https://business.google.com/in/think/consumer-insights/gen-z-trends-search-behaviour-india/ | Opened. **It has no language findings**, even though `docs/research/making-it-cool.md` cites it for "locally relevant language". | That citation in the repo should be checked. |

**Reading of the evidence.**
- Young urban Indians mostly use **English** for app interfaces (60% in source 2). When they want Hindi, they want it **in Roman script** (75% vs 8% in source 4).
- They mix English words in freely (sources 4 and 5).
- Devanagari Hindi matters for rural, older and lower-English users (sources 1, 10 and 11). That is not NANDI's first audience, but it is a real ceiling.
- No source measured "Hinglish UI in a self-improvement app for 18–25s". That gap is why the recommendation comes with a kill test.

## 2. What the code base has today (measured)

| Check | Result |
|---|---|
| i18n library or layer | **None.** No `i18n`, `useTranslation`, message catalogue or language setting in `src/`. `package.json` has no i18n dependency. |
| Where strings live | Inline in JSX and TS: `src/ui/**` and copy modules in `src/core/**` (e.g. `src/core/soft/soft.ts:12-36`, `src/ui/shell/finish.ts`, `src/core/economy/gamify.ts`). |
| Document language | `index.html:2` → `<html lang="en">`. |
| Fonts | Latin subsets only: `src/ui/theme.css:1-3` imports `bricolage-grotesque/latin-800.css` and `dm-sans/latin-400/600.css`. Devanagari would fall back to the phone's system font. |
| Devanagari characters in `src/`, `content/` or `public/` | **0.** The Gita and Charaka verses are in IAST/Roman, e.g. `content/lessons/lessons.gita-restless-mind.json:1443-1444`. |
| Date and number formatting | 19 `toLocale*`/`Intl` call sites. 7 hard-code an English locale, e.g. `src/ui/screens/EconomyScreens.tsx:62` (`en-GB`), `src/ui/screens/Backup.tsx:123` (`en-GB`), `src/core/time/formatDayKey.ts:6` (`en-GB`), `src/core/courtyard/storybook.ts:55,69` (`en-GB`), `src/core/recap.ts:65` (`en`), `src/core/tasks/plannerCopy.ts:10` (`en`). |
| Plural handling | 28 inline English plural ternaries (`=== 1 ? 'x' : 'xs'`), e.g. `src/ui/learn/LearnDrop.tsx:238`. |
| Copy built from templates | 156 template strings with variables in `src/ui` and 122 in `src/core`. English word order is baked in. The same holds for JSX copy around variables, e.g. `{n} XP to level {m}` at `src/ui/screens/EconomyScreens.tsx:70`. |
| Content packs | No `lang` field in any pack. One English pack per topic. |
| Tests tied to English copy | 1,056 `getByText/Role/Label/Placeholder` calls and 204 `toHaveText/toContainText` in `tests/e2e/` (48 files). These keep passing if English stays the default. |
| Share cards drawn on canvas | `src/ui/soft/kindCard.ts:44-47` draws the line in `700 64px "Bricolage Grotesque"`, wrapped at 860 px, up to 4 lines. Roman Hinglish renders fine. Devanagari would fall back to the system font. |

### String counts (TypeScript AST scan, script at the end)

| Area | Strings | Unique | Unique words | Notes |
|---|---:|---:|---:|---|
| `src/ui` (77 files) | 2,108 | **1,649** | **6,135** | 1,194 unique strings are ≤4 words, 409 are 5–12 words and 46 are >12 words. |
| `src/core` copy (62 files) | 694 | 545 | 2,445 | About 25% are false positives (date templates, a licence name). **About 410 real, about 1,830 words.** |
| `src/platform` | 26 | 23 | 69 | Notification and share text. |
| **UI total** | | **≈2,080** | **≈8,000** | Measured, with the core numbers corrected by a sampled false-positive rate. |

Precision check: I hand-read a random 40 of the `src/ui` hits and found 40 that are shown to the user (counting aria-labels, which screen readers speak). In a random 20 from `src/core`, 15 were user-facing.

`src/ui` JSX text by element (unique strings / words): paragraphs 306 / 1,748, buttons and links 207 / 468, labels 149 / 339, headings 139 / 355, spans and other 100 / 266.

Top `src/ui` files by string count: `screens/Planner.tsx` 157, `train/Dashboard.tsx` 112, `screens/Mind.tsx` 91, `learn/LearnDrop.tsx` 87, `screens/EconomyScreens.tsx` 67.

"Voice" surfaces, where a Hinglish tone would show most (strings / unique words):

| File | Strings | Words |
|---|---:|---:|
| `src/ui/soft/SoftDay.tsx` | 54 | 272 |
| `src/ui/shell/finish.ts` | 48 | 222 |
| `src/core/economy/gamify.ts` | 35 | 111 |
| `src/ui/shell/EconomyFeedback.tsx` | 21 | 64 |
| `src/core/nightPause.ts` | 15 | 73 |
| `src/core/soft/soft.ts` | 14 | 73 |
| `src/core/tasks/plannerCopy.ts` | 14 | 47 |
| `src/core/welcome.ts` | 11 | 34 |
| `src/core/nightPlan.ts` | 7 | 32 |
| **Total** | **219** | **≈930** |

### Content JSON (measured)

Total: **76,491 words in 7,427 strings.** I excluded ids, enum-like tokens and URLs, and I did not count the `.md` editorial and fact-check notes.

| Pack | Words |
|---|---:|
| `topics/topic.psychology.json` | 16,457 |
| `lessons/lessons.gita-restless-mind.json` | 10,172 |
| `topics/topic.money-markets.json` | 8,829 |
| `topics/topic.how-things-work.json` | 7,913 |
| `lessons/lessons.charaka-holds-up.json` | 6,722 |
| `topics/topic.body-training.json` | 6,305 |
| `topics/topic.history-civilisations.json` | 5,857 |
| `topics/topic.health-nutrition.json` | 5,758 |
| `deck/deck.greene.json` | 5,022 |
| 4 mystery arcs | 2,235 |
| `tracks/track.drone-tech.json` | 766 |
| `quests/quests.core.json` | 297 |
| `winddown/winddown.core.json` | 158 |

By field: `feedback` 23,774 words, `text` 10,896, `stem` 7,971. Answer feedback is the largest single cost.

Churn, from the visible history only (the clone is shallow and starts 17 Oct 2026): `content/` had 29 commits with +34,109 / −2,014 JSON lines in 5 days, and `src/ui` had 89 commits with +9,920 / −564 lines. Anything translated now would go stale within days.

## 3. Cost of each option

Rates: PIB Chandigarh's empanelment rate for "Online Translator (Translation from English to Hindi)" is "Rs.1.25/- per word", in force "with effect form 01/12/2023". Source: https://static.pib.gov.in/WriteReadData/specificdocs/documents/2024/jul/doc2024715349701.pdf . That is a government floor. Freelance profiles on ProZ that search results showed at ₹3–6.5 per word **could not be opened (403)**. I use **₹2–6 per word** as an **estimate** band. Dev-day figures are my estimates.

| | (a) Hinglish, short voice copy | (b) Full Hindi UI (Devanagari) | (c) Hindi Learn content |
|---|---|---|---|
| Scope | About 430 strings, about 1,400 words: the 219 voice strings, 207 button and link labels, and tab names. | About 2,080 strings, about 8,000 words, plus 278 templates and 28 plurals. | 76,491 words (51,119 in topics alone). |
| Engineering | A tiny typed dictionary (`en`, `hi-Latn`) with `t(key)` that falls back to English per key, and a `settings` row `lang` (a natural key, so it is backed up). No new dependency. About 1 day for the layer, 1.5–2 days to extract strings, and 0.5–1 day of tests. | Extract every string (6–8 days). Rework templates for Hindi word order and second-person gender ("aap thak gaye/gayi"). Pass the locale to 19 date call sites. Set `html lang`. Add a Devanagari font or accept the system fallback in headings and on 3 canvas cards. Re-shoot every screen at 390/360 × light/dark. **About 3–4 weeks.** | A `lang` field in the pack schema and parallel packs with the same ids. A validator that checks parity (same ids, option count and correct option). Per-language `build-packs` output and pack-store selection. **About 1–2 weeks.** |
| Words to write | ₹0 cash: Claude drafts, Jenil plus 3 friends review (about 2 h each). About ₹2.8k–8.4k if paid. | ₹16k–48k paid, or about 6–10 h of native review on Claude drafts. | **₹1.5–4.6 lakh** paid. With Claude drafts, careful review runs at about 1,000–1,500 words/h, so **50–75 reviewer hours**. Health and money items also need a subject check: no medical claims, keep the evidence grades. |
| Ongoing cost | Low. A new voice line without a Hinglish entry falls back to English, which reads as natural Hinglish anyway. | High. Every UI change ships twice, and UI churn is about 18 commits a day right now. | Very high. Every content and fact-check edit has to be repeated. The fact-check notes (`content/topics/fact-check-*.md`, about 210–220 KB each) are English only. |
| Risks | Spelling drift in Roman Hindi (nahi/nahin), cringe tone, gendered verbs. | Formal Hindi feels stiff: Duolingo had to put English words back in (source 5). Font weight and brand look break in headings. | Mistranslated health or money facts, which is the worst failure for this app. Sanskrit terms need care. |
| Who it reaches | Urban and semi-urban 18–25s who already read English and like Hinglish (sources 2, 4, 8, 9). | Hindi-first and rural users (sources 1, 10). | Users who cannot learn in English. This matters only once (b) exists. |

## 4. Recommendation: (a), behind an opt-in setting

Why:
1. It fits the evidence for this age group: an English base, Roman-script Hindi and free mixing (sources 2, 4, 5, 8, 9).
2. It touches the copy that carries feeling: soft days, finish lines, kind words, toasts. Learning content stays in English, and English itself is something this audience wants to learn (Seekho's top category; Duolingo's top course in India).
3. It needs about a quarter to a third of (b)'s dev time. It has about 18% of (b)'s words and under 2% of (c)'s (1,400 vs 8,000 vs 76,491). It adds almost no ongoing cost.
4. It does not close off (b) or (c). The `t()` layer and `lang` setting are the same foundation.

How:
- Put **You → Settings → Language: English · Hinglish (beta)**, defaulting to English. It is asked nowhere else and never nags.
- Keep "XP", "Shards", "level", "streak", "task" and character names untouched. They are already Hinglish.
- Write a short style sheet:
  - Use **tum** (friendly, not "tu", not formal "aap").
  - Use gender-neutral constructions. The verb should agree with a noun, not with the person: "yaad aayi", "din halka rahe", "main yahin hoon".
  - Use one Roman spelling per word (nahi, hai, toh, jayega, thoda).
  - No "yaar", "bhai", "beta" or "didi".
  - No religious words.
  - No "you should" (repo rule).
- A unit test checks that every `hi-Latn` key exists in `en`. Add one e2e smoke (Plan → soft day → finish) with Hinglish on, at 360×800 in light and dark.
- When a Hinglish kind word is sent, the soft fact for `kind-word` records `inputs.lang` (`'en'`, `'hi-Latn'` or `'own'`). It never stores the text, so nothing new about the person is kept. The field is optional, needs no migration, and goes into backup as usual.
- Smallest first step, if even 5 days is too much: put 3 Hinglish lines straight into `KIND_WORDS` (`src/core/soft/soft.ts:30`) and see whether they get picked. That needs no layer at all.

### Kill test

Run it for 2–4 weeks with 8–12 testers aged 18–25, at least half from Hindi-belt states. All numbers come from the phone: two owner-panel rows in the style of the existing soft-day kill test (`src/ui/screens/OwnerPanel.tsx:72-75`). Testers share them only if they choose, by screenshot or exported summary.

| Measure (from settings and soft facts) | Keep | Kill |
|---|---|---|
| Testers who turned Hinglish on and still have it on at day 14 | ≥ 40% | < 25% |
| Kind words sent while in Hinglish mode that use a Hinglish starter line | ≥ 1 in 3 | < 1 in 5 |
| Testers who call it "forced", "cringe" or "wrong" in a one-question exit chat | ≤ 1 of 10 | ≥ 3 of 10 |
| Any line flagged as gendered, religious or guilt-inducing | Fix the line and keep going | — |

Between the thresholds: keep (a) as it is, and do not start (b) or (c).

On a kill: remove the setting. The 2–3 best Hinglish lines may stay in `KIND_WORDS` as ordinary choices.

Starting (b) is worth a look only if: (a) passes, **and** at least 2 testers say they would rather read the whole app in Devanagari.

## 5. Kind-word card: 10 Hinglish candidates

Constraints:
- Warm and short, with no guilt.
- No religious words and no gendered agreement with the sender or the receiver.
- Fit the card: the longest English line is 52 characters, and every Hinglish line here is 52 or fewer.
- No banned words (checked against `scripts/banned-words.ts`).

The lines use "tum" because they go to friends.

Existing English lines (`src/core/soft/soft.ts:30-36`):

| # | English (existing) | Hinglish counterpart | Chars | Why it is gender-neutral |
|---|---|---|---:|---|
| 1 | Thinking of you today. | **Aaj tumhari yaad aayi. Bas itna kehna tha.** | 42 | "aayi" agrees with *yaad*; "kehna tha" is impersonal. |
| 2 | Hope today is gentle with you. | **Umeed hai aaj ka din tumhare liye halka rahe.** | 45 | "rahe" agrees with *din*. |
| 3 | No reply needed. Just sending a little warmth. | **Reply ki zaroorat nahi. Bas thodi si warmth bhej di.** | 52 | "bhej di" agrees with *warmth* (used as feminine), not with the sender. |
| 4 | You make things better. Just saying. | **Tum ho toh sab thoda behtar lagta hai. Bas yunhi.** | 49 | "lagta hai" agrees with *sab*; "tum ho" has no gender. |
| 5 | Drink some water and take a breath. You've got this. | **Thoda paani pi lo, ek lambi saans lo. Ho jayega.** | 48 | Imperatives and an impersonal "ho jayega". |

Five new lines:

| # | Hinglish | English gloss | Chars | Why it is gender-neutral |
|---|---|---|---:|---|
| 6 | **Tumhare baare mein socha, toh smile aa gayi.** | Thought of you and smiled. | 44 | "socha" (ergative, agrees with nothing); "aa gayi" agrees with *smile*. |
| 7 | **Koi jaldi nahi. Apna time lo, main yahin hoon.** | No rush. Take your time, I'm right here. | 46 | "hoon" has no gender. |
| 8 | **Jo bhi chal raha ho, ek chai break banta hai.** | Whatever's going on, you've earned a chai break. | 44 | "chal raha ho" agrees with *jo bhi*; "banta hai" is impersonal. |
| 9 | **Kuch bhi ho, bas ek message door hoon.** | Whatever happens, I'm one message away. | 38 | "hoon" has no gender. |
| 10 | **Chhoti si baat: tumse din better ho jaata hai.** | Small thing: you make the day better. | 46 | "ho jaata hai" agrees with *din*. |

Rejected while drafting:
- "tum bahut acche ho": *acche/acchi* agrees with the receiver's gender.
- "tum akele nahi ho": same problem with *akele/akeli*.
- "main soch raha tha": the verb marks the sender's gender.
- Anything with "Bhagwan", "Rab" or "God bless".
- "Kab se baat nahi hui": it carries guilt.

UI note: show **5 lines in the chosen language**, not all 10 mixed. The radiogroup (`src/ui/soft/SoftDay.tsx:94`) already holds 5 buttons. Pick the 5 after the testers' review.

Check before shipping:
- Draw each line on the real canvas (`kindCard.ts`, 860 px wrap, 4-line cap) at 360×800.
- Have two native speakers of different genders read each line aloud.

## 6. Open questions

1. `html lang` for Hinglish: `hi-Latn` is valid BCP 47, and Android allows script subtags in per-app locales (`sr-Latn` example, https://developer.android.com/guide/topics/resources/app-languages). Whether TalkBack voices read Roman Hindi better under `hi-Latn` or `en-IN` is untested. Try both on one phone.
2. Should the Android per-app language setting (Android 13+, `localeConfig`) list Hinglish? An in-app setting is simpler and works in the PWA too. I recommend in-app only for now.
3. `docs/research/making-it-cool.md` cites the Google/Kantar Gen Z page for language. That page has no language data (source 14). Fix the citation.

## 7. Scripts (re-runnable)

Setup:

```bash
mkdir -p /tmp/cj2/job10-tools && cd /tmp/cj2/job10-tools && npm init -y && npm i typescript@5.9.3
node count-strings.cjs /path/to/NANDI   # counts; writes ui-strings.tsv and core-strings.tsv
node classify.cjs /path/to/NANDI        # JSX text by element type
```

Key code of `count-strings.cjs`. It walks every `.ts/.tsx` file (tests excluded) and keeps JSX text, user-facing attributes, and string or template literals that look like copy:

```js
const UI_ATTRS = new Set(['aria-label','placeholder','title','alt','label','aria-description','dialogTitle']);
const SKIP_ATTRS = new Set(['className','key','id','type','role','href','src','name','htmlFor','inputMode','autoComplete','pose','area','d','viewBox','fill','stroke']);
const looksLikeCopy = s => {
  const t = s.trim();
  if (!/[A-Za-z]/.test(t)) return false;
  if (/^(https?:|\/|\.\/|#|data:|[a-z0-9]+(?:[-_.:/][a-z0-9]+)*$)/.test(t)) return false; // ids, keys, paths
  if (/^[a-z][a-zA-Z0-9]*$/.test(t)) return false;                                        // camelCase identifiers
  if (/^(var\(|rgba?\(|#[0-9a-f]{3,8}$|\d+(px|rem|ms|%))/i.test(t)) return false;
  if (/[{};]|=>/.test(t)) return false;
  return /\s/.test(t) ? /[A-Za-z]{2,}\s+[A-Za-z]/.test(t) || /^[A-Z]/.test(t) : /^[A-Z][a-z]+[.!?…]?$/.test(t);
};
// visit(): JsxText with letters → 'jsx-text'; string/template in a UI_ATTRS attribute → 'attr';
// other string/template literals → 'string'/'template' if looksLikeCopy and not inside an import,
// a literal type, an element access, a case clause, an ===/!== comparison or console/test calls.
// Templates are measured with ${…} replaced by " X ".
// content/: every JSON string value with letters, skipping ids/enum tokens/URLs and keys like id, kind, type, url, source.
const words = s => (s.match(/[A-Za-zऀ-ॿ][A-Za-zऀ-ॿ'’-]*/g) || []).length;
```

Other one-liners used:

```bash
grep -rhoE "getBy(Text|Role|Label|Placeholder)\(" tests/e2e | wc -l              # 1056
grep -rnoE "=== 1 \? '[a-z ]+' : '[a-z ]+'" src --include=*.ts* | grep -v test | wc -l   # 28
grep -n "toLocale\|Intl\." -r src --include=*.ts* | grep -v test | wc -l          # 19
python3 -c "import os,re; ..."   # Devanagari count over src/ content/ public/ → 0
```

Caveats on the numbers:
- String counts come from a heuristic scan. I measured its precision by sampling: about 100% in `src/ui` and about 75% in `src/core`.
- Word counts are measured.
- Costs, dev-days and reviewer hours are estimates.
