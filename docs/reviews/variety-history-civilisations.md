# Variety review: History and civilisations

File reviewed: `content/topics/topic.history-civilisations.json` on `origin/main` (78d1a28).
Date: 2026-10-22. Review only. No app code or content JSON was changed.

Why this review: a learner said the questions for one idea "all feel the same".
Each concept here has 2 claims and 8 items, so the 8 items keep re-asking the same 1-2 facts.
Target shape (spec 14, inflation on `learn-steps`): 3 steps per concept,
each step teaches a different claim, at most 3 items per step (3/3/2).

How to read this:
- "Idea tested" is what a learner must know to get the item right.
- "Repeat" means two or more items test the same idea, even in different formats.
- "No claim" means an item tests a fact that is not in any claim of the concept.
- Every proposed claim has a source I opened on 2026-10-22, with the exact words.
- Claims are plain sentences. Short words. No firearm content.

## Summary

| concept id | claims now | repeats found | claims proposed | ready for 3 steps? |
|---|---|---|---|---|
| indus-cities | 2 | 3 groups, 7 of 8 items (1/3/8, 2/3/7, 4/5) | 3 (c3-c5) | yes |
| ashoka-edicts | 2 | 2 groups, 7 of 8 items (1/3/6/7, 2/4/8) | 3 (c3-c5) | yes |
| silk-road-ideas | 2 | 2 groups, 6 of 8 items (1/4/8, 3/6/7) | 3 (c3-c5) | yes |
| indian-place-value | 2 | 3 groups, 6 of 8 items (1/3, 2/4, 7/8) | 3 (c3-c5) + split c2 | yes |
| printing-and-reading | 2 | 2 groups, 5 of 8 items (2/3/7, 5/8) | 4 (c3-c6) | yes |
| mughal-revenue | 2 | 3 groups, 6 of 8 items (2/6/7, 1/8, 4/8) | 4 (c3-c6) | yes |
| company-trade-rule | 2 | 2 groups, 7 of 8 items (1/2/4/7, 3/5/8) | 3 (c3-c5) + split c2 | yes |
| independence-constitution | 2 | 2 groups, 7 of 8 items (2/4/8, 3/5/6/7/8) | 3 (c3-c5) | yes |

"Ready" means: with the proposed claims, the concept has at least 3 distinct sourced claims,
one per step. It does not mean the items are done. Most steps keep 2-3 old items,
but a few steps need 1 new item (listed under each outline).

Pattern across the topic (the same cause as "inflation"):
- Every concept has exactly 2 claims.
- Every concept has an `order` item and a `match` item that repeat an earlier item.
- Three concepts ask the same sequence twice (printing 3 and 7, company 2/4/7, constitution 3/6/7).
- Several items test facts that are in no claim (Indus script, Bakhshali, 876 CE, 600 years,
  jagirs, 10 years of records, 1946). The proposed claims cover most of them, so those items get a home.

---

## 1. indus-cities (Indus Valley cities)

Claims now (2):
- c1: Mohenjo-daro had a street plan with roads that cross at right angles. It also had drains.
- c2: The Great Bath was about 12 metres long; its exact social use is uncertain.

Items:

| id | type | idea tested |
|---|---|---|
| indus-cities-1 | predict | Right-angle streets mean the city was planned (c1) |
| indus-cities-2 | scenario | House drains joined street drains (c1) |
| indus-cities-3 | choose | Crossing streets and drains are both visible (c1) |
| indus-cities-4 | why | We know how the Bath was built, not who used it (c2) |
| indus-cities-5 | estimate | The Bath is about 12 m long (c2) |
| indus-cities-6 | true-not-quite | The Indus script cannot be read (no claim) |
| indus-cities-7 | order | Waste water: house floor, house drain, street drain (c1) |
| indus-cities-8 | match | Right-angle streets = plan; Bath outlet = water care (c1, c2) |

Repeats:
- "Streets were planned": 1, 3, 8.
- "Homes linked to drains": 2, 3, 7.
- "Great Bath": 4, 5 (and half of 8).
- No claim: 6 (script unread is only in the rule and a misconception).

