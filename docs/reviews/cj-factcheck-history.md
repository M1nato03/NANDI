# Fact check: History and civilisations topic

File checked: `content/topics/topic.history-civilisations.json` on `origin/learn-steps` (version 1.0.0, 8 concepts).
Checked on 2026-10-22.

Scope: every claim, plus hooks, rules, teach cards, visuals, examples, guided tries, items, options, feedback, misconceptions and quests.
Method: each cited URL was opened with curl or a web fetch tool. Sentences are quoted as found.
If a page could not be opened, it says so. Where a page was blocked, I looked for another copy or an official source and say which one.

Verdicts: SUPPORTED, PARTLY, NOT SUPPORTED, SOURCE DEAD (or BLOCKED: the page exists but refused automated access).

## Summary

| Concept | Claims | Supported | Problems |
|---|---|---|---|
| indus-cities | 5 | 2 fully (c1 via a different UNESCO document, c3); c2, c4 blocked but backed elsewhere; c5 partly | 3 of 4 cited pages blocked (403). "Public pool" is not backed: NCERT suggests a ritual bath on the Citadel. "One third dug" is a 1979 figure. The text never says the site is in Sindh, Pakistan. |
| ashoka-edicts | 5 | 2 (c3, c4) | Met essay blocked (429). "Rocks first, then pillars" is not in the NCERT text. Officers spreading dhamma "because" people could not read is joined by the writer, not the source. "Ruled from the far northwest to Bengal" has no source. Spelling "Nandagarh" should be "Nandangarh". |
| silk-road-ideas | 5 | 4 | The one source (a Met exhibition page) is blocked; checked against a word-for-word copy. The source says Hun invasions *forced* Gandharan monks to move ("appear to have"). The topic drops that, and adds traders as carriers of art. The text never says where Gandhara is. |
| indian-place-value | 4 | 4 | Small: the Babylonian "61 and 601" example is in base ten, but their system was base 60. The source was last updated in 2000, but its `year` field says 2024. It is out of date on the Bakhshali dating. |
| printing-and-reading | 5 | 4 | "77 years" clashes with the 1455 date used beside it (1455 − 1377 = 78). "Speed was not the reason" has no source. "All the same size" misstates "uniform and interchangeable". c2 drops the cost reason. |
| mughal-revenue | 5 | 5 | Item feedback says zat set "the horsemen he kept". NCERT ties horsemen to military duty (sawar), not zat. Hook calls zabt a "fair" tax, but NCERT says the state tried to "maximise its claims". |
| company-trade-rule | 6 | 6 | Timeline mark "1813: sole trade right ends" has no cited source and is imprecise (the China monopoly lasted to 1833). Plassey is shown as a plain "win", but NCERT stresses that Mir Jafar's forces never fought. |
| independence-constitution | 7 | 7 (c1 slightly simplified) | Timeline marks are not to scale: 24 and 26 Jan are 2 days apart but drawn 17 points apart. "Now the Central Hall of Parliament" is out of date (Samvidhan Sadan since Sept 2023). "No British approval was needed" has no source. "2,473 taken up" can read as "accepted". |
| **Total** | **42** | **34 fully supported, 6 partly, 2 not opened but backed by another official page** | 5 of 20 cited URLs blocked to automated access (UNESCO list page, 2× Harappa.com, 2× Met). |

Other file-level points:
- Every concept's `factCheck.verdicts` marks every claim and item "supported". That overstates it: see the PARTLY and NOT SUPPORTED rows below.
- The `changelog` says "all 64 items revised", but the file holds 48 items (6 per concept), plus 24 step hooks and 24 guided tries.
- No firearm content, no guilt or loss copy, no random rewards found in this topic.

---

## Source access log

