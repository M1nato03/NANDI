# Fact-check: "Try it: drawing" draft (cj7, Job 7)

> Review of `content-drafts/topic.try-drawing.json` on `ideas/cj6-drawing-starter` (version 0.1.0, "No fact-check verdicts yet").
> Method copied from `docs/reviews/cj6-factcheck-talk.md` on `ideas/cj6-factcheck-talk`.
> Date: 24 Oct 2026. Branch: `ideas/cj7-factcheck-drawing`. Nothing in `content/`, the draft pack or app code was changed.

## Summary

- **Count matches the cj6 report:** 1 module, **3 concepts, 9 steps, 18 items** (6 per concept). The draft also has
  12 claims, 10 misconceptions, 3 quests (9 days of tasks), 9 guided tries, 9 Show me examples and 112 feedback lines.
  Every one has a verdict below.
- **No line says the studies ran in India.** But no line says where they did run either: US art and non-art students,
  US older adults aged 65-87, US undergraduates with no drawing training. Add the setting line in §3.
- **Main problems (fix before any pack work):**
  1. **The Day 2 quest number points the wrong way** (W). "Aim for 30 ticks" in 10-15 minutes is one look every
     20-30 seconds. In Cohen 2005 that is about the *slowest* rate tested (0.034 Hz, one look every 30 s), which gave the
     least accurate drawings. People who were left alone looked about every 3-4 seconds (0.24-0.32 Hz). The target
     would teach people to look up *less* than they already do.
  2. **The upside-down step understates the finding and mislabels the "third study"** (W/P). Both face studies found
     that some spacing between features came out *worse* upside down, not just "no gain". The "small gain when art
     experts judged" came from a face-*tracing* task with a line limit, not from copying.
  3. **Look-often has a beginner caveat the draft leaves out** (P). In Cohen 2005 Experiment 2, novices showed no effect
     of gaze rate. The effect held for novices in Experiments 3 and 4, which tested slower rates. Still fine to teach;
     claim `dws-c2` should say "for beginners too in two of three tests" (§6).
  4. **Most "how to" tips are given as findings** (P). "Outline first", "hold a pen at arm's length", "hold the page
     beside the object and step back", "keep sessions short" and "draw what you like" were not tested by any source.
     The cj6 report says so; the learner copy does not. One shared line per step fixes most of these.
  5. **The extra steps stretch two papers** (P). Vodyanyk & Jaeggi 2025 found time was the top drop-out reason, but
     the denser schedule (daily practice) had *lower* completion than the lighter one (47% vs 64%, not significant). The
     paper does not say short sessions help. Its "gained a lot" (d = 1.27) is a pre-post change; the paper's own
     estimate of the course effect is 0.45 SD. The 10-week group practised 2-3 times a week, not daily.
  6. **One Show me example has two right answers** (W): `dpw-s7` (parts 1 and 2 are both fair ways to judge the
     week).
  7. **The topic says "Seven short drawing tries"** (W). The pack has 9 steps and 9 quest days.
- **Quests:** all are ₹0 with paper and a pen, safe, and doable in a hostel room. One fix: "your bike" assumes a bike
  and one that is in the room (§5).
- **No health claim, no talent promise, no guilt line found.** Two wrong options use "no talent"; both are answered
  without shame. Vodyanyk & Jaeggi's mindfulness and "cognitive aging" results are not used. Keep it that way.
- **Tally** (all units in §5-§9): 229 verdicts. **S 138 · P 86 · W 4 · R 1.** Most P lines are untested tips that one
  "art-class tip, not tested" line per step would cover (§4).

## 1. How this was checked

| Step | What I did |
|---|---|
| Inputs | `git show` of the pack and of `docs/reviews/cj6-drawing-starter.md`. Flattened the JSON and read every text field. |
| Counts | Script over `body.modules[].concepts[]`: 3 concepts × 3 steps × 6 items; 58 item option feedbacks. |
| Sources | Opened every cited source myself (table in §2). I read four of them in full, two of them for the first time in this project (Cohen 2005, Schlegel 2015). |
| Verdicts | **S** = supported, quote in §2. **P** = goes past the source (says how). **W** = wrong. **R** = wording risk (guilt, pressure, stereotype, health or talent promise, unsafe or paid quest). One verdict per unit. Plain scene lines with no claim are judged as part of their Show me or guided try. Advice lines that make no factual claim are S. |
| Rewrites | Exact text for every P, W and R where a fix is needed. "Keep" = accepted as practice framing with no change, usually once the step carries the tip line in §4. |

## 2. Sources opened, and the quotes used

