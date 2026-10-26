# Task 2: weak wrong options — keep as a slip, or rewrite to state a misconception (NANDI Learn, spec 23 §4)

Read-only: do not change any file. Input: `<topic>.weak.json`. Each concept lists its claims, its misconceptions
(existing, plus reviewed new ones marked `new`) and `weakOptions`: wrong options a first review found state no
misconception. Each weak option comes with its full item (stem, all options with the right one marked, feedback).

Also read `cj3-guided-tries.md` §"Checks run on the proposals" for the house rules on distractors.

## For EVERY weak option give exactly one verdict
1. `slip`: a real mistake a learner makes while working (a maths slip such as doubling the wrong number, misreading
   a date, or using the wrong line of a table). Keep it. Its feedback already explains the slip. Give no rewrite.
   Use this only when the slip is a likely one, not any wrong number.
2. `rewrite`: filler, a joke, or an option nobody would pick for a reason. Write ONE replacement wrong option that
   states one of the concept's listed misconceptions (give its id), plus its feedback line.
3. `fine`: on reflection, it is a reasonable-sounding wrong idea that needs no misconception tag (rare; say why).

## Rules for a rewrite (all must hold)
- The new option states the misconception as a belief, in plain words (Flesch 60+), with no guilt, no jokes, and no
  "always", "only", "every", "never", "nothing", "all" or "just".
- At most 4 words longer than the longest sibling option. Do not copy a sibling's first three words.
- The right option stays the only defensible answer. The new option must be clearly wrong by the concept's claims.
- Feedback: 1-2 short sentences, at most 30 words. Say why it is wrong from the claims, then point to the right idea.
  No new facts or numbers beyond the claims and the item's own text. No "you should", no health, body or money promises.
- Indian settings in the stem stay as they are. Do not change the stem or the right option.

## Output: ONLY one JSON object
{"topics":[{"topic":"topic.x","verdicts":[
  {"itemId":"...","optionId":"c","verdict":"slip"|"rewrite"|"fine","why":"<= 15 words",
   "misconceptionId":"<id, rewrite only>","newText":"<rewrite only>","newFeedback":"<rewrite only>"}
]}]}
Every weak option in your topics appears exactly once.
