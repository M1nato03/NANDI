import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { budgetBar, chooseTrackDay } from '../../core/learn/tracks';
import { RULES } from '../../core/rules.config';
import { weekKey } from '../../core/quests';
import { db } from '../../data/db';
import { bundledPacks } from '../../data/packs/seed';
import type { TrackPack, TrackUnit } from '../../data/packs/schemas';
import { createQuestRepo } from '../../data/repos/quests';
import { completeTrackUnit, introduceTrackCards, recordModuleTest, saveTrackDraft, selectTrack, trackUnitId, type TrackDraft } from '../../data/repos/tracks';
import { recordError } from '../errorRing';
import { back, go } from '../shell/router';

export const trackPacks = bundledPacks.filter((pack): pack is TrackPack => pack.kind === 'track');
export function trackCardContent(): Record<string, [string, string]> {
  const out: Record<string, [string, string]> = {};
  for (const pack of trackPacks) for (const module of pack.body.modules) for (const unit of module.units) unit.cards.forEach((card, i) => { out[`${trackUnitId(pack, unit.id)}:${i + 1}`] = card; });
  return out;
}

function TrackPlayer({ pack, unit, draft, afterBedtime, leave }: { pack: TrackPack; unit: TrackUnit; draft: TrackDraft; afterBedtime: boolean; leave: () => void }) {
  const [currentDraft, setCurrentDraft] = useState(draft);
  const draftRef = useRef(draft);
  const writeQueue = useRef<Promise<void>>(Promise.resolve());
  const revision = useRef(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const update = (next: TrackDraft) => {
    draftRef.current = next;
    setCurrentDraft(next);
    setSaving(true); setError('');
    const thisRevision = ++revision.current;
    const pending = writeQueue.current.then(() => saveTrackDraft(db, next));
    writeQueue.current = pending.catch(() => {});
    void pending.then(
      () => { if (thisRevision === revision.current) setSaving(false); },
      cause => { recordError('window', cause); if (thisRevision === revision.current) { setError('Could not save this step. Try again.'); setSaving(false); } },
    );
  };
  const answer = (index: number, value: number) => { const answers = [...draftRef.current.answers]; answers[index] = value; update({ ...draftRef.current, answers }); };
  const confidence = (index: number, value: number) => { const values = [...draftRef.current.confidence]; values[index] = value; update({ ...draftRef.current, confidence: values }); };
  const finish = async () => {
    setSaving(true); setError('');
    try { await writeQueue.current; await completeTrackUnit(db, pack, draftRef.current, afterBedtime); leave(); }
    catch (cause) { recordError('window', cause); setError('Could not save the unit. Try again.'); }
    finally { setSaving(false); }
  };
  return <section className="card track-player" data-save-state={saving ? 'saving' : error ? 'error' : 'saved'} aria-label="Track unit">
    <p className="eyebrow">{pack.body.track.name} · Today’s unit</p><h2>{unit.title}</h2>
    <p className="mind-save" role="status">{saving ? 'Saving…' : error || 'Saved'}</p>
    {currentDraft.step === 'points' && <>
      <h3>Look for these three ideas</h3><ul>{unit.lookFor.map(point => <li key={point}>{point}</li>)}</ul>
      {unit.video ? <><a className="track-video" href={`${unit.video.url}${unit.video.url.includes('?') ? '&' : '?'}t=${unit.video.startSeconds}`} target="_blank" rel="noopener noreferrer">Open video: {unit.video.title}</a><label className="track-watch"><input type="checkbox" checked={currentDraft.watched} onChange={event => update({ ...draftRef.current, watched: event.target.checked })} /> I watched the video</label></> : <p>{unit.videoTodo}</p>}
      <p>{unit.explanation}</p><button type="button" disabled={saving || !!unit.video && !currentDraft.watched} onClick={() => update({ ...draftRef.current, step: 'check' })}>Start three-question check</button>
    </>}
    {currentDraft.step === 'check' && <>
      <p>Choose an answer and how sure you feel for each question.</p>
      {unit.check.map((question, index) => <fieldset key={`${unit.id}:${index}`} className="track-question" disabled={saving}><legend>{index + 1}. {question.q}</legend>
        {question.options.map((option, optionIndex) => <label key={optionIndex}><input type="radio" name={`track-q-${pack.id}-${unit.id}-${index}`} checked={currentDraft.answers[index] === optionIndex} onChange={() => answer(index, optionIndex)} /> {option}</label>)}
        <label>Confidence <select aria-label={`Question ${index + 1} confidence`} value={currentDraft.confidence[index] ?? ''} onChange={event => confidence(index, Number(event.target.value))}><option value="">Choose</option><option value="35">35%</option><option value="65">65%</option><option value="90">90%</option></select></label>
        {currentDraft.answers[index] !== undefined && <p className="mind-feedback">{currentDraft.answers[index] === question.answer ? 'Right.' : `Answer: ${question.options[question.answer]}.`} {question.why}</p>}
      </fieldset>)}
      <label>Explain it to a friend (optional)<textarea defaultValue={currentDraft.explain ?? ''} onBlur={event => update({ ...draftRef.current, explain: event.target.value })} /></label>
      <button type="button" disabled={saving || currentDraft.answers.length !== 3 || currentDraft.confidence.length !== 3 || currentDraft.answers.some(value => value === undefined) || currentDraft.confidence.some(value => value === undefined)} onClick={() => update({ ...draftRef.current, step: 'cards' })}>See recall cards</button>
    </>}
    {currentDraft.step === 'cards' && <><h3>Three recall cards</h3>{unit.cards.map(([front, back]) => <div className="mind-feedback" key={front}><strong>{front}</strong><p>{back}</p></div>)}<p>These join your shared reviews, up to {RULES.learningTracks.newCardsPerDay} new cards per day.</p><button type="button" disabled={saving} onClick={() => void finish()}>Finish unit</button></>}
  </section>;
}

export function Tracks({ day, afterBedtime, showUnit = false }: { day: string; afterBedtime: boolean; showUnit?: boolean }) {
  const settings = useLiveQuery(() => db.settings.toArray(), []) ?? [];
  const progress = useLiveQuery(() => db.lessonProg.toArray(), []) ?? [];
  const cards = useLiveQuery(() => db.cards.toArray(), []) ?? [];
  const quests = useLiveQuery(() => db.quests.toArray(), []) ?? [];
  const [error, setError] = useState('');
  const [testAnswers, setTestAnswers] = useState<number[]>([]);
  const [testResult, setTestResult] = useState('');
  const [testing, setTesting] = useState(false);
  const activeId = settings.find(row => row.key === 'mind.activeTrack' && !row.deleted)?.value;
  const active = trackPacks.find(pack => pack.id === activeId);
  const draft = settings.find(row => row.key === 'mind.trackDraft' && !row.deleted)?.value as TrackDraft | null | undefined;
  const activeDraft = active && draft?.packId === active.id && draft.day === day ? draft : null;
  const units = active?.body.modules.flatMap(module => module.units) ?? [];
  const completed = active ? progress.filter(row => row.packId === active.id && row.doneDayKey && row.id.startsWith('track:')).map(row => ({ id: row.id.split(':').at(-1)!, day: row.doneDayKey! })) : [];
  const due = cards.filter(row => !row.deleted && (row.reviews ?? 0) > 0 && row.due <= day).length;
  const spent = Number(settings.find(row => row.key === `mind.trackMinutes:${day}` && !row.deleted)?.value ?? 0);
  const plan = chooseTrackDay({ day, active: !!active, unitIds: units.map(row => row.id), completed, dueReviews: due, spentMinutes: spent });
  const nextUnit = units.find(row => row.id === plan.unitId);
  const bar = budgetBar({ unitMinutes: activeDraft ? units.find(row => row.id === activeDraft.unitId)?.minutes ?? 0 : nextUnit?.minutes ?? 0, checkMinutes: activeDraft || nextUnit ? 3 : 0, dueReviews: due, spentMinutes: spent });
  const playUnit = activeDraft && units.find(row => row.id === activeDraft.unitId);
  const module = active?.body.modules[0];
  const moduleDone = module && module.units.every(unit => completed.some(row => row.id === unit.id));
  const testDone = active && module && progress.some(row => row.id === `track-module:${active.body.track.id}:${module.id}` && row.doneDayKey);
  const questions = module?.units.flatMap(unit => unit.check).slice(0, 10) ?? [];
  const questTitle = module ? `${active?.body.track.name}: ${module.apply.title}` : '';
  const questAdded = quests.some(row => row.week === weekKey(new Date(`${day}T12:00:00`)) && row.title === questTitle && row.status !== 'swapped');
  useEffect(() => { if (trackPacks.length) void introduceTrackCards(db, trackPacks).catch(cause => recordError('window', cause)); }, [day]);
  const start = async () => {
    if (!active || !nextUnit) return;
    try { await saveTrackDraft(db, { packId: active.id, unitId: nextUnit.id, day, step: 'points', watched: false, answers: [], confidence: [] }); go('learn/unit'); }
    catch (cause) { recordError('window', cause); setError('Could not start this unit.'); }
  };
  const addQuest = async () => {
    if (!module || questAdded) return;
    try { await createQuestRepo(db).addCustom({ title: questTitle, kind: 'once', target: 1, unit: '', step: 1 }, Date.now()); }
    catch (cause) { recordError('window', cause); setError('Could not add the quest.'); }
  };
  const finishTest = async () => {
    if (!active || !module) return;
    try { const result = await recordModuleTest(db, active, module.id, testAnswers); setTestResult(`${result.score}% · ${result.passed ? 'Module complete.' : 'Weak cards are due sooner. Mastery is kept.'}`); setTesting(false); }
    catch (cause) { recordError('window', cause); setError('Could not save the module test.'); }
  };
  return <section className="card track-hub" aria-label="Learning tracks"><h2>Learning tracks</h2>
      {playUnit && active && showUnit ? <TrackPlayer key={`${active.id}:${playUnit.id}:${day}`} pack={active} unit={playUnit} draft={activeDraft!} afterBedtime={afterBedtime} leave={() => back('learn')} /> : <>
      {playUnit && <button type="button" onClick={() => go('learn/unit')}>Continue today’s unit</button>}
      {trackPacks.map(pack => <div className="track-choice" key={pack.id}><strong>{pack.body.track.name}</strong><p>{pack.body.track.blurb}</p><p>{activeId === pack.id ? 'Active' : 'Parked'}</p><button type="button" className="secondary" disabled={activeId === pack.id} onClick={() => void selectTrack(db, pack.id).catch(cause => { recordError('window', cause); setError('Could not select track.'); })}>{activeId === pack.id ? 'Selected' : 'Pick this track'}</button></div>)}
      {active && <><button type="button" className="text-button" onClick={() => void selectTrack(db, null).catch(cause => { recordError('window', cause); setError('Could not park track.'); })}>Park track</button>
        <div className="track-budget" role="group" aria-label="Learning budget">
          <span>Learning budget</span>
          <progress max={bar.limit} value={bar.used} aria-label="Minutes used" />
          <span>{bar.used} / {bar.limit} min planned today</span>
        </div>
        {plan.kind === 'new' && nextUnit ? <><p>Today: {nextUnit.title}</p><button type="button" onClick={() => void start()}>Start today’s unit</button></> : <div className="track-stop"><h3>Done for today</h3><p>{plan.reason === 'backlog' ? 'Reviews are above 30. Today is for reviews.' : plan.kind === 'apply' ? 'Apply one idea from this module.' : plan.kind === 'review' ? 'Today is for review.' : plan.kind === 'off' ? 'Today is an off day.' : 'Your learning is complete for today.'}</p></div>}
        {module && (plan.kind === 'apply' || moduleDone) && <><p>{module.apply.detail}</p><button type="button" className="secondary" disabled={questAdded} onClick={() => void addQuest()}>{questAdded ? 'Added to side quests' : 'Add apply quest to this week'}</button></>}
        {moduleDone && !testDone && <><button type="button" className="secondary" onClick={() => setTesting(value => !value)}>{testing ? 'Close module test' : 'Take module test'}</button>{testing && <div className="track-test"><h3>Module test</h3>{questions.map((question, index) => <fieldset key={`${module.id}:${index}`}><legend>{index + 1}. {question.q}</legend>{question.options.map((option, optionIndex) => <label key={optionIndex}><input type="radio" name={`module-q-${active.id}-${module.id}-${index}`} checked={testAnswers[index] === optionIndex} onChange={() => setTestAnswers(previous => { const next = [...previous]; next[index] = optionIndex; return next; })} /> {option}</label>)}</fieldset>)}<button type="button" disabled={testAnswers.length !== questions.length || testAnswers.some(value => value === undefined)} onClick={() => void finishTest()}>Check module</button></div>}</>}
        {testResult && <p role="status">{testResult}</p>}
      </>}
    </>}{error && <p role="alert">{error}</p>}
  </section>;
}
