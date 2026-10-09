import { describe, it, expect } from 'vitest';
import { calculateNewBudget } from './budget';

describe('Budget Logic', () => {
    it('10. Auto-raise: overruns in 3 of the last 4 weeks -> budget +2 (max 12)', () => {
        const result = calculateNewBudget(5, [true, true, false, true]);
        expect(result.newBudget).toBe(7);
        expect(result.didRaise).toBe(true);
        
        const resultMax = calculateNewBudget(11, [true, true, true, true]);
        expect(resultMax.newBudget).toBe(12);
        expect(resultMax.didRaise).toBe(true);
    });

    it('10 part 2. Auto-raise: 2 of 4 -> no change', () => {
        const result = calculateNewBudget(5, [true, false, false, true]);
        expect(result.newBudget).toBe(5);
        expect(result.didRaise).toBe(false);
    });
});
