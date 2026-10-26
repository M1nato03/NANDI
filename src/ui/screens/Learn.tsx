import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { learningFigures, masteryMapState } from '../../core/learn/engine';
import { loadEngineFacts } from '../../data/repos/learn-engine';
import { trackWrite } from '../../core/pendingWrites';
import { db } from '../../data/db';
import { getOrCreateDeviceId } from '../../data/device';
import type { LearnDropRow } from '../../data/types';
import { LearnDrop } from '../learn/LearnDrop';
import { Mind } from './Mind';
import { chosenTopics, dailyDropId, nightDropId, selectedTopicKey, topics } from '../learn/flow';
import { go } from '../shell/router';
import { chestReady } from '../../core/economy/gamify';
import { cardHook, goldItems } from '../../core/learn/steps';
import { dayKey, isAfterBedtime } from '../../core/time';
import { effectiveBedtime } from '../../data/repos/night';
import { RULES } from '../../core/rules.config';
import { completedModuleKey, UnitScene } from '../cast/UnitScene';
import { Cast } from '../cast/Cast';

// Chiku waits at each checkpoint and cheers once every idea before it is strong (item 135: Learn is Chiku's area only).
import { playCastSound } from '../cast/sound';
import { finishedIdeas, haveliPicks, lastVisits, type HaveliIdea } from '../../core/moti/haveli';
import { matkaPicks, sealedOptions, type MatkaItem } from '../../core/moti/matka';
import { findStep } from '../../core/learn/steps';
import { formatEstimate, sliderScale, type EstimateItem } from '../../core/learn/estimate';
import { weekStart } from '../../core/economy/deriveEconomy';
import { saveHaveliRebuilt, saveMatkaAnswer } from '../../data/repos/moti';
import { Haveli } from '../learn/Haveli';
import { Matka, type MatkaContext } from '../learn/Matka';

// Spec 26: every idea with recall pieces, in topic order (content lands with editor sign-off).
const HAVELI_IDEAS: HaveliIdea[] = topics.flatMap(pack => pack.body.modules.flatMap(module => module.concepts.filter(concept => concept.recall).map(concept => ({ id: concept.id, title: concept.title, topicId: pack.body.topic.id, topicTitle: pack.title, recall: concept.recall!, steps: (concept.steps ?? []).map(step => step.id) }))));
const ALL_CONCEPTS = topics.flatMap(pack => pack.body.modules.flatMap(module => module.concepts));
const matkaContext = (item: MatkaItem): MatkaContext => {
  if (item.level === 2) {
    const found = ALL_CONCEPTS.flatMap(concept => concept.items).find(row => row.id === item.itemId);
    const estimate = found && found.type === 'estimate' ? found as unknown as EstimateItem : undefined;
    return { title: estimate ? 'Your first number' : 'Your first guess', scale: estimate ? sliderScale(estimate) : undefined, format: estimate ? (value: number) => formatEstimate(value, estimate.answer.unit) : undefined };
  }
  const ref = item.stepId ? findStep(ALL_CONCEPTS, item.stepId) : undefined;
  return { title: ref ? `Your first guess on ${ref.step.title}, before the lesson` : 'Your first guess', options: item.level === 1 ? sealedOptions(item, ref?.step.hook.options ?? []) : undefined };
};
// Spec 26 M1: a Matka 1 item is asked only while its sealed options can still be shown fairly (Codex B item 115).
// Read at the tap, not during render.
const currentTime = () => Date.now();
const matkaAskable = (item: MatkaItem) => {
  if (item.level !== 1) return true;
  const ref = item.stepId ? findStep(ALL_CONCEPTS, item.stepId) : undefined;
  return !!ref && sealedOptions(item, ref.step.hook.options) !== undefined;
};
// Spec 26: the haveli entry counts new diyas to light and lit ideas ready for a visit separately (Codex B item 115).
const haveliCount = (picks: readonly HaveliIdea[], litToday: readonly string[], visits: ReadonlyMap<string, string>, cap: number) => {
  const open = picks.filter(idea => !litToday.includes(idea.id)).slice(0, Math.max(0, Math.min(cap, picks.length) - litToday.length));
  const visit = open.filter(idea => visits.has(idea.id)).length, light = open.length - visit;
  const parts = [light ? `${light} to light` : '', visit ? `${visit} ready for a visit` : ''].filter(Boolean);
  return parts.length ? parts.join(' · ') : 'quiet for today';
};
import { chikuOpen, type ChikuScene } from '../../core/learn/chiku';
import { ChikuStage } from '../learn/ChikuStage';
import { AreaScope } from '../shell/AreaScope';
import { FriendStage } from '../cast/FriendStage';
import { saveChikuPlayed } from '../../data/repos/learn-engine';