| Ref | URL | Result |
|---|---|---|
| unesco-indus | https://whc.unesco.org/en/list/138 | BLOCKED: HTTP 403 (Cloudflare) by curl and the fetch tool. Used instead: UNESCO's own ICOMOS evaluation, https://whc.unesco.org/archive/advisory_body_evaluation/138.pdf (opened; dated 1979). |
| indus | https://www.harappa.com/blog/mohenjo-daro-street-drains | BLOCKED: HTTP 403. Not read directly. Cross-checked with NCERT Class 12 Theme 1, https://ncert.nic.in/textbook/pdf/lehs101.pdf (opened). |
| harappa-bath | https://www.harappa.com/blog/mohenjo-daro-great-bath-diagram | BLOCKED: HTTP 403. Not read directly. |
| isaw | https://isaw.nyu.edu/events/archive/2017/revisiting-harappan-iconography | Opened. It is a talk abstract. |
| ashoka | https://www.metmuseum.org/de/essays/mauryan-empire-ca-323-185-b-c | BLOCKED: HTTP 429 ("Vercel Security Checkpoint"), also the English and old `/toah/` URLs. |
| ncert-kings | https://ncert.nic.in/textbook/pdf/lehs102.pdf | Opened (Reprint 2026-27). |
| silk | https://www.metmuseum.org/exhibitions/listings/2012/buddhism | BLOCKED: HTTP 429. Text checked on a word-for-word copy: https://buddhistartnews.wordpress.com/2012/06/08/buddhism-along-the-silk-road-5th-8th-century/ (opened). |
| zero | https://mathshistory.st-andrews.ac.uk/HistTopics/Zero/ | Opened. The page says "Last Update November 2000". |
| print | https://www.loc.gov/exhibits/bibles/the-gutenberg-bible.html | Opened. |
| loc-asia | https://blogs.loc.gov/international-collections/2021/06/the-history-of-printing-in-asia-according-to-library-of-congress-asian-collections-part-1/ | Opened. |
| loc-jikji | https://blogs.loc.gov/preservation/2023/05/jikji-gutenberg/ | Opened. |
| mughal | https://ncert.nic.in/textbook/pdf/lehs204.pdf | Opened. |
| ncert-mughals | https://ncert.nic.in/textbook/pdf/gess104.pdf | Opened. The bold key terms (mansabdar, jagir, zabt) do not come out in text extraction, so the quotes below show them in [brackets]. |
| company | https://searcharchives.bl.uk/catalog/032-000173250 | Opened. |
| ncert-trade | https://ncert.nic.in/textbook/pdf/hess202.pdf | Opened. |
| ncert-revolt | https://ncert.nic.in/textbook/pdf/hess205.pdf | Opened. |
| assembly | https://sansad.in/ls/about/constituent-assembly | Opened. |
| pib-nis | https://newindiasamachar.pib.gov.in/archive/nov2/english/files/basic-html/page11.html | Opened. The text is in two columns, so the extracted sentences are interleaved. |
| pib-nis-day | https://newindiasamachar.pib.gov.in/archive/nov2/english/files/basic-html/page12.html | Opened. |
| pib-republic | https://static.pib.gov.in/WriteReadData/specificdocs/documents/2026/jan/doc2026125767901.pdf | Opened. |

Extra pages opened for cross-checks:
- Bihar Tourism, Lauria Nandangarh: https://tourism.bihar.gov.in/en/destinations/west-champaran/lauria-nandangarh
- All India Radio: https://www.newsonair.gov.in/tag/lok-sabha-secretariat

---

## 1. indus-cities

### Claims

| Claim | Source quote | Verdict |
|---|---|---|
| c1: Lower town streets cross at right angles; early town planning. | Cited page blocked. UNESCO ICOMOS evaluation (1979): "The extensive lower city is a complex of private and public houses, wells, shops and commercial buildings. These buildings are laid out along streets which intersect each other at right angles, in a highly orderly form of city planning". NCERT lehs101: "roads and streets were laid out along an approximate 'grid' pattern, intersecting at right angles." | SUPPORTED (via UNESCO PDF and NCERT; cited page BLOCKED) |
| c2: All streets and lanes had drains; most covered with baked bricks; pipes and chutes from houses. | Cited page blocked. NCERT lehs101: "Every house was connected to the street drains. The main channels were made of bricks set in mortar and were covered with loose bricks that could be removed for cleaning. In some cases, limestone was used for the covers." Also: "It seems that streets with drains were laid out first and then houses built along them." | PARTLY verified. Covers and house links are backed by NCERT. "All the streets and lanes" and "pipes and chutes" could not be read on the cited page. |
| c3: Script not deciphered; experts learn from what survives. | ISAW: "the fact that the Indus script remains undeciphered ... poses significant challenges to their interpretation." NCERT lehs101: "Although the script remains undeciphered to date". | SUPPORTED |
| c4: Great Bath some 39 ft (about 12 m) long, steps at each end. | Cited page blocked. NCERT lehs101: "There were two flights of steps on the north and south leading into the tank". The length is not in any page I could open. A search-engine summary says the Harappa.com page quotes Marshall: "some 39 feet long by 23 feet broad". | Steps SUPPORTED by NCERT. Length not verified (source BLOCKED). |
| c5: About 240 ha; only about a third dug since 1922. | UNESCO ICOMOS evaluation: "Of massive proportions (240 hectares)" and "Of this vast urban ruin, only about one-third has been excavated." NCERT lehs101 timeline: "1922 Excavations begin at Mohenjodaro". | PARTLY. The numbers are backed, but by a 1979 document and by NCERT, not by the cited list page (blocked). "A third" is a 1979 figure and may be out of date. |

