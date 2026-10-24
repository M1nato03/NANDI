# cj7 · Singing and videography starters in pack format

Job 6 of cloud batch 7. Date: 2026-10-24. Branch `ideas/cj7-sing-video`, cut from `origin/ideas/cj6-drawing-starter`
at `4f65a51`. Status: **DRAFT FOR EDITORS.** Nothing is built and nothing goes into `content/`.

Input: §7.2 and §7.3 of `docs/reviews/cj4-try-it.md` (branch `ideas/cj4-try-it`), the sources it and
`docs/reviews/cj4-hobbies.md` (branch `ideas/cj4-hobbies`) quote, and the approach of
`docs/reviews/cj6-drawing-starter.md`.
Output: `content-drafts/topic.try-singing.json`, `content-drafts/topic.try-video.json`, this report.

## 0. Summary

- Both drafts pass `validatePack(pack, { allowUnchecked: true, editorial: true })` with **0 errors**. Without
  `allowUnchecked`, each shows the 3 expected "missing fact-check verdict" errors. No fact-check has been done yet.
- Same shape as the drawing draft, for the same reason (cj6 §2): **3 ideas × 3 steps = 9 steps**. That is days 1-7
  plus 2 extra steps written only to meet the rule. I did not re-run the "7 days cannot pass" proof. The rules
  behind it (`validate.ts:103` and `fresh.ts` R1) have not changed since cj6.
- **The spec 21 hook goes past its source, so I narrowed it.** "Most people sing in tune at a slow tempo" rests on one
  test of **15** casual singers singing **one well-known song**. 13 of the 15 sang about as accurately as trained
  singers. The draft hook is: "Think you can't sing? In one small study, 13 of 15 casual singers sang a well-known song
  in tune once they slowed down." (§2)
- I re-read every source. That changed 5 of cj4's rows (§4). The biggest change is singing day 5. The source tested
  singing with the correct notes played along, while copying short new tunes. It did not test singing over a full song
  track.
- NANDI never opens the camera or microphone. Every quest says to use the phone's own voice recorder or camera app.
  Every video quest also carries the consent, washroom, road and "nothing needs posting" lines.
- No health claims, no "brain", no "stress". No gear: the Reading guide suggests a tripod, ring light, wireless mic
  and gimbal, and the draft passes none of them on.
- I found 6 more validator rules that do not fit a hobby track and 3 more missing checks. They are added to cj6's §5
  list in §6, numbered on from it.

## 1. What the drafts contain

Each topic has one module, 3 ideas, 9 steps and 18 practice items covering all 10 item types. There is no `askLine`
(cj4 §5: a Try-it never asks you to share).

### 1.1 `try-singing` (needs: your voice and the phone's own voice recorder)

| Try-it day | Step | Idea | Teach card (as drafted) | Sources | Grade (cj4 scale) |
|---|---|---|---|---|---|
| 1 | `sis-s1` | Sing it slow | "Many people who call themselves tone deaf hear pitch fine when tested. So the label can be wrong. Singing in tune is mostly about linking the note you hear to the note you sing." | cuddy05, pb07 | A (one university sample) |
| 2 | `sis-s2` | Sing it slow | "Casual singers tend to rush. In one study, most sang a song they knew about as well as trained singers once they slowed down, so slow is the first fix to try." | db07, bdb09 | A, but small (n = 15 in the slow test) |
| 3 | `sis-s3` | Sing it slow | "Copying your own recorded note is easier than copying a computer tone, since the sound is already yours. So hum one note, record it, then hum along to match." | hp12 | B (lab) |
| 4 | `swk-s4` | Sing what you know | "Copying a new tune is harder than singing one you know. Weaker singers fell further behind on new tunes, so start with a song you know by heart, like one from childhood." | pf10 | B |
| 5 | `swk-s5` | Sing what you know | "Singing over the right notes can feel like a guide. Yet in lab tests, people who sang off pitch did worse with it, so try a line alone and compare." | pb07 | B (lab, poor-pitch singers, short new tunes) |
| 6 | `swk-s6` | Sing what you know | "Most people wobble a little when they repeat a note, so a small wobble is normal. Aim to land one note the same way three times, then move on." | pf10 | B |
| 7 | `spw-s7` | Singing past the first week | "Record the day 1 song again and play both once. Ears judge voices less exactly than plain tones, so ask which felt surer to sing, not which was perfectly in tune." | hp12 | B for the ear claim; C for the day-7 use |
| extra A | `spw-s8` | Singing past the first week | "In one study, adults who sang off pitch did better after a single short session, though the clear gain came with a screen showing pitch. So a short session counts." | bpd22 | B (the significant gain needed a pitch display) |
| extra B | `spw-s9` | Singing past the first week | "In studies of long-term goals, enjoying the task now predicted sticking with it, while later rewards did not. So pick songs you like, not songs you think you ought to sing." | wf17 | B (goals in general, not singing) |

