import { NightPlanSetting } from './NightPlanSetting';
import { NightSettings } from './NightSettings';

export function Night() {
  return <section className="screen"><p className="eyebrow">You</p><h1>Night</h1>
    <NightPlanSetting />
    <NightSettings />
  </section>;
}
