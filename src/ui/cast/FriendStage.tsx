import type { ReactNode } from 'react';
import { Cast, type Pose } from './Cast';
import { STAGES, type Area } from '../areas';

/**
 * Spec 25 §2: the friend stage at the top of a tab. With `band`, the friend sits big on a band in the area's stage
 * colour, fixed in both themes; the band is light behind a dark friend and deep behind a light one, so the friend reads
 * at 3:1 or more (the night deck and Moti's review card keep it). Spec 45c: an area page heads with a notebook line
 * instead: where the friend is, in the area's ink, the one heading, and the friend standing on a quiet shared ground
 * beside them. `art` replaces the plain friend with an animated one (Kapi's moments, Mor's reactions).
 */
export function FriendStage({ area, pose = 'idle', size = 96, art, compact, band, children }: { area: Area; pose?: Pose; size?: number; art?: ReactNode; compact?: boolean; band?: boolean; children?: ReactNode }) {
  const stage = STAGES[area];
  if (!band) return <section className="friend-stage notebook-head" data-friend={stage.friend} data-compact={compact || undefined} aria-label={`${stage.friend}'s stage`}>
    {children && <div className="friend-stage-text">{children}</div>}
    <span className="notebook-ground">{art ?? <Cast name={stage.friend} pose={pose} size={Math.min(size, 72)} />}</span>
  </section>;
  return <section className="friend-stage" data-friend={stage.friend} data-rim={stage.rim} data-compact={compact || undefined} aria-label={`${stage.friend}'s stage`}>
    {art ?? <Cast name={stage.friend} pose={pose} size={size} />}
    {children && <div className="friend-stage-text">{children}</div>}
  </section>;
}