Quests: cj4 §7.2's quests, with these changes. Day 5 says "along with the song", not "with the track". The day-3 check
adds "Yes and no are both normal", because hp12 found no gain over repeated sung tries. Extra A: "sing for 5 minutes,
then stop, even if it is going well". Extra B: "pick a song you like, not one you think you ought to sing". Every
quest opens with: phone's own voice recorder; NANDI does not open the microphone; hum softly in a hostel or shared
room, at a time when others are awake; no shouting or straining (cj4-hobbies safety row).

Indian scenes in items: hostel common room, college fest practice, a long train trip, a college music club, the hostel,
exam week. Every study cited was run outside India (Canada, USA, and the Montreal and Warsaw groups).

### 1.2 `try-video` (needs: the phone you have, with its own camera app)

| Try-it day | Step | Idea | Teach card (as drafted) | Sources | Grade |
|---|---|---|---|---|---|
| 1 | `fsb-s1` | Filming steady, bright and close | "Hand-held shots shake, so rest the phone on something solid, like a stack of books or a bottle. Then hold each shot for about ten seconds before you stop." | bvj22 | C |
| 2 | `fsb-s2` | Filming steady, bright and close | "Put the brightest light in front of your subject, not behind, because a bright window behind them leaves the face dark. Outdoors, keep the sun behind you." | rdg | C |
| 3 | `fsb-s3` | Filming steady, bright and close | "Digital zoom on a phone lowers picture quality, so move your feet instead. Walk closer for a close-up, and step back for a wide shot." | rdg | C |
| 4 | `fss-s4` | Filming sound and shots | "Poor sound changes how people judge the speaker, so treat sound as part of the shot. Film in a quiet spot, away from roads and crowds." | ns18, rdg | A for how viewers judge (press release only); C for the tip |
| 5 | `fss-s5` | Filming sound and shots | "To show an action, film several kinds of shot: hands up close, the face, a medium shot, over the shoulder, and one creative angle. Together they show what is happening and how, so viewers follow." | bmr17 | C |
| 6 | `fss-s6` | Filming sound and shots | "Many guides teach the rule of thirds, yet a study of highly rated photos and paintings found it played a minor role, if any. So treat it as one option: shoot both ways and pick." | am14, rdg | B (stills, not video) |
| 7 | `fpw-s7` | Filming past the first week | "A sequence shows viewers where we are, what is happening and how. Plan your shots and film them in that order, so the clip makes sense with no editing app." | bvj22 | C |
| extra A | `fpw-s8` | Filming past the first week | "In experiments, taking photos raised enjoyment when it drew people into the moment, and less so when it got in the way. So use the camera to notice, then put the phone down." | dzb16 | B (photos, not video) |
| extra B | `fpw-s9` | Filming past the first week | "Enjoying a task now predicted sticking with long-term goals, while later rewards did not. So film things you like looking at, not what you think might get views." | wf17 | B |

Quests: cj4 §7.3's quests, with these changes.
- Day 1 says "the view from a window" instead of "street", which keeps people off roads.
- Day 3 adds one zoomed shot, so the next-day check ("zoomed or walked closer?") has something to compare.
- Day 4 drops cj4's "arm's length vs hand's length". No source covers it.
- Day 7 adds "then watch your day 1 shots".
- Extra A: "film 3 short shots of things you notice, then put the phone away". Extra B: "5 shots of something you like
  looking at".
- Every quest opens with: the phone's own camera app (NANDI does not open the camera); "Camera app only, and close it
  after the last shot" (cj4 §7.3); ask before you film anyone; no filming in washrooms or other people's rooms; stay
  off roads; nothing needs posting.