type Practice = { conceptId?: string; topicId?: string; reviewDue?: boolean; goldReview?: boolean };
const dropStatus = (row?: LearnDropRow) => !row ? 'Not started' : row.drop.cursor >= row.drop.items.length ? 'Done for today' : `${row.drop.cursor} of ${row.drop.items.length} done`;
const dropAction = (row?: LearnDropRow) => !row ? 'Start' : row.drop.cursor >= row.drop.items.length ? 'View' : 'Continue';

export function Learn({ entry }: { entry?: string }) {
  const [practice, setPractice] = useState<Practice>();
  const [moti, setMoti] = useState<'haveli' | 'matka' | null>(null);
  const [chikuFor, setChikuFor] = useState<{ conceptId: string; title: string; scene: ChikuScene } | null>(null);
  const [chikuBack, setChikuBack] = useState<string>();
  // Closing Chiku returns focus to that idea's card (the chip is gone once played, so its Practice button).
  useEffect(() => {
    if (!chikuBack || chikuFor) return;
    const target = [...document.querySelectorAll<HTMLElement>('button[aria-label]')].find(node => node.getAttribute('aria-label') === `Teach Chiku: ${chikuBack}` || node.getAttribute('aria-label') === `Practice this idea: ${chikuBack}`);
    target?.focus();
  }, [chikuBack, chikuFor]);
  const [expanded, setExpanded] = useState<string>();
  const [openedAt] = useState(() => Date.now());
  const [message, setMessage] = useState('');
  const data = useLiveQuery(async () => ({
    setting: await db.settings.get(selectedTopicKey),
    sound: await db.settings.get('economy.soundOn'),
    states: await db.learnConcepts.toArray(),
    daily: await db.learnDrops.get(dailyDropId(openedAt)),
    night: await db.learnDrops.get(nightDropId(openedAt)),
    facts: (await loadEngineFacts(db)).facts,
    ledger: await db.ledger.toArray(),
    bedtime: await effectiveBedtime(db, openedAt),
  }), [openedAt]);
  // The card follows the drop's bedtime rule, so it is checked again while the screen stays open.
  const [now, setNow] = useState(openedAt);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 30_000); return () => window.clearInterval(timer); }, []);
  const afterBedtime = !!data && isAfterBedtime(now, data.bedtime);
  const selected = chosenTopics(data?.setting?.value);
  const figures = learningFigures({ facts: data?.facts ?? [] }, openedAt);
  const stateById = new Map((data?.states ?? []).map(row => [row.id, row]));
  // Today's lesson in a saved daily drop that has not reached it yet, so its topic card names the step Today opens
  // (Codex A items 73, 74). Once the drop is past its lesson, the card follows the next untaught step.
  const savedDrop = data?.daily && !data.daily.deleted ? data.daily.drop : undefined;
  const savedLesson = savedDrop?.items.slice(savedDrop.cursor).find(item => item.lesson)?.lesson;
  const [unitScene, setUnitScene] = useState<string>();
  const learned = new Set((data?.states ?? []).filter(row => !!row.firstLearnedAt).map(row => row.id));
  const completedUnit = data && completedModuleKey(topics.flatMap(pack => pack.body.modules), learned, id => localStorage.getItem(`cast.unit:${id}`) === 'seen');
  useEffect(() => {
    if (!completedUnit || matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduce') return;
    try { localStorage.setItem(`cast.unit:${completedUnit}`, 'seen'); } catch { /* Scene remains optional when storage is blocked. */ }
    playCastSound('chest', data?.sound?.value === true && !data.sound.deleted);
    queueMicrotask(() => setUnitScene(completedUnit));
  }, [completedUnit, data?.sound]);
  const scene = unitScene && <UnitScene moduleId={unitScene} close={() => setUnitScene(undefined)} />;
  const isDue = (id: string) => {
    const state = stateById.get(id);
    return !!state && ((!!state.memory && state.memory.dueAt <= openedAt) || ([7, 30] as const).some(day =>
      !!state.firstLearnedAt && openedAt >= state.firstLearnedAt + day * 86_400_000 && !state.retentionChecks?.[day]));
  };
  const dueCount = topics.filter(pack => selected.includes(pack.body.topic.id))
    .flatMap(pack => pack.body.modules.flatMap(module => module.concepts)).filter(concept => isDue(concept.id)).length;
  const toggle = async (id: string) => {
    const next = selected.includes(id) ? selected.filter(value => value !== id) : [...selected, id];
    if (!next.length) return;
    try {
      const now = openedAt;
      const deviceId = await getOrCreateDeviceId(db, now);
      await trackWrite(() => db.settings.put({ key: selectedTopicKey, value: next, updatedAt: now, deleted: 0, deviceId }));
      setMessage('Topics updated.');
    } catch { setMessage('Could not update topics. Try again.'); }
  };
  // Spec 26: Moti's haveli (finished ideas with pieces) and, on Sundays before bedtime, Moti's matka.
  const today = dayKey(now);
  const haveliIdeas = finishedIdeas(HAVELI_IDEAS, data?.ledger ?? []);
  const haveliCap = RULES.moti.haveliDailyCap;
  const dueAt = new Map((data?.states ?? []).filter(row => row.memory).map(row => [row.id, row.memory!.dueAt]));
  const haveliToday = haveliPicks(haveliIdeas, data?.ledger ?? [], dueAt, now, today, haveliCap);
  const visits = lastVisits(data?.ledger ?? []);
  const litToday = haveliIdeas.filter(idea => visits.get(idea.id) === today).map(idea => idea.id);
  const week = weekStart(today);
  const sunday = new Date(`${today}T12:00:00`).getDay() === 0;
  const matkaItems = afterBedtime ? [] : matkaPicks(data?.ledger ?? [], today, week, sunday, matkaAskable);
  const matkaDone = (data?.ledger ?? []).filter(row => row.kind === 'matka' && row.refId.startsWith(`${week}.`)).map(row => String(row.inputs.sourceFactId));
  if (moti === 'haveli') return <Haveli ideas={haveliToday} lit={litToday} everLit={[...visits.keys()]} cap={haveliCap} day={today} onRebuilt={idea => saveHaveliRebuilt(db, idea.id, Date.now())} onLeave={() => setMoti(null)} />;
  if (moti === 'matka') return <Matka items={matkaItems} answered={matkaDone} context={matkaContext} onAnswer={(item, recalled) => saveMatkaAnswer(db, { week, item, recalled, now: currentTime() })} onLeave={() => setMoti(null)} />;
  // Spec 30 second door: ideas finished before their scene existed can still teach Chiku once (Codex B item 110).
  const taughtSteps = new Set((data?.ledger ?? []).filter(fact => fact.kind === 'learn-lesson' && !fact.deleted).map(fact => fact.refId));
  const chikuPlayedIds = new Set((data?.ledger ?? []).filter(fact => fact.kind === 'chiku' && !fact.deleted).map(fact => fact.refId));
  if (chikuFor) return <section className="screen learn-screen"><ChikuStage scene={chikuFor.scene} seed={`${chikuFor.conceptId}:${dayKey(now)}`} onPlayed={(card, matched) => { const at = Date.now(); void getOrCreateDeviceId(db, at).then(deviceId => saveChikuPlayed(db, { conceptId: chikuFor.conceptId, card, matched, deviceId, now: at })).catch(() => setMessage("Could not save Chiku's turn.")); }} onDone={() => { setChikuBack(chikuFor.title); setChikuFor(null); }} />{message && <p role="status">{message}</p>}</section>;
  if (entry === 'drop') return <section className="screen learn-screen"><p className="eyebrow">Today</p><h1>Today's drop</h1><LearnDrop daily itemCount={5} onDone={() => go('learn')} />{scene}</section>;
  if (practice) return <section className="screen learn-screen">{(practice.reviewDue || practice.goldReview) && <AreaScope area="review" />}<LearnDrop daily={false} itemCount={practice.goldReview ? 5 : 3} preferredConceptId={practice.conceptId} practiceTopicId={practice.topicId} reviewDue={practice.reviewDue} goldReview={practice.goldReview} onDone={() => setPractice(undefined)} />{scene}</section>;
  return <section className="screen learn-screen"><FriendStage area="learn"><p className="eyebrow">Your curiosity, in motion</p><h1>Learn</h1></FriendStage>
    <section className="card learn-today" aria-label="Today"><h2>Today</h2>
      <div className="learn-today-status"><div><strong>Today's drop</strong><span>{dropStatus(data?.daily)}</span></div><button type="button" onClick={() => go('learn/drop')}>{dropAction(data?.daily)}</button></div>
      <div className="learn-today-status"><div><strong>Night drop</strong><span>{dropStatus(data?.night)}</span></div><span className="learn-today-note">In your night cards</span></div>
    </section>
    {/* Item 135: one friend per panel. Today is Chiku's; review (idea checks, haveli, matka) gets Moti's own rose card. */}
    {(dueCount > 0 || haveliIdeas.length > 0 || (matkaItems.length > 0 && matkaDone.length < matkaItems.length)) && <section className="card learn-moti" data-area="review" aria-label="Review with Moti">
      <FriendStage area="review" size={48} compact><h2>Review with Moti</h2></FriendStage>
      {dueCount > 0 && <><button type="button" className="learn-review-action" onClick={() => setPractice({ reviewDue: true })}>Idea checks · {Math.min(dueCount, 3)} today</button>{dueCount > 3 && <p className="deck-meta">{dueCount} ideas waiting</p>}</>}
      {haveliIdeas.length > 0 && <button type="button" className="secondary learn-haveli-action" onClick={() => setMoti('haveli')}>Haveli · {haveliCount(haveliToday, litToday, visits, haveliCap)}</button>}
      {matkaItems.length > 0 && matkaDone.length < matkaItems.length && <button type="button" className="secondary learn-matka-action" onClick={() => setMoti('matka')}>Matka · {matkaItems.length - matkaDone.length} sealed guesses</button>}
    </section>}
    <div className="learn-map-heading"><h2>Topics</h2><p>Open a topic to explore its ideas. Practice is always optional.</p></div>
    {[...topics].sort((a, b) => Number(selected.includes(b.body.topic.id)) - Number(selected.includes(a.body.topic.id))).map(pack => {
      const topicId = pack.body.topic.id;
      const concepts = pack.body.modules.flatMap(module => module.concepts);
      const strong = concepts.filter(concept => ['Strong', 'Mastered'].includes(masteryMapState(stateById.get(concept.id)))).length;
      // Gold review waits until every step of the idea was taught on an earlier day.
      const taughtOn = Object.fromEntries((data?.ledger ?? []).filter(fact => fact.kind === 'learn-lesson' && !fact.deleted).map(fact => [fact.refId, fact.dayKey]));
      const gold = new Set((data?.ledger ?? []).filter(fact => fact.kind === 'gold-review').map(fact => fact.refId));
      const mastered = new Set(concepts.filter(concept => masteryMapState(stateById.get(concept.id)) === 'Mastered' || gold.has(concept.id)).map(concept => concept.id));
      const open = expanded === topicId;
      // Each card leads with the next lesson's own hook guess, which that lesson answers (items 71 B3, 72); once every
      // step is taught, with the first idea not yet strong. The six topics no longer read alike (audit 10-21).
      const hook = cardHook(concepts, new Set(Object.keys(taughtOn)), concepts.find(concept => !['Strong', 'Mastered'].includes(masteryMapState(stateById.get(concept.id)))), savedLesson, afterBedtime);
      return <section className="card learn-map-topic" key={pack.id}>
        <button type="button" className="learn-topic-expand" aria-expanded={open} aria-controls={`learn-ideas-${topicId}`} onClick={() => setExpanded(open ? undefined : topicId)}>
          <span className="learn-topic-title"><strong>{pack.title}</strong><span aria-hidden="true">{open ? '−' : '+'}</span></span>
          <span className="learn-topic-hook" data-step={hook.stepId}>{hook.text ?? pack.description}</span>
          <span className="learn-topic-progress-label">{strong} of {concepts.length} ideas strong</span>
          <span className="learn-topic-progress" role="progressbar" aria-label={`${pack.title} strong ideas`} aria-valuenow={strong} aria-valuemin={0} aria-valuemax={concepts.length}><span style={{ width: `${strong / concepts.length * 100}%` }} /></span>
        </button>
        <button type="button" className="secondary learn-topic-toggle" aria-pressed={selected.includes(topicId)} onClick={() => void toggle(topicId)}>{selected.includes(topicId) ? 'In my drops ✓' : 'Add to my drops'}</button>
        {open && <div id={`learn-ideas-${topicId}`} className="learn-trail" aria-label={`${pack.title} mastery map`}><div className="learn-trail-legend">{(['New', 'Learning', 'Strong'] as const).filter(label => concepts.some(concept => (masteryMapState(stateById.get(concept.id)) === 'Not started' ? 'New' : masteryMapState(stateById.get(concept.id))) === label)).map(label => <h3 key={label}>{label}</h3>)}</div>{pack.body.modules.map(module => { const current = module.concepts.findIndex(item => !gold.has(item.id) && !['Strong', 'Mastered'].includes(masteryMapState(stateById.get(item.id)))); return <section key={module.id} className="learn-trail-module"><h3>{module.title}</h3>{module.concepts.map((concept, index) => { const state = gold.has(concept.id) ? 'Gold' : masteryMapState(stateById.get(concept.id)); const triedToday = (data?.ledger ?? []).some(fact => fact.kind === 'gold-attempt' && fact.refId === `${concept.id}:${new Date(openedAt).toISOString().slice(0, 10)}`); return <div key={concept.id}><div className={`learn-trail-node learn-idea-row offset-${index % 3}`} data-state={state === 'Not started' ? 'new' : state.toLowerCase()} data-current={index === current || undefined}><span className="learn-trail-dot" aria-hidden="true">{index + 1}</span><div><strong>{concept.title}</strong><small>{state}</small></div><button type="button" className="secondary" aria-label={`Practice this idea: ${concept.title}`} onClick={() => setPractice({ conceptId: concept.id, topicId })}>Practice</button>{chikuOpen(concept, taughtSteps, chikuPlayedIds, afterBedtime) && <button type="button" className="secondary learn-chiku-chip" aria-label={`Teach Chiku: ${concept.title}`} onClick={() => { if (data && isAfterBedtime(Date.now(), data.bedtime)) return; setChikuFor({ conceptId: concept.id, title: concept.title, scene: concept.chiku as ChikuScene }); }}>Teach Chiku</button>}{state === 'Mastered' && goldItems(concept, taughtOn, dayKey(openedAt)) && <button type="button" className="secondary" disabled={triedToday} onClick={() => setPractice({ conceptId: concept.id, topicId, goldReview: true })}>Gold review</button>}</div>{(index + 1) % 4 === 0 && index < module.concepts.length - 1 && <div className="learn-trail-checkpoint"><Cast name="Chiku" pose={module.concepts.slice(0, index + 1).every(item => gold.has(item.id) || ['Strong', 'Mastered'].includes(masteryMapState(stateById.get(item.id)))) ? 'cheer' : 'think'} size={44} />Checkpoint · {index + 1} ideas</div>}</div>; })}<div className="learn-trail-chest"><Cast name="Chiku" pose={chestReady(module.concepts.map(concept => concept.id), mastered) ? 'cheer' : 'idle'} size={44} />Unit chest · {chestReady(module.concepts.map(concept => concept.id), mastered) ? 'Opened' : 'Keep exploring'} · {RULES.gamify.unitChestShards} Shards</div></section>; })}</div>}
      </section>;
    })}
    <section className="card learn-figures" aria-label="How your learning is holding"><h2>How your learning is holding</h2><p>30-day recall: {figures.recall30 === null ? 'Builds after your first 30 days' : `${figures.recall30}%`}</p>{figures.sureAccuracy !== null && <p>When you feel sure, you are right {figures.sureAccuracy}% of the time</p>}</section>
    {message && <p role="status">{message}</p>}
    <Mind entry="courses" />{scene}
  </section>;
}