### Other text
- **m1 correction, "The Great Bath is a big public pool": NOT SUPPORTED.** NCERT lehs101 puts it on the Citadel and says: "The uniqueness of the structure, as well as the context in which it was found (the Citadel, with several distinctive buildings), has led scholars to suggest that it was meant for some kind of a special ritual bath." Suggested fix: "a large brick tank on the Citadel; its exact use is unknown."
- Guided s1 says the street grid is "east of the high mound". This is backed by UNESCO 1979: "a stupa mound which rises in the western sector and to the East, the lower city ruins".
- Item 12 and the s2 guided try both say settling pools caught mud. This is backed by NCERT: "House drains first emptied into a sump or cesspit into which solid matter settled" and "Very long drainage channels were provided at intervals with sumps for cleaning."
- Teach s2, the m4 correction and item 16 say covers kept "the waste out of sight". No source opened gives that reason. NCERT says the covers "could be removed for cleaning". Small inference.
- Guided s3, "a large pool with rooms around it": NCERT says "a corridor on all four sides" and "rooms on three sides". Fine.
- Hook s3, "they name each king": NCERT says seal writing "probably contain[s] the name and title of the owner". The feedback "We cannot name rulers from the signs" is fine.
- Numbers: 80 × 3 = 240 ✔. Distractor "110" is 80 + 80/3 ≈ 107 ✔. Distractor "27" is 80/3 ✔.

### Framing
- The text never says Mohenjo-daro is in Sindh, Pakistan. An Indian learner may assume it is in India. Add "in Sindh, in today's Pakistan". UNESCO: "Location: Sind ... State party: Pakistan".
- Indian Harappan sites (Dholavira, Lothal, both in NCERT lehs101) are not mentioned. This is optional.

### Sources
- Harappa.com is a well-regarded site run by scholars, but it is private and blocked to automated access. NCERT lehs101 covers drains, the Great Bath and the script, and opens. Use it as the main source.
- ISAW is a talk abstract. It is weak for a core claim. NCERT lehs101 says the same thing.
- For the UNESCO list page, add the evaluation PDF as a second link.

---

## 2. ashoka-edicts

### Claims

| Claim | Source quote | Verdict |
|---|---|---|
| c1: Edicts carved on rocks and **later** on pillars. | NCERT lehs102: "Asoka was the first ruler who inscribed his messages to his subjects and officials on stone surfaces – natural rocks as well as polished pillars." Met essay BLOCKED. A search summary says the Met gives the pillar edicts as "about thirteen years later", but I could not read that page. | PARTLY. Rocks and pillars are backed. The order "rocks first, then pillars" is not in any page I could open. |
| c2: Pillar at Lauriya Nandagarh, Bihar, about 32 ft, seated lion. | Met BLOCKED. Bihar Tourism (Govt of Bihar): "The height of the pillar built by Emperor Ashoka is 32 feet, for which sandstone has been used and there is a circular abacus at the top of the pillar on which the lion statue stands." | Not verified on the cited page (BLOCKED). The facts match an official Bihar page. **Spelling:** official spelling is "Lauria/Lauriya Nandangarh", not "Nandagarh". |
| c3: Most edicts in Prakrit, mostly Brahmi; some in the northwest in Kharosthi; Afghanistan in Greek and Aramaic. | NCERT lehs102: "Most Asokan inscriptions were in the Prakrit language while those in the northwest of the subcontinet were in Aramaic and Greek. Most Prakrit inscriptions were written in the Brahmi script; however, some, in the northwest, were written in Kharosthi. The Aramaic and Greek scripts were used for inscriptions in Afghanistan." | SUPPORTED |
| c4: Dhamma: respect elders, be kind to servants, respect other faiths. | NCERT lehs102: "This included respect towards elders, generosity towards Brahmanas and those who renounced worldly life, treating slaves and servants kindly, and respect for religions and traditions other than one's own." | SUPPORTED, but it picks some items. It drops "slaves" and "generosity towards Brahmanas and those who renounced worldly life". |
| c5: Most people could probably not read, **so** officers were sent. | NCERT lehs102: "Most people were probably not literate." (p. 48, in a passage on the limits of inscriptions.) Separately: "Special officers, known as the dhamma mahamatta, were appointed to spread the message of dhamma." | PARTLY. Both facts are in the source, but the source does not link them. The "so" is the writer's. |

