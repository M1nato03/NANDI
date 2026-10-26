# Merge Codex A/B tagging with the idea engine's review of the proposed new misconceptions.
import json, sys, collections
sys.stdout.reconfigure(encoding="utf-8")
B = "D:/nandi-gate-logs/idea-engine/mtags/"

DROP = {  # not a belief people hold, a near-copy of the claim, or unsafe
  "inflation-m5", "diversification-m5", "shares-m5", "index-funds-m5", "phone-camera-m5", "phone-camera-m6",
  "phone-camera-m7", "sky-colours-m4", "sky-colours-m5", "protein-foods-m5", "hydration-cues-m4",
  "muscle-protein-rest-m5", "muscle-protein-rest-m8", "heat-hydration-m4", "warmup-myths-m5", "indus-cities-m6",
  "silk-road-ideas-m4", "printing-and-reading-m4",
  ("topic.body-training", "sleep-recovery-m5"),
}
MERGE = {  # into another new one of the same concept
  "sleep-memory-m6": "sleep-memory-m5", "protein-foods-m7": "protein-foods-m8", "muscle-protein-rest-m7": "muscle-protein-rest-m6",
  "food-labels-m7": "food-labels-m6", ("topic.health-nutrition", "sleep-recovery-m6"): "sleep-recovery-m5",
}
RENAME = {
  "sleep-memory-m3": "Staying up beats sleeping after study",
  "compounding-m4": "Interest only grows the first amount",
  "upi-scams-m5": "Scanning a QR can get you money",
  "upi-path-m5": "My UPI ID lets others take money",
  "pressure-cooker-m5": "Up high, heat leaks into thin air",
  "loss-aversion-m4": "One differing study disproves the average",
}
NOTES = {
  "heat-hydration-m4": "Dropped: its correction told people to drink during the session, which goes past claim c3 (forcing water raises risk).",
  "muscle-protein-rest-m8": "Dropped: a medical caution, not a misconception the lesson teaches.",
}

def key(topic, mid):
    return (topic, mid) if (topic, mid) in DROP or (topic, mid) in MERGE else mid

out = {"draft": "Misconception tags for every untagged wrong option (spec 23 §4). Codex A/B proposed, idea engine reviewed. For editors.",
       "basedOn": "origin/content-walk eb4d352", "topics": []}
stats = collections.Counter()
for f in ("out-a.json", "out-b.json"):
    for t in json.load(open(B + f, encoding="utf-8"))["topics"]:
        topic = t["topic"]
        keep = []
        for m in t["newMisconceptions"]:
            k = key(topic, m["id"])
            if k in DROP: stats["new dropped"] += 1; continue
            if k in MERGE: stats["new merged"] += 1; continue
            m = dict(m); m["name"] = RENAME.get(m["id"], m["name"]); keep.append(m)
        kept_ids = {m["id"] for m in keep}
        tags = []
        for x in t["tags"]:
            x = dict(x); ids = []
            for mid in x["misconceptionIds"]:
                k = key(topic, mid)
                if k in DROP: continue
                ids.append(MERGE.get(k, mid))
            ids = list(dict.fromkeys(ids))
            if x["verdict"] == "new" and not any(i in kept_ids for i in ids):
                existing = [i for i in ids if i not in kept_ids]
                if not existing:
                    x["verdict"] = "weak"; x["why"] = "Proposed misconception dropped in review; " + x["why"]
            x["misconceptionIds"] = ids if x["verdict"] != "weak" else []
            stats[x["verdict"]] += 1
            tags.append(x)
        out["topics"].append({"topic": topic, "newMisconceptions": keep, "tags": tags})
out["reviewNotes"] = NOTES
json.dump(out, open(B + "misconception-tags.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(dict(stats), "new kept:", sum(len(t["newMisconceptions"]) for t in out["topics"]))