Proposed claims:
- **c3: No one can read the Indus script yet, so we cannot read the names on its seals.**
  - Source: NCERT, Themes in Indian History Part I, Theme 1 "Bricks, Beads and Bones"
    https://ncert.nic.in/textbook/pdf/lehs101.pdf
  - Exact words: "Although the script remains undeciphered to date, it was evidently not alphabetical (where each sign stands for a vowel or a consonant) as it has just too many signs – somewhere between 375 and 400."
  - Also: World History Encyclopedia, https://www.worldhistory.org/Indus_Script/ :
    "this writing system remains undeciphered, there is no agreement on the language it represents, no bilingual texts have been found thus far".
  - Older support: Penn Museum, Expedition 6(3), 1964, https://www.penn.museum/sites/expedition/the-indus-civilization/ :
    "as of today not a single sign of the Indus script has been deciphered and read satisfactorily".
- **c4: Indus bricks had the same shape everywhere: the length was four times the height, and the width twice the height.**
  - Source: NCERT lehs101.pdf (same chapter, section on planning).
  - Exact words: "Other signs of planning include bricks, which, whether sun-dried or baked, were of a standardised ratio, where the length and breadth were four times and twice the height respectively. Such bricks were used at all Harappan settlements."
- **c5 (spare, Indian example): Lothal in Gujarat was an Indus port town. A basin there, 217 metres long, is thought to be a dockyard.**
  - Source: UNESCO World Heritage Centre, Tentative List, "Archaeological remains of a Harappa Port-Town, Lothal"
    https://whc.unesco.org/en/tentativelists/5918/
  - Exact words: "a basin measuring 217 m long and 26 meters in width, identified as a tidal dock-yard" and
    "The excavated site of Lothal is the only port-town of the Indus Valley Civilisation."

3-step outline:

| step | title | claim | after it, the learner can |
|---|---|---|---|
| s1 | Streets and drains followed a plan | c1 | read a grid and a drain line as signs of a planned city |
| s2 | The Great Bath: we know the build, not the use | c2 | say what the Bath shows and what it cannot prove |
| s3 | The Indus script is still unread | c3 | explain why no Indus king can be named from a seal |

Items that fit: s1 = 1, 2, 7. s2 = 4, 5, 8. s3 = 6 + 1 new item (s3 has only one now).
c4 (bricks) can replace 3 as a fresh s1 item, so 3 stops repeating 1 and 2.

---

## 2. ashoka-edicts (Ashoka's edicts)

Claims now (2):
- c1: Ashoka had edicts carved on rocks and later on pillars across his empire.
- c2: A stone pillar at Lauriya Nandagarh still stands. It is about 32 feet tall.

Items:

| id | type | idea tested |
|---|---|---|
| ashoka-edicts-1 | predict | Ashoka cut his words into rock (c1) |
| ashoka-edicts-2 | scenario | Edicts in many regions = he reached many areas (c1) |
| ashoka-edicts-3 | choose | His later pillars carried his messages (c1) |
| ashoka-edicts-4 | why | A far-off rock edict = his message was placed there (c1) |
| ashoka-edicts-5 | estimate | Lauriya Nandagarh pillar is about 32 ft (c2) |
| ashoka-edicts-6 | true-not-quite | Edicts were royal public messages, not private prayers (c1, partly) |
| ashoka-edicts-7 | order | Carved, stays at a site, read later (c1) |
| ashoka-edicts-8 | match | Rock edicts in several regions; pillars of polished sandstone (c1) |

Repeats:
- "He carved messages in stone": 1, 3, 6, 7.
- "Edicts spread across regions": 2, 4, 8.
- Only item 5 tests c2. Nothing tests what the edicts actually said.

Proposed claims:
- **c3: Ashoka's edicts taught dhamma: respect elders, treat servants kindly, and respect other religions.**
  - Source: NCERT, Themes in Indian History Part I, Theme 2 "Kings, Farmers and Towns", p. 29
    https://ncert.nic.in/textbook/pdf/lehs102.pdf
  - Exact words: "He used the inscriptions to proclaim what he understood to be dhamma. This included respect towards elders, generosity towards Brahmanas and those who renounced worldly life, treating slaves and servants kindly, and respect for religions and traditions other than one's own."
- **c4: In one edict, Ashoka says he was sorry for the killing in his Kalinga war, in today's Odisha.**
  - Source: NCERT lehs102.pdf, p. 48, Source 11 "The anguish of the king".
  - Exact words: "One hundred and fifty thousand men were deported, a hundred thousand were killed, and many more died." and "This is the repentance of Devanampiya on account of his conquest of the (country of the) Kalingas."
  - Care: the same page says this edict "has not been found in the region that was conquered". Teach it as "he says", not as proof of how he felt.
