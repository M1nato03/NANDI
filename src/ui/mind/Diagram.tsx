import type { Lesson } from '../../data/packs/schemas';

type DiagramData = Lesson['pic'];
const node = (text: string, selected = false, key?: number) => <span key={key} className={`mind-diagram-node${selected ? ' selected' : ''}`}>{text}</span>;

export function Diagram({ data }: { data: DiagramData }) {
  let picture: React.ReactNode;
  switch (data.k) {
    case 'split': picture = <div className="mind-diagram-row">{node(`${data.l}${data.ls ? ` · ${data.ls}` : ''}`, data.hi === 'l')}<b>vs</b>{node(`${data.r}${data.rs ? ` · ${data.rs}` : ''}`, data.hi === 'r')}</div>; break;
    case 'chain': picture = <div className="mind-diagram-chain">{data.steps.map((text, i) => <div key={i}>{i > 0 && <span aria-hidden="true">↓</span>}{node(`${i + 1}. ${text}`, i === data.hi)}</div>)}</div>; break;
    case 'three': picture = <><div className="mind-diagram-center">{node(data.top, true)}</div><div className="mind-diagram-row">{data.items.map((text, i) => node(text, false, i))}</div></>; break;
    case 'thirds': picture = <div className="mind-diagram-row thirds">{data.items.map((text, i) => node(`${text} · ⅓`, false, i))}</div>; break;
    case 'stairs': picture = <>{data.label && <p>{data.label}</p>}<div className="mind-diagram-stairs">{data.steps.map(([label, value], i) => <div key={i}><span className="mind-diagram-bar" style={{ height: `${Math.round((data.desc ? data.steps.length - i : i + 1) / data.steps.length * 100)}%` }} /><span>{label}</span><small>{value}</small></div>)}</div></>; break;
    case 'meter': picture = <>{data.label && <p>{data.label}</p>}<div className="mind-diagram-row">{data.zones.map((text, i) => node(text, i === data.hi, i))}</div></>; break;
    case 'ring': picture = <><div className="mind-diagram-row">{data.outer.slice(0, Math.ceil(data.outer.length / 2)).map((text, i) => node(text, false, i))}</div><div className="mind-diagram-center">{node(data.center, true)}{data.shell && <small>{data.shell}</small>}</div><div className="mind-diagram-row">{data.outer.slice(Math.ceil(data.outer.length / 2)).map((text, i) => node(text, false, i))}</div></>; break;
    case 'cycle': picture = <div className="mind-diagram-cycle">{data.nodes.map((text, i) => <div key={i}>{node(text, i === data.hi)}<span aria-hidden="true">{i < 3 ? '→' : '↺'}</span></div>)}</div>; break;
    case 'curves': picture = <><svg viewBox="0 0 320 140" aria-hidden="true"><path d="M10 115 C90 125 160 70 310 20" className="good"/><path d="M10 20 C90 10 160 70 310 120" className="bad"/></svg><div className="mind-diagram-row">{node(data.a)}{node(data.b)}</div></>; break;
    case 'wave': picture = <><svg viewBox="0 0 320 130" aria-hidden="true"><path d="M10 65 C40 10 70 10 100 65 S160 120 190 65 S250 10 280 65 S305 95 310 85" className="good"/></svg><div className="mind-diagram-row">{node(data.top)}{node(data.bot)}{node(data.line)}</div><p>{data.cap}</p></>; break;
    case 'balance': picture = <><div className="mind-diagram-row balance">{node(data.l)}<span aria-hidden="true">⚖</span>{node(data.r)}</div><p>{data.mid}</p></>; break;
  }
  return <figure className={`mind-diagram mind-diagram-${data.k}`} aria-label={`${data.k} diagram`}>{picture}</figure>;
}
