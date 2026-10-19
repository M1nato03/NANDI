import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Home-screen widgets are drawn through RemoteViews, which inflates only these classes.
// Anything else (a plain View, ConstraintLayout, a custom view) shows "Can't load widget".
const REMOTE_VIEWS_ALLOWED = new Set([
  'FrameLayout', 'LinearLayout', 'RelativeLayout', 'GridLayout',
  'AnalogClock', 'Button', 'Chronometer', 'ImageButton', 'ImageView', 'ProgressBar', 'TextView', 'ViewFlipper',
  'ListView', 'GridView', 'StackView', 'AdapterViewFlipper', 'ViewStub',
  'CheckBox', 'Switch', 'RadioButton', 'RadioGroup',
]);

const layoutDir = join(process.cwd(), 'android/app/src/main/res/layout');

describe('widget layouts', () => {
  const widgetLayouts = readdirSync(layoutDir).filter(name => name.startsWith('widget_'));

  it('exist', () => {
    expect(widgetLayouts.length).toBeGreaterThan(0);
  });

  for (const name of widgetLayouts) {
    it(`${name} uses only views a home-screen widget can draw`, () => {
      const xml = readFileSync(join(layoutDir, name), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
      const tags = [...xml.matchAll(/<([A-Za-z][\w.]*)[\s/>]/g)].map(match => match[1]!).filter(tag => tag !== 'xml');
      expect(tags.filter(tag => !REMOTE_VIEWS_ALLOWED.has(tag))).toEqual([]);
    });
  }
});
