# Topic pack editorial review — 2026-10-17

Checker: `codex-factcheck-2026-10-17`  
Scope: 12 hand-written concepts, 96 items. Each concept has difficulty counts **1: 2, 2: 4, 3: 2**. Item verdicts and claim verdicts are recorded in each pack. Every option and feedback line carries the concept's source references. Hypothetical amounts and scenarios were checked for internal logic as well as the sourced mechanism.

## Money and markets

| Concept | Difficulty 1 / 2 / 3 | Sources checked |
| --- | --- | --- |
| Emergency fund | 2 / 4 / 2 | [RBI, *I Can Do: Financial Planning*](https://www.rbi.org.in/FinancialEducation/content/I%20Can%20Do_RBI.pdf) |
| EMI and loan cost | 2 / 4 / 2 | [RBI, housing-loan FAQ on reducing balance and amortization](https://systemhealth.rbi.org.in/Scripts/FS_FAQs.aspx_Id%3D77%26fn%3D2754.html) |
| Index funds and stock picking | 2 / 4 / 2 | [SEBI Investor, index mutual funds](https://investor.sebi.gov.in/index_mutual_fund.html); [S&P Dow Jones Indices, SPIVA India Year-End 2025](https://www.spglobal.com/spdji/en/spiva/article/spiva-india/) |
| UPI scams and social engineering | 2 / 4 / 2 | [NPCI, fraud awareness](https://www.npci.org.in/fraud-awareness); [NPCI, UPI FAQ](https://www.npci.org.in/what-we-do/upi/faqs) |

## Psychology

| Concept | Difficulty 1 / 2 / 3 | Sources checked |
| --- | --- | --- |
| Sleep and memory | 2 / 4 / 2 | [Rasch and Born, sleep and memory review](https://pmc.ncbi.nlm.nih.gov/articles/PMC3768102/); [Wamsley, waking-rest review](https://pmc.ncbi.nlm.nih.gov/articles/PMC7024394/) |
| Variable rewards | 2 / 4 / 2 | [APA, reinforcement lesson](https://www.apa.org/ed/precollege/topss/lessons/learning-lesson-plan.pdf); [Lindström et al., social-media reward study](https://pmc.ncbi.nlm.nih.gov/articles/PMC7910435/); [Montag et al., scrolling review](https://pmc.ncbi.nlm.nih.gov/articles/PMC6679162/) |
| If-then plans | 2 / 4 / 2 | [Gollwitzer and Oettingen, University of Konstanz](https://www.socmot.uni-konstanz.de/publications/implementation-intentions); [Parks-Stamm et al., cue-action study](https://doi.org/10.1521/SOCO.2007.25.2.248) |
| Spotlight effect | 2 / 4 / 2 | [Gilovich et al., original paper](https://pubmed.ncbi.nlm.nih.gov/10707330/); [full paper, shirt-study results](https://www.researchgate.net/profile/Thomas-Gilovich/publication/12609065_The_Spotlight_Effect_in_Social_Judgment_An_Egocentric_Bias_in_Estimates_of_the_Salience_of_One%27s_Own_Actions_and_Appearance/links/543680600cf2bf1f1f2bd452/The-Spotlight-Effect-in-Social-Judgment-An-Egocentric-Bias-in-Estimates-of-the-Salience-of-Ones-Own-Actions-and-Appearance.pdf) |

## How things work

| Concept | Difficulty 1 / 2 / 3 | Sources checked |
| --- | --- | --- |
| How UPI moves money | 2 / 4 / 2 | [NPCI, UPI FAQ](https://www.npci.org.in/what-we-do/upi/faqs); [NPCI, BHIM](https://www.npci.org.in/product/bhim); [NPCI, UPI booklet](https://www.npci.org.in/PDF/npci/upi/Product-Booklet.pdf) |
| Phone camera | 2 / 4 / 2 | [NASA, CMOS sensor history](https://science.nasa.gov/science-research/science-enabling-technology/technology-highlights/technology-originally-developed-for-space-missions-now-integral-to-everyday-life/); [NASA, smartphone camera guide](https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/a/Astrophotography_Guide.pdf) |
| Blue sky and red sunsets | 2 / 4 / 2 | [NASA, atmospheric scattering](https://science.nasa.gov/moon/eclipses/); [NASA, visible-light lesson](https://assets.science.nasa.gov/content/dam/science/hpd/heat/Electromagnetic__Spectrum_Lesson_Helio%20Teachers.pdf) |
| Pressure cooker | 2 / 4 / 2 | [USDA, high-altitude cooking](https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/high-altitude-cooking); [Georgia State University, pressure cooker](https://www.hyperphysics.gsu.edu/hbase/thermo/precook.html) |

## Full concept for owner review: UPI scams and social engineering

**Hook:** A fake prize message may ask for a UPI PIN to make a payment look like a receipt.  
**Rule:** A scam story can steer a person to approve a payment. A UPI PIN lets money leave an account.  
**Claims:** NPCI warns that scanning a QR and entering a PIN makes a payment, not a prize receipt. A collect request asks the payer to approve money leaving an account.  
**Misconceptions:** “PIN to receive” — a receipt needs no debit approval. “Official tone proves safety” — a polished message can still tell a false story.  
**Sources:** NPCI fraud awareness and UPI FAQ, linked above.  
**Quest:** In a made-up payment screen, identify the payer and the direction of money.

1. **upi-scams-1 — predict, level 2.** A hostel student is told to scan a QR and enter a UPI PIN to get a refund. What could that action do?
   - **a (correct):** Approve money going out. **Feedback:** NPCI says a QR scan with a PIN is for paying, not receiving a refund.
   - **b:** Pull the refund in for free. **Feedback:** The PIN can let money leave, even if the note says refund.
2. **upi-scams-2 — scenario, level 2.** During a college fest, an unknown caller says a prize needs a collect-request approval. What is being requested?
   - **a (correct):** Permission for a payment. **Feedback:** The word collect can hide that the person approving it is the payer.
   - **b:** A free deposit needing no approval. **Feedback:** The request asks the account holder to authorise a transfer out.
3. **upi-scams-3 — estimate, level 2.** A fake cashback link asks for a UPI PIN only to receive money. How many PIN approvals are needed for a normal receipt?
   - **a (correct):** Zero PIN approvals. **Feedback:** Receiving money does not need the receiver to approve a debit with a PIN.
   - **b:** One PIN approval. **Feedback:** A PIN prompt changes the action into approval of a payment, not simple receipt.
   - **Scored answer:** 0 PIN approvals (range −0.5 to 0.5).
4. **upi-scams-4 — choose, level 1.** What does a UPI PIN mainly authorise?
   - **a (correct):** A payment from an account. **Feedback:** The PIN is entered when the payer approves a bank transaction.
   - **b:** A stranger’s prize message. **Feedback:** A message can claim a reward, but it cannot change what a PIN approval means.
5. **upi-scams-5 — why, level 3.** Why can a polished message from a supposed bank worker still mislead someone?
   - **a (correct):** The story can press for a real payment approval. **Feedback:** The app can work well while a false story sways the person.
   - **b:** A formal logo changes how UPI works. **Feedback:** A bank logo does not turn a payment into cash coming in.
6. **upi-scams-6 — fill-the-step, level 1.** In a collect request, the person who approves it is the ___.
   - **a (correct):** Payer. **Feedback:** When that person says yes, money can leave the bank account.
   - **b:** Prize receiver by default. **Feedback:** The label on the message does not decide the direction of the bank transfer.
7. **upi-scams-7 — true-not-quite, level 3.** A classmate says every scam needs a broken app. What is the missing route?
   - **a (correct):** A person can be tricked into approving a real payment. **Feedback:** The bank may send the money as asked. The story can still be false.
   - **b:** Fraud only happens when the switch stops working. **Feedback:** NPCI describes fraud that uses messages, links and fear to steer users.
8. **upi-scams-8 — explain-it-back, level 2.** Which line best sums up a trick with a UPI payment?
   - **a (correct):** A false story steers a real payment approval. **Feedback:** The attacker targets a choice on the screen rather than changing the PIN’s job.
   - **b:** The PIN becomes a receipt code. **Feedback:** The PIN lets money leave. A false label does not change that.

## Claim limits and changes

- Dropped the claim that every feed runs an exact slot-machine schedule. The research supports intermittent rewards and reward learning, but not one measured schedule for every app.
- Dropped the claim that only sleep can strengthen memory. Quiet waking rest can also aid retention.
- Kept the spotlight shirt result tied to the original paper: wearers estimated about 46% of observers would identify the image; about 23% did. This is a study result, not a rule for every person.
