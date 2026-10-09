import { describe, it, expect } from 'vitest';
import { splitTask } from './split';
import { createTask } from './task-machine';

describe('Split Task Logic', () => {
    it('14. Split after postpone #3: subtasks inherit firstScheduledDayKey and start at postponeCount = 2', () => {
        const parent = createTask('1', Date.now(), 'L', 90, {
            firstScheduledDayKey: '2026-10-04',
            postponeCount: 3
        });
        const subtasks = splitTask(parent, 2, [45, 45]);
        
        expect(subtasks.length).toBe(2);
        expect(subtasks[0].postponeCount).toBe(2);
        expect(subtasks[0].firstScheduledDayKey).toBe('2026-10-04');
        expect(subtasks[0].xpShare).toBe(18); // Math.round(35 * 0.5)
        expect(subtasks[1].xpShare).toBe(18); // Math.round(35 * 0.5)
    });
});
