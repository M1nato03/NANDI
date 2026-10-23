# Fact check: rewritten Money, Health, Body and How things work (cloud job batch 3, job 3)

- Date: 2026-10-23. Branch checked: `origin/ship-32` at `dab36b3` (contains `efdcb58`).
- Files: `content/topics/topic.money-markets.json`, `topic.health-nutrition.json`, `topic.body-training.json`, `topic.how-things-work.json`.
- Earlier checks compared against: `ideas/factcheck-money-health` (`69c8cfd`, checked `fc35e7c`) and `ideas/factcheck-body-how` (`d60e571`, checked `fc35e7c`).
- No content was changed. This report is the only file committed.

## Top table

| Topic | Claims | Supported | Partly | Not supported | Source dead | Problems (H/M/L) | Fix before release |
|---|---|---|---|---|---|---|---|
| Money and markets | 46 | 44 | 2 | 0 | 0 (1 source dead, its claim backed by a second source) | 10 (0/2/8) | **2** |
| Health and nutrition | 50 | 49 | 1 | 0 | 0 | 9 (0/2/7) | **2** |
| Body and training | 37 | 31 | 1 | 0 | **5** (FSSAI PDF) | 7 (0/1/6) | **1** |
| How things work | 66 | 65 | 1 | 0 | 0 | 5 (0/1/4) | **1** |
| **Total** | **199** | **189** | **5** | **0** | **5** | **31 (0/6/25)** | **6** |

- "Claims" means the `claims[]` entries, the facts each concept says it teaches. Each one gets a verdict below, with a quote and a URL.
- Every hook, rule, teach card, example, guided try, item, option, feedback line, misconception, quest and askLine was also read.
  - Those lines are checked against the same sources.
  - A line only gets its own row when it goes beyond its concept's claims. Those rows are the problems.
- "Fix before release" counts the MEDIUM problems. No HIGH problems were found.
- All 68 sums I recomputed are correct (script in the method section).
- Every answer key was read against its stem. None is wrong.

## How much changed since the earlier checks

Most of the text is new. The table shows the share of learner-facing lines whose wording appears nowhere in the `fc35e7c` version.

| Topic | Changed lines | Notes |
|---|---|---|
| Money | 37–91 of ~150 per concept (about 40%) | New sources: CPI 2024=100 press release, live RBI loan FAQ, SBI Card MITC, investor.gov "What is Risk?" and "Diversify", Bajaj AMC, Cafemutual, Business Today, Sanchar Saathi. `npci-faq` dropped. |
| Health | 81–125 of ~150 per concept (about 70%) | Rebuilt around ICMR-NIN DGI 2024 and the ICMR-NIN 2020 RDA note. `heart.org` dropped. |
| Body | 72–125 of ~145 per concept (about 65%) | Protein reframed on ICMR-NIN. Heat and warm-up safety fixes. Gardner habit paper added. `who` (NCBI book) and CDC measuring page dropped. |
| How | 68–115 of ~150 per concept (about 55%) | NPCI OC-220 and OC-226 added. Weak drone and sky sources swapped. |

## Fix before release (MEDIUM)

