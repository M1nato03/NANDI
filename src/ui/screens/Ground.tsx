import { go } from '../shell/router';
import { phaseLine } from '../shell/tabs';
import { ErrorRing } from './ErrorRing';
import type { Appearance } from '../shell/useAppearance';

export function Ground({ theme, motion, setTheme, setMotion }: Appearance) {
  return <><div className="hero"><p className="eyebrow">The Proving Ground</p><strong className="rank">#500</strong><p>Bench · start where you are</p></div>
    <p>{phaseLine.Ground}</p><button onClick={() => go('ground/backup')}>Backup and restore <span aria-hidden="true">↗</span></button>
    <p className="small" style={{ fontFamily: 'var(--font-mono)' }}>NANDI {__APP_VERSION__} · {__BUILD_COMMIT__} · {__BUILD_DATE__}</p>
    <div className="card"><h2>Settings</h2>
      <label>Theme <select value={theme} onChange={event => void setTheme(event.target.value)}><option value="system">System</option><option value="dark">Dark</option><option value="light">Light</option></select></label>
      <label>Motion <select value={motion} onChange={event => void setMotion(event.target.value)}><option value="system">System</option><option value="reduce">Reduced</option></select></label>
    </div>
    <ErrorRing />
  </>;
}
