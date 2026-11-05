import { describe, expect, it } from 'vitest';
import { cleanText, decodeCrewLink, encodeCrewLink, LINK_KEYS, type AddLink, type JoinLink, type JoinedLink } from './links';
import { addLink, addText, applyLink, asOfLine, crewDuration, crewFilled, crewTotal, joinCrew, makeCrew, myCrewMinutes, plausibleMax, unsent } from './crew';
import type { JarEntry } from '../yatra/jar';

const at = (text: string) => new Date(text).getTime();
const maker = { id: 'aaaaaa1', first: 'Riya', colour: 1 };
const joiner = { id: 'bbbbbb2', first: 'Dev', colour: 2 };
const crew0 = makeCrew({ id: 'crew0001', plan: 'Sunday chai at the hill point', size: 15, me: maker, now: at('2026-11-05T09:00:00'), today: '2026-11-05' });
const add = (m: string, n: string, u: number, d: string): AddLink => ({ v: 1, t: 'add', c: 'crew0001', m, n, k: 2, u, d, src: 'workout' });
const joined = (m: string, n: string, d = '2026-11-05'): JoinedLink => ({ v: 1, t: 'joined', c: 'crew0001', m, n, k: 3, d });
const entry = (minutes: number, day: string, time: string, kind: JarEntry['kind'] = 'train'): JarEntry => ({ id: `${day}${time}${kind}`, kind, dayKey: day, minutes, counted: minutes, at: at(`${day}T${time}`), label: kind === 'train' ? 'workout done' : 'focus' });

describe('spec 55: crew links', () => {
  it('round-trips each kind through the one validator', () => {
    const join: JoinLink = { v: 1, t: 'join', c: 'crew0001', p: 'Sunday chai at the hill point', s: 15, mk: '2026-11-05', m: 'aaaaaa1', n: 'Riya', k: 1 };
    for (const link of [join, joined('bbbbbb2', 'Dev'), add('bbbbbb2', 'Dev', 45, '2026-11-05')]) expect(decodeCrewLink(encodeCrewLink(link))).toEqual(link);
    expect(decodeCrewLink(`#${encodeCrewLink(join)}`)).toEqual(join);
  });
  it('carries exactly the agreed keys, and nothing about apps, times, titles or phone use', () => {
    expect(LINK_KEYS).toEqual({ join: ['v', 't', 'c', 'p', 's', 'mk', 'm', 'n', 'k'], joined: ['v', 't', 'c', 'm', 'n', 'k', 'd'], add: ['v', 't', 'c', 'm', 'n', 'k', 'u', 'd', 'src'] });
    const payload = encodeCrewLink({ ...add('bbbbbb2', 'Dev', 45, '2026-11-05'), extra: 'Instagram 3h' } as never);
    expect(atob(payload.split('/')[2]!.replace(/-/g, '+').replace(/_/g, '/'))).not.toMatch(/Instagram|extra/);
  });
  it('ignores bad base64, an over-long payload, an unknown version, extra keys and a non-integer or negative total', () => {
    const encode = (value: unknown) => `crew/add/${btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`;
    const good = add('bbbbbb2', 'Dev', 45, '2026-11-05');
    expect(decodeCrewLink('crew/add/@@@not-base64')).toBeNull();
    expect(decodeCrewLink(`crew/add/${'A'.repeat(1501)}`)).toBeNull();
    expect(decodeCrewLink(encode({ ...good, v: 2 }))).toBeNull();
    expect(decodeCrewLink(encode({ ...good, phone: '9800000000' }))).toBeNull();
    expect(decodeCrewLink(encode({ ...good, u: 4.5 }))).toBeNull();
    expect(decodeCrewLink(encode({ ...good, u: -5 }))).toBeNull();
    expect(decodeCrewLink(encode({ ...good, d: '2026-02-30' }))).toBeNull();
    expect(decodeCrewLink(encode({ ...good, t: 'join' }))).toBeNull();
    expect(decodeCrewLink('crew/add/')).toBeNull();
    expect(decodeCrewLink(encode(good))).toEqual(good);
  });
  it('strips control and bidi characters from names and plans', () => {
    expect(cleanText('De‮v\u0000 ​patel\n', 20)).toBe('Dev patel');
    expect(decodeCrewLink(encodeCrewLink(add('bbbbbb2', '⁧Dev⁩', 5, '2026-11-05')))!.n).toBe('Dev');
  });
});

