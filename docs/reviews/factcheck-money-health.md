# Independent fact check: money-markets and health-nutrition (learn-steps)

Date: 2026-10-21. Branch checked: `origin/learn-steps` at `fc35e7c`. Files: `content/topics/topic.money-markets.json` (10 concepts) and `content/topics/topic.health-nutrition.json` (8 concepts).
This is the independent second check before release. No content was changed.

## How this was checked

- Every source URL in the 18 concepts (35 distinct URLs) was fetched on 2026-10-21 with curl or headless Chromium. HTML was converted to text and PDFs with `pdftotext`. Claims were checked against that text. The builder's `factCheck` verdicts were removed from the copy reviewed so they could not anchor the check.
- **SUPPORTED** means the quoted sentence or figure was found in a page fetched in this session. Every long quote in the claim tables was then machine-matched against the fetched text. All quotes from the cited sources matched; the only ones that did not were from extra pages opened for the "Fix" lines (marked as such).
- All maths was recomputed in Python: percentages, compounding, SIP, rule of 72 against exact ln 2/ln(1+r), EMI amortisation, kcal, g/kg, tsp/g and scale positions. Each concept's computations are listed under "Numbers checked".
- India-2026 currency checks were made against pages opened today: the RBI homepage, RBI monetary-policy overview, NPCI, RBI/NPCI fraud pages, ICMR-NIN DGI 2024, ICMR-NIN RDA 2020 and FSSAI-related reporting. Where only a secondary source (news) could be opened, the problem entry says so.

## Source availability (2026-10-21)

| Source (concept) | Status |
| --- | --- |
| mospi.gov.in `CPI_for_sankhyiki.pdf` (inflation `cpi`) | **Unreachable**: TLS chain failure over https, HTTP 503 over http and via a second fetcher. Content not seen. |
| systemhealth.rbi.org.in `FS_FAQs.aspx_Id%3D77...` (loan-emi `rbi-loan`) | **Dead/mangled URL** (TLS failure, 502). The real page `https://www.rbi.org.in/Scripts/FS_FAQs.aspx?Id=77&fn=2754` loads and supports every loan-emi claim. |
| npci.org.in `/what-we-do/upi/faqs` (upi-scams `npci-faq`) | **Dead**: "404 Page Not Found". The current FAQ is at `https://www.npci.org.in/faqs/upi`. One checker opened it; my re-fetch got 403/error-page, so it is intermittently bot-blocked. |
| spglobal.com SPIVA India (index-funds `spiva-india`) | **Blocked for bots** (403 "Security Controls Triggered"); also blocked for headless Chromium. Content not seen. |
| heart.org physical activity page (exercise-heart `heart`) | **Blocked for bots** (Cloudflare 403). Content not seen. |
| All other 30 URLs | Fetched OK. The NPCI fraud page needed a browser render; the IMF and CDC pages needed headless Chromium. |

## Summary

| Concept | Claims checked | Supported | Problems |
| --- | --- | --- | --- |
| money-markets/inflation | 5 | 3 | 5: P1 high outdated, P2 medium source-dead, P3 low ambiguous, P4 low outdated, P5 low unsupported |
| money-markets/compounding | 4 | 3 | 1: P1 low unsupported |
| money-markets/rule-of-72 | 4 | 3 | 2: P1 medium outdated, P2 low unsupported |
| money-markets/risk-return | 5 | 4 | 2: P1 low unsupported, P2 low ambiguous |
| money-markets/diversification | 5 | 4 | 2: P1 medium unsupported, P2 low wrong-number |
| money-markets/shares | 4 | 4 | 2: P1 low unsupported, P2 low ambiguous |
| money-markets/emergency-fund | 5 | 4 | 3: P1 low outdated, P2 low wrong-number, P3 low ambiguous |
| money-markets/loan-emi | 4 | 0 | 2: P1 high source-dead, P2 low ambiguous |
| money-markets/index-funds | 5 | 4 | 3: P1 medium source-dead, P2 low ambiguous, P3 low unsupported |
| money-markets/upi-scams | 5 | 5 | 4: P1 high outdated, P2 medium source-dead, P3 medium unsupported, P4 low unsupported |
| health-nutrition/protein-foods | 6 | 6 | 3: P1 low wrong-number, P2 low unsupported, P3 low ambiguous |
| health-nutrition/free-sugars | 5 | 5 | 1: P1 low unsupported |
| health-nutrition/hydration-cues | 5 | 5 | 4: P1 medium unsupported, P2 low health-wording, P3 low health-wording, P4 low outdated |
| health-nutrition/sleep-recovery | 6 | 6 | 2: P1 low ambiguous, P2 low health-wording |
| health-nutrition/exercise-heart | 5 | 5 | 4: P1 medium source-dead, P2 medium wrong-key, P3 medium health-wording, P4 low unsupported |
| health-nutrition/iron-and-anaemia | 6 | 6 | 3: P1 medium outdated, P2 low unsupported, P3 low health-wording |
| health-nutrition/food-label-reading | 4 | 4 | 3: P1 medium wrong-number, P2 low ambiguous, P3 low outdated |
| health-nutrition/fad-diet-claims | 5 | 5 | 3: P1 medium health-wording, P2 low health-wording, P3 low ambiguous |
| **Total** | **88** | **76** | **49** (3 high, 13 medium, 33 low) |

"Supported" counts only claims whose cited source was opened in this session and contains the quote. The 4 loan-emi claims are correct, but their cited URL is dead. Inflation-c3 relies only on the unreachable MoSPI PDF. Index-funds-c2 relies only on the blocked SPIVA page. Inflation-c1 is PARTLY.

## Fix first (high and medium)

| Severity | Concept / problem | Type | Ids |
| --- | --- | --- | --- |
| high | money-markets/inflation P1 | outdated | inflation-c3, inflation-12 (stem key a + all feedback), inflation-s1 visual ("Prices from 50,000+ shops") |
| high | money-markets/loan-emi P1 | source-dead | sources[rbi-loan], loan-emi-c1..c4, all steps/items |
| high | money-markets/upi-scams P1 | outdated | upi-scams-s2 (hook, teach, visual, example, guided), upi-scams-12, upi-scams-13, upi-scams-14, upi-scams-c2, misconception upi-scams-m4 |
| medium | health-nutrition/exercise-heart P1 | source-dead | hook, rule, quest, sources.heart |
| medium | health-nutrition/exercise-heart P2 | wrong-key | item-10 |
| medium | health-nutrition/exercise-heart P3 | health-wording | rule, s1 teach, s2 example (stadium steps "gasp"), s3, quest |
| medium | health-nutrition/fad-diet-claims P1 | health-wording | s2 teach, s2 example, item-12, s2 hook, rule |
| medium | health-nutrition/food-label-reading P1 | wrong-number | food-label-reading-s3 hook (option a + its feedback, option b feedback, option c feedback), food-label-reading-15 (option a feedback) |
| medium | health-nutrition/hydration-cues P1 | unsupported | rule, hook, s1 teach, item-10, s3, m2 (whole concept) |
| medium | health-nutrition/iron-and-anaemia P1 | outdated | iron-and-anaemia-c6, iron-and-anaemia-10 |
| medium | money-markets/diversification P1 | unsupported | diversification-c2, diversification-s3 (hook, teach, visual, example, guided[0], guided[1]), diversification-16, diversification-15, rule |
| medium | money-markets/index-funds P1 | source-dead | index-funds-c2, index-funds-c1 (second ref), hookSourceRefs, sources[spiva-india] |
| medium | money-markets/inflation P2 | source-dead | inflation-c1, inflation-c3, hookSourceRefs, ruleSourceRefs, inflation-11, inflation-12, inflation-16, misconceptions m1/m2 |
| medium | money-markets/rule-of-72 P1 | outdated | rule-of-72-c4, rule-of-72-s2 (hook, teach, visual, example, takeaway), rule-of-72-13, rule-of-72-14, rule (implicit) |
| medium | money-markets/upi-scams P2 | source-dead | npci-faq (cited in hook, rule, c1, c2, items 11–14, m1, m2, m4, quest) |
| medium | money-markets/upi-scams P3 | unsupported | upi-scams-s3 (teach, guided 2, takeaway), upi-scams-c5 |

Things checked and found current for India in 2026:
- RBI inflation target: 4% (2–6%) for 1 Apr 2026 – 31 Mar 2031. The RBI overview says the Central Government "retained the inflation target and the tolerance band for the next 5-year period – April 1, 2026 to March 31, 2031".
- RBI homepage on 2026-10-21: "Policy Repo Rate : 5.50%". No content states a repo rate.
- ICMR-NIN DGI 2024 figures used: 0.83 g/kg protein, sugar < 5% of energy, about 2 litres of water a day, at least 1,000 kcal on weight-loss diets, 0.5 kg a week.
- UPI per-transaction limits: ₹1 lakh normal, ₹2 lakh for some categories, ₹5 lakh for IPO/RDS. No content states a limit.

Main India-2026 changes the content has missed:
- UPI P2P collect requests were stopped from 1 Oct 2025 (upi-scams P1).
- The CPI moved to base 2024=100 in 2026, with different market counts (inflation P1).
- India's iron RDA (ICMR-NIN 2020) is 19 mg for men and 29 mg for women. The content uses UK NHS figures (iron P1).
- FSSAI front-of-pack warning labels are still pending, so the label concept needs a review flag (food-label P3).

---

# Findings by concept


### money-markets / inflation — Inflation
#### Claims
| Claim | Verdict | Source | Quote / note |
|---|---|---|---|
| inflation-c1 | PARTLY | inflation (IMF, txt_998c18b5); cpi DEAD | IMF is generic, not India: "Consumer price inflation: the percentage change in the consumer price index (CPI) over a certain period." India-specific part only backed by the uncited rbi source (txt_b2b43179): "4 per cent Consumer Price Index (CPI) inflation as the target". cpi (MoSPI PDF) UNREACHABLE (TLS fail / 502 / 503), content not seen. |
| inflation-c2 | SUPPORTED | inflation (IMF) | "If nominal incomes do not increase as much as prices, purchasing power and real (inflation-adjusted) income fall." |
| inflation-c3 | SOURCE DEAD | cpi only | MoSPI CPI_for_sankhyiki.pdf unreachable this session (TLS chain failure / proxy 502 / HTTP 503; dead for this fetcher, not confirmed bot-block). "same month a year earlier" and "over 50,000 shops" not verifiable from any fetched text. IMF only gives the generic "most commonly measured over a year". |
| inflation-c4 | SUPPORTED | inflation (IMF) | "If nominal incomes do not increase as much as prices, purchasing power and real (inflation-adjusted) income fall." + "a pensioner receiving a fixed 5 percent yearly increase to their pension loses purchasing power if inflation is higher than 5 percent." |
| inflation-c5 | SUPPORTED | rbi (txt_b2b43179) | "4 per cent Consumer Price Index (CPI) inflation as the target ... with the upper tolerance limit of 6 per cent and the lower tolerance limit of 2 per cent" ... "In its second review, on March 25, 2026, the Central Government retained the inflation target and the tolerance band for the next 5-year period – April 1, 2026 to March 31, 2031." |

#### Numbers checked
- hook: ₹100 / ₹20 = 5 idlis; ₹100 / ₹25 = 4 → OK
- rule / c5 / s3 / inflation-15 / m4: target 4%, band 2–6%, to Mar 2031 → matches RBI page → OK (current as of 2026-10-21)
- inflation-9: fee +10%/yr vs income +5%/yr → fee/income ratio ×1.048, ×1.098, ×1.150 over 1–3 yrs → share grows → key a OK
- inflation-10: 7% deposit vs 5% prices → 1.07/1.05 = 1.019 (≈1.9% more real) → OK pre-tax (see P5)
- inflation-11: (410−385)/385 = 6.49% → "about 6.5%", range 6–7 → OK; distractors 25% and 0.65% clearly wrong → OK
- inflation-12: "50,000+ shops", "2,295 markets" → not verifiable (cpi dead) and does not match the 2024=100 series → see P1
- s1 hook: 3% y-o-y compares same month a year earlier → OK as concept (illustrative figure, see P4)
- s1 guided onions: one item doubling moves basket "a little" → OK (single item has small weight)
- s2 hook: ₹2,000 with prices +10% → buys 2000/1.1 = ₹1,818 worth → 9.1% less ≈ "about a tenth less" → OK
- s2 visual: pay +4% vs prices +6% → real 1.04/1.06 = 0.981 → behind → OK
- s2 example: raise 5% vs costs 7% → 0.981 → behind → OK
- s2 guided 1: 100/125 = 0.8 = four fifths → OK
- s2 guided 2: 6% > 5% keeps up; 3% and 0% don't → OK
- s3 guided 1: 10,000/1.05 = 9,523.8 → "about ₹9,500" and feedback "about 9,520" → OK
- s3 guided 2: 7% > 6% upper limit → OK
- s3 visual scale 0–8%: 2%→25, 4%→50, 6%→75 → OK

