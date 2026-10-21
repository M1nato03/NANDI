# Learner walk-through: Body and training, How things work (learn-steps)

Reviewed 2026-10-21 on `origin/learn-steps`, files `content/topics/topic.body-training.json` (8 concepts) and
`content/topics/topic.how-things-work.json` (10 concepts). No content was changed. Facts, maths and the validator
were already checked by the builder. This review asks one thing: what does an 18-25 year old in India, tired after
college and reading on a phone, meet in each lesson? Every concept was walked in lesson order: hook → teach + visual →
spot example → guided 1 → guided 2 → takeaway → that step's practice items, then the next step.

Scores: **Taught** = how much it feels like being taught (5 = every step explains why/how in plain words, and the
tries need that idea). **Fresh** = do the 8 questions feel different in idea (5 = no two feel the same, 1 = the
inflation complaint again).

## Summary table

| Concept | Taught 1-5 | Fresh 1-5 | Top issue |
|---|---|---|---|
| progressive-overload | 3 | 2 | "It got easier, so the body adapted" is asked three times in s1 (hook, guided 2, item 10) |
| muscle-protein-rest | 2 | 2 | "the stand" is never explained; the per-meal rule first appears inside a guided try |
| sleep-recovery | 2 | 2 | s1 is a number to memorise, with teen ranges that do not fit an 18-25 user; s2 tests study details never taught |
| heat-hydration | 3 | 2 | The right answer is the longest option in 14 of 17 questions; s3 has no "this can be an emergency" step |
| warmup-myths | 3 | 2 | Item 12 says "no clear effect" right after a lesson that taught long holds dull power, with no lesson on why |
| cardio-talk-test | 3 | 1 | s3 asks "halve the minutes" four times (hook, guided 1, items 15, 16) |
| showing-up | 2 | 2 | The title promises a habit; the steps are WHO numbers. "Short bouts count" is asked four times |
| food-labels | 4 | 3 | Items 14 (% of a stressed ingredient) and 16 (%RDA against 50 g) test rules no step teaches |
| lift | 4 | 2 | "No air, no lift" is asked six times in s1, the airless box three of them |
| multirotor-turns | 4 | 3 | "Weight ÷ 4" three times in s1 (hook, guided 1, item 9) |
| battery-flight-time | 3 | 3 | Item 16 tests a "Berkeley flying battery test" never mentioned; s2 says power "climbs faster" with no reason |
| flight-sensors | 3 | 3 | s3 guided 2 (1013 hPa) and item 13 (radius vs diameter) test trivia, not how the sensor works |
| birds-and-planes | 2 | 1 | s1 and s2 teach the same idea (wings lift, engines push); the glider repeats Lift |
| ceiling-fans | 3 | 1 | s2 and s3 are one idea; "a fan does not chill air" is asked about eight times |
| upi-path | 4 | 3 | s2's guided tries test facts its teach card never says; the collect-request scam (item 14) is never taught |
| phone-camera | 3 | 3 | s3 teaches ISO, but both guided tries and item 16 test lens aperture, which it never teaches |
| sky-colours | 4 | 3 | Item 10 (black sky on the Moon) sits in s1, before scattering is taught; the 1/λ⁴ formula appears in a guided try |
| pressure-cooker | 4 | 3 | Item 16's half-full safety rule is never taught; °F and psi are US units |

Averages: Body and training: taught 2.75, fresh 2.0. How things work: taught 3.4, fresh 2.5. Neither topic yet
answers the owner's "exact repetition" complaint. Most concepts still ask one fact 3-6 times in different formats.

## Patterns across both topics (fix these first, they hit most concepts)

**P1. One fact asked over and over within a step.** The usual pattern: the hook asks the fact, the teach states it,
guided 1 asks it, guided 2 asks it with new numbers, and 1-2 practice items ask it again. To a learner, format
changes (fill-the-step, estimate, true-not-quite) do not count as new. Named pairs are listed under each concept.
Rule to adopt: inside one step, each question must make the learner *use* the idea in a different situation or
direction (predict, explain why, spot the exception, apply backward). The same fact with new numbers does not count.

**P2. Practice items test things no step taught.** Spec 14 promises "teach first". These items still bring in a new
fact at question time: progressive-overload-11, muscle-protein-rest-16, sleep-recovery-13/14, heat-hydration-10,
warmup-myths-12, warmup-myths-s1 guided 2, showing-up-12, showing-up-s2 guided 2, food-labels-14/16,
battery-flight-time-16, birds-and-planes-s3 guided 1/2, upi-path-s2 guided 1/2, upi-path-14, phone-camera-10,
phone-camera-s3 guided 1/2 + item 16, sky-colours-10/12, pressure-cooker-16. Each one either needs a sentence in
that step's teach or example, or should move to a step that teaches it.

**P3. Option length gives the answer away.** Counted across hooks, guided tries and items (order/match left out):
the right option is strictly the longest in **45% of Body questions (58/130)** and **57% of How questions
(91/161)**. With three options, chance is about 33%. Worst cases, where the right option is at least 30% longer:
heat-hydration (14/17 overall), birds-and-planes-16 (75 vs 47 chars), sky-colours-15 (83 vs 55),
battery-flight-time-16 (78 vs 42), pressure-cooker-10 (73 vs 36), phone-camera-s3 hook (68 vs 31),
upi-path-s3 guided 2 (62 vs 34), cardio-talk-test-14 (63 vs 33), muscle-protein-rest-15/16 (57/58 vs 33/38).
Fix: write one distractor at least as long as the answer, with the same "because" structure.

**P4. Distractors nobody picks.** Very often one or both wrong options are absurd: "Thirst stops working in the heat"
(heat-16), "GPS only works at night" (flight-sensors-12), "Rest days undo the training" (muscle-protein-rest-15),
"It doubles injuries" (warmup s3 hook), "Nothing, IDs hold money" (upi-10), "Make it read zero" (ceiling-fans s2
guided 2), "The ID holds only ₹1,000" (upi-10). A three-option question with one silly option is really a coin
toss; with two silly options it is no question at all. Every true-not-quite item has a "Nothing, [the wrong claim
again]" option. Replace each with the *real* misconception a student holds (examples below).

**P5. True-not-quite feels like one template.** Every concept has "A friend says X. What is wrong?" Every time,
the answer is the teach line repeated and the others are "Nothing" and an extreme. Across 18 concepts this is the
most "same question again" feeling in the topic. Make some true-not-quite claims *half right*, so the answer is a
qualification, not the opposite. Example: "A friend says stretching is useless" → "It adds range for a while;
it just has no clear injury effect."

