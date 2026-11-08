import type { AreaId, AreaState } from '../../core/courtyard/courtyard';
import { FRIEND_AREA, FRIEND_IDS, rectOnScreen, type StageAnchors, type StageFit } from '../../core/courtyard/anchors';

/**
 * Spec 571 §0.19 layout B: one tap target per friend, exactly where the painted pass puts it (anchors tap_rect), and
 * each corner's "done today" light (today_glow_rect). Positions are screen CSS from stageFit, so every phone shape gets
 * the same taps the layout gates checked. The label says the area, its days and whether it was done today.
 */
export const friendLabel = (area: AreaState) => `${area.friend}, ${area.label}: ${area.days} ${area.days === 1 ? 'day' : 'days'}${area.today ? ', done today' : ''}`;

export function StageFriends({ anchors, fit, areas, onFriend }: { anchors: StageAnchors; fit: StageFit; areas: readonly AreaState[]; onFriend: (id: AreaId) => void }) {
  return <div className="courtyard-stage-taps">
    {FRIEND_IDS.map(id => {
      const area = areas.find(row => row.id === FRIEND_AREA[id]);
      if (!area) return null;
      const [x, y, w, h] = rectOnScreen(fit, anchors.friends[id].tap);
      const [gx, gy, gw, gh] = rectOnScreen(fit, anchors.friends[id].glow);
      return <span key={id} className="courtyard-friend-spot" data-friend={id}>
        {area.today && <i className="courtyard-today-glow" aria-hidden="true" style={{ left: gx, top: gy, width: gw, height: gh }} />}
        <button type="button" className="courtyard-friend-tap" data-area={area.id} aria-label={friendLabel(area)} style={{ left: x, top: y, width: w, height: h }} onClick={() => onFriend(area.id)} />
      </span>;
    })}
  </div>;
}