### Other text
- **Hook s2, "Ashoka ruled from the far northwest to Bengal": no source.** NCERT gives Chandragupta's reach "as far northwest as Afghanistan and Baluchistan" and Ashoka's conquest of "Kalinga (present-day coastal Orissa)". It says nothing about Bengal. Fix: cite a source, or say "from Afghanistan to Odisha and beyond".
- Item feedback, "Early scholars guessed Sanskrit": backed. NCERT: "Scholars who studied early inscriptions sometimes assumed these were in Sanskrit, although the earliest inscriptions were, in fact, in Prakrit."
- Guided s2, "Devanagari ... grew out of Brahmi": backed. NCERT: "Most scripts used to write modern Indian languages are derived from Brahmi".
- Hook s1 and teach s1, "rocks near towns and routes": the NCERT line is a question ("If a king's orders were inscribed on natural rocks near cities or important routes of communication, would passers-by have stopped to read these?"). Fair enough as a paraphrase.
- Estimate item: 10 / 0.3 ≈ 33, and 32 ft ≈ 9.75 m ✔.

### Framing
- Kalinga is left out. NCERT gives it at length (Source 11) and warns that the "anguish" edict "has not been found in the region that was conquered". This is not an error. But the topic's picture of dhamma as pure kindness is simpler than NCERT's.

### Sources
- The Met URL uses the German locale path `/de/`. Use the English path. The Met is blocked for bots, so consider ASI pages or NCERT as the main source for the pillar.

---

## 3. silk-road-ideas

The Met page is blocked (HTTP 429). All quotes below come from the word-for-word copy on buddhistartnews.wordpress.com (Met text, exhibition 2 June 2012 to 10 February 2013).

### Claims

| Claim | Source quote | Verdict |
|---|---|---|
| c1: Goods up the Indus to Gandhara, then to China via Afghanistan or high passes and Central Asia. | "Trade goods were transported along the Indus River up to Gandhara and then to China via routes passing through Afghanistan or over high Himalayan passes and then through Central Asia." | SUPPORTED |
| c2: By about 50 BCE, monsoon winds carried ships across the Arabian Sea to west-coast ports. | "By 50 B.C. maritime routes allowed merchants to sail down the Red Sea and to take advantage of monsoon winds to cross the Arabian Sea and reach ports along the west coast of India." | SUPPORTED |
| c3: By the 5th century Buddhism had thrived in Gandhara and Swat about 600 years, paid for by trade through the Khyber and Karakorum passes. | "By the fifth century, Buddhism had been thriving in Gandhara and the Swat Valley (northern Pakistan) for six hundred years, financed by the extensive trade that flowed through the Khyber and Karakorum passes." | SUPPORTED |
| c4: Monks from Gandhara moved into Afghanistan and Central Asia; their style grew popular there. | "These invasions also appear to have forced Gandharan monks into Afghanistan and western Central Asia, and a corresponding taste for Gandharan classical forms became important at Buddhist centers in these areas." | PARTLY. The source says the monks were *forced* by Hun invasions and hedges with "appear to have". The topic presents a calm migration. |
| c5: Central Asian Buddhist centres grew at oases and towns that were trader rest stops. | "In Central Asia, prosperous Buddhist complexes were established at oases and urban centers that served as way stations for traders crossing the vast deserts." | SUPPORTED |

### Other text
- **Rule and s3 takeaway, "Monks and traders carried ideas and art styles": PARTLY.** The source credits the monks, pushed out by invasions, with carrying the style. Traders appear only as users of the oasis stops.
- Hook s2, option c feedback, "Western trade mattered": no source.
- The order item runs the route in reverse (China → passes → Gandhara → Indus → port). The source gives only the other direction. Fine as reasoning, but it is not a sourced fact.
- Concept hook, "A Buddhist centre stood at a desert oasis ... Who paid for it?": the source says Gandhara's Buddhism was paid for by trade. It does not say who paid for the Central Asian oasis centres.
- Estimate: 24 × 25 = 600 ✔.

### Framing
- The text never says where Gandhara is. The source says "Gandhara and the Swat Valley (northern Pakistan)". Add that.
- The same source says the north Indian Gupta style spread outwards: "the Gupta artistic style of north India pervaded the Buddhist art of Kashmir and the Swat Valley, reaching as far as Afghanistan." This is an Indian-origin flow the topic could use. It is missing now.
- "Silk Road" is itself a 19th-century European label. Optional: add one line saying so.