#### Problems
**P1 [severity: high] [type: outdated] ids: inflation-c3, inflation-12 (stem key a + all feedback), inflation-s1 visual ("Prices from 50,000+ shops")**
- What the content says: "Survey staff note prices in 50,000+ shops." / "Staff visit over 50,000 shops in 2,295 markets every month to record retail prices." / "Prices come from over 50,000 shops across 2,295 markets."
- Source says: cited cpi PDF unreachable (no source text). India moved to the new CPI series (base 2024=100) from the January 2026 index (released 12 Feb 2026); per the opened page: "Monthly retail price collection has scaled up to span 1,465 rural markets and 1,395 urban markets across 434 towns" and "12 online markets have been introduced across 12 major towns ... to log weekly e-commerce price variations." (https://www.drishtiias.com/daily-updates/daily-news-analysis/cpi-base-year-revised-to-2024/print_manually — secondary; MoSPI primary not reachable). 1,465 + 1,395 = 2,860 physical markets, so "2,295 markets" (the older 2012=100 series figure, as far as can be told; not verified from an opened page) does not describe the live series. The 50,000-shop count is unverified for either series.
- Fix: drop shop/market counts. Key a → "Survey staff record prices in markets across India every month." Feedback → "Yes. Staff record retail prices in about 2,860 rural and urban markets every month, plus some online prices." (or no number). Visual node → "Prices from markets across India". Re-source c3 to MoSPI's 2024=100 CPI release/technical note once reachable; keep the "same month a year earlier" part.

**P2 [severity: medium] [type: source-dead] ids: inflation-c1, inflation-c3, hookSourceRefs, ruleSourceRefs, inflation-11, inflation-12, inflation-16, misconceptions m1/m2**
- What the content says: these cite "cpi" (https://mospi.gov.in/sites/default/files/CPI_for_sankhyiki.pdf).
- Source says: no source text found (UNREACHABLE: TLS chain failure / 502 / 503). The PDF (year 2025) also predates the 2024=100 series.
- Fix: replace with a reachable MoSPI page on the 2024=100 CPI series (press release / FAQ). For c1, add "rbi" as a ref (its text supports India targeting CPI inflation).

**P3 [severity: low] [type: ambiguous] ids: inflation-11, inflation-16**
- What the content says: "A toy cost ₹385 last May and ₹410 this May. What is its inflation rate?" / "Put these in order to work out an inflation rate."
- Source says: "Consumer price inflation: the percentage change in the consumer price index (CPI)" (IMF). One item's change is a price change, not inflation; the concept's own m1 says "One snack can rise while the broad basket moves in a different way."
- Fix: "By what percent did its price rise in a year?" / "Put these in order to work out a yearly price rise (the same sum is used on the whole basket for inflation)."

**P4 [severity: low] [type: outdated] ids: inflation-s1 hook**
- What the content says: "The news says retail inflation was 3% in May."
- Source says: the latest print is far higher: "India's retail inflation rose to 5.54% in September 2026 from 4.83% in August" (https://www.businesstoday.in/latest/economy/story/indias-retail-inflation-rises-to-5-54-in-september-food-inflation-hits-7-74-561057-2026-10-12 — secondary, citing MoSPI's 12 Oct 2026 release). RBI repo now 5.50%: RBI homepage "Policy Repo Rate : 5.50%" (https://www.rbi.org.in/) (re-confirmed by the lead checker on 2026-10-21; the date of the last change was not verified from a primary page). The content states no repo rate, so nothing else is out of date.
- Fix: make it clearly illustrative so it does not read as a real 2026 figure: "Say the news reports retail inflation of 3% for May."

**P5 [severity: low] [type: unsupported] ids: inflation-10 (key a feedback)**
- What the content says: "It grows faster than prices, so after a year it buys a little more than today."
- Source says: no source covers this; it is true only before tax. Interest on an Indian deposit is taxed, so at a 30% slab 7% becomes 4.9%, below 5% inflation.
- Fix: "Before tax, it grows faster than prices, so it keeps its buying power. Cash at home does not."

---

### money-markets / compounding — Compounding
#### Claims
| Claim | Verdict | Source | Quote / note |
|---|---|---|---|
| compounding-c1 | SUPPORTED | compound (investor.gov, txt_e39e5b78) | "With compound interest, you earn interest on the money you save and on the interest that money earns." (sip/SEBI says nothing on compounding; the ref is redundant) |
| compounding-c2 | PARTLY | sip (SEBI, txt_5844ccc7); investing (investor.gov, txt_d28461b7) | SEBI only names it: "There are facilities to invest or redeem in a systematic manner – Systematic Investment Plan (SIP)". "Set times" is backed in general terms by investing: "Regular investing means that you put a set dollar amount or a set percentage of your income into your investment accounts." Returns not fixed: "Markets fluctuate over time, and individual investments may lose value." No source defines SIP as a fixed sum on set dates. |
| compounding-c3 | SUPPORTED | compound | "If you saved that $365 and put it into an investment that earns 5% a year, it would grow to $465.84 by the end of five years, and by the end of 30 years, to $1,577.50." (dollars in source, ₹ in content; the maths does not depend on currency) |
| compounding-c4 | SUPPORTED | finra (txt_8edce4c6) | "Explain that the sooner they begin saving, the more money they potentially could accumulate through the power of compound interest." |

#### Numbers checked
- hook: ₹1 lakh × 1.07^30 = 7.61 lakh → "about ₹7.6 lakh" OK; gain years 1–20 = 2.87 lakh, years 21–30 = 3.74 lakh → "last ten add more than first twenty" OK
- compounding-9: 2,000 × 1.1² = 2,420; distractors 2,400 (simple), 2,200 (1 yr) → OK; range 2,410–2,430 OK
- compounding-10: 1,000 × 1.1³ = 1,331 → gains 100+110+121 = 331 → OK
- compounding-12: 15 vs 10 years at the same rate → Riya more → OK
- compounding-14: 10,000 × 1.08^20 = 46,610 → "about ₹46,600" OK; 20,000 × 1.08^10 = 43,178 → "about ₹43,200" OK; key a correct
- s1 hook: Sana 1,000 × 1.1² = 1,210; Om 1,000 + 2×100 = 1,200 (incl. spent) → OK
- s1 visual/example: 100 then 110 (100 earns 10) → OK
- s1 guided: 500 × 1.1 = 550; 10% of 550 = 55 → OK
- s2 hook: 365 × 1.05^30 = 1,577.5 → "about ₹1,578" OK; simple 365 + 30×18.25 = 912.5 → "about ₹913" OK; 5 yrs = 465.8 → "₹466" OK
- s2 teach: ₹466 / ₹1,578 → OK
- s2 visual: 15 yrs 365 × 1.05^15 = 758.8 → "₹759" OK; marks on 365–1,600 scale: 466→8.2, 759→31.9, 1,578→98.2 → at 8/32/98 OK
- s2 guided 1: 1,000 × 1.08^10 = 2,159 → "about ₹2,160" OK; × 1.08^20 = 4,661 → "about ₹4,660" OK; ratio 2.16 → "about twice" OK; simple-interest gap 800 → OK
- s2 guided 2: last five years add the most at a fixed rate → OK
- compounding-15/16, s3: no numbers beyond illustrative ₹500/₹1,000 → OK

#### Problems
**P1 [severity: low] [type: unsupported] ids: compounding-c2, compounding-15 (key feedback), compounding-s3 teach/hook**
- What the content says: "A systematic investment plan, or SIP, is a way to invest a set sum at set times." / "A SIP puts in the same sum at set times, like ₹500 each month."
- Source says: SEBI only: "There are facilities to invest or redeem in a systematic manner – Systematic Investment Plan (SIP) and Systematic Withdrawal Plan (SWP)." (https://investor.sebi.gov.in/hindi/understanding_mf.html). The definition is standard and correct, but no cited source states it. The "not a promise" half is backed only by the US investor.gov page.
- Fix: add an Indian source that defines SIP and states returns are not assured (e.g. a SEBI investor page or AMFI's SIP explainer with the "subject to market risks" line), or make the SEBI quote cover only "SIP exists" and cite investor.gov for regular fixed-amount investing.

---

### money-markets / rule-of-72 — The rule of 72
#### Claims
| Claim | Verdict | Source | Quote / note |
|---|---|---|---|
| rule-of-72-c1 | SUPPORTED | rule72 (FINRA, txt_8edce4c6) | "Teach kids the Rule of 72, which can help them estimate how long it will take to double their money. The formula is simple: Divide 72 by the interest rate received on savings or investments." |
| rule-of-72-c2 | PARTLY | rule72; investing (investor.gov, txt_d28461b7) | investing: "Markets fluctuate over time, and individual investments may lose value." Neither source says the rule needs a steady rate; FINRA applies it to "savings or investments" without that caveat. The caveat is mathematically sound (the rule assumes a constant compound rate), but it is not stated in a source. |
| rule-of-72-c3 | SUPPORTED | rule72 | "For example, money in a savings account yielding 4 percent interest will double in 18 years." |
| rule-of-72-c4 | SUPPORTED | rule72 | "Emphasize that the Rule of 72 also works for debt: An unpaid balance on a credit card that charges 18 percent interest will double in four years." |

#### Numbers checked (rule value vs exact ln2/ln(1+r))
- hook: 72/9 = 8; exact 8.04 → "close to eight, but not exactly" OK
- s1 teach/visual: 72/8 = 9; exact 9.01 → OK
- s1 example / c3 / s2 visual: 72/4 = 18; exact 17.67 → OK
- s1 hook: 72/6 = 12; exact 11.90 → OK
- s1 guided: 72/9 = 8 → OK; 72/12 = 6 (exact 6.12) → OK; distractor "72% → about one year": rule 1.0, exact 1.28 → OK as "by the rule"
- rule-of-72-9: 72/2 = 36; exact 35.0 → range 35–37 OK
- rule-of-72-10: 72/6 = 12% → OK
- rule-of-72-11: 72/8 = 9, 72/6 = 12 → OK
- rule-of-72-12: 72/12 = 6; exact 6.12 → OK
- rule-of-72-13: 6% → 12 yrs (1 doubling); 18% → 3 doublings by rule (×8), exact 1.18^12 = 7.29 → ₹72,900 vs ₹20,100 = 3.6× → "several times bigger" OK
- s2 hook / teach / example / c4: 72/18 = 4; exact 4.19 (annual) or 3.88 yrs (1.5%/month) → OK
- s2 guided 1: 72/24 = 3; exact 3.22 → OK; distractor 12 yrs = 6% rate → OK
- s2 guided 2: 4 vs 12 yrs, "about three times as fast" → OK
- s3 hook: 72/20 = 3.6 → OK; 1.20 × 0.95 = 1.14 → not steady → OK
- s3 visual: 72/7 = 10.3; exact 10.24 → "fair guess" OK
- s3 example: 72/15 = 4.8 → OK
- rule-of-72-16: 72/9 = 8 → OK; key a correct

#### Problems
**P1 [severity: medium] [type: outdated] ids: rule-of-72-c4, rule-of-72-s2 (hook, teach, visual, example, takeaway), rule-of-72-13, rule-of-72-14, rule (implicit)**
- What the content says: "An unpaid card balance at 18% doubles in about four years" / "High-interest debt doubles fast; 18% takes about four years." / "A card balance of ₹10,000 is left unpaid at 18% a year."
- Source says: the 18% is a US figure (FINRA). Indian card revolving rates are much higher: "SBI Card Up to 3.75% 45% HDFC Bank 1.99% - 3.75% 23.88% - 45% ICICI Bank 3.75% 45%" ("Interest Rates on Top Credit Card Issuers in India 2026", https://www.paisabazaar.com/credit-card/interest-rates — secondary aggregator; issuer MITC pages were bot-blocked). At 45%, 72/45 = 1.6 yrs (exact 1.57 yrs at 3.75%/month). As written, an Indian learner may think card debt at ~18% is typical and that it takes four years to double.
- Fix: keep the 18% sums but label them: "A card charging a made-up 18% a year…" and add one line to s2 teach: "Many Indian cards charge about 3.5–3.75% a month (42–45% a year); at 42%, 72 ÷ 42 is under two years." Or switch the hook to 36% → "about 2 years" and cite an Indian bank MITC or RBI credit-card directions page.

**P2 [severity: low] [type: unsupported] ids: rule-of-72-c2, rule (ruleSourceRefs), rule-of-72-s3 teach, rule-of-72-15, rule-of-72-16, m2**
- What the content says: "Market returns do not have a fixed rate, so the shortcut is only a what-if tool there."
- Source says: "Markets fluctuate over time, and individual investments may lose value." (https://www.investor.gov/introduction-investing). FINRA applies the rule to "savings or investments" with no steady-rate caveat.
- Fix: the content is correct; add a source that states the rule assumes a constant compounded rate (e.g. an investor-education page on the rule of 72), or reword c2 as a maths-based note citing investing only for "returns fluctuate".

---

### money-markets / risk-return — Risk and return
#### Claims
| Claim | Verdict | Source | Quote / note |
|---|---|---|---|
| risk-return-c1 Investment risk includes the chance of loss and uncertain results. | PARTLY | risk (investor.gov asset-allocation guide) | "All investments involve some degree of risk. ... you could lose some or all of your money." The guide covers loss but never says "uncertain". The uncertainty half appears on investor.gov "What is Risk?" (not cited): "In finance, risk refers to the degree of uncertainty and/or potential financial loss inherent in an investment decision." |
| risk-return-c2 A high possible gain may mean more risk. The gain is not sure. | SUPPORTED | risk | "The reward for taking on risk is the potential for a greater investment return." / "risk and reward are inextricably entwined" |
| risk-return-c3 Cash safest, earns least; shares most risk, earned most | SUPPORTED | risk | "Stocks have historically had the greatest risk and highest returns among the three major asset categories." / "Cash and cash equivalents - such as savings deposits ... - are the safest investments, but offer the lowest return of the three major asset categories." |
| risk-return-c4 US large company shares dropped in about 1 year in 3 | SUPPORTED | risk | "Large company stocks as a group, for example, have lost money on average about one out of every three years." The source is the US SEC, so "US" is implied rather than stated. The source gives no period. |
| risk-return-c5 Longer horizon lets you wait out swings; money needed soon suits lower risk | SUPPORTED | risk | "An investor with a longer time horizon may feel more comfortable taking on a riskier, or more volatile, investment because he or she can wait out slow economic cycles" / "investing solely in cash investments may be appropriate for short-term financial goals." |

#### Numbers checked
- hook: coin ₹30 or ₹0 vs sure ₹12 → expected 0.5×30 = ₹15; ₹12 < ₹30 max, never zero → OK
- risk-return-9: even chance ₹150/₹70 → (150+70)/2 = 110; band 105–115; b = good case only, c = 220 unhalved → OK
- risk-return-11: Raffle A ₹10 for sure vs B ₹0/₹25 on a ₹10 cost → only B is uncertain and can lose → OK
- risk-return-10a / s3 guided[0]: "about one year in three" → matches source "about one out of every three years" → OK
- risk-return-10b feedback "drops ... can be large" → source "sometimes the losses have been quite dramatic" → OK
- risk-return-13: order cash < bonds < shares → source: bonds "generally less volatile than stocks", cash "safest" → OK
- s2 visual scale marks 10/50/90 → qualitative only → OK
- s3 example ₹30,000 and s3 visual "20 years", items 15 and 16 horizons (3 months, 25 and 35 years) → illustrative → OK
- risk-return-14: "30% a year with zero risk" is a red flag → consistent with the source's "Don't let anyone tell you otherwise. All investments involve some degree of risk." → OK

#### Problems
**P1 [severity: low] [type: unsupported]** ids: risk-return-c1, risk-return-s1 teach
- What the content says: "Investment risk includes the chance of loss and uncertain results." / "Risk is the chance that the result is not what you hoped."
- Source says: the cited guide only says "you could lose some or all of your money". The uncertainty wording is on a different page: "In finance, risk refers to the degree of uncertainty and/or potential financial loss inherent in an investment decision." (https://www.investor.gov/introduction-investing/investing-basics/what-risk, fetched 2026-10-21)
- Fix: add https://www.investor.gov/introduction-investing/investing-basics/what-risk as a source and cite it on c1, or cut c1 to "Any investment can lose some or all of the money put in."

**P2 [severity: low] [type: ambiguous]** ids: risk-return-s1 guided[0] (option a and hint), risk-return-13a
- What the content says: hint "Look for the one whose price does not move." and "Yes. Cash savings are the safest of the main choices."
- Source says: "The principal concern for investors investing in cash equivalents is inflation risk. This is the risk that inflation will outpace and erode investment returns over time." (risk source)
- Fix: keep the key, but add to the 13a feedback: "Cash is the safest of the three, but rising prices can shrink what it buys." That stops learners concluding cash has no risk at all.

Note: no SEBI or RBI rule statements in this concept, so there was nothing to check for 2026 currency. No health wording.

---

### money-markets / diversification — Diversification
#### Claims
| Claim | Verdict | Source | Quote / note |
|---|---|---|---|
| diversification-c1 A mix of holdings can spread the risk from one firm. | SUPPORTED | risk (investor.gov asset-allocation guide) | "The practice of spreading money among different investments to reduce risk is known as diversification." |
| diversification-c2 A broad mix can cut some risk ... It cannot wipe out all risk. | PARTLY | risk | "you may be able to limit your losses and reduce the fluctuations of investment returns" supports the first half. The guide never says diversification cannot remove all risk or cannot stop a market-wide fall. The nearest line is "All investments involve some degree of risk." |
| diversification-c3 Four or five shares are not a real spread; at least a dozen, across many industries | SUPPORTED | risk | "invest in a wide range of companies and industry sectors. But the stock portion ... won't be diversified ... if you only invest in only four or five individual stocks. You'll need at least a dozen carefully selected individual stocks to be truly diversified." |
| diversification-c4 A one-industry fund is not a full spread on its own | SUPPORTED | risk | "a mutual fund investment doesn't necessarily provide instant diversification, especially if the fund focuses on only one particular industry sector." |
| diversification-c5 Each extra holding can add fees, which lower returns | SUPPORTED | risk | "as you add more investments to your portfolio, you'll likely pay additional fees and expenses, which will, in turn, lower your investment returns." |

#### Numbers checked
- diversification-9: 1 of 12 equal holdings goes to zero → 100/12 = 8.33% → option a "about 8%" and band 8–9 → OK; c "12%" wrong → OK
- s1 guided[0]: Om ₹10,000 / 5 = ₹2,000 per firm, half lost = ₹1,000, so ₹9,000 left; Meera ₹10,000 halves to ₹5,000 → OK
- s1 guided[1]: ₹500×10 = ₹2,500×2 = ₹5,000×1 = ₹5,000 total (fair comparison) → OK
- s1 visual "spread over ten firms → hits a tenth" → 1/10 with equal weights → OK
- s1 example: 8 firms, 1 bad, "other seven" → OK
- s2 visual: scale min 1, max 20, marks at=25 ("5") and at=60 ("12") → on a 1–20 axis, 5 sits at (5−1)/19 = 21% and 12 at (12−1)/19 = 58%. The marks match a 0–20 axis (25%, 60%) → WRONG (minor)
- diversification-12: 12 firms in 8 industries vs 12 banks vs 5 firms → a correct; c "five too few" matches the source → OK
- diversification-16: 30 > 12 ("well past the guide's dozen") → OK
- items 13, 14, 15 and the s3 steps (20, 30, 40 firms) → illustrative counts → OK

#### Problems
**P1 [severity: medium] [type: unsupported]** ids: diversification-c2, diversification-s3 (hook, teach, visual, example, guided[0], guided[1]), diversification-16, diversification-15, rule
- What the content says: "It cannot make all loss go away, since many parts can fall together." / "It cannot stop a shock that hits nearly all firms at once, like a big market fall."
- Source says: the cited guide only says diversification can "limit your losses and reduce the fluctuations". It has no market-wide-fall statement. Investor.gov does say this on another page: "Diversification can't guarantee that your investments won't suffer if the market drops. But it can improve the chances that you won't lose money, or that if you do, it won't be as much as if you weren't diversified." (https://www.investor.gov/introduction-investing/investing-basics/save-and-invest/diversify-your-investments, fetched 2026-10-21)
- Fix: add that URL as a second source and cite it on c2 and step s3. Optionally reword c2 as "A spread can lower losses, but it cannot guarantee you won't lose if the whole market drops."

**P2 [severity: low] [type: wrong-number]** ids: diversification-s2 visual
- What the content says: min "1", max "20", marks at 25 ("5: too few") and 60 ("12: the guide's least")
- Source says: n/a (layout maths): on a 1–20 axis the positions are 21% and 58%
- Fix: set min to "0" (then 25 and 60 are exact), or keep min "1" and change the marks to at=21 and at=58.

Note: the "at least a dozen" figure is from an older SEC guide. The content correctly labels it "A US investor guide". No SEBI rule statements here, and no health wording.

---

### money-markets / shares — What a stock is
#### Claims
| Claim | Verdict | Source | Quote / note |
|---|---|---|---|
| shares-c1 A share gives part ownership of a company. | SUPPORTED | shares (investor.sebi.gov.in) | "Shares are like owning a piece of a company. If you buy shares, you become a shareholder of the company." |
| shares-c2 A firm may pay a share of its gains. The payout is not sure. | SUPPORTED | shares | "When a company makes a profit, it might decide to share some of that money with its shareholders in the form of a dividend. But it's important to remember that the amount and how often the company pays out dividends is not guaranteed." |
| shares-c3 More shares → bigger piece | SUPPORTED | shares | "The more shares you have, the bigger piece you own." |
| shares-c4 Owners can vote on big decisions at the general meeting | SUPPORTED | shares | "As a shareholder, you get right to vote on important decisions about the company at General meeting of the company." |

#### Numbers checked
- shares-9: 5,000 / 2,00,000 = 0.025 = 2.5% (band 2.3–2.7). b: 5% needs 10,000 shares. c: 1/40 = 2.5%, not 25% → OK
- shares-10: 10/100 = 10% → 10/200 = 5%. b and c are wrong → OK
- s1 hook: 10/100 = a tenth → OK
- s1 example: 5/50 = a tenth → OK
- s1 guided[0]: Vikram 50/200 = 25% ("a quarter"), Asha 20/200 = 10% ("a tenth") → OK
- s1 guided[1]: 10/1,000 = 1%. b: 10% = 100 shares. c: 0.1% = 1 share → OK
- s3 guided[1]: 40 × ₹3 = ₹120. b: 40+3 = 43 → OK
- s3 example ₹4 per share and guided[0] ₹5 per share, item 15 ₹2,000 → illustrative → OK
- Cross-check: the source's own example ("1,000 Shares and you buy 50 ... 5% ownership") → 50/1000 = 5% → OK

#### Problems
**P1 [severity: low] [type: unsupported]** ids: shares-16 (option a feedback)
- What the content says: "A payout can only come from profit, so this happens first."
- Source says: no source text found in the concept. Search results quoting Companies Act 2013 s.123(1) say a dividend may be paid out of the current year's profits or out of undistributed profits of earlier years. So a company with a loss this year can still pay from past profits. (search results only, e.g. https://www.incometaxindia.gov.in/w/section-123-83; I did not open the Act text)
- Fix: "Dividends come out of profits, this year's or ones saved from past years." Keep the order a→b→c.

**P2 [severity: low] [type: ambiguous]** ids: shares-15 (option c feedback)
- What the content says: "A dividend is not a debt. The company may choose to pay less or nothing."
- Source says: no source text found. Under Indian company law a dividend becomes payable once it is declared. It is only undeclared future dividends that are not owed.
- Fix: "A future dividend is not owed. Until the company declares it, it can pay less or nothing."

Notes:
- SEBI currency: the concept makes no statements about T+1 settlement, demat, KYC, face value or investor protection, so none needed checking for 2026. The cited SEBI page was fetched on 2026-10-21 and still says the quoted text.
- Source quality: the "Risk of investing in shares" section on the SEBI page is garbled (it repeats PMS boilerplate under "Volatility" and "Credit Risk"). No claim cites that section, but don't use it as a source for future risk claims.
- No health wording.

---

### money-markets / emergency-fund — Emergency fund
#### Claims
| Claim | Verdict | Source | Quote / note |
|---|---|---|---|
| emergency-fund-c1 | SUPPORTED | rbi-emergency (RBI "I Can Do" PDF text, p.123) | "An emergency fund or a rainy day fund, as the name suggests, is that cash reserve— your savings kept aside for any unprecedented event happening or an emergency." |
| emergency-fund-c2 | PARTLY | rbi-emergency | Source says "kept in a savings account... that is easily accessible"; the "without waiting for a sale" idea is only implied by the asset table: "Liquidity Risk—It may be difficult to sell off this investment e.g. selling land or real estate in parts." Reasonable paraphrase, not a direct statement. |
| emergency-fund-c3 | SUPPORTED | rbi-emergency | "It is generally recommended to maintain an emergency fund that can cover your living expenses for at least three months. But if your job is less secure or you run a business or are self-employed, then you probably should save to cover your expenses for six months or more." |
| emergency-fund-c4 | SUPPORTED | rbi-emergency | "Money in the emergency fund should be kept in a savings account—separate from your other savings accounts—that is easily accessible." |
| emergency-fund-c5 | SUPPORTED | rbi-emergency | "If you do not have the money right now to fund an entire emergency fund, start small but immediately. Save a little bit from each paycheck, until you have built up the required savings." |

#### Numbers checked
- emergency-fund-12: ₹18,000 × 3 = ₹54,000 (correct key); ₹18,000 = 1 month; ₹1,08,000 = 6 × 18,000 → OK. Range 53,000–55,000 → OK.
- emergency-fund-13: option c "Both are ₹45,000" = 3 × ₹15,000 = 45,000; feedback "fits the clerk" → OK. Key (a) shop owner, 6+ months → OK (source "run a business").
- emergency-fund-s2 guided 1: ₹20,000 × 3 = ₹60,000 → OK. ₹6,000 distractor → OK. ₹23,000 distractor feedback "That adds three instead of multiplying" → 20,000 + 3 = 20,003, not 23,000 → WRONG (feedback logic; see P2).
- emergency-fund-s2 visual: scale 0–12 months, mark 3 at 25 (3/12 = 25%), mark 6 at 50 (6/12 = 50%) → OK.
- emergency-fund-s2 hook: "at least three months"; distractor "two years" feedback "suggests three to six months" → source says "six months or more", so "three to six" slightly understates upper end; acceptable (step title also "three to six"). OK-ish.
- emergency-fund-16: order a (monthly costs) → b (3× target) → c (save from each pay, separate account) → OK vs source steps.

#### Problems
**P1 [severity: low] [type: outdated]** ids: sources[rbi-emergency]
- What the content says: "year": 2025, title "I Can Do: Financial Planning"
- Source says: "First published in 2010" ... "© Reserve Bank of India 2010" ... "March 22, 2010" (https://www.rbi.org.in/FinancialEducation/content/I%20Can%20Do_RBI.pdf)
- Fix: set year to 2010 (author Swapna Mirashi, RBI). The emergency-fund advice itself is timeless and still sound; no rule change. Do not lift other figures from this book (e.g. its LTCG "exempt from income tax" line is outdated).

**P2 [severity: low] [type: wrong-number]** ids: emergency-fund-s2 guided[0] option b
- What the content says: "₹23,000." / feedback "That adds three instead of multiplying. Three months is three times ₹20,000."
- Source says: no source text found (arithmetic).
- Fix: feedback "That adds ₹3,000 instead of multiplying. Three months is three times ₹20,000." (or change distractor to ₹20,003 is silly; keep ₹23,000 with corrected feedback).

**P3 [severity: low] [type: ambiguous]** ids: emergency-fund-s3 guided[0] option b
- What the content says: "A five-year fixed deposit." / feedback "A long deposit locks the money away, so it may not be ready in time."
- Source says: "Liquidity Risk—These are generally fixed period investments. It is not easy to withdraw them before maturity." (RBI I Can Do PDF)
- Fix: most bank FDs allow premature withdrawal with a penalty (only tax-saver FDs are locked). Reword feedback: "A long deposit is meant to stay put. Breaking it early can cost a penalty and take time." Key remains correct.

---

### money-markets / loan-emi — EMI and loan cost
#### Claims
| Claim | Verdict | Source | Quote / note |
|---|---|---|---|
| loan-emi-c1 | SOURCE DEAD (dead) | rbi-loan (cited URL systemhealth.rbi.org.in returns 502 / TLS fail) | Fully supported by the fetched alternate https://www.rbi.org.in/Scripts/FS_FAQs.aspx?Id=77&fn=2754 (RBI FAQ Id=77 text): "You repay the loan in Equated Monthly Installments (EMIs) comprising both principal and interest." |
| loan-emi-c2 | SOURCE DEAD (dead) | rbi-loan | Alternate: "interest is calculated on the outstanding principal balance for that month... interest is computed on the new, reduced principal outstanding." |
| loan-emi-c3 | SOURCE DEAD (dead) | rbi-loan | Alternate: "The longer the tenure of the loan, the lesser will be your monthly EMI outflow... But longer tenures mean payment of larger interest towards the loan and make it more expensive." |
| loan-emi-c4 | SOURCE DEAD (dead) | rbi-loan | Alternate annex: "Amount of Loan 1,000,000.00 / Annual Interest Rate 15.00% / Number of Payments 120 / Monthly Payment 16,133.50"; row 1: "16,133.50 12,500.00 3,633.50". Recomputed: matches. |

#### Numbers checked
- loan-emi-c4 / s2 visual (first EMI): EMI = 1,000,000 × 0.0125 × 1.0125^120 / (1.0125^120 − 1) = 16,133.4957 → ₹16,133.50 OK; first interest 1,000,000 × 0.0125 = 12,500 OK; principal 16,133.50 − 12,500 = 3,633.50 OK.
- loan-emi-s2 visual (last EMI): amortised to month 120: interest 199.18, principal 15,934.32 (source table row 120: "16,133.50 199.18 15,934.32 0.00") → OK.
- loan-emi-10: EMI no. 60 = ₹16,133.50 (fixed loan) → OK (month-60 split computed: interest 8,571.59 / principal 7,561.91).
- loan-emi-12: total paid 16,133.4957 × 120 = 19,36,019.48; interest = 9,36,019 ≈ ₹9.36 lakh → "about ₹9.4 lakh" OK; answer 9.36 within 9–9.7 OK; "₹19.4 lakh" total OK; "₹1.5 lakh = 15% for one year" = 1,50,000 OK.
- loan-emi-15 / s3 visual: ₹1 lakh @12%: n=12 EMI 8,884.88, interest 6,618.55 ("about ₹6,600" OK); n=24 EMI 4,707.35, interest 12,976.33 ("about ₹13,000" OK); ratio 12,976/6,619 = 1.96 → "about twice" OK; key (a) correct, (b)/(c) clearly wrong.
- loan-emi-s1 guided: 8,000 − 3,000 = 5,000 OK; 11,000 = sum OK. Example 5,000 = 1,000 + 4,000 OK.
- loan-emi-s2 guided: 1% × 50,000 = 500 OK; 5,000 = 10% OK; 50 = 0.1% OK.
- loan-emi-s2 guided 2 (biggest interest = first EMI) → OK (12,500 vs 199.18).

#### Problems
**P1 [severity: high] [type: source-dead]** ids: sources[rbi-loan], loan-emi-c1..c4, all steps/items
- What the content says: "url": "https://systemhealth.rbi.org.in/Scripts/FS_FAQs.aspx_Id%3D77%26fn%3D2754.html" (year 2024)
- Source says: cited URL "STATUS: 502 ... upstream request failed" (mangled mirror URL). The live RBI page has every figure: "Monthly Payment 16,133.50" (https://www.rbi.org.in/Scripts/FS_FAQs.aspx?Id=77&fn=2754)
- Fix: replace URL with https://www.rbi.org.in/Scripts/FS_FAQs.aspx?Id=77&fn=2754 (title "FAQs: Housing Loans", publisher RBI); drop "year": 2024 (page is undated; footer shows "Website last updated date: Oct 21, 2026") or set asOf 2026-10-21.

**P2 [severity: low] [type: ambiguous]** ids: loan-emi-s1 teach, loan-emi-s1 guided[1], loan-emi-10 feedback, loan-emi-13 option c feedback
- What the content says: "EMI means equated monthly instalment: the same payment each month." / "The EMI stays the same each month until the loan is paid." / "Every EMI is the same size"
- Source says: "In case of a pure fixed loan, the EMI due to the bank remains constant." and "The EMI of a floating rate loan changes with changes in market interest rates." (same RBI page)
- Fix: teach: "EMI means equated monthly instalment: on a fixed-rate loan, the same payment each month." Guided feedback: "Right. On a fixed-rate loan the EMI stays the same each month." Item 10 is fine as it is about the RBI fixed-loan example.

---

### money-markets / index-funds — Index funds and stock picking
#### Claims
| Claim | Verdict | Source | Quote / note |
|---|---|---|---|
| index-funds-c1 | SUPPORTED | sebi-index (SEBI index-fund page text) | "Index mutual funds are a type of mutual fund that aim to replicate the performance of a specific stock market index, such as the Nifty 50." + "The returns of an index fund are closely aligned with the returns of the underlying index, minus any costs like expense ratios." (spiva-india part not seen: blocked) |
| index-funds-c2 | SOURCE DEAD (blocked) | spiva-india (403 "Security Controls Triggered" for curl, headless Chromium headless Chromium, and the YE-2025 PDF/article URLs, retried 2026-10-21) | sebi-index does not back it; it only says "The goal is not to outperform the market" / "While they may not outperform the market". Secondary page opened (getbelong.com, dated Dec 31 2025, upd. Jan 14 2026): "According to the SPIVA India Year-End 2024 report, 81.5% of actively managed large-cap funds failed to beat their benchmark." |
| index-funds-c3 | SUPPORTED | sebi-index | "An index mutual fund mimics a market index by holding all or most of the securities that constitute the index in the same proportions." |
| index-funds-c4 | SUPPORTED | sebi-index; expense-ratio | SEBI: "index funds do not require frequent buying and selling of stocks. This passive approach significantly reduces management fees." and "Index funds have lower expense ratios compared to actively managed funds since they involve minimal management." Investor.gov: "The percentage of a fund's average net assets used each year to pay the fund's operating expenses" |
| index-funds-c5 | SUPPORTED | sebi-index | "Tracking Error: The slight difference between the fund's performance and the index it tracks due to expenses or operational inefficiencies." |

#### Numbers checked
- index-funds-12: 0.2% × ₹20,000 = ₹40 (key) OK; ₹400 = 2% OK; ₹4 = 0.02% OK; range 38–42 OK.
- index-funds-s2 guided 1: 1% vs 0.2% → 1/0.2 = 5 → "five times more" OK; key Fund Y OK.
- index-funds-s3 visual: scale 9%–10%; 9.8% at (9.8−9)/(10−9) = 80 OK; 10% at 100 OK. Gap 0.2 pt.
- index-funds-s3 guided 2: 12% − 11.7% = 0.3% OK.
- index-funds-s3 example: index −8%, fund −8.2% (gap 0.2 pt) OK, illustrative.
- index-funds-15: index −20% → fund "about 20%, a bit more after fees" OK.
- index-funds-s1 guided 2: weight A = 2 × B → fund holds twice as much A OK (SEBI "in the same proportions").
- index-funds-s1 hook / item 10: "Nifty 50 is a list of 50 Indian companies" → NSE: "The Nifty 50 is a diversified 50 stock index accounting for 13 sectors of the economy. It is used for a variety of purposes such as benchmarking fund portfolios, index based derivatives and index funds." OK. (NSE page current: "about 53.73% of the free float market capitalization ... as on March 30, 2026"; "From June 26, 2009, Nifty 50 is computed based on free float methodology." Not used in content.)
- Fee currency 2026: content gives no regulatory cap, only 0.2%/1% examples. Current ceiling (SEBI (Mutual Funds) Regulations, 2026, effective 1 Apr 2026): "Index funds and ETFs have a 0.90% BER ceiling under the revised framework, excluding statutory levies." (https://www.wrightresearch.in/blog/sebi-mutual-fund-regulations-2026/). The 0.2% example is realistic and "1%" in Fund X is above the 0.90% BER cap but could still be a total TER incl. levies; illustrative, OK. Nothing outdated.

#### Problems
**P1 [severity: medium] [type: source-dead]** ids: index-funds-c2, index-funds-c1 (second ref), hookSourceRefs, sources[spiva-india]
- What the content says: "Past India fund data show many active funds below their index. The share varies by year and fund group." (source "SPIVA India Year-End 2025", https://www.spglobal.com/spdji/en/spiva/article/spiva-india/)
- Source says: no source text found — spglobal.com returns 403 "Security Controls Triggered" to curl and headless Chromium (article, /spiva-india-year-end-2025/ and the scorecard PDF). Search snippets (not opened) attribute to S&P: large-cap underperformance "75.0% over the 1-year period ... 74.2%, 84.4% and 76.3% over the 3-, 5- and 10-year horizons" and "active mid-/small-cap funds delivered a majority outperformance" in 2025, which is consistent with the claim's "varies by year and fund group".
- Fix: keep the claim generic (it is), keep the SPIVA URL but mark it blocked-for-bots and have a human verify it in a browser; as an opened fallback the only page reachable was a secondary blog (https://getbelong.com/blog/mutual-funds/index-funds-vs-actively-managed-mutual-funds/: "According to the SPIVA India Year-End 2024 report, 81.5% of actively managed large-cap funds failed to beat their benchmark.") — weak, commercial, and a different year; not recommended as the sole source. Do not add any specific percentage to the content unless the SPIVA PDF is read by a human.

**P2 [severity: low] [type: ambiguous]** ids: index-funds-s3 hook, index-funds-s3 visual, index-funds-s3 guided[1], index-funds-15
- What the content says: "The index rises 10% in a year. About what does an index fund on it return?" → "A little under 10%."
- Source says: SEBI: "closely aligned with the returns of the underlying index, minus any costs like expense ratios." No source text on price vs total-return index.
- Fix: a headline index level (e.g. Nifty 50 price index) excludes dividends, while the fund receives them, so a fund can end slightly above the price index. Add "with dividends counted" once in teach: "Compared with its index (dividends included), an index fund ends a little behind after costs."

**P3 [severity: low] [type: unsupported]** ids: sources[expense-ratio], index-funds-c4, index-funds-s2
- What the content says: expense ratio defined from "Glossary: Expense Ratio", Investor.gov, U.S. SEC.
- Source says: "The percentage of a fund's average net assets used each year to pay the fund's operating expenses, which can include management fees, distribution and/or service fees (called 12b-1 fees)..." (https://www.investor.gov/introduction-investing/investing-basics/glossary/expense-ratio) — accurate but US-specific (12b-1 fees).
- Fix: definition is fine for the generic "yearly percent of the fund" wording; for an India audience prefer an Indian source (SEBI investor page already says "lower expense ratios"; under the 2026 SEBI MF Regulations TER = base expense ratio + brokerage + statutory levies). Optional swap; no content change needed.

---

### money-markets / upi-scams — UPI scams and social engineering

#### Claims
| Claim | Verdict | Source | Quote / note |
|---|---|---|---|
| upi-scams-c1 | SUPPORTED | npci-fraud (txt_86ca555d) | "it's important to remember that scanning a QR code and entering a UPI PIN is only meant for making payments, not receiving them." (npci-faq is DEAD; rbi-fraud also backs it: "Transactions involving receipt of money do not require scanning barcodes / QR codes or entering MPIN.") |
| upi-scams-c2 | SUPPORTED (cited npci-faq URL DEAD) | rbi-fraud (txt_8b14b234) + replacement NPCI FAQ https://www.npci.org.in/faqs/upi | RBI: "Misuse the 'collect request' feature of UPI by sending fake payment requests with messages like 'Enter your UPI PIN' to receive money." NPCI FAQ (opened 2026-10-21): "you will receive a collect request on your BHIM app. Enter your UPI-PIN here and your payment will be complete." |
| upi-scams-c3 | SUPPORTED | rbi-fraud | "Transactions involving receipt of money do not require scanning barcodes / QR codes or entering MPIN. Thus, exercise caution if asked to do so." |
| upi-scams-c4 | SUPPORTED | rbi-fraud | "Never share your account details such as account number, login ID, password, PIN, UPI-PIN, OTP ... with anyone, not even with bank officials, however genuine they might sound." |
| upi-scams-c5 | SUPPORTED | rbi-fraud | "If you receive a debit SMS for a transaction not done, inform your bank / e-wallet provider immediately and block all modes of debit, including UPI." |

#### Numbers checked
- upi-scams-12: 3 collect requests × ₹1,500 → 3×1500 = 4,500; answer range 4,400–4,600 → OK (but scenario outdated, see P1)
- upi-scams-12: ₹1,500 per request was under the old P2P collect cap ("limited to Rs 2,000 per transaction", Business Today) → OK historically
- upi-scams-s2 example: 'Prize ₹2,000' collect → equals the old P2P cap, possible pre-Oct-2025 → OK historically
- upi-scams-11, s1 example (₹500, ₹3,000), s1 guided (₹500, ₹1,000), s2 guided (₹750): illustrative only, no maths → OK
- Marked-correct options: all 8 items and 6 guided/hook questions checked; keys correct, no second defensible option.
- UPI limits (not used in content; checked for currency): NPCI FAQ "For normal UPI the transaction limit is up to Rs 1 Lakh per transaction ... Capital Markets, Collections, Insurance, Foreign Inward Remittances ... up to 2 lakh and for Initial Public Offering and Retail Direct Scheme the limit is up to Rs 5 lakh per transaction." (https://www.npci.org.in/faqs/upi) → no conflict.

#### Problems
**P1 [severity: high] [type: outdated]** ids: upi-scams-s2 (hook, teach, visual, example, guided), upi-scams-12, upi-scams-13, upi-scams-14, upi-scams-c2, misconception upi-scams-m4
- What the content says: "A collect request pops up in your UPI app with a 'cashback' note." / visual "Stranger sends request" / "A scammer sends three UPI collect requests of ₹1,500 each"
- Source says: NPCI circular dated 29 July 2025, as quoted by Business Today: "By October 1, 2025, UPI P2P Collect shall not be allowed to be processed in UPI." and "While merchants can continue using collect requests, these will be restricted to legitimate business cases." (https://www.businesstoday.in/amp/personal-finance/banking/story/npci-to-tighten-upi-rules-peer-to-peer-collect-feature-to-end-in-october-489244-2025-08-13). I could not open the NPCI circular PDF itself: the NPCI circular list (https://www.npci.org.in/circulars/upi) only showed FY26-27 circulars in headless mode. The RBI source (rbi-fraud) is from Jan 2022, before the change.
- Fix: Keep the principle ("any screen asking for your PIN is you paying"). Reframe s2 for 2026: "Since 1 Oct 2025, people can no longer send you UPI collect requests. Only registered merchants can. Scammers now use QR codes, payment links or fake 'merchant' requests. Whatever the label says, entering your PIN pays." Change the visual node "Stranger sends request" to "A request, link or QR asks for your PIN". In item 12, replace "A scammer sends three UPI collect requests" with "Three payment requests or links, each asking for your PIN for ₹1,500 'cashback'". Add an NPCI or news source with asOf for the phase-out.

**P2 [severity: medium] [type: source-dead]** ids: npci-faq (cited in hook, rule, c1, c2, items 11–14, m1, m2, m4, quest)
- What the content says: source url "https://www.npci.org.in/what-we-do/upi/faqs"
- Source says: the page loads "404 Page Not Found" (the uppercase /UPI/ variant also returns 404). The current NPCI UPI FAQ is at https://www.npci.org.in/faqs/upi (listed in https://www.npci.org.in/sitemap.xml). It says: "UPI-PIN ... You have to enter this UPI-PIN to authorize all bank transactions ... Please do not share your UPI-PIN with anyone. BHIM does not store or read your UPI-PIN details and your bank's customer support will never ask for it." and "Can I put a stop payment request for funds transferred by UPI? No, once the payment is initiated, it cannot be stopped."
- Fix: Replace the URL with https://www.npci.org.in/faqs/upi (asOf 2026-10-21). The stop-payment quote also supports item 14 ("no undo").

**P3 [severity: medium] [type: unsupported]** ids: upi-scams-s3 (teach, guided 2, takeaway), upi-scams-c5
- What the content says: "Tell your bank at once and block UPI debits." This is the only reporting step taught.
- Source says: Sanchar Saathi (DoT) Chakshu page: "Note: If you have already lost money, please report at cyber crime helpline 1930 or cybercrime.gov.in." The same page offers "चक्षु - Chakshu ... Report Suspected Fraud Communication" (https://sancharsaathi.gov.in/sfc/). cybercrime.gov.in itself returned 403/Access Denied to the bot, so I quote it only through Sanchar Saathi.
- Fix: Add one line to s3 teach/takeaway: "Lost money? Call your bank, then 1930 or cybercrime.gov.in at once. Report scam calls and SMS on Sanchar Saathi (Chakshu)." Add the sancharsaathi.gov.in/sfc source.

**P4 [severity: low] [type: unsupported]** ids: upi-scams-s3 (why speed matters), upi-scams-16
- What the content says: "Quick action can stop more money leaving your account." This is fine, but the lesson never says why sharing the PIN matters for getting money back.
- Source says: RBI circular of 6 Jul 2017 (https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=11040&Mode=0): "where he has shared the payment credentials, the customer will bear the entire loss until he reports the unauthorised transaction to the bank." Third-party breach: "Within 3 working days — Zero liability"; "Within 4 to 7 working days — The transaction value or the amount mentioned in Table 1 [₹5,000/₹10,000/₹25,000], whichever is lower"; shadow credit "within 10 working days". RBI press release of 24 Jun 2026 (prid=63011): amendment directions revising this framework (wider scope, faster complaint handling, compensation for small-value frauds) "shall come into effect from January 1, 2027".
- Fix: Optional. If added, say: "If you shared your PIN, you bear the loss until you report it, so report at once." Do NOT hard-code the 3/7-day windows: the revised framework takes effect on 1 Jan 2027, and I did not open the final text, so the windows may change. Add a review date of 2027-01-01.

---

### health-nutrition / protein-foods — Protein in everyday food
#### Claims
| Claim | Verdict | Source | Quote / note |
|---|---|---|---|
| c1 Pulses are protein-rich plant foods | SUPPORTED | protein (DGI 2024, txt_9989a412 l.3198-3200) | "Pulses such as lentils, green gram, horse gram, black gram, chickpeas, kidney beans, cowpeas, soyabean and green peas are all rich sources of proteins." |
| c2 Cereals/millets and pulses fill each other's amino acid gaps | SUPPORTED | protein (DGI l.821-823; Table 8.1 l.3147-3151) | "a combination of cereals, millets and pulses provides most of the amino acids, which complement each other"; Table 8.1 note: "A meal containing both pulses and grains supplies all amino acids" |
| c3 20 amino acids; 9 cannot be made, come from food | SUPPORTED | protein (DGI l.822-825) | "Proteins are complex molecules composed of 20 different amino acids. Nine of these 20 amino acids are termed 'essential' and have to be obtained from proteins in the diet, since they are not synthesized in the human body." |
| c4 RDA 0.83 g/kg/day, about 54 g for 65 kg | SUPPORTED | protein (DGI l.3185-3189) | "The recommended dietary allowance (RDA) for protein intake is 0.83g protein/kg/day for healthy men and women." / "RDA of 54g/day for a person weighing 65kg". Note: DGI says "healthy men and women"; content drops "healthy". |
| c5 Cereal:pulse 3:1 raw weight meets all EAA | SUPPORTED | protein (DGI l.3182-3184) | "an appropriate combination of cereals with pulses in the ratio of 3:1 (raw food weight) can meet the requirements of all EAA" |
| c6 Protein 4 kcal/g, fat 9 kcal/g | SUPPORTED | protein (DGI l.829, l.835; l.2917-2918) | "provide energy (4 Kcal/g)"; "concentrated source of energy providing 9 kcal/g"; "lipid gives energy of 9 Kcal, while protein or carbohydrates give only 4 Kcal for every gram." |

Other step/item facts verified in DGI: lysine low in cereals / methionine low in pulses ("cereals have lower levels of lysine but higher levels of sulphur-containing amino acids (methionine and cysteine). In case of pulses, the reverse is true", l.3174-3181); usual intake 60-70 g ("Daily diet of an adult often provides 60g to 70g of protein a day, which is higher than what we require.", l.3114-3115); tissue replacement and enzymes/hormones/haemoglobin ("Proteins are also required to replace tissues that are broken down"; "making enzymes, hormones, cell membrane components and carrier proteins such as hemoglobin", l.3123-3126); same energy as carbohydrate (l.2917-2918); plant/vegan diets can meet the amount ("The required quantity of protein ... easily met from the daily diverse diet, even when only consisting of plant foods (vegan diets)", l.3163-3165). No per-serving food composition numbers (g protein per serving) appear in this concept, so none to check against IFCT.

#### Numbers checked
- c4 / s3 hook / s3 teach: 65 kg x 0.83 → 53.95 g → "about 54 g" OK (matches DGI "54g/day")
- protein-foods-11: 60 x 0.83 → 49.8 → "about 50 g" OK; distractors 83 g (0.83 read as total) and 600 g wrong as intended; answer range 45-55 OK
- s3 guided 1: 80 x 0.83 → 66.4 → "about 66 g" OK; "80 g = 1 g/kg" OK; 830 g decimal slip OK
- s3 example: 50 x 0.83 → 41.5 → text says "about 41 g" → rounding slightly off (see P1)
- protein-foods-10: 300 g rice / 3 → 100 g dal OK; 900 g = flipped ratio OK
- s3 visual: scale 0-100 g, mark at=54 (54 g) and at=65 (midpoint of 60-70 g); `at` is a percentage of the bar (StepLesson.tsx `left: ${mark.at}%`) → 54% and 65% of 100 g OK
- s1 teach/visual: 20 - 9 = 11 non-essential OK (DGI: "remaining non-essential amino acids can be synthesized")
- protein-foods-16 / s3 guided 2: 4 kcal/g protein & carbohydrate, 9 kcal/g fat OK
- protein-foods-15: 60-70 g usual intake vs 54 g need OK; "under 20 g" distractor clearly wrong OK

#### Problems
**P1 [severity: low] [type: wrong-number]** ids: protein-foods-s3 (example)
- What the content says: "50 times 0.83 g is about 41 g,"
- Source says: computation 50 x 0.83 = 41.5 (conventional rounding gives 42)
- Fix: "50 times 0.83 g is about 41.5 g," (and keep spot text identical) or "about 42 g".

**P2 [severity: low] [type: unsupported]** ids: protein-foods-12 (options b, c), protein-foods-s2 guided 1 (option c)
- What the content says: "They fill you up, but they are mostly starch with little protein." / "These are mostly water." / "Tea gives almost no protein"
- Source says: no source text found; DGI only groups potato among tubers at "70–100 Kcal/100g" (l.2708) and gives no protein figure for potato, cucumber or tea.
- Fix: either cite IFCT 2017 values (not in the fetched source) or soften to non-numeric, source-backed wording: "Potatoes are a starchy tuber, not a pulse. The guide names pulses as rich protein sources." / "Cucumbers are a watery vegetable. Pulses like chickpeas bring far more protein." Tea feedback: "Tea is not a pulse, so it cannot fill the lysine gap."

**P3 [severity: low] [type: ambiguous]** ids: rule, protein-foods-c4, protein-foods-s3 (teach, takeaway)
- What the content says: "India's guide sets 0.83 g of protein per kg of body weight a day."
- Source says: "0.83g protein/kg/day for healthy men and women." and "More proteins are required by growing infants and children, adolescents, pregnant women and individuals during infections, illness and physical stress." (DGI l.3186, l.831-833)
- Fix: "India's guide sets 0.83 g of protein per kg of body weight a day for healthy adults." (Kidney-disease caveat not needed since no high-protein advice is given.)

---

### health-nutrition / free-sugars — Free sugars
#### Claims
| Claim | Verdict | Source | Quote / note |
|---|---|---|---|
| c1 Free sugars = added + honey, syrups, juice; not whole fresh fruit, vegetables, milk | SUPPORTED | sugar (WHO healthy diet, txt_8df2986e l.229); who-sugars (txt_670814ac l.207, l.209) | "Free sugars include monosaccharides and disaccharides ... added to foods and beverages by the manufacturer, cook or consumer, and sugars naturally present in honey, syrups, fruit juices and fruit juice concentrates." / "The WHO guideline does not refer to the sugars in fresh fruits and vegetables, and sugars naturally present in milk" |
| c2 <10% of energy; 5% or less may add benefit | SUPPORTED | sugar (l.228); who-sugars (l.205) | "limited to less than 10% of total daily energy intake ... Limiting further to 5% or less of total daily energy intake may provide additional health benefits." |
| c3 10% of 2,000 kcal ≈ 50 g ≈ 12 level teaspoons | SUPPORTED | sugar (l.228) | "equivalent to 50 g (or about 12 level teaspoons) for a person of healthy body weight consuming about 2000 calories per day." |
| c4 One can of soda up to 40 g (~10 tsp) | SUPPORTED | who-sugars (l.210) | "A single can of sugar-sweetened soda contains up to 40 grams (around 10 teaspoons) of free sugars." |
| c5 India's guide: sugar <5% of daily energy for adults | SUPPORTED | icmr-sugar (DGI txt_9989a412 l.1002-1003; l.969) | "Sugar should be less than 5% of the total energy per day for adults." Also l.493: "Avoiding sugar or restricting to 20g to 25g per day (adults)." |

Other step/item facts verified: 5% ≈ 25 g ≈ 6 tsp ("A further reduction to below 5% or roughly 25 grams (6 teaspoons) per day", who-sugars l.205); ketchup 4 g ("1 tablespoon of ketchup contains around 4 grams (around 1 teaspoon) of free sugars", l.210); basis = tooth decay & weight ("reduces the risk of overweight, obesity and tooth decay", l.208); applies to adults and children (l.205); jaggery counts as added sugar (DGI l.4641-4643: "include sucrose (table sugar), jaggery, honey, glucose, fructose, dextrose"); juice "without added sugars contain significant amounts of free sugars" (sugar l.224). Both WHO pages are current (healthy-diet fact sheet dated 26 January 2026 in fetched text). DGI 2024 <5% is the current ICMR-NIN figure.

#### Numbers checked
- c3 / s2 hook / s2 teach / s2 guided 2: 0.10 x 2000 = 200 kcal / 4 kcal/g = 50 g → OK; 50/12 = 4.17 g per tsp ≈ 4 g OK
- free-sugars-11: 0.05 x 2000 / 4 = 25 g → OK; range 20-30 OK; "100 g is twice the 10% limit" (2 x 50) OK; "5 g" distractor OK
- s2 guided 1: 25 / 4 = 6.25 → "about 6" OK (matches WHO "6 teaspoons")
- s2 visual: scale 0-60 g, marks at=42 and at=83 are percent positions (StepLesson.tsx uses `left: ${at}%`): 25/60 = 41.7%, 50/60 = 83.3% → OK
- free-sugars-10: 2 x 40 = 80 g → OK
- s3 guided 1: 40/50 = 0.8 = 80% → OK
- free-sugars-16 / s3 visual: soda 40 g ≈ 10 tsp; ketchup 4 g ≈ 1 tsp → OK (WHO)
- s2 example: 60 g > 50 g → OK (illustrative)
- free-sugars-15: grams scale with energy intake (limit is % of energy) → OK

#### Problems
**P1 [severity: low] [type: unsupported]** ids: free-sugars-s2 (guided 2 hint and feedback), free-sugars-s1 (guided 2)
- What the content says: "Each gram of sugar gives about 4 kcal." / "Any sugar added by a cook counts, whatever its colour or source." (jaggery)
- Source says: the 4 kcal/g figure and the jaggery listing are only in DGI ("of 4 Kcal/g" l.796; "include sucrose (table sugar), jaggery, honey" l.4642), which is the concept's `icmr-sugar` source, but steps s1 and s2 cite only `sugar`/`who-sugars`. Content is correct.
- Fix: add `icmr-sugar` to sourceRefs of free-sugars-s1 and free-sugars-s2 (no wording change needed).

Health wording: none of concern (no fasting, sweetener or medical advice).

---

### health-nutrition / hydration-cues — Hydration cues

#### Claims
| Claim | Verdict | Source | Quote / note |
|---|---|---|---|
| c1 6–8 cups/glasses as a guide, not water-only rule | SUPPORTED | water (NHS) | "the government recommends that people should aim to drink 6 to 8 cups or glasses of fluid a day. This is just a guide" |
| c2 water, lower-fat milk, lower-sugar drinks incl. tea/coffee count | SUPPORTED | water | "Water, lower-fat milk and lower-sugar drinks, including tea and coffee, all count as part of your daily intake." |
| c3 aim for clear pale yellow; dark yellow strong-smelling = low fluid | SUPPORTED | water + nhs-dehydration | "Most people should aim to drink enough during the day so their pee is a clear pale yellow colour." / symptoms: "dark yellow, strong-smelling pee" |
| c4 more fluid in heat / long activity / after sweating | SUPPORTED | water + nhs-dehydration | "you may need to drink more fluids if you're: ... in a hot environment / physically active for long periods"; "drink extra fluids if you've been sweating from physical activity" |
| c5 juice/smoothies max one small glass 150 ml/day | SUPPORTED | water | "limit fruit juice and smoothies to a maximum of one small glass (150ml) a day and drink with a meal, as they're high in sugar" |

#### Numbers checked
- item-9: 3 milk + 2 tea → 5 cups → OK
- item-10: 8 × 250 ml = 2,000 ml = 2 L; distractors 8 L (1 L/glass) and 0.8 L (decimal slip) correctly explained → OK. Also matches ICMR-NIN DGI 2024 "about eight glasses (approximately two litres) of water including beverages per day" → OK
- item-11: NHS range 6–8 (not 15, not "exactly 8 of plain water") → OK
- item-16 / s3 guided-2: 150 ml; "500 ml is more than three times 150" (3.33×) → OK; 1 L → OK
- s1 visual: scale 0–10, marks at 60 and 80 = 6 and 8 cups → OK
- s1 example: 4 water + 2 chai + 1 milk = 7 cups → OK
- s1 guided-1: 3 + 2 + 1 = 6 → OK
- item-13: thirst, dry mouth, tiredness, dark pee, dizziness all on NHS symptom list; "peeing less often than usual" correct → OK
- item-14: "Babies, children and older adults are more at risk of dehydration." (nhs-dehydration) → OK

#### Problems
**P1 [severity: medium] [type: unsupported] ids: rule, hook, s1 teach, item-10, s3, m2 (whole concept)**
- What the content says: "about 6 to 8 cups a day is a guide ... Heat and long activity raise needs." (UK NHS source only; no Indian source)
- Source says: ICMR-NIN DGI 2024 Guideline 14: "A normal healthy person needs to drink about eight glasses (approximately two litres) of water including beverages per day. During very hot weather and while undertaking vigorous physical activity, this requirement increases as a considerable amount of water is lost through sweat." and Points to register: "Prefer butter milk, tender coconut water, lemon water etc., as beverages in hot weather." (https://www.nin.res.in/dietaryguidelines/pdfjs/locale/DGI_2024.pdf, ICMR-NIN DGI 2024 PDF text l.4427-4440, 4554-4562)
- Fix: For an Indian audience add ICMR-NIN DGI 2024 as a source and cite it on the rule/s3/item-10: "India's food guide says about 8 glasses (about 2 litres) a day, including other drinks, and more in very hot weather or hard activity. Buttermilk, coconut water and lemon water are good choices in the heat." Numbers are consistent with NHS, so no number change needed.

**P2 [severity: low] [type: health-wording] ids: rule, s1 teach, s1 example, item-9**
- What the content says: "Water, milk, tea and coffee all add fluid" / "two cups of chai ... Tea counts as fluid too"
- Source says: NHS qualifies "lower-fat milk and lower-sugar drinks, including tea and coffee"; NHS dehydration page: "Avoid caffeinated drinks and alcohol as both will dehydrate you" (when treating dehydration); ICMR-NIN: "Moderation in tea and coffee consumption is advised so that caffeine intake does not exceed the tolerable limits (300mg/day) ... tea and coffee should be avoided at least for one hour before and after meals."
- Fix: Keep "tea and milk count" but add a qualifier in teach: "Lower-sugar tea and milk count. Keep tea and coffee moderate, and when you already feel dehydrated, choose water first." Rule: "Water, milk and lower-sugar tea or coffee all add fluid".

**P3 [severity: low] [type: health-wording] ids: rule, s3 teach, item-15, m3**
- What the content says: "Needs go up in a hot place or during long activity ... extra fluid is needed" (no exceptions)
- Source says: NHS dehydration lists urgent signs ("you feel dizzy when you stand up and it does not go away", "dark yellow pee or you're peeing less than normal") needing medical help; ICMR notes coconut water "should be avoided" in "patients prone to hyperkalemia (in kidney and heart diseases)". No source covers fluid-restricted patients, but the generic "drink more" advice can harm them.
- Fix: Add one line to s3 teach or takeaway: "If a doctor has asked you to limit fluids, follow that advice. Dizziness that does not pass, or very little pee, needs a doctor."

**P4 [severity: low] [type: outdated] ids: sources.water**
- What the content says: source "water", year 2022
- Source says: page footer "Page last reviewed: 17 May 2023 / Next review due: 17 May 2026" (review date passed by 2026-10-21; content still live and unchanged as fetched)
- Fix: Set year to 2023; re-check page at next content refresh.

---

### health-nutrition / sleep-recovery — Sleep and recovery

#### Claims
| Claim | Verdict | Source | Quote / note |
|---|---|---|---|
| c1 CDC: 7+ hours for adults 18–60 | SUPPORTED | cdc-sleep | table: "Adult 18–60 years 7 or more hours" (NIH table identical: "Adults (18–60 years) 7 or more hours per night") |
| c2 deep sleep longer in first half; REM ~90 min after sleep onset | SUPPORTED | sleep (NIH) | "Deep Sleep (Stage 3): ... It happens in longer stretches during the first half of the night." / "Rapid Eye Movement (REM) sleep usually kicks in about 90 minutes after you fall asleep." |
| c3 cycle 80–100 min, 4–6 cycles a night | SUPPORTED | sleep | "One full cycle takes about 80–100 minutes, and most people go through four to six cycles a night." |
| c4 same bed/wake time, devices off 30 min before bed, no late caffeine | SUPPORTED | cdc-sleep | "Going to bed and getting up at the same time every day." / "Turning off electronic devices at least 30 minutes before bedtime." / "Avoiding caffeine in the afternoon or evening." |
| c5 caffeine can take 8 h or more to wear off | SUPPORTED | sleep | "The stimulating effects of caffeine in coffee, colas, certain teas, and chocolate can take 8 hours or more to wear off fully." |
| c6 teens 13–17: 8–10 h | SUPPORTED | cdc-sleep | "Teen 13–17 years 8–10 hours" (NIH lists "Teens (13–18 years) 8–10 hours per 24 hours") |

#### Numbers checked
- item-9: 16-y-old 7 h < 8–10 → below; 20-y-old 7 h meets 7+ → key "only the 16-year-old" → OK
- item-10: 7 × 7 = 49 h; 70 = 10 h × 7; 21 = 3 nights × 7 → OK
- item-13: 23:00→04:30 = 330 min; 330/90 = 3.67 → "3 to 4" OK; 6 × 90 = 540 min = 9 h → OK
- item-12 order light → deep → REM (~90 min) → consistent with NIH → OK
- item-14 / s3 guided-1: 16:00 + 8 h = 00:00 → OK
- s1 visual: scale 4–12 h; 7 h → (7−4)/8 = 37.5 %, 8 h → 50 %, 10 h → 75 % → OK
- s1 example: 01:00→06:00 = 5 h → OK; s1 guided-1: 23:00→06:00 = 7 h → OK
- s2 guided-1: 5 × 90 = 450 min = 7.5 h; 3 × 90 = 4.5 h; 6 × 90 = 9 h → OK
- item-15: "quiet, relaxing, and at a cool temperature" → OK
- item-16 match pairs (caffeine↔afternoon/evening; devices↔30 min) → OK

#### Problems
**P1 [severity: low] [type: ambiguous] ids: s3 teach, s3 visual, item-16 option d, rule (c4 paraphrase)**
- What the content says: "screens off 30 minutes before bed" / "Screens off 30 min before" / "Off 30 minutes before bed"
- Source says: "Turning off electronic devices at least 30 minutes before bedtime." (https://www.cdc.gov/sleep/about/index.html); NIH: "Try not to look at your computer, phone, or TV an hour or so before bed." (https://health.nih.gov/health-topics-a-z/healthy-sleep)
- Fix: Say "at least 30 minutes" everywhere (guided-2 already does): "Screens off at least 30 minutes before bed".

**P2 [severity: low] [type: health-wording] ids: s3 (habits), takeaway**
- What the content says: habits list only; no pointer for persistent sleep trouble.
- Source says: CDC key point "Talk to your healthcare provider if you have problems sleeping."; NIH: "Be cautious about using any sleep product ... 'Natural' does not always mean safe." and on melatonin "not regulated by the U.S. Food and Drug Administration".
- Fix: Add to s3 teach: "If poor sleep goes on for weeks, talk to a doctor rather than trying sleep pills or supplements on your own."

---

### health-nutrition / exercise-heart — Exercise and the heart

#### Claims
| Claim | Verdict | Source | Quote / note |
|---|---|---|---|
| c1 WHO: adults aim 150–300 min moderate aerobic/week | SUPPORTED | who-activity (+cdc-adults) | WHO: "WHO recommends at least 150 to 300 minutes of moderate aerobic activity per week (or the equivalent vigorous activity) for all adults"; brisk walking as example from CDC: "Moderate-intensity aerobic activity (such as brisk walking) for 150 minutes every week" |
| c2 regular moves help the heart; some is better than none | SUPPORTED | who-activity, cdc-adults, who-pa-facts | WHO: "Physical activity is good for hearts, bodies and minds. Regular physical activity can prevent and help manage heart disease"; "Any amount of physical activity is better than none, and more is better."; CDC: "Some physical activity is better than none." |
| c3 talk test: moderate = talk not sing; vigorous = few words before a breath | SUPPORTED | cdc-intensity | "a person doing moderate-intensity aerobic activity can talk, but not sing, during the activity. A person doing vigorous-intensity activity cannot say more than a few words without pausing for a breath." |
| c4 CDC: 150 moderate or 75 vigorous + muscle work 2+ days | SUPPORTED | cdc-adults | "adults need 150 minutes of moderate-intensity physical activity a week. This can also be 75 minutes of vigorous-intensity or an equivalent combination ... In addition, adults need at least 2 days of muscle-strengthening activity each week." |
| c5 WHO: 31% of adults insufficiently active | SUPPORTED | who-pa-facts | "31% of adults and 80% of adolescents do not meet the recommended levels of physical activity." (data year 2022, fact sheet 26 June 2024) |
| (hook/rule/quest also cite "heart") | SOURCE DEAD (blocked-for-bots) | heart (AHA) | Retried 2026-10-21 via headless Chromium headless Chromium: HTTP 403, Cloudflare "Performing security verification". Content not seen. See P1 for coverage by other sources. |

#### Numbers checked
- item-9: 15 × 2 × 5 = 150 → OK; 15 × 5 = 75 (one way) → OK
- item-10: 200 min jogging/week ≥ 75 vigorous (adult CDC) → aerobic part met for an adult → OK for adults only (see P2)
- item-11: 300 / 7 = 42.86 ≈ 43; answer band 40–46 → OK
- item-12: doubles tennis moderate, singles vigorous, swimming laps vigorous, recreational swimming moderate → matches CDC lists → OK
- item-15: 31 % ≈ 3 in 10 → OK; "9 in 10 too high for adults" (adolescents 80 %) → OK
- item-16: vigorous ×2 → 60, 80, 100 → order a, b, c → OK (2:1 ratio follows from CDC 150 ↔ 75)
- s1 teach: 150 / 5 = 30 min/day → OK (CDC: "30 minutes a day, 5 days a week")
- s1 visual: 0–300 scale, 150 → 50 %, 300 → 100 % → OK
- s1 example: 30 × 5 = 150 → OK; guided-1: 20 × 7 = 140; 20 × 10 = 200 → OK; guided-2: 300 = top of range → OK
- s2 guided-2: slow flat cycling moderate (CDC "slower than 10 miles per hour on level terrain" ≈ 16 km/h) → OK
- s3 teach/visual: 75 vigorous = 150 moderate → OK; guided-1: 25 × 3 = 75 → OK
- No heart-rate or MET maths in the concept (CDC MET bands 3–5.9 moderate, ≥6 vigorous not used) → nothing to check

#### Problems
**P1 [severity: medium] [type: source-dead] ids: hook, rule, quest, sources.heart**
- What the content says: hookSourceRefs/ruleSourceRefs ["heart","who-activity"]; quest "Notice a pulse at rest and after an easy walk." cites only ["heart"]; rule "A brisk walk makes the heart and lungs work more."
- Source says: heart.org page is blocked (403 Cloudflare, retried with headless Chromium), not seen. Coverage elsewhere: hook is covered by who-activity ("All physical activity counts. ... transport (walking, wheeling and cycling)"); rule's heart/lungs line is covered by cdc-intensity ("Physical activity intensity affects heart rate and breathing.") which the rule does not cite; quest (pulse changes with effort) is covered by the same cdc-intensity line.
- Fix: Drop "heart" from sources (it also lacks asOf). Rule refs → ["who-activity","cdc-intensity"]; hook refs → ["who-activity","cdc-adults"]; quest refs → ["cdc-intensity"].

**P2 [severity: medium] [type: wrong-key] ids: item-10**
- What the content says: "A school runner jogs 200 minutes a week but does no strength work. Checked against the CDC guide, what is missing?" Key: "Muscle work on 2 or more days." Option c feedback: "His running is already plenty."
- Source says: the cited guide is for adults ("Adults need at least 150 minutes ..." cdc-adults). For school-age young people WHO says "an average of 60 minutes of moderate aerobic physical activity per day for children and adolescents" (who-activity); ICMR-NIN DGI 2024: "Children and adolescents (>5–19 years): ... a minimum of 60 minutes per day of moderate-to-vigorous intensity activity. Vigorous intensity activities and strength training should be included for at least three days per week." 200 min/week = 28.6 min/day, so for a school student "his running is already plenty" is false and "2 or more days" is the wrong muscle figure.
- Fix: Make him an adult: "A 22-year-old club runner jogs 200 minutes a week but does no strength work. Checked against the CDC adult guide, what is missing?" (key and feedback then correct).

**P3 [severity: medium] [type: health-wording] ids: rule, s1 teach, s2 example (stadium steps "gasp"), s3, quest**
- What the content says: activity targets and vigorous examples with no safety caveat, in a concept titled "Exercise and the heart" (original AHA source sits under "cardiac-rehab").
- Source says: ICMR-NIN DGI 2024: "If one follows sedentary life style, it is wise to consult a doctor before starting an exercise program." / "Exercise intensity and duration should be increased gradually over a period of time. Shortness of breath, pain, nausea, vomiting, and headache are warning signs that your body needs rest." / "People with illnesses or chronic diseases like heart disease, high blood pressure, diabetes, asthma, osteoporosis and obesity should consult a physician before taking up an exercise program." (ICMR-NIN DGI 2024 PDF text l.3715-3760)
- Fix: Add to s1 or s3 teach: "Build up slowly. If you have a heart or long-term condition, check with a doctor first. Stop and rest if you get chest pain, unusual breathlessness, dizziness or nausea." Optionally add ICMR-NIN DGI 2024 as an Indian source; its adult figures match (">19–60 years: ... 30–60 minutes of moderate-intensity aerobic physical activity per day for at least five days in a week; or 15 minutes of vigorous-intensity ... Muscle strengthening ... minimum of two days in a week").

**P4 [severity: low] [type: unsupported] ids: item-14 option a feedback**
- What the content says: "WHO and CDC both say some activity beats none, and the week can be split into shorter bouts."
- Source says: CDC: "You can spread your activity out during the week and break it up into smaller chunks of time." The fetched WHO texts say "Any amount of physical activity is better than none" but nothing about splitting into bouts.
- Fix: "WHO and CDC say some activity beats none, and CDC says the week can be split into shorter bouts."

---

### health-nutrition / iron-and-anaemia — Iron and anaemia basics
#### Claims
| Claim | Verdict | Source | Quote / note |
|---|---|---|---|
| c1 Vitamin C foods (guava, orange, lemon) help plant-iron uptake | SUPPORTED | icmr-iron (DGI txt_9989a412 l.1319-1322); medline-iron (txt_61c292dd l.90) | "Consumption of rich sources of vitamin C fruits like guava, pineapple and citrus fruits (lemon, orange) improve iron absorption from plant foods" / "Foods rich in vitamin C (such as citrus, strawberries, tomatoes, and potatoes) also increase iron absorption." |
| c2 Low iron causes anaemia; other nutrient gaps and infections too | SUPPORTED | anaemia (WHO, txt_73a289ac l.236-238) | "Anaemia may be caused by several factors: nutrient deficiencies, inadequate diet ..., infections, inflammation, chronic diseases, gynaecological and obstetric conditions, and inherited red blood cell disorders." |
| c3 Iron helps make haemoglobin, which carries oxygen | SUPPORTED | icmr-iron (DGI l.2740-2743); anaemia (l.212); iron (NHS, txt_8f9770b9 l.37) | "Iron is an essential element necessary for the formation of hemoglobin ... Hemoglobin plays an important role in the transportation of oxygen to the tissues." / NHS: "Iron is important in making red blood cells, which carry oxygen around the body." |
| c4 Tannin in tea/coffee interferes; keep 1 hour from meals | SUPPORTED | icmr-iron (DGI l.4521-4527; l.2472-2473) | "Tannin is also present in tea and coffee and is known to interfere with iron absorption. Hence, tea and coffee should be avoided at least for one hour before and after meals." |
| c5 WHO: ~30% of women 15-49, ~40% of children 6-59 months | SUPPORTED | anaemia (l.208) | "Globally, it is estimated that 40% of all children aged 6–59 months, 37% of pregnant women and 30% of women 15–49 years of age are affected by anaemia." (2019 estimates, l.219) |
| c6 NHS: 8.7 mg men, 14.8 mg women 19-49 | SUPPORTED (but not India's figure, see P1) | iron (NHS l.53-54) | "8.7mg a day for men aged 19 and over" / "14.8mg a day for women aged 19 to 49". Page footer: "Page last reviewed: 03 August 2020 / Next review due: 03 August 2023". |

Other step/item facts verified: anaemia definition ("the number of red blood cells or the haemoglobin concentration within them is lower than normal", WHO l.211); iron deficiency most common nutritional cause ("Iron deficiency ... is considered the most common nutritional deficiency leading to anaemia", l.237); folate, B12, vitamin A (l.237); malaria (l.216, l.238); inherited disorders (l.240); greens rich in iron but poorly absorbed ("Iron is available in plenty in green leafy vegetables, but the absorption is limited.", DGI l.2747-2749); plant iron harder to absorb (medline l.65; DGI l.1315); sprouted/fermented grains help ("Bioavailability of iron can be improved by using fermented and sprouted grains", DGI l.1114-1115); beans/chickpeas/nuts as sources (NHS l.43-44). No WHO haemoglobin thresholds appear in the content, so none to check. No food iron mg values appear, so none to check against IFCT.

#### Numbers checked
- iron-and-anaemia-10: 14.8 - 8.7 = 6.1 → "about 6 mg" OK; 14.8 + 8.7 = 23.5 → "about 23 mg" correctly labelled as the sum; range 5.5-6.5 OK
- iron-and-anaemia-9: 30% women 15-49, 40% children 6-59 mo → matches WHO l.208 OK
- c4 / s2 guided 2 / items 12: "at least an hour before and after meals" → DGI l.4526-4527 OK
- India check (step 4): ICMR-NIN 2020 RDA iron = 19 mg men, 29 mg women (EAR 11 / 15); gap 29 - 19 = 10 mg (vs NHS gap 6.1 mg)

#### Problems
**P1 [severity: medium] [type: outdated]** ids: iron-and-anaemia-c6, iron-and-anaemia-10
- What the content says: "NHS gives 8.7 mg of iron a day for men and 14.8 mg for women aged 19 to 49." / "Estimate the gap between them." (answer about 6 mg)
- Source says: NHS page is UK guidance, "Page last reviewed: 03 August 2020 / Next review due: 03 August 2023" (overdue). India's current figures, ICMR-NIN Nutrient Requirements for Indians 2020, brief note Table 3/4: "Iron (mg) 17 19 11 8" (males: RDA 2010, RDA 2020, EAR 2020, IOM) and "Iron (mg) 21 29 15 18" (females) (https://www.nin.res.in/rdabook/brief_note.pdf). For an app aimed at Indian adults, the UK figures are about half of the Indian RDA and may mislead.
- Fix: replace with the ICMR-NIN 2020 figures and add the source: c6 "India's nutrient guide (ICMR-NIN 2020) sets 19 mg of iron a day for adult men and 29 mg for adult women." Item 10: stem "ICMR-NIN sets 29 mg of iron a day for adult women and 19 mg for men. Estimate the gap." correct "About 10 mg" (29 - 19 = 10; range 9.5-10.5), distractors "About 48 mg" (sum) and "About 1 mg". Feedback: "29 minus 19 is 10, so women need about 10 mg more, mainly because of blood lost in periods." (drop the last clause unless sourced).

**P2 [severity: low] [type: unsupported]** ids: iron-and-anaemia-s2 (guided 1, option c), iron-and-anaemia-s1 (hook, option c)
- What the content says: "Cola has no vitamin C to help." / "Calcium does that." (makes bones hard)
- Source says: no source text found for cola's vitamin C content. Calcium/bones only indirectly in DGI ("Calcium and vitamin D are essential ... for proper formation of bones and teeth", l.1114-1116, pregnancy context).
- Fix: cola feedback: "Cola is not a vitamin C food. An orange or guava would help." Bone feedback: "That is mainly calcium's job. Iron helps build haemoglobin, which carries oxygen."

**P3 [severity: low] [type: health-wording]** ids: iron-and-anaemia-s3 (teach), iron-and-anaemia-15, iron-and-anaemia-s3 guided 2
- What the content says: "Anaemia has many causes; low iron is only the most common." and the example "some children have anaemia from low iron, some from too little folate, and some from malaria." No line tells the learner how the cause is found.
- Source says: "Anaemia is diagnosed based on blood haemoglobin concentrations falling below specified thresholds ... It is considered a symptom of an underlying condition(s)." and "The treatment and prevention of anaemia depend on the underlying cause of the condition." (WHO l.235, l.242)
- Fix (prevents self-treating with iron tablets on a guess): append to s3 teach: "A blood test shows anaemia, and a doctor finds the cause." Keep the concept free of supplement dosing; none is present now (no iron-tablet or IFA wording found anywhere in the concept).

---

### health-nutrition / food-label-reading — Reading a food label

#### Claims
| Claim | Verdict | Source | Quote / note |
|---|---|---|---|
| food-label-reading-c1 | SUPPORTED | label (NHS, txt_2ab2bf62) + icmr-label (txt_9989a412) | NHS: "All nutrition information is provided per 100 grams or per 100 millilitres and sometimes per portion of the food or drink." DGI: "This nutrient content provides nutrients per 100gm/100ml or serve size to help the consumer make informed choices." |
| food-label-reading-c2 | SUPPORTED | label + icmr-label | NHS: "Ingredients must be listed in descending order of weight, so the main ingredients in the packaged food always come first." DGI: "These are displayed in descending order with the ingredient that is highest in quantity appearing first." (DGI says "quantity", not "weight".) |
| food-label-reading-c3 | SUPPORTED | icmr-label | DGI: "the product claiming to have real fruit may have added sugar and other additives with only 10 % actual fruit pulp." and "Sugar-free foods may be loaded with fats, refined cereals (white flour, starch) and even hidden sugars (maltitol, fructose, corn syrup, molasses)." |
| food-label-reading-c4 | SUPPORTED | icmr-label | DGI Table 17.1: "If the label states, two servings for the entire packet and the calorie content is 100 calories per serving, then use of the entire packet would imply consumption of 200 calories." |

#### Numbers checked
- food-label-reading-9: 30 g pack, 1.5 g salt/100 g → 30×1.5/100 = 0.45 g; range 0.4–0.5 → OK. Distractors: 1.5 (per 100 g) and 4.5 (×3) are both clearly wrong → OK
- food-label-reading-10: B 12 g/200 ml → 6 g/100 ml < A 10 g/100 ml → OK
- food-label-reading-11: 3 servings × 80 kcal = 240 kcal → OK
- food-label-reading-s1 example/visual: A 6 g/20 g → 30 g/100 g; B 9 g/50 g → 18 g/100 g → OK (the visual matches the example)
- food-label-reading-s1 guided 1: 2 × 100 kcal = 200 kcal → OK (matches the DGI wording exactly)
- food-label-reading-12: 40 > 25 > 20 > 15 → order oats, sugar, nuts, raisins → OK
- food-label-reading-16, s2 hook/example/guided: list positions read correctly → OK
- food-label-reading-s3, item 15: "10% fruit" → DGI says "10 or less percent" → PARTLY (see P1)
- Marked-correct options: all 8 items and 6 guided/hook questions checked; keys correct, no second defensible option.

#### Problems
**P1 [severity: medium] [type: wrong-number]** ids: food-label-reading-s3 hook (option a + its feedback, option b feedback, option c feedback), food-label-reading-15 (option a feedback)
- What the content says: "As little as 10%." / "India's food guide says such a claim can cover only 10% fruit." / "This claim can sit on a product with only about 10% fruit."
- Source says: "According to the FSSAI regulation, any food item with even a small amount, for example, fruit juices containing only 10 or less percent of fruit added to a product is allowed to state that the product is made with real fruit pulp or juice." (DGI 2024 p.109, txt_9989a412). "As little as 10%" makes 10% sound like a floor, but the guide says 10% or less.
- Fix: Hook option a → "Very little: 10% or even less." Feedback → "Right. India's food guide says a 'real fruit' claim can sit on a drink with 10% fruit or less." Option b/c feedback → "...the claim can cover 10% fruit or less." Item 15a → "This claim can sit on a product with 10% fruit or less." (The s3 teach/visual "may be only 10% fruit" is fine as an example.)

**P2 [severity: low] [type: ambiguous]** ids: food-label-reading-14 (option a text), food-label-reading-s3 guided 1, visual right ("Maltitol, corn syrup")
- What the content says: "Other sugars, like maltitol or fructose."
- Source says: DGI calls them "hidden sugars (maltitol, fructose, corn syrup, molasses)". Maltitol is a sugar alcohol (polyol), not a sugar. I could not confirm the FSSAI 'sugar free' threshold from a page I opened: fssai.gov.in failed TLS (curl 60) and WebFetch returned 503. Secondary sources say the threshold is ≤0.5 g sugars per 100 g/100 ml. If so, a compliant 'sugar free' pack cannot carry much fructose or corn syrup.
- Fix: Option a → "Sweeteners like maltitol, plus refined flour or fat." Feedback → "India's food guide warns sugar-free foods can hide sweeteners like maltitol, and can be high in fat and refined flour." Keep the DGI attribution. Recheck once the FSSAI claims schedule is reachable.

**P3 [severity: low] [type: outdated]** ids: rule, food-label-reading-s3 (title, teach, takeaway), misconception food-label-reading-m3
- What the content says: "Front-of-pack claims can mislead, so the back label tells more." / "Front claims sell; the back label shows what is inside."
- Source says: This is still true in Oct 2026, because no front-of-pack warning is mandatory yet. But it is changing. ETV Bharat, 29 Aug 2026, on FSSAI's affidavit to the Supreme Court: "a red-coloured hexagonal shape" warning ("High Fat", "High Sugar", "High Salt") using DGI 2024 thresholds; "the same will be notified by way of an amendment in the respective regulations" (https://www.etvbharat.com/en/bharat/fssai-proposes-front-of-pack-warning-label-in-red-for-food-products-high-in-fat-salt-and-sugar-enn26082902769). LawBeat, 26 Sep 2026: FSSAI seeks "a four-month period" to finalise plus "a voluntary implementation period of 365 days" (https://lawbeat.in/top-stories/front-of-pack-labelling-to-be-rolled-out-in-single-phase-fssai-tells-supreme-court-1635388). Omnicuris, 28 Sep 2026: the Supreme Court reserved its order. Separately, FSSAI approved bold, larger-font total sugar, salt and saturated fat in the nutrition panel in July 2024 as a draft: "the draft notification for the said amendment would now be put in the public domain" (https://www.newsonair.gov.in/fssai-approves-a-proposal-to-display-nutritional-information-regarding-total-sugar-salt-and-saturated-fat-in-bold-letters/). I could not confirm final notification (FSSAI site unreachable).
- Fix: Change "Front-of-pack claims" to "Front-of-pack marketing claims (like 'real fruit', 'sugar free')" so it stays true once official "High sugar/salt/fat" warnings arrive. Set a review flag for when the FSSAI FOP warning regulation is notified, then add a step: "A red 'High Sugar/Salt/Fat' warning is official. Trust it."

---

### health-nutrition / fad-diet-claims — Fad diet claims

#### Claims
| Claim | Verdict | Source | Quote / note |
|---|---|---|---|
| c1 eat from many food groups; no one food gives all nutrients | SUPPORTED | variety (ICMR-NIN DGI 2024) | "A balanced diet can be achieved by eating diverse foods since there is no single food item with all the essential nutrients." / "Foods have been categorized into 10 groups to help people make choices from different food groups." |
| c2 WHO: at least 400 g fruit & veg/day for everyone older than 10 | SUPPORTED | who-diet | "Everyone older than 10 years of age should aim for at least 400 grams of fruits and vegetables per day" |
| c3 NCCIH: no strong research detox helps weight loss; early loss regained | SUPPORTED | nccih-detox | "A 2015 review concluded that there was no compelling research to support the use of “detox” diets for weight management or eliminating toxins from the body. A 2017 review said that juicing and “detox” diets can cause initial weight loss because of low intake of calories, but they tend to lead to weight gain once a person resumes a normal diet." |
| c4 gradual loss; ~0.5 kg/week safe; not below 1,000 kcal/day | SUPPORTED | variety | "Weight reduction should be gradual. Weight reduction diets should not be less than 1000 Kcal/day and should provide all nutrients. A reduction of half a kilogram body weight per week is considered to be safe. Approaches of rapid weight loss and use of anti-obesity drugs should be avoided." (DGI p.64) |
| c5 vegetables, fruits, greens, roots/tubers ≈ half the plate | SUPPORTED | variety | "vegetables, fruits, green leafy vegetables, tubers and roots forming essentially half the plate of the recommended foods per day" |

#### Numbers checked
- item-10: 400 g × 7 = 2,800 g = 2.8 kg; 28 kg = decimal slip → OK
- item-11: rajma → pulses ("Lentil, green gram, chickpea, rajma, cowpea"); ragi → cereals and millets → OK
- item-14: 5 kg = 10 × 0.5; 10 kg = 20 × 0.5 → OK
- item-15: 600 < 1,000 (key); 1,800 and 1,500 > 1,000 → OK
- s1 guided-1: 10 food groups (Table 1.1) → OK; guided-2: "about half" → OK
- s3 hook: 10 kg in 2 weeks = 5 kg/week = 10 × 0.5 → OK
- s3 visual: scale 0–5 kg, 0.5 kg → 10 %, 5 kg → 100 % → OK
- s3 example: 8 kg in 7 days = 16 × the 0.5 kg/week pace → "far beyond" OK
- s3 guided-1: 5 / 0.5 = 10 weeks; "1 week = ten times the safe pace" (5 vs 0.5) → OK
- s3 guided-2: 700 < 1,000 → OK
- s2 guided-1: laxatives → "can cause diarrhea. Acute diarrhea can lead to dehydration and malabsorption." → OK
- s2 guided-2 / item-13: "only a small number of studies ... low quality—with study design problems, few participants, or lack of peer review" → OK
- No 7,700 kcal/kg or energy-deficit maths present → nothing to flag

#### Problems
**P1 [severity: medium] [type: health-wording] ids: s2 teach, s2 example, item-12, s2 hook, rule**
- What the content says: "Rhea does a juice cleanse for a week, the scale drops a little, but the weight returns once she eats normally." / "Aman does a 5-day juice detox" — framed only as "doesn't work", with no mention of harms.
- Source says: NCCIH: "Drinking large quantities of water and herbal tea and not eating any food for days in a row could lead to dangerous electrolyte imbalances."; "fasting can cause headaches, fainting, weakness, and dehydration."; "Some juices used in “detoxes” and “cleanses” that haven’t been pasteurized ... can make people sick."; "Persons susceptible to kidney stone formation should limit their consumption of high-oxalate foods"; "If you have diabetes, consult your health care providers before making major changes in your eating habits." (https://www.nccih.nih.gov/health/detoxes-and-cleanses-what-you-need-to-know)
- Fix: Add to s2 teach: "Juice-only or no-food days can also cause headaches, weakness, fainting and dehydration. People with diabetes, kidney or heart problems, or who are pregnant should talk to a doctor before any big diet change." Optionally add a guided try on these risks.

**P2 [severity: low] [type: health-wording] ids: rule, s3 teach, item-14, item-15, m3**
- What the content says: "Safe weight loss is slow, about half a kilo a week." / "India's food guide floor of 1,000 kcal a day"
- Source says: the ICMR sentence sits in the overweight/obesity section ("it is important to maintain desirable body weight for height and prevent overweight and obesity ... Weight reduction should be gradual"), and the guide's reference plate is "for a 2000 Kcal Indian diet". Audience includes teens/students; the content never says 0.5 kg/week is for people who need to lose weight, nor that 1,000 kcal is a floor, not a target.
- Fix: s3 teach: "For people who need to lose weight, India's food guide calls about half a kilo a week safe, and says weight-loss diets should never go below 1,000 kcal a day. That is a lower limit, not a goal; most adults need far more."

**P3 [severity: low] [type: ambiguous] ids: item-16**
- What the content says: "Why does India's food guide prefer slow weight loss to crash plans?" Key: "Weight-loss diets still need to give all nutrients."
- Source says: the guide states the rules together ("should be gradual ... not less than 1000 Kcal/day and should provide all nutrients ... Approaches of rapid weight loss ... should be avoided") but gives no causal "why". NCCIH gives the reason: "Diets that severely restrict calories or the types of food you eat usually don’t lead to lasting weight loss and may not provide all the nutrients you need."
- Fix: Reword stem to "What else does India's food guide say a weight-loss diet must do?" or cite nccih-detox on the key and phrase it "Very low-calorie plans may not give all nutrients, and the loss rarely lasts."