1. **Money / upi-scams / item 10, option b feedback.** It says: "Money only leaves when you approve a payment with your PIN."
   - NPCI OC-226 (7 Oct 2025) says the UPI PIN is used "except UPI Lite and mandate execution". It also says "On-Device biometric authentication (fingerprint, face, etc) shall be introduced as an additional option in lieu of UPI PIN … initially … for transactions up to Rs. 5,000." (NPCI PDF, read as a scanned image: https://www.npci.org.in/uploads/UPI_OC_No_226_FY_2025_26_Introduction_of_Additional_Authentication_methods_in_UPI_42c3693399.pdf)
   - The How-things-work `upi-path` concept already teaches this correctly ("usually your UPI PIN"). The Money topic contradicts it.
   - Fix: "Money leaves only when you approve a payment, usually with your UPI PIN." Also add `npci-oc226` to upi-scams `sources`.
2. **Money / upi-scams / item 15, option b feedback.** It says: "Banks cannot promise to return money."
   - Riya's case is a debit she never made. RBI's customer-liability rules give zero liability for "Third party breach where the deficiency lies neither with the bank nor with the customer … and the customer notifies the bank within three working days".
   - The same rules say: "the bank shall credit (shadow reversal) the amount … within 10 working days from the date of such notification". (https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=11040&Mode=0, opened 23 Oct)
   - As written, the line can put people off claiming money they are owed.
   - Fix: "A refund is not instant. Telling the bank within three working days also protects your right to get the money back under RBI rules."
3. **Health / free-sugars / step s2 (hook, teach, visual, takeaway) and rule.** The step asks "About how many teaspoons of free sugar fit in a day for most adults?" The answer is "About 12" (WHO, under 10% of energy).
   - India's own guide, cited on the same step, is stricter: "Sugar should be less than 5% of the total energy per day for adults." (DGI 2024, PDF p.29) and "One may consume sugar, but it must be restricted to 25–30 grams per day." (PDF p.56). Source: https://www.nin.res.in/dietaryguidelines/pdfjs/locale/DGI_2024.pdf
   - An Indian learner is told 12 teaspoons fit, while ICMR-NIN says about 6 to 7.
   - Fix: lead with India's figure. Teach: "India's food guide says under 5% of the day's energy, about 25 g or 6 teaspoons. WHO's outer limit is 10%, about 50 g." Hook answer: "About 6 (India's guide); WHO's ceiling is 12."
4. **Health / iron-and-anaemia / s3 teach ("Don't start iron tablets without one"), claim c8 ("iron tablets are given once a test shows low iron"), item 13.**
   - ICMR-NIN advises routine iron tablets with no test in pregnancy and breastfeeding: "pregnant women are advised to take daily supplements of iron and folic acid (IFA) tablets" (PDF p.32). Also: "Daily recommended dosage of iron for prevention of anemia is one IFA tablet." (PDF p.37). https://www.nin.res.in/dietaryguidelines/pdfjs/locale/DGI_2024.pdf
   - The line can put a pregnant learner off tablets her health worker gives her.
   - Fix s3 teach: "Don't start iron tablets on your own guess; take them when a doctor or health worker advises, as in pregnancy." Fix c8: "…treatment depends on the cause."
5. **Body / food-labels: the only source is SOURCE DEAD this session.** It is cited for c1 to c5 and all 3 steps and 6 items.
   - URL: https://www.fssai.gov.in/upload/uploadfiles/files/Comp_Labelling%20Display_Version%20VII_03042025.pdf
   - curl and headless Chromium both fail through the session proxy ("self-signed certificate in certificate chain"). WebFetch gives HTTP 503. The Wayback copy reset the connection.
   - The 21 Oct check opened it and quoted Reg 5(2)(b), 5(2)(g), 5(3)(a) and 5(3)(b). The rewritten claims match those quotes word for word in meaning, but I could not re-open the text.
   - Fix: a human opens the PDF in a browser once and confirms c1–c5. No wording change expected.
6. **How / battery-flight-time / step s3 example, the tapped spot.** It says: "A bigger battery would push it past the peak."
   - The Berkeley paper says the opposite. Their drone's battery fraction was "φ ≈ 0.23", which "corresponds to a total flight time of approx. 0.47 times the optimal flight time". An "optimal" design "would be capable of a maximum flight of 25.6 min". (https://hiperlab.berkeley.edu/wp-content/uploads/2020/06/2020_FlyingBatteries.pdf)
   - The real reason for flying batteries is that even the best battery size has a hard ceiling. The paper also says: "This large fraction makes structural design difficult and may lead to potential safety concerns."
   - Fix parts[1] and spot: "Even the best battery size would cap it near 26 minutes." Feedback: "Battery size alone tops out near two thirds of the mass. Swapping batteries in flight gave 57 minutes instead of 12."

---

# Money and markets

India currency checks, all opened on 23 Oct 2026:
- RBI target: "In its second review, on March 25, 2026, the Central Government retained the inflation target and the tolerance band for the next 5-year period – April 1, 2026 to March 31, 2031." (https://www.rbi.org.in/Scripts/FS_Overview.aspx?fn=2752). The content says 4%, 2–6%, until March 2031. Correct.
- CPI: the cited source is now the MoSPI/NSO "Press Release of Consumer Price Index on base 2024=100 for July, 2026" (12 Aug 2026). The content no longer gives the old 2012-series shop or market counts. Correct for the 2024=100 series.
- SBI Card: "The current rate of finance charges is upto 3.75% per month [45% per annum]". Matches c4 and s2 teach.
- UPI: OC-220 (P2P collect ended 1 Oct 2025) and OC-226 (biometric up to ₹5,000) were both read. The content uses them correctly except item 10 (fix 1).
- SEBI: the content makes no T+1, KYC or TER claims, so there was nothing SEBI-specific to date-check. The SEBI investor pages still say what is quoted.

## inflation
| Claim | Verdict | Quote | URL |
|---|---|---|---|
| c1 India tracks a basket with a CPI | SUPPORTED | "4 per cent Consumer Price Index (CPI) inflation as the target" | https://www.rbi.org.in/Scripts/FS_Overview.aspx?fn=2752 |
| c2 Broad price rise cuts buying power of fixed cash | SUPPORTED | "If nominal incomes do not increase as much as prices, purchasing power and real (inflation-adjusted) income fall." (via WebFetch; curl and Chromium got 403) | https://www.imf.org/en/publications/fandd/issues/series/back-to-basics/inflation |
| c3 Same month a year earlier; staff record prices in markets every month | SUPPORTED | "Year-on-year inflation rate … for the month of July, 2026 over July, 2025 is 4.45%". Also: "Real time price data are collected from selected 1407 urban Markets (including online markets) and 1465 villages … through personal visits by field staff … on a weekly roster." | https://static.pib.gov.in/WriteReadData/specificdocs/documents/2026/aug/doc2026812951801.pdf |
| c4 Real income falls; fixed incomes lose | SUPPORTED | IMF pensioner example: "a fixed 5 percent yearly increase to their pension" loses purchasing power if inflation is higher | IMF URL above |
| c5 4%, 2–6%, to March 2031; falling prices make people put off buying | SUPPORTED | RBI quote above. IMF (WebFetch): "Falling prices can lead consumers to delay purchases, reducing economic activity and growth." | RBI and IMF URLs above |

Old problems: P1 (50,000 shops / 2,295 markets) FIXED. P2 (dead MoSPI PDF) FIXED. P3 (one item's rise called "inflation") FIXED: item 16 is now "how much your mess bill rose". P4 (3% read as a real figure) FIXED: "Say the news reports…". P5 (pre-tax) is gone: item 10 now compares a 3% account with the 4% target.

Problem **M9 [LOW]**, c3. The content says "every month". The source says "on a weekly roster" and counts 1,465 *villages*, not markets. The statement is true but loose. Optional: "Survey staff record prices every week in towns, villages and online shops across India."

## compounding
| Claim | Verdict | Quote | URL |
|---|---|---|---|
| c1 Growth on past gains | SUPPORTED | "With compound interest, you earn interest on the money you save and on the interest that money earns." | https://www.investor.gov/introduction-investing/investing-basics/save-and-invest/small-savings-add-big-money |
| c2 SIP adds money at set times; returns not fixed | SUPPORTED | SEBI: "There are facilities to invest or redeem in a systematic manner – Systematic Investment Plan (SIP)". Investor.gov: "Markets fluctuate over time, and individual investments may lose value." | https://investor.sebi.gov.in/hindi/understanding_mf.html, https://www.investor.gov/introduction-investing |
| c3 ₹365 at 5%: 466 after 5 years, 1,578 after 30 | SUPPORTED | "it would grow to $465.84 by the end of five years, and by the end of 30 years, to $1,577.50" | small-savings URL above |
| c4 The sooner saving starts, the more compound interest builds | SUPPORTED | "Explain that the sooner they begin saving, the more money they potentially could accumulate through the power of compound interest." | https://syndication.finra.org/content/financial-education-kids-creating-path-financial-fluency |

The new `sip-units` source backs the s3 guided try (same ₹500 buys fewer units): "each fixed instalment buys more units when the scheme's NAV is lower and fewer units when its NAV is higher". It also says: "it does not eliminate market risk, guarantee returns". https://www.bajajamc.com/knowledge-centre/articles/how-rupee-cost-averaging-works-in-sip-investments
- Problem **M8 [LOW]**: this is a fund house's marketing page. Prefer an AMFI or SEBI investor page for the same two lines.
- Old P1 FIXED.

## rule-of-72
| Claim | Verdict | Quote | URL |
|---|---|---|---|
| c1 Divide 72 by a set rate | SUPPORTED | "Divide 72 by the interest rate received on savings or investments." | FINRA URL above |
| c2 Markets have no fixed rate, so only a what-if | PARTLY | "Markets fluctuate over time" (investor.gov). No cited source says the rule assumes a steady compound rate. | investor.gov URL above |
| c3 4% doubles in about 18 years | SUPPORTED | "money in a savings account yielding 4 percent interest will double in 18 years" | FINRA URL |
| c4 Card at 18% doubles in ~4 years; one Indian issuer charges up to 3.75% a month, 45% a year | SUPPORTED | FINRA: "An unpaid balance on a credit card that charges 18 percent interest will double in four years." SBI: "upto 3.75% per month [45% per annum]" | FINRA URL, https://www.sbicard.com/en/most-important-terms-and-conditions.page |

- Old P1 (US-only 18%) FIXED: s2 now uses 36% and 45%.
- Old P2 is still open as **M5 [LOW]**: c2 is PARTLY. Add a source that states the rule assumes a constant compounded rate.

## risk-return
| Claim | Verdict | Quote | URL |
|---|---|---|---|
| c1 Risk = chance of loss and uncertain results | SUPPORTED | "risk refers to the degree of uncertainty and/or potential financial loss inherent in an investment decision" | https://www.investor.gov/introduction-investing/investing-basics/what-risk |
| c2 High possible gain may mean more risk | SUPPORTED | "The reward for taking on risk is the potential for a greater investment return." | https://www.investor.gov/additional-resources/general-resources/publications-research/info-sheets/beginners-guide-asset |
| c3 Cash safest, least; shares most risk, most return; bond = loan to a company; more risk wants more return | SUPPORTED | "Cash and cash equivalents … are the safest investments, but offer the lowest return". "With a bond, you are loaning money to a company." "as investment risks rise, investors seek higher returns" | both investor.gov URLs above |
| c4 US large company shares fell about 1 year in 3 | SUPPORTED | "Large company stocks as a group … have lost money on average about one out of every three years." | beginners-guide URL |
| c5 Long horizon can wait out swings; money needed soon suits low risk | SUPPORTED | "An investor with a longer time horizon … can wait out slow economic cycles" | beginners-guide URL |

- Old P1 and P2 FIXED: what-risk is cited, and item 13 now teaches inflation risk on cash.
- **M4 [LOW]**, c3 and s2 teach say "A bond is a loan you make to a company." In India most retail bonds people meet are government (G-secs, RBI Retail Direct). Fix: "a loan to a company or a government".

## diversification
| Claim | Verdict | Quote | URL |
|---|---|---|---|
| c1 A mix spreads one firm's risk | SUPPORTED | "The practice of spreading money among different investments to reduce risk is known as diversification." | beginners-guide URL |
| c2 Cannot promise no loss if the whole market drops | SUPPORTED | "Diversification can't guarantee that your investments won't suffer if the market drops." | https://www.investor.gov/introduction-investing/investing-basics/save-and-invest/diversify-your-investments |
| c3 4–5 shares too few; one guide asks for a dozen | SUPPORTED | "You'll need at least a dozen carefully selected individual stocks to be truly diversified." | beginners-guide URL |
| c4 One-industry fund is not a full spread | SUPPORTED | "a mutual fund investment doesn't necessarily provide instant diversification, especially if the fund focuses on only one particular industry sector" (21 Oct quote; same page opened today) | beginners-guide URL |
| c5 Each holding can add fees | SUPPORTED | "you'll likely pay additional fees and expenses, which will, in turn, lower your investment returns" | beginners-guide URL |

- Old P1 and P2 FIXED: the diversify page is cited, and the visual axis now runs 0–20.
- **M6 [LOW]**, s3 guided option c feedback says "Rising prices touch everything you own, so spreading over firms cannot block that." No cited source says this, and inflation risk is not what the step teaches. Fix: "Rising prices are a different risk; a spread over firms is about one firm's bad luck."

## shares
| Claim | Verdict | Quote | URL |
|---|---|---|---|
| c1 Share = part ownership | SUPPORTED | "Shares are like owning a piece of a company." | https://investor.sebi.gov.in/understandings_shares.html |
| c2 Dividend not sure; owners can gain if the firm grows | SUPPORTED | "the amount and how often the company pays out dividends is not guaranteed". "Investor become the part owner of the company and can benefit from the future growth of the company." | SEBI URL |
| c3 More shares, bigger piece | SUPPORTED | "The more shares you have, the bigger piece you own." | SEBI URL |
| c4 Owners vote at the general meeting | SUPPORTED | "you get right to vote on important decisions about the company at General meeting" | SEBI URL |

- Old P1 and P2 FIXED: dividends can come from past profits, and a future dividend is not owed.
- **M10 [LOW]**, s3 guided option b feedback says "a loss year makes a cut more likely". This is reasonable but has no source. Optional: drop the clause.

## emergency-fund
| Claim | Verdict | Quote | URL |
|---|---|---|---|
| c1 Cash kept for a sudden need | SUPPORTED | "An emergency fund or a rainy day fund … is that cash reserve— your savings kept aside for any unprecedented event" | https://www.rbi.org.in/FinancialEducation/content/I%20Can%20Do_RBI.pdf |
| c2 Useful when reachable without a sale | PARTLY | Inferred from the asset table: "Liquidity Risk—It may be difficult to sell off this investment e.g. selling land or real estate in parts." | same |
| c3 At least 3 months; 6+ if less secure or self-employed | SUPPORTED | "at least three months. But if your job is less secure or you run a business or are self-employed … six months or more" | same |
| c4 Separate, easy-to-reach savings account | SUPPORTED | "kept in a savings account—separate from your other savings accounts—that is easily accessible" | same |
| c5 Start small, save from each pay | SUPPORTED | "start small but immediately. Save a little bit from each paycheck" | same |

- Old P1 (year) FIXED: the source is now dated 2010. Old P2 and P3 items are gone.
- **M7 [LOW]**: c2 is still PARTLY, as on 21 Oct.

## loan-emi
| Claim | Verdict | Quote | URL |
|---|---|---|---|
| c1 EMI = interest + principal; fixed-rate EMI constant | SUPPORTED | "You repay the loan in Equated Monthly Installments (EMIs) comprising both principal and interest." "In case of a pure fixed loan, the EMI due to the bank remains constant." | https://www.rbi.org.in/Scripts/FS_FAQs.aspx?Id=77&fn=2754 |
| c2 Interest on the sum still due | SUPPORTED | "interest is computed on the new, reduced principal outstanding" | same |
| c3 Longer term: smaller EMI, more interest | SUPPORTED | "longer tenures mean payment of larger interest towards the loan" | same |
| c4 ₹10 lakh, 15%, 120 months: EMI ₹16,133.50, first interest ₹12,500 | SUPPORTED | Annex: "Monthly Payment 16,133.50"; row 1 "16,133.50 12,500.00 3,633.50" (also via WebFetch) | same |

- Old P1 (dead URL) FIXED: the URL is now the live rbi.org.in page.
- Old P2 FIXED: "on a fixed-rate loan".
- No new problems.

## index-funds
| Claim | Verdict | Quote | URL |
|---|---|---|---|
| c1 Holds securities to follow an index; charges an expense ratio | SUPPORTED | "returns of an index fund are closely aligned with the returns of the underlying index, minus any costs like expense ratios" | https://investor.sebi.gov.in/index_mutual_fund.html |
| c2 Over ten years most active large-cap funds in India trailed their index | SUPPORTED (secondary) | "73% of Indian large-cap and 82% of Indian mid and small-cap funds have underperformed their benchmarks over a 10-year period" (Cafemutual, 2 Oct 2025). `spiva-india` is **SOURCE DEAD**: 403 to curl, Chromium and WebFetch. | https://cafemutual.com/news/industry/35917-73-of-indian-large-cap-and-82-of-mid-and-small-cap-funds-have-underperformed-sp-india-benchmarks-over-a-10-year-period |
| c3 Holds all or most index shares in the same proportions | SUPPORTED | "holding all or most of the securities that constitute the index in the same proportions" | SEBI index URL |
| c4 Passive, little trading, lower expense ratios | SUPPORTED | "Index funds have lower expense ratios compared to actively managed funds since they involve minimal management." | same |
| c5 Tracking error from expenses and running costs | SUPPORTED | "Tracking Error: The slight difference between the fund's performance and the index it tracks due to expenses or operational inefficiencies." | same |

- Old P2 FIXED: "with dividends counted".
- Old P1 is PARTLY fixed, now **M3 [LOW]**:
  - The SPIVA page is still blocked, but a reachable secondary source was added.
  - The `spiva-india` source is titled "Year-End 2025". The Cafemutual figure (Oct 2025) is from the Mid-Year 2025 report.
  - A search snippet (not opened) gives 76.3% over 10 years in Year-End 2025. "Most" holds either way.
  - Fix: point `spiva-india` at the report PDF (https://www.spglobal.com/spdji/en/documents/spiva/spiva-india-scorecard-year-end-2025.pdf, also blocked here) and have a human confirm it.

## upi-scams
| Claim | Verdict | Quote | URL |
|---|---|---|---|
| c1 NPCI: QR scan + PIN make a payment, not collect a prize | SUPPORTED | "scanning a QR code and entering a UPI PIN is only meant for making payments, not receiving them" (Chromium; curl 403) | https://www.npci.org.in/fraud-awareness |
| c2 P2P collect requests ended 1 Oct 2025; merchants still can; scam links and QR codes | SUPPORTED | "While merchants can continue using collect requests, these will be restricted to legitimate business cases". Primary source: OC-220, "by 1st October 2025 UPI P2P Collect shall not be allowed to be processed in UPI". | https://www.businesstoday.in/amp/personal-finance/banking/story/npci-to-tighten-upi-rules-peer-to-peer-collect-feature-to-end-in-october-489244-2025-08-13 |
| c3 RBI: receiving money never needs a QR scan or PIN | SUPPORTED | "Transactions involving receipt of money do not require scanning barcodes / QR codes or entering MPIN." | https://rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx?prid=53185 |
| c4 Never share PIN or OTP, not even with bank staff; no unknown apps | SUPPORTED | "Never share your account details such as … UPI-PIN, OTP … with anyone, not even with bank officials". "Do not download any unknown app on your phone / device." | same |
| c5 Tell the bank, block debits incl. UPI; report on 1930 or cybercrime.gov.in | SUPPORTED | RBI: "inform your bank / e-wallet provider immediately and block all modes of debit, including UPI". Chakshu: "If you have already lost money, please report at cyber crime helpline 1930 or cybercrime.gov.in." | RBI URL, https://sancharsaathi.gov.in/sfc/ |

- Old P1 (collect requests) FIXED. Old P2 (dead `npci-faq`) FIXED: removed. Old P3 (1930 unsourced) FIXED.
- New problems: **M1 [MED]** (item 10, fix 1) and **M2 [MED]** (item 15, fix 2).

Money problem list: M1 MED, M2 MED, M3–M10 LOW. That is 10 problems, 2 to fix before release.

---

# Health and nutrition

All page numbers for `DGI_2024.pdf` are PDF page numbers. The printed page is the PDF page minus 17.

## protein-foods
| Claim | Verdict | Quote | URL |
|---|---|---|---|
| c1 Milk, meat, fish, eggs, pulses rich; nuts and seeds hold a good amount | SUPPORTED | p.26: "Animal foods like milk, meat, fish and eggs and plant foods such as pulses are rich sources of proteins". p.74: "inclusion of nuts and seeds can provide all the EAA" | https://www.nin.res.in/dietaryguidelines/pdfjs/locale/DGI_2024.pdf |
| c2 Cereals/millets and pulses fill each other's gaps | SUPPORTED | p.75 Table 8.1 note: "A meal containing both pulses and grains supplies all amino acids" | same |
| c3 20 amino acids, 9 essential; animal foods carry all nine | SUPPORTED | p.74: "Of the 20, nine amino acids are not synthesized in the body". p.26: "Animal proteins … provide all the essential amino acids in right proportions" | same |
| c4 0.83 g/kg; about 54 g at 65 kg | SUPPORTED | p.75: "RDA for protein intake is 0.83g protein/kg/day … RDA of 54g/day for a person weighing 65kg, regardless of physical activity or gender" | same |
| c5 Cereals:pulses 3:1 raw meet all EAA | SUPPORTED | p.75: "cereals with pulses in the ratio of 3:1 (raw food weight) can meet the requirements of all EAA" | same |
| c6 Teens, pregnant women, ill or stressed need more | SUPPORTED | p.26: "More proteins are required by growing infants and children, and adolescents, pregnant women and individuals during certain infections, illness and physical stress." | same |
| c7 Nuts and oilseeds fatty; pulses low fat, high fibre | SUPPORTED | p.26: "nuts and oil seeds … are rich sources of fats". p.76: "Pulses are low-fat and high-fibre foods" | same |

The concept was rewritten, so the old P1–P3 no longer apply.
- Item 14 and m3 say the figure holds "whether or not they exercise". This is backed by "regardless of physical activity" (p.75).
- **H3 [LOW]**, s3 visual mark "60 to 70 g: a usual adult diet" is in no cited text.
  - The nearest figures are in Annexure V (PDF p.146), "Crude protein obtained from these food groups": 64 g for a sedentary man and 55 g for a sedentary woman.
  - Fix: "55 to 65 g: the guide's sample diets" or drop the mark.

## free-sugars
| Claim | Verdict | Quote | URL |
|---|---|---|---|
| c1 What counts as free sugar; not fruit, veg, milk sugars | SUPPORTED | "added to foods and drinks by the manufacturer, cook or consumer, and sugars naturally present in honey, syrups, fruit juices". Also: "does not refer to the sugars in fresh fruits and vegetables, and sugars naturally present in milk, because there is no reported evidence of adverse effects" | https://www.who.int/news/item/04-03-2015-who-calls-on-countries-to-reduce-sugars-intake-among-adults-and-children |
| c2 Under 10%; overweight, obesity, tooth decay; 5% may add benefit | SUPPORTED | "keeping intake of free sugars to less than 10% of total energy intake reduces the risk of overweight, obesity and tooth decay". "Limiting further to 5% or less … may provide additional health benefits." | same, and https://www.who.int/en/news-room/fact-sheets/detail/healthy-diet |
| c3 10% of 2,000 kcal = 50 g, about 12 tsp | SUPPORTED | "equivalent to 50 g (or about 12 level teaspoons) for a person of healthy body weight consuming about 2000 calories per day" | healthy-diet URL |
| c4 Soda up to 40 g; ketchup about 4 g per tbsp | SUPPORTED | "1 tablespoon of ketchup contains around 4 grams … A single can of sugar-sweetened soda contains up to 40 g" | WHO 2015 URL |
| c5 India: under 5% for adults; jaggery and honey are sugars | SUPPORTED | p.29: "Sugar should be less than 5% of the total energy per day for adults." p.111: "include sucrose (table sugar), jaggery, honey" | DGI URL |

New problem **H1 [MED]**: fix 3 above.

## hydration-cues
| Claim | Verdict | Quote | URL |
|---|---|---|---|
| c1 About 8 glasses / 2 litres incl. other drinks | SUPPORTED | p.106: "A normal healthy person needs to drink about eight glasses (approximately two litres) of water including beverages per day." | DGI URL |
| c2 Water, lower-fat milk, lower-sugar drinks incl. tea and coffee count | SUPPORTED | "Water, lower-fat milk and lower-sugar drinks, including tea and coffee, all count as part of your daily intake." | https://www.nhs.uk/live-well/eat-well/food-guidelines-and-food-labels/water-drinks-nutrition/ |
| c3 Aim for pale yellow pee; signs of low fluid | SUPPORTED | "aim to drink enough during the day so their pee is a clear pale yellow colour". Dehydration page: "dark yellow, strong-smelling pee, peeing less often than usual … a dry mouth" | same, and https://www.nhs.uk/conditions/dehydration/ |
| c4 Needs rise in heat and hard or long activity | SUPPORTED | p.106: "During very hot weather and while undertaking vigorous physical activity, this requirement increases as a considerable amount of water is lost through sweat." | DGI URL |
| c5 On hot days ICMR-NIN likes buttermilk, coconut water, lemon water; avoid coconut water with some kidney or heart problems | PARTLY | p.107: "buttermilk, lemon water … and coconut water are excellent alternatives to synthetic drinks" (no "hot days"). p.106: "in patients prone to hyperkalemia (in kidney and heart diseases), tender coconut water should be avoided" | DGI URL |
| c6 Dizziness that stays, confusion, far less pee: urgent help | SUPPORTED | "Ask for an urgent GP appointment or get help from NHS 111 if: … you feel dizzy when you stand up and it does not go away". "Call 999 or go to A&E if: … are confused" | NHS dehydration URL |

- Old P1 (8 glasses unsupported) FIXED, now on ICMR-NIN.
- **H4 [LOW]**: c5 is PARTLY. Drop "On hot days" or say "as drinks instead of sugary soft drinks".
- **H5 [LOW]**: item 13 ("doctor told him to limit fluids") is not in any source. It is safe and conservative, so keep it, but no source backs it.

## sleep-recovery (health)
| Claim | Verdict | Quote | URL |
|---|---|---|---|
| c1 CDC: 7 or more hours, adults 18–60 | SUPPORTED | "Adult 18–60 years 7 or more hours" (Chromium) | https://www.cdc.gov/sleep/about/index.html |
| c2 Deep sleep early; REM longer toward morning | SUPPORTED | "Early on, your body prioritizes deep sleep to help you recover physically. As morning approaches, those deep sleep windows get shorter while your REM cycles get longer." | https://health.nih.gov/health-topics-a-z/healthy-sleep |
| c3 Cycle 80–100 min, 4–6 a night; vivid dreams in REM | SUPPORTED | "One full cycle takes about 80–100 minutes, and most people go through four to six cycles a night." "Dreams are generally most vivid during REM sleep" | same |
| c4 Same schedule, quiet cool dark room, devices off 30 min, no late caffeine | SUPPORTED | CDC: "Going to bed and getting up at the same time every day … Turning off electronic devices at least 30 minutes before bedtime … Avoiding caffeine in the afternoon or evening." | CDC URL |
| c5 Caffeine 8 h or more to wear off | SUPPORTED | "can take 8 hours or more to wear off fully" | NIH URL |
| c6 Learning and memory; deep sleep repair; one hour less hurts focus | SUPPORTED | "Sleep helps with learning and the formation of long-term memories." "Cutting back on sleep by even one hour can make it tough to focus the next day" | same |
| c7 Light, dark, schedule set the clock; see a doctor rather than sleep products | SUPPORTED | "regulated by multiple factors, including light, darkness". "Be cautious about using any sleep product". "See a doctor if you continue to have trouble sleeping." | same |

**H6 [LOW]**: item 10 option c feedback says "much of it happens in deep sleep". This is stronger than "Deep sleep triggers more release of hormones that … boost muscle mass and the repair of cells and tissues". Fix: "deep sleep boosts the hormones that drive repair."

## exercise-heart
| Claim | Verdict | Quote | URL |
|---|---|---|---|
| c1 WHO 150–300 min moderate; any amount better than none | SUPPORTED | "Any amount of physical activity is better than none … WHO recommends at least 150 to 300 minutes of moderate aerobic activity per week" | https://www.who.int/europe/publications/i/item/9789240014886 |
| c2 Aerobic work raises heart rate and breathing, improves heart and lungs; helps prevent heart disease | SUPPORTED | p.86: "This activity tends to increase the heart rate and breathing, resulting in greater improvement in the heart and lung functioning." WHO: "contributes to prevention and management of … cardiovascular diseases" | DGI URL, https://www.who.int/news-room/fact-sheets/detail/physical-activity |
| c3 Talk test | SUPPORTED | "a person doing moderate-intensity aerobic activity can talk, but not sing … cannot say more than a few words without pausing for a breath" (Chromium) | https://www.cdc.gov/physical-activity-basics/measuring/index.html |
| c4 150 moderate or 75 vigorous; muscle work 2+ days | SUPPORTED | "This can also be 75 minutes of vigorous-intensity … In addition, adults need at least 2 days of muscle-strengthening activity" | https://www.cdc.gov/physical-activity-basics/guidelines/adults.html |
| c5 Spread in chunks; some better than none | SUPPORTED | "You can spread your activity out during the week and break it up" | same |
| c6 Raise effort slowly; doctor first after a break or with illness; rest for breathlessness, pain, nausea, headache | SUPPORTED | p.87: "If one follows sedentary life style, it is wise to consult a doctor before starting an exercise program … Shortness of breath, pain, nausea, vomiting, and headache are warning signs that your body needs rest." p.88: people with "heart disease, high blood pressure, diabetes … should consult a physician" | DGI URL |

- Old P1 (heart.org dead) FIXED: removed. Old P2 (wrong key on item 10) FIXED: rewritten, key checked. Old P3 (wording) FIXED.
- **H7 [LOW, safety]**: s3 teach and rule say "pain, nausea or odd breathlessness means rest". This matches ICMR-NIN. On a heart topic, though, add: "Chest pain or faintness that does not settle with rest needs medical help at once." No cited source says this, so it is a safety suggestion only.

## iron-and-anaemia
| Claim | Verdict | Quote | URL |
|---|---|---|---|
| c1 Vitamin C helps plant iron; tea and coffee get in the way | SUPPORTED | "Foods rich in vitamin C … also increase iron absorption." "black teas contain substances that bind to dietary iron" | https://medlineplus.gov/ency/article/002422.htm |
| c2 Many causes: iron, folate, B12, malaria, heavy periods, thalassaemia, sickle cell | SUPPORTED | "Deficiencies in vitamin A, folate, vitamin B12 and riboflavin can also result in anaemia". "The largest causes were dietary iron deficiency, thalassaemia and sickle cell trait, and malaria". "heavy menstruation" | https://www.who.int/news-room/fact-sheets/detail/anaemia |
| c3 Iron makes haemoglobin, which carries oxygen | SUPPORTED | "Iron is important in making red blood cells, which carry oxygen around the body." | https://www.nhs.uk/conditions/vitamins-and-minerals/iron/ |
| c4 Tannin; keep tea and coffee an hour from meals | SUPPORTED | p.108: "Tannin is also present in tea and coffee and is known to interfere with iron absorption. Hence, tea and coffee should be avoided at least for one hour before and after meals." | DGI URL |
| c5 Tired, dizzy, breathless on effort, headache, cold hands and feet | SUPPORTED | "tiredness, dizziness or feeling light-headed, cold hands and feet, headache, shortness of breath, especially upon exertion" | WHO anaemia URL |
| c6 ICMR-NIN 2020: 19 mg men, 29 mg women | SUPPORTED | Table 3 (males) "Iron (mg) 17 19 11 8"; Table 4 (females) "Iron (mg) 21 29 15 18" (RDA 2010, RDA 2020, EAR 2020, IOM) | https://www.nin.res.in/rdabook/brief_note.pdf |
| c7 Women with periods more at risk | SUPPORTED | "mainly affecting young children, pregnant and postpartum women, and menstruating adolescent girls and women" | WHO anaemia URL |
| c8 Blood test; treatment depends on cause; tablets once a test shows low iron | SUPPORTED (UK) | "The GP will usually do a blood test". "If the blood test shows your red blood cell count is low, iron tablets will be recommended" | https://www.nhs.uk/conditions/iron-deficiency-anaemia/ |

- Old P1 (UK RDA) FIXED: now ICMR-NIN 2020.
- New problem **H2 [MED]**: fix 4. c8 is true of UK GP practice. The step's absolute line ("Don't start iron tablets without one") conflicts with Indian guidance for pregnancy and breastfeeding.

## food-label-reading
| Claim | Verdict | Quote | URL |
|---|---|---|---|
| c1 Per 100 g/ml, maybe per serving set by brand | SUPPORTED | "All nutrition information is provided per 100 grams or per 100 millilitres and sometimes per portion". "the manufacturer's idea of a portion may be different from yours" | https://www.nhs.uk/live-well/eat-well/food-guidelines-and-food-labels/how-to-read-food-labels/ |
| c2 Ingredients largest first | SUPPORTED | "Ingredients must be listed in descending order of weight" | same |
| c3 Front claims mislead; 'real fruit' ≤10%; 'sugar free' may hold maltitol, fat, white flour | SUPPORTED | p.126: "food item … containing only 10 or less percent of fruit … is allowed to state that the product is made with real fruit pulp or juice". "Sugar-free foods may be loaded with fats, refined cereals (white flour, starch) and even hidden sugars (maltitol…)" | DGI URL |
| c4 Two 100 kcal servings = 200 kcal | SUPPORTED | Arithmetic. p.126 lists nutrients "per 100g or per 100ml or per serving". | DGI URL |
| c5 'All natural' used loosely; read the back | SUPPORTED | p.126: "This term is often used rather loosely … Read the label, specifically the ingredients" | DGI URL |

Old P1 (wrong number) FIXED. Old P3 (front-of-pack warning labels) no longer applies, because no FSSAI front-of-pack rule is stated. No new problems.

## fad-diet-claims
| Claim | Verdict | Quote | URL |
|---|---|---|---|
| c1 Eat from many food groups; no one food has all nutrients | SUPPORTED | p.18: "A balanced diet can be achieved by eating diverse foods since there is no single food item with all the essential nutrients." | DGI URL |
| c2 WHO: at least 400 g fruit and vegetables for everyone over 10 | SUPPORTED | "Everyone older than 10 years of age should aim for at least 400 grams of fruits and vegetables per day" | healthy-diet URL |
| c3 No strong research on detox for weight; early loss from low calories; weight returns | SUPPORTED | "there was no compelling research to support the use of 'detox' diets for weight management". "can cause initial weight loss because of low intake of calories, but they tend to lead to weight gain once a person resumes a normal diet" | https://www.nccih.nih.gov/health/detoxes-and-cleanses-what-you-need-to-know |
| c4 Slow loss; 0.5 kg a week called safe; avoid rapid plans and diet drugs | SUPPORTED | p.81: "A reduction of half a kilogram body weight per week is considered to be safe. Approaches of rapid weight loss and use of anti-obesity drugs should be avoided." | DGI URL |
| c5 Vegetables, fruits, greens, roots, tubers about half the plate | SUPPORTED | p.23: "vegetables, fruits, green leafy vegetables, tubers and roots forming essentially half the plate" | DGI URL |
| c6 Fasting: headaches, fainting, weakness, dehydration; hard calorie cuts rarely last | SUPPORTED | "fasting can cause headaches, fainting, weakness, and dehydration". "Diets that severely restrict calories … usually don't lead to lasting weight loss and may not provide all the nutrients you need." | NCCIH URL |

- Old P1 (wording) FIXED: "for people who need to lose weight", and item 14 adds the underweight case.
- **H8 [LOW]**: item 10 option a feedback says milk "is not a source of iron". The source says "Milk is the best source of biologically available calcium but is a poor source of iron" (p.32). Fix: "a poor source of iron".
- **H9 [LOW]**: s3 takeaway says "Half a kilo a week is safe". The source says "considered to be safe". Fix: "is called safe".

Health problem list: H1 and H2 MED, H3–H9 LOW. That is 9 problems, 2 to fix before release.

Health-promise scan: no line promises a health result. "Over time the heart and lungs work better" matches ICMR-NIN p.86. The "educational, not medical advice" footer is app-side and was not checked here.

---

# Body and training

Guide page numbers below are PDF page numbers. The printed page is the PDF page minus 1.

## progressive-overload
| Claim | Verdict | Quote | URL |
|---|---|---|---|
| c1 Strength training improves strength and size; should be progressive | SUPPORTED | "Compared with no exercise (control), RT significantly improved muscle strength". "Healthy adults should perform progressive RT" (E-utilities abstract) | https://pubmed.ncbi.nlm.nih.gov/41843416/ |
| c2 Overload; body adapts; body weight can be the load | SUPPORTED | p.61: "Muscle-strengthening activities make muscles do more work than they are accustomed to doing. That is, they overload the muscles … calisthenics that use body weight for resistance (such as push-ups, pull-ups, and planks)" | https://odphp.health.gov/sites/default/files/2019-09/Physical_Activity_Guidelines_2nd_edition.pdf |
| c3 Weight, sets or reps, or days up bit by bit | SUPPORTED | p.72: "gradual increases in the amount of weight, number of sets or repetitions, or the number of days a week of exercise will result in stronger muscles" (21 Oct quote, same PDF) | same |
| c4 Small rises keep injury risk low; weekly rise relative to usual linked to injury | SUPPORTED | p.34: "Small, progressive changes in overload help the body adapt … while minimizing the risk of injury." p.90: "Pay attention to the relative size of the increase in physical activity each week, as this is related to injury risk." | same |
| c5 Raise effort gradually; breathlessness, pain, nausea, headache mean rest | SUPPORTED | ICMR-NIN p.87 (quoted under exercise-heart c6) | DGI URL |

- Old P1 (jogging example used as a universal rule) FIXED: p.34 is cited and the visual is labelled jogging. Old P4 (8→10 squats) FIXED: now 8→9. Old P6 (metadata) FIXED.
- **B1 [LOW]**: item 12's stem reads "same weights and the same reps all term … He must have added ___ a training day". Sets could also have gone up. Fix the stem: "same weights, sets and reps".
- **B2 [LOW]**: s2 teach says "Once work feels easy, the body has caught up". s1 hook option c says "Easy is a sign it worked". No source equates ease with adaptation; this was old P2 and is still open. Fix: "When work starts to feel easy, that is often a sign the body has adapted."

## muscle-protein-rest
| Claim | Verdict | Quote | URL |
|---|---|---|---|
| c1 0.83 g/kg; above ~1.6 g/kg no further muscle | SUPPORTED | p.75 (as protein c4). p.77: "protein intake levels greater than ~1.6g/kg/day do not contribute any further to RET-induced gains in muscle mass" | DGI URL |
| c2 Training and protein both switch on building; without exercise protein not used for muscle | SUPPORTED | ISSN: "resistance exercise, and protein ingestion both stimulate muscle protein synthesis (MPS) and are synergistic". NIN p.76: "without adequate physical activity or resistance exercise, proteins will not be used for muscle building" | https://pmc.ncbi.nlm.nih.gov/articles/PMC5477153/, DGI URL |
| c3 Building process raised up to 48 h; smaller over 50 | SUPPORTED | "can sustain measurable increases in postabsorptive MPS soon after RE cessation and up to 48 h post-RE". Smaller in "older adults (>50 y …)" (E-utilities abstract) | https://pubmed.ncbi.nlm.nih.gov/38716482/ |
| c4 Most trainees get enough from food; kidney disease take care | SUPPORTED | p.77: "Most athletes can get the recommended amount of protein through food alone, without the use of supplements." "Kidney damage, or worsening renal function with high protein intake, may occur in those who already have some renal disease" | DGI URL |

- Old HIGH (NIN ignored) FIXED. Old MED: MPS wording FIXED ("muscle-building process"). Journal name FIXED ("Translational Sports Medicine"). Item 14 rewritten.
- **B3 [LOW]**: s3 guided option b feedback says "Hard work on top of Monday's session cuts into the time the building process needs". No cited source says training again within 48 h harms building. Fix: "The building process is still running, so many plans rest that muscle a day or two."

## sleep-recovery (body)
| Claim | Verdict | Quote | URL |
|---|---|---|---|
| c1 Deep sleep triggers a hormone that builds muscle and repairs tissue in adults | SUPPORTED | "Deep sleep triggers the body to release the hormone that promotes normal growth … This hormone also boosts muscle mass and helps repair cells and tissues in children, teens, and adults." | https://www.nhlbi.nih.gov/health/sleep-deprivation/health-effects |
| c2 Adults 7–9 h | SUPPORTED | "Experts recommend that adults sleep between 7 and 9 hours a night." | https://www.nhlbi.nih.gov/health/sleep/how-much-sleep |
| c3 Short-term loss lowered performance; end of night worst; start of night no clear drop | SUPPORTED | "-1.17 (P<0.05) for partial sleep deprivation at the end of the night, and -0.25 (P>0.05) for partial sleep deprivation in the beginning of the night" | https://pubmed.ncbi.nlm.nih.gov/39006249/ |
| c4 Ghrelin up, leptin down, hungrier | SUPPORTED | "your level of ghrelin goes up and your level of leptin goes down. This makes you feel hungrier" | NHLBI health-effects URL |

- Old MED ("one night") FIXED: "short-term sleep loss, often a single night". Old metadata FIXED.
- **B4 [LOW, health wording]**: the rule, m1, s1 hook, item 9 and item 10 say "Much of the body's repair happens in deep sleep". Item 10 says short nights slow a scraped knee healing. Both go beyond the source, which says deep sleep releases a hormone that "helps repair cells and tissues". Fix: "Deep sleep releases a hormone that helps repair tissue, so short nights can cut recovery."
- Note: health/sleep says "7 or more" (CDC) and body/sleep says "7 to 9" (NHLBI). Both are sourced. Consider using one phrasing across topics.

## heat-hydration
| Claim | Verdict | Quote | URL |
|---|---|---|---|
| c1 Hot exercise: heat risk, fluid loss; dizzy, sick, headachy warning | SUPPORTED | "People who exercise on hot days are more likely to become dehydrated and get heat-related illness." Poster: "Nausea or vomiting … Dizziness • Headache" | https://www.cdc.gov/heat-health/risk-factors/heat-and-athletes.html, https://www.cdc.gov/extreme-heat/media/pdf/Heat_Related_Illness.pdf |
| c2 Early or late, start slow, drink more than usual without waiting for thirst | SUPPORTED | "Schedule workouts and practices earlier or later in the day … Start activities slow and pick up the pace gradually. Drink more water than usual, and don't wait until you're thirsty" | CDC athletes URL |
| c3 Sweat up to 1 L/h with salt; forcing water raises risk; food easiest salt | SUPPORTED | "sweat rates may reach 1 liter per hour, resulting in substantial fluid and sodium loss". "forcing a person who is not thirsty to drink water increases the risk of hyponatremia" (21 Oct quote). "For recreational athletes, food is the most efficient vehicle for salt replacement." | https://www.cdc.gov/yellow-book/hcp/environmental-hazards-risks/heat-and-cold-illness-in-travelers.html |
| c4 Core-to-skin heat; HR and temp rise with fluid loss; heart, sugar, kidney conditions | SUPPORTED | "increase blood flow to shunt heat from the core to the surface". "Temperature and heart rate increase in direct proportion to the level of dehydration." "most importantly, cardiovascular disease, diabetes, renal disease" | same |
| c5 Warning signs: stop, cool, sip; medical help if vomiting, worse, over an hour | SUPPORTED | Poster: "Move to a cool place … Sip water. Get medical help right away if: You are throwing up; Your symptoms get worse; Your symptoms last longer than 1 hour" | poster URL (via WebFetch PDF) |
| c6 Confusion or passing out: heat stroke; call help, cool, nothing to drink | SUPPORTED | "Call 911 right away-heat stroke is a medical emergency … Move the person to a cooler place … Do not give the person anything to drink" | poster URL |

All four old MED problems are FIXED: forced water, thirst, confusion, and when to get help. No new problems.
- Note: "call an ambulance" gives no number. India's 112 and 108 were not checked this session.

## warmup-myths
| Claim | Verdict | Quote | URL |
|---|---|---|---|
| c1 Gradual warm-up raises HR and breathing; long holds slightly lower results soon after | SUPPORTED | Guide: "allows a gradual increase in heart rate and breathing". Review: "greater performance deficits with ≥60 s (-4.6%) than with <60 s (-1.1%)" | guide URL, https://pubmed.ncbi.nlm.nih.gov/26642915/ |
| c2 Warm-up = activity slower or lighter (walk before jog); cool-down the same at the end | SUPPORTED | "Commonly, the warm-up and cool-down involve doing an activity at a slower speed or lower intensity … walking briskly as a warm-up before jogging" | guide URL |
| c3 ≥60 s holds cut test results ~4.6% vs 1.1%; with active moves after, no clear effect | SUPPORTED | Review abstract (as above). "when these activities were included, no clear performance effect was observed" (21 Oct quote, same abstract) | review URL |
| c4 No clear effect on overall injuries; range gains <30 min; review still suggests stretching in a warm-up with active moves | SUPPORTED | "SS and PNF stretching had no clear effect on all-cause or overuse injuries". "ROM improvements, typically lasting <30 min". "stretching within a warm-up that includes additional poststretching dynamic activity is recommended" | review URL |

- Old MED (injury overreach) FIXED. Old "power" vs "performance" FIXED.
- **B5 [LOW]**: s2 teach gives a mechanism, "leaves the muscle a little slack, so it springs less", which is not in the cited abstract. Fix: "can make the muscle a little less springy for a few minutes" and mark it as a simplification, or drop it.

## cardio-talk-test
| Claim | Verdict | Quote | URL |
|---|---|---|---|
| c1 Talk not sing = moderate; few words = vigorous | SUPPORTED | Guide p.60: "a person doing moderate-intensity aerobic activity can talk, but not sing … cannot say more than a few words without pausing for a breath" | guide URL |
| c2 0–10 scale; moderate 5–6; vigorous 7–8 | SUPPORTED | "Moderate-intensity activity is a 5 or 6. Vigorous-intensity activity begins at a level of 7 or 8." (21 Oct quote, same PDF) | guide URL |
| c3 Less fit need more effort | SUPPORTED | "Less fit people generally require a higher level of effort than more fit people to do the same activity." | guide URL |
| c4 Inactive: start moderate, minutes and days first; warning signs mean rest | SUPPORTED | p.90: "First, increase the number of minutes per session (duration) and the number of days a week (frequency) of moderate-intensity activity. Later, if desired, increase the intensity." NIN p.87 warning signs | guide and DGI URLs |
| c5 Doctor before starting after long inactivity; new symptoms need a doctor | PARTLY | NIN p.87 backs the first sentence. The second is only in WHO 2020, which this concept does not cite: "Those who develop new symptoms when increasing their levels of activity should consult a healthcare provider." | DGI URL, https://pmc.ncbi.nlm.nih.gov/articles/PMC7719906/ |

**B6 [LOW]**: add `who2020` to c5's sourceRefs.

## showing-up
| Claim | Verdict | Quote | URL |
|---|---|---|---|
| c1 Some better than none; start small, build slowly; new symptoms see a doctor | SUPPORTED | "Some physical activity is better than none … Start with small amounts of physical activity and gradually increase". "Those who develop new symptoms … should consult a healthcare provider." | WHO 2020 URL |
| c2 Bouts of any length; 10-min rule dropped; stairs count | SUPPORTED | Guide p.23: "bouts of any length contribute to the health benefits … Even a brief episode of physical activity like climbing up a few flights of stairs counts." | guide URL |
| c3 One small thing, same time daily (after breakfast) becomes habit | SUPPORTED | "repeated a self-chosen health-promoting behaviour … in response to a single, once-daily cue … (such as, after breakfast)" | https://pmc.ncbi.nlm.nih.gov/articles/PMC3505409/ |
| c4 Missing the odd day did not seriously harm habit forming; small changes because setbacks discourage | SUPPORTED | "Missing the occasional opportunity to perform the behaviour did not seriously impair the habit formation process: automaticity gains soon resumed after one missed performance." "aim for small and manageable behaviour changes, because failure can be discouraging" | Gardner URL |

Old MED (dead `who` source) FIXED: removed. No new problems.

## food-labels
| Claim | Verdict | Note | URL |
|---|---|---|---|
| c1 Per 100 g/ml or per pack for single-serve; serving size and number of servings | SOURCE DEAD | 21 Oct quote, Reg 5(3)(b): "per 100g or 100ml or per single consumption pack … the number of servings in the package". Matches. | https://www.fssai.gov.in/upload/uploadfiles/files/Comp_Labelling%20Display_Version%20VII_03042025.pdf |
| c2 Most to least by weight or volume at time of making | SOURCE DEAD | 21 Oct quote, Reg 5(2)(b): "descending order of their composition by weight or volume, as the case may be at the time of its manufacture". Matches. | same |
| c3 Total and added sugars on separate lines | SOURCE DEAD | 21 Oct quote, Reg 5(3)(b)(ii)(B): "Carbohydrate (g) and Total Sugars (g), added sugars (g)". Matches. | same |
| c4 %RDA against an adult day with 50 g added sugar | SOURCE DEAD | 21 Oct quote: "calculated on the basis of 2000kcal energy … 50 g added sugar". A search summary (not opened) says the same. | same |
| c5 Stressed ingredient %; flavouring spices and serving-suggestion pictures exempt | SOURCE DEAD | 21 Oct quote, Reg 5(2)(g): exemptions include ingredients "used as flavouring agents" and "a pictorial representation of a serving suggestion". "Spices and seasonings" could not be checked. | same |

- Old MEDs (per-pack values; weight or volume) are fixed in wording.
- **B7 [MED]**: fix 5. The source could not be opened this session.

Body problem list: B7 MED, B1–B6 LOW. That is 7 problems, 1 to fix before release.

Injury and medical scan: no line promises a result.
- Heat, cardio and progressive overload all tell the learner to stop for warning signs.
- Heart, kidney and sugar conditions are told to ask a doctor.
- Heat confusion is treated as an emergency.

---

# How things work

## lift
| Claim | Verdict | Quote | URL |
|---|---|---|---|
| c1 Needs moving air; whether wing or air moves does not matter | SUPPORTED | "no fluid, no lift … There must be motion between the object and the fluid: no motion, no lift. It makes no difference whether the object moves through a static fluid, or the fluid moves past a static solid object." | https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/lift-3/ |
| c2 Wing turns air; air pushes back | SUPPORTED | "The flow is turned in one direction, and the lift is generated in the opposite direction, according to Newton's Third Law" | same |
| c3 Equal-transit idea wrong; thin wings with equal lengths lift | SUPPORTED | "they are thin curved plates … The distance on the upper and lower surface is exactly the same, yet these airfoils create plenty of lift. So the 'equal transit' theory must be incorrect" | same |
| c4 Lift ∝ speed²; twice the speed, four times the lift | SUPPORTED | "doubling the velocity will quadruple the lift and drag" | https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/velocity-effects/ |
| c5 In cruise lift = weight | SUPPORTED | "In cruise, the lift L is equal to the weight W and the thrust F is equal to the drag D." | https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/range-summary/ |

All old MEDs are FIXED: thin curved plates, "same tilt", the dropped glider, and the hand out of a bus window (now a card in front of a fan). No new problems.

## multirotor-turns
| Claim | Verdict | Quote | URL |
|---|---|---|---|
| c1 One side pushes harder to pitch or roll | SUPPORTED | "To pitch or roll the forces produced by the rotors need to be out of balance" | https://www.tugraz.at/fileadmin/user_upload/Institute/ICG/Documents/courses/cameradrones/2024/CD_Lecture_FlightMechanics.pdf |
| c2 Yaw: one pair faster, other slower, total steady | SUPPORTED | "Change rotor spin of pairs of rotors to keep the lift constant, but create imbalanced torque" | same |
| c3 Two CW, two CCW so twists cancel | SUPPORTED | "two counter-clockwise (CCW), and two clockwise (CW). This configuration is necessary so that our quadrotor will be stable in its yaw direction." | https://vnav.mit.edu/labs_2023/lab3/exercises.html |
| c4 Hover: total push = weight, equal shares | SUPPORTED | "A total thrust equal to the weight of the system stabilizes the system in hover." TU Graz: "Each rotor produces exactly the same thrust" | https://arxiv.org/pdf/1602.02622, TU Graz URL |
| c5 Every pitch or roll aims push sideways | SUPPORTED | "Every pitch or roll induces also a horizontal acceleration" | TU Graz URL |

Old MED (weak sources) FIXED. No new problems.

## battery-flight-time
| Claim | Verdict | Quote | URL |
|---|---|---|---|
| c1 Time = stored energy ÷ rate of use | SUPPORTED | Eq. (3): flight time = available energy / pelec | https://hiperlab.berkeley.edu/wp-content/uploads/2020/06/2020_FlyingBatteries.pdf |
| c2 Heavier battery needs more lift | SUPPORTED | "the individual propeller thrusts scale proportionally with the vehicle's total mass" | same |
| c3 Power ∝ thrust^1.5 | SUPPORTED | Eq. (2): pelec = kp (m0/(1−φ))^(3/2) | same |
| c4 Peak at about two thirds battery | SUPPORTED | "until a peak where the battery takes up two-thirds of the vehicle's mass" (recomputed: φ√(1−φ) peaks at 0.667) | same |
| c5 57 min vs 12 min | SUPPORTED | "achieve a flight time of 57 min as compared to its solo flight of 12 min" | same |

New problem **W1 [MED]**: fix 6. The s3 example misstates why the team used flying batteries.

## flight-sensors
| Claim | Verdict | Quote | URL |
|---|---|---|---|
| c1 Gyro = turn rate; accelerometer = speed change, used for tilt | SUPPORTED | "a gyroscope for body rates, an accelerometer for attitude" | https://docs.px4.io/main/en/config_mc/index |
| c2 GPS: position from signal travel time | SUPPORTED | "trilateration … the relationship between distance traveled, rate (speed) of travel, and amount of time" | https://www.gps.gov/trilateration |
| c3 Phones ~4.9 m open sky; worse near buildings and trees | SUPPORTED | "GPS-enabled smartphones are typically accurate to within a 4.9 m (16 ft.) radius under open sky … their accuracy worsens near buildings, bridges, and trees" | https://www.gps.gov/gps-accuracy |
| c4 Pressure falls with height (less air above); barometer tracks height; weather shifts pressure | PARTLY | "The number of molecules in the atmosphere decreases with height." PX4: "a barometer for altitude". No cited page says weather shifts pressure. | https://www.noaa.gov/jetstream/atmosphere/air-pressure |
| c5 Standard sea-level pressure ~1013 hPa | SUPPORTED | "The standard pressure at sea-level is 1013.25 in both millibars (mb) and hectopascal (hPa)." | NOAA URL |

- Old MED (gyro senses tilt) FIXED.
- **W3 [LOW]**: c4 is PARTLY. Cite a page that says pressure changes with weather, or soften to "readings can drift".

## birds-and-planes
| Claim | Verdict | Quote | URL |
|---|---|---|---|
| c1 Flaps give lift and forward push | SUPPORTED | "orients lift forward to accelerate and drag upward to support nearly half of their bodyweight" | https://www.nature.com/articles/s41467-019-13347-3.pdf |
| c2 Wings most lift; engines thrust | SUPPORTED | "Most of the lift is generated by the wings." "airplanes use a propulsion system to generate a force called thrust" | https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/four-forces-on-an-airplane/ |
| c3 Engine beats drag, not lift; gliders | SUPPORTED | "The wings are doing the lifting, not the engines. In fact, there are some aircraft, called gliders that have no engines at all" | same |
| c4 Takeoff: lift forward, drag up for ~half weight | SUPPORTED | quote at c1 | Nature URL |
| c5 Downstroke nearly all power; upstroke almost none | SUPPORTED | "the downstroke is responsible for nearly all of the aerodynamic power". "relatively inactive upstrokes cost almost no aerodynamic power" | same |
| c6 Cruise: thrust = drag, lift = weight | SUPPORTED | Range Summary quote above | range-summary URL |
| c7 Landing: lift backward, quarter of braking | SUPPORTED | "Upon landing, lift is oriented backward to contribute a quarter of the braking force" | Nature URL |

No problems.

## ceiling-fans
| Claim | Verdict | Quote | URL |
|---|---|---|---|
| c1 Fan moves room air with blades | SUPPORTED | page defines ceiling fans (Chromium/curl OK) | https://www.energy.gov/cmei/buildings/ceiling-fans |
| c2 No cold air; moves existing air | SUPPORTED | "fans do not generate cool air; they only move existing air" | https://www.energy.gov/indianenergy/articles/energy-saving-hacks-beat-summer-heat |
| c3 Drying sweat mainly | SUPPORTED | "making humans feel cooler by evaporating moisture from your skin". DOE guide: "Ceiling fans cool by creating a wind chill effect" | same, https://www.energy.gov/sites/default/files/2022-08/energy-saver-guide-2022.pdf |
| c5 Fans cool people, not rooms | SUPPORTED | "turn it off when you leave the room (fans cool people, not rooms)" | https://www.energy.gov/articles/top-11-things-you-didnt-know-about-saving-energy-home-summer-edition |
| c6 Winter: reverse to push warm air down | SUPPORTED | "In winter, reverse the fan to run clockwise and force warm air down from the ceiling." | DOE guide p.17 |
| c7 Humid air: sweat dries slower, less cooling | SUPPORTED | "When the atmospheric moisture content (i.e. relative humidity) is high, the rate of evaporation from the body decreases." | https://www.weather.gov/ama/heatindex |

- Item 13's figures (38 °C feels like 51 °C humid, 36 °C dry) match the NWS examples: 100 °F at 55% RH gives 124 °F, and at 15% RH gives 96 °F.
- Old MED FIXED. No problems.

## upi-path
| Claim | Verdict | Quote | URL |
|---|---|---|---|
| c1 UPI ID set by you, points to linked account | SUPPORTED | "send and receive money instantly using a Virtual Payment Address (VPA) set by the user itself" | https://www.rbi.org.in/scripts/PublicationsView.aspx?Id=20315 |
| c2 Moves money between banks; NPCI runs the network | SUPPORTED | "Launched in 2016 by the National Payments Corporation of India (NPCI)" | https://static.pib.gov.in/WriteReadData/specificdocs/documents/2024/dec/doc2024121462101.pdf |
| c3 24x7x365; payee paid at once; banks settle later a few times a day | SUPPORTED | "UPI is a mobile based, 365x24x7 'fast payment' system". "in a few systems like UPI and IMPS, while funds are credited to the beneficiary customer immediately, the inter-bank settlement is done later … four times a day" | RBI booklet URL |
| c4 Two checks: registered phone and approval, usually PIN | SUPPORTED | PIB: "Single Click 2-Factor Authentication". OC-226: "UPI PIN for transaction authentication (except UPI Lite and mandate execution)" | PIB URL, OC-226 URL |
| c5 Receiving needs no QR scan or PIN | SUPPORTED | RBI quote at upi-scams c3 | RBI press release URL |
| c6 No account number or IFSC needed | SUPPORTED | "eliminating the need to share sensitive details like account numbers or IFSC codes" | PIB URL |
| c7 16.58 billion in Oct 2024 (31 days) | SUPPORTED | "processing 16.58 billion financial transactions in a single month" (October 2024) | PIB URL |
| c8 Any UPI app, whichever bank | SUPPORTED | "Allows users to access multiple bank accounts using a single mobile application". Booklet: "over 40 non-bank third party applications" | PIB and RBI URLs |
| c9 Biometric approval up to ₹5,000 in some apps | SUPPORTED | OC-226: "On-Device biometric authentication … in lieu of UPI PIN … initially … up to Rs. 5,000" | OC-226 URL |
| c10 P2P collect ended 1 Oct 2025 | SUPPORTED | OC-220: "by 1st October 2025 UPI P2P Collect shall not be allowed to be processed in UPI" | https://www.npci.org.in/uploads/UPI_OC_No_220_FY_2025_26_Discontinuing_the_service_of_UPI_Collect_Request_for_Person_to_Person_P2_P_transactions_3fb30c60d7.pdf |

- Both old HIGHs (collect requests; PIN absolute) are FIXED. Old MED (item 12) is FIXED: ÷31, giving 535 million.
- **W2 [LOW]**: c3 says "a few times a day". The 2021 booklet says four. Search results (not opened; NPCI circulars blocked to curl) say NPCI moved UPI to 10 settlement cycles from Aug 2024, with 2 extra dispute cycles from 3 Nov 2025. Fix: "several times a day".

## phone-camera
| Claim | Verdict | Quote | URL |
|---|---|---|---|
| c1 Each spot turns light into a signal; more light, bigger signal | SUPPORTED | PDF p.31: QE "is a measure of the number of electrons generated by the incident photons of light that physically strike the imaging sensor. But these electrons, and specifically their currents, have to be amplified in order to be detected" | https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/a/Astrophotography_Guide.pdf |
| c2 Bayer 1R 2G 1B per 2×2 | SUPPORTED | "a 2x2 patch containing 1 red, 2 green and 1 blue-sensitive filters called a Bayer mask" | same |
| c3 Software de-mosaics full colour per pixel | SUPPORTED | "use the Bayer color grid information to figure out or 'de-mosaic' the data and estimate the full color value for each pixel" | same |
| c5 ISO multiplies signal, not sensitivity; grain | SUPPORTED | "Changing the ISO … multiplies the currents … by an electronic gain factor, but the sensor is not being made more sensitive to light … including … the electron noise as well" | same |
| c7 Fixed aperture; ISO and shutter set brightness | SUPPORTED | "Because the f/number of a smartphone is generally fixed at f/2, the exposure relation only involves ISO and exposure speed" | same |
| c8 Double time, halve ISO, same exposure | SUPPORTED | "if you double the value of one and halve the value of the other you get the same exposure" | same |

Old MED (CMOS "first made at JPL") FIXED: removed. No problems.

## sky-colours
| Claim | Verdict | Quote | URL |
|---|---|---|---|
| c1 Blue scatters more than red | SUPPORTED | "Colors with shorter wavelengths ― the blues and violets ― scatter more easily than colors with longer wavelengths" | https://science.nasa.gov/moon/eclipses/ |
| c2 Sunset: longer path, yellow-to-red reaches us | SUPPORTED | "only the yellow-to-red part of the spectrum reaches our eyes" | same |
| c3 Sunlight is a mix; prism spreads by wavelength | SUPPORTED | "the wavelengths separate into the colors of the rainbow because each color is a different wavelength" | https://science.nasa.gov/ems/09_visiblelight/ |
| c4 Violet ~380 nm, red ~700 nm | SUPPORTED | "Violet has the shortest wavelength, at around 380 nanometers, and red has the longest wavelength, at around 700 nanometers." | same |
| c5 Moon sky black (no air) | SUPPORTED | "the sky above them was black as night even in bright sunshine … Unlike the Moon, the Earth is surrounded by an atmosphere." | https://assets.science.nasa.gov/content/dam/science/hpd/heat/Electromagnetic__Spectrum_Lesson_Helio%20Teachers.pdf |
| c6 Cloud droplets scatter all colours alike | SUPPORTED | "The water droplets that make up the cloud are much larger than the molecules of the air and the scattering from them is almost independent of wavelength" | http://hyperphysics.phy-astr.gsu.edu/hbase/atmos/blusky.html |
| c7 Eclipse Moon red: light filtered through Earth's air | SUPPORTED | "any sunlight that's not blocked by our planet is filtered through a thick slice of Earth's atmosphere" | NASA eclipses URL |
| c8 Milk in water scatters blue | SUPPORTED | "mixing half a teaspoon of milk with a large (quart-size) jar of water … It should have a bluish tint" | NASA lesson PDF |
| c9 Clouds or pollution can redden sunsets | SUPPORTED | "Sometimes clouds or air pollution can make a sunset even more red because the particles … help scatter away the shorter wavelengths" | same |

- Old MEDs FIXED: the 1997 student page was removed, and NASA visible light and HyperPhysics were added.
- **W4 [LOW, source quality]**: c5, c8 and c9 rest only on `nasa-light`. That PDF reprints a "Visible Light Science Lesson" credited to homesciencetools.com, a science-kit retailer. Prefer a NASA or HyperPhysics page for the Moon's black sky and the milk demo.

## pressure-cooker
| Claim | Verdict | Quote | URL |
|---|---|---|---|
| c1 Boiling point rises with pressure, falls when lower | SUPPORTED | "boiling point decreases with decrease in pressure … boiling point increases with increase in pressure" | https://ncert.nic.in/textbook/pdf/keph203.pdf |
| c2 Cooker faster because pressure raises boiling point | SUPPORTED | "boiling point is increased inside a pressure cooker by increasing the pressure. Hence cooking is faster." | same |
| c3 Vents at about double pressure; ~121 °C | SUPPORTED | "a gauge pressure of 15 lb/in² amounts to about a doubling of absolute pressure … places the boiling point at about 121°C" | http://hyperphysics.phy-astr.gsu.edu/hbase/thermo/precook.html |
| c4 95 °C at 5,000 ft, 89 °C at 10,000 ft | SUPPORTED | Table 1: "5,000 ft. 203 °F … 10,000 ft. 193 °F" (95.0 °C and 89.4 °C) | https://extension.colostate.edu/resource/high-elevation-food-preparation-guide/ |
| c5 Boiling temperature stays constant | SUPPORTED | "Adding more heat to boiling water causes vaporisation, without increase in temperature." | NCERT URL |
| c6 Indian standard: free dead weight plus separate safety device | SUPPORTED (2006 text) | "Pressure regulation shall be effected by a free dead weight valve." Fusible plug clause 5.2 | https://archive.org/download/gov.in.is.2347.2006/is.2347.2006.pdf |
| c7 2006 standard: ≤2/3 full, ≤1/2 for swelling foods, froth can block | SUPPORTED | "Do not fill the unit over 2/3 full. When cooking foods that expand during cooking such as rice or dried vegetable, do not fill the unit over ½ full." "Food items which tend to foam, froth, sputter are likely to block the pressure release device." | same |
| c8 Steam burns usually worse | SUPPORTED | "This is why burns from steam are usually more serious than those from boiling water." | NCERT URL |

- The lid line ("open the lid only once the pressure has dropped") is backed by "Do not open the pressure cooker until the unit has cooled and internal pressure has been reduced" (IS 2347:2006 §10.5).
- Old MED is PARTLY fixed: c7 now names the 2006 standard. The school cooking club item is gone.
- **W5 [LOW]**: c6 still says "the Indian standard" while citing the 2006 text, which has been replaced by IS 2347:2017. Fix: "The 2006 Indian standard required…", or check the 2017 text.

How problem list: W1 MED, W2–W5 LOW. That is 5 problems, 1 to fix before release.

---

# Status of every HIGH and MEDIUM from the earlier reports

| Earlier report | Item | Status on ship-32 |
|---|---|---|
| money-health | inflation P1 (old CPI counts), HIGH | FIXED |
| money-health | loan-emi P1 (dead RBI URL), HIGH | FIXED |
| money-health | upi-scams P1 (P2P collect), HIGH | FIXED |
| money-health | exercise-heart P1, P2, P3 | FIXED |
| money-health | fad-diet P1 | FIXED |
| money-health | food-label P1 | FIXED |
| money-health | hydration P1 | FIXED |
| money-health | iron P1 (UK RDA) | FIXED |
| money-health | diversification P1 | FIXED |
| money-health | index-funds P1 (SPIVA blocked) | PARTLY (secondary source added; SPIVA still blocked) |
| money-health | inflation P2 (dead MoSPI PDF) | FIXED |
| money-health | rule-of-72 P1 (US 18%) | FIXED |
| money-health | upi-scams P2 (dead npci-faq), P3 (1930) | FIXED |
| body-how | upi-path-14 collect, HIGH | FIXED |
| body-how | upi-path PIN absolute, HIGH | FIXED in upi-path; **still present in Money upi-scams item 10 (M1)** |
| body-how | muscle-protein-rest NIN, HIGH | FIXED |
| body-how | upi-path-12 maths | FIXED |
| body-how | heat-hydration ×4 | FIXED |
| body-how | warmup-myths injury | FIXED |
| body-how | muscle-protein MPS wording, journal, item 14 | FIXED |
| body-how | sleep "one night" | FIXED |
| body-how | food-labels per-pack, weight or volume | FIXED in wording (source not re-openable, B7) |
| body-how | lift (plates, tilt, glider, safety) | FIXED |
| body-how | flight-sensors gyro tilt | FIXED |
| body-how | multirotor weak sources | FIXED |
| body-how | phone-camera CMOS | FIXED |
| body-how | sky-colours weak sources | PARTLY (W4) |
| body-how | pressure-cooker IS 2006 superseded | PARTLY (W5) |
| body-how | showing-up dead source | FIXED |
| body-how | ceiling-fans source and "only" | FIXED |
| body-how | progressive-overload scope | FIXED |

---

# Method

- Base: `git worktree add --no-track -b ideas/cj3-factcheck-four /tmp/cj3/job3 origin/ship-32`. HEAD is `dab36b3`.
- Content was dumped to text with the `factCheck` blocks removed, so the builder's own verdicts could not anchor this check. It was diffed by value against `fc35e7c`.
- Every source URL (89 distinct) was downloaded on 23 Oct 2026 with curl, using a browser user agent.
  - PDFs were converted with `pdftotext -layout`. HTML was converted to plain text.
  - Sites that blocked curl were opened in headless Chromium (playwright-core, executable at `/opt/pw-browsers/chromium-1243`).
  - PubMed records were read through NCBI E-utilities.
  - The two NPCI circulars are scanned images. WebFetch downloaded them; I rendered them with `pdftoppm` and read them visually.
- Every URL was also requested once with WebFetch. WebFetch got 403 on several investor.gov pages and the Bajaj page that curl opened fine. Those pages were judged on the curl text.
- TLS verification was never turned off.
- The machine was shared with other jobs. `uptime` at report time: load average 4.69, 5.01, 3.61 on 4 CPUs. No timings are reported.

Key code (re-runnable; the scratch copy is in `/tmp/cj3/job3-scratch/scripts/`):

```bash
# fetch.sh: download every source, save raw + text, log HTTP status
while IFS=$'\t' read -r n url refs; do
  code=$(curl -sS -L --max-time 60 -A "$UA" -o "$D/$n.raw" -w '%{http_code} %{content_type}' "$url")
  if file "$D/$n.raw" | grep -q PDF; then pdftotext -layout "$D/$n.raw" "$D/$n.txt"
  else python3 -I -c 'import sys,html,re; t=open(sys.argv[1],errors="replace").read();
t=re.sub(r"(?is)<(script|style|noscript)[^>]*>.*?</\1>"," ",t); t=html.unescape(re.sub(r"(?s)<[^>]+>"," ",t));
open(sys.argv[2],"w").write(re.sub(r"\s+"," ",t))' "$D/$n.raw" "$D/$n.txt"; fi
  printf '%s\t%s\t%s\n' "$n" "$code" "$url"
done < urls.tsv
# PubMed: curl "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=$PMID&rettype=abstract&retmode=text"
```

```python
# pg.py file.txt regex : search a pdftotext file page by page and print PDF page number + context
t=open(sys.argv[1],errors='replace').read().split('\f')
for i,p in enumerate(t,1):
    f=re.sub(r'\s+',' ',p)
    for m in re.finditer(sys.argv[2],f,re.I): print(f"[p{i}] ...{f[max(0,m.start()-250):m.end()+250]}...")
```

```python
# numbers.py (excerpt): every sum in the four topics; 68 of 68 OK
chk('EMI 10L 15% 120m', 1e6*0.0125*1.0125**120/(1.0125**120-1), 16133.50)
chk('battery optimum fraction', max((p/1000 for p in range(1,1000)), key=lambda f: f*sqrt(1-f)), 0.667)
chk('upi I12 16580/31', 16580/31, 535); chk('protein 65*0.83', 65*0.83, 54); chk('sugar I11', 40/50*2000, 1600)
```

The visual scale marks were also checked: each mark's `at` against its label on the min–max axis. All of them match. Range marks sit at their midpoints.

## Source status (23 Oct 2026)

| # | Source URL | Cited as (topic/concept/ref) | How opened on 23 Oct |
|---|---|---|---|
| 00 | https://static.pib.gov.in/WriteReadData/specificdocs/documents/2026/aug/doc2026812951801.pdf | money/inflation/cpi | curl 200 (pdf) |
| 01 | https://www.imf.org/en/publications/fandd/issues/series/back-to-basics/inflation | money/inflation/inflation | curl 403, Chromium 403; WebFetch OK (quotes via WebFetch) |
| 02 | https://www.rbi.org.in/Scripts/FS_Overview.aspx?fn=2752 | money/inflation/rbi | curl 200 (html) |
| 03 | https://www.investor.gov/introduction-investing/investing-basics/save-and-invest/small-savings-add-big-money | money/compounding/compound | curl 200 (html) |
| 04 | https://investor.sebi.gov.in/hindi/understanding_mf.html | money/compounding/sip | curl 200 (html) |
| 05 | https://www.investor.gov/introduction-investing | money/compounding/investing,money/rule-of-72/investing | curl 200 (html) |
| 06 | https://syndication.finra.org/content/financial-education-kids-creating-path-financial-fluency | money/compounding/finra,money/rule-of-72/rule72 | curl 200 (html) |
| 07 | https://www.bajajamc.com/knowledge-centre/articles/how-rupee-cost-averaging-works-in-sip-investments | money/compounding/sip-units | curl 200 (html) |
| 08 | https://www.sbicard.com/en/most-important-terms-and-conditions.page | money/rule-of-72/sbi-card | curl 200 (html) |
| 09 | https://www.investor.gov/additional-resources/general-resources/publications-research/info-sheets/beginners-guide-asset | money/risk-return/risk,money/diversification/risk | curl 200 (html) |
| 10 | https://www.investor.gov/introduction-investing/investing-basics/what-risk | money/risk-return/what-risk | curl 200 (html) |
| 11 | https://www.investor.gov/introduction-investing/investing-basics/save-and-invest/diversify-your-investments | money/diversification/diversify | curl 200 (html) |
| 12 | https://investor.sebi.gov.in/understandings_shares.html | money/shares/shares | curl 200 (html) |
| 13 | https://www.rbi.org.in/FinancialEducation/content/I%20Can%20Do_RBI.pdf | money/emergency-fund/rbi-emergency | curl OK on 2nd try (25.8 MB PDF), pdftotext |
| 14 | https://www.rbi.org.in/Scripts/FS_FAQs.aspx?Id=77&fn=2754 | money/loan-emi/rbi-loan | curl 200 (html) |
| 15 | https://investor.sebi.gov.in/index_mutual_fund.html | money/index-funds/sebi-index | curl TLS reset, 2nd try 200 |
| 16 | https://www.spglobal.com/spdji/en/spiva/article/spiva-india/ | money/index-funds/spiva-india | **SOURCE DEAD**: curl 403, Chromium 403, WebFetch 403 |
| 17 | https://www.nseindia.com/static/products-services/indices-nifty50-index | money/index-funds/nse-nifty | curl 200 (html) |
| 18 | https://www.investor.gov/introduction-investing/investing-basics/glossary/expense-ratio | money/index-funds/expense-ratio | curl 200 (html) |
| 19 | https://cafemutual.com/news/industry/35917-73-of-indian-large-cap-and-82-of-mid-and-small-cap-funds-have-underperformed-sp-india-benchmarks-over-a-10-year-period | money/index-funds/cafemutual-spiva | curl 200 (html) |
| 20 | https://www.npci.org.in/fraud-awareness | money/upi-scams/npci-fraud | curl 403; Chromium 200 |
| 21 | https://rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx?prid=53185 | money/upi-scams/rbi-fraud,how/upi-path/rbi-fraud | curl 200 (html) |
| 22 | https://www.businesstoday.in/amp/personal-finance/banking/story/npci-to-tighten-upi-rules-peer-to-peer-collect-feature-to-end-in-october-489244-2025-08-13 | money/upi-scams/collect-end | curl 200 (html) |
| 23 | https://sancharsaathi.gov.in/sfc/ | money/upi-scams/sanchar-chakshu,how/upi-path/sanchar-chakshu | curl 200 (html) |
| 24 | https://www.nin.res.in/dietaryguidelines/pdfjs/locale/DGI_2024.pdf | health/protein-foods/protein,health/free-sugars/icmr-sugar,health/hydration-cues/icmr-water,health/exercise-heart/icmr-activity,health/iron-and-anaemia/icmr-iron,health/food-label-reading/icmr-label,health/fad-diet-claims/variety,body/progressive-overload/nin,body/muscle-protein-rest/nin,body/cardio-talk-test/nin | curl 200 (pdf) |
| 25 | https://www.who.int/en/news-room/fact-sheets/detail/healthy-diet | health/free-sugars/sugar,health/fad-diet-claims/who-diet | curl 200 (html) |
| 26 | https://www.who.int/news/item/04-03-2015-who-calls-on-countries-to-reduce-sugars-intake-among-adults-and-children | health/free-sugars/who-sugars | curl 200 (html) |
| 27 | https://www.nhs.uk/live-well/eat-well/food-guidelines-and-food-labels/water-drinks-nutrition/ | health/hydration-cues/water | curl 200 (html) |
| 28 | https://www.nhs.uk/conditions/dehydration/ | health/hydration-cues/nhs-dehydration | curl 200 (html) |
| 29 | https://health.nih.gov/health-topics-a-z/healthy-sleep | health/sleep-recovery/sleep | curl 200 (html) |
| 30 | https://www.cdc.gov/sleep/about/index.html | health/sleep-recovery/cdc-sleep | curl 403; Chromium 200 |
| 31 | https://www.who.int/europe/publications/i/item/9789240014886 | health/exercise-heart/who-activity | curl 200 (html) |
| 32 | https://www.cdc.gov/physical-activity-basics/guidelines/adults.html | health/exercise-heart/cdc-adults | curl 403; Chromium 200 |
| 33 | https://www.cdc.gov/physical-activity-basics/measuring/index.html | health/exercise-heart/cdc-intensity | curl 403; Chromium 200 |
| 34 | https://www.who.int/news-room/fact-sheets/detail/physical-activity | health/exercise-heart/who-pa-facts | curl 200 (html) |
| 35 | https://www.nhs.uk/conditions/vitamins-and-minerals/iron/ | health/iron-and-anaemia/iron | curl 200 (html) |
| 36 | https://www.who.int/news-room/fact-sheets/detail/anaemia | health/iron-and-anaemia/anaemia | curl 200 (html) |
| 37 | https://medlineplus.gov/ency/article/002422.htm | health/iron-and-anaemia/medline-iron | curl 200 (html) |
| 38 | https://www.nin.res.in/rdabook/brief_note.pdf | health/iron-and-anaemia/icmr-rda | curl 200 (pdf) |
| 39 | https://www.nhs.uk/conditions/iron-deficiency-anaemia/ | health/iron-and-anaemia/nhs-ida | curl 200 (html) |
| 40 | https://www.nhs.uk/live-well/eat-well/food-guidelines-and-food-labels/how-to-read-food-labels/ | health/food-label-reading/label | curl 200 (html) |
| 41 | https://www.nccih.nih.gov/health/detoxes-and-cleanses-what-you-need-to-know | health/fad-diet-claims/nccih-detox | curl 200 (html) |
| 42 | https://pubmed.ncbi.nlm.nih.gov/41843416/ | body/progressive-overload/acsm | PubMed bot page; NCBI E-utilities efetch 200 |
| 43 | https://odphp.health.gov/sites/default/files/2019-09/Physical_Activity_Guidelines_2nd_edition.pdf | body/progressive-overload/guide,body/warmup-myths/guide,body/cardio-talk-test/guide,body/showing-up/guide | curl 200 (pdf) |
| 44 | https://pmc.ncbi.nlm.nih.gov/articles/PMC5477153/ | body/muscle-protein-rest/issn | curl 200 (html) |
| 45 | https://pubmed.ncbi.nlm.nih.gov/38716482/ | body/muscle-protein-rest/mps | PubMed 429; E-utilities 200 |
| 46 | https://www.nhlbi.nih.gov/health/sleep-deprivation/health-effects | body/sleep-recovery/sleep | curl 200 (html) |
| 47 | https://pubmed.ncbi.nlm.nih.gov/39006249/ | body/sleep-recovery/sport | PubMed bot page; E-utilities 200 |
| 48 | https://www.nhlbi.nih.gov/health/sleep/how-much-sleep | body/sleep-recovery/hours | curl 200 (html) |
| 49 | https://www.cdc.gov/heat-health/risk-factors/heat-and-athletes.html | body/heat-hydration/heat | curl 403; Chromium 200 |
| 50 | https://www.cdc.gov/extreme-heat/media/pdf/Heat_Related_Illness.pdf | body/heat-hydration/signs | curl 403, Chromium 403; WebFetch PDF 200, pdftotext |
| 51 | https://www.cdc.gov/yellow-book/hcp/environmental-hazards-risks/heat-and-cold-illness-in-travelers.html | body/heat-hydration/cdc-heat-rate | curl 403; Chromium 200 |
| 52 | https://pubmed.ncbi.nlm.nih.gov/26642915/ | body/warmup-myths/review | PubMed 429; E-utilities 200 |
| 53 | https://pmc.ncbi.nlm.nih.gov/articles/PMC7719906/ | body/showing-up/who2020 | curl 200 (html) |
| 54 | https://pmc.ncbi.nlm.nih.gov/articles/PMC3505409/ | body/showing-up/gardner | curl 200 (html) |
| 55 | https://www.fssai.gov.in/upload/uploadfiles/files/Comp_Labelling%20Display_Version%20VII_03042025.pdf | body/food-labels/fssai | **SOURCE DEAD**: curl and Chromium "self-signed certificate in chain" via proxy; WebFetch 503; Wayback reset |
| 56 | https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/lift-3/ | how/lift/lift | curl 200 (html) |
| 57 | https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/velocity-effects/ | how/lift/velocity | curl 200 (html) |
| 58 | https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/range-summary/ | how/lift/cruise,how/birds-and-planes/cruise | curl 200 (html) |
| 59 | https://arxiv.org/pdf/1602.02622 | how/multirotor-turns/zulu | curl 200 (pdf) |
| 60 | https://www.tugraz.at/fileadmin/user_upload/Institute/ICG/Documents/courses/cameradrones/2024/CD_Lecture_FlightMechanics.pdf | how/multirotor-turns/tug | curl 200 (pdf) |
| 61 | https://vnav.mit.edu/labs_2023/lab3/exercises.html | how/multirotor-turns/mit | curl 200 (html) |
| 62 | https://hiperlab.berkeley.edu/wp-content/uploads/2020/06/2020_FlyingBatteries.pdf | how/battery-flight-time/battery | curl 200 (pdf) |
| 63 | https://www.gps.gov/trilateration | how/flight-sensors/gps | curl 200 (html) |
| 64 | https://www.gps.gov/gps-accuracy | how/flight-sensors/gpsaccuracy | curl 200 (html) |
| 65 | https://www.weather.gov/asos/BarometricPressureSensor.html | how/flight-sensors/barometer | curl 200 (html) |
| 66 | https://docs.px4.io/main/en/config_mc/index | how/flight-sensors/px4 | curl 200 (html) |
| 67 | https://docs.px4.io/main/en/sensor/ | how/flight-sensors/px4-sensors | curl 200 (html) |
| 68 | https://www.noaa.gov/jetstream/atmosphere/air-pressure | how/flight-sensors/noaa-pressure | curl 200 (html) |
| 69 | https://www.nature.com/articles/s41467-019-13347-3.pdf | how/birds-and-planes/bird | curl 200 (pdf) |
| 70 | https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/four-forces-on-an-airplane/ | how/birds-and-planes/nasa | curl 200 (html) |
| 71 | https://www.energy.gov/cmei/buildings/ceiling-fans | how/ceiling-fans/fan | curl 200 (html) |
| 72 | https://www.energy.gov/indianenergy/articles/energy-saving-hacks-beat-summer-heat | how/ceiling-fans/cooling | curl 200 (html) |
| 73 | https://www.energy.gov/sites/default/files/2022-08/energy-saver-guide-2022.pdf | how/ceiling-fans/doe-guide | curl 200 (pdf) |
| 74 | https://www.energy.gov/articles/top-11-things-you-didnt-know-about-saving-energy-home-summer-edition | how/ceiling-fans/doe-summer | curl 200 (html) |
| 75 | https://www.weather.gov/ama/heatindex | how/ceiling-fans/heatindex | curl 200 (html) |
| 76 | https://www.rbi.org.in/scripts/PublicationsView.aspx?Id=20315 | how/upi-path/rbi-booklet | curl 200 (html) |
| 77 | https://static.pib.gov.in/WriteReadData/specificdocs/documents/2024/dec/doc2024121462101.pdf | how/upi-path/pib-upi | curl 200 (pdf) |
| 78 | https://www.npci.org.in/uploads/UPI_OC_No_220_FY_2025_26_Discontinuing_the_service_of_UPI_Collect_Request_for_Person_to_Person_P2_P_transactions_3fb30c60d7.pdf | how/upi-path/npci-oc220 | curl/Chromium 403 (Akamai); WebFetch PDF 200, scanned image read visually |
| 79 | https://www.npci.org.in/uploads/UPI_OC_No_226_FY_2025_26_Introduction_of_Additional_Authentication_methods_in_UPI_42c3693399.pdf | how/upi-path/npci-oc226 | curl/Chromium 403 (Akamai); WebFetch PDF 200, scanned image read visually |
| 80 | https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/a/Astrophotography_Guide.pdf | how/phone-camera/nasa-phone | curl 200 (pdf) |
| 81 | https://science.nasa.gov/moon/eclipses/ | how/sky-colours/nasa-sky | curl 200 (html) |
| 82 | https://science.nasa.gov/ems/09_visiblelight/ | how/sky-colours/nasa-vis | curl 200 (html) |
| 83 | http://hyperphysics.phy-astr.gsu.edu/hbase/atmos/blusky.html | how/sky-colours/hp-blusky | curl 200 (html) |
| 84 | https://assets.science.nasa.gov/content/dam/science/hpd/heat/Electromagnetic__Spectrum_Lesson_Helio%20Teachers.pdf | how/sky-colours/nasa-light | curl 200 (pdf) |
| 85 | http://hyperphysics.phy-astr.gsu.edu/hbase/thermo/precook.html | how/pressure-cooker/gsu-pressure | curl 200 (html) |
| 86 | https://ncert.nic.in/textbook/pdf/keph203.pdf | how/pressure-cooker/ncert-thermal | curl 200 (pdf) |
| 87 | https://extension.colostate.edu/resource/high-elevation-food-preparation-guide/ | how/pressure-cooker/csu-altitude | curl 200 (html) |
| 88 | https://archive.org/download/gov.in.is.2347.2006/is.2347.2006.pdf | how/pressure-cooker/bis-cooker | curl 200 (pdf) |

Also opened for checking (not cited by the content):
- RBI customer-liability circular: https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=11040&Mode=0 (curl 200).
- SPIVA India Year-End 2025 PDF: https://www.spglobal.com/spdji/en/documents/spiva/spiva-india-scorecard-year-end-2025.pdf (403).
- Search only, not opened: NPCI UPI settlement cycles (OC 197; NPCI/2025-26/UPI/222). The FSSAI %RDA reference values.

## All problems in one list

| Id | Sev | Topic / concept / where | One-line fix |
|---|---|---|---|
| M1 | MED | money / upi-scams / item 10 b feedback | "usually with your UPI PIN"; cite OC-226 |
| M2 | MED | money / upi-scams / item 15 b feedback | RBI zero liability if reported within 3 working days |
| H1 | MED | health / free-sugars / s2 + rule | lead with ICMR-NIN under 5% (25–30 g) |
| H2 | MED | health / iron / s3 teach, c8, item 13 | allow IFA a doctor or health worker gives, as in pregnancy |
| B7 | MED | body / food-labels / fssai source | human re-opens the FSSAI PDF once |
| W1 | MED | how / battery / s3 example spot | best battery size caps it near 26 min |
| M3 | LOW | money / index-funds / spiva-india | point to the report PDF; human confirm |
| M4 | LOW | money / risk-return / c3, s2 teach | "a company or a government" |
| M5 | LOW | money / rule-of-72 / c2 | add a source for the steady-rate assumption |
| M6 | LOW | money / diversification / s3 guided c fb | drop the inflation line |
| M7 | LOW | money / emergency-fund / c2 | PARTLY, as on 21 Oct |
| M8 | LOW | money / compounding / sip-units | prefer AMFI or SEBI over a fund-house page |
| M9 | LOW | money / inflation / c3 | "every week", villages and online |
| M10 | LOW | money / shares / s3 guided b fb | drop "a loss year makes a cut more likely" |
| H3 | LOW | health / protein / s3 visual "60 to 70 g" | not in source; use 55–65 g sample diets |
| H4 | LOW | health / hydration / c5 "hot days" | drop "on hot days" |
| H5 | LOW | health / hydration / item 13 | unsourced but safe |
| H6 | LOW | health / sleep / item 10 c fb | "deep sleep boosts the hormones that drive repair" |
| H7 | LOW | health / exercise-heart / s3 teach | add: chest pain that does not settle needs help |
| H8 | LOW | health / fad-diet / item 10 a fb | "a poor source of iron" |
| H9 | LOW | health / fad-diet / s3 takeaway | "is called safe" |
| B1 | LOW | body / progressive-overload / item 12 stem | "same weights, sets and reps" |
| B2 | LOW | body / progressive-overload / s2 teach, s1 hook c | "often a sign" |
| B3 | LOW | body / muscle-protein-rest / s3 guided b fb | soften the rest-day reason |
| B4 | LOW | body / sleep-recovery / rule, m1, items 9–10 | match NHLBI wording |
| B5 | LOW | body / warmup-myths / s2 teach | drop or flag the "slack" mechanism |
| B6 | LOW | body / cardio-talk-test / c5 | add who2020 ref |
| W2 | LOW | how / upi-path / c3 | "several times a day" |
| W3 | LOW | how / flight-sensors / c4 | source the weather drift or soften |
| W4 | LOW | how / sky-colours / nasa-light | stronger source for c5, c8, c9 |
| W5 | LOW | how / pressure-cooker / c6 | "the 2006 standard", or check IS 2347:2017 |
