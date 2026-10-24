# Apply the Codex B review (idea-engine/codex-review-fieldtries.md) to field-tries-2026-10-24.json, as accepted by the
# idea engine. Usage: python -I field_tries_fix1.py <json>
import json, sys
path = sys.argv[1]
d = json.load(open(path, encoding="utf-8"))
# key: (topic suffix or None, conceptId) -> field updates
F = {
 (None, "progressive-overload"): {"detail": "Count how many times you carry a bag up stairs today; add no extra trips.", "smaller": "Notice one bag you already carry today."},
 ("body-training", "sleep-recovery"): {"detail": "This morning, note when you put the phone down last night and when you woke.", "smaller": "Note when you woke this morning.", "cues": ["After waking", "At breakfast"]},
 (None, "cardio-talk-test"): {"detail": "On a walk you already take, silently note if you could say a full sentence.", "smaller": "After stairs you already take, notice your breath."},
 (None, "showing-up"): {"detail": "After one daily act, notice if a short walk or stairs already follows it.", "smaller": "Name one daily act that a walk already follows."},
 (None, "protein-foods"): {"detail": "At one meal today, note if it has a cereal, millet or pulse. None counts too."},
 (None, "hydration-cues"): {"notice": "Water, lower-fat milk and lower-sugar drinks, including tea and coffee, all count towards daily fluid."},
 ("health-nutrition", "sleep-recovery"): {"detail": "Today, note if you woke near your usual time. Set no new wake time.", "smaller": "Note when you woke this morning.", "cues": ["After waking", "At breakfast"]},
 (None, "food-label-reading"): {"detail": "Compare two similar packs on the same per-100 g or per-100 ml line."},
 (None, "fad-diet-claims"): {"notice": "No one food gives all the key nutrients."},
 (None, "indus-cities"): {"detail": "On a usual walk, spot one drain cover from the footpath. Stay away from openings.", "smaller": "Spot one drain cover from the footpath."},
 (None, "silk-road-ideas"): {"notice": "Monks who appear to have been forced out of Gandhara took its art style to Afghanistan and Central Asia.", "settings": ["A friend from another state", "A willing family member"]},
 (None, "indian-place-value"): {"detail": "Find one price with a zero inside it, and name the zero's place.", "settings": ["On a price tag", "On a receipt total"]},
 (None, "printing-and-reading"): {"detail": "Spot one printed notice put up where many people can see it.", "smaller": "Spot one printed notice today."},
 (None, "mughal-revenue"): {"detail": "On one bill or public form, find a date or record number. Keep personal details private.", "smaller": "Find the date on one receipt you already have."},
 (None, "multirotor-turns"): {"detail": "Tilt a book once, and point where a push out of its top face would go.", "smaller": "Tilt a book and point where its top face points."},
 (None, "upi-path"): {"detail": "At a shop QR stand, read the printed payee name or UPI ID. No scan, no payment.", "smaller": "Spot one shop QR stand without scanning it.", "cues": ["At a shop counter", "On a usual errand"]},
 (None, "phone-camera"): {"detail": "Photograph one plain object in bright and dim light. Keep people out.", "smaller": "Take one dim-light photo of a plain object.", "settings": ["A plain object on a table", "Outdoors at dusk"]},
 (None, "sky-colours"): {"smaller": "At midday, look away from the Sun and name the sky colour."},
 (None, "rule-of-72"): {"detail": "Find one yearly interest rate in an ad, and divide 72 by it.", "smaller": "Spot one yearly interest rate in an ad."},
 (None, "diversification"): {"notice": "Four or five shares are not a real spread; a spread runs across many industries."},
 (None, "emergency-fund"): {"detail": "Look at one thing you use daily, and name a repair it could need without warning.", "smaller": "Name one possible repair for something you use."},
 (None, "upi-scams"): {"detail": "At a shop, spot one UPI QR stand, and recall: getting money needs no scan.", "smaller": "Spot one shop QR stand; do not scan it.", "cues": ["At a shop counter", "On a usual errand"], "settings": ["At a market", "At a petrol pump"]},
 (None, "if-then-plans"): {"detail": "Pick one small task you already plan today, name its cue, then do it then.", "smaller": "Say one if-then plan out loud, then do it."},
 (None, "spotlight-effect"): {"detail": "Today, notice if anyone mentions your shirt's colour without being asked.", "smaller": "Name your shirt's colour to yourself, then see who notices."},
}
hit = set()
for r in d["rows"]:
    for (t, cid), upd in F.items():
        if r["conceptId"] == cid and (t is None or r["topic"].endswith(t)):
            r["fieldTry"].update(upd); hit.add((t, cid))
            assert len(r["fieldTry"]["detail"]) <= 90, (cid, len(r["fieldTry"]["detail"]))
            for s in r["fieldTry"]["cues"] + r["fieldTry"]["settings"] + [r["fieldTry"]["smaller"]]:
                assert len(s) <= 60, (cid, s)
missing = set(F) - hit
assert not missing, missing
d["reviewed"] = "Codex B review 24 Oct (idea-engine/codex-review-fieldtries.md): 24 rows flagged, fixes applied as accepted by the idea engine."
json.dump(d, open(path, "w", encoding="utf-8", newline="\n"), ensure_ascii=False, indent=1)
print("updated", len(hit), "rows")
