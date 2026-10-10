import { ulid } from 'ulidx';
import type { NandiDb } from '../db';
import { db as appDb } from '../db';
import type { ProgramRow, SessionRow, SetRow, ExStateRow, PrRow, LedgerRow } from '../types';
import { entityRepo, naturalRepo } from './base';
import { trackWrite } from '../../core/pendingWrites';
import { dayKey } from '../../core/time';
import { RULES } from '../../core/rules.config';
import { PROGRAMS, LADDERS, EXERCISE_LIBRARY, applyHeatMode, applyRetestVolume, isRetestWeek, calculateSessionXp, detectSetPrs, evaluateBodyweightLadder, evaluateGymLift, getSmallestIncrement, needsWeeklyVolumeConfirmation, type EquipmentSetting, type Routine, type RoutineExercise, type Track, type SessionExercise } from '../../core/train';

export type Onboarding = { track: Track; equipment: EquipmentSetting; days: number[]; weeklyTarget: 2 | 3; restDay: number; heatModeEnabled: boolean; placement: Record<string, number> };
const PROGRAM_ID = 'train-program';
const live = <T extends { deleted: 0 | 1 }>(row: T) => row.deleted === 0;
const weekOf = (at: number) => {
  const date = new Date(at);
  const monday = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - ((date.getDay() + 6) % 7) * 86_400_000;
  return new Date(monday).toISOString().slice(0, 10);
};

function routineFor(program: ProgramRow, now: number): Routine {
  const template = program.track === 'gym' ? PROGRAMS[(program.sessionsStarted ?? 0) % 2 ? 'gym-foundations-b' : 'gym-foundations-a']! : PROGRAMS['hostel-bodyweight']!;
  const exercises = template.exercises.map((ex): RoutineExercise => {
    const pattern = ex.isBodyweightLadder;
    if (!pattern) return ex;
    if (pattern === 'row' && !program.equipment?.sturdyAnchor) return { ...ex, exerciseId: program.equipment?.resistanceBand ? 'band-row' : 'backpack-row', isBodyweightLadder: undefined };
    const ladder = LADDERS[pattern]!;
    const rank = Math.max(1, Math.min(ladder.length, program.placement?.[pattern] ?? Math.ceil(ladder.length / 2)));
    return { ...ex, exerciseId: ladder[rank - 1]!.exerciseId };
  });
  const days = Math.floor((now - (program.heatStartedAt ?? program.startedAt ?? now)) / 86_400_000);
  return applyRetestVolume(applyHeatMode({ ...template, exercises }, !!program.heatModeEnabled, days), isRetestWeek(program.startedAt ?? now, now));
}