describe('spec 55: a crew on one phone', () => {
  const withDev = applyLink(crew0, joined('bbbbbb2', 'Dev'), '2026-11-05');
  it('takes a later total, ignores an older or lower one, and the same link twice changes nothing', () => {
    const one = applyLink(withDev, add('bbbbbb2', 'Dev', 40, '2026-11-05'), '2026-11-05');
    expect(one.members[0]!.cum).toBe(40);
    expect(applyLink(one, add('bbbbbb2', 'Dev', 40, '2026-11-05'), '2026-11-05')).toBe(one);
    expect(applyLink(one, add('bbbbbb2', 'Dev', 30, '2026-11-05'), '2026-11-05')).toBe(one);
    const two = applyLink(one, add('bbbbbb2', 'Dev', 90, '2026-11-06'), '2026-11-06');
    expect(two.members[0]).toMatchObject({ cum: 90, date: '2026-11-06' });
    // An older link after a newer one, and a newer date with a lower total, are both ignored.
    expect(applyLink(two, add('bbbbbb2', 'Dev', 100, '2026-11-05'), '2026-11-06')).toBe(two);
    expect(applyLink(two, add('bbbbbb2', 'Dev', 80, '2026-11-07'), '2026-11-07')).toBe(two);
  });
  it('ignores an impossible total (more than 60 a day since the crew was made) and dates out of range', () => {
    expect(plausibleMax('2026-11-05', '2026-11-06')).toBe(120);
    expect(applyLink(withDev, add('bbbbbb2', 'Dev', 121, '2026-11-06'), '2026-11-06')).toBe(withDev);
    expect(applyLink(withDev, add('bbbbbb2', 'Dev', 120, '2026-11-06'), '2026-11-06').members[0]!.cum).toBe(120);
    expect(applyLink(withDev, joined('cccccc3', 'Asha', '2026-11-04'), '2026-11-05')).toBe(withDev);
    expect(applyLink(withDev, add('bbbbbb2', 'Dev', 10, '2026-11-08'), '2026-11-05')).toBe(withDev);
  });
  it('holds five: a sixth "joined" is ignored quietly', () => {
    let crew = crew0;
    for (const [id, name] of [['bbbbbb2', 'Dev'], ['cccccc3', 'Asha'], ['dddddd4', 'Kabir'], ['eeeeee5', 'Meera']]) crew = applyLink(crew, joined(id!, name!), '2026-11-05');
    expect(crew.members).toHaveLength(4);
    expect(applyLink(crew, joined('ffffff6', 'Zoya'), '2026-11-05')).toBe(crew);
    expect(applyLink(crew, add('ffffff6', 'Zoya', 10, '2026-11-05'), '2026-11-05')).toBe(crew);
  });
  it('totals the latest known minutes and fills exactly at the size', () => {
    const crew = applyLink(withDev, add('bbbbbb2', 'Dev', 300, '2026-11-09'), '2026-11-09');
    expect(crewTotal(crew, 600)).toBe(900);
    expect(crewFilled(crew, 599)).toBe(false);
    expect(crewFilled(crew, 600)).toBe(true);
  });
  it('a rejoin is a new member from 0; the old member\'s past minutes stay and are not counted twice', () => {
    let crew = applyLink(withDev, add('bbbbbb2', 'Dev', 50, '2026-11-05'), '2026-11-05');
    crew = applyLink(crew, joined('bbbbbb9', 'Dev'), '2026-11-06');
    crew = applyLink(crew, add('bbbbbb9', 'Dev', 20, '2026-11-06'), '2026-11-06');
    expect(crew.members.map(member => [member.id, member.cum])).toEqual([['bbbbbb2', 50], ['bbbbbb9', 20]]);
    expect(crewTotal(crew, 0)).toBe(70);
  });
  it('says "as of" in day words only', () => {
    const crew = applyLink(applyLink(withDev, joined('cccccc3', 'Asha', '2026-11-05'), '2026-11-05'), add('bbbbbb2', 'Dev', 10, '2026-11-06'), '2026-11-06');
    expect(asOfLine(crew, '2026-11-06')).toBe('as of Dev today, Asha yesterday');
  });
});

describe('spec 55: what this phone sends', () => {
  const crew = { ...joinCrew({ v: 1, t: 'join', c: 'crew0001', p: 'Sunday chai', s: 15, mk: '2026-11-04', m: 'aaaaaa1', n: 'Riya', k: 1 }, joiner, at('2026-11-05T09:00:00')) };
  it('counts jar minutes only from joining, and says "today\'s" only when they are all from today', () => {
    const entries = [entry(10, '2026-11-05', '08:00:00'), entry(10, '2026-11-05', '10:00:00'), entry(5, '2026-11-06', '09:00:00', 'focus')];
    expect(myCrewMinutes(crew, entries)).toBe(15);
    expect(unsent(crew, entries, '2026-11-06')).toEqual({ minutes: 15, onlyToday: false, top: 'workout' });
    const sent = { ...crew, me: { ...crew.me, sentCum: 10, sentDay: '2026-11-05' } };
    expect(unsent(sent, entries, '2026-11-06')).toMatchObject({ minutes: 5, onlyToday: true });
    expect(addLink(sent, entries, '2026-11-06')).toEqual({ v: 1, t: 'add', c: 'crew0001', m: 'bbbbbb2', n: 'Dev', k: 2, u: 15, d: '2026-11-06', src: 'workout' });
  });
});

describe('spec 55: one duration format in the crew', () => {
  it('drops zero parts: "4 h", "4 h 10 m", "45 m", and never "4 h 0 m"', () => {
    expect([crewDuration(240), crewDuration(250), crewDuration(45), crewDuration(0)]).toEqual(['4 h', '4 h 10 m', '45 m', '0 m']);
    const text = addText({ ...crew0, me: { ...crew0.me, first: 'Dev' } }, 240, 240, 'https://x/#crew/add/a');
    expect(text).toBe('Dev added 4 h to Sunday chai at the hill point · 4 h of 15 h · https://x/#crew/add/a');
    expect(text).not.toMatch(/ 0 m|\bmin\b/);
  });
});
