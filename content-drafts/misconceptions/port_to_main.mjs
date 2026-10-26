// Reapply the reviewed 65ed5ef content diff by stable content IDs.
// Run from the repository root: node content-drafts/misconceptions/port_to_main.mjs
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const commit = '65ed5ef';
const base = 'eb4d352';
const dir = 'content-drafts/misconceptions';
const show = (revision, path) => execFileSync('git', ['show', `${revision}:${path}`], { maxBuffer: 20 * 1024 * 1024 });
const fromGit = (revision, path) => JSON.parse(show(revision, path).toString('utf8'));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const byId = (array = []) => new Map(array.map(x => [x.id, x]));
const concepts = pack => byId(pack.body.modules.flatMap(m => m.concepts));
const items = pack => byId([...concepts(pack).values()].flatMap(c => c.items));
const steps = pack => byId([...concepts(pack).values()].flatMap(c => c.steps));
const setFields = (target, reviewed, fields) => {
  for (const key of fields) {
    if (Object.hasOwn(reviewed, key)) target[key] = structuredClone(reviewed[key]);
    else delete target[key];
  }
};
const records = [];
const add = (topic, target, kind, status, reason) => records.push({ topic, target, kind, status, reason });
const changedStemFits = new Map([
  ['topic.body-training:progressive-overload-11/c', 'character renamed Parth to Dev; question and answers otherwise unchanged'],
  ['topic.body-training:sleep-recovery-11/c', 'character renamed Pema to Tara; question and answers otherwise unchanged'],
  ['topic.health-nutrition:hydration-cues-12/c', 'character renamed Faria to Meena; question and answers otherwise unchanged'],
  ['topic.history-civilisations:indus-cities-9/c', 'character renamed Sameer to Arjun; question and answers otherwise unchanged'],
  ['topic.psychology:loss-aversion-11/a', 'fair trade changed to fair coin toss; same equal-odds, large-stake question'],
  ['topic.psychology:loss-aversion-11/c', 'fair trade changed to fair coin toss; same equal-odds, large-stake question'],
  ['topic.psychology:loss-aversion-s1/guided1/c', 'exam re-mark changed to cricket side bet; same even-chance gain/loss question'],
  ['topic.psychology:social-proof-s3/guided1/c', 'group-count wording changed; same unverified answer question'],
]);
const renamedStemFits = new Map([
  ['topic.body-training:muscle-protein-rest-9', 'character renamed Sanjay to Kabir; option text and feedback unchanged'],
  ['topic.body-training:muscle-protein-rest-11', 'character renamed Jatin to Ravi; option text and feedback unchanged'],
  ['topic.body-training:sleep-recovery-10', 'character renamed Vinod to Ravi; option text and feedback unchanged'],
  ['topic.body-training:sleep-recovery-11', 'character renamed Pema to Tara; option text and feedback unchanged'],
  ['topic.health-nutrition:protein-foods-10', 'character renamed Deepak to Rohan; option text and feedback unchanged'],
  ['topic.health-nutrition:free-sugars-9', 'character renamed Mitali to Riya; option text and feedback unchanged'],
  ['topic.health-nutrition:free-sugars-13', 'character renamed Amrita to Tara; option text and feedback unchanged'],
  ['topic.health-nutrition:hydration-cues-11', 'character renamed Sudeep to Kiran; option text and feedback unchanged'],
  ['topic.how-things-work:battery-flight-time-12', 'character renamed Rukhsana to Sana; option text and feedback unchanged'],
  ['topic.money-markets:compounding-14', 'character renamed Dinesh to Kunal; option text and feedback unchanged'],
  ['topic.psychology:anchoring-12', 'anchor study question rephrased; same 10 and 65 anchors and 25 clue'],
]);

mkdirSync(dir, { recursive: true });
for (const path of execFileSync('git', ['ls-tree', '-r', '--name-only', commit, dir], { encoding: 'utf8' }).trim().split(/\r?\n/)) {
  writeFileSync(path, show(commit, path));
}

