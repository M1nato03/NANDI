import { useState } from 'react';
import { MATKA_ASK, MATKA_FOOTER, MATKA_STOP, matkaReveal, type MatkaItem } from '../../core/moti/matka';
import { Moti } from '../cast/Cast';
import { AreaScope } from '../shell/AreaScope';

/** What the screen needs to ask about one sealed item: the step's hook options, or an estimate's scale and units. */
export type MatkaContext = { title: string; options?: { id: string; text: string }[]; scale?: { lo: number; hi: number; step: number; start: number }; format?: (value: number) => string };

/**
 * Spec 26 A2, Moti's matka: on Sundays, three sealed first guesses, one at a time. Moti asks "What was your first
 * guess?", then cracks the matka. "Not sure" is a full answer; answering pays the same whatever the result.
 */
export function Matka({ items, answered, context, onAnswer, onLeave }: { items: MatkaItem[]; answered: string[]; context: (item: MatkaItem) => MatkaContext; onAnswer: (item: MatkaItem, recalled: number | string) => Promise<void>; onLeave: () => void }) {
  const open = items.filter(item => !answered.includes(item.factId));
  const [reveal, setReveal] = useState<{ item: MatkaItem; lines: string[] } | null>(null);
  const [value, setValue] = useState<number | null>(null);
  const [footerShown, setFooterShown] = useState(false);
  const item = open[0];
  const answer = async (current: MatkaItem, recalled: number | string) => {
    const ctx = context(current);
    await onAnswer(current, recalled);
    setReveal({ item: current, lines: matkaReveal(current, recalled, { value: ctx.format ?? String, option: id => ctx.options?.find(option => option.id === id)?.text ?? id }) });
    setValue(null);
  };
  if (reveal) return <section className="screen matka" aria-label="Moti's matka"><AreaScope area="review" />
    <div className="matka-crack" data-moment="crack"><Moti pose="cheer" size={64} title="Moti" /><span className="matka-pot" aria-hidden="true"><span /><span /></span></div>
    <div className="matka-reveal" role="status">{reveal.lines.map(line => <p key={line}>{line}</p>)}</div>
    {!footerShown && <p className="small matka-footer">{MATKA_FOOTER}</p>}
    <button type="button" onClick={() => { setReveal(null); setFooterShown(true); }}>{open.length ? 'Next' : 'Done'}</button>
  </section>;
  if (!item) return <section className="screen matka" aria-label="Moti's matka"><AreaScope area="review" /><Moti pose="rest" size={64} title="Moti" /><p role="status">{MATKA_STOP}</p><button type="button" className="secondary" onClick={onLeave}>Close</button></section>;
  const ctx = context(item);
  const scale = ctx.scale;
  return <section className="screen matka" aria-label="Moti's matka"><AreaScope area="review" />
    <div className="matka-head"><Moti pose="think" size={56} title="Moti" /><span className="matka-pot whole" aria-hidden="true" /></div>
    <p className="eyebrow">{ctx.title}</p>
    {MATKA_ASK.map(line => <p key={line} className="matka-ask">{line}</p>)}
    {item.level === 2 && scale ? <div className="matka-number">
      <input type="range" min={scale.lo} max={scale.hi} step={scale.step} value={value ?? scale.start} aria-label="Your first guess" onChange={event => setValue(Number(event.target.value))} />
      <p className="matka-value">{(ctx.format ?? String)(value ?? scale.start)}</p>
      <button type="button" onClick={() => void answer(item, value ?? scale.start)}>That was my guess</button>
    </div> : item.level === 1 && ctx.options ? <div className="matka-options" role="group" aria-label="Your first pick">{ctx.options.map(option => <button type="button" key={option.id} className="secondary" onClick={() => void answer(item, option.id)}>{option.text}</button>)}</div>
      : <div className="matka-options" role="group" aria-label="Did it land?"><button type="button" className="secondary" onClick={() => void answer(item, 'landed')}>Landed</button><button type="button" className="secondary" onClick={() => void answer(item, 'missed')}>Missed</button></div>}
    <button type="button" className="text-button" onClick={() => void answer(item, 'unsure')}>Not sure</button>
  </section>;
}
