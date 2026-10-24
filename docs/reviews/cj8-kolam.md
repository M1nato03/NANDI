# cj8 · The slow kolam: real sikku patterns

Job 5 of cloud batch 8. Branch `ideas/cj8-kolam`. Prototype only; no app code changed.

Files:
- `content-drafts/kolam/kolam.ts`: generator, checker, SVG output (pure TS, no imports).
- `content-drafts/kolam/kolam.test.ts`: 24 Vitest tests.
- `content-drafts/kolam/sample-*.svg`: 5 samples (3x3, two 4x4, two 5x5).

## 1. Result in one table

| Question | Answer |
|---|---|
| Can we generate valid single-line kolams on 3x3, 4x4, 5x5? | Yes. 200 seeds per size and mode, all pass the checker. |
| Speed | 0.1-5.4 ms per kolam on the cloud box (table in §4). Fine for on-device generation. |
| Does the checker work on its own? | Yes. It reads only the point list. It rejects partial loops, gaps, retraced segments, and a full single line whose turn joins two dots. |
| Symmetry | 3x3 and 5x5 keep quarter-turn symmetry. 4x4 cannot: an exhaustive search found 0 one-line patterns with half-turn or quarter-turn symmetry in this model (§4). |
| Does it look like a kolam? | Yes, by eye. Rendered with Playwright/Chromium and checked (PNG not committed). |
| Is it from real sources? | The model is the published "dots + one closed curve, one dot per region" definition (Demaine et al.), built with the mirror-curve method used for sona. Quotes in §2. |

## 2. How sikku (pulli) kolams are formed: sources

### Sources opened and quoted

| Source | What it says (exact quote) | Use here |
|---|---|---|
| Demaine, Demaine, Taslakian, Toussaint, "Sand drawings and Gaussian graphs", *J. Mathematics and the Arts* (preprint 2007). https://erikdemaine.org/papers/Sona_JMA/paper.pdf | "One type of kolam, called pulli kolam, consists of first drawing a grid of dots (the pulli), and then drawing a continuous closed curve that partitions the planar space into as many bounded regions as there are dots, such that each bounded region contains exactly one dot." | This is the checker's strict definition (`strict: true`). |
| same | "In its basic form, the artist draws dots followed by one surrounding continuous loop, which crosses itself repeatedly, in the sand or on a floor sprinkled with powder." | Crossings are allowed; the line never retraces. |
| same | "It may also happen in these drawings that some regions contain more than one dot, while other regions are empty" (about sona, not kolam) | Why the generator has an open mode (empty diamonds allowed) and a strict mode. |
| same | "Gerdes also describes rules that transform a 2-linear drawing into a monolinear one" and "Mirror curves and cycle matrices are two examples" (of research inspired by sona) | The generator is this idea: start with n loops, splice them into one. |
| same, reference [3] | "Marcia Ascher. Mathematics Elsewhere: An Exploration of Ideas Across Cultures. Princeton University Press, 2002." | Demaine cites Ascher's 2002 book for the kolam description. |
| K. Krithivasan, "A view of India through kolam", INAE, Dec 2014. https://www.inae.in/wp-content/uploads/2018/12/A-VIEW-OF-INDIA-THROUGH-KOLAM-Prof-K-Krithivasan-Dec-2014-.pdf | "It used to be a matter of pride to be able to draw large complicated patterns without lifting the hand off the floor, standing up in between, something like Eulerian circuits." | The one-finger, never-lift tracing rule. |
| same | "Some of the kolams are drawn by a single closed curve (Eulerian circuit). Examples are Krishna Salangai and Hridhya Kamalam." | Single closed line = Eulerian circuit framing. |
| same | "There are two ways to generate kolam patterns using array grammars. In one method, basic patterns are treated as symbols and an array grammar generates rectangular array made up of these symbols [...] Another method is to generate labelled dots and give simple instructions to join them [1]." | Siromoney's array-grammar approach, described by a co-author. |
| same | "Another way of generating Kolam patterns by a computer is to generate strings using L-systems and interpret the symbols in the system as move of a cursor. This approach is followed in[3, 4]." | L-system approach (Prusinkiewicz and Krithivasan, 1988-89). |
| same, reference [1] | "G. Siromoney, R. Siromoney and K. Krithivasan, Array Grammars and Kolam, Computer Graphics and Image Processing, (1974) 3, 63-82." | Correct Siromoney citation. |
| Raghavachary, "Tile-based kolam patterns", SIGGRAPH 2004 sketch. https://history.siggraph.org/?p=92990 | "The dot grid is laid down first, then the pattern is drawn in continuous loops which wind around the dots." (via the fetch tool; page text) | Order of drawing: dots first. |
| Chakraborty and Manna, "Extending Hridaya Kolam to Even-Ordered Dot Patterns", arXiv 2507.02874 (2025). https://arxiv.org/abs/2507.02874v1 | "We analyze the resulting cyclic sequences that correspond to Eulerian circuits, enabling continuous single-stroke kolam designs beyond the classical odd-ordered cases." | Recent "kolam as Eulerian circuit" work. |
| same, reference list (via the fetch tool) | "[1] M. Ascher, 'The Kolam Tradition: A tradition of figure-drawing in southern India expresses mathematical ideas,' American Scientist, 90(1), 2002, pp. 55–63." and "[14] K. Yanagisawa and S. Nagata, 'Fundamental Study on Design System of Kolam Pattern,' Forma 22, 2007, pp. 31–46." | Citations for Ascher 2002 and Yanagisawa & Nagata 2007. |
| Manna and Chakraborty, arXiv 2510.18907 (2025). https://arxiv.org/pdf/2510.18907v1 | "This paper extends Hridaya Kolam patterns to cases where the number of dots (m) and arms (n) are not coprime [...] Such configurations give rise to multiple disjoint closed loops." | Same effect our model shows: a square grid without splices splits into n loops. |
| same | "A foundational study of Hridaya Kamalam Kolam featuring radial dot arrangements was conducted by Siromoney [12] and later by Siromoney and Chandrasekaran [11]" | Siromoney's later kolam work. |
| Prusinkiewicz, "Graphical applications of L-systems", Graphics Interface '86. https://www.algorithmicbotany.org/papers/graphical-applications.pdf | "Approximately at the same time, Siromoney and Subramanian [1983] noticed that L-systems with chaincode interpretation could be used to generate some spacefilling curves." | Lineage from Siromoney's group to L-system kolam generation. This 1986 paper has no kolam figures; the kolam L-systems are in the 1988-89 papers cited by Krithivasan. |