- People appear in "Show me" and the tries only after a stated yes: "who said yes", "agrees to be filmed", "filmed with
  her yes".

Indian scenes in items: college fest (twice), college canteen, hostel, college photo club, a monsoon walk to college.

## 2. The singing hook, checked against its source

Spec 21 (`docs/specs/21-useful-now.md`, branch `ideas/spec-21-useful-now`, line 68): "Think you can't sing? Most people
sing in tune at a slow tempo." It comes from cj4-hobbies, which quotes the abstract of Berkowska & Dalla Bella 2009.

| Source | What I read | What it says |
|---|---|---|
| Berkowska & Dalla Bella 2009, *Advances in Cognitive Psychology* 5:69-83 | Full text, open access: [Europe PMC PMC2865000](https://europepmc.org/article/PMC/PMC2865000) (XML from the Europe PMC REST API) | Abstract: "Most occasional singers can sing in tune and in time, provided that they perform at a slow tempo." The body names the evidence: "To test the role of tempo in singing proficiency, 15 of the occasional singers were retested; they performed the same familiar melody as before, but at a slow tempo." And: "in a group of 15 occasional singers we tested in the past, 13 participants sang proficiently at a slow tempo; in contrast, 2 participants were still very inaccurate in producing pitch intervals". Its summary of this line of work adds a condition: "provided that the tempo is slow and that the melody to be imitated is presented together with a metronome." I could not tell from the review whether the 15-person test used a metronome. |
| Dalla Bella, Giguère & Peretz 2007, *JASA* 121(2):1182-9 | Abstract via NCBI E-utilities, PMID [17348539](https://pubmed.ncbi.nlm.nih.gov/17348539/) | "we asked occasional singers (n=62) to sing a well-known song". "In experiment 2 15 nonmusicians from experiment 1 sang the same song at a slow tempo. In this condition, most of the occasional singers sang as accurately as the professional singers." "However, two of the occasional singers maintained a high rate of pitch errors at the slower tempo." |

**Verdict: goes past the source.** "Most people" rests on 15 casual singers, singing one familiar song, in one lab, at a
set slow tempo. The review generalises to "most occasional singers", and the same review puts poor-pitch singing at
"probably confined to 10-15% of the population". So the wider claim is plausible, but the direct test is small.

**Draft hook (`sing-it-slow.hook`):** "Think you can't sing? In one small study, 13 of 15 casual singers sang a
well-known song in tune once they slowed down." It keeps the spec's opening line and states the size. Claim `sis-c2`
and the estimate item `sis-4` use the same numbers. If editors want a shorter line: "Think you can't sing? In one
study, most casual singers sang a song they knew in tune once they slowed down."

## 3. Validation

Run from the worktree (Linux):

```
cd <worktree>
npm ci
python3 <scratchpad>/j6/build_sing.py  content-drafts/topic.try-singing.json
python3 <scratchpad>/j6/build_video.py content-drafts/topic.try-video.json
npx tsx <scratchpad>/j6/check.mts content-drafts/topic.try-singing.json
npx tsx <scratchpad>/j6/check.mts content-drafts/topic.try-video.json
```

The build and check scripts are throwaway and not committed, as in cj6. `check.mts` runs the following:
- `validatePack(pack, { allowUnchecked: true, editorial: true })`, then the same call without `allowUnchecked`.
- `findCopyIssues` and `findBannedWords` on the raw JSON.
- A health-word and gear-word scan.
- The `topic-quality.test.ts` rules: 3+ options, wrong-feedback openers, stem openers, and no `count` unit on
  estimates.
- The R5 longest-answer share.

Final output, singing:

```
validatePack(full, { allowUnchecked: true, editorial: true }) -> 0 error(s)
validatePack(full, { editorial: true }) -> 3 error(s)
  sing-it-slow: missing fact-check verdict
  sing-what-you-know: missing fact-check verdict
  singing-past-week-one: missing fact-check verdict
copy-lint hits: 0 []
banned-words hits: 0 []
health words: []
gear words: []
choice items with <3 options: []
wrong-feedback openers used >3 times: []
stem openers used >4 times: []
estimates with count unit: []
teach Flesch (min): 78.3
quest Flesch: 96.0, 96.0, 93.0 words: 144, 143, 154
right answer longest: 9/31 = 29%
```

Final output, video:

```
validatePack(full, { allowUnchecked: true, editorial: true }) -> 0 error(s)
validatePack(full, { editorial: true }) -> 3 error(s)
  filming-steady-bright-close: missing fact-check verdict
  filming-sound-and-shots: missing fact-check verdict
  filming-past-week-one: missing fact-check verdict
copy-lint hits: 0 []
banned-words hits: 0 []
health words: []
gear words: []
choice items with <3 options: []
wrong-feedback openers used >3 times: []
stem openers used >4 times: []
estimates with count unit: []
teach Flesch (min): 73.0
quest Flesch: 92.9, 94.1, 93.3 words: 190, 176, 185
right answer longest: 8/31 = 26%
```

`npm run banned-words` and `npm run validate-packs` on the worktree still pass ("Packs valid."). The drafts are not in
`content/`, so they are not part of that run.

The errors on the way there, all fixed:
- Singing: R5 at 52%. I lengthened 5 wrong options and shortened 2 right ones.
- Video: R5 at 68%. 21 changes, mostly shorter right options in the guided tries.
- Video: the absolute-word bias, with 3 in wrong options and 0 in right ones. Now "each move", "most of them" and
  "posted daily".
- Video: 9 Flesch-below-60 failures in claims, stems, one feedback line, one misconception and one hook. Long words
  like "intelligent", "experiments" and "university" caused most of them (see §5).

No id in either draft is used under `content/` or `src/` (`grep` on the 6 step prefixes, the 6 concept ids and the 2
topic ids).

## 4. Changes from cj4 §7.2 and §7.3 after re-reading the sources

| Day | cj4 said | Source says | Draft now |
|---|---|---|---|
| Sing 1 | "About 1 in 6 students call themselves tone deaf" | "Nearly 17% of over 2,000 first-year psychology students at Queen's University" (one Canadian university) | Claim `sis-c1` names the survey: first-year students in Canada |
| Sing 2 | "At a slow tempo, most sang about as accurately as professionals" | The slow test had 15 people; 13 did well and 2 did not (bdb09 full text). One familiar song. | Hook, claim and estimate say 13 of 15, one study |
| Sing 5 | "For some beginners, singing over a full track makes pitch harder" | pb07: poor-pitch singers "appeared to be hindered rather than helped by singing with correct accompaniment", while copying "unfamiliar 4-note pitch sequences" | Teach and claim say "the right notes played along" and "in lab tests". The quest still compares one line alone with the song. That is a stretch, flagged for editors. |
| Sing 7 | Source: Berglin 2022 (one 20-min session) | Berglin is about a training session, not about judging day 1 against day 7 | Day 7 now rests on hp12 Exp. 5 (ears judge voice pitch less well than tones). Berglin moves to extra A. |
| Video 1 | Baruch "steady shot for at least ten seconds" | Same page, posted 10 Feb 2022, is about large-sensor cameras: "These cameras are basically impossible to handhold". It also says: "Set the camera down on a flat surface (the ground, a table, a stack of books, etc.)" | "Stack of books" now comes from the class page. It was written for big cameras, not phones, so the phone use is our step. |
| Video 4 | "the phone near the voice", "arm's length vs hand's length" | Not in any source read | Dropped. The teach card keeps "quiet spot, away from roads and crowds" (Reading). |

Rows not listed (sing 3, 4 and 6; video 2, 3, 5, 6 and 7) match their sources as cj4 wrote them. The wording is
tightened, and §5 gives the quotes.

## 5. Source check (all opened by me unless §7 says otherwise)

| id | Source | What I read | Quote used | Used for |
|---|---|---|---|---|
| cuddy05 | Cuddy, Balkwill, Peretz & Holden 2005, *Ann NY Acad Sci* 1060 | Abstract, E-utilities, PMID [16597781](https://pubmed.ncbi.nlm.nih.gov/16597781/) | "Nearly 17% of over 2,000 first-year psychology students at Queen's University self-reported tone deafness"; "many individuals who consider themselves "tone-deaf" may not, in fact, have perceptual difficulties" | Day 1, `sis-m1` |
| db07 | Dalla Bella, Giguère & Peretz 2007, *JASA* 121(2) | Abstract, PMID [17348539](https://pubmed.ncbi.nlm.nih.gov/17348539/) | "The variance in singing proficiency was largely due to tempo differences. Occasional singers tended to sing at a faster tempo and with more pitch and time errors relative to professional singers." | Day 2, hook |
| bdb09 | Berkowska & Dalla Bella 2009, *Adv Cogn Psychol* 5 | Full text, [PMC2865000](https://europepmc.org/article/PMC/PMC2865000) | "13 participants sang proficiently at a slow tempo; in contrast, 2 participants were still very inaccurate" | Hook, `sis-c2`, `sis-4` (13 of 15) |
| hp12 | Hutchins & Peretz 2012, *JEP: General* 141(1) | Abstract, PMID [21875245](https://pubmed.ncbi.nlm.nih.gov/21875245/) | "nonmusicians were better at matching their own voice than a synthesized voice timbre"; "singers do not improve over multiple sung responses, or with the aid of a visual representation of pitch"; "listeners were more accurate at perceiving the pitch of the synthesized tones than actual voice tones" | Day 3, day 7, `sis-5`, `spw-m1` |
| pb07 | Pfordresher & Brown 2007, *Music Perception* 25(2) | Abstract on the [University at Buffalo research page](https://researchconnect.buffalo.edu/en/publications/poor-pitch-singing-in-the-absence-of-tone-deafness/) | "10-15% of the participants imitated pitch at least one semitone off"; "Poor-pitch singers did not differ from good singers in pitch discrimination accuracy, although they appeared to be hindered rather than helped by singing with correct accompaniment"; "mismapping of pitch onto action" | Days 1 and 5, `swk-4` estimate (10-15%) |
| pf10 | Pfordresher, Brown, Meier, Belyk & Liotti 2010, *JASA* 128(4) | Abstract, PMID [20968388](https://pubmed.ncbi.nlm.nih.gov/20968388/) | "A group of 45 non-musician participants"; "singers were more accurate than they were precise, and that a majority of participants could justifiably be categorized as imprecise singers"; "performance differences across groups of singers were greater for the imitation of unfamiliar tone sequences than for the recall of familiar melodies" | Days 4 and 6 |
| bpd22 | Berglin, Pfordresher & Demorest 2022, *Psychology of Music* 50(4) | Abstract on the [Buffalo page](https://researchconnect.buffalo.edu/en/publications/the-effect-of-visual-and-auditory-feedback-on-adult-poor-pitch-re/) | "three 20-min training conditions"; "There was a general improvement from pretest to posttest across all groups. However, the effect of training was only significant for participants who received visual feedback training"; "supports the hypothesis that singing is a learned skill that can benefit from experience and may not simply reflect an inherited talent" | Extra A, `spw-c4`, `spw-3` estimate (20 min). The copy says the clear gain needed a pitch display. NANDI does not build one (cj4 §7.2). |
| wf17 | Woolley & Fishbach 2017, *PSPB* 43(2) | Abstract, PMID [27899467](https://pubmed.ncbi.nlm.nih.gov/27899467/) | "immediate rewards (e.g., enjoyment) predicted current persistence at New Year's resolutions whereas delayed rewards did not" | Extra B in both tracks |
| bvj22 | Baruch College (CUNY), Advanced Video Journalism, "Video Storytelling", posted 10 Feb 2022 | Full page, [blogs.baruch.cuny.edu/advancedvideojournalism/?p=22](https://blogs.baruch.cuny.edu/advancedvideojournalism/?p=22) | "Record a steady shot for at least ten seconds before you stop recording"; "Set the camera down on a flat surface (the ground, a table, a stack of books, etc.)"; "the purpose of a sequence is to orient the viewer as to where we are, what we're seeing, what is happening, and how it's happening" | Days 1 and 7, `fsb-4` estimate (10 s) |
| bmr17 | Baruch College (CUNY), Multimedia Reporting, class agenda 8 Nov 2017 | Full page, [?p=572](https://blogs.baruch.cuny.edu/multimediafall2017/?p=572) | "Close-up on the hands." "Close-up on the face." "Medium shot." "Over the shoulder shot." "One additional creative angle."; "sometimes it'll only be three shots, or it might be ten"; "head out for 20-30 minutes to find and film a five-shot sequence" | Day 5, `fss-4` (5 shots), `fpw-3` (20-30 min) |
| rdg | University of Reading, "Filming on your phone" (no date on the page) | Full page, [reading.ac.uk](https://www.reading.ac.uk/research-innovation-hub/communications-engagement-and-impact/research-communications/filming-on-your-phone) | "Position your subject so that the brightest light is shining on them head on, not from behind. If you're outside, this means you want the sun to be behind the camera"; "it's better to physically move closer to your subject instead of using the digital zoom on your phone, which lowers the quality of the image"; "Try to find a quiet place to film"; "Do a sound check by recording a short test clip and listening back to it"; "Test the lighting by recording yourself in position for a few seconds and watch it back"; "Using the rule of thirds is a reliable way to create visually appealing images." | Days 2, 3, 4 and 6. The same page suggests "a tripod", "A ring light", "a wireless microphone" and "a phone gimbal" and lists editing apps. None of that is passed on. |
| ns18 | ANU news release on Newman & Schwarz 2018, via ScienceDaily | Full release, [sciencedaily.com](https://www.sciencedaily.com/releases/2018/04/180413093842.htm) | "Those who listened to the poorer quality audio consistently evaluated the scientists as less intelligent and their research as less important." A second experiment used radio interviews with "renowned scientists". | Day 4, hook. The draft says "less smart", because "intelligent" failed the Flesch check. |
| am14 | Amirshahi, Hayn-Leichsenring, Denzler & Redies 2014, *Art & Perception* 2 | Full PDF, [uniklinikum-jena.de](https://uniklinikum-jena.de/anatomie1_media/Inhalte/AmirshahiARTP2014-font-1.pdf) | "aesthetic rating scores correlated only weakly with subjective ROT scores and not at all with calculated ROT values"; "for photographs that were rated as highly aesthetic and for a large set of paintings, calculated ROT values were about as low as in photographs that did not follow the rule of thirds"; "the rule of thirds seems to play only a minor, if any, role" | Day 6. The study covered stills and paintings, not video. The copy says "photos and paintings". |
| dzb16 | Diehl, Zauberman & Barasch 2016, *JPSP* 111(2) | Abstract, PMID [27267324](https://pubmed.ncbi.nlm.nih.gov/27267324/) | "Across 3 field and 6 lab experiments, we find that taking photos enhances enjoyment of positive experiences"; "This occurs when photo-taking increases engagement with the experience, which is less likely when … photo-taking interferes with the experience"; "photo-taking directs greater visual attention to aspects of the experience one may want to photograph" | Extra A of video. Goes past the source: it tested photos, and the step applies the idea to filming. Flagged in `fpw-c2`'s wording ("taking photos"). |

## 6. Validator rules that do not fit a hobby track: additions to cj6 §5

cj6 §5 rows 1-9 and missing checks A-D all apply here too and are not repeated. New ones:

| # | Rule today (file) | Problem for Try-it | Proposed change | Reason |
|---|---|---|---|---|
| 10 | Estimate must name its concept: with no `estimateMechanisms` entry, the fallback is the first word of the concept title (`validate.ts:213`) | Concept titles had to start with a word the estimate stem could repeat. All 3 singing titles start with "Sing", and all 3 video titles start with "Filming". "Filming sound and shots" is a title written for a regex. | For Try-it, add `estimateMechanisms` entries per concept, or drop the estimate (cj6 row 3) | Titles are learner-facing. A regex should not choose them. |
| 11 | `quest` is free text on each idea (`schemas.ts`) | Safety lines (consent, washrooms, roads, camera app only, posting) have to repeat in all 3 video quests. That makes them 176-190 words, against 110-130 for drawing. | A track-level `tryIt.safety` (module or topic), shown on every quest card of that track, instead of cj6's per-step `safety?` | One source of truth for the consent line. Shorter quest cards. |
| 12 | R2: no number from the step's lesson in its items (`fresh.ts`) | In day 7, "day 1" and "day 7" are the content. The hook names day 7, so the items in that step cannot say "day 7" in digits. Item `spw-2` says "first and newest recordings" to pass. | Exempt `day N` labels in Try-it packs from R2 | The rule targets copied story numbers, not track positions. |
| 13 | No evidence grade on claims or sources (`schemas.ts` `claim`, `sourceRef`) | The video track rests mostly on university teaching pages (grade C). The pack looks as solid as a lab claim. cj4's A-D grades live only in reports. | Optional `grade: 'A' \| 'B' \| 'C' \| 'D'` on each claim, shown in the source panel, and required for Try-it | Charaka lessons already carry a grade (`lesson.grade`). The same honesty applies here. |
| 14 | `sourceRef.year` is a required integer (`schemas.ts:10`) | The Reading guide has no date. I used 2026, the year I opened it. | Allow `asOf` (already in the schema) to stand in for `year` on web guides, or make `year` optional when `asOf` is set | A made-up year is worse than an access date. |
| 15 | No night flag on a Try-it day | cj4 §2 lets only drawing's small version show after bedtime. Singing in a hostel at night disturbs others, and video needs light and moving. The pack cannot say this. | `tryIt.nightOk: boolean`. Drawing small = true, singing = false (or "hum only"), video = false. | Keeps the night rule in data, not in screen code. |

New missing checks:

| # | Missing check | Proposal |
|---|---|---|
| E | Camera and microphone wording | Reject Try-it text saying NANDI records, films or opens the camera or mic. Require every singing or video quest to name "own voice recorder" or "own camera app". |
| F | Consent when people are filmed | If a quest or item mentions filming a person (friend, mother, brother, someone), require "ask" or "said yes" in the same text |
| G | Posting and sharing | Reject "post", "upload" and "share" in Try-it quests unless negated ("Nothing needs posting"), as cj4 §5 says sharing is never asked for |

## 7. Where content was bent (only what cj6 §3 does not already cover)

| Rule | What I did | Cost |
|---|---|---|
| 3 steps per idea (cj6 row 1) | Singing extras: "Short sessions count" (bpd22) and "Sing what you enjoy" (wf17). Video extras: "Film to notice, then put it down" (dzb16) and "Film what you enjoy" (wf17). | All 4 use sources that cj4-try-it or cj4-hobbies quoted, but they are not cj4 §7 days. dzb16 is about photos. |
| Estimate per idea (cj6 row 3) | Singing: 13 of 15 (ties to the hook), 10-15% a semitone off, a 20-minute session. Video: 10 seconds, 5 shots, 20-30 minutes for a class exercise. | The singing estimates teach something. The video ones, especially `fpw-3`, are trivia. |
| Flesch ≥ 60 on every claim and feedback line | "less intelligent" became "less smart", "experiments" became "tests", and a few "university" phrases were cut | "Less smart" is a paraphrase. The source panel keeps the exact wording. |
| R5 longest-answer share | 7 changes in singing and 21 in video, mostly shorter right options in guided tries | Wording only; no meaning changed. |

Nothing true was made false to pass a rule.

## 8. Sources not opened, or read second-hand

| Source | What happened | How it is used |
|---|---|---|
| Dalla Bella et al. 2007, Hutchins & Peretz 2012, Pfordresher et al. 2010, Cuddy et al. 2005, Diehl et al. 2016, Woolley & Fishbach 2017 | Abstracts only, through NCBI E-utilities `efetch` (PubMed web pages not loaded, as in cj4 and cj6). No full text opened. | As quoted in §5 |
| Pfordresher & Brown 2007 and Berglin et al. 2022 full texts | Not opened. I read the abstracts on the University at Buffalo research pages. | Days 1 and 5, extra A |
| Newman & Schwarz 2018, *Science Communication* 40(2) | Journal page not opened, as in cj4. I read only the ANU release on ScienceDaily. | Day 4. A full-text check is needed before release. |
| Berkowska & Dalla Bella 2009 | **Opened in full** (Europe PMC open access) | The hook correction (§2) |

No paywall bypass was used. No source outside cj4-try-it and cj4-hobbies was added.

## 9. App bugs

None found. The cj6 rule conflict (6-8 items per idea vs exactly 2 per step) still stands unfixed.