### Sources
- One exhibition blurb carries the whole concept, and it is blocked for bots. Add a second source: a museum or university page on Gandhara and the trade routes, or an NCERT chapter.

---

## 4. indian-place-value

### Claims

| Claim | Source quote (MacTutor, Zero) | Verdict |
|---|---|---|
| c1: In the Indian base-ten system, zero can mark an empty place. | "One use is as an empty place indicator in our place-value number system." / "The Indians also used a place-value system and zero was used to denote an empty place." | SUPPORTED |
| c2: Brahmagupta, 7th century: n − n = 0; n × 0 = 0. | "Brahmagupta attempted to give the rules for arithmetic involving zero and negative numbers in the seventh century. He explained that given a number then if you subtract it from itself you obtain zero." / "Brahmagupta then says that any number when multiplied by zero is zero". | SUPPORTED |
| c3: al-Khwarizmi wrote in Arabic about digits 1–9 and 0; later Fibonacci took them to Europe. | "al-Khwarizmi wrote Al'Khwarizmi on the Hindu Art of Reckoning which describes the Indian place-value system of numerals based on 1, 2, 3, 4, 5, 6, 7, 8, 9, and 0." / "In Liber Abaci he described the nine Indian symbols together with the sign 0 for Europeans in around 1200 but it was not widely used for a long time after that." | SUPPORTED. The page does not say the book was "in Arabic", but it is common knowledge. |
| c4: Babylonians used place value over 1,000 years without a zero. | "the Babylonians had a place-value number system without this feature for over 1000 years." | SUPPORTED |

### Other text
- Guided s3, "Fibonacci called 0 a sign": backed. "he speaks of the 'sign' zero while the other symbols he speaks of as numbers".
- Guided s3 feedback, "Indian and Arab thinkers had gone further": backed. "he did not reach the sophistication of the Indians Brahmagupta, Mahavira and Bhaskara nor of the Arabic and Islamic mathematicians such as al-Samawal."
- Guided s1, "Picture writing 61 and 601 with nothing between": the Babylonian system was base 60. MacTutor's own example is "216 or 21 '' 6". Label it as a base-ten comparison, or use MacTutor's example.
- Numbers checked: 205 − 25 = 180 ✔. ₹1,050 → ₹150 ✔. 7,009 / 79 ≈ 88.7 ✔. 79 × 9 = 711 ✔. 79 × 900 = 71,100 ✔. 25 × 8 = 200 < 205 ✔.

### Framing
- Balanced and India-centred. No problems.

### Sources
- The `year` field says 2024. The page says "Last Update November 2000". Fix the metadata.
- MacTutor is from 2000, so it does not cover the 2017 radiocarbon dating of the Bakhshali manuscript. It also does not mention the 876 Gwalior inscription as an Indian landmark (the page has it, but the topic does not use it). Optional: add a newer Indian or university source. I did not open a Bakhshali page for this review.

---

## 5. printing-and-reading

### Claims

| Claim | Source quote | Verdict |
|---|---|---|
| c1: Bi Sheng, movable type, 1041–1048, baked clay. | loc-asia: "During the Song dynasty moveable type printing was invented by Bi Sheng (972-1051) between 1041 and 1048 using earthenware type." | SUPPORTED |
| c2: Because Chinese has so many characters, block printing stayed main. | loc-asia: "Due to considerable number of characters used in the Chinese language and the relatively lower cost of the technology, wood- or metal- block printing remained the dominant technology." | PARTLY. It drops the second reason (lower cost). |
| c3: Jikji, Cheongju, 1377, oldest surviving book from movable metal type; 77 years before the Gutenberg Bible. | loc-jikji: "Jikji is the abbreviated title of the world's oldest extant book made with moveable type, printed in Cheongju, Korea in 1377, preceding the Gutenberg Bible by 77 years." / "Jikji, printed in 1377 in Cheongju, South Korea, is acknowledged as the oldest surviving book printed from moveable metal type." | SUPPORTED, with a number clash (see below). |
| c4: Gutenberg credited with uniform, swappable metal type; Bible probably finished in Mainz in 1455. | print: "Johann Gutenberg ... is generally credited for inventing the process of making uniform and interchangeable metal types" / "The printing of the Bible was probably completed late in 1455 at Mainz, Germany." | SUPPORTED |
| c5: Printing put knowledge within reach of every person who knew how to read. | print: "Gutenberg's invention of the mechanical printing press made it possible for the accumulated knowledge of the human race to become the common property of every person who knew how to read". | SUPPORTED (see framing) |