- **c5: Most edicts used the Prakrit language in the Brahmi script. In Afghanistan, some were in Greek and Aramaic.**
  - Source: NCERT lehs102.pdf, p. 29, box "Languages and scripts".
  - Exact words: "Most Asokan inscriptions were in the Prakrit language while those in the northwest of the subcontinet were in Aramaic and Greek. Most Prakrit inscriptions were written in the Brahmi script; however, some, in the northwest, were written in Kharosthi. The Aramaic and Greek scripts were used for inscriptions in Afghanistan."

3-step outline:

| step | title | claim | after it, the learner can |
|---|---|---|---|
| s1 | Messages carved in stone across an empire | c1 | say why stone and many sites helped a ruler reach people |
| s2 | What the edicts asked people to do | c3 | name two dhamma values and spot a wrong "private prayer" claim |
| s3 | After Kalinga, Ashoka spoke of regret | c4 | tell what the Kalinga edict says and why it is one source |

Items that fit: s1 = 1, 2, 5 (or 4). s2 = 6 + 1 new. s3 = 2 new.
c5 (scripts) can feed a new item or a later review. c2 (32 ft) becomes a detail inside s1.

---

## 3. silk-road-ideas (Silk Road ideas)

Claims now (2):
- c1: Trade paths linked India with western Central Asia. They also helped spread Buddhist art. People used them to move goods and ideas.
- c2: Gandhara was connected to sea and overland routes rather than one straight road.

Items:

| id | type | idea tested |
|---|---|---|
| silk-road-ideas-1 | predict | Trade stops supported Buddhist groups (c1) |
| silk-road-ideas-2 | scenario | People on the move carried an art style (c1) |
| silk-road-ideas-3 | choose | Land paths met river and sea trade (c2) |
| silk-road-ideas-4 | why | Rich patrons paid for statues and temples (c1) |
| silk-road-ideas-5 | estimate | Buddhism thrived about 600 years in Gandhara and Swat (no claim) |
| silk-road-ideas-6 | true-not-quite | Many routes that changed, not one fixed route (c2) |
| silk-road-ideas-7 | order | Sea, up the Indus to Gandhara, over passes (c2) |
| silk-road-ideas-8 | match | Gandhara = trade and art centre; oasis = way station (c1) |

Repeats:
- "Trade wealth supported Buddhism": 1, 4, 8.
- "Many linked routes": 3, 6, 7.
- No claim: 5 (the 600-year figure comes from the Met page, which is not in a claim).
- Note: the Met site returned "429 Too Many Requests" today, so I could not reopen the existing source.

Proposed claims:
- **c3: Buddhism spread east from India to China along the Silk Roads. Monks, merchants and rulers paid for its cave temples.**
  - Source: UNESCO World Heritage Centre, "Silk Roads: the Routes Network of Chang'an-Tianshan Corridor"
    https://whc.unesco.org/en/list/1442/
  - Exact words: "The series of Buddhist pagodas and large, elaborate cave temples extending from Kucha (now Kuqa County) in the west to Luoyong in the east, record the eastward transmission of Buddhism from India via Karakorum" and "Their elaboration reflects the sponsorship of local authorities and the central Chinese imperial government as well as donations of wealthy merchants, and the influence of monks that travelled the routes".
- **c4: One Silk Road section, from China to Central Asia, stayed in use from about the 2nd century BC to the 16th century.**
  - Source: same UNESCO page.
  - Exact words: "This property is a 5,000 km section of the extensive Silk Roads network ... It took shape between the 2nd century BC and 1st century AD and remained in use until the 16th century, linking multiple civilizations and facilitating far-reaching exchanges of activities in trade, religious beliefs, scientific knowledge, technological innovation, cultural practices and the arts."
- **c5: The Takht-i-Bahi monastery in Gandhara was used for about 600 years, from the 1st century AD to the 7th century.**
  - Source: UNESCO World Heritage Centre, "Buddhist Ruins of Takht-i-Bahi and Neighbouring City Remains at Sahr-i-Bahlol"
    https://whc.unesco.org/en/list/140/
  - Exact words: "The Buddhist monastic complex of Takht-i-Bahi (Throne of Origins) was founded in the early 1st century." and "The Buddhist monastery was in continual use until the 7th century AD."
  - Note: "about 600 years" is my sum (early 1st to 7th century). It is a different fact from item 5 (Met: Buddhism in Gandhara and Swat by the 5th century). Do not merge the two numbers.

