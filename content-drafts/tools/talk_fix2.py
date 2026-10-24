# After the Codex B pass that applied cj6-factcheck-talk: fix the validator's editorial errors without re-adding
# reasons the papers do not give ("so" links a finding to the move; it does not claim a mechanism).
import json, sys
p = sys.argv[1]
d = json.load(open(p, encoding="utf-8"))
T = {
 'follow-ups-s1': "Ask about the last thing they shared, so they can tell you are listening. In US first-chat studies, people who asked more follow-ups were liked more.",
 'follow-ups-s3': "A follow-up stays with their last point and asks for more, so it shows you heard them and you care. That is how it worked in the studies.",
 'listening-s1': "People felt more understood when a listener said back the gist and asked about it, so try both. Advice and 'I see' did less.",
 'listening-s2': "Try to pull a new name from memory before you check it, since recalling beat hearing it the same number of times in class name games.",
 'listening-s3': "Saying it back is one part. Alone, it did not help much in one study, so add a question about it and stay engaged.",
 'disagree-and-end-s1': "Show you heard their view and name a point you share, so the talk stays open. Soften with 'I think', and say what you want.",
 'disagree-and-end-s2': "We often can't tell when the other person wants to stop, so a warm, clear goodbye is fine. They may want to go too. Goodbye lines were not tested.",
 'disagree-and-end-s3': "In nearly half of the stranger chats in one US study, both people wished to stop sooner. We may miss that wish, so a clear end is fine.",
 'reach-out-s1': "Asking an expert for advice on a hard task did not make people look weak. They looked more competent, which means a hard task is a fair time to ask.",
 'reach-out-s3': "Someone you're less close to may value a short note more than you guess, since the gap was larger when the note came as a surprise.",
}
C = {
 'listening-c5': "In five tests, listening with care and without judging made speakers feel less anxious while they talked.",
 'disagree-and-end-c2': "The recipe: say what you want, not just what is wrong; say you understand; find points you agree on; and soften claims with words like 'I think'.",
 'disagree-and-end-c4': "On Wikipedia talk pages, editors whose posts were more open got fewer personal attacks later.",
}
F = {
 ('follow-ups-6', 'b'): "That switches to a new topic, so her point gets dropped instead of followed up.",
 ('listening-1', 'a'): "That uses all three parts: say back the gist, ask, and stay with them.",
 ('listening-6', 'c'): "Then ask them to say more, so they can go on with their point.",
 ('disagree-and-end-1', 'c'): "That says you see their point and softens yours with 'I think'.",
}
for c in d['body']['modules'][0]['concepts']:
    for s in c['steps']:
        if s['id'] in T:
            assert len(T[s['id']].split()) <= 30, s['id']
            s['teach'] = T[s['id']]
    for x in c['claims']:
        if x['id'] in C: x['text'] = C[x['id']]
    for it in c['items']:
        if it['id'] == 'listening-5': it['stem'] = "In the listening study, how many response types did the researchers compare?"
        for o in it['options']:
            if (it['id'], o['id']) in F: o['feedback'] = F[(it['id'], o['id'])]
n = 0; longest = []
for c in d['body']['modules'][0]['concepts']:
    for it in c['items']:
        if it['type'] in ('order', 'match', 'estimate'): continue
        n += 1; r = [o for o in it['options'] if o['correct']][0]
        if all(len(r['text']) > len(o['text']) for o in it['options'] if o is not r): longest.append(it['id'])
print("right is longest:", len(longest), "/", n, longest)
open(p, 'w', encoding='utf-8', newline='\n').write(json.dumps(d, ensure_ascii=False, indent=2) + '\n')

# Round 2 of validator fixes.
d = json.load(open(p, encoding="utf-8"))
for c in d['body']['modules'][0]['concepts']:
    for s in c['steps']:
        if s['id'] == 'listening-s1':
            s['teach'] = "People felt more understood when a listener gave back the gist and asked about it, so try both. Advice and 'I see' did less."
    for x in c['claims']:
        if x['id'] == 'disagree-and-end-c4': x['text'] = "On Wikipedia talk pages, people whose posts were more open got fewer rude attacks later."
    for it in c['items']:
        if it['id'] == 'listening-5': it['stem'] = "In the listening study, how many kinds of reply did the team compare?"
        if it['id'] == 'reach-out-5':
            for o in it['options']:
                if not o['correct']: o['text'] = "The sender, who wrote the note."
open(p, 'w', encoding='utf-8', newline='\n').write(json.dumps(d, ensure_ascii=False, indent=2) + '\n')
# Round 3: one more length balance.
d = json.load(open(p, encoding="utf-8"))
for c in d['body']['modules'][0]['concepts']:
    for it in c['items']:
        if it['id'] == 'follow-ups-2':
            for o in it['options']:
                if o['text'] == 'Tell your match story first and keep talking.': o['text'] = 'Tell your own match story first, then keep on talking about it.'
open(p, 'w', encoding='utf-8', newline='\n').write(json.dumps(d, ensure_ascii=False, indent=2) + '\n')