### Other text
- **Number clash.** The hook, c3, the s2 hook and the s2 example all say "77 years". The s2 visual and c4 give the Bible as 1455, and 1455 − 1377 = 78. The LoC blog says both "77 years" and "about the year 1455". Use "78 years" or "nearly 80 years".
- **Item distractor c feedback, "Speed was not the reason": no source.** The source gives two reasons, the number of characters and lower cost. It says nothing about speed.
- **Teach s3, "metal letters all the same size": PARTLY.** The source says "uniform and interchangeable". Type pieces share a height but differ in width. Use "matching" instead.
- Item feedback, "Korea used metal type in the 1200s": backed. loc-asia: "By doing so Koreans were the first to use metal moveable type in the 1200s."
- Visual, "868: Diamond Sutra, woodblock": backed. loc-jikji: "the Diamond Sutra was printed from woodblocks in China in 868".
- Visual positions (800–1500): 868 → 9.7, 1377 → 82.4, 1455 → 93.6. The file has 10, 82, 94 ✔.
- Estimate, 1040s → 1200s ≈ 180, range 150–220 ✔.

### Framing
- The c5 line comes from an old LoC exhibit that credits Gutenberg's press with "an immense forward step in the emancipation of the human mind". The topic turns it into "printing" in general. That is fair, but it rests on a Europe-centred quote. The topic as a whole is balanced: China, then Korea, then Mainz.

### Sources
- The LoC sources are good. For Jikji, UNESCO's Memory of the World register would be stronger. I could not open a working UNESCO URL: the one I tried returned 404.

---

## 6. mughal-revenue

Quotes from gess104 (Class 7) lose the bold key terms in text extraction. Missing words are shown in [brackets], taken from the context of the sentence.

### Claims

| Claim | Source quote | Verdict |
|---|---|---|
| c1: A mansabdar held a mansab (rank); zat set rank and pay; he had to keep a set number of horsemen. | gess104: "[mansab], meaning a position or rank" / "[Their rank] and salary were determined by a numerical value called [zat]. The higher the [zat], the more prestigious was the noble's position in court and the larger his salary." / "[The mansabdar's] military responsibilities required him to maintain a specified number of [sawar] or cavalrymen." | SUPPORTED |
| c2: Most were paid through jagirs; most did not live in or run them. | lehs204: "Some mansabdars were paid in cash (naqdi), while the majority of them were paid through assignments of revenue (jagirs) in different regions of the empire. They were transferred periodically." gess104: "most [mansabdars] did not actually reside in or administer their [jagirs]. They only had rights to the revenue of their assignments which was collected for them by their servants". | SUPPORTED |
| c3: Todar Mal surveyed yields, prices, land over ten years; provinces split into circles with crop rates. | gess104: "Akbar's revenue minister, Todar Mal, carried out a careful survey of crop yields, prices and areas cultivated for a 10-year period, ... was divided into revenue circles with its own schedule of revenue rates for individual crops." | SUPPORTED |
| c4: Zabt worked where land could be surveyed; not in Gujarat and Bengal. | gess104: "It was prevalent in those areas where Mughal administrators could survey the land and keep very careful accounts. This was not possible in provinces, such as Gujarat and Bengal." | SUPPORTED |
| c5: 29 mansabdars at 5,000 zat under Akbar; 79 under Aurangzeb. | gess104 margin: "In Akbar's reign there were 29 mansabdars with a rank of 5,000 zat; by Aurangzeb's reign the number of mansabdars had increased to 79." | SUPPORTED |

### Other text
- **The zat item's feedback, "Zat set a noble's rank and pay and the horsemen he kept": NOT SUPPORTED.** NCERT ties rank and salary to zat. It ties the cavalry to his separate "military responsibilities" (sawar). The college-club comparison ("level number sets their budget and how many members they must lead") repeats the mix-up. Fix: "Zat set rank and pay; a separate duty set how many horsemen he kept."
- **Hook s3, "How would you set a fair crop tax", and option c feedback, "A fair rate comes from the land's own yields": framing not backed.** lehs204: "While fixing revenue, the attempt of the state was to maximise its claims." gess104 also says that under Aurangzeb "the peasantry therefore suffered tremendously". Use "a steady" or "a predictable" tax, not "fair".
- Forest item: backed by lehs204. "forests covered huge areas of the subcontinent and thus remained unmeasured."
- m3 correction, "holders were moved": backed by lehs204, "They were transferred periodically."
- Estimate: 79 / 2.7 ≈ 29.3 ✔. 79 × 2.7 ≈ 213 ✔.

### Framing
- Neutral. No communal framing.

### Sources
- Both NCERT chapters are strong.

---

