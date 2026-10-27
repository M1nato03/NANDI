/**
 * Spec 34: a trail is real places in walking order and, between each pair, one leg with its landmark, the landmark's
 * postcard (2-3 sourced lines) and the leg's suggested constellation name. All of it ships in the app (offline v1).
 */
export type PlaceKind = 'start' | 'camp' | 'pass';
/** Altitudes stay null: the sources disagree and the app shows none (item 196). */
export interface Place { id: string; name: string; altNames?: string[]; kind: PlaceKind; regionLine: string; altitudeM?: number | null; sources?: string[] }
export interface Leg {
  id: string;
  from: string;
  to: string;
  landmark: { id: string; name: string; kind: string };
  postcard: { title?: string; lines: string[] };
  sources: string[];
  constellation: string;
}
export interface Trail { id: string; name: string; region: string; sources?: string[]; places: Place[]; legs: Leg[]; notes?: unknown }

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const KINDS: readonly PlaceKind[] = ['start', 'camp', 'pass'];

/** What is wrong with a trail file, in plain lines; empty when it can ship. */
export function trailErrors(trail: Trail): string[] {
  const errors: string[] = [];
  if (!SLUG.test(trail.id ?? '')) errors.push('trail id must be a slug');
  if (!trail.name?.trim()) errors.push('trail needs a name');
  const places = Array.isArray(trail.places) ? trail.places : [];
  // Spec 34 (item 192 i): a trail counts places, not camps; a pass is a place too.
  if (places.length < 6 || places.length > 10) errors.push(`a trail has 6-10 places, this one has ${places.length}`);
  const ids = new Set<string>();
  places.forEach((place, index) => {
    if (!SLUG.test(place.id ?? '')) errors.push(`place ${index + 1} id must be a slug`);
    if (ids.has(place.id)) errors.push(`place id ${place.id} is used twice`);
    ids.add(place.id);
    if (!place.name?.trim()) errors.push(`place ${place.id} needs a name`);
    if (!KINDS.includes(place.kind)) errors.push(`place ${place.id} kind must be start, camp or pass`);
    if ((index === 0) !== (place.kind === 'start')) errors.push(index === 0 ? 'the first place is the start' : `only the first place is the start (${place.id})`);
  });
  const legs = Array.isArray(trail.legs) ? trail.legs : [];
  if (legs.length !== Math.max(0, places.length - 1)) errors.push(`a trail with ${places.length} places has ${Math.max(0, places.length - 1)} legs, not ${legs.length}`);
  const landmarks = new Set<string>();
  legs.forEach((leg, index) => {
    const name = `leg ${index + 1}`;
    if (leg.from !== places[index]?.id || leg.to !== places[index + 1]?.id) errors.push(`${name} must run from ${places[index]?.id} to ${places[index + 1]?.id}`);
    if (!SLUG.test(leg.landmark?.id ?? '')) errors.push(`${name} landmark id must be a slug`);
    if (landmarks.has(leg.landmark?.id)) errors.push(`landmark ${leg.landmark?.id} is used twice`);
    landmarks.add(leg.landmark?.id);
    if (!leg.landmark?.name?.trim()) errors.push(`${name} landmark needs a name`);
    const lines = leg.postcard?.lines ?? [];
    if (lines.length < 2 || lines.length > 3 || lines.some(line => !line?.trim())) errors.push(`${name} postcard has 2-3 lines`);
    const sources = leg.sources ?? [];
    if (!sources.length || sources.some(source => !/^https:\/\/\S+$/.test(source))) errors.push(`${name} postcard needs at least one https source`);
    if (!leg.constellation?.trim()) errors.push(`${name} needs a suggested constellation name`);
  });
  return errors;
}