**P6. Hints that give the answer.** The spec wants guided tries at ~90% first-try correct, but many hints simply
state the answer, so the try checks reading, not understanding: cardio s1 guided 1 ("Talk but not sing."),
cardio s2 guided 1 ("Moderate is 5 or 6."), sleep s1 guided 1 ("Teens 13 to 18 are advised 8 to 10 hours."),
warmup s2 guided 1 ("4.6% of 50 is a bit over 2."), birds s3 guided 1 ("It is close to a half."),
pressure-cooker s1 guided 1 ("about 11 degrees below 100°C"), phone-camera s2 guided 1 ("Two out of four."),
sky s1 guided 1/2 ("Red waves are the long ones." / "Violet is at the short end."), upi s2 guided 2
("UPI runs round the clock."), ceiling-fans s3 guided 2 ("Fans cool people, not rooms."). A hint should point to
the *reasoning* ("What does the voice clue tell you?"), not the result.

**P7. Teach cards that state, not explain.** About half the teach cards give the *what* and skip the *why* the
owner asked for: progressive-overload s1/s3, muscle-protein-rest s3, sleep-recovery s1, warmup-myths s2,
cardio-talk-test s3, showing-up s1/s2, battery-flight-time s2/s3, flight-sensors s3, ceiling-fans s1. Rewrites are
given per concept. Each still fits ≤ 30 words.

**P8. Source names as jargon.** "the stand", "ISSN stand", "the review", "per the review", "the guide", "CDC",
"WHO", "Berkeley", "NASA's Jet Propulsion Laboratory" appear in stems and hints without being introduced. To a
tired learner "Which fits the stand?" is not readable. Keep sources in `sourceRefs`; in learner text say "experts
advise", "studies found", or name the body once in the teach card ("India's food regulator, FSSAI, says…").

**P9. US units in an Indian app.** °F (pressure-cooker s1 guided 1, ceiling-fans-14), psi (pressure-cooker-12).
Convert to °C and bar or kg/cm² (Indian cookers are marked in kg/cm²), or drop the item.

---

# Body and training

## progressive-overload (taught 3, fresh 2)

**(a) Steps distinct?** Yes: s1 "more than usual causes adaptation", s2 "grow the work: weight, reps or days",
s3 "keep the jumps small". s2 and s3 overlap slightly. Item 16 ("repeat until easy, then add") is s2 content
filed under s3.

**(b) Teach cards.**
- s1 teach: "Muscles get stronger when you ask them to do a bit more than they are used to. This is called
  overload." It gives a fact and a label; nothing explains *why*. Rewrite: "Asked to do a bit more than usual, a
  muscle gets a little stronger, so the same work is easier next time. That push is called overload." (26 words)
- s3 teach: "How big each weekly jump is, next to what you already do, is linked to injury risk." A tired reader must
  read this twice ("next to what you already do" = relative). Rewrite: "Grow in small steps. A jump that is big
  *compared with what you already do* is linked to more injuries. 10 extra minutes is big if you only do 40."

**(c) Same-feeling pairs.**
- s1 hook (push-ups feel easy now) = s1 guided 2 (Rahul's curls feel easy now) = item 10 (Tara's squats feel
  easier). It is the same question three times. Keep the hook. Change guided 2 to the backward case: "Meera has done
  the same 8 squats daily for 3 months and stopped improving. Why?" → "Her legs have caught up; nothing new is
  asked of them." Change item 10 to transfer: "Aisha carried a heavy school bag for years. Why did it stop feeling
  heavy?"
- s3 hook (40→60 vs 200→220) and item 15 (Asha 60 + 30 vs Om 300 + 30) are the same comparison. Replace item 15
  with a choice that needs the idea in reverse: "Om runs 300 min a week. Which next week is about as big a jump as
  Asha's 60 → 70?" → "300 → 350".
- item 9 (fill: "___ = Overload") only asks for a label. Drop it, or turn it into a why: "Why does doing the same
  10 push-ups for a year stop making you stronger?"

**(d) Giveaways.**
- s2 hook: "Do the same 10, faster and sloppier" and "Nothing, since easy means you are done" are options nobody
  picks. Use a real belief instead: "Do the same 10 every day, just for longer weeks."
- s2 guided 2: "Both the same" (14 chars) vs "The one who adds weight". Too easy even for a guided try. Better: "One friend
  adds 1 kg a month, one adds 5 kg a week. Who is likelier to keep going all year without getting hurt?" (this
  also links s2 to s3).