## 7. company-trade-rule

### Claims

| Claim | Source quote | Verdict |
|---|---|---|
| c1: 1600 charter from Elizabeth I, sole English right to trade East. | ncert-trade: "In 1600, the East India Company acquired a charter from the ruler of England, Queen Elizabeth I, granting it the sole right to trade with the East. This meant that no other trading group in England could compete with the East India Company." | SUPPORTED |
| c2: A factory was a trading post with factors; first English factory on the Hugli in 1651. | BL: "A 'factory' was a trading post where a number of merchants, or factors, resided." ncert-trade: "The first English factory was set up on the banks of the river Hugli in 1651. ... The factory had a warehouse where goods for export were stored, and it had offices where Company officials sat." | SUPPORTED |
| c3: Plassey 1757, first major win; Buxar 1764. | ncert-trade: "The Battle of Plassey became famous because it was the first major victory the Company won in India." / "defeated in a battle fought at Buxar (1764)". | SUPPORTED |
| c4: 1765 diwani of Bengal, Bihar and Orissa from the Mughal emperor. | BL: "Following the Mogul Emperor's grant of the diwani (authority to collect revenue) of Bengal, Bihar and Orissa in 1765, the Company assumed administrative control of these provinces." | SUPPORTED |
| c5: After the diwani, Indian revenue paid for cloth, troops, buildings; British gold stopped. | ncert-trade: "The outflow of gold from Britain slowed after the Battle of Plassey, and entirely stopped after the assumption of Diwani. Now revenues from India could finance Company expenses. These revenues could be used to purchase cotton and silk textiles in India, maintain Company troops, and meet the cost of building the Company fort and offices at Calcutta." | SUPPORTED |
| c6: 1858 law moved the Company's powers to the Crown; Governor-General became Viceroy. | ncert-revolt: "The British Parliament passed a new Act in 1858 and transferred the powers of the East India Company to the British Crown ... The Governor-General of India was given the title of Viceroy, that is, a personal representative of the Crown." | SUPPORTED |

### Other text
- **s3 visual mark, "1813: sole trade right ends": no source among the step's refs (only ncert-revolt), and imprecise.** BL: "the Company's trading function finally came to an end under the Charter Act of 1813 when its monopoly rights on trade to India were withdrawn. In 1833 the Company's monopoly on the China trade was also abolished." Use "1813: India trade monopoly ends" and add `company` to the step refs.
- Hook, "came to trade in cloth and spices": backed. NCERT: "cotton and silk produced in India had a big market in Europe. Pepper, cloves, cardamom and cinnamon too were in great demand."
- Dutch item: backed. "The royal charter, however, could not prevent other European powers from entering the Eastern markets."
- Visual positions (1600–1858): 1765 → 64.0, 1813 → 82.6. The file has 64 and 83 ✔. The estimate 1765 − 1600 = 165 ✔.

### Framing
- Plassey appears as a plain military "win". NCERT's account is that "the forces led by Mir Jafar, one of Sirajuddaulah's commanders, never fought the battle. Clive had managed to secure his support by promising to make him nawab". NCERT also records that the Company "bribed Mughal officials". One line on how Plassey was won would match the NCERT framing and avoid a Company-centred story.
- "Revolt of 1857" matches NCERT's wording.

### Sources
- Strong: NCERT and the British Library.

---

## 8. independence-constitution

### Claims

| Claim | Source quote | Verdict |
|---|---|---|
| c1: First met in New Delhi, 9 Dec 1946; most members picked by provincial assemblies; others for princely states. | assembly: "The Constituent Assembly met for the first time in New Delhi on 9 December 1946 in the Constitution Hall which is now known as the Central Hall of Parliament House." / "members were chosen by indirect election by the members of the Provincial Legislative Assemblies" / "(i) 292 members were elected through the Provincial Legislative Assemblies; (ii) 93 members represented the Indian Princely States; and (iii) 4 members represented ..." | SUPPORTED. "Others = princely states" leaves out the third group of 4. |
| c2: 29 Aug 1947, Drafting Committee under Dr B.R. Ambedkar. | pib-nis: "On August 29, 1947, the Constituent Assembly set up a Drafting Committee under the Chairmanship of Dr B.R. Ambedkar to prepare a Draft [Constitution]". | SUPPORTED |
| c3: Took up and settled 2,473 of 7,635 changes. | pib-nis: "the Assembly moved, discussed and disposed of as many as 2,473 amendments out of a total of 7,635 tabled." | SUPPORTED (but see the wording note below) |
| c4: Adopted 26 Nov 1949; in force 26 Jan 1950. | pib-nis-day: "The Constitution of India was adopted on November 26, 1949". pib-republic: "Adopted: 26 November, 1949 / Came into force: 26 January, 1950". | SUPPORTED |
| c5: 2 years 11 months 17 days; 11 sessions; 165 days. | assembly: "two years, eleven months, and seventeen days to be precise" / "it held eleven sessions covering a total of 165 days." | SUPPORTED |
| c6: Signed 24 Jan 1950; start date chosen because of the 1929 Congress call to mark 26 January each year. | pib-nis-day: "the members appended their signatures to it on January 24, 1950." / "On December 31, 1929, the Congress adopted the Poorna Swaraj Resolution and called upon the people to celebrate January 26 as the Independence Day every year. After the Independence, it was decided that the Constitution would come into force on January 26, 1950." | SUPPORTED |
| c7: On 26 Jan 1950 the Assembly became a provisional Parliament until 1952. | pib-nis: "On that day, the Assembly ceased to exist, transforming itself into the Provisional Parliament of India until a new Parliament was constituted in 1952." | SUPPORTED |

