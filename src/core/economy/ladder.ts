import { RULES } from '../rules.config';

const firstNames = ['Aarav', 'Mira', 'Kabir', 'Anaya', 'Ishaan', 'Leena', 'Zoya', 'Dev', 'Nia', 'Arjun', 'Amara', 'Sofia', 'Leo', 'Maya', 'Noah', 'Aiko', 'Luca', 'Ines', 'Ravi', 'Tara'];
const marks = ['Vale', 'Moss', 'Kite', 'Cove', 'Drift', 'Rill', 'Solace', 'Fern', 'Glade', 'Pace', 'Nook', 'Elm', 'Tide', 'Wisp', 'Brook', 'Fable'];
const hash = (season: number, seat: number) => {
  let x = ((season + 17) * 2654435761 + seat * 1013904223) >>> 0;
  x ^= x >>> 16; x = Math.imul(x, 2246822507); x ^= x >>> 13;
  return x >>> 0;
};
export function rivalName(season: number, seat: number): string {
  const seed = hash(season, seat);
  return `${firstNames[seed % firstNames.length]} ${marks[Math.floor(seed / firstNames.length) % marks.length]}`;
}
/** Minimum whole SP needed to hold a seat under the floor-based rank formula. */
export function seatThreshold(seat: number, target: number): number {
  if (seat >= RULES.season.seats) return 0;
  const fraction = (RULES.season.seats - seat) / (RULES.season.seats - 1);
  return Math.ceil(target * fraction ** (1 / RULES.season.exponent) - 1e-9);
}
export function boardSeats(rank: number): number[] {
  const seats = new Set<number>();
  for (let seat = 1; seat <= 10; seat++) seats.add(seat);
  for (let seat = Math.max(1, rank - 10); seat <= Math.min(RULES.season.seats, rank + 10); seat++) seats.add(seat);
  return [...seats].sort((a, b) => a - b);
}
