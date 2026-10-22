import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { ACTIONS, CUES, NIGHT_PLAN_KEY, nightPlanText, QUICK_PLANS, readNightPlan, type NightPlan } from '../../core/nightPlan';
import { db } from '../../data/db';
import { RULES } from '../../core/rules.config';
import { getOrCreateDeviceId } from '../../data/device';
import { createSettingsRepos } from '../../data/repos/settings';
import { askNotificationsOnce } from '../../platform/notifyPermission';

const currentTime = () => Date.now();

export function NightPlanSetting({ firstRun = false }: { firstRun?: boolean }) {
  const settings = useLiveQuery(() => db.settings.toArray(), []) ?? [];
  const saved = readNightPlan(settings);
  const bedtimeSetting = settings.find(row => row.key === 'planner.bedtime' && !row.deleted)?.value;
  const bedtime = typeof bedtimeSetting === 'string' && /^\d{2}:\d{2}$/.test(bedtimeSetting) ? bedtimeSetting : RULES.night.defaultBedtime;
  const [draft, setDraft] = useState<NightPlan | null>(null);
  const cue = draft?.cue ?? saved?.cue ?? '';
  const action = draft?.action ?? saved?.action ?? '';
  const cueNow = cue, actionNow = action;
  const [message, setMessage] = useState('');
  // The first night starts with three one-tap plans; writing your own is one tap further (audit 10-21).
  const [ownWords, setOwnWords] = useState(!firstRun);

  async function save(plan?: NightPlan) {
    const cue = plan?.cue ?? cueNow, action = plan?.action ?? actionNow;
    if (!cue.trim() || !action.trim()) { setMessage('Pick a cue and a next move.'); return; }
    try {
      const now = currentTime();
      const deviceId = await getOrCreateDeviceId(db, now);
      await createSettingsRepos(db, deviceId).settings.put({ key: NIGHT_PLAN_KEY, value: { cue: cue.trim(), action: action.trim() } }, now);
      setDraft(null);
      setMessage('Night plan saved. Back tonight.');
      // The first night plan is the moment a wind-down nudge makes sense, so Android asks here once (audit F1).
      if (firstRun) void askNotificationsOnce().catch(() => undefined);
    } catch { setMessage('Could not save your night plan. Try again.'); }
  }

  return <section className={`${firstRun ? '' : 'card '}night-plan-setting`} aria-label="Night plan setting">
    <span className="pill">{firstRun ? 'First night' : 'Night'}</span>
    <h2>{firstRun ? 'Make a tiny night plan' : 'Your night plan'}</h2>
    <p>When does the phone sneak into your night? {ownWords ? 'Pick a cue and one easy next move.' : 'Tap the plan that fits.'}</p>
    {!ownWords && <><div className="night-plan-quick">{QUICK_PLANS.map(plan => <button type="button" key={nightPlanText(plan)} className="secondary" onClick={() => void save(plan)}>{nightPlanText(plan)}</button>)}</div>
      <button type="button" className="text-button" onClick={() => setOwnWords(true)}>Write my own</button></>}
    {ownWords && <>
    <label htmlFor="night-cue">If I…</label>
    <select aria-label="Choose a bedtime cue" value={CUES.includes(cue) ? cue : 'own'} onChange={event => setDraft({ cue: event.target.value === 'own' ? '' : event.target.value, action })}>
      <option value="own">My own words</option>{CUES.map(item => <option key={item} value={item}>{item}</option>)}
    </select>
    <input id="night-cue" aria-label="Bedtime cue" value={cue} onChange={event => setDraft({ cue: event.target.value, action })} placeholder="getting into bed with my phone" maxLength={120} />
    <label htmlFor="night-action">Then I…</label>
    <select aria-label="Choose a replacement" value={ACTIONS.includes(action) ? action : 'own'} onChange={event => setDraft({ cue, action: event.target.value === 'own' ? '' : event.target.value })}>
      <option value="own">My own words</option>{ACTIONS.map(item => <option key={item} value={item}>{item}</option>)}</select>
    <input id="night-action" aria-label="Replacement action" value={action} onChange={event => setDraft({ cue, action: event.target.value })} placeholder="read 5 pages" maxLength={120} />
    {cue.trim() && action.trim() && <p className="night-plan-preview">{nightPlanText({ cue: cue.trim(), action: action.trim() })}</p>}
    <button type="button" onClick={() => void save()}>Save night plan</button>
    </>}
    {message && <p role="status">{message}</p>}
    <p className="small">Tip: set your phone's Bedtime mode to start at {bedtime} too.</p>
  </section>;
}