export function createTrainRepos(db: NandiDb, deviceId: string) {
  const mutation = <T>(fn: () => Promise<T>): Promise<T> => trackWrite(() => db.transaction('rw', [db.exercises, db.ladders, db.programs, db.exState, db.sessions, db.sets, db.prs, db.ledger], fn));
  const meta = (now: number) => ({ updatedAt: now, deleted: 0 as const, deviceId });
  const getProgram = () => db.programs.get(PROGRAM_ID);
  const sessionSets = (id: string) => db.sets.where('sessionId').equals(id).filter(live).toArray();
  const activeSession = () => db.sessions.where('status').equals('active').filter(live).first();
  const getPlan = async (now = Date.now()) => { const program = await getProgram(); return program && live(program) ? routineFor(program, now) : null; };

  async function addPr(exerciseId: string, kind: PrRow['kind'], value: number, setId: string, now: number, key: string, loadKg?: number) {
    const id = `train-pr:${setId}:${kind}`;
    if (await db.prs.get(id)) return;
    await db.prs.add({ id, exerciseId, kind, value, setId, loadKg, at: now, ...meta(now) });
    const paid = await db.ledger.where('dayKey').equals(key).filter(row => row.mode === 'train' && row.kind === 'pr').count();
    if (paid < RULES.train.prMaxPerDay) await db.ledger.add({ id: `train-pr:${id}`, mode: 'train', kind: 'pr', refId: id, dayKey: key, inputs: { kind }, ...meta(now) });
  }

  return {
    exercises: entityRepo(db.exercises, deviceId), ladders: entityRepo(db.ladders, deviceId), programs: entityRepo(db.programs, deviceId),
    exState: naturalRepo(db.exState, deviceId), sessions: entityRepo(db.sessions, deviceId), sets: entityRepo(db.sets, deviceId), prs: entityRepo(db.prs, deviceId),
    getProgram, getPlan, activeSession, sessionSets,
    async history() { return db.sessions.filter(row => live(row) && row.status !== 'active').reverse().sortBy('startedAt'); },
    async completeOnboarding(input: Onboarding, now: number): Promise<ProgramRow> {
      return mutation(async () => {
        if (await getProgram()) throw new Error('Rank assessment already saved');
        if (input.days.length !== input.weeklyTarget || new Set(input.days).size !== input.days.length || input.days.some(day => day < 0 || day > 6)) throw new Error('Choose training days');
        const row: ProgramRow = { id: PROGRAM_ID, ...input, startedAt: now, heatStartedAt: input.heatModeEnabled ? now : undefined, sessionsStarted: 0, ...meta(now) };
        for (const ex of Object.values(EXERCISE_LIBRARY)) await db.exercises.put({ id: ex.id, pattern: Object.entries(LADDERS).find(([, steps]) => steps.some(step => step.exerciseId === ex.id))?.[0] ?? '', source: ex.licence === 'Custom' ? 'nandi' : 'free-exercise-db', name: ex.name, cues: ex.cues, licence: ex.licence, attribution: ex.attribution, custom: ex.licence === 'Custom', ...meta(now) });
        for (const [pattern, steps] of Object.entries(LADDERS)) await db.ladders.put({ id: `ladder:${pattern}`, pattern, steps: steps.map(step => ({ exerciseId: step.exerciseId, sets: RULES.train.ladder.sets, repMin: RULES.train.ladder.repMin, repMax: RULES.train.ladder.repMax })), ...meta(now) });
        await db.programs.add(row);
        return row;
      });
    },
    async updateProgram(changes: Partial<Pick<ProgramRow, 'track' | 'days' | 'weeklyTarget' | 'restDay' | 'heatModeEnabled' | 'equipment'>>, now: number): Promise<ProgramRow> {
      return mutation(async () => {
        const old = await getProgram();
        if (!old) throw new Error('Complete rank assessment first');
        const row = { ...old, ...changes, heatStartedAt: changes.heatModeEnabled && !old.heatModeEnabled ? now : old.heatStartedAt, ...meta(now) };
        await db.programs.put(row);
        return row;
      });
    },
    async recordRetest(placement: Record<string, number>, now: number): Promise<ProgramRow> {
      return mutation(async () => {
        const old = await getProgram();
        if (!old) throw new Error('Complete rank assessment first');
        const row = { ...old, placement: { ...old.placement, ...placement }, lastRetestWeek: Math.floor((now - (old.startedAt ?? now)) / (7 * 86_400_000)), ...meta(now) };
        await db.programs.put(row);
        return row;
      });
    },
    async startSession(now: number, options: { confirmVolume?: boolean; readiness?: string } = {}): Promise<SessionRow> {
      return mutation(async () => {
        const ongoing = await activeSession();
        if (ongoing) return ongoing;
        const program = await getProgram();
        if (!program) throw new Error('Complete rank assessment first');
        const routine = routineFor(program, now);
        const lastWeek = weekOf(now - 7 * 86_400_000);
        const completed = await db.sessions.filter(row => live(row) && row.status !== 'active' && row.startedAt != null && weekOf(row.startedAt) === lastWeek).toArray();
        const previousSets = (await Promise.all(completed.map(row => sessionSets(row.id)))).flat().filter(set => set.type === 'working').length;
        const plannedWeek = routine.exercises.reduce((sum, ex) => sum + ex.sets, 0) * (program.weeklyTarget ?? 3);
        if (needsWeeklyVolumeConfirmation(plannedWeek, previousSets) && !options.confirmVolume) throw new Error('This plan adds over 20% hard sets. Confirm to continue.');
        const row: SessionRow = { id: ulid(now), dayKey: dayKey(now), status: 'active', templateKey: routine.id, planned: routine.exercises, startedAt: now, readiness: options.readiness, painExerciseIds: [], effortByExercise: {}, heatMode: program.heatModeEnabled ? 'on' : 'off', ...meta(now) };
        await db.sessions.add(row);
        await db.programs.put({ ...program, sessionsStarted: (program.sessionsStarted ?? 0) + 1, ...meta(now) });
        return row;
      });
    },
    async logSet(sessionId: string, exerciseId: string, slot: number, values: { reps: number; loadKg: number; type?: 'warmup' | 'working'; confirmedJump?: boolean }, now: number): Promise<{ set: SetRow; prs: ReturnType<typeof detectSetPrs> }> {
      return mutation(async () => {
        const session = await db.sessions.get(sessionId);
        if (!session || session.status !== 'active') throw new Error('Session is closed');
        const planned = session.planned?.find(ex => ex.exerciseId === exerciseId);
        if (!planned) throw new Error('Exercise is not in this session');
        if (session.painExerciseIds?.includes(exerciseId)) throw new Error('This exercise ended after the pain flag');
        const type = values.type ?? 'working';
        if (type === 'working' && (slot < 0 || slot >= planned.sets)) throw new Error('Set is outside the plan');
        if (!Number.isFinite(values.reps) || values.reps <= 0 || !Number.isFinite(values.loadKg) || values.loadKg < 0) throw new Error('Enter a valid set');
        if (type === 'working' && session.templateKey?.startsWith('gym') && !planned.isHold && values.loadKg === 0) throw new Error('Enter a light working load');
        const existing = (await sessionSets(sessionId)).find(set => set.exerciseId === exerciseId && set.slot === slot && set.type === type);
        if (existing) return { set: existing, prs: [] };
        const prior = await db.prs.where('exerciseId').equals(exerciseId).filter(live).toArray();
        const earlier = (await sessionSets(sessionId)).filter(set => set.exerciseId === exerciseId && set.type === 'working');
        const best = {
          load: Math.max(0, ...prior.filter(pr => pr.kind === 'load').map(pr => pr.value ?? 0), ...earlier.map(set => set.loadKg ?? 0)),
          repsAtLoad: Math.max(0, ...prior.filter(pr => pr.kind === 'repsAtLoad' && pr.loadKg === values.loadKg).map(pr => pr.value ?? 0), ...earlier.filter(set => set.loadKg === values.loadKg).map(set => set.reps ?? 0)),
          e1rm: Math.max(0, ...prior.filter(pr => pr.kind === 'e1rm').map(pr => pr.value ?? 0), ...earlier.map(set => (set.loadKg ?? 0) * (1 + (set.reps ?? 0) / 30))),
          hold: Math.max(0, ...prior.filter(pr => pr.kind === 'hold').map(pr => pr.value ?? 0), ...earlier.map(set => set.durationS ?? 0)),
        };
        const prs = detectSetPrs({ load: values.loadKg, reps: values.reps, type, isHold: planned.isHold }, best);
        if (prs.some(pr => pr.needsConfirmation) && !values.confirmedJump) throw new Error('This load is over 50% above your best. Confirm the number to save it.');
        const set: SetRow = { id: ulid(now), sessionId, exerciseId, slot, type, loadKg: values.loadKg, reps: planned.isHold ? undefined : values.reps, durationS: planned.isHold ? values.reps : undefined, completedAt: now, confirmedJump: values.confirmedJump, ...meta(now) };
        await db.sets.add(set);
        const restS = EXERCISE_LIBRARY[exerciseId]?.muscle === 'core' ? RULES.train.coreRestS : RULES.train.compoundRestS;
        await db.sessions.put({ ...session, restEndsAt: now + restS * 1000, ...meta(now) });
        return { set, prs };
      });
    },
    async flagPain(sessionId: string, exerciseId: string, now: number): Promise<SessionRow> {
      return mutation(async () => {
        const session = await db.sessions.get(sessionId);
        if (!session || session.status !== 'active' || !session.planned?.some(ex => ex.exerciseId === exerciseId)) throw new Error('No active exercise');
        const row = { ...session, painExerciseIds: [...new Set([...(session.painExerciseIds ?? []), exerciseId])], restEndsAt: undefined, ...meta(now) };
        await db.sessions.put(row);
        return row;
      });
    },
    async setEffort(sessionId: string, exerciseId: string, effort: 'easy' | 'solid' | 'near', now: number): Promise<SessionRow> {
      return mutation(async () => {
        const session = await db.sessions.get(sessionId);
        if (!session || session.status !== 'active') throw new Error('No active session');
        const row = { ...session, effortByExercise: { ...session.effortByExercise, [exerciseId]: effort }, ...meta(now) };
        await db.sessions.put(row);
        return row;
      });
    },
    async setRestEnd(sessionId: string, endAt: number, now: number): Promise<SessionRow> {
      return mutation(async () => {
        const session = await db.sessions.get(sessionId);
        if (!session || session.status !== 'active') throw new Error('No active session');
        const row = { ...session, restEndsAt: Math.max(now, endAt), ...meta(now) };
        await db.sessions.put(row);
        return row;
      });
    },
    async finishSession(sessionId: string, now: number): Promise<SessionRow> {
      return mutation(async () => {
        const session = await db.sessions.get(sessionId);
        if (!session) throw new Error('Session not found');
        if (session.status !== 'active') return session;
        const sets = (await sessionSets(sessionId)).filter(set => set.type === 'working');
        const planned = session.planned ?? [];
        const exercises: SessionExercise[] = planned.map(ex => ({ exerciseId: ex.exerciseId, sets: sets.filter(set => set.exerciseId === ex.exerciseId).map(set => ({ load: set.loadKg ?? 0, reps: set.durationS ?? set.reps ?? 0, isHold: ex.isHold })), painFlag: !!session.painExerciseIds?.includes(ex.exerciseId), effort: session.effortByExercise?.[ex.exerciseId], targetRepMin: ex.repMin, targetRepMax: ex.repMax }));
        const routine: Routine = { id: session.templateKey ?? 'session', name: 'Session', track: session.templateKey?.startsWith('gym') ? 'gym' : 'bodyweight', exercises: planned };
        const xp = calculateSessionXp({ id: session.id, dayKey: session.dayKey, routineId: routine.id, exercises }, routine);
        const pain = (session.painExerciseIds?.length ?? 0) > 0;
        const done = sets.length;
        const total = planned.reduce((sum, ex) => sum + ex.sets, 0);
        const status: SessionRow['status'] = pain ? 'safety' : done >= total ? 'completed' : exercises.every(ex => ex.sets.length > 0) ? 'minimum' : 'partial';
        const row: SessionRow = { ...session, status, endedAt: now, restEndsAt: undefined, xp, ...meta(now) };
        await db.sessions.put(row);
        const fact: LedgerRow = { id: `train-session:${sessionId}`, mode: 'train', kind: 'session', refId: sessionId, dayKey: session.dayKey, inputs: { xp, plannedSets: total, workingSets: done, safety: pain }, ...meta(now) };
        if (!(await db.ledger.get(fact.id))) await db.ledger.add(fact);
        const program = await getProgram();
        const placement = { ...program?.placement };
        for (const ex of planned) {
          const logged = sets.filter(set => set.exerciseId === ex.exerciseId);
          const old = await db.exState.get(ex.exerciseId);
          const state: ExStateRow = old ?? { id: ex.exerciseId, ...meta(now) };
          const exercise = exercises.find(item => item.exerciseId === ex.exerciseId)!;
          let update: ExStateRow = { ...state, lastReps: logged.at(-1)?.durationS ?? logged.at(-1)?.reps ?? state.lastReps, lastLoadKg: logged.at(-1)?.loadKg ?? state.lastLoadKg, ...meta(now) };
          if (logged.length > 0 && !pain && ex.isBodyweightLadder) {
            const pattern = ex.isBodyweightLadder;
            const rank = state.ladderStep ?? program?.placement?.[pattern] ?? 1;
            const next = evaluateBodyweightLadder(exercise, { pattern, stepRank: rank }).stepRank;
            update = { ...update, ladderStep: next };
            placement[pattern] = next;
            if (next > rank) await addPr(ex.exerciseId, 'ladderStep', next, logged.at(-1)!.id, now, session.dayKey);
          } else if (logged.length >= ex.sets && !pain && routine.track === 'gym' && !ex.isHold && program?.equipment) {
            const week = weekOf(now);
            const oldLoad = state.loadKg ?? logged[0]!.loadKg ?? 0;
            const next = evaluateGymLift(exercise, { load: oldLoad, successStreak: state.successStreak ?? 0, failStreak: state.failStreak ?? 0, increasesThisWeek: state.increaseWeek === week ? state.increasesThisWeek ?? 0 : 0, weeksSinceStart: Math.floor((now - (program.startedAt ?? now)) / (7 * 86_400_000)) + 1 }, getSmallestIncrement(program.equipment));
            update = { ...update, loadKg: next.load, lastReps: next.load > oldLoad ? ex.repMin : update.lastReps, successStreak: next.successStreak, failStreak: next.failStreak, increasesThisWeek: next.increasesThisWeek, increaseWeek: week, lastIncreaseAt: next.load > oldLoad ? now : state.lastIncreaseAt };
          }
          await db.exState.put(update);
          if (exercise.painFlag) continue;
          for (const set of logged) {
            const prior = await db.prs.where('exerciseId').equals(ex.exerciseId).filter(live).toArray();
            const best = { load: Math.max(0, ...prior.filter(pr => pr.kind === 'load').map(pr => pr.value ?? 0)), repsAtLoad: Math.max(0, ...prior.filter(pr => pr.kind === 'repsAtLoad' && pr.loadKg === set.loadKg).map(pr => pr.value ?? 0)), e1rm: Math.max(0, ...prior.filter(pr => pr.kind === 'e1rm').map(pr => pr.value ?? 0)), hold: Math.max(0, ...prior.filter(pr => pr.kind === 'hold').map(pr => pr.value ?? 0)) };
            for (const pr of detectSetPrs({ load: set.loadKg ?? 0, reps: set.durationS ?? set.reps ?? 0, isHold: ex.isHold }, best)) if (!pr.needsConfirmation || set.confirmedJump) await addPr(ex.exerciseId, pr.kind, pr.value, set.id, now, session.dayKey, set.loadKg);
          }
        }
        if (program && !pain) await db.programs.put({ ...program, placement, ...meta(now) });
        if (program && xp > 0) {
          const week = weekOf(now);
          const sameWeek = await db.sessions.filter(item => live(item) && item.status !== 'active' && item.status !== 'skipped' && item.startedAt != null && weekOf(item.startedAt) === week && (item.xp ?? 0) > 0).toArray();
          const count = new Set(sameWeek.map(item => item.dayKey)).size;
          const target = program.weeklyTarget ?? 3;
          if (count >= 2) {
            const id = `train-week:${week}:two`;
            if (!(await db.ledger.get(id))) await db.ledger.add({ id, mode: 'train', kind: 'weekly', refId: week, dayKey: session.dayKey, inputs: { milestone: 2, xp: target === 2 ? RULES.train.weeklyBonus.targetMet : RULES.train.weeklyBonus.oneShort }, ...meta(now) });
          }
          if (target === 3 && count >= 3) {
            const id = `train-week:${week}:three`;
            const two = await db.ledger.get(`train-week:${week}:two`);
            if (!(await db.ledger.get(id))) await db.ledger.add({ id, mode: 'train', kind: 'weekly', refId: week, dayKey: session.dayKey, inputs: { milestone: 3, xp: Math.max(0, RULES.train.weeklyBonus.targetMet - Number(two?.inputs.xp ?? 0)) }, ...meta(now) });
          }
        }
        return row;
      });
    },
    async restDayCheck(now: number, minutes: number): Promise<void> {
      await mutation(async () => {
        if (minutes < RULES.train.restDayCheckMinMinutes) throw new Error('Walk or move for 10 minutes first');
        const key = dayKey(now);
        if ((await db.sessions.where('dayKey').equals(key).filter(live).count()) > 0) throw new Error('Rest check is for a non-session day');
        const id = `train-rest:${key}`;
        if (!(await db.ledger.get(id))) await db.ledger.add({ id, mode: 'train', kind: 'rest', refId: key, dayKey: key, inputs: { minutes }, ...meta(now) });
      });
    },
  };
}

export async function isTrainSessionActive(): Promise<boolean> {
  return (await appDb.sessions.where('status').equals('active').filter(live).count()) > 0;
}
