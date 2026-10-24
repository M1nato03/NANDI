import { AppShell } from './shell/AppShell';
import './theme.css';
import './components.css';
import './redesign.css';
import './feel.css';
import './areas.css';
import { areaTokenCss } from './areas';

// Spec 25: the area colour values live in areas.ts; add them once, ahead of areas.css's mapping rules.
if (typeof document !== 'undefined' && !document.getElementById('nandi-area-tokens')) {
  const style = document.createElement('style');
  style.id = 'nandi-area-tokens';
  style.textContent = areaTokenCss();
  document.head.prepend(style);
}

export default AppShell;
