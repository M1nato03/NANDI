# Fact-check: "Talk to anyone" draft (cj6, Job 1)

> Review of `content-drafts/topic.talk-to-anyone.json` on `ideas/spec-21-useful-now` (version 0.1.0, "Not fact-checked").
> Sources come from `docs/reviews/cj4-pilot-outline.md` on `ideas/cj4-pilot-outline`.
> Date: 24 Oct 2026. Branch: `ideas/cj6-factcheck-talk`. Nothing in `content/` or app code was changed.

## Summary

- **Count matches the brief:** 1 module, **4 concepts, 12 steps, 24 items** (6 per concept). The draft also has 29 claims,
  10 misconceptions, 4 quests, 12 guided tries, 12 Show me examples and 142 feedback lines. Every one has a verdict below.
- **No line says the studies tested Indian settings.** But no line tells the learner that the samples were US, UK or Israeli.
  The pilot outline asked editors to say so. Add the setting line in §3.
- **Main problems (fix before any pack work):**
  1. **The Brooks "asked personally" finding is misread** (W). In the paper the person *being asked* rates the asker
     higher. It does not mean "ask one person, not the group". This breaks one claim, one Show me part, one feedback line
     and one item.
  2. **Two Show me examples have two right answers** (W). In `follow-ups-s1`, part 2 is also a follow-up. In `listening-s2`,
     part 4 is also recall from memory.
  3. **Internal text leaks into learner copy** (W): "The outline does not give a finding…", "ties back to idea 4", the
     claim text "The four-part recipe.", and a Show me feedback that names Neha and Rohan when neither appears in it.
  4. **Effects are stated as reasons.** Many teach cards add "because…" or "it works because…" with a reason the paper
     does not give (P). Huang's reason is *responsiveness*, not "room to add".
  5. **The 4 third steps (`-s3`) are thin filler.** Each has the same Show me feedback ("This part shows the move. The other
     lines give the chat its shape."), a 2-option hook and a silly distractor. Three "estimate" items test counting, not the
     research.
  6. **Untested advice is labelled as research.** Exit lines (Mastroianni), "share back" (Huang), "look it up first"
     (Brooks) and "group vs one-to-one" (Liu) go past the papers. Item `disagree-and-end-4` already says this well; use
     the same honesty elsewhere.
- **Tally** (all units in §5–§9): 293 verdicts. **S 183 · P 81 · W 19 · R 10.**

## 1. How this was checked

| Step | What I did |
|---|---|
| Inputs | `git show` of both files. Flattened the JSON and read every text field. |
| Counts | Script over `body.modules[].concepts[]`. 4 concepts × 3 steps × 6 items. |
| Sources | Opened every cited paper myself (table in §2). Quoted only what I read. |
| Verdicts | **S** = supported, quote in §2. **P** = goes past the paper (says how). **W** = wrong. **R** = wording risk (guilt, manipulation, stereotype, advice). One verdict per unit. Plain scene lines with no claim are judged as part of their Show me or guided try. |
| Rewrites | Exact text for every P, W and R where a fix is needed. "Keep" = accepted as practice framing with no change. |

## 2. Sources opened, and the quotes used

Every quote below was copied from the page named. "Q" numbers are used in the verdict tables.

| Source | Where I read it | Opened? |
|---|---|---|
| Huang, Yeomans, Brooks, Minson & Gino 2017, *JPSP* 113(3) 430-452 | Full text PDF, https://gwern.net/doc/psychology/novelty/2017-huang.pdf (title, volume, pages checked on Crossref https://api.crossref.org/works/10.1037/pspi0000097) | Yes, full text |
| Kardas, Kumar & Epley 2022, *JPSP* 122(3) 367-398 | PubMed abstract, https://pubmed.ncbi.nlm.nih.gov/34591541/ (via NCBI E-utilities) | Abstract only. APA press release (https://www.apa.org/news/press/releases/2021/09/deep-conversations-strangers) returned an empty page. No open full text found. |
| Weger, Castle Bell, Minei & Robinson 2014, *Int. J. Listening* 28(1) | Full text PDF, https://fellow.app/wp-content/uploads/2022/01/The-Relative-Effectiveness-of-Active-Listening-in-Initial-Interactions-1.pdf | Yes, full text |
| Weger, Castle & Emmett 2010, *Int. J. Listening* 24(1) 34-49 | Abstract, https://stars.library.ucf.edu/scopus2010/1477 | Abstract only |
| Itzchakov, DeMarree, Kluger & Turjeman-Levi 2018, *PSPB* 44(5) 762-778 | PubMed abstract, https://pubmed.ncbi.nlm.nih.gov/29347879/ | Abstract only |
| Morris & Fritz 2000, *J. Exp. Psych.: Applied* | Abstract, https://eprints.lancs.ac.uk/id/eprint/18865 | Abstract only |
| Morris & Fritz 2002, *Memory* 10(4) 259-66 | PubMed abstract, https://pubmed.ncbi.nlm.nih.gov/12097210/ | Abstract only |
| Yeomans, Minson, Collins, Chen & Gino 2020, *OBHDP* | Accepted manuscript PDF, https://spiral.imperial.ac.uk/handle/10044/1/85402 (file `receptive_full.pdf`) | Yes, full text |
| Mastroianni, Gilbert, Cooney & Wilson 2021, *PNAS* 118(10) | Full text, https://pmc.ncbi.nlm.nih.gov/articles/PMC7958231/ | Yes, full text. Europe PMC XML returned HTTP 500; PMC page worked. |
| Boothby, Cooney, Sandstrom & Clark 2018, *Psych. Science* 29(11) | PubMed abstract, https://pubmed.ncbi.nlm.nih.gov/30183512/ | Abstract only |
| Brooks, Gino & Schweitzer 2015, *Mgmt Science* 61(6) 1421-1435 | Crossref abstract, https://api.crossref.org/works/10.1287/mnsc.2014.2054 | Abstract only. INFORMS page and HBS page returned 403. No open PDF found. |
| Liu, Rim, Min & Min 2023, *JPSP* 124(4) 754-771 | PubMed abstract, https://pubmed.ncbi.nlm.nih.gov/35816566/ | Abstract only |
| Fischer et al. 2011, *Psych. Bulletin* 137(4) 517-37 | PubMed abstract, https://pubmed.ncbi.nlm.nih.gov/21534650/ | Abstract only |

Not used by the draft, so not checked further: Linares & Sellier 2021 (I did open its abstract,
https://pubmed.ncbi.nlm.nih.gov/34106931/, and the draft makes no phone claim), Zhao & Epley 2021.

### Quote bank

| Q | Quote (exact) | Source |
|---|---|---|
| Q1 | "people who ask more questions, particularly follow-up questions, are better liked by their conversation partners." | Huang, abstract |
| Q2 | "We define follow-up questions as questions that encourage the partner to elaborate on the content of their prior conversational turn" | Huang |
| Q3 | "people do not anticipate that question-asking increases interpersonal liking." | Huang, abstract |
| Q4 | "they are perceived as higher in responsiveness, an interpersonal construct that captures listening, understanding, validation, and care" … "responsiveness explains the effect of question-asking on liking." | Huang, abstract |
| Q5 | "it may be the case that one can ask too many questions … When one asks too many questions without reciprocating self-disclosure, liking may decrease." | Huang, Limitations (not tested) |
| Q6 | "In our data, third-party observers preferred question-recipients, perhaps because those who answered many questions seemed like more complete, interesting people." | Huang, Limitations |
| Q7 | "switch questions were those that asked about a new topic, one that was unrelated to what the partner had already discussed." | Huang |
| Q8 | "Follow-up questions were the most common, comprising 40.51% of all questions" | Huang, coded chats from Studies 1 and 2A |
| Q9 | "We recruited 430 participants (215 dyads) to participate in a 'Chat Study' in a behavioral lab." … "We recruited participants from Amazon's Mechanical Turk (MTurk)" … "You will chat for 15 minutes." | Huang, Methods |
| Q10 | "conversations between strangers felt less awkward, and created more connectedness and happiness, than the participants themselves expected" | Kardas, abstract |
| Q11 | "Participants were especially prone to overestimate how awkward deep conversations would be compared with shallow conversations" | Kardas, abstract |
| Q12 | "participants expected others to care less about their disclosures in conversation than others actually did" | Kardas, abstract |
| Q13 | "people systematically underestimate how caring and interested distant strangers are in one's own intimate revelations" … "the deep and meaningful conversations with strangers" | Kardas, abstract |
| Q14 | "more calibrated expectations encourage deeper conversation" | Kardas, abstract |
| Q15 | "Active listening involves restating a paraphrased version of the speaker's message, asking questions when appropriate, and maintaining moderate to high nonverbal conversational involvement." | Weger 2014 |
| Q16 | "participants who received active listening responses felt more understood than participants who received either advice or simple acknowledgements." | Weger 2014, abstract |
| Q17 | "although the effect sizes for these differences were small. Conversational satisfaction and social attractiveness did not differ between participants receiving active listening responses and participants receiving advice, however." | Weger 2014, abstract |
| Q18 | "The simple acknowledgement condition consisted of only back channel cues such as head nods, and short verbal statements such as 'I see,' 'OK,' 'That makes sense,'" | Weger 2014, Method |
| Q19 | Table 3, feeling understood (FUMS) means: simple acknowledgement 11.79, advice 14.48, active listening 17.27; all three differ (Scheffé, p < .05). | Weger 2014, Table 3 |
| Q20 | "The active listening condition included paraphrasing the participant's message and, when appropriate, asking the participant to elaborate on what they said" … "this study did not vary nonverbal immediacy." | Weger 2014 |
| Q21 | "Participants included 115 undergraduates … at a large southeastern university" … "Our sample consisted of mostly young, White, female college students." Topics: "Please discuss your plans for this weekend," and "What has been your biggest disappointment with (university name)…" | Weger 2014 |
| Q22 | "message paraphrases were associated with the social attractiveness of the listener but were not associated with participants' conversational satisfaction or perceptions of feeling understood by the listener." (peer interviews on "comprehensive examinations") | Weger 2010, abstract |
| Q23 | "We predicted that high-quality (i.e., empathic, attentive, and nonjudgmental) listening reduces speakers' social anxiety" … "We obtained consistent support for our hypotheses across five experiments" | Itzchakov, abstract |
| Q24 | "In medium-sized groups such as classes" … "compared 2 versions of the name game with a widely used introductory method--pairwise introductions--and found that the name game participants were much better at remembering one another's names after 30 min, 2 weeks, and 11 months." | Morris & Fritz 2000, abstract |
| Q25 | "comparing 2 versions of the name game with a procedure that was matched for number of repetitions and time spent on the task. Again, the name games were superior." | Morris & Fritz 2000, abstract |
| Q26 | "a no-retrieval condition that mimicked the name game in every way except for the retrieval of the names" … "The benefit of a few refresher rounds of the game after 2 weeks was also examined. The reversed name game was superior to the original name game and the refresher rounds benefited all groups." | Morris & Fritz 2002, abstract |
| Q27 | "the use of language to communicate one's willingness to thoughtfully engage with opposing views." … "conversational receptiveness is reliably measurable" | Yeomans, abstract |
| Q28 | "positive statements, rather than negations; explicit acknowledgement of understanding; finding points of agreement; and hedging to soften claims." | Yeomans, Study 4 |
| Q29 | "writers who follow the recipe are seen as more desirable partners for future collaboration and their messages are seen as more persuasive" … "responses from the recipe condition were rated as more persuasive by ideological opponents than responses from the control condition" | Yeomans, abstract and Study 4B |
| Q30 | "Wikipedia editors who write more receptive posts are less prone to receiving personal attacks from disagreeing editors (Study 3)." | Yeomans, abstract |
| Q31 | "specific features were more common in unreceptive responses, included negations (e.g., 'no,' 'wrong')" | Yeomans, Study 1 |
| Q32 | "explicit agreement (e.g., 'I agree,' 'you're right')—even though the responders disagreed with the writers by design." | Yeomans, Study 1 |
| Q33 | "following the recipe is difficult, and they would be less likely to communicate in a receptive manner in the future." | Yeomans, Study 4 |
| Q34 | "We recruited participants from mTurk for a study on 'Political Issues and Discussions'" (topics: "sexual assault on campus and police relations") | Yeomans, Study 4A |
| Q35 | "In two studies of 932 conversations … (who was an intimate in Study 1 and a stranger in Study 2) … conversations almost never ended when both conversants wanted them to and rarely ended when even one conversant wanted them to" … "Conversants had little idea when their partners wanted to end" | Mastroianni, abstract |
| Q36 | "In 46.83% of the conversations, both conversants wanted the conversation to end before it did, and in 9.52% of the conversations, both participants wanted the conversation to end after it did." | Mastroianni, Study 2 |
| Q37 | "coordination problems are readily solved when players can communicate honestly ( 21 ), but honestly communicating a desire to terminate a conversation may itself be a social rupture. As such, conversants may mask such desires rather than communicating them" | Mastroianni, intro |
| Q38 | "Two hundred and fifty-two participants (157 female, 92 male, and 3 'other,' M age = 23.10 y) reported to our laboratory for a 1-h experiment, were paired with a stranger" (Harvard ethics approval) … "Future research will determine whether these results generalize to a wider range of human beings and social situations." | Mastroianni, Study 2 and Discussion |
| Q39 | "Participants had very little idea what their partners really wanted." | Mastroianni, Study 2 |
| Q40 | "people systematically underestimated how much their conversation partners liked them and enjoyed their company" … "as first-year college students got to know their dorm mates" | Boothby, abstract |
| Q41 | "We find that people are reticent to seek advice for fear of appearing incompetent. This fear, however, is misplaced. We demonstrate that individuals perceive those who seek advice as more competent than those who do not." | Brooks, abstract |
| Q42 | "This effect is moderated by task difficulty, advisor egocentrism, and advisor expertise. Individuals perceive those who seek advice as more competent when the task is difficult rather than when it is easy, when people seek advice from them personally rather than when they seek advice from others and when people seek advice from experts rather than from nonexperts or not at all." | Brooks, abstract |
| Q43 | "whether simply to check-in on how others are doing with brief messages or to show that they are thinking of others by sending small gifts" … "we document a robust underestimation of how much other people appreciate being reached out to." | Liu, abstract |
| Q44 | "it is magnified when the reach-out context is more surprising: when it occurs within a surprising (vs. unsurprising) context for the recipient and when it occurs between more socially distant (vs. socially close) others." | Liu, abstract |
| Q45 | "We find evidence compatible with an account wherein one reason this underestimation of appreciation occurs is because responders (vs. initiators) are more focused on their feelings of surprise at being reached out to." | Liu, abstract |
| Q46 | "the presence of other people in a critical situation reduces the likelihood that an individual will help." … "when the bystanders were not strangers." | Fischer, abstract |

### What the samples were (for the setting line)

| Paper | Sample, as far as I read |
|---|---|
| Huang | Harvard lab and MTurk text chats of 15 min; face-to-face speed dates (Q9). US-based; MTurk worker countries not checked. |
| Kardas | Strangers. Abstract does not name the country; authors at US universities. |
| Weger 2014 | 115 US undergraduates, "mostly young, White, female" (Q21). Strangers, mild topics. |
| Weger 2010 | Undergraduate peer interviews about exams (Q22). Abstract does not name the country (UCF repository). |
| Itzchakov | Abstract does not name the country; authors in Israel and the US. |
| Morris & Fritz | Groups "such as classes" (Q24). Authors at Lancaster, UK; the abstract does not name the sample's country. |
| Yeomans | MTurk written replies on US policy topics (Q34); a government executive programme; Wikipedia talk pages. |
| Mastroianni | US online survey (Study 1, intimates); Harvard lab, strangers, mean age 23.1 (Q38). |
| Boothby | Lab strangers, first-year dorm mates, a workshop (Q40). Abstract does not name the country. |
| Brooks | Abstract does not describe the sample or task. |
| Liu | "a series of preregistered experiments" (Q43). Abstract does not name the country. |
| Fischer | Meta-analysis of emergency studies, "from the 1960s to 2010". |

## 3. Indian scenes: do they claim the studies tested India?

**No line does.** Scenes used: Nashik shop, Jaipur wedding, DBMS assignment, PG roommate, hostel wing, viva, campus placement
rounds, family function, uncle and career, college fest, internship, WhatsApp school group, "mimicry of Sir".

But the draft never says where the studies ran, and four guided stems ask "What fits the research?" (or similar) over an Indian scene.
The outline (§Cross-cutting risks) said: "Say 'in studies' in copy. Keep Indian scenes as practice settings, not as proof."

**Fixes:**

| Where | Current | Rewrite |
|---|---|---|
| `body.topic.description` | "DRAFT FOR EDITORS. Conversation skills from published studies, set in Indian college and work life." | "Conversation skills from published studies. Most studies ran in the US or UK, often between strangers. The Indian scenes are for practice. The studies did not test them." |
| Every guided stem ending "What fits the research?" / "Which plan fits the research?" / "What does the research suggest?" (`disagree-and-end-s2`, `listening-s2`, `reach-out-s1`, `reach-out-s2`) | "What fits the research?" | "What fits what the studies found?" (and keep the setting line above) |
| `disagree-and-end-s1` guided (uncle) | no note | Add hint: "The study used written replies on US policy topics. Talks with elders were not tested." |
| `reach-out-s1` hook and Show me (internship) | no note | Add to hook feedback (b): "These were lab studies, not offices." |

## 4. Structure check

| Check | Result |
|---|---|
| Concepts / steps / items | 4 / 12 / 24. Matches the brief. |
| Item types per concept | follow-ups: choose, scenario ×2, why, estimate, fill-the-step. listening: choose, scenario ×2, why, estimate, order. disagree-and-end: choose, scenario, predict, true-not-quite, estimate, explain-it-back. reach-out: choose, scenario, predict, true-not-quite, estimate, match. |
| 8 outline ideas packed into 4 concepts | Names sit under "Listening"; ending a chat sits with disagreeing; advice sits with reach-out. The concept hooks join two unrelated questions ("…and help a new name stick?"). Not a fact error, but each concept teaches two things. |
| Orphan claims (no step uses them) | 15 of 29: follow-ups-c3, c5, c6; listening-c3, c4, c5, c6, c8; disagree-and-end-c1, c2, c4, c5, c8; reach-out-c1, c2, c6, c7. Fine as fact-check records, but c2 and c8 of disagree-and-end are broken (below). |
| Cited but not used in any learner text | `boothby-2018` is on `disagree-and-end-s2` and item `disagree-and-end-4`, but no copy uses the liking gap. Remove the ref or restore the outline line "They likely liked you more than you think." `itzchakov-2018` is used by one orphan claim only. |
| Wrong `misconceptionTags` | `follow-ups-1` tags m1 (story) but has no story option. `listening-1` tags m1 (advice) but has no advice option. |
| Teach length | All 12 teach cards are 25-30 words. OK. |
| Repeated text | `listening-s1` and `listening-s3` have the same takeaway. All four `-s3` Show me feedbacks are the same filler line. |

## 5. Concept-level fields (hook, askLine, rule, quest)

| ID | Text | Verdict | Why | Rewrite |
|---|---|---|---|---|
| follow-ups hook | "What can help a first chat move past small talk?" | **S** | A question; frames Q1 and Q11. | Keep |
| follow-ups askLine | "After someone tells you about their weekend, what could you ask next?" | **S** | Question only. | Keep |
| follow-ups rule | "Pick up what the person said, ask for more, and share something back. A personal question can take the chat one step deeper." | **P** | "Share something back" is the authors' untested idea (Q5). The rest fits Q2, Q14. | "Pick up what the person said and ask for more. A more personal question can take the chat one step deeper. Sharing back is a good habit, though the studies did not test it." |
| follow-ups quest | "Ask two follow-up questions, ask one deeper question, then share one answer." | **P** | A practice task, not a finding. Fine as practice. Add safety framing from the outline. | "With someone you already know, ask two follow-up questions and one deeper one. Share your own answer too. Skip any part that feels like too much." |
| listening hook | "How can you show that you heard someone, and help a new name stick?" | **S** | Question only. Two topics in one (see §4). | Keep, or split the concept |
| listening askLine | "When a friend tells you about a hard day, what could you say before offering ideas?" | **S** | Question only. | Keep |
| listening rule | "Say back the gist, ask about it, and stay engaged. For a new name, try to recall it later before checking." | **P** | First part is the Q15 definition. Recalling one name in daily life is an inference from class name games (Q24). | "Say back the gist, ask about it, and stay engaged. For a new name, try to recall it before you check. Name games in classes found recall works." |
| listening quest | "Say back one person's words; later, recall one new name before checking." | **P** | Practice task. "Say back … words" sounds like parroting; Q15 says "paraphrased". | "Say back what one person told you, in your own words. Later, recall one new name before you check." |
| disagree-and-end hook | "How can you keep your view in a disagreement and leave a chat clearly?" | **S** | Question only. | Keep |
| disagree-and-end askLine | "How could you leave a long chat when neither person has said they want to stop?" | **S** | Question only. | Keep |
| disagree-and-end rule | "In a disagreement, show that you heard the other view and state yours with care. When leaving, use a warm line and a clear goodbye." | **P** | First sentence fits Q28. The exit line was not tested (Q37 is the authors' framing; the outline says "our inference"). | "In a disagreement, show you heard the other view, then state yours with care. When leaving, a warm line and a clear goodbye may help. That part was not tested." |
| disagree-and-end quest | "In one disagreement, show you heard them; end one chat with a warm line and goodbye." | **P** | Practice task built on an untested exit. Reads as "go find a disagreement". | "If a disagreement comes up today, start by showing you heard the other view. End one chat on purpose with a warm line and a goodbye." |
| reach-out hook | "When might it help to ask someone for advice or send a short check-in?" | **S** | Question only. | Keep |
| reach-out askLine | "Who could you ask about a hard task, and what would you say you have tried?" | **S** | Question only. | Keep |
| reach-out rule | "Ask someone with expertise about a hard task. A short personal check-in may be valued more than you expect." | **S** | Q42 (hard task, expert); Q43. | Keep |
| reach-out quest | "Ask one experienced person about a hard task; send one short check-in message." | **R** | Sends the learner into WhatsApp with no exit. The outline said "Then close the app" and "daytime nudge only". | "Ask one experienced person about a hard task. In the daytime, send one short check-in to someone you haven't talked to in a while. Then close the app." |

## 6. Claims (29)

| ID | Text | Verdict | Why | Rewrite |
|---|---|---|---|---|
| follow-ups-c1 | People who ask more questions, mainly follow-up questions, are liked more. | **S** | Q1. | Keep |
| follow-ups-c2 | A follow-up question asks the other person to say more about what they just said. | **S** | Q2. | Keep |
| follow-ups-c3 | People do not expect this effect. | **S** | Q3. | Keep |
| follow-ups-c4 | Chats with strangers felt less awkward and more connecting than people expected. | **S** | Q10. | Keep |
| follow-ups-c5 | People most overrate the awkwardness of deep talk. | **S** | Q11. | Keep |
| follow-ups-c6 | The reason: they expect others to care less than they do. | **W** | "than they do" reads as "than the speaker cares". Q12 says "than others actually did". | "The reason: they expected partners to care less about what they shared than the partners really did." |
| listening-c1 | Good listening has three parts: say back the gist, ask, and stay with the person. | **P** | Q15 defines *active* listening, not "good listening". The third part is "nonverbal conversational involvement", which the study did not vary (Q20). | "Active listening, as one study defines it, has three parts: say back the gist in your own words, ask when it fits, and stay engaged with your face and body." |
| listening-c2 | Active listening made people feel more understood than advice or "hmm". | **P** | Q16 supports "advice or simple acknowledgements". The acknowledgements were "I see," "OK," "That makes sense" and nods (Q18), not "hmm". | "In one study of first meetings, active listening made people feel more understood than advice or short replies like 'I see'." |
| listening-c3 | But it did not beat advice on satisfaction or liking; effects were small. | **S** | Q17. | Keep |
| listening-c4 | A paraphrase alone did not make people feel understood in an earlier study. | **S** | Q22. | Keep |
| listening-c5 | Warm, calm listening can help a speaker feel less tense. | **P** | Q23 says "empathic, attentive, and nonjudgmental" listening reduced "social anxiety". "Warm, calm" and "tense" are not the paper's terms. | "In five experiments, attentive, non-judging listening made speakers feel less socially anxious while they talked." |
| listening-c6 | People who tried to recall new names knew them better months later than people who just met as usual. | **P** | Q24: the comparison was "pairwise introductions", in classes. "Met as usual" is vaguer. | "In classes, a name game built on recall beat pairwise introductions at 30 minutes, 2 weeks and 11 months." |
| listening-c7 | The gain came from recalling, not from hearing names more often. | **S** | Q25, Q26. | Keep |
| listening-c8 | A short refresher later helped further. | **S** | Q26. | Keep, add "after 2 weeks" |
| disagree-and-end-c1 | Receptiveness is a way of talking, and it can be measured. | **S** | Q27. | Keep |
| disagree-and-end-c2 | The four-part recipe. | **W** | Not a claim. A label with no content. | "The recipe: positive statements rather than negations, saying you understand, finding points of agreement, and hedging to soften claims." |
| disagree-and-end-c3 | People using it were seen as better partners and were more persuasive. | **S** | Q29. | Keep; "better partners" = "more desirable partners for future collaboration" |
| disagree-and-end-c4 | An open tone early in a chat can help keep a fight from growing. | **P** | Q30 is field data from Wikipedia talk pages, not chats, and it is a link, not a test of cause. | "On Wikipedia talk pages, editors who wrote more receptive posts got fewer personal attacks later." |
| disagree-and-end-c5 | Chats rarely end when either person wants. | **S** | Q35. | Keep |
| disagree-and-end-c6 | We cannot tell when the other person wants to stop. | **P** | Q35 says "little idea", not "cannot". | "People had little idea when their partner wanted to stop." |
| disagree-and-end-c7 | Among strangers (Study 2), in almost half of chats both wanted to stop sooner. | **S** | Q36 (46.83%). | Keep |
| disagree-and-end-c8 | After chats, people underrate how much they were liked, including first-year students and their hostel-mates. | **S** | Q40 ("dorm mates"). Unused by any copy (§4). | Keep, or delete with the Boothby ref |
| reach-out-c1 | People avoid asking for advice for fear of looking incompetent, and the fear is misplaced. | **S** | Q41. | Keep |
| reach-out-c2 | Advice-seekers are seen as more competent. | **S** | Q41. | Keep |
| reach-out-c3 | It depends on the ask: hard task, asked personally, asked of an expert. | **W** | Q42: "asked personally" means the *judge is the one being asked* (the paper lists this as an adviser-side moderator). It is not about asking one person rather than a group. | "The boost was bigger when the task was hard, when the adviser was an expert, and when the person judging was the one being asked." |
| reach-out-c4 | People underrate how much others value a short check-in or small gesture. | **S** | Q43. | Keep |
| reach-out-c5 | The gap is bigger with people you are less close to, and when it is a surprise. | **S** | Q44. | Keep |
| reach-out-c6 | In a crisis, a person is less apt to help when more people are near. | **S** | Q46. | Keep |
| reach-out-c7 | But this is weaker when the others are people you know. | **S** | Q46. | Keep |

## 7. Misconceptions (10)

| ID | Name / correction | Verdict | Why | Rewrite of correction |
|---|---|---|---|---|
| follow-ups-m1 | "A better story of my own shows interest." / "A matching story moves the spotlight to you. Ask first, share after." | **P** | Huang did not test stories. "Ask first, share after" is advice. Q6 even notes observers liked the people who answered. | "The studies measured questions, not stories. Asking about theirs went with being liked. Your story can come after." |
| follow-ups-m2 | "Others won't care about deeper talk." / "In the studies, partners cared more than people expected." | **S** | Q12, Q13. | Keep |
| listening-m1 | "Advice is the best way to show I care." / "Advice is not wrong, but in the study it did not make people feel as understood." | **S** | Q19 (14.48 vs 17.27). | Keep |
| listening-m2 | "Repeating is the same as recalling." / "When repeats were matched, recalling still won." | **S** | Q25. | Keep |
| disagree-and-end-m1 | "Blunt is more convincing." / "Blunt lines can shut a chat down. Show what you heard, then share your view." | **P** | "Shut a chat down" is not a finding. Q29 is the finding. | "In one study, people who disagreed rated receptive replies as more persuasive, not less." |
| disagree-and-end-m2 | "Kind means giving in." / "Receptive is not the same as agreeing. Kunal can keep his view." | **S** | Q32. But it names Kunal in a general misconception. | "Receptive is not the same as agreeing. You can keep your view." |
| disagree-and-end-m3 | "I can tell they want to keep going." / "People had little idea when partners wanted to stop. Often both wanted to stop sooner." | **S** | Q35, Q36. | Keep |
| reach-out-m1 | "The effect works for any question." / "It held most for hard tasks, not easy ones." | **S** | Q42. | Keep |
| reach-out-m2 | "Asking means I'm weak." / "The study found this fear was misplaced." | **S** | Q41. | Keep |
| reach-out-m3 | "Distance makes it unwelcome." / "The gap was larger with less-close people." | **S** | Q44. | Keep |

## 8. Steps (12)

Each step: hook stem, hook option feedback, teach, visual, Show me (parts + spot), Show me feedback, guided stem + hint,
guided option feedback, takeaway.

### follow-ups-s1 · Ask one more question (claim c1, Huang)

| Unit | Text | Verdict | Why | Rewrite |
|---|---|---|---|---|
| Hook stem | "In a first chat, who is usually liked more?" | **S** | Q1; the chats were first meetings (Q9). | Keep |
| Hook a fb | "The study points to asking more follow-up questions." | **S** | Q1. | Keep |
| Hook b fb | "In studies, people who asked more follow-ups were liked more." | **S** | Q1. | Keep |
| Hook c fb | "Talking mainly about yourself leaves less room for the other person." | **P** | Not in the paper. Q6: observers liked the question-*recipients*, who talked about themselves. | "The study did not test this. It found that people who asked more follow-ups were liked more by their partner." |
| Teach | "Ask about the last thing your chat partner shared. This shows you heard them, so the chat can keep its thread. More follow-up questions can help people like the asker." | **P** | "Shows you heard them" fits Q4. "So the chat can keep its thread" is not in the paper. "Can help people like" is causal; for follow-ups the link was measured, not set by the researchers. | "Ask about the last thing they shared. It shows you are listening. In US studies of first chats, people who asked more follow-ups were liked more." (26 words) |
| Visual | Topic switch "Did you finish the assignment?" / Follow-up "What was the busiest part?" | **S** | Q2, Q7. | Keep |
| Show me | Meera/Arjun, 5 parts, spot part 4 | **W** | Part 2 ("Nice. What did you do there?") is also a follow-up by Q2: it asks her to say more about her trip. Two right answers. | Change part 2 to `Arjun: "Nice, Nashik! I've never been."` and keep spot on part 4. |
| Show me fb | "Part 4 picks up 'shop' and 'sale week', so it is a follow-up. Part 5 shares something back, which keeps it from turning into an interview." | **P** | Sentence 1 fits Q2. Sentence 2 is the authors' untested idea (Q5). | "Part 4 picks up 'shop' and 'sale week', so it is a follow-up. Part 5 shares something back. The authors guess that helps, but did not test it." |
| Guided stem + hint | Jaipur wedding; "Stay with what the classmate just said." | **S** | Scene; fits Q2. | Keep |
| Guided a fb | "Right. It asks for more about the wedding they just mentioned." | **S** | Q2. | Keep |
| Guided b fb | "This changes the topic. A follow-up stays on what they said." | **S** | Q7. | Keep |
| Guided c fb | "A matching story moves the spotlight to you. Ask first, share after." | **P** | As follow-ups-m1. | "That is your story, not a question about theirs. The studies linked follow-up questions to being liked." |
| Takeaway | "Ask about what they just said, then share back." | **P** | "Share back" untested (Q5). | "Ask about what they just said. Share your side after." (keep as advice, no claim) |

### follow-ups-s2 · Go one level deeper (claim c4, Kardas)

| Unit | Text | Verdict | Why | Rewrite |
|---|---|---|---|---|
| Hook stem | "Before a deep chat with someone new, most people guess it will feel..." | **S** | Q11. | Keep |
| Hook a fb | "In studies, deep chats felt less awkward than people expected." | **S** | Q10, Q11. | Keep |
| Hook b fb | "People in the studies expected more awkwardness than they felt." | **S** | Q11. | Keep |
| Hook c fb | "The gap went the other way: the chats felt less awkward." | **S** | Q10. | Keep |
| Teach | "Deep talk may feel risky at first. Yet it can feel less odd than you fear, since the other person may care more than you think." | **S** | Q10, Q12, hedged. | Keep |
| Visual | Small talk "Which branch are you in?" / One step deeper "Why did you pick it?" | **P** | The abstract does not list the study's questions. This is our example, not a study item. | Keep the visual; in the fact-check note write "example question, not from the study". |
| Show me | 4 parts, spot part 2 | **S** | One right answer. Part 4 (sharing your own answer) fits Q12/Q13 well: the finding is about others caring about *your* disclosures. | Keep |
| Show me fb | "Part 2 asks for a reason, not a fact. Part 4 matters too: sharing your own answer keeps it two-way." | **S** | Q12, Q13. | Optional: "…Part 4 matters too. In the studies, people underrated how much others cared about what they shared." |
| Guided stem + hint | PG roommate; "Ask for something meaningful without asking for private facts." | **S** | Scene; "deep and meaningful" Q13. | Keep |
| Guided a fb | "It is personal but easy to answer, one step deeper." | **P** | "Easy to answer" is not measured. Fine as guidance. | Keep, mark as editorial in fact-check |
| Guided b fb | "In the studies, partners cared more than people expected." | **S** | Q12. | Keep |
| Guided c fb | "That is private, not deep. Deep means meaningful, not intrusive." | **P** | An editorial line. The abstract says "deep and meaningful" and "intimate revelations" (Q13); it does not define "intrusive". | "That asks for a private fact about their family. Deep questions are about what matters to them." |
| Takeaway | "Ask one meaningful question and share your answer too." | **S** | Q13, Q14. | Keep |

### follow-ups-s3 · Stay with their last point (claim c2, Huang)

| Unit | Text | Verdict | Why | Rewrite |
|---|---|---|---|---|
| Hook stem | "What turns a new question into a follow-up?" | **S** | Q2. | Keep |
| Hook a fb | "It asks for more about what came up." | **S** | Q2. | Keep |
| Hook b fb | "That is a topic switch, not a follow-up." | **S** | Q7. | Keep. Option text "before the last one has had time to grow" adds a judgement; shorten to "It brings in a new topic." |
| Teach | "A follow-up stays with the last point and asks for more. It works because the other person gets room to add to the same thread." | **W** | The paper's reason is responsiveness (Q4), not "room to add". | "A follow-up stays with their last point and asks for more. In the studies, follow-ups worked by showing you were listening and cared." |
| Visual | Flow "Hear a point → Ask for more → Leave room" | **P** | "Leave room" is not in the paper. | "Hear a point → Ask for more → Listen" |
| Show me | Club / "You ask what drew them to it." / film | **S** | One right answer; fits Q2. Very thin. | Keep or merge into s1 |
| Show me fb | "This part shows the move. The other lines give the chat its shape." | **R** | Filler; teaches nothing. Same line in all four `-s3` steps. | "This asks about the club they just mentioned, so it is a follow-up. The film line switches topic." |
| Guided stem + hint | Club; "Stay with the last topic." | **S** | Fits Q2. | Keep |
| Guided a fb | "That asks for more about the club." | **S** | Q2. | Keep |
| Guided b fb | "That line starts a new topic." | **S** | Q7. | Keep |
| Takeaway | "Ask for more on the same thread." | **S** | Q2. | Keep |

### listening-s1 · Show you are listening (claim c2, Weger 2014/2010)

| Unit | Text | Verdict | Why | Rewrite |
|---|---|---|---|---|
| Hook stem | "A friend is upset about a bad viva. Which reply tends to make people feel most understood?" | **P** | One study of strangers on mild topics (Q21), small effects (Q17). "Tends to" suggests a settled pattern; Weger 2010 found paraphrase alone did not help (Q22). | "In one study of first meetings, which reply made people feel most understood?" (keep the viva as the scene in the options if wanted) |
| Hook a fb | "In one study, active listening helped more with feeling understood." | **S** | Q16, Q19. | Keep |
| Hook b fb | "This uses more of the active listening package." | **S** | Q15, Q20. | Keep |
| Hook c fb | "A brief acknowledgement gives them little room to say more." | **P** | "Happens to everyone" is not what the study called an acknowledgement (Q18: "I see", "OK"). It is closer to brushing it off. "Little room" is not a finding. | Change option c to "I see." and feedback to "Short replies like 'I see' left people feeling the least understood in that study." |
| Teach | "A person may feel heard when you say back the gist, ask, and stay with them. This helps because you give them time to tell you more." | **P** | Sentence 1 fits Q15/Q16. "Because you give them time" is not in the paper. | "In one study, people felt more understood when the listener said back the gist and asked about it. Advice and 'I see' did less." (24 words) |
| Visual | Quick advice "Apply off-campus." / Active listening lines | **S** | Q20. | Keep |
| Show me | Sana/Rohan, 5 parts, spot part 3 | **S** | One paraphrase line; part 2 matches nonverbal involvement (Q15). | Keep |
| Show me fb | "Part 3 says the gist back in Rohan's words. Part 4 asks about it. Part 5 checks before giving advice." | **P** | Parts 3-4 fit Q20. "Checks before giving advice" was not tested; the study's advice was "unsolicited". | "Part 3 says the gist back in Rohan's words. Part 4 asks about it. Part 5 asks before giving advice, which the study did not test but fits the idea." |
| Guided stem + hint | Tanvi, placement round, family function; "Say back the gist, then ask." | **S** | Scene; fits Q20. | Keep |
| Guided a fb | "Advice is not wrong, but in the study it did not make people feel as understood." | **S** | Q19. | Keep |
| Guided b fb | "It says the gist back and asks about it." | **S** | Q20. | Keep |
| Guided c fb | "A bare 'hmm' made people feel the least understood." | **P** | Lowest score is right (Q19), but the study's replies were "I see", "OK", "That makes sense" (Q18). | "Short replies like 'I see' or 'OK' left people feeling the least understood in that study." |
| Takeaway | "Say back the gist, ask, and stay with them." | **S** | Q15. | Keep |

### listening-s2 · Keep a new name (claim c7, Morris & Fritz)

| Unit | Text | Verdict | Why | Rewrite |
|---|---|---|---|---|
| Hook stem | "New hostel wing, 10 names in 10 minutes. What helps most to remember them next week?" | **P** | "Helps most" overstates: only pairwise introductions and matched repeats were compared (Q24, Q25). | "New hostel wing, 10 names in 10 minutes. Which helped more in name studies?" |
| Hook a fb | "Recall beat a task with the same number of repeats." | **S** | Q25. | Keep |
| Hook b fb | "The name game studies point to recall practice." | **S** | Q24-Q26. | Keep |
| Hook c fb | "The studies tested recall against normal introductions and matched repeats." | **P** | Option c ("Writing them down once") is marked wrong, but writing was never tested. | Change option c to "Being introduced once, in pairs." Feedback: "Pairwise introductions did worse than the name game at 30 minutes, 2 weeks and 11 months." |
| Teach | "Try to pull a new name from your mind before you check it. This helps because recall makes you work with the name, not just hear it again." | **P** | The no-retrieval control (Q26) supports "recall, not just hearing". But the studies were group name games in classes, not one name in daily life. | "Try to pull a new name from memory before you check it. In class name games, recalling names beat hearing them the same number of times." (26 words) |
| Visual | Hear it again "Look at the group list first." / Recall it "Try the name before checking." | **S** | Q25, Q26. | Keep |
| Show me | Farhan, 4 parts, spot part 3 | **W** | Part 4 ("Next morning: 'Hi Farhan!'") is also pulling the name from memory. Two right answers. | Ask: "Tap the step where he recalls several names before checking the list." |
| Show me fb | "Part 3 recalls the names with no help. That effort is what made names stick in the studies." | **P** | The studies were name games in groups, not lunch recall. | "Part 3 recalls the names with no help. In the name game studies, that kind of recall is what helped." |
| Guided stem + hint | Aditi, club meet, 8 people; "Try to retrieve the names before looking." | **S** | Fits Q24-Q26. | Keep |
| Guided a fb | "When repeats were matched, recalling still won." | **S** | Q25. | Keep |
| Guided b fb | "Recall first, then check. That is retrieval practice." | **S** | Q26. | Keep |
| Guided c fb | "Caring helps attention, but the studies point to recall practice." | **P** | "Caring helps attention" is not in either paper. | "The studies did not test caring. They found that practising recall helped." |
| Takeaway | "Try to recall a name before checking it." | **S** | Q26. | Keep |

### listening-s3 · Use the full set (claim c1, Weger 2014)

| Unit | Text | Verdict | Why | Rewrite |
|---|---|---|---|---|
| Hook stem | "Is an echo alone the full way to listen?" | **S** | Q15, Q22. | "Is saying it back, on its own, the whole of active listening?" ("echo" sounds like parroting; Q15 says paraphrase) |
| Hook a fb | "The full set has more than an echo." | **S** | Q15. | Keep |
| Hook b fb | "A short echo leaves out the rest." | **S** | Q15; Q22 found paraphrase alone did not help feeling understood. | "In one study, a paraphrase alone did not make people feel understood." |
| Teach | "An echo can show that you heard a word. Ask and stay with the person too, because the full set gives them more room to speak." | **P** | "Because … more room to speak" is not in the paper. | "Saying it back is one part. In one study it did not help much alone. Add a question about it, and stay engaged." (23 words) |
| Visual | Flow "Say back the gist → Ask → Stay with them" | **S** | Q15. | Keep |
| Show me | Plan fell through, 3 parts, spot part 3 | **S** | One right answer. Thin. | Keep or merge into s1 |
| Show me fb | "This part shows the move. The other lines give the chat its shape." | **R** | Filler. | "Part 2 only says it back. Part 3 adds a question, which is the next part of active listening." |
| Guided stem + hint | Late train; "An echo is just one move." | **S** | Fits Q15. | Keep |
| Guided a fb | "A question gives her room to say more." | **P** | "Room to say more" is not a finding. | "A question is the second part of active listening." |
| Guided b fb | "That just adds one more echo." | **R** | Option b ("Say the same line once more in a loud voice") is a joke distractor that nobody would pick. | Change option b to "Give her tips for next time." Feedback: "That is advice. In the study, advice made people feel less understood than active listening." |
| Takeaway | "Say back the gist, ask, and stay with them." | **S** | Q15. Duplicate of s1. | "Saying it back is one part. Add a question." |

### disagree-and-end-s1 · Disagree kindly (claim c3, Yeomans)

| Unit | Text | Verdict | Why | Rewrite |
|---|---|---|---|---|
| Hook stem | "In an argument, does sounding open make you less convincing?" | **S** | Q29. | Keep |
| Hook a fb | "In one study, receptive replies were seen as more persuasive." | **S** | Q29. | Keep |
| Hook b fb | "The writers kept their view while sounding open." | **S** | Q32. | Keep |
| Hook c fb | "The study found a difference in how persuasive replies seemed." | **S** | Q29. | Keep |
| Teach | "Show you heard their view. Name a point you both share, then add your view with care. This can work because an open tone makes your reply easier to hear." | **P** | Steps fit Q28. "Because … easier to hear" is not the paper's reason. Drops "positive statements, rather than negations". | "Show you heard their view. Name a point you both share. Soften with 'I think', and say what you want, not just what is wrong." (25 words) |
| Visual | Blunt "That's just not true." / Receptive "I see why it feels safe. I think design can do that too." | **S** | Q28, Q31. | Keep |
| Show me | 4 parts, spot part 2 | **W** | The ask has no set-up. The feedback names Neha and Rohan, who never appear. The outline had: "Group project. Rohan wants to split the slides by topic. Neha disagrees." | Ask: "Group project. Rohan wants to split the slides by topic. Neha disagrees. Tap the line that finds common ground." |
| Show me fb | "Part 2 finds a shared goal. Neha still disagrees, but Rohan can hear it." | **P** | "Rohan can hear it" is not a finding. | "Part 2 finds a shared goal. Neha still disagrees, and says so with care." |
| Guided stem + hint | Uncle: "Engineering is the only safe career." Kunal studies design. | **R** | Tested only in written US policy replies (Q34); elders were not tested. The "uncle" is a familiar trope but not mocking. Needs the setting note. | Hint: "Acknowledge the concern and keep your view. (The study used written replies on US policy topics, not family talks.)" |
| Guided a fb | "Plain negation scored lower on receptiveness and persuasion." | **P** | Negations went with less receptive replies (Q31). Persuasion was tested for the whole recipe vs. control (Q29), not for negation alone. | "Words like 'not true' were common in replies rated less receptive." |
| Guided b fb | "It acknowledges, agrees, softens, and offers something positive." | **S** | Q28. | Keep |
| Guided c fb | "Receptive is not the same as agreeing. Kunal can keep his view." | **S** | Q32. | Keep |
| Takeaway | "Show you heard them, then state your view with care." | **S** | Q28. | Keep |

### disagree-and-end-s2 · End a chat well (claim c6, Mastroianni)

| Unit | Text | Verdict | Why | Rewrite |
|---|---|---|---|---|
| Hook stem | "In a study of chats between strangers, how often did both people want it to end sooner than it did?" | **S** | Q36. | "In a US lab study of chats between strangers, …" |
| Hook a fb | "In the study, this happened much more often." | **S** | Q36. | Keep |
| Hook b fb | "The share was closer to half." | **S** | Q36. Note: 9.52% is the share where both wanted *longer*. | "The share was closer to half. About 1 in 10 is how often both wanted it to go on longer." |
| Hook c fb | "In Study 2, both wanted an earlier end in 46.83% of chats." | **S** | Q36, exact. | Keep |
| Teach | "We often miss when the other person wants to stop. A warm, clear goodbye can help, since the other person may want to go too." | **P** | Sentence 1 fits Q35. Goodbyes were not tested. | "We often can't tell when the other person wants to stop. They may want to go too. A warm, clear goodbye is fine. (Goodbyes were not tested.)" (27 words) |
| Visual | Unclear hint / Clear exit | **P** | Contrast not tested. Q37 says people "mask" the wish, not that hints fail. | Left title "Hide it" / "Keep talking and hope they end it." |
| Show me | Hostel common room, 4 parts, spot part 4 | **S** | One goodbye line. Scene only. | Keep |
| Show me fb | "Part 4 ends it clearly. The warm line before it helps it land well. Using her name ties back to idea 4." | **W** | "Idea 4" is outline numbering; names are in `listening-s2` here. "Helps it land well" is untested. | "Part 4 ends it clearly. Part 2 adds a warm line first. Using her name ties back to the names step." |
| Guided stem + hint | Vikram, fest stall, 25 min; "People are poor at reading when a partner wants to stop." | **S** | Q35, Q39. | Keep |
| Guided a fb | "People had little idea when partners wanted to stop. Often both wanted to stop sooner." | **S** | Q35, Q36. | Keep |
| Guided b fb | "The senior may want to stop too. A clear exit helps both." | **P** | "Helps both" is untested. | "The senior may want to stop too. A clear exit was not tested, but it gives both of you the missing information." |
| Guided c fb | "Hints are hard to read. That is why chats run on." | **P** | The paper's account: people hide the wish (Q37). "That is why" overstates. | "In the study, people mostly kept their wish to stop to themselves, so partners had little to go on." |
| Takeaway | "A warm line and a clear goodbye can help end a chat." | **P** | Untested; hedged. | Keep; label as inference in the fact-check record |

### disagree-and-end-s3 · The chat may run long (claim c7, Mastroianni)

| Unit | Text | Verdict | Why | Rewrite |
|---|---|---|---|---|
| Hook stem | "Do both people in a chat ever want it to end sooner?" | **S** | Q36. | Keep |
| Hook a fb | "Many pairs had that same wish." | **S** | Q36. | Keep |
| Hook b fb | "That did not fit the study." | **S** | Q36 (only 9.52% both wanted longer). | "Only about 1 in 10 pairs both wanted it longer." |
| Teach | "In close to half of the stranger chats, both people wished to stop sooner. We may miss that wish, so a clear end can be kind." | **P** | Sentence 1 = Q36. "Can be kind" is untested. | "In close to half of the stranger chats in one US study, both people wished to stop sooner. We may miss that wish. A clear end is fine." |
| Visual | Flow "Hidden wish → Warm line → Clear end" | **P** | "Hidden wish" fits Q37; the rest is untested. | Keep; mark inference |
| Show me | Fest stall, 3 parts, spot part 3 | **S** | Scene only. Thin; repeats s2. | Merge into s2 |
| Show me fb | "This part shows the move. The other lines give the chat its shape." | **R** | Filler. | "Part 3 ends the chat clearly. Part 2 is a warm line before it." |
| Guided stem + hint | College event; "Look for a line that closes the chat." | **S** | Scene. | Keep |
| Guided a fb | "The line is warm and has a clear end." | **S** | Describes the option only. | Keep |
| Guided b fb | "That leaves the end hard to read." | **R** | Option b ("I will just look at my phone until you leave") is a joke distractor. | Change option b to "Keep talking until they say they have to go." Feedback: "They may be waiting for you. In the study, both often wanted to stop sooner." |
| Takeaway | "A warm, clear end can help both people." | **P** | Untested. | "A warm, clear end is fine. They may want to go too." |

### reach-out-s1 · Ask a senior for advice (claim c3, Brooks)

| Unit | Text | Verdict | Why | Rewrite |
|---|---|---|---|---|
| Hook stem | "At your internship you are stuck on a hard task. Does asking your senior for advice make you look less capable?" | **S** | Q41. Lab study, not an office (see §3). | Keep, add setting note to b feedback |
| Hook a fb | "In the studies, this fear was misplaced." | **S** | Q41. | Keep |
| Hook b fb | "The effect was strongest for hard tasks and expert advisers." | **S** | Q42. | "…These were lab studies, not offices." |
| Hook c fb | "The outline does not give a finding about the number of asks." | **W** | Internal editor text in learner copy. Option text "If you ask the same person twice." does not answer a yes/no question. | Option c: "Only if you ask the same person twice." Feedback: "The study did not test how many times you ask." |
| Teach | "Ask a person with the right skill for help on a hard task. This can look wise because the ask fits both the task and the person." | **P** | Q42 says "competent", not "wise", and gives no "because". "Help" ≠ advice. | "Asking an expert for advice on a hard task did not make people look weak in studies. They were seen as more competent, most on hard tasks." (27 words) |
| Visual | Easy "An Excel setting I can look up." / Hard "I tried two fixes. What would you check first?" | **S** | Q42 (difficulty). | Keep |
| Show me | 4 parts, spot part 2; part 3 "She asks her team lead directly, not 'anyone know?' in the group." | **W** | Part 3 rests on the misread "personally" (§6, reach-out-c3). Also no set-up line: the outline had "Internship. Meera is stuck on a data-cleaning step." | Ask: "Internship. Meera is stuck on a data-cleaning step. Tap the part that asks for their expertise." Part 3: "She asks the team lead who built it." |
| Show me fb | "Part 2 asks this person, on a hard problem, about something they know well. Those are the conditions where advice-seeking looked most competent." | **P** | "Hard problem" and "they know well" fit Q42. "Asks this person" leans on the misread. | "Part 2 asks an expert about a hard problem. Those are the conditions where advice-seeking looked most competent." |
| Guided stem + hint | Rohan, first week, Excel setting; "Think of how much work the task needs." | **S** | Fits Q42 (difficulty). | Keep |
| Guided a fb | "It held most for hard tasks, not easy ones." | **S** | Q42. Option text "That will make you look smart" is fine as a wrong belief. | Keep |
| Guided b fb | "That matches when advice-seeking looked most competent." | **P** | "Look it up first" was not tested. The hard-task part matches Q42. | "Looking it up first is our tip. Saving asks for hard problems matches when advice-seeking looked most competent." |
| Guided c fb | "The study found this fear was misplaced." | **S** | Q41. | Keep |
| Takeaway | "For a hard task, ask someone who knows it well." | **S** | Q42. | Keep |

### reach-out-s2 · Reach out one-to-one (claim c4, Liu)

| Unit | Text | Verdict | Why | Rewrite |
|---|---|---|---|---|
| Hook stem | "You text an old school friend: 'Saw this and thought of you.' How much will they value it, compared with your guess?" | **P** | "Will" predicts this friend. Q43 is about averages. | "…In studies, how did people's guesses compare with how much a check-in was valued?" |
| Hook a fb | "In the studies, people tended to guess too low." | **S** | Q43. | Keep |
| Hook b fb | "People tended to underrate how much a reach-out was valued." | **S** | Q43. | Keep |
| Hook c fb | "Recipients valued the reach-out more than senders expected." | **S** | Q43. | Keep |
| Teach | "A short note can mean more than you think. This gap can grow when the two people are less close, since the note may come as a nice surprise." | **S** | Q43, Q44, Q45 (hedged). | Keep |
| Visual | "Only react in the group" / "Send a personal note" | **P** | Liu did not compare group reactions with one-to-one notes. | Left title "Don't send it" / "It'll be weird after so long." |
| Show me | School group photo, 4 parts, spot part 2 | **P** | Spot is "move from group to one-to-one", which Liu did not test. Part 3 "Remembered your mimicry of Sir" is fine. | Ask: "Tap the personal check-in." Spot part 3. |
| Show me fb | "Part 2 moves it to one person. Part 3 is short and specific. Part 4 takes the pressure off both sides." | **P** | None of these three points is in the abstract. | "Part 3 is a short personal check-in, the kind the studies found was valued more than senders guessed. Part 4 is a kind extra." |
| Guided stem + hint | Neha, hostel friend, months; "Think of the gap in each guess." | **S** | Fits Q43. | Keep |
| Guided a fb | "The surprise of hearing from her is part of why it lands well." | **P** | Q45 says "evidence compatible with an account". | "In the studies, people who got a check-in focused on the surprise, and that went with valuing it more." |
| Guided b fb | "The gap was larger with less-close people." | **P** | Option b says "time apart"; Q44 is "socially distant", which is not the same as months without talking. | Option b: "Skip it. Only close friends value messages." Feedback: "The gap was larger between less-close people." |
| Guided c fb | "The study looked at one-to-one reach-outs. A group post was not tested." | **S** | Q43 describes messages or gifts to a person; groups are not mentioned. | "The studies looked at messages to one person. Group posts were not tested." |
| Takeaway | "A short personal check-in may mean more than you expect." | **S** | Q43. | Keep |

### reach-out-s3 · A rare note can land well (claim c5, Liu)

| Unit | Text | Verdict | Why | Rewrite |
|---|---|---|---|---|
| Hook stem | "Can a note to an old friend be a nice surprise?" | **P** | Not a research question; any answer is "yes". | "When was the gap biggest: with close friends, or with people you're less close to?" (a: less close, correct) |
| Hook a fb | "A rare note can land well." | **P** | "Rare" is not Liu's variable; Q44 is "surprising context" and "socially distant". | "The gap was biggest with less-close people and in surprising moments." |
| Hook b fb | "The gap grew with less close ties." | **S** | Q44. | Keep |
| Teach | "An old friend may value a short note more than you guess. The gap can be large because a rare note comes as a nice surprise." | **P** | "Because" overstates Q45. An "old friend" may be close, not distant. | "Someone you're less close to may value a short note more than you guess. In the studies, the gap was larger when the note was a surprise." (27 words) |
| Visual | Flow "Old tie → Short note → Nice surprise" | **P** | Same conflation. | "Less-close tie → Short note → Bigger gap" |
| Show me | School photo, 3 parts, spot part 2 | **S** | Scene only; repeats s2. | Merge into s2 |
| Show me fb | "This part shows the move. The other lines give the chat its shape." | **R** | Filler. | "Part 2 is the reach-out. In the studies, senders guessed too low about notes like this." |
| Guided stem + hint | Hostel friend posts old photo; "Think about who may be glad to hear from you." | **S** | Fits Q43. | Keep |
| Guided a fb | "A brief note may mean more than you guess." | **S** | Q43. | Keep |
| Guided b fb | "That plan skips the one to one note." | **R** | Option b ("Wait for a big group chat to do all the work for you") is a joke distractor. | Option b: "Don't. It'll be awkward after so long." Feedback: "Senders often guess too low. The gap was larger with less-close people." |
| Takeaway | "A rare note may mean more than you guess." | **P** | "Rare" again. | "A note to someone you're less close to may mean more than you guess." |

## 9. Items (24)

One row for the item as a whole, then one row per option feedback.

### follow-ups items

| Unit | Text | Verdict | Why | Rewrite |
|---|---|---|---|---|
| follow-ups-1 (choose, reverse) | "Meera talks about the busy week at her family shop. Which reply breaks that thread?" | **W** | Tagged misconception m1 (story) but no option is a story. Options a and c are near the same. | Tag `[]` or swap option c for "Tell her about your own busy week." with tag m1. |
| fb a | "That stays with her shop news and lets her add more." | **S** | Q2. | Keep |
| fb b | "A new exam topic cuts off the chat about her shop." | **S** | Q7. | Keep |
| fb c | "This asks for more on the same week she brought up." | **S** | Q2. | Keep |
| follow-ups-2 (scenario, transfer) | Cricket match; "You want to show interest. What fits?" | **S** | Correct option fits Q2. | Keep |
| fb a | "The question stays with their match. Sharing later keeps the chat two-way." | **P** | Second sentence untested (Q5). | "The question stays with their match. Your story can come after." |
| fb b | "Your story takes the spotlight before they can say more." | **P** | Not tested. | "That is your story, not a question about theirs." |
| fb c | "An exam question starts a new topic. It does not follow up." | **S** | Q7. | Keep |
| follow-ups-3 (why, misconception) | "Which wrong guess made people fear that deep talk would feel odd?" | **S** | Q12. Options a and b read alike (expectation vs. fact). | Option b: "The talk really was awkward." |
| fb a | "They thought the other person would care less. That made deep talk feel hard." | **P** | Q12 is about expected awkwardness, not "hard". | "They thought the other person would care less than they really did." |
| fb b | "Partners cared more than people expected in the studies." | **S** | Q12. | Keep |
| fb c | "Deep talk in the study meant personal and meaningful talk." | **S** | Q13 ("deep and meaningful"). | Keep |
| follow-ups-4 (scenario, edge) | New roommate; "Which next question goes one step deeper?" | **S** | Q13. | Keep |
| fb a | "It asks what she hopes for, but does not pry." | **P** | Editorial. Fine. | Keep, mark editorial |
| fb b | "Income is a private fact. Deep talk need not be intrusive." | **P** | Editorial, as `follow-ups-s2` guided c. | "That asks for a private fact. Deep questions are about what matters to her." |
| fb c | "In the studies, people expected less care than partners showed." | **S** | Q12. | Keep |
| follow-ups-5 (estimate, combine) | "How many follow-up questions does Ravi ask?" Answer 2 (1.5-2.5). | **P** | Tests counting, not a finding. "About 2" for an exact count reads oddly. | Replace: stem "In the coded chats, about what share of all questions were follow-ups?" answer `{value: 40.51, min: 30, max: 50, unit: "percent"}`. Options "About 40%" (correct; fb "Follow-ups were the most common type, 40.51% of questions.") and "About 5%" (fb "Too low. Follow-ups were the most common type."). Source Q8. |
| fb a | "He asks for two new bits about the club she brought up." | **S** | Q2. | Replace with item above |
| fb b | "The scene has two questions that stay with her club news." | **S** | Q2. Distractor "About 4, if each line counts as a new question" is a joke. | Replace with item above |
| follow-ups-6 (fill-the-step, recall) | "Hear her point, then ___." | **S** | Q2. | Keep |
| fb a | "A follow-up gives her room to add to the same thread." | **P** | Mechanism not in paper (Q4). | "A follow-up asks her to say more about her point." |
| fb b | "A topic switch leaves the first point with no room to grow." | **P** | Same. | "That switches topic." |

### listening items

| Unit | Text | Verdict | Why | Rewrite |
|---|---|---|---|---|
| listening-1 (choose, reverse) | "Which reply leaves out the main parts of good listening?" | **W** | Tagged m1 (advice) but no advice option. Only 2 options. | Add option c "Give tips straight away." (wrong; fb "Advice is a different move. The study compared it with active listening.") and keep tag m1. Say "active listening", not "good listening". |
| fb a | "That uses the full set and gives the person room to talk." | **P** | "Room to talk" not in paper. | "That uses all three parts." |
| fb b | "A small sound with no care or question leaves out the full set." | **S** | Q15, Q18. | Keep |
| listening-2 (scenario, edge) | Canteen, bad viva; "Which reply fits the full package?" | **W** | The "correct" option ("That sounds rough. Which part felt hardest?") does not say back the gist. It is sympathy plus a question. | Option a: "So the viva didn't go how you hoped. Which part felt hardest?" |
| fb a | "It says back the gist and invites the friend to say more." | **W** | Not true of the current option a. | Keep after the option fix |
| fb b | "That offers advice before checking what the friend wants." | **P** | Study's advice was unsolicited (Q20 context); "before checking" is editorial. | "That is advice. In the study, advice made people feel less understood than active listening." |
| fb c | "A paraphrase alone did not make people feel understood in an earlier study." | **S** | Q22 (peer interviews about exams). | Keep |
| listening-3 (why, misconception) | "Why try to recall a new club member's name before looking at the list?" | **S** | Q25. | Keep |
| fb a | "The name games still won when time and repeats were matched." | **S** | Q25. | Keep |
| fb b | "Hearing it again is not as good as trying to recall it." | **S** | Q26. | Keep |
| fb c | "Looking first removes the chance to try recalling it yourself." | **S** | Follows from Q26 (no-retrieval condition). | Keep |
| listening-4 (scenario, transfer) | Orientation, 8 names | **S** | Q24-Q26. | Keep |
| fb a | "This uses recall practice and a later refresher." | **S** | Q26. | Keep |
| fb b | "Matched repeats did not work as well as recall in the study." | **S** | Q25. | Keep |
| fb c | "The studies found a benefit from practising recall." | **S** | Q24. | Keep |
| listening-5 (estimate, combine) | "About how many parts are in the full set…?" Answer 3. | **P** | The stem gives the answer away (it lists the three parts). Tests counting. | Replace: stem "In the study, how many response types did the researchers compare?" answer `{value: 3, min: 2.5, max: 3.5, unit: "types"}` (active listening, advice, simple acknowledgement; Q16). |
| fb a | "The full set has a gist, a question, and real care." | **W** | Q15's third part is "nonverbal conversational involvement", not "real care". | "Active listening, advice, and short replies like 'I see'." (with the replacement item) |
| fb b | "The claim lists three moves, not a step for each word." | **R** | Distractor "About 6 parts, with each word counted as a part" is a joke. | Option b: "About 6." fb: "The study compared three: active listening, advice and short replies." |
| listening-6 (order, recall) | "Put these moves in a kind order for a friend who has had a hard day." | **P** | Weger gives no order. "Hear the full story first" is not one of Q15's parts. "Kind order" is opinion. | Stem: "Put the two active listening moves in the order the study's listeners used them." Options: "Say back the gist." then "Ask them to say more." (Q20: paraphrase and, when appropriate, ask to elaborate.) |
| fb a | "Let them finish so you can know what went on." | **P** | Not in the paper. | Drop with the option |
| fb b | "A short gist can show what you heard so far." | **S** | Q15. | Keep |
| fb c | "A calm question gives them room to add more." | **P** | "Room" not in paper. | "Then ask them to say more." |

### disagree-and-end items

| Unit | Text | Verdict | Why | Rewrite |
|---|---|---|---|---|
| disagree-and-end-1 (choose, reverse) | "Which line sounds least open when two college mates disagree?" | **S** | Q28, Q31. Only 2 options. | Add option c "I see your point, and I think another way could work." (fb "That acknowledges and hedges.") |
| fb a | "This line leaves room for the other view while you share yours." | **S** | Hedge (Q28). | "'I think' is a hedge, part of the recipe." |
| fb b | "A blunt line skips what the other person thinks and shuts down the chat." | **P** | "Shuts down the chat" is not a finding. | "'Wrong' is a negation. Negations were common in replies rated less receptive." |
| disagree-and-end-2 (scenario, misconception) | Group project; "Which reply keeps her view?" | **S** | Q28, Q32. | Keep |
| fb a | "It shows understanding, finds common ground, and states a different view." | **S** | Q28. | Keep |
| fb b | "Plain negation was rated less receptive in the study." | **S** | Q31. | Keep |
| fb c | "She can sound open and still keep her own view." | **S** | Q32. | Keep |
| disagree-and-end-3 (predict, transfer) | Canteen, two new people; "Can each tell when the other wants to stop?" | **S** | Q35, Q39. | Keep |
| fb a | "That is what the study found about partners' wishes." | **S** | Q35. | Keep |
| fb b | "People had little idea when their partners wanted to end." | **S** | Q35. | Keep |
| fb c | "The study found that partners' wishes often did not match." | **S** | Q35 ("underestimated how discrepant their partners' desires were"). | Keep |
| disagree-and-end-4 (true-not-quite, edge) | Fest chat; "Which account stays closest to the evidence?" | **S** | Q35, Q37. Good honesty. Remove unused `boothby-2018` ref. | Keep |
| fb a | "The mismatch was studied. The warm exit is an inference, not a tested line." | **S** | Matches the outline and Q35. | Keep |
| fb b | "The study found that people often missed when a chat partner wished to stop." | **P** | True, but it does not say why "proven" is wrong. | "No study here tested exit lines, so 'proven' goes too far." |
| fb c | "People had little idea when partners wanted to stop." | **S** | Q35. | Keep |
| disagree-and-end-5 (estimate, combine) | "About what share had both people wish to end sooner?" Answer 46.83 (40-55). | **S** | Q36, exact. Study 2 only (252 people, one US lab, Q38). | Stem: "In one US lab study of stranger chats, about what share…" |
| fb a | "That is close to half of the stranger chats in the study." | **S** | Q36. | Keep |
| fb b | "That is too low; close to half of the pairs wished to stop sooner." | **S** | Q36. | Keep |
| disagree-and-end-6 (explain-it-back, recall) | "Which line sums up why a clear end can help?" | **P** | "Can help" is the untested part. | Stem: "Which line sums up the finding?" |
| fb a | "People had little sense of when the other person wished to end." | **S** | Q35. | Keep |
| fb b | "People were poor at gauging when a chat partner wished to stop." | **S** | Q39. | Keep |

### reach-out items

| Unit | Text | Verdict | Why | Rewrite |
|---|---|---|---|---|
| reach-out-1 (choose, reverse) | "Which advice ask is least like the kind that looked wise in the study?" | **P** | Q42 says "competent", not "wise". Only 2 options. | "…least like the kind that looked competent in the study?" |
| fb a | "The task is hard and the person has the right skill for it." | **S** | Q42. | Keep |
| fb b | "The result was strong for hard tasks and a person with the right skill." | **S** | Q42. | Keep |
| reach-out-2 (scenario, edge) | Intern, hard data fix | **S** | Correct option fits Q42 (hard, expert). | Keep |
| fb a | "It is a hard task, and she asks someone with relevant expertise." | **S** | Q42. | Keep |
| fb b | "The finding was strongest for hard tasks and personal asks to experts." | **W** | "Personal asks" misreads Q42 (it is about who judges, not one-to-one asks). | "The finding was strongest for hard tasks and expert advisers. This is an easy task." |
| fb c | "The fear that advice seeking looks incompetent was misplaced in the studies." | **S** | Q41. | Keep |
| reach-out-3 (predict, transfer) | Neha's check-in; "What might Neha guess too low?" | **S** | Q43. | Keep |
| fb a | "Senders in the studies guessed too low about the joy their notes could bring." | **P** | Q43 says "appreciate", not "joy". | "Senders in the studies guessed too low about how much their notes were appreciated." |
| fb b | "The gap was larger with people who were less close." | **S** | Q44. | Keep |
| fb c | "The reach-out study looked at the value of a personal contact." | **S** | Q43. | Keep |
| reach-out-4 (true-not-quite, misconception) | WhatsApp group photo; "Which claim stays within the evidence?" | **S** | Q43, Q46. Good. | Keep |
| fb a | "The reach-out studies support this. They did not test WhatsApp group replies." | **S** | Q43. | Keep |
| fb b | "The review was about a crisis with others near, not about a chat group." | **S** | Q46. | Keep |
| fb c | "The appreciation gap was larger with less-close people." | **S** | Q44. | Keep |
| reach-out-5 (estimate, combine) | "Riya sees Anu, Dev, and Tara… About how many notes is that?" Answer 3. | **W** | Arithmetic, not research. `liu-2023` is cited for a count of friends. | Replace with the match below moved here, or with a predict item: "Who focused more on the surprise of a check-in: the sender or the person who got it?" (correct: the person who got it; Q45). |
| fb a | "There are three friends here, and each gets one note from Riya." | **W** | Not a claim from the source it cites. | Drop with the item |
| fb b | "The scene names three friends, and each would get one note." | **W** | Same. Distractor "About 8 notes" is a joke. | Drop with the item |
| reach-out-6 (match, recall) | "Match each reach-out cue to what the study found." Pairs: less close tie ↔ larger gap; note out of the blue ↔ nice surprise; sender guess ↔ too low. | **P** | Pair 2 is a word match, not a finding. | Pairs: "Less-close pair ↔ Bigger gap"; "Sender's guess ↔ Too low"; "What the receiver focuses on ↔ The surprise" (Q43-Q45). |
| fb a | "The gap in value was larger when people were less close." | **S** | Q44. | Keep |
| fb b | "People missed more of the value in a less close tie." | **S** | Q44. | Keep |
| fb c | "A note that was a surprise had a larger value gap." | **S** | Q44 ("surprising context"). | "A note in a surprising moment had a larger gap." |
| fb d | "A rare note can mean more than the sender may guess." | **P** | "Rare" again. | "Receivers focused on the surprise, and that went with valuing it more." |
| fb e | "Senders thought their note would mean less than it did." | **S** | Q43. | Keep |
| fb f | "The sender guess was low next to what the friend felt." | **S** | Q43. | Keep |

## 10. Every number and every "studies found"

| Text in draft | Where | Verdict | Note |
|---|---|---|---|
| 46.83% | `disagree-and-end-s2` hook c fb; `disagree-and-end-5` answer | **S** | Q36, Study 2 only. |
| "About 47%", range 40-55 | `disagree-and-end-5` | **S** | Rounds Q36. |
| "almost half", "close to half" | `disagree-and-end-s2`, `-s3`, items | **S** | Q36. |
| "About 1 in 10" (distractor) | `disagree-and-end-s2` hook b | **S** | Correctly wrong for "sooner". 9.52% is the "longer" share; use it in the feedback (§8). |
| "About 5%" (distractor) | `disagree-and-end-5` | **S** | Correctly wrong. |
| "Study 2" | claim c7, hook c fb | **S** | Q36. |
| "three parts" | listening-c1, `listening-5` | **P** | Q15 is three parts, but the third is nonverbal and was not varied (Q20). |
| "four-part recipe" | disagree-and-end-c2 | **W** | Number right (Q28), claim text empty. |
| "months later" | listening-c6 | **S** | 11 months (Q24). |
| "next week" | `listening-s2` hook | **P** | Tested at 30 min, 2 weeks, 11 months. Fine as a scene. |
| "five experiments" | (not in draft) | — | Itzchakov; only in my rewrite of listening-c5. |
| "About 2", "About 4", "About 3 parts", "About 6 parts", "About 3 notes", "About 8 notes" | estimate items | **P/W** | Counts of scene lines, not findings. Replace (§9). |
| Scene numbers: 10 names in 10 min, 25 min, 8 people, ten times, before 10 | scenes | — | Scene detail, no claim. |
| "The studies found that group posts get less care…" | `reach-out-4` option b | **S** | A false option, correctly marked wrong. |
| "That effort is what made names stick in the studies" | `listening-s2` Show me fb | **P** | Group name games only. |
| "Plain negation scored lower on receptiveness and persuasion" | `disagree-and-end-s1` guided a | **P** | Persuasion not tested for negation alone. |
| "A bare 'hmm' made people feel the least understood" | `listening-s1` guided c | **P** | Study used "I see", "OK". |
| "Caring helps attention" | `listening-s2` guided c | **P** | Not in either paper. |
| "personal asks to experts" | `reach-out-2` fb b | **W** | Misreads Q42. |
| "The surprise … is part of why it lands well" | `reach-out-s2` guided a | **P** | Q45 is "compatible with". |
| "In studies" (Brooks) | `reach-out-s1` hook b | **S** | The abstract says "We find"; number of studies not checked. Safer: "In one paper's lab studies". |

## 11. Wording-risk list (guilt, manipulation, stereotype, advice)

| Where | Risk | Fix |
|---|---|---|
| Topic title "Talk to anyone" | Overpromise (outline flagged it) | Naming is cj4 Job 4's call; e.g. "Easier conversations". |
| `reach-out` quest | Pulls the learner into WhatsApp at any hour | Add "In the daytime … Then close the app." (§5) |
| `follow-ups-s1` teach "help people like the asker" | Can read as a trick to be liked; Huang's effect runs through real care (Q4) | Rewrite in §8 says "shows you are listening". |
| `disagree-and-end-s1` uncle scene | Mild "uncle" trope; untested setting | Keep the scene, add the setting note (§3). |
| 4 × `-s3` Show me feedback filler | Teaches nothing | Rewrites in §8. |
| Joke distractors (`listening-s3` guided b, `disagree-and-end-s3` guided b, `reach-out-s3` guided b, `listening-5` b) | Make the answer obvious; no real wrong belief tested | Rewrites in §8, §9. |
| No guilt or shame copy found | — | None of the lines tell the learner what they ought to do or that they failed. |
| No health claims found | — | `listening-c5` is the closest ("feel less tense"); rewrite in §6 keeps it to "socially anxious while they talked", no therapy claim. |

## 12. Tally

Counted by script from the verdict column of §5-§9.

| Section | Units | S | P | W | R |
|---|---|---|---|---|---|
| §5 Concept fields (4 × hook, askLine, rule, quest) | 16 | 9 | 6 | 0 | 1 |
| §6 Claims | 29 | 20 | 6 | 3 | 0 |
| §7 Misconceptions | 10 | 8 | 2 | 0 | 0 |
| §8 Steps (12 × hook stem, teach, visual, Show me, Show me fb, guided stem, takeaway = 84; plus 32 hook fb and 32 guided fb) | 148 | 87 | 46 | 7 | 8 |
| §9 Items (24 items + 66 option fb) | 90 | 59 | 21 | 9 | 1 |
| **Total** | **293** | **183** | **81** | **19** | **10** |

§10 re-lists 18 numbers and "studies found" lines already judged above; they are not added to the total.
