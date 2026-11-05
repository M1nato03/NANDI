/**
 * Spec 55: crew links travel through chat apps, so anyone can edit them. Every link, whether it arrives in the app
 * (App Links, a paste) or in the browser, goes through this one validator: base64url JSON, version 1, the exact keys
 * of its kind, and bounded values. Anything else is ignored quietly. Links carry first names, colours, ids, the plan
 * and cumulative jar minutes only: never a surname, phone number, app name, time of day, title or phone-usage figure.
 */
export const CREW_LINK_VERSION = 1;
export const CREW_SIZES = [5, 10, 15, 25] as const;
export const CREW_SOURCES = ['workout', 'focus', 'chapter', 'idea', 'lesson', 'Calm', 'puzzle', 'lights out'] as const;
export const CREW_MAX = 5;
export const NAME_MAX = 20;
export const PLAN_MAX = 60;
const PAYLOAD_MAX = 1500;
export type CrewSize = typeof CREW_SIZES[number];
export type CrewSource = typeof CREW_SOURCES[number];

export type JoinLink = { v: 1; t: 'join'; c: string; p: string; s: CrewSize; mk: string; m: string; n: string; k: number };
export type JoinedLink = { v: 1; t: 'joined'; c: string; m: string; n: string; k: number; d: string };
export type AddLink = { v: 1; t: 'add'; c: string; m: string; n: string; k: number; u: number; d: string; src: CrewSource };
export type CrewLink = JoinLink | JoinedLink | AddLink;
export type CrewLinkKind = CrewLink['t'];

/** The exact keys each kind carries (pinned by a test, so a new field is a decision, not an accident). */
export const LINK_KEYS: Record<CrewLinkKind, readonly string[]> = {
  join: ['v', 't', 'c', 'p', 's', 'mk', 'm', 'n', 'k'],
  joined: ['v', 't', 'c', 'm', 'n', 'k', 'd'],
  add: ['v', 't', 'c', 'm', 'n', 'k', 'u', 'd', 'src'],
};

/** Control characters, bidi overrides and isolates, and zero-width joiners never survive into a shown name or plan. */
export function cleanText(text: string, max: number): string {
  return text.normalize('NFC').replace(/[\p{Cc}؜​-‏‪-‮⁠-⁩﻿]/gu, '').replace(/\s+/g, ' ').trim().slice(0, max);
}

const ID = /^[a-z0-9]{6,24}$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;
const validDay = (day: unknown): day is string => typeof day === 'string' && DAY.test(day) && !Number.isNaN(new Date(`${day}T12:00:00`).getTime()) && new Date(`${day}T12:00:00`).toISOString().slice(0, 10) === day;
const colour = (value: unknown): value is number => Number.isInteger(value) && (value as number) >= 0 && (value as number) <= 7;

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromBase64Url(text: string): string | null {
  if (!/^[A-Za-z0-9_-]+$/.test(text)) return null;
  try {
    const binary = atob(text.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - text.length % 4) % 4));
    return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(binary, char => char.charCodeAt(0)));
  } catch { return null; }
}

export function encodeCrewLink(link: CrewLink): string {
  const ordered = Object.fromEntries(LINK_KEYS[link.t].map(key => [key, (link as Record<string, unknown>)[key]]));
  return `crew/${link.t}/${toBase64Url(JSON.stringify(ordered))}`;
}

/** The one gate for every crew link: returns the link, or null for anything malformed, unknown or out of bounds. */
export function decodeCrewLink(route: string): CrewLink | null {
  const match = /^#?crew\/(join|joined|add)\/([A-Za-z0-9_-]{1,1500})$/.exec(route.trim());
  if (!match || match[2]!.length > PAYLOAD_MAX) return null;
  const kind = match[1] as CrewLinkKind;
  const json = fromBase64Url(match[2]!);
  if (json === null) return null;
  let raw: unknown;
  try { raw = JSON.parse(json); } catch { return null; }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const value = raw as Record<string, unknown>;
  const keys = Object.keys(value).sort(), want = [...LINK_KEYS[kind]].sort();
  if (keys.length !== want.length || keys.some((key, index) => key !== want[index])) return null;
  if (value.v !== CREW_LINK_VERSION || value.t !== kind) return null;
  if (typeof value.c !== 'string' || !ID.test(value.c) || typeof value.m !== 'string' || !ID.test(value.m)) return null;
  if (typeof value.n !== 'string' || !colour(value.k)) return null;
  const n = cleanText(value.n, NAME_MAX);
  if (!n) return null;
  if (kind === 'join') {
    if (typeof value.p !== 'string' || !CREW_SIZES.includes(value.s as CrewSize) || !validDay(value.mk)) return null;
    const p = cleanText(value.p, PLAN_MAX);
    return p ? { v: 1, t: 'join', c: value.c, p, s: value.s as CrewSize, mk: value.mk, m: value.m, n, k: value.k as number } : null;
  }
  if (!validDay(value.d)) return null;
  if (kind === 'joined') return { v: 1, t: 'joined', c: value.c, m: value.m, n, k: value.k as number, d: value.d };
  if (!Number.isInteger(value.u) || (value.u as number) < 0 || (value.u as number) > 10_000_000) return null;
  if (!CREW_SOURCES.includes(value.src as CrewSource)) return null;
  return { v: 1, t: 'add', c: value.c, m: value.m, n, k: value.k as number, u: value.u as number, d: value.d, src: value.src as CrewSource };
}
