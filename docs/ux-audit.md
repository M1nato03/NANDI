# Mobile consistency audit

Captured at 390 × 844 in dark and light with a seeded week. The local tour is `node_modules/.bin/tsx.cmd scripts/ux-tour.ts before|after`; images stay in the ignored `.ux-audit/` folder. The baseline was captured before the changes listed here. The route list includes the Now deck at noon and 23:30, each Plan ritual, You and its subroutes, training hub/history/metrics/session, Night, Backup, and the recap sheet. The metrics image is a viewport crop at the Progression section.

## Issues

| # | Screen or element | Finding and resolution | Status |
|---|---|---|---|
| 1 | All screens | Main headings varied in size and spacing. Set one responsive screen heading scale. | Fixed |
| 2 | All screens | Section headings jumped between scales. Unified `h2` and `h3` hierarchy. | Fixed |
| 3 | All screens | Eyebrows sat at inconsistent distances from titles. Set shared top spacing. | Fixed |
| 4 | All screens | Cards used inconsistent interior and exterior spacing. Set a shared card rhythm. | Fixed |
| 5 | Paired actions | Buttons in the same row differed in height and radius. Set shared row control sizing. | Fixed |
| 6 | Plan actions | Short and long labels squeezed into unequal buttons. Balanced widths and wrapping. | Fixed |
| 7 | Morning priority | The priority action competed with the task text at phone widths. Let it wrap below. | Fixed |
| 8 | Morning capacity | Long capacity heading crowded the card. Reduced its responsive size. | Fixed |
| 9 | Plan steps | Small inline step labels looked like another heading. Gave them a smaller text style. | Fixed |
| 10 | Planner form | Inputs and labels could force horizontal overflow. Allowed them to shrink. | Fixed |
| 11 | Rituals | Three buttons had tight, uneven text. Increased hit area and tuned label size. | Fixed |
| 12 | You links | Large link tiles had excess empty space. Set a consistent compact height. | Fixed |
| 13 | Mind hub | Today chips had uneven vertical alignment and low contrast. Aligned content and strengthened secondary text. | Fixed |
| 14 | Mind courses | An expanded card nested another card frame. Flattened the course container border. | Fixed |
| 15 | Practice boards | Difficulty controls varied in height and radius. Unified them. | Fixed |
| 16 | Night deck | A second background and large empty minimum height made a double frame. Removed the outer frame and forced height. | Fixed |
| 17 | Training metrics | Long movement names and step text collided. Used aligned label and value columns. | Fixed |
| 18 | Training history | Date and workout description lacked a stable baseline. Aligned history rows. | Fixed |
| 19 | Recap sheet | Preview and paired actions were cramped at phone width. Adjusted sheet padding and control sizing. | Fixed |
| 20 | 360 px layout | Side gutters and quest heading actions could crowd the screen. Reduced gutters and wrapped quest actions. | Fixed |
| 21 | Case | Date appeared as a raw day key. Formatted it as a weekday and date. | Fixed |
| 22 | Backup preview | Restore date range showed ISO dates. Formatted both dates. | Fixed |
| 23 | Weekly review | Upcoming checkpoint dates showed ISO dates. Formatted them. | Fixed |
| 24 | Train finish | Raw status and ISO date appeared beside the result. Used a readable date and status. | Fixed |
| 25 | Train history | Template key and raw status appeared in rows. Used the workout name and plain status. | Fixed |
| 26 | Train progression | Internal movement keys and compact counters appeared in metrics. Used plain names and readable steps. | Fixed |
| 27 | Train consistency | An empty week led with `0 of 3` and `0 consecutive weeks`. Used a warm first step. | Fixed |
| 28 | Task list | Generic empty text offered no context. Added gentle Today and Later lines. | Fixed |
| 29 | Mind reviews | `Nothing due` felt abrupt. Used a reassuring completion line. | Fixed |
| 30 | Mind and You mastery | An empty map displayed `0 strong concepts`. Used a line about ideas taking shape. | Fixed |
| 31 | Night route in browser | Android-only controls left a blank page. Added a short explanation and Settings pointer. | Fixed |
| 32 | Learn topic tiles | Dense concept chips create a long scroll in light mode. A larger information redesign would change the learning flow, so this remains for a separate pass. | Not fixed |
| 33 | Full-page captures | The fixed bottom nav crosses content in a stitched full-page screenshot. This is a capture artifact; in the viewport the nav stays at the bottom. | Not fixed |

## Before and after pairs

The ten most visible pairs (all paths relative to the repo root):

| Screen | Before | After |
|---|---|---|
| Plan, dark | `.ux-audit/before/dark/plan.png` | `.ux-audit/after/dark/plan.png` |
| Morning plan, light | `.ux-audit/before/light/plan-morning.png` | `.ux-audit/after/light/plan-morning.png` |
| Shutdown, dark | `.ux-audit/before/dark/plan-shutdown.png` | `.ux-audit/after/dark/plan-shutdown.png` |
| Weekly review, light | `.ux-audit/before/light/plan-review.png` | `.ux-audit/after/light/plan-review.png` |
| You, dark | `.ux-audit/before/dark/you.png` | `.ux-audit/after/dark/you.png` |
| Mind hub, dark | `.ux-audit/before/dark/you-mind.png` | `.ux-audit/after/dark/you-mind.png` |
| Case, light | `.ux-audit/before/light/you-mind-case.png` | `.ux-audit/after/light/you-mind-case.png` |
| Train hub, light | `.ux-audit/before/light/you-train.png` | `.ux-audit/after/light/you-train.png` |
| Train history, dark | `.ux-audit/before/dark/you-train-history.png` | `.ux-audit/after/dark/you-train-history.png` |
| Recap share, dark | `.ux-audit/before/dark/recap-share.png` | `.ux-audit/after/dark/recap-share.png` |

## Verification

The tour checks the interactive Mind routes and throws if any capture fails. The seed lives only in the Playwright browser context and does not touch a real user's data. `npm.cmd run typecheck`, `npm.cmd run lint`, `npm.cmd run test` (301 tests), `npm.cmd run banned-words`, and `node_modules/.bin/tsx.cmd scripts/copy-lint.ts` passed. The changed backup and training Playwright cases printed `ok` for all 10 runs across 390 px and 360 px in Edge; the Playwright process did not exit after the last case and was interrupted during teardown.