- s3 guided 2: "When you do little, any jump is a big share." (44) vs 30/32. The other two ("Beginners cannot get
  stronger", "Big jumps are fine for everyone") are absurd. Distractor: "Beginners' muscles are weaker, so any
  weight hurts them."
- item 16 (order): "pick a move → repeat until easy → add a little" is obvious from everyday sense; no reasoning.

**(e) Plain words.** "clean reps" is used in s2 teach, s2 hook and the rule without ever being explained. Add
"clean = with good form" in the s2 teach.

**(f) Example / step match.** Matches. Item 11 (push-ups with body weight count as strength work) is not taught in
s1. Add to s1 example: "…does 10 push-ups using just her body weight…", or move the item.

**(g) India / safety.** Hostel room, college gym and water bottles as weights all fit well. The s3 visual (scale
0-50%, 10% mark) has no label saying "keep under about 10%". The learner sees two dots and no target.

## muscle-protein-rest (taught 2, fresh 2)

**(a) Steps distinct?** Yes in theory (signal + material / how much / building continues after). s2 packs two ideas:
a daily amount per kilo, *and* 20-40 g per meal every 3-4 hours, which guided 2 and items 12 and 14 test. Split
the per-meal idea out, or drop it.

**(b) Teach cards.**
- s1 is fine.
- s2: "Times your weight gives your range." This line reads twice ("times" as a verb). Rewrite: "Multiply your
  weight in kilos by 1.4 and by 2.0. That gives your daily range in grams."
- s3: "so rest time counts too" never says *why rest matters* (the building happens after you stop, so the
  muscle needs time before you load it hard again). Rewrite: "Muscle is built after the session, not during it.
  Building can stay raised for up to two days, so a rest day is when the gains happen."

**(c) Same-feeling pairs.**
- s1 guided 1 (Kiran drinks a shake, never trains) = item 10 (Sid drinks two shakes, skips every workout). Replace
  item 10 with the reverse case: "Kabir trains hard but eats little protein. What is he short of?" → "Building
  material."
- s1 item 9 (match: strength work → signal, protein → parts) repeats the teach card word for word. It has no
  reasoning; drop it or swap it for a scenario.
- s2 hook (60 kg → 84-120 g), the s2 example (50 kg → 70-100 g), guided 1 (70 × 1.4) and item 13 (55 kg → 77-110 g)
  are the same multiplication four times. Keep two.
- s3 guided 1 (6 pm + 48 h) is clock arithmetic and teaches nothing about rest. Replace: "Zoya trained legs hard
  on Monday. Is Tuesday a good day for another hard leg session?" → "Better to let legs rest; building is still
  going on."

**(d) Giveaways.** Item 13: "Below her range of about 77 to 110 grams." (41) vs "Inside her range." (17) and
"Above her range." (16). Only one option has numbers. Item 15: 57 vs 33/28, and "Rest days undo the training"
nobody picks. Item 16: 58 vs 38/31.

**(e) Plain words / jargon.**
- "fits the stand" (s2 example), "The stand suggests…" (s2 guided 2), "the ISSN stand" (item 12), "compare with
  the stand" (item 13), "The stand suggests doses spread" (item 14). The learner is never told what "the stand"
  is. Rewrite: "experts on sports nutrition suggest…".
- Item 11: "In a review, people did a strength session before eating anything. What happened to their muscle
  building?" It reads like a lab report. Rewrite: "You train on an empty stomach before breakfast. Does your muscle
  still start building?"
- Item 16: "Why is one rule for everyone a problem?" sits on top of an age finding that no step taught. Drop it, or
  teach "the response is smaller with age" in s3.

**(f) Example / step match.** s2 guided 2 brings in "20 to 40 g per meal, every 3 to 4 hours" for the first time
inside a guided try. That is a new rule at question time (P2).

**(g) India / pressure.** 1.4-2.0 g/kg means 84-120 g a day for a 60 kg vegetarian student. On dal, paneer and
curd that is hard to reach, and the step reads like a push towards protein powder (two of the six scenarios
feature shakes). For an 18-25 beginner who trains 2-3 times a week this can feel like a target they are failing.
Add one line in s2 teach or takeaway: "Regular hard training: 1.4-2.0. Everyday adult: about 0.8-1 g per kilo."
Add one Indian-food example ("a bowl of dal ≈ 7-9 g, 100 g paneer ≈ 18 g") so the number means something.

## sleep-recovery (taught 2, fresh 2)

**(a) Steps distinct?** Yes (how much / short sleep hurts performance / short sleep raises hunger). s1 has no
mechanism at all: it is a number.

**(b) Teach cards.**
- s1: "Sleep is part of training, not a break from it. Adults are advised 7 to 9 hours a night. Teens need 8 to
  10." Nothing says *why* sleep is part of training. Rewrite: "Your body does much of its repair while you sleep,
  so sleep is part of training. Adults are advised 7 to 9 hours a night."
- s2 is fine and has a surprising finding (early waking hurts more). That is good teaching. Add the reason if one
  is known, or say plainly "studies found, reason not yet clear".
- s3 is good: the hormone mechanism is explained.

**(c) Same-feeling pairs.**
- s1 guided 2 (Rhea sleeps 1-7 am → 6 h, under 7) = item 9 (6 hours → 1 more hour to reach 7). It is the same
  arithmetic on the same number. Replace item 9 with something about the app's own purpose: "Ravi scrolls in bed
  until 1:30 and has an 8 am class. Roughly how much sleep can he get?" → "About 6 hours, below the range."
- s1 guided 1 (16-year-old, teen range) and item 10 (teen range fill) are about teens. The user is 18-25, so both
  test a number that does not apply to them. Drop the teen line from teach and these two items.
- s3 guided 1 (ghrelin up), guided 2 (leptin down) and item 15 (ghrelin up + leptin down) are the same pair three
  times. Replace item 15 with transfer: "After a short night, Sana eats a big lunch but still wants samosas.
  Which hormone change explains still wanting food after eating?" → "Leptin is low, so she does not feel full."

**(d) Giveaways.**
- s2 guided 2: "It takes a month of short sleep to matter" / "Short sleep helps fast sports" are easy to rule out.
- Item 12: "His play may drop, since the early wake cut his sleep." (54) vs 44/32, and it reuses the teach's
  "early wake" wording.

**(e) Plain words.** Item 16: "Which change goes after the cause?" A tired reader must read this twice. Rewrite:
"What would most help Sana stop the cravings?" Item 13: "Stop-start hard effort", "Explosive jumps" — sport-science
words. Use "football-style sprints and stops", "jumping".

**(f) Example / step match.** Items 13 (order of drops: stop-start > speed > jumps) and 14 (afternoon race shows the
bigger drop) test study details that s2 never teaches. Item 14's answer goes against intuition, so the learner can
only guess. Either add one sentence to s2 teach ("…and the drop showed up most in afternoon events") or drop both.

**(g) India / tone.** Exam nights and the 4 am bus fit well. The big miss: the app exists to replace night-time
scrolling, and this concept never mentions the phone. Use one example such as "scrolls until 2 am, alarm at 7".
Item 16's "keeps raiding the canteen" leans towards food shaming; use "keeps feeling hungry between meals".

## heat-hydration (taught 3, fresh 2)

**(a) Steps distinct?** Mostly: plan (timing, slow start, water) / sweat loss / warning signs. s1 and s2 both end
in "drink more water", so the "drink more" idea is taught twice.

**(b) Teach cards.**
- s1 says "Heat makes the same work harder" but not *why* (your body is also busy getting rid of heat, so the heart
  works harder). Rewrite: "In heat your heart works to cool you as well as move you, so the same run is harder.
  Train early or late, start slow, drink more."
- s2 is fine. Say what to do about the salt: "on long, very sweaty days, nimbu-pani with a pinch of salt or ORS
  helps replace it". Otherwise item 13 asks *why* you lose salt and the learner never learns what to do.
- s3 lists signs and "stop", but leaves out the emergency case. It needs one line: "Confused, fainting or very hot
  to the touch is an emergency: call 108 or 112 and cool them with water and fanning." Guided 2 hints at this
  ("Confusion is a serious sign") without teaching it.

**(c) Same-feeling pairs.**
- s2 guided 1 ("Why does heavy sweat matter? It takes fluid out") = item 16 ("Why drink more in heat? Sweat takes
  more fluid out"). These are the same. Replace item 16 with the humid-city case: "In humid Mumbai, sweat drips but
  does not dry. Does Kabir lose less water than in dry Delhi?" → "No, he still loses it, and he cools less." This
  also links to ceiling-fans s2.
- s1 hook (early, slow, water) = item 9 (7 am vs 1 pm). Replace item 9 with a trade-off: "Practice is fixed at
  4 pm in May. What can still be changed?" → "Start slower, take water breaks, wear light clothes."
- s2 hook (1 L/hour) and item 12 (90 min → 1.5 L) are the same number again.

**(d) Giveaways.** Correct is the longest option in 14 of 17 questions here (P3), the worst rate in the file.
Examples: s1 hook 47 vs 35, s3 guided 2 49 vs 30, item 15 44 vs 32. Distractors nobody picks: "Thirst stops
working in the heat" (16), "So nobody needs water breaks" (15), "Cramps only happen in cold weather" (14), "To
make practice more of a race" (15). Use real Indian-ground beliefs instead: "Drinking water mid-match causes
stomach cramps", "Cramps just mean you need to stretch", "Pouring water on your head makes you fall sick".

**(e) Plain words.** "CDC names loose, light, light-coloured clothes" (s1 guided 1 hint) and "CDC says not to wait
for one signal" (s1 guided 2 hint). Both read twice; drop "CDC" and say "Wait for thirst? Experts say don't."
Item 11's "pick up the ___ gradually" uses "Pace", which is coach jargon. Use "speed".

**(f) Example / step match.** Item 10 (about 10 days for the body to get used to heat) is not taught in s1. It is a
useful idea: put "The body adapts to heat over about 10 days of training in it" in s1 teach, or drop item 10.

**(g) India / safety.** Ahmedabad, Chennai, Delhi, net practice: strong. Safety gaps: no emergency number, no
"never leave a dizzy friend alone", no humidity (most of coastal India). The "skip water to toughen up" option in
the s1 hook *is* a real belief; good that it is named, but the feedback should say clearly that it is dangerous.

## warmup-myths (taught 3, fresh 2)

**(a) Steps distinct?** Yes: warm-up = same move easier / long holds dull power / stretching is no injury shield.
s2 and s3 are both "stretching facts", and the learner may mix them up. Order them so s2 ends with "so do your
long stretches after, or keep holds short", which leads into s3.

**(b) Teach cards.**
- s1 explains why (heart and breath rise bit by bit). OK.
- s2 has no why. Rewrite: "A long still stretch leaves the muscle a little slack, so it springs less for a jump
  or sprint. Short holds cost much less."
- s3 is good, but the learner may leave thinking "warm-ups don't prevent injury, so skip them". Add: "Warm up
  anyway: it gets you ready to move."

**(c) Same-feeling pairs.**
- s3 guided 1 (stretch at 4, play at 5: has the range faded?) = item 16 (how long does extra range last? Under 30
  min). Replace item 16 with "Om stretches at home, then cycles 40 min to the ground. What should he do on
  arrival?" → "A short warm-up there."
- s2 hook, guided 1, guided 2, item 13 and item 14 all ask "long hold = more loss". Item 13 (4.6% recall) is pure
  number memory; drop it.
- s1 item 10 (fill: same lifts with ___ weight → lighter) restates guided 1. Drop it, or turn it into a cricket
  transfer for spin bowling.

**(d) Giveaways.** s1 hook ("Sit still and wait", 19), s1 item 10 ("Double" weight), s3 hook ("It doubles
injuries"), item 15 ("Stretching only works in cold weather"): nobody picks these. Length: s3 guided 2 42 vs 28,
s1 guided 2 36 vs 25, item 14 43 vs 33.

**(e) Plain words.** "power work" (takeaway s2) is jargon; use "jumps and sprints". In the s2 visual, "About 1.1%
less power" / "About 4.6% less power" means little to a learner. Use "jump about 0.5 cm lower" / "about 2 cm
lower".

**(f) Example / step match.**
- s1 guided 2 (what a cool-down does) is not taught in s1. Add "A cool-down is the same, in reverse" to s1 teach,
  or drop it.
- Item 12 ("long stretch, then 5 minutes of jogs and drills → no clear effect"). The step just taught that long
  holds dull power, and then the answer is "no clear effect". To a learner this feels like a trick. Teach it: add
  to s2 teach "Moving again after the stretch seems to cancel the drop." Otherwise drop the item.

**(g) India / safety.** School sports day and cricket bowling fit well. No safety issues.

## cardio-talk-test (taught 3, fresh 1)

**(a) Steps distinct?** Yes: voice test / 0-10 scale / vigorous counts double. s1 and s2 are two ways to measure the
same thing; the link is never stated ("talk not sing ≈ 5-6").

**(b) Teach cards.**
- s1 and s2 are good, practical tools.
- s3: "Harder minutes count double." It never says *why* (the heart and lungs work about twice as hard each
  minute, so they get about the same training in half the time). Rewrite: "A vigorous minute works your heart
  and lungs about twice as hard, so it counts about like two moderate minutes."

**(c) Same-feeling pairs (the worst in Body).**
- s3: hook (30 walk ↔ 15 run), guided 1 (60 → 30), item 15 (40 → 20) and item 16 (150 → 75) all mean "halve
  it". That is four questions, one operation: exactly the inflation complaint. Keep the hook and item 16. Replace
  guided 1 with a mix: "Kavya walks 20 min and runs 10 min. How many moderate minutes is that worth?" → 40.
  Replace item 15 with a judgement: "Which week reaches 150: 3 × 25-min runs, or 5 × 20-min strolls?" → "the runs
  (150 equivalent); slow strolls may not even be moderate."
- s1: hook (chat but not sing), guided 1 (sentences, no singing), item 11 (fill: talk but not ___ → sing) and
  item 10 (talking counts) are four "talk not sing" questions. Replace item 11 with s1↔s2 linking: "You can say
  only a few words per breath. About what number on 0-10?" → 7-8.
- s2 guided 1 (Pooja 6 → moderate) and guided 2 (Mohit 3 → below) only read the scale back. One of them should
  be a judgement: "Mohit rates a stroll 3 and thinks it counts as moderate. What could he change?"

**(d) Giveaways.** Item 14: 63 chars vs 33/25; "10 means a light warm-up" nobody picks. Item 10: 50 vs 27/41.
Hints give the answer (P6): s1 guided 1 "Talk but not sing.", s2 guided 1 "Moderate is 5 or 6.", s3 guided 1
"Halve the minutes."

**(e) Plain words.** "Vigorous" is used throughout and never glossed. Add "(hard)" the first time: "vigorous
(hard)". "credit of 60 moderate minutes" (s3 guided 1, item 15): "credit" is unclear. Use "to count the same as
60 minutes of brisk walking".

**(f) Example / step match.** Matches.

**(g) India / tone.** Metro stairs and the train: good. Item 15 ("20 minutes before his train, run hard"): a hard
run straight after sitting should still start with a short warm-up, which links back to warmup-myths.

## showing-up (taught 2, fresh 2)

**(a) Steps distinct?** The three steps (any bout counts / 150-300 a week / start small) are distinct, but the title
"Habit of showing up" and the owner's whole problem (night scrolling, planning) suggest *habit mechanics*. None
are taught here: no cue, no "same time each day", no "two-minute version". As it stands this is a WHO numbers
lesson, and s2 overlaps cardio-talk-test s3 (150 minutes). Either rename it ("How much movement counts") or
rewrite s3 as a habit step: "Tie it to something you already do: after the 6 pm class, climb the stairs once."

**(b) Teach cards.**
- s1: "The old rule of 10 minutes or more was dropped." This is guideline history, not a reason. Rewrite: "Every
  bit of movement adds up, so short bursts count. Even a few flights of stairs adds to your weekly total."
- s2 states a number. Fine as a fact, but give the reason in five words: "linked to lower disease risk".
- s3 is fine.

**(c) Same-feeling pairs.**
- s1 hook (5-min stairs count?), guided 2 (three 5-min walks), item 9 (Kiran's three 5-min walks: count?) and the
  example are the same idea four times. guided 2 and item 9 are nearly word for word.
- s2 guided 1 (25 × 6) and item 13 (300 ÷ 6) are both arithmetic, not understanding.
- s2 item 14 (split across the week) repeats the teach card.

**(d) Giveaways.** s1 guided 2 "Planning a workout for later" / "A day spent sitting" are easy to rule out. Item 11
47 vs 33. Item 16: "Fast rises always work better" and "Activity only counts after a month" are absurd.

**(e) Plain words.** s1 guided 1 "Which old rule did the newer guidelines drop?" A learner cannot care about this;
drop it. Item 10: "WHO says that for all groups…" ("all groups" is report language). Use "for everyone".

**(f) Example / step match.** s2 guided 2 ("what else on 2 days? Muscle work") and item 11 test muscle work, which
the s2 teach never mentions. Add "plus muscle work on 2 days" to the s2 teach (it is in the rule) or drop both.
Item 12 (sit less) is not taught in s1.

**(g) India / tone.** Exam days and cycling to college fit well. Non-shaming: Leena's example ("still thinks the day
does not count") is a nice touch.

## food-labels (taught 4, fresh 3)

**(a) Steps distinct?** Yes, the clearest steps in Body: per 100 g / ingredient order / total vs added sugar.

**(b) Teach cards.** All three explain the how. s1 could add *why* serve sizes differ ("makers pick small serves so
the numbers look small"). That is a useful, memorable reason.

**(c) Same-feeling pairs.**
- s2 guided 2 (sugar first vs fifth) = item 12 (jaggery first, then peanuts) = s2 hook. All three ask "first
  listed = most". Replace item 12 with a trick label: "A 'multigrain' biscuit lists maida first, then sugar, then
  oats. What is it mostly?" → "Maida." That is a real Indian label trick.
- Item 13 (60/30/10 → order) gives the percentages and asks for the order. No reasoning.
- Item 10 (8 g vs 6 g per 100 g) is answered by "8 > 6" and needs no idea from the step.

**(d) Giveaways.** Item 10 "Chips A." (8) is the obvious answer. Item 15 (fill "Added") repeats the teach word.
s1 guided 2 (200 g ÷ 4) tests division, not labels.

**(e) Plain words.** "serve" vs "serving": both are used (s1 guided 2 says "servings", the teach says "serve
sizes"). Pick "serving" throughout; that is what Indian packs print. "%RDA" (item 16) is never explained.

**(f) Example / step match.** Item 14 (a stressed ingredient must show its %) and item 16 (%RDA against a 50 g
daily reference) test rules no step teaches. Item 14 is a great idea: put it in s2's example ("the mango picture
on the front means the label must say how much mango: 10%") and keep the item. Item 16: teach the 50 g
reference in s3 or drop it. Item 11 (law sets serve size at 100 g) tests a misreading nobody has.

**(g) India.** Namkeen, chikki, jaggery and mango drink are all good. "No added sugar" on fruit drinks is a real
trap, and s3 handles it well.

---

# How things work

## lift (taught 4, fresh 2)

**(a) Steps distinct?** Yes: needs moving air / turns air down, air pushes up / speed squared. Clear and well
ordered. s3 slips in "lift = weight in level flight" (guided 2, item 16), which is a fourth idea.

**(b) Teach cards.** s2 is excellent (Newton's 3rd law in plain words, myth busted). s3 says *what* (speed²) but
not *why*. Rewrite: "Go twice as fast and twice as much air hits the wing, each bit twice as hard. 2 × 2 = four
times the lift."

**(c) Same-feeling pairs.**
- s1: hook (kite on still day), guided 1 (wing in airless box), guided 2 (parked plane), item 9 (glider let go on
  still day), item 10 (wing on the Moon, no air) and item 11 (options: still room, empty space) are six "no
  moving air" questions. The airless case appears three times (guided 1, item 10, item 11c). Keep the hook,
  guided 1 and item 10. Replace item 9 with "A kite in a steady wind, string held still: does it fly?" → yes, the
  wind is the moving air (it reverses the idea). Replace item 11 with a ceiling-fan link: "Why do fan blades,
  which are little wings, push air at all?"
- s3 guided 2 (level cruise: lift = weight) = item 16 (fill: lift equals its ___ → weight). The same.
- s3 guided 1 (3× speed → 9×) and item 15 (2× → 4×) are both speed². Keep one and replace the other with a
  practical one: "Why do planes need long runways?"

**(d) Giveaways.** s2 guided 2: "No, flat wings lift too." gives the reason inside the answer. Item 11: "A kite
held still in a steady wind" is the only option containing "wind".

**(e) Plain words.** "newtons" (item 15) is OK for science students, but "100 newtons" means nothing physical. Add
"(about the weight of a 10 kg bag)".

**(f) Example / step match.** Matches. s2 guided 2 (the equal-transit myth) is good teaching, but it sits as a
*guided* try with no teach line about the myth. Add "(The 'air on top must race to catch up' story is wrong.)" to
the s2 teach.

**(g) India.** Bus window hand, kite, train. Good.

## multirotor-turns (taught 4, fresh 3)

**(a) Steps distinct?** Yes: share the weight / uneven thrust tilts and moves / spin pairs for yaw. Good.

**(b) Teach cards.** All explain. s3 "Each spinning rotor twists the body the other way" needs a picture or analogy
(spin a ceiling fan's motor on the floor and its body turns the other way). The flow visual does not show the
twist.

**(c) Same-feeling pairs.**
- s1 hook (2 N ÷ 4), guided 1 (12 N ÷ 4) and item 9 (20 N ÷ 4) are division by four three times. Replace item 9
  with "One rotor fails on a 4-rotor drone. Can the other three hold it, if each can give at most 30% of its
  weight?" → No (90% < 100%).
- s2 guided 1 (roll right → left rotors harder) and item 14 (match roll right ↔ left rotors) are the same pair.
- s3 item 16 (why it does not spin on its own) = s3 hook (why two spin each way). The same answer, "twists
  cancel".

**(d) Giveaways.** s3 guided 1 31 vs 15/14, guided 2 37 vs 22. Item 16 "Its GPS holds the nose still" is weak.
Item 12: options a/b are mirror images of equal length; that one is good.

**(e) Plain words.** "pitch", "roll" and "yaw" are in the rule, not in the steps; fine. "thrust" is used from s1
without a gloss. Add "(upward push)" the first time. "spin pairs" (s3 takeaway) is unclear; use "the clockwise
pair and the anticlockwise pair". Indian English says "anticlockwise", not "counterclockwise" (also in
ceiling-fans).

**(f) Example / step match.** Matches.

**(g) India.** Cricket pitch, school fair, college drone race: fine.

## battery-flight-time (taught 3, fresh 3)

**(a) Steps distinct?** Yes: energy ÷ power / weight costs more power / peak at about two thirds. Good arc.

**(b) Teach cards.**
- s1 explains.
- s2: "Power climbs faster than thrust." No why. Rewrite: "To lift more, the rotors must throw air down faster.
  Faster air costs much more energy, so twice the weight needs nearly three times the power."
- s3 states the peak at two thirds without the reason (which s2 sets up). Rewrite: "Each extra bit of battery
  adds energy but also weight, and weight costs power. Past about two thirds battery, the weight costs more than
  the energy adds."

**(c) Same-feeling pairs.**
- s1 hook (50 Wh / 100 W), the example (60/120), guided 1 (100/200) and item 9 (50/200) are four
  energy ÷ power divisions, three of them with the answer "half an hour". Keep the hook and item 9. Replace
  guided 1 with "To fly twice as long, what are two ways?" → "double the energy or halve the power".
- Item 10 (A 80 W vs B 160 W) = s1 guided 2 (one uses power twice as fast). The same.
- Item 13 (twice as heavy → nearer 3×) repeats the s2 teach and visual.

**(d) Giveaways.** Item 15 55 vs 40. Item 16 78 vs 42/42, and "Flying batteries make the motors stronger" nobody
picks.

**(e) Plain words.** s2 guided 1 hint: "Power goes as weight to the 1.5 power: 4 times the square root of 4."
That is a formula in a *guided* try, and it reads twice. Replace with a teachable step: "Twice the weight ≈ 3×
power. Twice again ≈ 3× again."

**(f) Example / step match.** Item 16 ("the Berkeley flying battery test") is never mentioned in any step. The
learner cannot know it. Either add it as the s3 example ("Berkeley engineers had small drones carry fresh
batteries to a big one, so it never needed one huge battery") or drop it.

**(g) India.** "delivery drone", "college team camera" are fine. A phone-battery or e-scooter link would be closer
to life ("why your phone does not just carry a bigger battery").

## flight-sensors (taught 3, fresh 3)

**(a) Steps distinct?** Yes: motion sensors / GPS / barometer. Good.

**(b) Teach cards.**
- s1 says what each sensor senses but not *how* (a tiny weight inside the chip gets pushed when the drone moves).
  One clause would make it teaching: "A tiny mass inside the chip gets pushed when the drone turns or speeds up."
- s2 is good.
- s3: "Higher up, the air is thinner, so air pressure drops." It leaves out why thinner air means lower pressure:
  less air above you pressing down. Rewrite: "Air pressure is the weight of the air above you. Climb higher and
  there is less air above, so pressure drops."

**(c) Same-feeling pairs.**
- s1 guided 2 (balance indoors, no signal), item 10 (Ravi: needs GPS to know tilt?) and the s1 hook (hall with no
  GPS) are three "works without GPS" questions.
- s2 order item 14 (signals → time → position) repeats the s2 visual and example word for word.
- s3 hook (pressure drops going up) = guided 1 (pressure rose → went lower) reversed. That is OK as guided; item 15
  (why drops? thinner air) is a third pass.

**(d) Giveaways.** Item 9 57 vs 38/29; item 10 52 vs 31; item 12 50 vs 33; item 16 56 vs 39. In item 16 the
answer is the only option listing three different sensors. Item 11 "an ___": the article "an" rules out
"Barometer".

**(e) Plain words.**
- s1 guided 1 adds "compass" as a distractor, but compasses are never mentioned. Either teach it or swap it for
  "the barometer".
- s3 guided 2: "What is standard air pressure at sea level? About 1013 hectopascals." This is a unit fact, not an
  idea, and "hectopascals" is jargon. Replace: "A drone's barometer reads the same pressure as the ground. Where is
  it?" → "about at ground level".
- Item 13 ("within 4.9 m … how wide is the circle?") is a radius/diameter trick that tests geometry, not GPS.
  Replace: "Why might a GPS-only drone land 3-5 m off its pad?"
- "flight board" (s1, s3 teach): use "the drone's small computer".

**(f) Example / step match.** Matches.

**(g) India.** Train platform roof: good, and familiar from phone maps. Item 12 could say "like your Ola/Uber dot
jumping under the metro".

## birds-and-planes (taught 2, fresh 1)

**(a) Steps distinct? No.** s1 "wings lift, engines push" and s2 "engines beat drag, not weight" are one idea taught
twice. s2's glider also repeats lift-s1 (glider, moving air). Items 10, 12, 13 and 14 all ask "what holds the plane
up? the wings". Fix: merge s1+s2 into one step "Planes split the jobs: wings lift, engines beat drag". Make a new
s2 "Why a bird must flap": with no engine, the wing must make its own forward push, so it flaps and tilts each
stroke. Then s3 can be "A downstroke does the work". That also fixes the s3 overload below.

**(b) Teach cards.**
- s1 lists four forces, a textbook list. Rewrite: "Wings hold a plane up. Engines only push it forward against
  air drag. A glider has no engine and still flies."
- s3: "At takeoff, small parrots tilt their strokes, so lift points forward to speed up, and drag helps hold them
  up." The tired reader must read this three times: "lift points forward" and "drag holds them up" both turn the
  words just learned upside down, with no explanation. Rewrite: "A bird has no engine, so its wing does both jobs.
  Each downstroke pushes air down *and back*, so the bird is lifted and pushed forward."

**(c) Same-feeling pairs.**
- s1 hook (what keeps a jet up? air past wings) = item 10 (jet climbs, what lifts it? air over wings). Identical.
- s2 hook (glider can fly?) = item 13 (glider let go, what next?) = item 14 (why can a glider fly?) = s2 guided 1
  (which flies with no engine? glider) = s2 guided 2 (engine stops, wings still lift). Five glider questions in one
  step.
- s1 guided 2 (balanced forces → steady) and item 9 (thrust = drag in cruise) are the same balance.

**(d) Giveaways.** Correct is the longest in 12 of 16. Item 16 75 vs 47/28; item 14 46 vs 29; s3 hook 41 vs 23/15.
s2 guided 2: "Nothing at all" / "Push it higher". s1 guided 1 ("which force pulls down? Weight") is a
definition, not a try.

**(e) Plain words.** "parrotlet" appears in the s3 example, guided tries and item 15 but is never introduced (the
teach says "small parrots"). Say "a small parrot" throughout.

**(f) Example / step match.** s3 guided 1 ("drag can hold up nearly half its weight") and guided 2 ("on landing it
aims lift backward") are new facts from one study, never taught. Guided tries should practise the teach card.
Drop both and use "Which part of the flap does most of the work?" (it matches the example).

**(g) India.** "Near Delhi, a glider" is a token; nothing in the concept connects to Indian life. Pigeons, crows or
kites (the bird) taking off from a balcony would land much better than parrotlets.

## ceiling-fans (taught 3, fresh 1)

**(a) Steps distinct? No.** s2 "a breeze dries sweat, the air does not get colder" and s3 "fans cool people, not
rooms" are the same idea. s1's title ("pushes the room's own air") is again "it does not make cold air", while its
teach card is actually about *spin direction*. Effective content: one idea (fans cool skin by evaporation, not air)
plus one piece of trivia (direction).

**(b) Teach cards.**
- s1 teaches spin direction, which most Indian fans cannot change (most are not reversible) and which barely
  matters in Indian winters. That is low value, and it is memorisation ("counterclockwise in summer"). Replace s1
  with "A fan moves air; it adds no cold". Explain how: the blades are tilted like little wings and push air down
  (links to lift-s2).
- s2 is good (evaporation explained).
- s3 should become a *new* idea: "In humid weather, sweat dries slowly, so a fan helps less". That is very
  relevant for Mumbai, Chennai and Kolkata, and explains why a fan feels useless on a sticky monsoon night. The
  "empty room wastes power" point fits as one line in s2.

**(c) Same-feeling pairs (worst in the file).** "Does the fan make the air cold? No" appears in s1 guided 2, item 9,
s2 hook, s2 guided 1 (spoon), s2 guided 2 (thermometer), item 11 (thermometer after ten minutes), item 13 (Meera
says it makes cold air), s3 hook (empty room), s3 guided 2, item 15 (empty common room) and item 16. s2 guided 2
and item 11 are both "what does the room thermometer read?". s3 hook, the s3 example and item 15 are all "fan in
an empty room".

**(d) Giveaways.** s2 hook 41 vs 23/23; item 16 59 vs 38; item 13 42 vs 28 plus "Nothing, fans make cold air".
s2 guided 2 "Makes it read zero" nobody picks. s3 guided 2 "Turn it up to chill the walls" nobody picks.

**(e) Plain words.** Item 14 ("4°F warmer … how many degrees Celsius") is a US-unit conversion with no value to an
Indian learner. State 2°C directly and ask something else. s3 teach "it lets you set the AC about 2°C warmer":
most hostel students have no AC. Add a non-AC angle (a fan uses a small fraction of an AC's power).

**(f) Example / step match.** s1 example "Tap the setting that makes the breeze → spins counterclockwise" turns a
direction into the "idea", which spec 14 did not intend for `spot`.

**(g) India / tone.** "switch off when you leave" plus "Anu leaves for her exam … cooling no one" are fine but
mildly preachy when stated three times (s3 example, guided 2, item 15, takeaway). Say it once.

## upi-path (taught 4, fresh 3)

**(a) Steps distinct?** Yes: ID = address / NPCI carries, banks move / PIN only for money going out. Very relevant,
well chosen.

**(b) Teach cards.** All three explain. s3 is the most useful safety lesson in either file. It needs the scam
pattern *in the teach or example*, not only in item 14: "Scammers send a 'collect request' and call it a refund.
Entering your PIN pays them."

**(c) Same-feeling pairs.**
- s1 item 10 (Kiran's ID holds ₹2,000?) = the s1 hook (wallet that stores money?) = the takeaway. The same.
- s2 guided 2 (2 a.m. holiday, does it go through?) = item 13 (midnight, branch shut, does it go through?).
  Identical.
- s3 hook (getting money needs no PIN), guided 1 (prize needs PIN?), item 14 (collect request "refund") and item 16
  (match: receiving → no PIN) are the same rule four times. That is acceptable for the key safety point, but
  vary them: one should be "Someone asks you to *scan a QR* to receive money".

**(d) Giveaways.** s3 guided 2 62 vs 34; item 10 48 vs 25, with "The ID holds only ₹1,000" nobody picks; s2 hook 47
vs 35; s1 hook 44 vs 32. Item 15 (fill: UPI ___ → PIN) is trivial after the step.

**(e) Plain words.**
- s1 guided 2: "To pay Asha by her UPI ID, what do you not need?" A negative question; tired readers miss the
  "not". Rewrite: "Asha shares her UPI ID. What does that save you from typing?" → "her account number and IFSC".
- The s3 visual line "No QR scan" under "Getting money" is unclear (scan whose QR?). Use "You never scan or enter
  a PIN to *receive*".
- Item 12 (16.58 billion a month → per day in millions) is a unit-conversion puzzle unrelated to how UPI works.
  Drop it or make it a feel-for-scale: "About how many UPI payments happen in India each *second*?" (≈ 6,000).

**(f) Example / step match.** s2 guided 1 (any app works, whatever your bank) and guided 2 (24x7) are not in the s2
teach. Add "…any UPI app, any bank, any hour" to the teach.

**(g) India.** Excellent relevance (chai, canteen, ₹ amounts).

## phone-camera (taught 3, fresh 3)

**(a) Steps distinct?** Yes: spot → signal / colour filter grid / dim light → ISO grain. But s3's tries test a
fourth idea (aperture).

**(b) Teach cards.**
- s1 is good.
- s2 is good, but "two are green" has no why (our eyes are most sensitive to green). Add it; it is the kind of
  fact that sticks.
- s3: "The phone turns up its boost, called ISO. That makes the photo bright but grainy." It does not say why
  boosting adds grain (it boosts the random noise along with the weak signal). Rewrite: "In dim light the signal
  is weak. The phone turns it up (ISO), but that turns up the random speckle too, so the photo looks grainy."

**(c) Same-feeling pairs.**
- s1 guided 1 (twice the light → twice the signal) = item 9 (a quarter of the light → a quarter of the signal).
- s2 guided 1 (share green: half) = item 12 (12 million → 6 million green). The same fact.
- s1 item 11 (order lens → sensor → software) repeats the s1 visual.

**(d) Giveaways.** s3 hook: "Little light reached the sensor, so the phone boosted a weak signal." (68) vs 31/29.
This is the worst giveaway in the file: it is twice as long and contains the whole teach card. Items 13/14 55/57
vs 36/37.

**(e) Plain words.** "ISO" is introduced; fine. "lens opening" (s3 guided) is never taught.

**(f) Example / step match.**
- s3 guided 1 (opening twice as wide → four times the light) and guided 2 (phone lens opening is fixed) and item
  16 (bigger opening → more light) all test aperture, which the s3 teach never mentions. Replace the guided tries
  with ISO tries: "Same dark room, phone holds the shutter open longer instead of boosting. What is the risk?" →
  "blur if your hand moves" (ties to night mode).
- Item 10 (sensor first made at NASA's JPL) is history trivia and cannot be reasoned. Drop it.

**(g) India.** Night wedding and college fest are good. Add night mode: every Indian phone user knows "hold still
for 3 seconds", which is the same idea.

## sky-colours (taught 4, fresh 3)

**(a) Steps distinct?** Yes: white is a mix / air scatters blue / long path at sunset. Clean.

**(b) Teach cards.** All explain. s2 could add *why* violet is not what we see (eyes are less sensitive to it, and
there is less of it in sunlight), because a sharp learner will ask after s1's "violet is shortest".

**(c) Same-feeling pairs.**
- s1 guided 1 (which has the longer wave? red) and guided 2 (violet or orange shorter?) and item 9 (order by
  wavelength) are three times the same ordering.
- s2 hook, the s2 example, item 13 (Raj: air is blue) and the takeaway all say "air scatters blue". Item 13 is the
  third pass.
- s3 guided 2 (low sun → longer path) repeats the s3 teach directly.

**(d) Giveaways.** Item 15 83 vs 55/42, the longest correct option in the file. Item 13 52 vs 29 with "Nothing, the
air is blue". Item 12 47 vs 30.

**(e) Plain words.**
- s2 guided 1: "Scattering goes as 1 over the wavelength to the fourth power. If one wave is half as long, how much
  more does it scatter?" This is a physics formula on a phone at night, inside a *guided* try. Rewrite: "Half the
  wavelength scatters about 16 times more. Blue waves are about two thirds as long as red. Does blue scatter
  a little more, or several times more?" → "several times more".
- Item 11 needs (700/400)⁴ = 9.4, which you cannot work out in your head. Drop it, or give the answer as a fact
  in the teach card.
- "molecules" is fine for this audience.

**(f) Example / step match.** Item 10 (Moon sky black: no air to scatter) is in s1, but scattering is taught in s2.
Move it to s2. Item 12 (clouds white: droplets scatter all colours) is a new idea, never taught. Add one line to
the s2 teach ("Bigger bits, like cloud droplets, scatter all colours, so clouds look white") or drop it. Item 16
(lunar eclipse red) is a great transfer question. Keep it, but it needs the eclipse set-up explained in the stem.

**(g) India.** Train-window sunset, cricket match. Good. s3 guided 1 (smoke/dust → redder sunset) is very Delhi;
good, and could name Diwali smog or crop-burning haze.

## pressure-cooker (taught 4, fresh 3)

**(a) Steps distinct?** Yes: boiling point depends on pressure / sealed cooker reaches about 121°C / vent weight keeps
it steady. Excellent everyday topic.

**(b) Teach cards.**
- s1: "the air presses less, so water boils below 100°C". Why does pressure set the boil? Water must push its
  steam out against the air; less air pushing back means it boils sooner. Add that clause.
- s2 is good.
- s3 is good. Add the whistle link explicitly, since every Indian learner counts whistles: "Each whistle is the
  weight lifting to let steam out."

**(c) Same-feeling pairs.**
- s1 hook (mountain, below 100), the example (hill town dal), item 9 (trek rice, longer), item 11 (fill: lower)
  and guided 1 (193°F → 89°C) are five "hills = cooler boil" questions. Item 11 is the weakest; drop it.
- s2 guided 2 (why food cooks sooner: hotter water), item 13 (Kavya vs Raj: hotter water) and item 14 (Sana:
  pressure squeezes flavour; answer: hotter water) give the same answer three times.
- s1 guided 2 (turn the flame up: temperature stays) and item 10 (why a big flame does not heat boiling water) are
  the same.

**(d) Giveaways.** Item 10 73 vs 36/29, the second-worst in the file. Item 14 61 vs 35. s3 guided 1 50 vs 25/23.

**(e) Plain words.** s1 guided 1 "At 10,000 feet, water boils at about 193°F": feet and °F in an Indian app.
Rewrite: "In Leh, about 3,500 m up, water boils below 90°C. Why does dal take longer there?" Item 12 (psi) has
the same problem; Indian cookers are rated in kg/cm². Drop it or convert.

**(f) Example / step match.** Item 16 ("By the Indian standard, how full may the cooker be? No more than half full
for rice, which swells") is a *safety rule* no step teaches. The distractor "Up to two thirds, the general limit"
introduces a second untaught number. This belongs in s3's teach or as a guided try. It is the most useful safety
fact in the concept; teach it, don't spring it.

**(g) India / tone / safety.** Rajma, chana and dal are perfect. The s2 example "Amma seals the rajma" puts the
cooking with the mother; vary it ("Kabir seals the rajma"). That matters for a 20-year-old hostel user who cooks
their own food. Safety: s3 guided 2 ("wait until pressure has fully dropped") is good. Add "never force the lid,
never cover the vent" to the takeaway.

---

## Suggested order of work

1. P2: give every untaught item a teach line, or drop it (list above). This is the direct fix for "you are not
   teaching me".
2. Merge birds-and-planes s1+s2 and ceiling-fans s2+s3, and write one new step for each (bird must flap; humidity).
3. In every step, keep at most two questions on the same fact. Swap the rest for transfer, reverse or
   "spot the exception" questions (named pairs above).
4. Rewrite distractors so that at least one is as long as the answer and is a real belief (P3, P4). Re-run the
   length count: target ≤ 40% strictly longest.
5. Strip source names and US units from learner text (P8, P9).