### Could not open

| Source | What happened |
|---|---|
| Ascher, "The Kolam Tradition", *American Scientist* 90(1), 2002. https://www.americanscientist.org/article/the-kolam-tradition | HTTP 503 twice. Search results say the full text needs a login or subscription. Not read; not quoted. |
| Gift Siromoney's kolam page, https://www.cmi.ac.in/gift/Kolam.htm | Fetch timed out; a second try returned 404. Not quoted. |
| Siromoney et al. 1974, *CGIP* 3(1) (DOI 10.1016/0146-664X(74)90011-2) | Elsevier, paywalled. No legal open copy found. Described only through Krithivasan 2014 (a co-author). |
| Yanagisawa and Nagata 2007, *Forma* 22 | No open PDF found by search. Not quoted. |
| imaginary.org "L-System for Single Knot Kolam Pattern Generation" (https://www.imaginary.org/node/1067) | HTTP 404. |

### Citation corrections for Job 1

| Cited as | Correct form | Note |
|---|---|---|
| "Ascher 2002" | Two different 2002 works exist: (a) M. Ascher, "The Kolam Tradition", *American Scientist* 90(1), 2002, DOI 10.1511/2002.13.56; (b) M. Ascher, *Mathematics Elsewhere*, Princeton UP, 2002. | Page range differs between sources: 55-63 (arXiv 2507.02874 reference list) vs 56-61 (a search-result reference list). Neither checked against the article. Demaine et al. cite the book. Say which one is meant. |
| "Siromoney" | G. Siromoney, R. Siromoney, K. Krithivasan, "Array grammars and kolam", *Computer Graphics and Image Processing* 3(1), 1974, 63-82. | The SIGGRAPH archive gives pp. 63-88; Krithivasan 2014 and a DOI-bearing reference give 63-82. |

## 3. The model the prototype uses

- n x n dots at odd lattice points (2i+1, 2j+1) in a box from 0 to 2n.
- The line moves diagonally through the points between dots. Each dot is wrapped by a small diamond of 4 segments.
  There are 4n² segments, and the line uses each exactly once (the never-retrace rule).
- At each of the 2n(n-1) midpoints between two neighbouring dots, the line either crosses itself (X) or
  turns back with a "wall" that keeps the two dots apart. At the outer edge it bounces round the outer dot.
- With no walls, the line splits into n separate loops (tested). Walls splice loops together (Gerdes's
  "transform a 2-linear drawing into a monolinear one").
- Open mode (default): add walls greedily while the loop count falls, then a few extra toggles that keep one loop.
  Small empty diamonds between four dots remain, as in many kambi-style drawings.
- Strict mode: no empty regions. One closed line with c crossings has c + 2 regions (Euler), so empty regions
  = (n-1)² - walls. Zero empty regions means the walls form a spanning tree over the gaps between dots plus
  the outside. The generator builds a random spanning tree and keeps it if it gives one loop.
- Symmetry: try quarter-turn symmetry first, then half-turn, then none.
- SVG: the line passes through each segment's midpoint, with each lattice point as a quadratic control point.
  Crossings stay straight; turns become round loops around dots.

### The checker (`checkKolam(n, points)`)
It ignores the generator and reads only the point list:
1. Exactly 4n² steps; each is a diagonal unit step between allowed points inside the box; the line closes.
2. No segment is used twice (no retracing).
3. Each interior point is visited twice, each edge point once.
4. At each point the move is legal: straight through (a crossing), the separating turn, or the edge bounce.
   A turn along the line joining two dots is rejected ("would join them").
5. Union-find over regions: every dot is enclosed (not joined to the outside) and no two dots share a region.
   It also reports how many empty bounded regions remain.

## 4. Test results

Command (the repo's `vitest.config.ts` only includes `src/` and `scripts/`, so `npx vitest run content-drafts/kolam`
finds no tests; I ran it with a scratch config that includes `content-drafts/kolam/**/*.test.ts`):

```
Test Files  1 passed (1)
     Tests  24 passed (24)
```

| Size, mode | Seeds | Checker pass | ms per kolam | Empty regions | Symmetry kept |
|---|---|---|---|---|---|
| 3x3 open | 200 | 200 | 0.30 | 0 | quarter turn |
| 3x3 strict | 200 | 200 | 0.14 | 0 | quarter turn |
| 4x4 open | 200 | 200 | 5.36 | 6 | none |
| 4x4 strict | 200 | 200 | 0.62 | 0 | none |
| 5x5 open | 200 | 200 | 0.66 | 8 | quarter turn |
| 5x5 strict | 200 | 200 | 0.20 | 0 | quarter turn |

Exhaustive counts (every wall pattern; scratch script, not committed):

| Grid | Symmetry | Patterns tried | One line | One line, no empty region |
|---|---|---|---|---|
| 3x3 | none | 4,096 | 240 | 192 |
| 3x3 | half turn | 64 | 12 | 12 |
| 3x3 | quarter turn | 8 | 2 | 2 |
| 4x4 | half turn | 4,096 | 0 | 0 |
| 4x4 | quarter turn | 64 | 0 | 0 |

Findings:
- 3x3 with quarter-turn symmetry has only 2 patterns (mirror images). Daily variety on 3x3 needs the
  asymmetric or half-turn sets (12 or 240).
- 4x4 square grids give no rotationally symmetric single line in this model. Traditional even-size kolams often
  use other dot layouts (offset rows, diamond grids). Use 3x3 and 5x5 for symmetric daily kolams; offer 4x4 as
  "free form" or add an offset-grid model later.
- Strict 5x5 gives about 60 distinct quarter-turn patterns in 300 seeds. That is about 2 months of daily kolams
  without repeats at one size.

Also run: `tsc --strict` on both files (clean), `eslint content-drafts/kolam` (clean). Not run: the full repo test suite
(nothing outside `content-drafts/` changed).

Visual check: all 5 SVGs rendered with Playwright/Chromium at 200 px each, and the 5x5 at 340 px in a 360 px wide
viewport. They show closed loops round every dot with diagonal crossings, which matches the reference drawings
described above. The 3x3 strict sample is the familiar 4-petal sikku shape.

## 5. Tracing rule (proposal)

Numbers for a 360 px wide phone (CSS px ≈ dp), board 328 px wide (16 px gutters):

| Grid | Dot spacing | Line length | Time at 50 dp/s |
|---|---|---|---|
| 3x3 | 94 dp | about 2,390 dp | about 48 s |
| 4x4 | 73 dp | about 3,300 dp | about 66 s |
| 5x5 | 60 dp | about 4,220 dp | about 84 s |

Rule:
- The line tip grows only along the path, and only while the finger is within 28 dp of the tip.
- Speed is smoothed over the last 200 ms. At or below 80 dp/s the line follows the finger. Above 80 dp/s the
  line waits at the tip and the stroke glow softens. No error, no buzz, no reset.
- No lower limit. A still finger just holds the line.
- At a crossing the tip only searches the next 1.5 segments, so it cannot jump to the other strand.
- Lifting the finger keeps the line. Touching the tip again resumes. Nothing is lost.
- No timer, no countdown, no score for speed. The finished kolam is the end screen ("Done for tonight").
- 80 dp/s is a starting value. Put it in `rules.config.ts` and tune it on Jenil's phone. This is a design guess,
  not a research number.

### "Draw it for me" (accessible option)
- A button under the board: "Draw it for me". The app draws the line at 40 dp/s. Tap again to pause.
- With `prefers-reduced-motion` or the in-app motion toggle off: show the whole kolam at once, with a
  "Next loop" button that adds one dot's loop at a time.
- Switch and keyboard users: "Next loop" is a normal 44 px button; Enter or Space advances.
- Screen readers: `aria-label` such as "Kolam, 5 by 5 dots, one closed line. 12 of 25 dots drawn."
- Using it earns the same as tracing. It is never marked as "assisted".
- The finished line is the same either way; there is no "perfect" grade.

## 6. Cultural check

What the sources say about the practice:
- Wikipedia (https://en.wikipedia.org/wiki/Kolam): "In millions of households in Tamil Nadu, Telangana and Andhra
  Pradesh, women draw kolams in front of their home entrance every day at the break of dawn." Also: "It is widely
  practised by female family members in front of their house entrance, although men and boys also practice this
  tradition." On form: "a stroke (neli, kambi, sikku in Tamil) runs once around each dot (pulli), and returns to the
  beginning point". (Several of these sentences carry "citation needed" tags on the page.)
- Krithivasan 2014: "Kolams are drawn in the pooja room of a house which is place of worship. In temples also large
  kolams are drawn." and "It is also believed that the lines must be completed (closed curves) symbolically meaning
  that it prevents evil spirits from entering".
- Ramesh and Rajabiyazdi, arXiv 2603.02343: "In South Indian households, particularly in Tamil Nadu, creating Kolam
  is a daily ritual aimed at welcoming prosperity and wellbeing into the home. Kolam is performed primarily by
  women at home entrances before sunrise."

How to present it:

| Do | Don't |
|---|---|
| Call it "kolam", with one line: "A dot-and-line drawing made each morning at doorsteps, mainly in Tamil Nadu." | Call it "rangoli" or treat the names as the same thing. Other regions have their own names and forms. |
| Use the Tamil terms correctly: pulli (dot), sikku (knot-like line). | Invent "ancient" or "secret" lore. |
| Say it is a living, everyday practice. | Present it as a museum piece or "lost art". |
| Keep religious meaning out of app copy. If asked, say "for many families it is also part of worship" and stop. | Claim it brings luck, prosperity or protection, or wards off anything. |
| Give generated patterns plain names ("5x5 · loop 12"). | Use names of traditional designs (many have devotional names) unless a practitioner confirms them. |
| Keep it un-gendered in copy; Kachhua invites anyone. | Copy like "the women's art" or "like your grandmother". |
| Credit the maths lineage in an "About this" sheet (Siromoney; Ascher; Demaine et al.). | Claim kolam "trains the brain", calms, or helps sleep. |
| Ask one Tamil kolam practitioner to look at the samples and copy before launch. | Ship without anyone from the tradition seeing it. |

## 7. Product-rule check

| Rule | Status |
|---|---|
| No loss states, no guilt | Too fast only pauses the line. Nothing resets. |
| No random rewards | The pattern is seeded by the date (same for everyone that day); no variable reward. |
| No endless feed | One kolam a night, then a stopping screen. |
| No countdowns | None. Duration is a result, never shown as a timer. |
| No health or brain claims | None in copy (§6). |
| Offline | Generation takes under 6 ms on the cloud box; no network. |

## 8. Open items for Jenil

1. Strict (every region holds one dot) or open (small empty diamonds) as the default look? Strict looks closer to
   the 3x3 classic; open has more crossings.
2. Sizes: 3x3 and 5x5 only (symmetric), or also free-form 4x4?
3. Start speed limit 80 dp/s, to tune on device?

## Sources
- https://erikdemaine.org/papers/Sona_JMA/paper.pdf
- https://www.inae.in/wp-content/uploads/2018/12/A-VIEW-OF-INDIA-THROUGH-KOLAM-Prof-K-Krithivasan-Dec-2014-.pdf
- https://history.siggraph.org/?p=92990
- https://arxiv.org/abs/2507.02874v1
- https://arxiv.org/pdf/2510.18907v1
- https://www.algorithmicbotany.org/papers/graphical-applications.pdf
- https://arxiv.org/pdf/2603.02343
- https://en.wikipedia.org/wiki/Kolam
- Not opened: https://www.americanscientist.org/article/the-kolam-tradition, https://www.cmi.ac.in/gift/Kolam.htm,
  https://www.imaginary.org/node/1067
