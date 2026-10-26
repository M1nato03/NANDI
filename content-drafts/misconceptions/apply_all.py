# Apply misconception tags, reviewed new misconceptions, pass-2 rewrites and cj3 swaps to a content tree.
# Usage: python -I apply_all.py <content root> [--write]
import json, glob, os, re, sys, collections
sys.stdout.reconfigure(encoding="utf-8")
B = "D:/nandi-gate-logs/idea-engine/mtags/"
root = sys.argv[1]; write = "--write" in sys.argv

tags = json.load(open(B + "misconception-tags.json", encoding="utf-8"))
p2 = {}
for f in ("out2-a.json", "out2-b.json"):
    for t in json.load(open(B + f, encoding="utf-8"))["topics"]:
        for v in t["verdicts"]: p2[(t["topic"], v["itemId"], v["optionId"])] = v
REJECT = set(json.load(open(B + "p2-reject.json", encoding="utf-8"))) if os.path.exists(B + "p2-reject.json") else set()

packs = {}
for f in sorted(glob.glob(root + "/content/topics/*.json")):
    packs[os.path.basename(f)[:-5]] = (f, json.load(open(f, encoding="utf-8")))

stats = collections.Counter(); problems = []; slips = []; rewrites = []
ABS = re.compile(r"\b(always|only|every|never|nothing|all|just)\b", re.I)
words = lambda s: len(s.split())
for T in tags["topics"]:
    f, d = packs[T["topic"]]
    concepts = {c["id"]: c for m in d["body"]["modules"] for c in m["concepts"]}
    items = {it["id"]: (c, it) for c in concepts.values() for it in c["items"]}
    for m in T["newMisconceptions"]:
        c = concepts[m["conceptId"]]
        if any(x["id"] == m["id"] for x in c["misconceptions"]): problems.append(f"{m['id']} exists"); continue
        c["misconceptions"].append({"id": m["id"], "name": m["name"], "correction": m["correction"], "sourceRefs": m["sourceRefs"]})
        stats["misconceptions added"] += 1
    for x in T["tags"]:
        c, it = items[x["itemId"]]
        o = next(o for o in it["options"] if o["id"] == x["optionId"])
        ids = x["misconceptionIds"]
        if x["verdict"] == "weak":
            v = p2.get((T["topic"], x["itemId"], x["optionId"]))
            if v is None: problems.append(f"{x['itemId']}/{x['optionId']}: no pass-2 verdict"); continue
            stats["weak:" + v["verdict"]] += 1
            k = f"{T['topic']}:{x['itemId']}/{x['optionId']}"
            if v["verdict"] == "slip": slips.append((k, o["text"], v["why"])); continue
            if v["verdict"] != "rewrite": continue
            if k in REJECT: stats["rewrite rejected in review"] += 1; continue
            mid = v["misconceptionId"]
            if mid not in {m["id"] for m in c["misconceptions"]}: problems.append(f"{k}: unknown {mid}"); continue
            sib = [s["text"] for s in it["options"] if s["id"] != o["id"]]
            if words(v["newText"]) > max(words(s) for s in sib) + 4: problems.append(f"{k}: rewrite too long")
            if ABS.search(v["newText"]): problems.append(f"{k}: absolute word in {v['newText']!r}")
            if any(" ".join(v["newText"].lower().split()[:3]) == " ".join(s.lower().split()[:3]) for s in sib): problems.append(f"{k}: same first 3 words as a sibling")
            if words(v["newFeedback"]) > 30: problems.append(f"{k}: feedback {words(v['newFeedback'])} words")
            rewrites.append((k, o["text"], v["newText"], mid))
            o["text"], o["feedback"] = v["newText"], v["newFeedback"]
            ids = [mid]
        if ids:
            o["misconceptionIds"] = ids
            it["misconceptionTags"] = list(dict.fromkeys(it["misconceptionTags"] + ids))
            stats["options tagged"] += 1

# cj3 guided-try swaps (step options have no misconception field)
sys.argv = ["x", B + "cj3-guided-tries.md", root]
rows = []
for line in open(B + "cj3-guided-tries.md", encoding="utf-8"):
    if not line.startswith("| `"): continue
    mm = re.search(r'Replace ([a-d]) \("(.+?)"\) with \*\*"(.+?)"\*\*', line)
    if not mm: continue
    cols = [c.strip() for c in line.strip().strip("|").split(" | ")]
    rows.append((cols[0].strip("`"), mm.group(1), mm.group(2), mm.group(3), cols[-1]))
steps = {s["id"]: s for (_, d) in packs.values() for m in d["body"]["modules"] for c in m["concepts"] for s in c["steps"]}
norm = lambda t: re.sub(r"\s+", " ", t).strip().rstrip(".").lower()
for sid, opt, old, new, fb in rows:
    s = steps.get(sid)
    if not s: continue
    for g in s["guided"]:
        for o in g["options"]:
            if o["id"] == opt and not o["correct"] and norm(o["text"]) == norm(old):
                sib = [x["text"] for x in g["options"] if x is not o]
                if words(new) > max(words(x) for x in sib) + 4: problems.append(f"cj3 {sid}/{opt}: too long vs current siblings")
                o["text"], o["feedback"] = new, fb
                stats["cj3 swaps applied"] += 1

print(dict(stats)); print("problems:", len(problems)); [print("  ", p) for p in problems]
json.dump({"slips": slips, "rewrites": rewrites}, open(B + "applied-summary.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
if write:
    for f, d in packs.values():
        open(f, "w", encoding="utf-8", newline="\n").write(json.dumps(d, ensure_ascii=False, indent=2) + "\n")
    print("written")
