import { phaseLine } from '../shell/tabs';
import { go } from '../shell/router';

export function Mind() { return <section className="screen"><p className="eyebrow">Your space</p><h1>Mind</h1><p>{phaseLine.Mind}</p><button onClick={() => go('mind/generator')}>Generator check <span aria-hidden="true">↗</span></button></section>; }