const files = execFileSync('git', ['ls-tree', '-r', '--name-only', commit, 'content/topics'], { encoding: 'utf8' }).trim().split(/\r?\n/).filter(path => path.endsWith('.json'));
for (const path of files) {
  const old = fromGit(base, path);
  const reviewed = fromGit(commit, path);
  const current = fromGit('HEAD', path);
  const topic = reviewed.id;
  const oc = concepts(old), rc = concepts(reviewed), cc = concepts(current);
  const oi = items(old), ri = items(reviewed), ci = items(current);
  const os = steps(old), rs = steps(reviewed), cs = steps(current);
  for (const [cid, rconcept] of rc) {
    const oconcept = oc.get(cid), cconcept = cc.get(cid);
    const om = byId(oconcept?.misconceptions), rm = byId(rconcept.misconceptions), cm = byId(cconcept?.misconceptions);
    for (const [mid, misconception] of rm) {
      if (om.has(mid)) continue;
      const target = `${cid}/${mid}`;
      if (!cconcept) add(topic, target, 'misconception', 'SKIPPED', 'health sleep-recovery concept removed on main');
      else if (cm.has(mid)) add(topic, target, 'misconception', 'APPLIED-ADAPTED', 'already present on main');
      else {
        const ported = structuredClone(misconception);
        if (topic === 'topic.health-nutrition' && mid === 'protein-foods-m8') {
          // Main removed ISSN. The unchanged c4/c6 claims and correction cite protein.
          ported.sourceRefs = ['protein'];
        }
        cconcept.misconceptions.push(ported);
        const adapted = !same(oconcept.claims, cconcept.claims) || !same(ported, misconception);
        const oldClaims = byId(oconcept.claims), currentClaims = byId(cconcept.claims);
        const claimChanges = [...new Set([...oldClaims.keys(), ...currentClaims.keys()])].filter(id => !same(oldClaims.get(id), currentClaims.get(id)));
        add(topic, target, 'misconception', adapted ? 'APPLIED-ADAPTED' : 'APPLIED',
          !same(ported, misconception) ? 'ISSN source removed on main; correction still supported by protein source and claims c4/c6' :
            adapted ? `same concept ID; main changed claim wording ${claimChanges.join(', ')}` : 'concept claims unchanged');
      }
    }
  }
  for (const [iid, ritem] of ri) {
    const oitem = oi.get(iid), citem = ci.get(iid);
    if (!oitem) continue;
    const oo = byId(oitem.options), ro = byId(ritem.options), co = byId(citem?.options);
    for (const [oid, option] of ro) {
      const prior = oo.get(oid);
      if (!prior) continue;
      const fields = [...new Set([...Object.keys(prior), ...Object.keys(option)])].filter(k => !same(prior[k], option[k]));
      if (!fields.length) continue;
      const target = `${iid}/${oid}`;
      const now = co.get(oid);
      if (!now) { add(topic, target, 'practice option', 'SKIPPED', iid.startsWith('sleep-recovery-') && topic === 'topic.health-nutrition' ? 'health sleep-recovery concept and item removed on main' : 'item or option ID gone from main'); continue; }
      if (now.correct !== prior.correct) { add(topic, target, 'practice option', 'SKIPPED', 'answer role changed on main'); continue; }
      if (now.text !== prior.text && now.text !== option.text && !changedStemFits.has(`${topic}:${target}`)) { add(topic, target, 'practice option', 'SKIPPED', topic === 'topic.money-markets' && iid === 'diversification-13' ? 'item rewritten from pharma spread to fund fees; old misconception link does not fit' : 'option text rewritten on main'); continue; }
      if (fields.includes('feedback') && now.feedback !== prior.feedback && now.feedback !== option.feedback && !changedStemFits.has(`${topic}:${target}`)) {
        add(topic, target, 'practice option', 'SKIPPED', 'option feedback rewritten on main'); continue;
      }
      if (oitem.stem !== citem.stem && !changedStemFits.has(`${topic}:${target}`) && !renamedStemFits.has(`${topic}:${iid}`)) {
        add(topic, target, 'practice option', 'SKIPPED', 'item stem rewritten on main; old option change may not fit'); continue;
      }
      const adapted = !same(prior, now) || oitem.stem !== citem.stem;
      setFields(now, option, fields);
      if (fields.includes('misconceptionIds')) {
        citem.misconceptionTags = [...new Set([...(citem.misconceptionTags || []), ...now.misconceptionIds])];
      }
      add(topic, target, fields.includes('text') ? 'practice rewrite' : 'practice tag', adapted ? 'APPLIED-ADAPTED' : 'APPLIED',
        changedStemFits.get(`${topic}:${target}`) || renamedStemFits.get(`${topic}:${iid}`) || (adapted ? 'same item and option IDs; option fields changed on main' : 'option unchanged since base'));
    }
  }
  for (const [sid, rstep] of rs) {
    const ostep = os.get(sid), cstep = cs.get(sid);
    if (!ostep) continue;
    for (let gi = 0; gi < rstep.guided.length; gi++) {
      const rg = rstep.guided[gi], og = ostep.guided[gi], cg = cstep?.guided?.[gi];
      if (!og) continue;
      const oo = byId(og.options), ro = byId(rg.options), co = byId(cg?.options);
      for (const [oid, option] of ro) {
        const prior = oo.get(oid);
        if (!prior) continue;
        const fields = [...new Set([...Object.keys(prior), ...Object.keys(option)])].filter(k => !same(prior[k], option[k]));
        if (!fields.length) continue;
        const target = `${sid}/guided${gi + 1}/${oid}`;
        const now = co.get(oid);
        if (!now) { add(topic, target, 'guided swap', 'SKIPPED', topic === 'topic.health-nutrition' && sid.startsWith('sleep-recovery-') ? 'health sleep-recovery concept and guided step removed on main' : 'step or guided option gone from main'); continue; }
        if (now.text !== prior.text && now.text !== option.text) { add(topic, target, 'guided swap', 'SKIPPED', 'guided option rewritten on main'); continue; }
        if (fields.includes('feedback') && now.feedback !== prior.feedback && now.feedback !== option.feedback) {
          add(topic, target, 'guided swap', 'SKIPPED', topic === 'topic.health-nutrition' && sid === 'free-sugars-s3' ? 'guided question rewritten as numeric share; drink-specific distractor no longer fits' : 'guided feedback rewritten on main'); continue;
        }
        if (og.stem !== cg.stem && now.text !== option.text && !changedStemFits.has(`${topic}:${target}`)) { add(topic, target, 'guided swap', 'SKIPPED', 'guided stem rewritten on main'); continue; }
        const adapted = !same(prior, now) || og.stem !== cg.stem;
        setFields(now, option, fields);
        add(topic, target, 'guided swap', adapted ? 'APPLIED-ADAPTED' : 'APPLIED',
          changedStemFits.get(`${topic}:${target}`) || (adapted ? 'same step and option IDs; surrounding content or fields changed' : 'guided option unchanged since base'));
      }
    }
  }
  writeFileSync(path, JSON.stringify(current, null, 2) + '\n');
}
const counts = records.reduce((t, r) => (t[r.status] = (t[r.status] || 0) + 1, t), {});
const seven = ['social-proof', 'sleep-memory', 'variable-rewards', 'anchoring', 'compounding', 'loan-emi', 'upi-scams'];
const ids = seven.map(cid => {
  const found = [];
  for (const path of files) {
    const pack = JSON.parse(readFileSync(path, 'utf8'));
    const concept = concepts(pack).get(cid);
    if (concept) found.push(...concept.misconceptions.map(m => m.id));
  }
  return [cid, found];
});
const report = [
  '# Misconception content port', '',
  `Source: ${commit} (base ${base}); target: current main worktree.`, '',
  `Counts: **APPLIED ${counts.APPLIED || 0} / APPLIED-ADAPTED ${counts['APPLIED-ADAPTED'] || 0} / SKIPPED ${counts.SKIPPED || 0}**.`, '',
  'One row records one newly added misconception, changed practice option, or changed guided option. Item `misconceptionTags` are updated with each applied option link.', '',
  '## Requested concept IDs', '',
  ...ids.map(([cid, found]) => `- ${cid}: ${found.length ? found.join(', ') : '**MISSING**'}`), '',
  '## Changes', '',
  '| Topic | Target | Kind | Status | Reason |',
  '|---|---|---|---|---|',
  ...records.map(r => `| ${r.topic} | ${r.target} | ${r.kind} | ${r.status} | ${r.reason} |`), ''
];
writeFileSync(join(dir, 'PORT-REPORT.md'), report.join('\n'));
console.log(JSON.stringify({ counts, total: records.length, kinds: records.reduce((t, r) => (t[r.kind] = (t[r.kind] || 0) + 1, t), {}), skipped: records.filter(r => r.status === 'SKIPPED') }, null, 2));