3-step outline:

| step | title | claim | after it, the learner can |
|---|---|---|---|
| s1 | Many routes, not one road | c2 | describe the Silk Road as a web of land, river and sea links |
| s2 | Trade money paid for Buddhist art | c1 | explain how merchant wealth built statues and monasteries |
| s3 | Buddhism travelled east to China | c3 | trace an idea moving with monks and traders |

Items that fit: s1 = 3, 6, 7. s2 = 1, 4, 8 (2 also fits). s3 = 2 + 1 new.
c4 and c5 give fresh, sourced numbers for the estimate slot instead of item 5.

---

## 4. indian-place-value (Indian place value and zero)

Claims now (2):
- c1: In the Indian base ten system, zero can mark an empty place in a number.
- c2: In the seventh century, Brahmagupta set out rules for sums with zero. In time, Indian number signs went west.

Items:

| id | type | idea tested |
|---|---|---|
| indian-place-value-1 | predict | In 205, zero keeps the tens place empty (c1) |
| indian-place-value-2 | scenario | Zero's uses grew step by step, not one inventor (c2, partly) |
| indian-place-value-3 | fill-the-step | In 205, zero marks the empty tens place (c1) |
| indian-place-value-4 | why | Zero as a place mark and as a number grew apart (c1 + c2) |
| indian-place-value-5 | estimate | First surely dated Indian carved zero: 876 CE (no claim) |
| indian-place-value-6 | true-not-quite | Bakhshali manuscript date is debated (no claim) |
| indian-place-value-7 | order | India, then al-Khwarizmi in Arabic, then Fibonacci (c2) |
| indian-place-value-8 | match | Brahmagupta = rules for zero; Fibonacci = numerals to Europe (c2) |