| id | Source | Where I read it | Opened? |
|---|---|---|---|
| cw16 | Chamberlain & Wagemans 2016, *Neurosci. Biobehav. Rev.* 65 | Accepted manuscript PDF, https://research.gold.ac.uk/id/eprint/20010/1/Chamberlain%20%26%20Wagemans%20-%20Errors%20in%20drawing%20pre%20formatting%20.pdf (record page https://research.gold.ac.uk/20010/) | Yes, full text |
| cohen05 | Cohen 2005, *Perception & Psychophysics* 67(6) 997-1009 | Publisher PDF served free by Springer, https://link.springer.com/content/pdf/10.3758/BF03193626.pdf; abstract also via NCBI E-utilities (PMID 16396008) | Yes, full text (new: cj6 had the abstract only) |
| cb97 | Cohen & Bennett 1997, *JEP: HPP* 23(3) 609-21 | Abstract via NCBI E-utilities, PMID 9180037 (https://pubmed.ncbi.nlm.nih.gov/9180037/); also described in cw16 | Abstract only. No open full text found. |
| ost16 | Ostrofsky, Kozbelt, Cohen, Conklin & Thomson 2016, *Empirical Studies of the Arts* | Full PDF, https://oudev.stockton.edu/social-behavioral-sciences/documents/ostrofsky2016inversion.pdf | Yes, full text |
| schlegel15 | Schlegel et al. 2015, *NeuroImage* 105 440-451 | Full PDF on the Dartmouth lab site, https://bpb-us-e1.wpmucdn.com/sites.dartmouth.edu/dist/9/2172/files/2020/01/62.pdf; abstract via E-utilities (PMID 25463452) | Yes, full text (new: cj6 had the abstract only) |
| vj25 | Vodyanyk & Jaeggi 2025, *Research on Aging* | Full text XML, Europe PMC REST API, https://www.ebi.ac.uk/europepmc/webservices/rest/PMC12102519/fullTextXML (the pack's URL https://europepmc.org/article/PMC/PMC12102519 returned HTTP 403 to my script; it is the same record) | Yes, full text |
| wf17 | Woolley & Fishbach 2017, *PSPB* 43(2) 151-162 | Abstract via E-utilities, PMID 27899467 (https://pubmed.ncbi.nlm.nih.gov/27899467/) | Abstract only. No open full text found by search. |

The pack's `cb97` URL (https://europepmc.org/article/MED/9180037) also returned 403 to my script. PubMed URLs returned
HTTP 203 (bot page) to `curl`; I read the same records through E-utilities `efetch`.

### Quote bank

| Q | Quote (exact) | Source |
|---|---|---|
| Q1 | "accurate perception of the subject and of the drawing is at the heart of drawing proficiency" | cw16, abstract |
| Q2 | "negative categorical schemas, which distort the drawn image by replacing perceptual content with labels or canonical percepts, and positive pictorial schemas, which help the artist to segment the visual scene in systematic ways that aid depiction" | cw16 |
| Q3 | "the use of negative space or squinting to eliminate local detail can be seen as tools for suppressing negative categorical schemas, whilst plotting the pivotal points on a human body and using anatomical knowledge of musculature can be seen as positive pictorial schemas" | cw16, Conclusions |
| Q4 | "Perdreau and Cavanagh (2015) recently found that individuals who could identify changes in both their drawing and the to-be-drawn object subsequently produced better drawings. This suggests that misperception of one's drawing plays a greater role than Cohen and Bennett (1997) … initially concluded" | cw16 |
| Q5 | "The various conditions participants underwent included: tracing a photograph, drawing a photograph, drawing a tracing, and tracing a tracing." … "Despite some methodological limitations, this early study provided the impetus for more controlled investigations" | cw16, on cb97 |
| Q6 | "Ostrofsky, Kozbelt and Jones (2015) found that there was a correlation between perceptual reproduction of angles embedded in triangles (no 3D cues) and quadrilaterals (3D cues) and errors made when drawing the same angles. Similarly, Chamberlain, McManus, Riley, Rankin and Brunswick (2014) found that context-free angular reproduction accuracy correlated with the drawing accuracy." | cw16 |
| Q7 | "Evidence for a connection between strength of visual illusions and drawing errors is inconclusive." | cw16 |
| Q8 | "two studies which have investigated this phenomenon have found either no impact of inverting an image on drawing accuracy (Cohen & Earls, 2010), or a small positive effect when observers with artistic expertise were asked to judge the drawings (Kozbelt, Seidel, ElBassiouny, Mark, & Owen, 2010)" | cw16 |
| Q9 | "In a causal study, Cohen (2005) found that increasing the rate of gaze shifting between drawing and to-be-drawn object increased drawing accuracy, suggesting that reduced reliance on visual memory leads to more accurate drawing." | cw16 |
| Q10 | "Cohen and Bennett (1997) argued that both artists and non-artists are affected to the same extent by visual illusions, which they define as perceptual effects that cannot be corrected by a force of will." | cw16 |
| Q11 | "Taylor and Mitchell (1997) found that both student artists and non-artists exaggerated the circularity of an ellipse when attempting to match it on a computer screen" (filed under perceptual constancy, an *illusion*, not under knowledge) | cw16 |
| Q12 | "(a) motor coordination is a very minimal source of drawing inaccuracies, (b) the artist's decision-making process is a relatively minor source of drawing inaccuracies, and (c) the artist's misperception of his or her work is not a source of drawing inaccuracies. These results suggest that the artist's misperception of the object is the major source of drawing errors." | cb97, abstract |
| Q13 | "Experiment 1 revealed a positive relation between gaze frequency and drawing accuracy (r2 = .33). Experiments 2, 3, and 4 demonstrated that gaze frequency directly influences drawing accuracy. High gaze frequencies may facilitate drawing accuracy by (1) allowing the artist to hold less information in working memory, (2) reducing memory distortion" | cohen05, abstract |
| Q14 | "gaze frequency is measured in hertz and is operationally defined as the number of times per second that an artist switches his or her gaze from the stimulus to the drawing and back again" | cohen05, intro |
| Q15 | "Twelve art majors and 12 nonart majors volunteered to participate as artists." … "They were allowed 10 min to complete each drawing." Stimuli: "photographic portraits of the heads of males seen from the shoulders up" | cohen05, Exp. 1 |
| Q16 | "novice artists displayed no effect of gaze frequency [F(1,46) = 0.02, n.s.]. Discussion The data demonstrate that gaze frequency influences drawing accuracy only for trained artists." | cohen05, Exp. 2 |
| Q17 | "The results of Experiment 3 replicate those of Experiment 2, except that the effect of gaze frequency is constant across artistic training level." | cohen05, Exp. 3 |
| Q18 | Exp. 4: drawings at 0.167 Hz "were rated as less accurate than those rendered in which gaze frequency was not regulated" … "trained artists switched their gaze more often (M = 0.32, SD = 0.08) than novice artists [M = 0.24, SD = 0.10" | cohen05, Exp. 4 |
| Q19 | Exp. 2 conditions: "Gaze Frequency (Hz) 0.034 0.1 0.5"; Exp. 3: "0.034 0.0625 0.167 … Alternation Duration (sec) 15 8 3" | cohen05, Table 2, Fig. 7 |
| Q20 | "Participants were less accurate in drawing the long-range spatial relationship between the eyes and mouth when drawing the upside-down face than when drawing the upright face. In contrast, they were equally accurate in drawing the short-range spatial relationships … This result fails to empirically validate the effectiveness of drawing models upside-down" | ost16, abstract |
| Q21 | "One hundred and twenty-six undergraduate psychology students … All participants reported having no prior formal training in drawing." … "Participants were given a 15-minute time limit to create each drawing." | ost16, Method |
| Q22 | "these two studies investigated the effects of model inversion on drawing performance with a narrow focus on face stimuli" … "participants were allowed only a single 10- or 15-minute attempt" … "Edwards (2012) provided an instruction for readers to work on an upside-down drawing for at least 40 minutes" | ost16, Discussion |
| Q23 | On Cohen & Earls 2010: "the accuracy ratings pertaining to the spatial positioning of features were lower for drawings of upside-down faces compared with upright faces but that there was no difference … with respect to their local feature accuracy ratings" | ost16, intro |
| Q24 | On Kozbelt et al. 2010: "used a face tracing task where participants were limited in the number of lines they could use … Artist, but not nonartist, judges rated the upside-down tracings as more accurate than the upright ones. Because this was a tracing task, this benefit was not related to accurately depicting spatial relationships between features." | ost16, Discussion |
| Q25 | "an experimental group of 17 undergraduate students … who completed a three-month-long course in either introductory drawing or introductory painting, and a control group of 18 undergraduate students … who did not study art." … "we therefore did not control the group assignment" | schlegel15, Methods |
| Q26 | "participants made quick, 30 second gesture drawings based on observation of human figures" … "while observing grayscale images of human figures in various poses" … "the art students improved over time in gesture drawing ability relative to the controls (group by time interaction t = 3.06, p = 0.003" | schlegel15 |
| Q27 | "Schlegel et al. (2015) found no change in susceptibility to the Muller-Lyer illusion after three months of training in observational drawing and painting." | cw16 |
| Q28 | "Thirty-four participants aged 65-87 completed our randomized controlled trial. The training consisted of 10 online lessons and daily practice" | vj25, abstract |
| Q29 | "the attrition of the treatment group was 47% (i.e., 15 dropouts). The most common reasons for dropout included time commitment ( n = 7), health-related issues ( n = 6), difficulty with the materials ( n = 3), and disinterest ( n = 1)." | vj25, Retention |
| Q30 | "two participants who withdrew reported challenge and dissatisfaction with the products from their blind contour drawings. One participant expressed feeling overwhelmed by the number of drawing prompts in each week's lesson. Finally, two participants reported that drawing is not something they felt they will ever be good at." | vj25, Retention |
| Q31 | "The 5-week schedule required completing two lessons per week and daily practice, and the 10-week schedule required completing one lesson per week and practicing two to three times a week." | vj25, Materials |
| Q32 | "47% of participants who selected the 5-week schedule completed the training, compared to 64% who selected the 10-week schedule; however, these differences were not statistically significant" | vj25, Results |
| Q33 | "30% of the participants felt that the course was too time consuming and too long" … "One participant felt that 10–15 minutes of practice would have been more enjoyable, whereas another felt that 30 minutes were not enough" | vj25, Acceptability |
| Q34 | "treatment d = 1.27 … control d = 0.35" … "The difference in gain scores was 0.45 SD, reflecting the true effects of the intervention." | vj25, Results |
| Q35 | "Another reported feeling a flow state more easily when they enjoyed the subject matter." | vj25 (one person) |
| Q36 | "Adults 65+ residing mainly in Orange County, Southern California" … "All participants received a $50 Amazon gift-card as compensation" | vj25, Method |
| Q37 | "immediate rewards (e.g., enjoyment) predicted current persistence at New Year's resolutions whereas delayed rewards did not (Study 1). Furthermore, immediate rewards predicted persistence in a single session of studying and exercising whereas delayed rewards did not" … "a meta-analysis of our studies finds that immediate rewards are more strongly associated with actual persistence in a long-term goal" | wf17, abstract |

### What the samples were (for the setting line)

| Source | Sample, as read |
|---|---|
| cw16 | Review of lab studies, mostly Western universities. |
| cohen05 | US (UNC Wilmington) art majors and non-art majors; local paid artists; 10-min portrait copies from photos (Q15). |
| cb97 | Abstract does not describe the sample. Lab tasks with tracing and drawing of photos (Q5). |
| ost16 | 126 US undergraduates, no drawing training, 83.5% female, one 15-min face copy each way (Q21). |
| schlegel15 | 17 + 18 Dartmouth undergraduates aged 18-22; 30-second gesture drawings from photos (Q25, Q26). |
| vj25 | 34 US adults aged 65-87, mainly Orange County, online, paid for test sessions (Q28, Q36). |
| wf17 | Abstract does not name the country; University of Chicago authors; New Year's resolutions, studying, exercise. |

## 3. Indian scenes: do they claim the studies tested India?

**No line does.** Scenes: hostel mess, steel tumbler, hostel window, college library, college classroom, exam break,
exam week in the hostel, college art club, chai cup, design class. None says the research was run there.

But the draft never says where the studies ran, and the extra steps use a study of people aged 65-87 for advice to
18-25 year olds.

| Where | Current | Rewrite |
|---|---|---|
| `body.topic.description` (and top-level `description`) | "Seven short drawing tries off the phone: look, check and compare with your own start." | "Nine short drawing tries off the phone: look, check and compare with your own start. The studies ran in the US, mostly with students. The Indian scenes are for practice." |
| `dpw-s8` teach (and every line citing vj25) | "In one drawing course, …" | "In one online drawing course for adults aged 65 to 87, …" (the claims already say this; the step copy does not) |
| `dws-s2` teach | no note | Keep; the studies used art and non-art students copying photos of faces. No note needed in the card. |

## 4. Structure check

| Check | Result |
|---|---|
| Concepts / steps / items | 3 / 9 / 18. Matches cj6 §1. |
| Item types | All 10 used across the module. |
| Orphan claims (no step uses them) | 3 of 12: `dws-c4` (used by items and the hook only), `dss-c4`, `dpw-c4`. Fine as records. |
| Tips presented as findings | `dss-s4` (outline first), `dss-s5` (pen at arm's length), `dws-s3` (side-by-side check), `dpw-s8` (short sessions), `dpw-s9` (draw what you like), `dpw-s7` (compare with day 1). **Shared fix:** add one line to each of those teach cards: "This is a common art-class tip. The studies did not test it." (For `dpw-s8`/`s9`: "This is our tip from the finding.") With that line, the item feedbacks marked "Keep" below can stay. |
| Show me with two right answers | `dpw-s7` (parts 1 and 2). |
| Quest sourceRefs | `draw-what-you-see` quest cites `cohen05` for "30 ticks", a number that source contradicts (§10). |
| Misconception tags | All tags point at existing ids. `dws-1` tags m1 and m2, and options b and c carry them. OK. |
| Teach length | All 9 teach cards are 24-31 words. OK. |
| Count copy | Topic says "Seven"; the pack has 9 steps (W, §3). |

## 5. Topic and concept-level fields (title, description, hook, rule, quest)

| ID | Text | Verdict | Why | Rewrite |
|---|---|---|---|---|
| topic title | "Try it: drawing" | **S** | Label only. | Keep |
| topic description | "Seven short drawing tries off the phone: look, check and compare with your own start." | **W** | 9 steps and 9 quest days, not 7. No setting line. | See §3 |
| draw-what-you-see hook | "Think you can't draw? In lab studies, most drawing errors came from how people saw the object, not from shaky hands." | **S** | Q12 ("very minimal", "major source"). cw16 notes "some methodological limitations" (Q5). Q30 shows people do hold the "can't draw" belief, so the hook is fair. | Keep. Optional: "…the results suggest most drawing errors came from…" |
| draw-what-you-see rule | "Draw the thing in front of you, not your idea of it. Look up often, and check your drawing against the real thing." | **P** | Parts 1-2 fit Q2, Q13. "Check your drawing against the real thing" is a tip; Q4 is about being *able* to spot changes, not about a checking routine. | "Draw the thing in front of you, not your idea of it. Look up often. Checking your drawing against the real thing is a common tip worth trying." |
| draw-what-you-see quest title | "Days 1 to 3: draw what you see" | **S** | Label. | Keep |
| draw-what-you-see quest detail | Day 1 bottle 3 angles 15 min; Day 2 mug/slipper, "Aim for 30 ticks. 10 to 15 min. Small version: 10 ticks."; Day 3 redraw and fix | **W** | ₹0, safe, hostel-room doable. But 30 looks in 10-15 min is one look every 20-30 s, near the slowest and least accurate rate in Cohen 2005 (0.034 Hz, Q19). Unregulated novices looked every ~4 s (0.24 Hz, Q18). | Day 2: "Draw a mug or a slipper. Look up before every line. For the first 2 minutes only, make a small tick each time you look up. 10 to 15 min. Small version: 5 min, looking up before every line. Next day: did looking up more feel slower, easier, or both?" |
| draw-shapes-and-slants hook | "A famous drawing trick says to copy pictures upside down. When researchers tested it on faces, it did not make the copies more accurate." | **S** | Q20, Q23. Understates: some spacing came out worse. | "A famous drawing trick says to copy pictures upside down. When researchers tested it on faces, the copies were no more accurate, and some spacing came out worse." |
| draw-shapes-and-slants rule | "Start with the big outside shape, check slopes against something straight, and test popular tricks yourself before you trust them." | **P** | Outline-first and the straight-edge check are untested tips (cj6 §4 says so). | "Try the big outside shape first and check slopes against something straight. These are art-class tips. Test popular tricks yourself before you trust them." |
| draw-shapes-and-slants quest title | "Days 4 to 6: shapes, slopes and a myth" | **S** | Label. "Myth" is fair for upside-down given Q20. | Keep |
| draw-shapes-and-slants quest detail | Day 4 shoe or chair ×3, 3-4 min; Day 5 door frame or bed corner, pen at arm's length, 15 min; Day 6 textbook diagram upright and upside down, 15 min | **P** | ₹0, safe, hostel-room doable. Day 6: the second copy gains practice from the first, so "which copy is closer?" is biased toward the second (ost16 counterbalanced the order). | Day 6 add: "Do the upside-down copy first today. Then the upright one." |
| draw-past-week-one hook | "One week is a first look, not a finish line. In studies, drawing skill grew over weeks and months of practice." | **S** | Q26 (three months), Q28/Q34 (5 or 10 weeks). | Keep |
| draw-past-week-one rule | "Compare day 1 with day 7, not with an expert. Keep sessions short, and draw things you like looking at." | **P** | None of the three parts was tested. "Keep sessions short" goes past Q29 (Q32 even points the other way on density). | "Compare day 1 with day 7, not with an expert. Keep sessions easy to fit in, and draw things you like looking at. These are tips, built on what the studies found." |
| draw-past-week-one quest title | "Day 7 and two extra days: keep it going" | **S** | Label. | Keep |
| draw-past-week-one quest detail | Day 7 bottle 15 min; Extra A any object 5 min, small 2 min; Extra B "a plant, your bike or a chai cup" 10-15 min | **R** | ₹0, safe. "Your bike" assumes he or she owns one and that it is in the room. | "…pick something you like looking at, such as a plant, a chai cup or your favourite slippers…" |

## 6. Claims (12)

| ID | Text | Verdict | Why | Rewrite |
|---|---|---|---|---|
| dws-c1 | Knowing what a thing is can get in the way of drawing it. A label or a typical shape can take the place of what is really there. | **S** | Q2 ("labels or canonical percepts"). | Keep |
| dws-c2 | In lab tests, people who glanced between the object and the page more often drew more accurately. Changing how often they glanced changed accuracy. | **S** | Q13, Q9. Caveat: in Exp. 2 novices showed no effect (Q16); Exp. 3-4 did (Q17, Q18). | "In lab tests, people who glanced between the photo and the page more often drew more accurately. Making them glance less often made drawings less accurate, for beginners too in two of three tests." |
| dws-c3 | A later study found that people who could spot changes in both their drawing and the object went on to draw better. So misjudging your own drawing may matter more than first thought. | **S** | Q4. | Keep |
| dws-c4 | In lab studies, hand control was a very small source of drawing errors. Misjudging the object was the main one. | **S** | Q12 ("results suggest"). | Keep |
| dss-c1 | A review of drawing research describes helpful patterns that split a scene into simple parts in a set way, which helps you draw it. | **P** | Q2 says "segment the visual scene in systematic ways". "Simple parts" is added. The review's own examples are "plotting the pivotal points on a human body" (Q3), not outlines. | "A review of drawing research describes stored patterns that help artists split a scene into parts in a set way, such as plotting key points on a body first." |
| dss-c2 | In some studies, people who misjudged angles by eye also made errors drawing the same angles. The wider link between visual tricks of the eye and drawing errors is mixed. | **S** | Q6, Q7 ("inconclusive"). | Keep |
| dss-c3 | In two face-drawing studies, copying from an upside-down picture did not make the copies more accurate. Both gave only one short try. A third study found a small gain when art experts judged the drawings. | **P** | Sentences 1-2: Q20, Q22. Leaves out that both found spacing worse (Q20, Q23). Sentence 3: the "drawings" were line-limited tracings (Q24). | "In two face-drawing studies, copying from an upside-down picture did not make copies more accurate, and some spacing between features came out worse. Both gave one short try. In a tracing study, art experts rated upside-down tracings a little better." |
| dss-c4 | In one study of 126 students with no drawing training, upside-down faces came out less accurate for the gap between the eyes and the mouth. | **S** | Q20, Q21. | Keep; optional "in one 15-minute drawing" |
| dpw-c1 | In one study, art students got better at sketching people from life over about three months of drawing and painting classes. | **P** | Q25, Q26: they drew from photographs ("grayscale images"), 30-second gesture drawings; improvement was relative to non-art students; groups were self-selected. "From life" is wrong in detail. | "In one study, students in a three-month drawing or painting class got better at quick sketches of people from photos, compared with students who took no art class." |
| dpw-c2 | In one ten-lesson drawing course for older adults, nearly half of the course group dropped out, and time was the most common reason. | **S** | Q28, Q29 (15 of 32; time n = 7, health n = 6). | Keep |
| dpw-c3 | In studies of long-term goals, enjoying the task now predicted sticking with it, while later rewards did not. | **S** | Q37 (Studies 1-3). The meta-analysis says "more strongly". | Keep; optional "…predicted sticking with it better than later rewards did." |
| dpw-c4 | In that course, people aged 65 to 87 who did the lessons and daily practice gained a lot in drawing skill over 5 or 10 weeks. | **P** | Daily practice was the 5-week schedule only; the 10-week group practised 2-3 times a week (Q31). "Gained a lot" is the pre-post d = 1.27; the paper's course effect is 0.45 SD over the control group (Q34). | "In that course, people aged 65 to 87 improved their drawing over 5 or 10 weeks, more than a group who waited. The extra gain was about half a standard deviation." |

## 7. Misconceptions (10)

| ID | Name / correction | Verdict | Why | Rewrite of correction |
|---|---|---|---|---|
| dws-m1 | "It is all in the hand" / "In lab studies, hand control caused few errors. Most came from how people saw the object." | **S** | Q12. | Keep |
| dws-m2 | "Know it, then draw it" / "Knowing what a thing is can pull your drawing toward a typical shape, not the real one." | **S** | Q2. | Keep |
| dws-m3 | "Look once, draw a lot" / "Short, frequent looks went with more accurate drawings in lab tests." | **S** | Q13. | Keep |
| dws-m4 | "It looks right to me" / "We can misjudge our own drawing too, so compare it with the object." | **P** | First half Q4. "So compare" is a tip, not tested. | "We can misjudge our own drawing too. Comparing it with the object is a tip worth trying." |
| dss-m1 | "Details first" / "Splitting a scene into simple parts in a set way can help, so the big shape first gives each part a place." | **P** | As dss-c1; "big shape first" untested. | "Splitting a scene into parts in a set way can help. Starting with the big shape is one art-class way to do that." |
| dss-m2 | "Slopes look how they are" / "Our eyes can misjudge a slope, and in some studies those who misjudged angles drew them wrong too." | **S** | Q6. | Keep |
| dss-m3 | "Upside down is proven" / "In two face-drawing tests, copying upside down did not make the drawings more accurate." | **S** | Q20, Q23. | Keep |
| dpw-m1 | "One week shows the result" / "Studies saw drawing gains over weeks or months, so a week is too short to judge." | **P** | No study measured one week. "Too short to judge" is our inference. | "Studies saw drawing gains over 5 weeks to 3 months. One week was not tested, so judge it gently." |
| dpw-m2 | "Only long sessions count" / "In one course, time was the top reason people quit, so short sessions are worth a try." | **P** | Q29 is about reasons, not session length. Hedged ("worth a try"), so a light fix. | "In one course for older adults, time was the top reason people quit. Short sessions are our tip from that." |
| dpw-m3 | "Benefits keep you going" / "Enjoying a task now predicted sticking with goals; later rewards did not." | **S** | Q37. | Keep |

## 8. Steps (9)

Each step: hook stem, hook option feedback, teach, visual, Show me (parts + spot), Show me feedback, guided stem + hint,
guided option feedback, takeaway.

### dws-s1 · Draw what you see, not what you know (claim dws-c1, cw16)

| Unit | Text | Verdict | Why | Rewrite |
|---|---|---|---|---|
| Hook stem | "Your eyes and your hand both work fine. So why does a drawn bottle often look wrong?" | **S** | Frames Q2, Q12. | Keep |
| Hook a fb | "Right. The idea of a bottle can take over from the bottle in front of you." | **S** | Q2. | Keep |
| Hook b fb | "Hand control turns out to be a small part. Seeing is the bigger part." | **S** | Q12. | Keep |
| Hook c fb | "Any object works. The trouble is what we expect it to look like." | **P** | "Any object works" is not in a source; fine as framing. | "The shape is not the main issue. What we expect it to look like gets in the way." |
| Teach | "What you know about a thing can take over from what you see. So a bottle turns into the bottle shape in your head. Draw the one in front of you." | **S** | Q2. | Keep |
| Visual | "What you know: A neat, even bottle / Straight sides" vs "What you see: A tilted cap / A dent on one side" | **S** | Illustrates Q2. | Keep |
| Show me | Dented steel bottle, 3 parts, spot part 2 | **S** | One right answer. | Keep |
| Show me fb | "The real bottle has a dent. The smooth tube came from the idea of a bottle." | **S** | Q2. | Keep |
| Guided stem + hint | Meera's hostel window drawn square, looks narrow and slanted from her bed; "Ask what her eyes get, not what she knows." | **P** | A window seen at a slant is a shape-constancy case. The review files those under perception (illusions), where evidence is mixed (Q7, Q11), not only under knowledge. Still a fair practice case. | Keep the scene; in the fact-check record note "shape constancy; the review counts it partly as perception". |
| Guided a fb | "Right. That is what reaches her eyes from the bed." | **S** | Describes the option. | Keep |
| Guided b fb | "That is what she knows about windows, not what she sees from the bed." | **S** | Q2 (canonical percept). | Keep |
| Guided c fb | "A frame adds detail, but the shape still comes from her idea of a window." | **S** | Q2. | Keep |
| Takeaway | "Draw the thing in front of you, not the idea of it." | **S** | Q2. | Keep |

### dws-s2 · Look little, look often (claim dws-c2, Cohen 2005)

| Unit | Text | Verdict | Why | Rewrite |
|---|---|---|---|---|
| Hook stem | "Two people draw the same mug for ten minutes. Who will likely draw it more accurately?" | **S** | Q13; Exp. 1 used 10-min drawings (Q15). | Keep |
| Hook a fb | "Right. More glances went with more accurate drawings in lab tests." | **S** | Q13. | Keep |
| Hook b fb | "One long look leaves a lot to hold in memory, and memory bends shapes." | **P** | Cohen gives memory as a possible reason ("may", Q13). Stated as fact here. | "One long look leaves a lot to hold in memory. The study's author thinks memory may bend shapes." |
| Hook c fb | "Watching the page means drawing from memory. Looking up often helped more." | **S** | Q9, Q13. | Keep |
| Teach | "Glance at the object for every line or two. Short looks leave less to hold in memory, so less may get bent out of shape. More looks went with more accurate drawings." | **S** | Q13 (hedged "may"). "Every line or two" is a practical rendering; the study used looks per second (Q14). | Keep |
| Visual | Flow "Look at the object → Draw one line → Look again" | **S** | Illustrates Q13. | Keep |
| Show me | Arjun stares then draws without looking; Sana glances up for each line; spot part 3 | **S** | One right answer. | Keep |
| Show me fb | "Sana looks for each line, so she holds less in memory and her lines can stay closer to the slipper." | **P** | Mechanism stated as fact (Q13 "may"). | "Sana looks for each line. In the studies, looking up more often went with more accurate drawings." |
| Guided stem + hint | Kabir draws his shoe while watching the page; "Think about where his eyes spend their time." | **S** | Fits Q13. | Keep |
| Guided a fb | "Right. Frequent glances went with more accurate drawings." | **S** | Q13. | Keep |
| Guided b fb | "Pressure changes the line, not how well it matches the shoe." | **P** | Not in a source; common sense. | Keep (editorial) |
| Guided c fb | "Speed is not the issue. How often he looks up is." | **P** | Speed was not tested; time was fixed. | "Speed was not what the studies changed. How often people looked up was." |
| Takeaway | "Short looks, many times: look up for every line." | **S** | Q13. | Keep |

### dws-s3 · Check the drawing, not only the object (claim dws-c3, cw16, cb97)

| Unit | Text | Verdict | Why | Rewrite |
|---|---|---|---|---|
| Hook stem | "You finish a drawing and it looks right to you. Is it right?" | **S** | Frames Q4. | Keep |
| Hook a fb | "Right. Newer work suggests we can misjudge our own drawing, so a check helps." | **P** | Q4 suggests misjudging matters. "A check helps" was not tested. | "Right. Newer work suggests we can misjudge our own drawing. A check is worth trying." |
| Hook b fb | "A drawing can look right up close and still be off beside the object." | **P** | Plausible; not tested. | Keep (editorial), once the teach card carries the tip line |
| Hook c fb | "You can check it yourself by holding it next to the object." | **P** | Untested tip. | Keep, with tip line |
| Teach | "We can misjudge our own drawing, not only the object. So hold the page next to the object, step back, and fix the one part that looks most off." | **P** | Sentence 1 = Q4. The side-by-side routine was not tested; Q4 is about the *ability* to spot changes. cb97 found the opposite (Q12 c). | "We can misjudge our own drawing, not only the object. A common tip: hold the page next to the object, step back, and fix the part that looks most off." |
| Visual | Flow "Draw → Hold it beside the object → Fix one part" | **P** | Illustrates the untested tip. | Keep, with tip line |
| Show me | Neha draws the jug, props page beside it, steps back, then shades; spot part 2 | **S** | One right answer. | Keep |
| Show me fb | "Putting the page next to the jug lets her compare the two side by side." | **S** | Describes the action. | Keep |
| Guided stem + hint | Rohan's cup handle looks too big beside the real cup; "Trust the side-by-side view." | **P** | "Trust" overstates an untested check. | Hint: "Use the side-by-side view." |
| Guided a fb | "Right. Fix the part that looks most off, then compare again." | **S** | Advice; no claim. | Keep |
| Guided b fb | "Up close is where we misjudge our own drawing. The side-by-side view is the check." | **P** | No source says where we misjudge. | "Our own drawing can fool us. The side-by-side view is a quick check." |
| Guided c fb | "A new cup restarts the problem. Fixing one part teaches more." | **P** | "Teaches more" is not sourced. | "A new cup starts over. Fixing one part keeps what you have." |
| Takeaway | "Compare the drawing with the object, then fix one thing." | **S** | Advice; no claim. | Keep |

### dss-s4 · Big shape first (claim dss-c1, cw16)

| Unit | Text | Verdict | Why | Rewrite |
|---|---|---|---|---|
| Hook stem | "Drawing a chair, where is a good place to start?" | **S** | A question. | Keep |
| Hook a fb | "Right. The big shape gives every part a place to go." | **P** | Untested tip stated as fact. | "Right. Art classes often start with the big shape, so every part has a place." |
| Hook b fb | "A pattern is a detail. Without the outline, it has nowhere to sit." | **P** | Same. | Keep, with tip line |
| Hook c fb | "A finished leg can end up the wrong size once the rest is added." | **P** | Same. | Keep, with tip line |
| Teach | "Start with the outside shape, then place the parts inside it. Splitting what you see into simple shapes gives each part a place, so details do not drift." | **P** | Q2 supports segmenting in a set way; outline-first and "details do not drift" are not tested (cj6 graded it B/C, "indirect"). | "Start with the outside shape, then place the parts inside it. Artists split a scene into parts in a set way. Outline first is a common art-class way; it was not tested." |
| Visual | Flow "Outside shape → Big parts → Small details" | **P** | Untested order. | Keep, with tip line |
| Show me | Kiran: light box around the chair, seat and back, then carving; spot part 1 | **S** | One right answer. | Keep |
| Show me fb | "The light box around the chair is the big shape. Everything else is placed inside it." | **S** | Describes the scene. | Keep |
| Guided stem + hint | Pooja draws the bell first; wheels do not fit; "Which comes before the parts?" | **S** | Scene. | Keep |
| Guided a fb | "Right. With the outline set, the wheels and bell each get their place." | **P** | Tip as fact. | Keep, with tip line |
| Guided b fb | "A smaller bell helps a little, but the size of the whole is still a guess." | **P** | Same. | Keep, with tip line |
| Guided c fb | "More paper hides the problem. Starting with the outline fixes it." | **P** | "Fixes it" is a promise. | "More paper hides the problem. Starting with the outline is the usual fix." |
| Takeaway | "Outside shape first, then the parts, then the details." | **S** | Advice; no claim. | Keep |

### dss-s5 · Check every slope (claim dss-c2, cw16)

| Unit | Text | Verdict | Why | Rewrite |
|---|---|---|---|---|
| Hook stem | "You copy the slope of a roof by eye. How sure can you be that you got the angle right?" | **S** | Frames Q6. | Keep |
| Hook a fb | "Right. A slope judged by eye can be off, so it is worth a check." | **S** | Q6; "worth a check" is mild advice. | Keep |
| Hook b fb | "Looking hard does not stop the eye from misjudging a slope." | **S** | Q10 (illusions "cannot be corrected by a force of will"). | Keep |
| Hook c fb | "Angles can be misjudged by eye, so they are worth checking." | **S** | Q6. | Keep |
| Teach | "In some studies, people who misjudged a slope by eye drew it wrong too, so check slopes. Hold a pen along the edge at arm's length and copy that slant." | **P** | Sentence 1 = Q6. The pen check was not tested (cj6 grade D). | "In some studies, people who misjudged a slope by eye drew it wrong too. A common art-class check: hold a pen along the edge at arm's length and copy that slant." |
| Visual | Flow "Hold a pen along the edge → Keep that slant → Copy it to the page" | **P** | Untested tip. | Keep, with tip line |
| Show me | Dev: door frame, pen at arm's length, copies slant; spot part 2 | **S** | One right answer. | Keep |
| Show me fb | "Holding the pen along the edge shows the real slant before he copies it." | **P** | "Shows the real slant" is a claim about an untested tool. | "Holding the pen along the edge gives him a straight line to compare with before he copies it." |
| Guided stem + hint | Zoya's rail looks flatter than the real one; "Use something straight you already hold." | **S** | Scene. | Keep |
| Guided a fb | "Right. The pen shows the real slant, so she can match it." | **P** | As above. | "Right. The pen gives her a straight line to match." |
| Guided b fb | "Tracing over it keeps the same wrong slant." | **S** | Logic; no claim. | Keep |
| Guided c fb | "That changes the stairs, not the slope of the rail." | **S** | Logic. | Keep |
| Takeaway | "Check slopes with a pen held at arm's length." | **S** | Advice; no claim. | Keep |

### dss-s6 · Test a myth: upside down (claim dss-c3, cw16, ost16)

| Unit | Text | Verdict | Why | Rewrite |
|---|---|---|---|---|
| Hook stem | "A popular trick says you draw better from an upside-down picture. What did tests on faces find?" | **S** | Q20. | Keep |
| Hook a fb | "Right. In two face tests, upside-down copies were not more accurate." | **S** | Q20, Q23. | Keep |
| Hook b fb | "The tests did not find that. Beginners drew no more accurately upside down." | **S** | Q20, Q21 (no training). | Keep |
| Hook c fb | "The two face tests found no better copies. One found a part came out worse." | **W** | Both found spacing came out worse: ost16 (eyes to mouth, Q20) and Cohen & Earls (spatial positioning, Q23). cw16 summarises Cohen & Earls as "no impact" (Q8); ost16, with Cohen as co-author, gives the detail. | "The two face tests found no better copies. In both, some spacing between features came out worse." |
| Teach | "In two face tests, copying from an upside-down picture did not make drawings more accurate. Both gave only one short try, so test the trick yourself." | **S** | Q20, Q22. | Keep |
| Visual | "Upright copy: The usual view" vs "Upside-down copy: No accuracy gain in face tests / Longer practice not tested" | **S** | Q20, Q22. | Keep |
| Show me | Fatima copies upright, then upside down, then holds both next to the original; spot part 3 | **S** | One right answer. | Keep |
| Show me fb | "Holding both copies next to the real one lets her compare them fairly." | **P** | Not quite fair: the second copy gains practice from the first. ost16 counterbalanced the order. | "Holding both copies next to the original lets her compare them. Next time she can do the upside-down copy first, since the second copy gets some practice." |
| Guided stem + hint | Friend says upside down "always works"; "Recall what the research showed." | **S** | Scene. | Keep |
| Guided a fb | "Right. Testing both is fair, since the studies only tried faces." | **S** | Q22. | Keep |
| Guided b fb | "The face tests did not show that." | **S** | Q20. | Keep |
| Guided c fb | "Longer sessions were not tested, so nobody knows that yet." | **P** | "Nobody knows" goes past two studies. | "These studies did not test longer sessions." |
| Takeaway | "Test popular tricks yourself before you trust them." | **S** | Advice; follows Q22. | Keep |

### dpw-s7 · Same bottle, one week on (claim dpw-c1, schlegel15, cw16)

| Unit | Text | Verdict | Why | Rewrite |
|---|---|---|---|---|
| Hook stem | "After a week of short drawing sessions, what is fair to expect?" | **S** | A question. | Keep |
| Hook a fb | "Right. A week gives you something to compare, not a finished skill." | **S** | Fits Q26, Q28 (gains over weeks to months). | Keep |
| Hook b fb | "Art students in one study improved over months of classes, not a week." | **P** | "Not a week" implies a one-week test; none was made. | "Art students in one study were tracked over three months of classes." |
| Hook c fb | "A week is short. Gains in studies took weeks or months." | **P** | "Took" implies no earlier gain; earlier points were not reported. | "A week is short. The studies measured gains after 5 weeks to 3 months." |
| Teach | "Draw day 1's bottle again and put both side by side. Skill in studies grew over months, so a week is a first look, not a finish line." | **S** | Q25, Q26 (three months). | Optional "…grew over weeks to months…" (vj25 had 5 weeks) |
| Visual | Scale "Day 1 → Months", marks at 10 "Day 7: a first look" and 90 "Gains seen in studies" | **P** | Positions are made up. Gains were seen at 5 weeks too (Q28), which would sit near 40 on a 3-month scale. | min "Day 1", max "3 months"; marks: at 8 "Day 7: a first look", at 40 "5 weeks: gains in one course", at 100 "3 months: gains in another" |
| Show me | Ali: day 1 and day 7 side by side; compares each with the real bottle; then with an artist's print; spot part 2 | **W** | The ask "Tap the fair way to judge the week" has two right answers: part 1 (day 1 vs day 7) is the step's own advice. | Ask: "Tap the step that compares with something unfair." Spot part 3. |
| Show me fb | "Comparing with the real bottle is fair. An artist has had years of practice." | **P** | Ties to the broken spot. | "An artist's print is not a fair yardstick for one week. Day 1 and the real bottle are." |
| Guided stem + hint | Simran's day 7 bottle only a bit better; "Think about how long the studies ran." | **S** | Scene. | Keep |
| Guided a fb | "Right. A small change after a week is normal." | **P** | "Normal" is not from a source. | "Right. The studies ran for weeks to months, so a small change after a week is no surprise." |
| Guided b fb | "One week cannot show talent. Skill in studies grew with months of practice." | **P** | No source tests talent. The answer is kind; fine on tone. | "Talent was not tested. Skill in studies grew over weeks to months of practice." |
| Guided c fb | "A week is too short to judge. Gains in studies took months." | **P** | As hook c. | "A week is early. The studies measured gains after 5 weeks to 3 months." |
| Takeaway | "Compare with your own day 1, not with an expert." | **S** | Advice; no claim. | Keep |

### dpw-s8 · Short sessions count (claim dpw-c2, vj25)

| Unit | Text | Verdict | Why | Rewrite |
|---|---|---|---|---|
| Hook stem | "In a drawing course with daily practice, what was the most common reason people dropped out?" | **S** | Q28, Q29. | "In an online drawing course for adults aged 65 to 87, …" |
| Hook a fb | "Right. Time was the top reason people left the course." | **S** | Q29 (7 of 15). | Keep |
| Hook b fb | "That was not a top reason. Time was." | **P** | True as a ranking, but "difficulty with the materials" (3) and unhappy blind-contour results (2) came up (Q29, Q30). | "A few people did mention hard tasks or their results. Time came up most (7 of 15)." |
| Hook c fb | "Only one person gave that reason. Time was the most common." | **P** | n = 1 is "disinterest" (Q29); the Discussion also lists "lack of engagement". Close enough; name the paper's word. | "One person gave disinterest as the reason. Time was the most common." |
| Teach | "In one drawing course, time was the most common reason people quit, so keep sessions short. The small version still counts as a session." | **P** | Q29 is a reason, not a test of short sessions. The denser 5-week (daily) schedule had lower completion than the 10-week (2-3 times a week) one, not significant (Q31, Q32). | "In one online course for older adults, time was the most common reason people quit. Our tip: keep sessions easy to fit in. The small version still counts." |
| Visual | "Long sessions: Hard to fit in" vs "Short sessions: Easy to fit in / The small version counts" | **P** | Untested comparison. | Keep, with tip line |
| Show me | Vikram one hour every night; Anu 10 min after dinner; Joy "when he is free"; spot part 2 | **S** | One right answer. | Keep |
| Show me fb | "A short, set time is easier to fit in than an hour or a vague plan." | **P** | Not tested by vj25. | "A short, set time is our tip. In the course, time was the top reason people left." |
| Guided stem + hint | Leo, exams Monday, no free hour; "The shortest choice can still count." | **S** | Scene. | Keep |
| Guided a fb | "Right. A small session fits a busy week." | **S** | Advice; no study claim. | Keep |
| Guided b fb | "Waiting may mean no drawing for weeks." | **P** | Speculation; mild. | Keep (editorial) |
| Guided c fb | "A long block is harder to fit in, and time was the top reason people quit." | **P** | Links Q29 to session length, which it did not test. | "A long block is harder to fit in. In one course, time was the top reason people quit." |
| Takeaway | "Short sessions are easier to keep. Small ones count." | **P** | Stated as a finding. | "Short sessions may be easier to keep. Small ones count." |

### dpw-s9 · Draw what you enjoy (claim dpw-c3, wf17)

| Unit | Text | Verdict | Why | Rewrite |
|---|---|---|---|---|
| Hook stem | "In studies of goals, what predicted sticking with them?" | **S** | Q37. | Keep |
| Hook a fb | "Right. Enjoyment now predicted sticking with goals; later rewards did not." | **S** | Q37. | Keep |
| Hook b fb | "Later rewards did not predict sticking with it in these studies." | **S** | Q37. | Keep |
| Hook c fb | "The studies compared rewards now and later. Enjoyment now won." | **S** | Q37. | Keep |
| Teach | "In studies of long-term goals, enjoying the task now predicted sticking with it, while later rewards did not. So pick things you like looking at." | **P** | Sentence 1 = Q37. "Pick things you like looking at" is our step from goals in general to drawing subjects; one vj25 participant said something close (Q35). | "In studies of long-term goals, enjoying the task now predicted sticking with it, while later rewards did not. Our tip: pick things you like looking at." |
| Visual | "Fun now: Predicted sticking with it" vs "Rewards later: Did not predict it" | **S** | Q37. | Keep |
| Show me | Nisha skips the bucket and draws her plant; 2 parts, spot part 2 | **S** | One right answer. | Keep |
| Show me fb | "Choosing what she likes looking at makes the session more fun now." | **P** | Assumes the effect. | "She picks what she likes looking at, which may make the session more fun now." |
| Guided stem + hint | Omar draws only for design-class marks; "Which choice makes it fun today?" | **S** | Scene. | Keep |
| Guided a fb | "Right. Fun now predicted keeping going better than later rewards." | **S** | Q37. | Keep |
| Guided b fb | "Marks are a later reward, which did not predict sticking with it." | **S** | Q37. | Keep |
| Guided c fb | "That adds time, not enjoyment, and time was the top reason people quit one course." | **P** | Mixes vj25 into a wf17 step and treats Q29 as a length finding. | "That adds time, not enjoyment. Enjoyment now is what predicted sticking with it." |
| Takeaway | "Pick things you like drawing. Enjoying it now matters." | **P** | "Matters" generalises from goals in general. | "Pick things you like drawing. Enjoying it now may help you keep going." |

## 9. Items (18)

One row for the item as a whole, then one row per option feedback.

### draw-what-you-see items

| Unit | Text | Verdict | Why | Rewrite |
|---|---|---|---|---|
| dws-1 (scenario, transfer) | Tara draws a steel tumbler's rim as a circle though it looks like a flat oval. "What went wrong?" | **P** | Fair practice. But circle-for-ellipse is the textbook shape-constancy case, which the review files under perception, not only knowledge (Q11, Q7). | Keep the item; make option a "Her idea of a round rim pulled the drawing away from what she saw." |
| fb a | "Right. She knows a rim is round, so she drew a circle instead of the flat oval in front of her." | **P** | "So" makes knowledge the only cause. | "Right. Knowing a rim is round can pull a drawing toward a circle, away from the flat oval she sees." |
| fb b | "Her circle came out fine. The trouble is that she drew a shape she knows, not the oval she sees." | **S** | Q12 (motor minimal), Q2. | Keep |
| fb c | "Shine makes it harder, but the circle came from her idea of a rim, not from looking." | **P** | "Shine makes it harder" is not sourced. | "Shine is not the issue here. The circle came from her idea of a rim, not from looking." |
| dws-2 (true-not-quite, misconception) | "True or not quite: with a steadier hand, your drawings would look much more like real things." | **S** | Q12. | Keep |
| fb a | "In lab studies, hand control was a very small source of errors. Misjudging the object was the main one." | **S** | Q12. | Keep |
| fb b | "Right. Lab studies found the hand plays a small part. Seeing the object as it really is matters more." | **S** | Q12. | Keep |
| fb c | "These studies did not find the hand to be the big problem. Misjudging the object was the bigger one." | **S** | Q12. The cb97 abstract does not say whether the sample drew rarely. | Keep |
| dws-3 (predict, reverse) | Ishaan's desk lamp sketch came out far off; "which habit most likely caused it?" | **S** | Q13, Q9. | Keep |
| fb a | "Right. Few looks leave more to hold in memory, and memory bends shapes. More frequent glances went with more accurate drawings." | **P** | "Memory bends shapes" stated as fact (Q13 "may"). | "Right. Few looks leave more to hold in memory, which may bend shapes. More frequent glances went with more accurate drawings." |
| fb b | "Frequent glances went with more accurate drawings in lab tests, so this habit is the least likely cause." | **S** | Q13. | Keep |
| fb c | "The tool was not what the studies tested. How often he looked is the likely cause here." | **S** | Q13. | Keep |
| dws-4 (estimate, recall) | "In one drawing test, how often people looked up went with how well they drew. About what percent of the spread did it match?" Answer 33 (25-40). | **S** | Q13 (r² = .33, Exp. 1, 24 people, Q15). Trivia, as cj6 §3 said. | Optional stem: "…In one test with 24 students, about what percent…" |
| fb a | "Right. In that experiment, glance rate and accuracy shared about a third of their spread." | **S** | Correct reading of r². | Keep |
| fb b | "Too low. The link was clear: about a third of the spread in accuracy went with glance rate." | **S** | Q13. | Keep |
| fb c | "Too high. Glance rate mattered, but it matched about a third of the spread, not nearly all of it." | **S** | Q13. | Keep |
| dws-5 (why, edge) | "Older lab work found that misjudging your own drawing was not a source of errors. Why does a newer review still say to check your drawing?" | **P** | Q12 c and Q4 are right. But the review does not "say to check your drawing"; it says misjudging it "is worthy of further investigation" (Q4). | Stem: "…Why does a newer review say misjudging your drawing may matter after all?" |
| fb a | "Right. People who noticed changes in both their drawing and the object went on to draw better, so checking may matter." | **S** | Q4, hedged. | Keep |
| fb b | "It used both drawing and tracing tasks. The newer review adds a later result the older work did not have." | **S** | Q5. | Keep |
| fb c | "The point is not a feeling. A later study linked spotting changes in your drawing with better drawings." | **S** | Q4. | Keep |
| dws-6 (match, combine) | Habits ↔ errors: look up ↔ memory; page beside object ↔ misjudging own drawing; draw the one in front of you ↔ label | **P** | Pairs 1 and 3 fit Q13 and Q2. Pair 2 rests on the untested side-by-side tip. | Keep the pairs; add the tip line in `dws-s3` |
| fb a | "Each short look leaves less to hold in memory, where shapes bend." | **P** | Mechanism as fact. | "Each short look leaves less to hold in memory, where shapes may bend." |
| fb b | "Memory can bend shapes, which frequent looks up at the object may help with." | **S** | Q13, hedged. | Keep |
| fb c | "Side by side, the parts that are off become easier to see." | **P** | Untested. | "Side by side, the parts that are off may be easier to see." |
| fb d | "We can misjudge our own work, which a side-by-side check helps catch." | **P** | "Helps catch" untested. | "We can misjudge our own work. A side-by-side check is one way to look again." |
| fb e | "Looking at this object keeps the typical shape in your head out of it." | **P** | Overclaims; looking does not stop the schema (Q2, Q10). | "Looking at this object gives the typical shape in your head less room." |
| fb f | "A label in your head swaps in a typical form, which careful looking avoids." | **P** | "Avoids" overclaims. | "A label in your head can swap in a typical form. Careful looking pushes back." |

### draw-shapes-and-slants items

| Unit | Text | Verdict | Why | Rewrite |
|---|---|---|---|---|
| dss-1 (order, combine) | "Put Leela's chair drawing in a helpful order." outline → seat/back → legs/rails → carving | **P** | A taught order, not a finding. | Stem: "Put Leela's chair drawing in the order art classes often teach." |
| fb a | "The big shape comes before anything else, so every part has a place to go." | **P** | Tip as fact. | Keep, with tip line |
| fb b | "With the outline set, the large parts go inside it next." | **S** | Describes the order; no claim. | Keep |
| fb c | "Smaller parts fit between the big ones, so they stay in place." | **P** | Tip as fact. | Keep, with tip line |
| fb d | "Fine detail comes last, once the shapes around it are right." | **S** | Describes the order. | Keep |
| dss-2 (scenario, transfer) | Aman draws knobs first; desk runs off the page | **P** | Tip, not finding. Scene is fair. | Keep, with tip line |
| fb a | "Right. The big outside shape fixes the size and place of the desk, so the knobs have a spot to go." | **P** | Tip as fact. | Keep, with tip line |
| fb b | "Smaller knobs would not fix it. Without the big shape first, the desk can still run off the page." | **S** | Logic. | Keep |
| fb c | "Any desk fits once its outline is set first, so the object was not the problem." | **P** | "Any desk fits" overclaims. | "A smaller desk could still run off the page. Setting the outline first is the usual fix." |
| dss-3 (choose, misconception) | "Which belief about drawing slopes is not quite right?" | **S** | Q6, Q10. | Keep |
| fb a | "Right, that belief is off. Eyes can misjudge slopes, and in some studies those errors showed up in the drawing." | **S** | Q6. | Keep |
| fb b | "This is a fair check to try, so it is not the mistaken belief here." | **S** | Framed as "to try". | Keep |
| fb c | "This one is sensible, since eyes can misjudge slopes. The mistaken belief is trusting the eye alone." | **S** | Q6. | Keep |
| dss-4 (predict, reverse) | Riya's ramp drawing came out too flat; "what most likely happened?" | **S** | Fits Q6. Direction ("too flat") is a scene detail, not a claim. | Keep |
| fb a | "Right. A slope judged by eye can be off, and in some studies those errors showed up in the drawing." | **S** | Q6. | Keep |
| fb b | "A soft pencil changes the line, not its angle. The slant came from how she judged the slope." | **S** | Logic plus Q6. | Keep |
| fb c | "A ruler is not needed. A pen held along the edge is a quick way to check the slant." | **P** | Untested tip. | "A ruler is not needed. A pen held along the edge is a common quick check." |
| dss-5 (estimate, edge) | "In one upside-down face drawing study, each student had a time limit for each drawing. About how many minutes?" Answer 15 (10-20) | **S** | Q21. Trivia (cj6 §3). | Keep |
| fb a | "Right. Each drawing had a 15-minute limit, so longer practice upside down was not tested." | **S** | Q21, Q22. | Keep |
| fb b | "Far longer than the study. Each drawing had about 15 minutes, which is one reason the result has limits." | **S** | Q22. | Keep |
| fb c | "Much shorter than the study. Each drawing had about 15 minutes, and that was a single try." | **S** | Q22. | Keep |
| dss-6 (explain-it-back, recall) | "Which line best explains back what the face tests found about upside-down copying?" | **S** | Q20, Q23. | Keep |
| fb a | "Right. In both face tests, copying upside down brought no gain in accuracy." | **S** | Q20, Q23. | Optional add: "Some spacing came out worse." |
| fb b | "That is the claim the tests checked. They found no gain in accuracy for faces." | **S** | Q20. | Keep |
| fb c | "Only faces were tested, so nothing is known here about objects. For faces there was no gain." | **S** | Q22 ("narrow focus on face stimuli"). | Keep |

### draw-past-week-one items

| Unit | Text | Verdict | Why | Rewrite |
|---|---|---|---|---|
| dpw-1 (fill-the-step, transfer) | "to judge your practice so far, put your newest drawing next to ___" | **S** | Advice; fair. | Keep |
| fb a | "Right. Your own start is a fair yardstick, since studies saw skill grow over months, not days." | **P** | "Months, not days" implies days were tested. | "Right. Your own start is a fair yardstick. Studies saw skill grow over weeks to months." |
| fb b | "An expert has had years more practice. Your own start is the fair thing to compare with." | **S** | Advice; no study claim. | Keep |
| fb c | "A photo shows the object, not your progress. Your own start shows how far you have come." | **S** | Logic. | Keep |
| dpw-2 (predict, reverse) | College art club drew people far better after a few months; "what best explains it?" | **S** | Q25, Q26. | Keep |
| fb a | "Right. In one study, art students improved at sketching people from life over about three months of classes." | **P** | From photos, not life (Q26). | "Right. In one study, art students got better at quick sketches of people over a three-month class." |
| fb b | "The students improved during the course, which points to the practice, not to fixed talent." | **P** | Talent was not tested; groups were self-selected (Q25). | "The study did not test talent. The art students improved over three months, compared with students who took no art class." |
| fb c | "One good day does not explain a gain that held over months of classes in the study." | **S** | Logic plus Q26. | Keep |
| dpw-3 (estimate, recall) | "In a ten-lesson drawing course for adults aged 65 to 87, about what percent of the course group dropped out?" Answer 47 (40-55) | **S** | Q29 (15 of 32). Trivia. | Keep |
| fb a | "Right. Nearly half of the course group dropped out, and time was the most common reason." | **S** | Q29. | Keep |
| fb b | "Far too low. Nearly half dropped out, which is why short sessions are worth a try." | **P** | "Which is why" is our inference. | "Far too low. Nearly half dropped out, and time was the most common reason." |
| fb c | "Too high. Close to half dropped out, not nearly all of them." | **S** | Q29. | Keep |
| dpw-4 (scenario, edge) | Gauri, exam week, a few spare minutes; "What fits the course finding?" | **P** | The course did not test a few minutes a day. | Stem: "…What is a fair plan?" |
| fb a | "Right. In one course, time was the top reason people quit, so short sessions are easier to keep." | **P** | "So … easier to keep" untested. | "Right. A few minutes is a fair start. In one course, time was the top reason people quit." |
| fb b | "Waiting may mean no drawing at all, and in one course time was the top reason people quit." | **S** | Hedged; Q29. | Keep |
| fb c | "Nothing in the course says that. Time was the most common reason people dropped out." | **S** | Q29. One participant even suggested 10-15 min (Q33). | Keep |
| dpw-5 (why, misconception) | Kunal draws for his career, finds it dull, keeps skipping; "Why might that be?" | **S** | Fits Q37 (goals in general). | Option a text: "He draws for a later reward, not for fun now." (the current "Later rewards predicted sticking less" reads as a garbled finding) |
| fb a | "Right. In studies of goals, enjoyment now predicted keeping going, while later rewards did not." | **S** | Q37. | Keep |
| fb b | "An app would add screen time. The studies point to enjoyment now as the better predictor." | **P** | "Add screen time" is our product view. Fine. | Keep (editorial) |
| fb c | "Many people draw daily. What predicted sticking with goals was enjoying the task now." | **P** | "Many people draw daily" unsourced. | "Daily drawing is not the problem. What predicted sticking with goals was enjoying the task now." |
| dpw-6 (choose, combine) | "Which plan for the next fortnight puts this track's ideas together best?" | **S** | Combines the track's tips. | Keep |
| fb a | "Right. Short sessions, things you enjoy and comparing with your own start all come from this track." | **S** | Accurate about the track. | Keep |
| fb b | "Long, dull sessions go against two findings: time was the top reason to quit, and enjoyment predicted sticking." | **P** | Q29 is not a finding about length. | "Long, dull sessions go against this track: time was the top reason to quit one course, and enjoyment predicted sticking with goals." |
| fb c | "Judging against experts hides your own progress. Comparing with your own start is fairer." | **S** | Advice; no study claim. | Keep |

## 10. Every number

| Number in draft | Where | Verdict | Note |
|---|---|---|---|
| "Seven short drawing tries" | topic description | **W** | 9 steps (§3). |
| r² = .33 → "About 33%", range 25-40 | `dws-4` | **S** | Q13, Exp. 1 only (24 people, Q15). |
| "About 5%", "About 90%" | `dws-4` distractors | **S** | Correctly wrong. |
| "ten minutes" (mug) | `dws-s2` hook | **S** | Matches Exp. 1's 10-min limit (Q15); scene. |
| "30 ticks", "10 ticks", "10 to 15 min" | `draw-what-you-see` quest Day 2 | **W** | 30 looks in 10-15 min ≈ 0.03-0.05 Hz, near the least accurate condition (0.034 Hz, Q19). Free looking was 0.24-0.32 Hz (Q18). Rewrite in §5. |
| 15 min, 5 min, 3 angles | quest Day 1 | **S** | Design choices; no study claim. Fine. |
| 15 min (Day 3) | quest Day 3 | **S** | Design choice. |
| 3 × 3-4 min | quest Day 4 | **S** | Design choice. |
| 15 min (Day 5, Day 6) | quest | **S** | Design choice. Day 6 is two copies in 15 min, shorter than the study's 15 min each; fine for a try. |
| "two face tests", "both" | `dss-s6`, `dss-c3`, `dss-6` | **S** | Q22 ("these two studies"). |
| "A third study … small gain" | `dss-c3` | **P** | It was tracing (Q24). |
| "One found a part came out worse" | `dss-s6` hook c fb | **W** | Both did (Q20, Q23). |
| 126 students | `dss-c4` | **S** | Q21. |
| 15 minutes, range 10-20 | `dss-5` | **S** | Q21. Cohen & Earls used 10 (Q22), so the range covers both. |
| "About 2 hours", "About 1 minute" | `dss-5` distractors | **S** | Correctly wrong. |
| "about three months" | `dpw-c1`, `dpw-2` fb a | **S** | Q25 ("three-month-long course"). |
| "weeks and months", "weeks or months" | concept hook, `dpw-m1` | **S** | Q28 (5/10 weeks), Q25. |
| "ten-lesson", "65 to 87" | `dpw-c2`, `dpw-c4`, `dpw-3` | **S** | Q28. |
| 47%, range 40-55; "nearly half" | `dpw-c2`, `dpw-3` | **S** | Q29 (15 dropouts). |
| "About 10%", "About 85%" | `dpw-3` distractors | **S** | Correctly wrong. |
| "5 or 10 weeks" | `dpw-c4` | **S** | Q28, Q31. |
| "daily practice" | `dpw-c4`, `dpw-s8` hook | **P** | Daily only on the 5-week schedule (Q31). |
| "gained a lot" | `dpw-c4` | **P** | d = 1.27 pre-post; course effect 0.45 SD (Q34). |
| "Only one person" | `dpw-s8` hook c fb | **S** | n = 1 "disinterest" (Q29). |
| scale marks at 10 and 90 | `dpw-s7` visual | **P** | Made-up positions (§8). |
| "10 minutes after dinner", "one hour", "5-minute small version", "two hours on Sunday", "a full hour", "a few minutes", "fortnight" | `dpw-s8`, `dpw-4`, `dpw-6` | — | Scene details; no claim. |
| 5 min, 2 min, 10-15 min | quest Day 7, Extra A, Extra B | **S** | Design choices. |

## 11. Wording-risk list (guilt, pressure, stereotype, health or talent promise, quest safety)

| Where | Risk | Fix |
|---|---|---|
| `draw-past-week-one` quest "your bike" | Assumes a bike, in the room (cost and class) | "a chai cup or your favourite slippers" (§5) |
| `dss-s4` guided c fb "Starting with the outline fixes it." | Small promise | "is the usual fix" (§8) |
| `dws-s3` hint "Trust the side-by-side view." | Over-trust in an untested check | "Use the side-by-side view." (§8) |
| `dws-6` fb e/f "keeps … out", "avoids" | Promise that looking removes bias; Q10 says illusions resist will | Hedged rewrites (§9) |
| Talent | "She has no talent" (`dpw-s7` guided b) and "born with more talent" (`dpw-2` b) are wrong options, answered kindly. Q30 shows the belief is real. | Keep, with the rewrites that drop "cannot show talent" |
| Guilt or shame | None found. No "should", no streak or loss copy. "Keeps skipping" (`dpw-5`) is a scene, not a judgement. | — |
| Health | None found. Vodyanyk & Jaeggi's mindfulness result (d(net) = 0.81) and the "cognitive aging" title are not used. Keep them out. | — |
| Stereotypes | Names, genders and settings vary (Tara, Meera, Ishaan, Kabir, Neha, Rohan, Leela, Aman, Riya, Pooja, Dev, Zoya, Fatima, Kunal, Ali, Simran, Anu, Vikram, Joy, Leo, Gauri, Nisha, Omar). Omar in a design class, Leela with a chair: no trope. | — |
| Quest safety and cost | All 9 days: paper and a pen, ₹0, no buying, no sharing, nothing unsafe. Objects all fit a hostel room (bottle, mug, slipper, shoe, chair, door frame, bed corner, textbook, plant, chai cup). No screen use except the textbook diagram, which can be on paper. | Only the bike fix |
| Night use | `dpw-s8` Show me has "one-hour drawing every night" as the wrong option. Fine. | — |

## 12. Tally

Counted by script from the verdict column of §5-§9.

| Section | Units | S | P | W | R |
|---|---|---|---|---|---|
| §5 Topic and concept fields (title, description; 3 × hook, rule, quest title, quest detail) | 14 | 7 | 4 | 2 | 1 |
| §6 Claims | 12 | 8 | 4 | 0 | 0 |
| §7 Misconceptions | 10 | 6 | 4 | 0 | 0 |
| §8 Steps (9 × hook stem, teach, visual, Show me, Show me fb, guided stem, takeaway = 63; plus 27 hook fb and 27 guided fb) | 117 | 68 | 47 | 2 | 0 |
| §9 Items (18 items + 58 option fb) | 76 | 49 | 27 | 0 | 0 |
| **Total** | **229** | **138** | **86** | **4** | **1** |

§10 re-lists numbers already judged above; its rows are not added to the total. §11 re-lists risks already judged; the
three hedging risks there are counted as P in §8-§9, not as R.

## 13. What to do first

1. Fix the Day 2 tick target (§5). It is the one change that could make drawings worse.
2. Fix `dss-s6` hook c, `dss-c3`, the `dpw-s7` Show me and the topic description (the W rows).
3. Add the one tip line to the six tip steps (§4). That clears most P rows at once.
4. Rewrite `dpw-c1` (photos, not life) and `dpw-c4` (schedule and effect size).
5. Add the setting line (§3).
