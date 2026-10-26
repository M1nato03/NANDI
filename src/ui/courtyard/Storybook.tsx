import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';
import { dayKey } from '../../core/time/dayKey';
import { COURTYARD_KINDS, COURTYARD_NIGHT_KEY, courtyardNightFrom, deriveCourtyard } from '../../core/courtyard/courtyard';
import { buildStorybook, recentWeeks, storyWeekStart, type StoryPage } from '../../core/courtyard/storybook';
import { Cast } from '../cast/Cast';
import { go } from '../shell/router';
import { CourtyardView } from './Courtyard';
import './courtyard.css';

/** Routes allow only letters and digits per segment, so the week is written 20261012. */
export const storyRoute = (weekStart: string) => `you/story/${weekStart.replaceAll('-', '')}`;
export const weekFromRoute = (segment: string) => `${segment.slice(0, 4)}-${segment.slice(4, 6)}-${segment.slice(6, 8)}`;

const useFacts = () => useLiveQuery(() => db.ledger.where('kind').anyOf(COURTYARD_KINDS).toArray(), []);
const useNightFrom = () => useLiveQuery(async () => courtyardNightFrom(await db.settings.where('key').equals(COURTYARD_NIGHT_KEY).toArray()), []) ?? '9999-12-31';

function Page({ page, facts, weekEnd, nightFrom }: { page: StoryPage; facts: Parameters<typeof deriveCourtyard>[0]; weekEnd: string; nightFrom: string }) {
  if (page.kind === 'cover') return <div className="story-page story-cover">
    <CourtyardView state={deriveCourtyard(facts, weekEnd, undefined, nightFrom)} phase="day" forcePose="idle" />
    <p className="eyebrow">Your week</p><h2>{page.text}</h2><p>A story from your courtyard.</p>
  </div>;
  if (page.kind === 'close') return <div className="story-page story-close"><CourtyardView state={deriveCourtyard(facts, weekEnd, undefined, nightFrom)} phase="evening" forcePose="idle" /><p>{page.text}</p></div>;
  return <div className="story-page">
    <Cast name={page.friend!} pose={page.kind === 'quiet' || page.kind === 'soft' ? 'rest' : 'cheer'} size={120} title={`${page.friend} ${page.kind === 'quiet' || page.kind === 'soft' ? 'resting' : 'cheering'}`} key={page.text} moment={page.kind === 'quiet' || page.kind === 'soft' ? 'settle' : 'hop'} at={1} />
    <p className="story-text">{page.text}</p>
    {page.days != null && <div className="story-dots" aria-label={`${page.days} of 7 days`}>{Array.from({ length: 7 }, (_, index) => <span key={index} className={index < page.days! ? 'got' : ''} />)}</div>}
  </div>;
}

export function StorybookScreen({ weekStart }: { weekStart: string }) {
  const facts = useFacts();
  const nightFrom = useNightFrom();
  const [index, setIndex] = useState(0);
  if (!facts) return <section className="screen"><h1>Storybook</h1></section>;
  const book = buildStorybook(facts, weekStart, nightFrom);
  const page = book.pages[Math.min(index, book.pages.length - 1)]!;
  const last = index >= book.pages.length - 1;
  return <section className="screen storybook-screen" aria-label="Storybook"><p className="eyebrow">Storybook</p><h1>Your week as a story</h1>
    <article className="card storybook" aria-live="polite"><Page page={page} facts={facts} weekEnd={book.weekEnd} nightFrom={nightFrom} />
      <div className="story-pager" aria-label={`Page ${index + 1} of ${book.pages.length}`}>{book.pages.map((_, i) => <span key={i} className={i === index ? 'on' : ''} />)}</div>
      <div className="sheet-actions">{index > 0 && <button type="button" className="secondary" onClick={() => setIndex(index - 1)}>Back a page</button>}
        {last ? <button type="button" onClick={() => go('you/stories')}>The end</button> : <button type="button" onClick={() => setIndex(index + 1)}>Turn the page</button>}</div>
    </article>
  </section>;
}

export function StorybookList() {
  const facts = useFacts();
  const nightFrom = useNightFrom();
  const today = dayKey(Date.now()); // eslint-disable-line react-hooks/purity
  if (!facts) return <section className="screen"><h1>Storybooks</h1></section>;
  const weeks = recentWeeks(today, 8).map(week => buildStorybook(facts, week, nightFrom)).filter((book, index) => index === 0 || book.practisedAreas > 0 || book.pages.some(page => page.kind === 'soft'));
  return <section className="screen storybook-list"><p className="eyebrow">Your courtyard</p><h1>Storybooks</h1>
    <p className="small">A new story is ready each Sunday. Stories are made on this phone from what you did.</p>
    {weeks.map(book => <button type="button" key={book.weekStart} className="card you-link" onClick={() => go(storyRoute(book.weekStart))}>
      <strong>{book.pages[0]!.text}</strong><span>{book.weekStart === storyWeekStart(today) ? 'This week so far' : book.practisedAreas ? `${book.practisedAreas} ${book.practisedAreas === 1 ? 'friend' : 'friends'} in this story` : 'A quiet week'}</span></button>)}
  </section>;
}

/** On Sundays and Mondays Plan offers the week's story: Sunday tells this week, Monday the one just finished. */
export function StorybookCard({ today }: { today: string }) {
  const weekday = new Date(`${today}T12:00:00Z`).getUTCDay();
  if (weekday !== 0 && weekday !== 1) return null;
  const week = weekday === 0 ? storyWeekStart(today) : recentWeeks(today, 2)[1]!;
  return <button type="button" className="card you-link storybook-card" onClick={() => go(storyRoute(week))}>
    <span className="cast-inline"><Cast name="Mor" pose="cheer" size={40} moment="wave" at={1} /><strong>Your week as a story</strong></span><span>Six friends tell you what your week became</span>
  </button>;
}
