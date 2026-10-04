# Kickoff prompts for Claude Code

Put this whole handover folder in a new, empty project folder (for example `prime-pocket/`), open Claude Code in it, and paste the first prompt. Later prompts are for the start of each phase.

---

## Prompt 1: kickoff (paste once)

```
You're building Prime Pocket, my personal offline Android app (Tasks + Train + Mind, one reward economy, an original theme called "The Proving Ground"). Everything you need is in this folder.

1. Read HANDOVER.md completely, then CLAUDE.md, then skim docs/research-brief.md. Then read docs/specs/01-architecture.md, docs/specs/05-economy.md §2 (rules.config.ts), docs/specs/07-content-packs.md §2 (pack schemas), docs/specs/04-mind.md §1 (legacy port) and legacy/README.md.
2. Ask me the kickoff questions in HANDOVER.md section 6, all in ONE message. Use the defaults for anything I skip.
3. Then plan Phase 0 (Foundation) in plan mode, leave plan mode, and write the plan to docs/plans/phase-0.md: tasks, order, risks, test plan. Show me a 5–8 line summary and continue unless I object.
4. Build Phase 0 test-first. Keep src/core pure and fully unit-tested. Port the legacy generators and lessons without changing their behaviour; their existing tests must still pass. Use subagents for independent work (e.g. porting generators, converting packs, writing the backup round-trip test).
5. Before you call Phase 0 done, run a separate review subagent that hasn't seen the work. It checks the code against HANDOVER.md's non-negotiables and the Phase 0 exit checks, and you fix what it finds.
6. Finish with: what shipped, how to install it on my phone, what I need to test, and any decisions you logged in DECISIONS.md.

Rules: never break the non-negotiables in HANDOVER.md section 2. Every tunable number goes in src/core/rules.config.ts. Ask me only about product trade-offs, anything that could lose data, or paid services.
```

---

## Prompt 2: start Phase 1 (build the three modes, ~12 Oct)

```
Phase 0 is on my phone. Start Phase 1 from HANDOVER.md section 5. Read docs/specs/02-tasks.md, 03-train.md and 04-mind.md first. Plan, then write docs/plans/phase-1.md, summarise in 5–8 lines, and build test-first. The economy stays hidden (ledger facts written silently, debug screen only), and postpone-budget enforcement stays off. Include the nightly log, the morning back-fill card and the weekly summary export (docs/specs/07-content-packs.md section 4). Run the review subagent before finishing. End with the install steps and what I should do every day during the baseline week (19–25 Oct) so the data is useful.
```

## Prompt 3a: start Phase 2 native work (~19 Oct, while I log the baseline in the PWA)

```
I'm logging my baseline week in the PWA. Start Phase 2's native work from HANDOVER.md section 5: read docs/specs/01-architecture.md sections 6 and 8, 05-economy.md and 06-theme.md. Build the Capacitor APK with ONE shared signing keystore (GitHub secret + tell me to save a copy in my password manager), pinned androidScheme/hostname, exact reminders, the rest-timer backstop, and the economy UI and Proving Ground theme behind a flag. Don't migrate my data yet. Walk me through docs/device-test-checklist.md with a test install and fix whatever fails.
```

## Prompt 3b: switch over (~26 Oct, after the baseline week)

```
Here's my baseline week export: [attach prime-pocket-week-….json]. Set the postpone budget from it (02-tasks.md section 3), migrate my data from the PWA to the APK by export/import (back up first, verify counts), retire the PWA copy, and turn the economy on (economyVisibleFrom = today). Summarise what changed and what I'll see tomorrow.
```

## Prompt 4: start Phase 3 (Season 1)

```
Start Phase 3 (Season 1 from Monday 2 Nov) from HANDOVER.md section 5: season ladder with ghost rivals and a named rival, Shards shop, share cards, technique cards with the three-rung hint ladder, the mystery meta-arc (write four bundled Arc packs and four shop catalogues, so seasons never depend on Claude), hexagon and mastery tracks, the Number Path logic solver, and the live content-pack pipeline. Plan, build test-first, review, and tell me what to expect on 2 Nov.
```

## Prompt for later: new content from a weekly review

```
Here's my week: [attach weekly summary]. Write a new content pack per docs/specs/07-content-packs.md: [e.g. 'a 10-lesson "Money basics for an Indian student" lessons pack, situation-first, every number date-stamped and sourced']. Validate it, bump versions, commit and deploy. If my data suggests a rule needs retuning, propose a bounded `rules` pack with the reason, but ask me before shipping it.
```
