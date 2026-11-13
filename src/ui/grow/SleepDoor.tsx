import { FriendStage } from '../cast/FriendStage';
import { go } from '../shell/router';
import { nightPauseAvailable } from '../../platform/nightPause';
import { BedtimeSettings } from '../screens/BedtimeSettings';
import './grow.css';

/**
 * Spec 571 §4.3: the Calm & Sleep door, Kachhua's. Calm, Tonight (the night deck) and tonight's kolam open their own screens; shutdown and
 * bedtime live here (§0.18 #5); the app pause setup is a link to its one home (§0.18 #4), never a second copy.
 */
export function SleepDoor() {
  return <section className="screen sleep-door">
    <FriendStage area="night"><p className="eyebrow">Kachhua by the cot</p><h1>Calm &amp; Sleep</h1></FriendStage>
    <div className="sleep-links">
      <button type="button" data-testid="calm-link" onClick={() => go('grow/calm')}>Calm</button>
      {/* Spec 571 stage 2 (ii): with the Today dots gone, Night's one entry is here (#night from the widget still wins). */}
      <button type="button" className="secondary" data-testid="night-link" onClick={() => go('night')}>Tonight</button>
      <button type="button" className="secondary" data-testid="kolam-link" onClick={() => go('kolam')}>Trace tonight’s kolam</button>
      {nightPauseAvailable() && <button type="button" className="secondary" data-testid="night-pause-link" onClick={() => go('you/night')}>App pause</button>}
    </div>
    <BedtimeSettings />
  </section>;
}
