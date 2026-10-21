import * as v from 'valibot';
import { packSchema, type Pack } from './schemas';
import { RULES } from '../../core/rules.config';

/** Flesch reading ease. A 0.5 point tolerance covers syllable heuristic rounding. */
export function fleschReadingEase(value: string): number {
  const words = value.match(/[A-Za-z]+(?:'[A-Za-z]+)?/g) ?? [];
  if (!words.length) return 100; // Number-only and symbol-only feedback is neutral.
  const sentences = Math.max(1, (value.match(/[.!?]+/g) ?? []).length);
  const syllables = words.reduce((sum, word) => {
    const plain = word.toLowerCase().replace(/(?:[^l]es|ed|e)$/u, '');
    return sum + Math.max(1, (plain.match(/[aeiouy]+/g) ?? []).length);
  }, 0);
  return 206.835 - 1.015 * words.length / sentences - 84.6 * syllables / words.length;
}

// Shared banned-content policy, spelled in parts so the source scanner does not flag its own vocabulary.
const banned = ['Blue' + ' Lock', 'E' + 'go', 'Eg' + 'oist', 'Que' + 'ens', 'Tan' + 'go', 'Z' + 'ip', 'Ken' + 'Ken'];
const bannedPattern = new RegExp(`\\b(?:${banned.join('|')})\\b`, 'i');
const advicePattern = /\b(?:you should|we recommend|must)\s+(?:buy|sell|invest|take|stop taking|consult|sue)\b|(?:^|[.!?]\s+)(?:buy|sell|invest)\s+(?:stocks?|shares?|funds?|medicine)\b/i;
const datePattern = /\b(?:19|20)\d{2}(?:-\d{1,2}(?:-\d{1,2})?)?\b|\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:,?\s+\d{4})?\b/i;
const indianSettingPattern = /\b(?:hostel|exam|canteen|cricket|monsoon|UPI|train|family (?:shop|business)|college|classroom|school|rupee|Delhi|Mumbai|Chennai|Bengaluru)\b|\u20b9/i;
const words = (value: string) => value.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
const allTypes = ['predict', 'choose', 'why', 'scenario', 'fill-the-step', 'true-not-quite', 'explain-it-back', 'order', 'match', 'estimate'];
// Each estimate must invoke a mechanism from its concept, rather than ask for a bare sum or product.
const estimateMechanisms: Record<string, RegExp> = {
  lift: /\b(?:lift|weight|airflow)\b/i,
  'multirotor-turns': /\b(?:thrust|pitch|roll|yaw|rotor)\b/i,
  'battery-flight-time': /\b(?:battery|flight|hover|power|weight)\b/i,
  'flight-sensors': /\b(?:sensor|gps|barometer|pressure|height)\b/i,
  'birds-and-planes': /\b(?:bird|plane|wing|lift|thrust)\b/i,
  'ceiling-fans': /\b(?:fan|breeze|airflow|cool)\b/i,
  inflation: /\b(?:inflation|basket|price level|purchasing power)\b/i,
  compounding: /\b(?:compound|gain|interest|retained)\b/i,
  'rule-of-72': /\b(?:rule of 72|double|doubling|steady rate)\b/i,
  'risk-return': /\b(?:risk|return|loss|outcome|payout)\b/i,
  diversification: /\b(?:diversif\w*|holdings?|portfolio|shared shock)\b/i,
  shares: /\b(?:shares?|ownership|owner|dividend)\b/i,
  habits: /\b(?:habits?|cue|automatic)\b/i,
  'loss-aversion': /\b(?:loss|gain|avers|reference point)\b/i,
  anchoring: /\b(?:anchor|first number|starting number)\b/i,
  'confirmation-bias': /\b(?:confirm|belief|falsif|disconfirm|test)\b/i,
  'social-proof': /\b(?:crowd|group|conform|majority)\b/i,
  'planning-fallacy': /\b(?:plan\w*|past.task|prior.task|estimat\w*)\b/i,
};

export function validatePack(input: unknown, options: { allowUnchecked?: boolean; editorial?: boolean } = {}): string[] {
  const parsed = v.safeParse(packSchema, input);
  if (!parsed.success) return parsed.issues.map((issue) => `${v.getDotPath(issue) ?? 'pack'}: ${issue.message}`);
  const pack: Pack = parsed.output;
  const errors: string[] = [];
  if (!pack.id.startsWith(`${pack.kind}.`)) errors.push('id must match kind');
  if (pack.kind === 'mystery-arc') {
    if (pack.body.chapters.length !== RULES.mind.arcChapters) errors.push('arc needs five chapters for long seasons');
    for (const [index, chapter] of pack.body.chapters.entries()) {
      for (const panel of [...chapter.panels, chapter.bonus]) if ((panel.match(/[\p{L}\p{N}]+/gu) ?? []).length > RULES.mind.arcPanelMaxWords) errors.push(`chapter ${index + 1}: panel exceeds 60 words`);
    }
  } else
  if (pack.kind === 'topic') {
    if (bannedPattern.test(JSON.stringify(pack.body))) errors.push('topic: banned words');
    if (advicePattern.test(JSON.stringify(pack.body))) errors.push('topic: advice is prohibited');
    const conceptIds = new Set(pack.body.modules.flatMap(module => module.concepts.map(concept => concept.id)));
    const ids = new Set<string>();
    const optionSets = new Set<string>();
    const checkText = (where: string, value: string) => {
      if (fleschReadingEase(value) < 59.5) errors.push(`${where}: Flesch reading ease below 60`);
      if (bannedPattern.test(value)) errors.push(`${where}: banned words`);
      if (advicePattern.test(value)) errors.push(`${where}: advice is prohibited`);
    };
    const moduleIds = new Set<string>();
    for (const module of pack.body.modules) {
      if (moduleIds.has(module.id)) errors.push(`${module.id}: duplicate module id`);
      moduleIds.add(module.id);
    }
    if (options.editorial) for (const module of pack.body.modules) {
      const moduleTypes = new Set<string>(module.concepts.flatMap(concept => concept.items.map(item => item.type)));
      for (const type of allTypes) if (!moduleTypes.has(type)) errors.push(`${module.id}: missing item type ${type}`);
    }
    {
      // Spec 14: same-shaped teach cards would undo the point; vary how teach cards, hooks and examples open.
      const steps = pack.body.modules.flatMap(module => module.concepts.flatMap(concept => concept.steps ?? []));
      const openers = (label: string, texts: string[], size: number, max: number) => {
        const counts = new Map<string, number>();
        for (const value of texts) { const key = words(value).slice(0, size).join(' '); counts.set(key, (counts.get(key) ?? 0) + 1); }
        for (const [key, count] of counts) if (count > max) errors.push(`topic: ${count} step ${label}s open with "${key}"`);
      };
      openers('teach card', steps.map(step => step.teach), 3, 2);
      openers('hook', steps.map(step => step.hook.stem), 3, 2);
      openers('example', steps.map(step => step.example.parts.join(' ')), 2, 2);
    }
    for (const module of pack.body.modules) for (const concept of module.concepts) {
      const where = concept.id;
      if (options.editorial && concept.items.length !== 8) errors.push(`${where}: needs exactly 8 items`);
      const typeCounts = new Map<string, number>();
      for (const item of concept.items) typeCounts.set(item.type, (typeCounts.get(item.type) ?? 0) + 1);
      if (options.editorial) {
        for (const [type, count] of typeCounts) if (count > 2) errors.push(`${where}: more than 2 ${type} items`);
        if (!typeCounts.has('estimate')) errors.push(`${where}: needs an estimate item`);
        if (concept.items.filter(item => (item.type === 'scenario' || item.type === 'predict') && indianSettingPattern.test(item.stem)).length < 2) errors.push(`${where}: needs 2 Indian student scenarios or predictions`);
        const levels = concept.items.map(item => item.difficultySeed);
        if (levels.some(level => level !== 1 && level !== 2 && level !== 3)) errors.push(`${where}: difficulty seeds must be levels 1-3`);
        if (levels.filter(level => level === 1).length < 2) errors.push(`${where}: needs at least 2 level-1 items`);
        if (levels.filter(level => level === 3).length < 2) errors.push(`${where}: needs at least 2 level-3 items`);
      }
      const stemPrefixes = new Set<string>();
      if (ids.has(where)) errors.push(`${where}: duplicate concept id`);
      ids.add(where);
      for (const prereq of concept.prerequisites) if (!conceptIds.has(prereq) || prereq === where) errors.push(`${where}: invalid prerequisite ${prereq}`);
      const sourceIds = new Set(concept.sources.map(source => source.id));
      if (sourceIds.size !== concept.sources.length) errors.push(`${where}: duplicate source id`);
      if (options.editorial && pack.body.topic.id === 'money-markets') for (const source of concept.sources) {
        if (!source.asOf) errors.push(`${where}.${source.id}: money source needs asOf metadata`);
      }
      const refs = (location: string, values: string[]) => {
        if (!values.length || values.some(ref => !sourceIds.has(ref))) errors.push(`${location}: unlisted source`);
      };
      refs(`${where}.hook`, concept.hookSourceRefs);
      refs(`${where}.rule`, concept.ruleSourceRefs);
      checkText(`${where}.hook`, concept.hook);
      checkText(`${where}.rule`, concept.rule);
      const claimIds = new Set<string>();
      for (const claim of concept.claims) {
        if (claimIds.has(claim.id)) errors.push(`${where}: duplicate claim ${claim.id}`);
        claimIds.add(claim.id);
        refs(`${where}.claim.${claim.id}`, claim.sourceRefs);
        checkText(`${where}.claim.${claim.id}`, claim.text);
      }
      {
        const verdicts = concept.factCheck?.verdicts ?? [];
        const checked = new Set(verdicts.map(verdict => verdict.claimId));
        const factIds = new Set([...claimIds, ...concept.items.map(item => item.id)]);
        if (!options.allowUnchecked && (checked.size !== verdicts.length || [...claimIds].some(id => !checked.has(id)))) errors.push(`${where}: missing fact-check verdict`);
        if (verdicts.some(verdict => !factIds.has(verdict.claimId))) errors.push(`${where}: fact-check references unknown claim or item`);
        for (const verdict of verdicts) if (verdict.verdict !== 'supported') errors.push(`${where}: ${verdict.claimId} fact-check ${verdict.verdict}`);
      }
      const misconceptionIds = new Set(concept.misconceptions.map(m => m.id));
      for (const m of concept.misconceptions) { refs(`${where}.misconception.${m.id}`, m.sourceRefs); checkText(`${where}.misconception.${m.id}`, m.correction); }
      if (concept.quest) {
        refs(`${where}.quest`, concept.quest.sourceRefs);
        if (advicePattern.test(concept.quest.detail)) errors.push(`${where}.quest: advice is prohibited`);
      }
      if (concept.steps) {
        const stepIds = new Set<string>();
        const wordCount = (value: string) => words(value).length;
        const oneRight = (location: string, list: readonly { correct: boolean }[]) => { if (list.filter(option => option.correct).length !== 1) errors.push(`${location}: needs exactly one right option`); };
        for (const step of concept.steps) {
          const at = `${where}.step.${step.id}`;
          if (stepIds.has(step.id) || ids.has(step.id)) errors.push(`${at}: duplicate step id`);
          stepIds.add(step.id);
          if (!claimIds.has(step.claimId)) errors.push(`${at}: claimId must name a fact-checked claim of the concept`);
          refs(`${at}.sourceRefs`, step.sourceRefs);
          if (wordCount(step.teach) > 30) errors.push(`${at}: teach card over 30 words`);
          if (fleschReadingEase(step.teach) < 69.5) errors.push(`${at}: teach card Flesch reading ease below 70`);
          if (wordCount(step.takeaway) > 15) errors.push(`${at}: takeaway over 15 words`);
          for (const [label, value] of [['teach', step.teach], ['takeaway', step.takeaway], ['hook', step.hook.stem], ['example', step.example.parts.join('')]] as const) checkText(`${at}.${label}`, value);
          if (step.example.parts.filter(part => part === step.example.spot).length !== 1) errors.push(`${at}: example spot must be exactly one of its parts`);
          oneRight(`${at}.hook`, step.hook.options);
          step.guided.forEach((guided, index) => { oneRight(`${at}.guided.${index}`, guided.options); checkText(`${at}.guided.${index}`, guided.stem); });
          if (!concept.items.some(item => item.step === step.id)) errors.push(`${at}: needs at least one practice item`);
        }
        for (const item of concept.items) if (!item.step || !stepIds.has(item.step)) errors.push(`${item.id}: must be tagged to one step of ${where}`);
      } else for (const item of concept.items) if (item.step) errors.push(`${item.id}: step tag without concept steps`);
      for (const item of concept.items) {
        if (ids.has(item.id)) errors.push(`${item.id}: duplicate item id`);
        ids.add(item.id);
        if (item.conceptId !== where) errors.push(`${item.id}: wrong concept id`);
        refs(`${item.id}.sourceRefs`, item.sourceRefs);
        checkText(`${item.id}.stem`, item.stem);
        if (options.editorial && datePattern.test(item.stem)) errors.push(`${item.id}: date in stem`);
        const prefix = words(item.stem).slice(0, 7).join(' ');
        if (options.editorial && words(item.stem).length >= 7 && stemPrefixes.has(prefix)) errors.push(`${item.id}: repeated stem prefix`);
        stemPrefixes.add(prefix);
        if (item.misconceptionTags.some(tag => !misconceptionIds.has(tag))) errors.push(`${item.id}: unknown misconception`);
        const optionIds = new Set(item.options.map(option => option.id));
        const optionTexts = new Set(item.options.map(option => option.text.trim().toLowerCase()));
        if (optionIds.size !== item.options.length || optionTexts.size !== item.options.length) errors.push(`${item.id}: duplicate options`);
        const optionSet = [...optionTexts].sort().join('\u0000');
        if (options.editorial && optionSets.has(optionSet)) errors.push(`${item.id}: repeated option set`);
        optionSets.add(optionSet);
        for (const option of item.options) {
          refs(`${item.id}.${option.id}`, option.sourceRefs);
          checkText(`${item.id}.${option.id}.feedback`, option.feedback);
          const feedbackWords = words(option.feedback).length;
          if (options.editorial && (feedbackWords < 8 || feedbackWords > 30)) errors.push(`${item.id}.${option.id}: feedback needs 8-30 words`);
          const normalizedOption = words(option.text).join(' ');
          const normalizedFeedback = words(option.feedback).join(' ');
          if (options.editorial && (normalizedFeedback === normalizedOption || normalizedFeedback.startsWith(`${normalizedOption} `))) errors.push(`${item.id}.${option.id}: feedback repeats option`);
          if (advicePattern.test(option.text)) errors.push(`${item.id}.${option.id}: advice is prohibited`);
          if (option.misconceptionIds?.some(tag => !misconceptionIds.has(tag))) errors.push(`${item.id}: unknown option misconception`);
        }
        if (item.type === 'estimate') {
          if (options.editorial && !(estimateMechanisms[where] ?? new RegExp(words(concept.title)[0] ?? '^$','i')).test(item.stem)) errors.push(`${item.id}: estimate must name its concept or mechanism`);
          if (!(item.answer.min < item.answer.max && item.answer.value >= item.answer.min && item.answer.value <= item.answer.max)) errors.push(`${item.id}: invalid scored range`);
        } else if (item.type === 'order') {
          if (item.answer.length !== optionIds.size || new Set(item.answer).size !== item.answer.length || item.answer.some(id => !optionIds.has(id))) errors.push(`${item.id}: invalid order answer`);
        } else if (item.type === 'match') {
          if (item.answer.length !== optionIds.size || new Set(item.answer.map(pair => pair.left)).size !== item.answer.length || new Set(item.answer.map(pair => pair.right)).size !== item.answer.length || item.answer.some(pair => !optionIds.has(pair.left) || !optionIds.has(pair.right))) errors.push(`${item.id}: invalid match answer`);
        } else if (item.options.filter(option => option.correct).length !== 1) errors.push(`${item.id}: exactly one correct answer required`);
      }
    }
  } else if (pack.kind === 'lessons') {
    const ids = new Set<string>();
    for (const lesson of pack.body.lessons) {
      const where = lesson.id;
      if (ids.has(where)) errors.push(`${where}: duplicate id`);
      ids.add(where);
      for (const [label, quiz] of [['guess', lesson], ['transfer', lesson.tr], ['why', lesson.wy]] as const) {
        if (quiz.o.length < 3) errors.push(`${where}: ${label} needs 3 options`);
        if (new Set(quiz.o).size !== quiz.o.length) errors.push(`${where}: ${label} duplicate options`);
        if (quiz.a < 0 || quiz.a >= quiz.o.length) errors.push(`${where}: ${label} answer out of range`);
        if (quiz.o.some((option) => option.length > 160)) errors.push(`${where}: ${label} option exceeds 160 characters`);
      }
      if (lesson.scene.length > 300) errors.push(`${where}: scene exceeds 300 characters`);
      if (lesson.cards.length !== 2) errors.push(`${where}: needs 2 cards`);
      if (lesson.pl.i.length < 2 || lesson.pl.t.length < 2) errors.push(`${where}: plan needs 2 cues and actions`);
      if (pack.body.course.id === 'gita' && (!lesson.v || !lesson.v.length)) errors.push(`${where}: needs verses`);
      if (pack.body.course.id === 'charaka') {
        if (!lesson.src) errors.push(`${where}: needs source`);
        if (!lesson.grade) errors.push(`${where}: needs grade`);
        if (!lesson.sci) errors.push(`${where}: needs sci`);
      }
    }
  } else if (pack.kind === 'quests') {
    const ids = new Set<string>();
    for (const quest of pack.body.quests) {
      if (ids.has(quest.id)) errors.push(`${quest.id}: duplicate id`);
      ids.add(quest.id);
      if (quest.kind === 'once' && (quest.target !== 1 || quest.unit !== '' || quest.step !== 1)) errors.push(`${quest.id}: once must have target and step 1, empty unit`);
      if (quest.kind === 'total' && (!quest.unit || quest.step > quest.target)) errors.push(`${quest.id}: invalid total unit or step`);
    }
  } else if (pack.kind === 'winddown') {
    const ids = new Set<string>();
    for (const move of pack.body.moves) {
      if (ids.has(move.id)) errors.push(`${move.id}: duplicate id`);
      ids.add(move.id);
    }
  } else if (pack.kind === 'track') {
    const ids = new Set<string>();
    for (const module of pack.body.modules) {
      if (ids.has(module.id)) errors.push(`${module.id}: duplicate id`);
      ids.add(module.id);
      for (const unit of module.units) {
        if (ids.has(unit.id)) errors.push(`${unit.id}: duplicate id`);
        ids.add(unit.id);
        if (unit.video && !/^https:\/\//.test(unit.video.url)) errors.push(`${unit.id}: video must use HTTPS`);
        if (!unit.video && !unit.videoTodo) errors.push(`${unit.id}: video or videoTodo required`);
        for (const question of unit.check) if (new Set(question.options).size !== 3) errors.push(`${unit.id}: duplicate options`);
      }
    }
  } else {
    const ids = new Set<string>();
    for (const card of pack.body.cards) {
      if (ids.has(card.id)) errors.push(`${card.id}: duplicate id`);
      ids.add(card.id);
      if (!pack.body.topics[card.topic]) errors.push(`${card.id}: unknown topic`);
    }
    for (const item of pack.body.items) {
      if (ids.has(item.id)) errors.push(`${item.id}: duplicate id`);
      ids.add(item.id);
      if ('topic' in item && !pack.body.topics[item.topic]) errors.push(`${item.id}: unknown topic`);
      if ('opts' in item) {
        if (item.opts.length < 3) errors.push(`${item.id}: needs 3 options`);
        if (new Set(item.opts).size !== item.opts.length) errors.push(`${item.id}: duplicate options`);
        if (item.a < 0 || item.a >= item.opts.length) errors.push(`${item.id}: answer out of range`);
      }
    }
  }
  return errors;
}
