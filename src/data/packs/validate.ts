import * as v from 'valibot';
import { packSchema, type Pack } from './schemas';

export function validatePack(input: unknown): string[] {
  const parsed = v.safeParse(packSchema, input);
  if (!parsed.success) return parsed.issues.map((issue) => `${v.getDotPath(issue) ?? 'pack'}: ${issue.message}`);
  const pack: Pack = parsed.output;
  const errors: string[] = [];
  if (!pack.id.startsWith(`${pack.kind}.`)) errors.push('id must match kind');
  if (pack.kind === 'lessons') {
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