Repeats:
- "Zero holds the tens place in 205": 1 and 3. Same number, same answer. The strongest repeat in the topic.
- "Zero grew in stages": 2, 4.
- "Numerals went west": 7, 8.
- No claim: 5 (876 CE), 6 (Bakhshali).
- c2 holds two ideas (Brahmagupta's rules, spread west). Split it into c2a and c2b.

Proposed claims:
- **c2a (sharper c2): Brahmagupta wrote in 628 CE, at Bhinmal in today's Rajasthan, that a number plus zero stays the same, and a number times zero is zero.**
  - Source: MacTutor, University of St Andrews, "Brahmagupta"
    https://mathshistory.st-andrews.ac.uk/Biographies/Brahmagupta/
  - Exact words: "he wrote Brahmasphutasiddhanta, in 628. ... Brahmagupta tells us in the text that he wrote it at Bhillamala which today is the city of Bhinmal." and "When zero is added to a number or subtracted from a number, the number remains unchanged; and a number multiplied by zero becomes zero."
- **c3: The oldest Indian zero that all experts accept is carved on a stone at Gwalior, dated 876 CE.**
  - Source: MacTutor, "A history of Zero"
    https://mathshistory.st-andrews.ac.uk/HistTopics/Zero/
  - Exact words: "The first record of the Indian use of zero which is dated and agreed by all to be genuine was written in 876." and "The inscription concerns the town of Gwalior, 400 km south of Delhi".
  - Also: https://mathshistory.st-andrews.ac.uk/HistTopics/Indian_numerals/ :
    "The first inscription which is dated and is not disputed is the inscription at Gwalior dated 933 in the Vikrama calendar which translates to a date in our calendar of 876 AD."
- **c4: Fibonacci's book Liber abaci, from 1202, brought Indian place-value numbers to Europe.**
  - Source: MacTutor, "Leonardo Pisano Fibonacci"
    https://mathshistory.st-andrews.ac.uk/Biographies/Fibonacci/
  - Exact words: "Liber abaci, published in 1202 after Fibonacci's return to Italy ... introduced the Hindu-Arabic place-valued decimal system and the use of Arabic numerals into Europe."
  - Earlier link in the chain: https://mathshistory.st-andrews.ac.uk/Biographies/Al-Khwarizmi/ :
    "Al-Khwarizmi also wrote a treatise on Hindu-Arabic numerals. ... The work describes the Hindu place-value system of numerals".
- **c5: The Bakhshali manuscript uses a dot for zero. Carbon tests show its pages differ in age by about 500 years.**
  - Source: Science Museum (London) blog, "Illuminating India: starring the oldest recorded origins of zero"
    https://blog.sciencemuseum.org.uk/illuminating-india-starring-oldest-recorded-origins-zero-bakhshali-manuscript/
  - Exact words: "This carbon dating of the manuscript, shows that it is formed of leaves that are nearly 500 years apart in age, with some pages dating from as early as the 3rd to 4th century and others dating from the 8th and 10th centuries." and "it also shows all 10 decimal digits which included a dot for zero".
  - Care: the same blog has a typo ("200-400 BC"). Use only the "3rd to 4th century" line.

3-step outline:

| step | title | claim | after it, the learner can |
|---|---|---|---|
| s1 | Zero holds an empty place | c1 | read why 205 and 25 differ |
| s2 | Brahmagupta made zero a number | c2a | apply n + 0 = n and n x 0 = 0, and say who wrote the rules |
| s3 | Indian numbers travel to Europe | c4 | put India, Baghdad (al-Khwarizmi) and Fibonacci in order |

Items that fit: s1 = 1, 5 (with c3 as its claim, or as review). s2 = 2, 4, 8. s3 = 7 + 1 new.
Drop 3 or rewrite it with a different number (it is item 1 again).
c3 and c5 become review facts; item 6 then has a source (c5).

---

## 5. printing-and-reading (Printing and reading)

Claims now (2):
- c1: Korean print with metal type came before the Bible made by Gutenberg.
- c2: The Gutenberg Bible is a major early European book printed with movable metal type.

Items:

| id | type | idea tested |
|---|---|---|
| printing-and-reading-1 | predict | Reusable single letters = movable type (no claim defines it) |
| printing-and-reading-2 | scenario | East Asia used movable type before Gutenberg (c1) |
| printing-and-reading-3 | choose | Order: Bi Sheng, Korean metal type, Gutenberg (c1, Bi Sheng no claim) |
| printing-and-reading-4 | explain-it-back | Gutenberg was a big step for Europe (c2) |
| printing-and-reading-5 | estimate | Jikji: 1377 CE (no claim) |
| printing-and-reading-6 | true-not-quite | More books do not teach reading by themselves (no claim) |
| printing-and-reading-7 | order | Order: Bi Sheng, Korean metal type, Gutenberg (c1) |
| printing-and-reading-8 | match | Jikji = Korea 1377; Gutenberg Bible = Europe about 1455 (c1, c2) |

Repeats:
- 3 and 7 ask the exact same three-event order. 2 is the same idea in words.
- "Jikji 1377": 5, 8.
- No claim: 1 (what movable type is), 3/7 (Bi Sheng), 5 (1377), 6 (reading).
- Item 6: I found no opened source today for "more books did not by themselves teach reading". Keep it out of steps until it is sourced.

Proposed claims:
- **c3: In China, Bi Sheng made movable type from baked clay between 1041 and 1048.**
  - Source: Library of Congress blog, "The History of Printing in Asia ... Part 1"
    https://blogs.loc.gov/international-collections/2021/06/the-history-of-printing-in-asia-according-to-library-of-congress-asian-collections-part-1/
  - Exact words: "During the Song dynasty moveable type printing was invented by Bi Sheng (972-1051) between 1041 and 1048 using earthenware type."
- **c4 (replaces c1, sharper): Jikji, printed in Korea in 1377, is the oldest surviving book printed with movable metal type.**
  - Source: Library of Congress blog, "From Jikji to Gutenberg"
    https://blogs.loc.gov/preservation/2023/05/jikji-gutenberg/
  - Exact words: "Jikji, printed in 1377 in Cheongju, South Korea, is acknowledged as the oldest surviving book printed from moveable metal type."
- **c5 (sharper c2): Gutenberg finished his Bible in Mainz, Germany, around 1455. He made metal letters that were all alike and could be swapped.**
  - Source: Library of Congress exhibit, "The Gutenberg Bible"
    https://www.loc.gov/exhibits/bibles/the-gutenberg-bible.html
  - Exact words: "The printing of the Bible was probably completed late in 1455 at Mainz, Germany. Johann Gutenberg ... is generally credited for inventing the process of making uniform and interchangeable metal types".
- **c6 (spare, a "why" idea): Movable type helped most where writing used a small alphabet. Chinese uses thousands of characters, so it was costly there.**
  - Source: Library of Congress blog, Asia Part 1 (same URL as c3).
  - Exact words: "This was not widely used within China itself, except for very large jobs, given the high upfront cost associated with it." and "peoples who wrote using an alphabetic script were most likely to benefit from moveable type, like the Uighurs, who used a Sogdian alphabet, or the Koreans, who created the Hangul alphabet."

3-step outline:

| step | title | claim | after it, the learner can |
|---|---|---|---|
| s1 | Bi Sheng's clay letters came first | c3 | say what movable type is and where it began |
| s2 | Korea printed Jikji in metal type | c4 | place Jikji (1377) before Gutenberg |
| s3 | Gutenberg made print spread in Europe | c5 | explain why Gutenberg matters though he was not first |

Items that fit: s1 = 1, 3. s2 = 2, 5, 8. s3 = 4 + 1 new.
Drop 7 (same as 3), or turn it into a c6 "why" item.

---

## 6. mughal-revenue (Mughal administration)

Claims now (2):
- c1: Mansabdari set ranks for army and civil work in the Mughal state.
- c2: Zabt set land tax from land size and good records. It did not work the same way in all areas.

Items:

| id | type | idea tested |
|---|---|---|
| mughal-revenue-1 | predict | A mansab is a rank in civil and army service (c1) |
| mughal-revenue-2 | scenario | Zabt needs measured land and records (c2) |
| mughal-revenue-3 | choose | Main state income was tax on farm land (no claim states it) |
| mughal-revenue-4 | why | A jagir was the right to collect tax from an area (no claim) |
| mughal-revenue-5 | estimate | Zabt used about 10 years of crop and price records (no claim) |
| mughal-revenue-6 | true-not-quite | Zabt needed surveys and local records (c2) |
| mughal-revenue-7 | order | Survey land, record harvests and prices, set rate (c2) |
| mughal-revenue-8 | match | Mansabdari = ranks; jagir = revenue assignment (c1 + no claim) |

Repeats:
- "Zabt needs surveys and records": 2, 6, 7. Items 2 and 6 have almost the same answer.
- "Mansab = rank": 1, 8.
- "Jagir": 4, 8.
- No claim: 3, 4, 5.

Proposed claims:
- **c3: Most mansabdars were paid with a jagir: the right to collect land tax from an area, not cash.**
  - Source: NCERT, Themes in Indian History Part II, Theme 8 "Peasants, Zamindars and the State", p. 214
    https://ncert.nic.in/textbook/pdf/lehs204.pdf
  - Exact words: "Some mansabdars were paid in cash (naqdi), while the majority of them were paid through assignments of revenue (jagirs) in different regions of the empire. They were transferred periodically."
- **c4: Akbar's minister Todar Mal studied crop yields, prices and farmed land over 10 years to set tax rates.**
  - Source: NCERT Class 7, Our Pasts II, Ch. 4 "The Mughals", p. 42-43
    https://ncert.nic.in/textbook/pdf/gess104.pdf
  - Exact words: "Akbar's revenue minister, Todar Mal, carried out a careful survey of crop yields, prices and areas cultivated for a 10-year period".
- **c5 (sharper c2, Indian example): Zabt worked only where officials could survey land and keep careful accounts. It was not possible in Gujarat and Bengal.**
  - Source: NCERT gess104.pdf, p. 43.
  - Exact words: "It was prevalent in those areas where Mughal administrators could survey the land and keep very careful accounts. This was not possible in provinces, such as Gujarat and Bengal."
- **c6 (spare): Under Akbar, the state took one third of the average crop as tax.**
  - Source: NCERT lehs204.pdf, p. 214, Source 5 (from the Ain-i Akbari).
  - Exact words: "They add together the produce of each sort, and the third of this represents the medium produce, one-third part of which is exacted as the Royal dues."
  - Care: this is the Ain's rule for polaj and parauti land, not every kind of land.
- Item 3 support (main income = land tax), gess104.pdf p. 43: "The main source of income available to Mughal rulers was tax on the produce of the peasantry."

3-step outline:

| step | title | claim | after it, the learner can |
|---|---|---|---|
| s1 | Ranks ran the Mughal state | c1 | say what a mansab rank decided |
| s2 | Officers were paid with tax rights | c3 | explain a jagir and why it is not land ownership |
| s3 | Zabt: tax set from ten years of records | c4 | list the steps of zabt and say where it failed (c5) |

Items that fit: s1 = 1 + 1 new. s2 = 4, 8. s3 = 5, 7, 2.
Item 3 (land tax was the main income) moves to review.
Drop 6 (it is item 2 again) or rewrite it on c5 (Gujarat and Bengal).

---

## 7. company-trade-rule (Company trade and rule)

Claims now (2):
- c1: The Company won at Plassey in 1757 and Buxar in 1764. These wins helped it gain power beyond trade.
- c2: The 1765 diwani gave the Company land tax rights. In 1858, rule then went to the Crown.

Items:

| id | type | idea tested |
|---|---|---|
| company-trade-rule-1 | predict | It began as a trader, later gained land and tax power (c1 + c2) |
| company-trade-rule-2 | scenario | A war win (Plassey) came before the tax right (c1) |
| company-trade-rule-3 | choose | Diwani = collect tax in Bengal, Bihar and Orissa (c2) |
| company-trade-rule-4 | why | Buxar was a war win before the tax grant (c1) |
| company-trade-rule-5 | estimate | Diwani year: 1765 (c2) |
| company-trade-rule-6 | true-not-quite | After 1858 the Crown ruled, not the Company (c2) |
| company-trade-rule-7 | order | Plassey 1757, Buxar 1764, Diwani 1765 (c1 + c2) |
| company-trade-rule-8 | match | Diwani = revenue power; 1858 Act = Crown rule (c2) |

Repeats:
- "Battles came before the tax right": 1, 2, 4, 7. Four items, one idea.
- "Diwani": 3, 5, 8.
- Nothing teaches how it started as a trader (the hook says 1600, no claim does).
- c2 holds two ideas (1765 diwani, 1858 Crown). Split it into c2a and c2b.

Proposed claims:
- **c3: In 1600, Queen Elizabeth I gave the East India Company a charter. No other English group could trade with the East.**
  - Source: NCERT Class 8, Our Pasts III, Ch. 2 "From Trade to Territory", p. 10
    https://ncert.nic.in/textbook/pdf/hess202.pdf
  - Exact words: "In 1600, the East India Company acquired a charter from the ruler of England, Queen Elizabeth I, granting it the sole right to trade with the East. This meant that no other trading group in England could compete with the East India Company."
- **c4: The Company's first factory in Bengal was set up on the Hugli river in 1651. A factory was a trading post with a warehouse.**
  - Source: NCERT hess202.pdf, p. 11.
  - Exact words: "The first English factory was set up on the banks of the river Hugli in 1651. ... The factory had a warehouse where goods for export were stored, and it had offices where Company officials sat."
  - Also: British Library, India Office Records, Factory Records, https://searcharchives.bl.uk/catalog/032-000173250 :
    "A "factory" was a trading post where a number of merchants, or factors, resided."
- **c5: After the diwani, Bengal's tax money paid for the Company's goods and troops, so it stopped bringing gold from Britain.**
  - Source: NCERT hess202.pdf, p. 14.
  - Exact words: "The outflow of gold from Britain slowed after the Battle of Plassey, and entirely stopped after the assumption of Diwani. Now revenues from India could finance Company expenses. These revenues could be used to purchase cotton and silk textiles in India, maintain Company troops".

3-step outline:

| step | title | claim | after it, the learner can |
|---|---|---|---|
| s1 | It began as a trading company | c3 | say what the 1600 charter allowed |
| s2 | Battles turned traders into rulers | c1 | order Plassey and Buxar and say what each changed |
| s3 | Tax rights paid for trade and troops | c5 (with c2a, 1765) | explain why the diwani mattered more than one battle |

Items that fit: s1 = 1 + 1 new (c4 can feed it). s2 = 2, 7, 4. s3 = 3, 5.
c2b (1858) and items 6, 8 become review items or a later concept on Crown rule.
Drop one of 2/4/7 if a step needs room; they test the same order.

---

## 8. independence-constitution (Independence and Constitution)

Claims now (2):
- c1: Ambedkar led the group that drew up the draft. It worked for the Constituent Assembly.
- c2: India took up its Constitution on 26 November 1949. The text came into force on 26 January 1950.

Items:

| id | type | idea tested |
|---|---|---|
| independence-constitution-1 | predict | The Constituent Assembly debated and adopted it (c1, partly) |
| independence-constitution-2 | scenario | Committee drafted, Assembly debated (c1) |
| independence-constitution-3 | choose | 26 November 1949 = adoption (c2) |
| independence-constitution-4 | why | Ambedkar led a committee inside a debating Assembly (c1) |
| independence-constitution-5 | estimate | In force in 1950 (c2) |
| independence-constitution-6 | true-not-quite | Adoption day is not Republic Day (c2) |
| independence-constitution-7 | order | Assembly meets 1946, adopted 1949, in force 1950 (c2; 1946 no claim) |
| independence-constitution-8 | match | Drafting Committee = draft; 26 Jan 1950 = in force (c1 + c2) |

Repeats:
- "Committee drafted, Assembly decided": 2, 4, 8.
- "Adopted 1949, in force 1950": 3, 5, 6, 7, 8. Five items on two dates.
- No claim: the 1946 first meeting in 7.

Proposed claims:
- **c3: The Constituent Assembly first met in New Delhi on 9 December 1946.**
  - Source: Lok Sabha (Digital Sansad), "Constituent Assembly"
    https://sansad.in/ls/about/constituent-assembly
  - Exact words: "The Constituent Assembly met for the first time in New Delhi on 9 December 1946 in the Constitution Hall which is now known as the Central Hall of Parliament House."
- **c4: Making the Constitution took almost three years, with 165 days of sittings.**
  - Source: same Sansad page.
  - Exact words: "The Constituent Assembly took almost three years (two years, eleven months, and seventeen days to be precise) to complete its historic task of drafting the Constitution for Independent India. During this period, it held eleven sessions covering a total of 165 days. Of these, 114 days were spent on the consideration of the Draft Constitution."
  - Care: Sansad says "seventeen days". Some other sites say 18. Use the Sansad figure.
- **c5: Most Assembly members were chosen by the provincial assemblies: 292 from the provinces and 93 from the princely states.**
  - Source: same Sansad page.
  - Exact words: "members were chosen by indirect election by the members of the Provincial Legislative Assemblies, according to the scheme recommended by the Cabinet Mission. The arrangement was: (i) 292 members were elected through the Provincial Legislative Assemblies; (ii) 93 members represented the Indian Princely States".
  - Care: the page cuts off the third group ("4 members represented ..."). Do not state the total from this page.

3-step outline:

| step | title | claim | after it, the learner can |
|---|---|---|---|
| s1 | An Assembly met to write the rules | c3 | say who made the Constitution and when they first met |
| s2 | A committee drafted, the Assembly decided | c1 | tell the Drafting Committee's job from the Assembly's |
| s3 | Adopted in 1949, began in 1950 | c2 | tell adoption day from Republic Day |

Items that fit: s1 = 1, 7. s2 = 2, 4. s3 = 3, 6, 5.
Item 8 can go to review. c4 and c5 give new items for s1, so s1 is not only dates.

---

## Sources opened for this review (2026-10-22)

- NCERT lehs101.pdf, lehs102.pdf, lehs204.pdf (Class 12, reprint 2026-27); gess104.pdf (Class 7); hess202.pdf (Class 8, reprint 2024-25). https://ncert.nic.in/textbook/pdf/
- UNESCO World Heritage Centre: list/1442, list/140, tentativelists/5918.
- Penn Museum, Expedition magazine 6(3), 1964.
- World History Encyclopedia, "Indus Script".
- MacTutor, University of St Andrews: Zero, Indian numerals, Brahmagupta, Fibonacci, Al-Khwarizmi.
- Science Museum (London) blog on the Bakhshali manuscript.
- Library of Congress: Gutenberg Bible exhibit; two LOC blogs (Asia printing Part 1; From Jikji to Gutenberg).
- British Library, India Office Records, Factory Records.
- Lok Sabha / Digital Sansad, Constituent Assembly page.

Could not open today: Britannica (403), the Met (429), UK Parliament pages (403),
constitutionofindia.net (refused). No claim above rests on them.
