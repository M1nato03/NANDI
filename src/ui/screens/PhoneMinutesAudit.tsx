import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { getOrCreateDeviceId } from '../../data/device';
import { createSettingsRepos } from '../../data/repos/settings';
import { trackWrite } from '../../core/pendingWrites';
import { calendarDayKey, calendarWeekday } from '../../core/phoneUsage/calendarDay';
import type { UnknownReason } from '../../core/phoneUsage/coverage';
import { PHONE_USAGE_KEYS, pickedApps, setIdFor } from '../../core/phoneUsage/baseline';
import { auditCsv, auditDays, auditState, canPass, deviceFromUserAgent, newAuditPass, readAuditPass, type AuditState } from '../../core/phoneUsage/audit';
import { shareOrDownload } from '../../platform/files';

const REASONS: Record<UnknownReason, string> = {
  no_access: 'Usage access was off',
  short_history: 'the phone’s log did not reach back this far',
  boundary_unknown: 'what was open at midnight is unknown',
  reboot_ambiguous: 'the phone restarted with an app open',
  event_gap: 'the log went quiet with an app open',
  clock_change: 'the clock was changed',
  timezone_change: 'the time zone changed',
  mismatch: 'Android counted more than the record',
};
const VOID: Record<Extract<AuditState, { state: 'void' }>['why'], string> = {
  catalog: 'the list of similar apps changed',
  apps: 'the picked apps changed',
  measure: 'the way minutes are measured changed',
  device: 'this is a different phone',
  mismatch: 'a later day showed Android counting more than the record',
};
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const minutes = (ms: number | null) => ms === null ? 'unknown' : `${Math.round(ms / 60_000)} min`;
const currentTime = () => Date.now();

/**
 * Spec 46b: the owner's 30-day audit of the daily minutes record, reached only from the unlocked owner panel. It lists
 * each finished day with picked and similar-app totals and the reason for every unknown, makes the CSV only after a
 * warning, and gives the fail-closed audit pass only on the owner's say-so after checking against Digital Wellbeing.
 */
