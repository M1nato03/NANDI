import { useLayoutEffect, useRef, useState } from 'react';
import '../learn/learn.css';

type Reading = { root: number; rem: number; text16: number; rowLine: number; rowFont: number };

const px = (value: number) => `${Math.round(value * 10) / 10}px`;

/**
 * b2 (7 Nov), owner-only diagnostic: how the phone's font size reaches the app. Plain numbers read from hidden probes:
 * the root font size, the width of a 1rem box, the rendered height of 16px text (line-height 1), and a real answer
 * row's computed line-height against its font size. At 100% text all read 16, 16, 16 and 24 / 16.
 */
export function TextSizeProbe() {
  const host = useRef<HTMLDivElement>(null);
  const [reading, setReading] = useState<Reading>();
  useLayoutEffect(() => {
    const node = host.current;
    if (!node) return;
    const rem = node.querySelector<HTMLElement>('[data-probe="rem"]')!;
    const text = node.querySelector<HTMLElement>('[data-probe="text16"]')!;
    const row = node.querySelector<HTMLElement>('[data-probe="row"]')!;
    const rowStyle = getComputedStyle(row);
    setReading({
      root: parseFloat(getComputedStyle(document.documentElement).fontSize),
      rem: rem.getBoundingClientRect().width,
      text16: text.getBoundingClientRect().height,
      rowLine: parseFloat(rowStyle.lineHeight),
      rowFont: parseFloat(rowStyle.fontSize),
    });
  }, []);
  return <section className="card owner-text-size" aria-label="Text size check">
    <h2>Text size check</h2>
    {reading && <dl>
      <dt>Root font size</dt><dd>{px(reading.root)}</dd>
      <dt>1rem box width</dt><dd>{px(reading.rem)}</dd>
      <dt>16px text height</dt><dd>{px(reading.text16)}</dd>
      <dt>Answer row line-height / font size</dt><dd>{px(reading.rowLine)} / {px(reading.rowFont)}</dd>
    </dl>}
    {/* The probes: hidden, out of the flow, and out of the accessibility tree. */}
    <div ref={host} aria-hidden="true" style={{ position: 'absolute', left: -9999, top: 0, width: 360, visibility: 'hidden', pointerEvents: 'none' }}>
      <div data-probe="rem" style={{ width: '1rem', height: 1 }} />
      <span data-probe="text16" style={{ display: 'block', fontSize: '16px', lineHeight: 1 }}>Ag</span>
      <div className="learn-drop learn-fit"><div className="learn-options"><button type="button" tabIndex={-1} className="ui-list-row" data-probe="row">Sample answer</button></div></div>
    </div>
  </section>;
}
