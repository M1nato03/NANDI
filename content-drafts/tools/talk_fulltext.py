# cj7 Job 8: apply the full-text check of the Talk sources to the draft pack and write the patch file.
# Usage: python3 -I content-drafts/tools/talk_fulltext.py content-drafts/topic.talk-to-anyone.json content-drafts/talk-fulltext.patch.json
import json, re, sys

pack_path, patch_path = sys.argv[1], sys.argv[2]
d = json.load(open(pack_path, encoding="utf-8"))
concepts = {c["id"]: c for c in d["body"]["modules"][0]["concepts"]}
ro = concepts["reach-out"]

BROOKS = "https://www.hbs.edu/ris/Publication%20Files/Advice%20Seeking_59ad2c42-54d6-4b32-8517-a99eeae0a45c.pdf"
LIU = "https://www.apa.org/pubs/journals/releases/psp-pspi0000402.pdf"

def by_id(rows, i):
    return next(r for r in rows if r["id"] == i)

def resolve(path):
    """Path like 'steps[reach-out-s1].hook.options[b].feedback' inside the reach-out concept."""
    obj, parts = ro, re.findall(r"([a-zA-Z]+)(?:\[([^\]]+)\])?", path)
    for n, (key, idx) in enumerate(parts):
        last = n == len(parts) - 1
        if idx:
            rows = obj[key]
            if idx.isdigit():
                if last: return rows, int(idx)
                obj = rows[int(idx)]
            else:
                pos = next((k for k, r in enumerate(rows) if r.get("id") == idx), None)
                if last: return rows, pos
                obj = rows[pos]
        else:
            if last: return obj, key
            obj = obj[key]

new_claim = {
    "id": "reach-out-c8",
    "text": "In one US campus study, students sent a check-in note to a classmate. On a 1 to 7 scale, senders guessed about 5.6. The classmates gave about 6.2.",
    "sourceRefs": ["liu-2023"],
}

new_estimate = {
    "id": "reach-out-5",
    "type": "estimate",
    "conceptId": "reach-out",
    "step": "reach-out-s3",
    "job": "combine",
    "difficultySeed": 2,
    "misconceptionTags": [],
    "sourceRefs": ["liu-2023"],
    "stem": "Students sent a reach-out note to a classmate they hadn't talked to in a while. Senders guessed about 5.6 out of 7. How did the classmates rate it?",
    "options": [
        {"id": "a", "text": "About 6.2 out of 7.", "correct": True,
         "feedback": "Higher than the senders guessed. The classmates valued the note more, by about 0.6 of a point.",
         "sourceRefs": ["liu-2023"]},
        {"id": "b", "text": "About 4.5 out of 7.", "correct": False,
         "feedback": "That would be lower than the guess. In the study, the classmates rated the note higher than senders expected.",
         "sourceRefs": ["liu-2023"]},
    ],
    "answer": {"value": 6.17, "min": 5.8, "max": 6.6, "unit": "points out of 7"},
}

Q = {
 "brooks-easy": ("Study 3, p. 1428 and General Discussion, p. 1431: \"when the task is easy, asking for advice confers no benefit. "
                 "Interestingly, even when the task was easy, seeking advice did not harm perceptions of competence.\""),
 "brooks-setting": ("Pilot Study A and Study 5 recruited adults via Amazon's Mechanical Turk (pp. 1424, 1430); "
                    "Pilot Study B and Studies 1-4 were run with students at US universities (pp. 1424-1429)."),
 "liu-weak": ("Experiment 7, advance online version p. 14: \"Initiators significantly underestimated responders' appreciation of being "
              "reached out to, both in the case of weak tie reach-outs ... and ... to a lesser extent in the case of strong tie reach-outs\" "
              "(weak tie: initiators 5.24 vs responders 5.92; strong tie: 6.35 vs 6.65, on 1-7)."),
 "liu-exp2": ("Experiment 2, advance online version pp. 7-8: students wrote a note \"to check in and say hello\" to a classmate they had "
              "\"not interacted (either virtually or in-person) in a while\"; \"Initiators (M = 5.57, SD = 1.35) significantly underestimated "
              "how much their reach-outs were appreciated compared to how much responders (M = 6.17, SD = 1.24) appreciated them\" "
              "(1 = not at all, 7 = a great extent; 54 dyads)."),
}

changes = [
 ("misconceptions[reach-out-m1].correction", "On easy tasks, asking gave no boost, but it did no harm either.", Q["brooks-easy"], BROOKS),
 ("steps[reach-out-s1].guided[0].options[a].feedback", "On easy tasks, asking gave no boost in the studies, though it did no harm.", Q["brooks-easy"], BROOKS),
 ("steps[reach-out-s1].hook.options[b].feedback", "The effect was strongest for hard tasks and expert advisers. These were lab and online studies, not offices.", Q["brooks-setting"], BROOKS),
 ("misconceptions[reach-out-m3].correction", "Less-close people still valued it, and senders underrated them even more.", Q["liu-weak"], LIU),
 ("steps[reach-out-s2].guided[0].options[b].text", "Skip it. A friend from months ago won't care.", Q["liu-weak"], LIU),
 ("steps[reach-out-s2].guided[0].options[b].feedback", "In the studies, even less-close people valued a check-in more than senders guessed.", Q["liu-weak"], LIU),
 ("claims[reach-out-c8]", new_claim, Q["liu-exp2"], LIU),
 ("items[reach-out-5]", new_estimate, Q["liu-exp2"], LIU),
 # Not a source fix: replacing reach-out-5 pushed the right-answer-is-longest share just over 40% (validator R5),
 # so one wrong option gets two more words. The meaning (a hard task, asked of an expert) is unchanged.
 ("items[reach-out-1].options[a].text", "Ask an expert about a tricky data fix.",
  "Length balance only (validator R5). Study 3 and Study 5 still support this as the competent kind of ask (pp. 1428, 1431).", BROOKS),
]

patch = []
for field, new, quote, url in changes:
    container, key = resolve(field)
    if key is None:  # a new row
        old = None
        container.append(new)
    else:
        old = container[key]
        container[key] = new
    patch.append({"id": field.split("[")[1].split("]")[0] if "[" in field else "reach-out", "field": "reach-out." + field,
                  "old": old, "new": new, "quote": quote, "url": url})

open(pack_path, "w", encoding="utf-8", newline="\n").write(json.dumps(d, ensure_ascii=False, indent=2) + "\n")
open(patch_path, "w", encoding="utf-8", newline="\n").write(json.dumps(patch, ensure_ascii=False, indent=2) + "\n")
print(len(patch), "changes")