### Other text
- **s3 visual timeline is not to scale.** The axis runs "Nov 1949" to "Feb 1950", and the marks sit at 25 / 65 / 82. 24 and 26 January are 2 days apart but drawn 17 points apart. If the axis is 1 Nov to 1 Feb, the right positions are about 27 / 91 / 93. If it ends on 28 Feb, they are about 21 / 70 / 72. Fix the positions or the axis.
- **s1 example feedback, "the Constitution Hall, now the Central Hall of Parliament": out of date.** Since 19 September 2023 the old building has been Samvidhan Sadan. All India Radio: "Lok Sabha Secretariat has issued a notification for designating the old Parliament building as Samvidhan Sadan." (The sansad.in source still uses the old wording.) Use "the Central Hall of the old Parliament House, now Samvidhan Sadan".
- **Item feedback, "No British approval was needed": true but no cited source.** Add a source, for example on the Indian Independence Act 1947, or soften the line.
- **c3, m3 and guided s2, "taken up 2,473 changes": wording risk.** The source says "moved, discussed and disposed of". That does not mean "accepted". Learners may read "taken up" as "accepted". Use "debated and decided".
- s1 visual, 292 and 93: backed. The 4 members from the Chief Commissioners' provinces are missing, and so is the drop to 299 after Partition (pib-nis: "the membership of the Assembly was reduced to 299"). Optional.
- Guided s3, "Kartavya Path": backed by pib-republic. "national ceremony and parade held in New Delhi along the Kartavya Path."
- Numbers: 2y 11m 17d ≈ 35.5 months ✔. 2,473 / 7,635 = 0.32 ✔. Half of 7,635 ≈ 3,800 ✔.

### Framing
- Good. It credits the whole Assembly and not one person, and it names Ambedkar's role correctly.
- The concept title says "Independence", but the concept has no independence content beyond "before independence". Optional: retitle to "Making the Constitution".

### Sources
- sansad.in and PIB are official. New India Samachar is a government magazine. It is fine for dates, but sansad.in or the Constitution Assembly Debates are stronger.

---

## Fix list (by priority)

1. Mughal: correct "zat set ... the horsemen he kept" in the zat item and its club comparison.
2. Indus: remove "public" from the m1 correction. Say it sits on the Citadel and its use is unknown (NCERT: "some kind of a special ritual bath").
3. Constitution: re-plot the s3 timeline marks. Update "Central Hall of Parliament" to Samvidhan Sadan.
4. Printing: make 77 and 1455 agree (use 78, or "nearly 80"). Drop "Speed was not the reason". Change "all the same size" to "matching".
5. Silk Road: say monks were driven out by Hun invasions ("appear to have"). Drop "traders" as carriers of art. Say Gandhara is in northern Pakistan.
6. Ashoka: source or remove "far northwest to Bengal". Source or soften "rocks first, then pillars". Drop the "so" in c5. Fix "Nandagarh" to "Nandangarh".
7. Mughal: replace "fair" with "steady" or "predictable".
8. Company: change the 1813 mark to "India trade monopoly ends" and cite BL. Add one line on Mir Jafar at Plassey.
9. Indus: say Mohenjo-daro is in Sindh, Pakistan. Move the main sources to NCERT lehs101 and the UNESCO evaluation PDF.
10. Metadata: MacTutor `year` (page last updated in 2000). Met `/de/` URL. Recheck the `factCheck` blocks, which mark everything "supported". The changelog says 64 items, but the file has 48.
