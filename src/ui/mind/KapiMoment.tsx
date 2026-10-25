import type { ReactNode } from 'react';
import { Kapi, type Pose } from '../cast/Cast';

/** The moments Kapi reacts to (spec 29 table). Each plays once per action, never blocks a tap, and is a pose change only under reduced motion. */
export type KapiMomentKind = 'idle' | 'swing' | 'hop' | 'clap' | 'scratch' | 'whisper' | 'cartwheel' | 'nap';
const POSE: Record<KapiMomentKind, Pose> = { idle: 'idle', swing: 'idle', hop: 'think', clap: 'cheer', scratch: 'think', whisper: 'think', cartwheel: 'cheer', nap: 'rest' };

export function KapiMoment({ moment, at = 0, size = 48, children }: { moment: KapiMomentKind; at?: number; size?: number; children?: ReactNode }) {
  return <div className={`kapi-say${children ? '' : ' alone'}`}>
    <span className={`kapi-friend kapi-${moment}`} key={`${moment}-${at}`} data-moment={moment}><Kapi pose={POSE[moment]} size={size} title="Kapi" /></span>
    {children && <div className="kapi-bubble" role="status">{children}</div>}
  </div>;
}