export function PhoneMinutesAudit({ onBack }: { onBack: () => void }) {
  const source = useLiveQuery(async () => ({ rows: await db.phoneUsageMinutes.toArray(), settings: await db.settings.toArray() }), []);
  const [confirm, setConfirm] = useState<'export' | 'pass' | null>(null);
  const [message, setMessage] = useState('');
  if (!source) return <section className="screen"><p>Loading…</p></section>;
  const now = currentTime();
  const today = calendarDayKey(now);
  const days = auditDays(source.rows, today);
  const picked = pickedApps(source.settings);
  const setId = picked ? setIdFor(picked) : null;
  const deviceId = source.settings.find(row => row.key === 'deviceId')?.value as string | undefined ?? null;
  const state = auditState(readAuditPass(source.settings), { setId, deviceId }, source.rows);
  const complete = days.filter(day => day.complete).length;
  const unknown = days.filter(day => day.recorded && !day.complete).length;
  const missing = days.filter(day => !day.recorded).length;
  const passable = canPass(days, setId);
  const status = state.state === 'valid' ? `Audit passed on ${calendarDayKey(state.pass.at)} for ${state.pass.firstDay} to ${state.pass.lastDay}.`
    : state.state === 'void' ? `The audit pass no longer holds: ${VOID[state.why]}.` : 'Not audited yet.';

  async function exportCsv() {
    setConfirm(null);
    try {
      const { model, androidVersion } = deviceFromUserAgent(navigator.userAgent);
      const csv = auditCsv(days, { model, androidVersion, appVersion: `${__APP_VERSION__} ${__BUILD_COMMIT__}`, exportedAt: new Date(currentTime()).toISOString(), audit: status });
      const result = await shareOrDownload(new File([csv], `nandi-phone-audit-${today}.csv`, { type: 'text/csv' }), undefined,
        { title: 'NANDI phone minutes audit', dialogTitle: 'Save the audit file', cancelledIfClosed: true });
      setMessage(result === 'cancelled' ? 'No file was sent.' : 'Audit file made. Delete it once you have compared the days.');
    } catch { setMessage('Could not make the audit file. Try again.'); }
  }
  async function givePass() {
    setConfirm(null);
    if (!setId) return;
    try {
      const at = currentTime();
      const id = await getOrCreateDeviceId(db, at);
      await createSettingsRepos(db, id).settings.put({ key: PHONE_USAGE_KEYS.audit, value: newAuditPass(days, setId, id, at) }, at);
      setMessage('Audit marked passed.');
    } catch { setMessage('Could not save the audit pass. Try again.'); }
  }
  async function clearPass() {
    try { await trackWrite(() => db.settings.delete(PHONE_USAGE_KEYS.audit)); setMessage('Audit pass cleared.'); }
    catch { setMessage('Could not clear the audit pass. Try again.'); }
  }

  return <section className="screen owner-panel phone-audit" aria-label="Phone minutes audit">
    <p className="eyebrow">Owner</p><h1>Phone minutes audit</h1>
    <p className="small">The last 30 finished days of the daily minutes record on this phone. Unknown is never counted as zero.</p>
    <p className="phone-audit-status">{status}</p>
    <p className="small">{complete} complete · {unknown} with unknowns · {missing} not recorded</p>
    <div className="phone-audit-actions">
      <button type="button" onClick={() => { setMessage(''); setConfirm('export'); }}>Export 30-day audit CSV</button>
      {state.state === 'none' || state.state === 'void'
        ? <button type="button" className="secondary" disabled={!passable} onClick={() => { setMessage(''); setConfirm('pass'); }}>Mark the audit passed</button>
        : <button type="button" className="secondary" onClick={() => void clearPass()}>Clear the audit pass</button>}
      {state.state !== 'valid' && !passable && <p className="small">Marking it passed needs 30 recorded days in a row, all with today’s picked apps.</p>}
    </div>
    {confirm === 'export' && <div className="card phone-audit-confirm" role="group" aria-label="Before the file is made">
      <p>This file holds your private app-use history: which apps, and for how long, on each of 30 days. It stays on this phone unless you send it on. Delete it when you are done.</p>
      <button type="button" onClick={() => void exportCsv()}>Make the file</button>
      <button type="button" className="secondary" onClick={() => setConfirm(null)}>Don’t make it</button>
    </div>}
    {confirm === 'pass' && <div className="card phone-audit-confirm" role="group" aria-label="Before marking the audit passed">
      <p>Mark it passed only after checking every day against Digital Wellbeing: within 10% or 10 minutes per app on at least 25 of the 30 days, and no day where a gap would make a week look better. {unknown} days here have unknowns.</p>
      <button type="button" onClick={() => void givePass()}>Mark passed</button>
      <button type="button" className="secondary" onClick={() => setConfirm(null)}>Cancel</button>
    </div>}
    {message && <p role="status">{message}</p>}
    <ol className="phone-audit-days">{[...days].reverse().map(day => <li key={day.day} className="card">
      <details>
        <summary><strong>{WEEKDAYS[calendarWeekday(day.day)]} {day.day}</strong>
          <span className="small">{!day.recorded ? 'Not recorded' : `Picked ${minutes(day.pickedMs)} · Similar apps ${minutes(day.substituteMs)}`}</span>
          {day.reasons.length > 0 && <span className="small phone-audit-reason">Unknown: {day.reasons.map(reason => REASONS[reason]).join('; ')}</span>}
        </summary>
        {day.recorded && <ul className="small">{day.packages.map(item => <li key={item.packageName}>
          {item.packageName} ({item.group === 'picked' ? 'picked' : 'similar'}): {minutes(item.foregroundMs)}{item.reason ? `, ${REASONS[item.reason]}` : ''}{item.installed === false ? ', not installed' : ''}{item.crossCheckMs !== null ? `, Android’s own total ${minutes(item.crossCheckMs)}` : ''}
        </li>)}</ul>}
      </details>
    </li>)}</ol>
    <button type="button" className="secondary" onClick={onBack}>Back to owner numbers</button>
  </section>;
}
