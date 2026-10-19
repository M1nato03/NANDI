export type TechniqueCard = { type: string; name: string; explanation: string; example: string };
export const techniqueCards: readonly TechniqueCard[] = [
  { type: 'sudoku', name: 'Naked single', explanation: 'A cell has just one number left after its row, column and box are checked.', example: '4×4: row 1 has 1, 2, 3, _. The empty cell is 4.' },
  { type: 'sudoku', name: 'Hidden single', explanation: 'A number may have only one home in a row, column or box, even when that cell has other candidates.', example: '4×4: only column 3 can hold 4 in row 2. Place 4 there.' },
  { type: 'sudoku', name: 'Pointing candidates', explanation: 'When a number in a box can sit only in one row, remove it from the rest of that row.', example: '4×4: both places for 2 in a box lie on row 1; other row 1 cells lose 2.' },
  { type: 'crowns', name: 'One-cell region', explanation: 'If only one open cell remains in a region, its crown belongs there.', example: '4×4: a region has ×, ×, ×, _. Crown the last cell.' },
  { type: 'crowns', name: 'Region confined to a row or column', explanation: 'A region whose crown must sit in one row or column reserves that line.', example: '4×4: two open cells in the blue region share row 2. Other regions cannot crown row 2.' },
  { type: 'crowns', name: 'Adjacency elimination', explanation: 'A crown rules out its neighbours. See what remains in a row or region.', example: '4×4: a crown at row 1, column 2 rules out the three cells below it.' },
  { type: 'crowns', name: 'Two regions sharing two rows', explanation: 'If two regions are limited to the same two rows, both rows belong to those regions.', example: '4×4: blue and gold fit only rows 1–2; other regions use rows 3–4.' },
  { type: 'crowns', name: 'Region and row check', explanation: 'Try the open spots against every row, column, region and neighbour. If every possible layout puts a crown in the same cell, that crown is forced.', example: '4×4: only one layout fits all four rows and regions. Its first crown is fixed.' },
  { type: 'sunmoon', name: 'No three in a row', explanation: 'Three neighbouring symbols cannot match. Two equal symbols force the third to change.', example: '4×4: sun, sun, _ must end in moon.' },
  { type: 'sunmoon', name: 'Balance', explanation: 'Each line holds the same number of suns and moons. Once one kind is full, fill the rest with the other.', example: '4×4: sun, moon, sun, _ ends with moon.' },
  { type: 'sunmoon', name: 'Sign propagation', explanation: 'An equals sign keeps the symbol; a cross switches it.', example: '4×4: sun = _ means sun. Sun × _ means moon.' },
  { type: 'sunmoon', name: 'Line pattern elimination', explanation: 'Two lines cannot share the same finished pattern. Use the known cells to rule one out.', example: '4×4: if row 1 is sun, moon, sun, moon, row 2 cannot copy it.' },
  { type: 'path', name: 'Forced move', explanation: 'When the path head has only one legal neighbour, carry the line into it.', example: '4×4: from the corner, one neighbour is used. The other is next.' },
  { type: 'path', name: 'Dead-end avoidance', explanation: 'Keep a way through every unvisited cell before you draw the next step.', example: '4×4: avoid closing a corner before its number arrives.' },
  { type: 'path', name: 'Waypoint order', explanation: 'Visit numbered cells in order. A later number blocks a tempting shortcut.', example: '4×4: from 1, pass 2 before entering 3.' },
  { type: 'calc', name: 'Single-cell cage', explanation: 'A cage with one cell tells you that cell’s number at once.', example: '4×4: a one-cell cage labelled 3 contains 3.' },
  { type: 'calc', name: 'Cage arithmetic', explanation: 'List the number pairs that meet a cage’s target, then remove pairs blocked by a row or column.', example: '4×4: a two-cell 3÷ cage can hold 1 and 3.' },
  { type: 'calc', name: 'Latin elimination', explanation: 'Each number appears once in every row and column. The last open place takes the missing number.', example: '4×4: 1, 2, _, 4 leaves 3.' },
  { type: 'calc', name: 'Naked pair', explanation: 'Two cells with the same two candidates reserve those numbers for themselves.', example: '4×4: two cells can only be 1 or 3; other cells in their row lose both.' },
  { type: 'mystery', name: 'Direct clue', explanation: 'A clue can mark one box at once. Place that fact before joining clues.', example: '4×4: “The badge was in room 2” marks that one pairing.' },
  { type: 'mystery', name: 'Elimination', explanation: 'When every other box in a row is crossed out, the last box must be right.', example: '4×4: ×, ×, ✓, × leaves the third pairing.' },
  { type: 'mystery', name: 'Linking two grids', explanation: 'Join two known pairings through their shared person or object to fill a third grid.', example: '4×4: A has the badge; the badge is in room 2; A is in room 2.' },
];

export const techniqueId = (type: string, name: string) => `technique:${type}:${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
export const techniqueCard = (type: string, name: string) => techniqueCards.find(card => card.type === type && card.name === name);
