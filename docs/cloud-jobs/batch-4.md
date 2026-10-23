# Cloud job batch 4: "useful now" life-skill topics (idea engine, 23 Oct 2026)

Jenil's idea (23 Oct): instead of school-style topics, teach things that are useful now and feel worth the time, the
way these YouTube videos do. Examples he shared:
- how to switch from watching to creating
- can Patrick Jane solve the Drishyam case (deduction)
- a Sudoku secret
- how to look good in every picture
- how I won 11 hackathons
- why you're always tired, 8 hours ≠ rested
- how to get your brain addicted to hard things, not cheap dopamine
- how to sell anything to anyone
- how to be more fun to talk to

The goal: give people a real reason to pick NANDI over scrolling, improve focus, and help them in their work.

How to run: one cloud session runs EVERY job below as its own subagent, at least 3 at a time, until all 5 are done.
Each job writes ONE report under docs/reviews/ and pushes it on its OWN new branch named below. Never push main or any
existing branch, never open a PR, never change app code or content JSON. Network access is open: open real sources
and quote them with URLs; if a page cannot be opened, say so. YouTube creators and self-help blogs are INSPIRATION,
never evidence. Evidence = peer-reviewed papers, meta-analyses, university or government pages, or named experts'
books with the claim checked. Plain English, short lines, tables, no praise. At the end, list each branch + commit +
3-line summary.

NANDI = offline learning + habits app for Indian adults 18-25 (React + Capacitor). Lessons are 2-minute steps: a hook
question, a teach card of 30 words or fewer, a "Show me" example, one guided try, then spaced practice questions on
later days. Hard rules: no dark patterns, guilt, loss states, random rewards or endless feeds; no firearm content; no
health promises; sourced facts only; nothing leaves the phone. Current topics: Psychology, Money, History, Health,
Body, How things work. Competitor doing "practical skills" short videos: Seekho (100M downloads; top categories
English speaking, part-time income, sarkari kaam, business, finance, Instagram growth).

## Job 1 · What 18-25 Indians want to learn (branch ideas/cj4-demand)
Find evidence of which practical skills Indian 18-25s seek out:
- YouTube India and Google Trends India for "how to" skill searches (2024-2026)
- Seekho, Josh Talks, Unacademy and Coursera India category data
- surveys (Naukri, LinkedIn, India Skills Report, NSSO/PLFS youth data)
- top Indian skill-creator channels
Rank 15-20 candidate skill tracks by demand. For each, give the evidence and who wants it (students, first job,
creators). Include Jenil's examples and test them against the data. Flag tracks that are scam-prone in India
("earn money fast", trading tips, MLM) and say how a safe version would differ.
Report docs/reviews/cj4-demand.md.

## Job 2 · Which skill tracks have real evidence (branch ideas/cj4-evidence)
For each of these candidate tracks, find what the research actually supports and what is myth:
1. Conversation and being fun to talk to (e.g. Huang et al. 2017, question-asking and liking; responsiveness)
2. Selling and persuasion, done ethically (needs discovery, listening, negotiation research such as Harvard PON)
3. Creating, not just consuming (habit of making, the first 10 posts or projects, feedback loops)
4. Winning projects and hackathons (scoping, teamwork, demos)
5. Energy and rest (sleep regularity vs duration; why "8 hours ≠ rested")
6. Focus and "cheap dopamine": what is pseudoscience (dopamine detox chemistry claims) vs what works (stimulus control,
   friction, implementation intentions, effort-reward)
7. Reasoning like a detective (inference, base rates, alternative explanations)
8. Presenting yourself (posture, light, confidence), with care around body image for 18-25s
For each track give:
- 5-8 teachable claims with a source quote
- the common myths to correct
- risks (body image, manipulation, health)
- whether 2-minute lessons plus real-world practice can move it
Report docs/reviews/cj4-evidence.md.

## Job 3 · Learning that transfers to real life (branch ideas/cj4-transfer)
What makes a skill learned in an app show up in real life? Review:
- transfer-of-training research
- behavioural skills training (instruct, model, rehearse, feedback)
- implementation intentions
- spaced practice
- "do it today" micro-missions, and reflection prompts
Recommend a lesson add-on NANDI could ship: for example, after a life-skill lesson, one tiny real-world mission
("ask 3 follow-up questions in one conversation today"), checked off the next day with a one-line reflection.
Cover:
- how to make it feel worth doing without guilt, streak pressure or random rewards
- how it fits the existing Plan/Tasks and ledger design (read src/core/tasks and src/core/economy on origin/main)
- a kill test
Report docs/reviews/cj4-transfer.md.

## Job 4 · Why those videos feel worth it, done honestly (branch ideas/cj4-packaging)
Study what makes the example titles and thumbnails above compelling. Name each mechanism: outcome promise, identity,
curiosity gap, specificity, social proof, a story or a known character (Drishyam/Mentalist). Cite research on curiosity
and the information gap (Loewenstein 1994 and later work) and on clickbait backlash.
Then rewrite NANDI's 6 current topic names and 10 sample lesson hooks (read content/topics/*.json on origin/main) in
an outcome-first, honest style that keeps the curiosity without clickbait or false promises. Use English, plus a
Hinglish variant for 5 of them. Say which hooks would break the no-dark-patterns rule if pushed further.
Report docs/reviews/cj4-packaging.md.

## Job 5 · A pilot track outline: "Talk to anyone" (branch ideas/cj4-pilot-outline)
Using only evidence you can source, outline one 8-idea life-skill track for Indian 18-25s on conversation skills.
Examples: asking follow-up questions, listening signals, small talk to real talk, remembering names, disagreeing
kindly, ending a conversation well, talking to seniors or interviewers, and group chats. For each idea, give:
- the claim and its source quote
- a hook question
- a 30-word teach card draft
- a Show me example with 3 or more parts
- one guided try with a misconception distractor
- one "do it today" mission
Indian settings: college, hostel, internship, family functions, WhatsApp groups. Mark everything DRAFT FOR EDITORS;
the content team rewrites it to NANDI's pack format. Report docs/reviews/cj4-pilot-outline.md.
