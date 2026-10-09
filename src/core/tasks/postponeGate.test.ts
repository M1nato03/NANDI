import { describe, it, expect } from 'vitest';
import { postponeGate } from './postponeGate';
import { createTask } from './task-machine';

describe('Postpone Gate (02-tasks.md §2 & §3)', () => {
    it('4. Postpone #1 without a new date+time is rejected', () => {
        const task = createTask('1', 0, 'S', 10); // postponeCount = 0
        const result = postponeGate({ task, newStart: null }, 0);
        expect(result.ok).toBe(false);
        expect(result.error).toBe('missing_date_time');
    });

    it('5. Postpone #2 requires a firstStep of 1–120 chars', () => {
        const task = createTask('1', 0, 'S', 10);
        task.postponeCount = 1;
        
        let result = postponeGate({ task, newStart: 1000 }, 0);
        expect(result.ok).toBe(false);
        expect(result.error).toBe('missing_first_step');

        result = postponeGate({ task, newStart: 1000, firstStep: 'A'.repeat(121) }, 0);
        expect(result.ok).toBe(false);
        expect(result.error).toBe('first_step_too_long');

        result = postponeGate({ task, newStart: 1000, firstStep: 'Do the thing' }, 0);
        expect(result.ok).toBe(true);
    });

    it('6. Postpone #3 returns the choice sheet, and "Postpone anyway" always requires a reason', () => {
        const task = createTask('1', 0, 'S', 10);
        task.postponeCount = 2; // Next is #3... Wait, #3 choice sheet appears ON 3rd attempt
        // Ah, if postponeCount is 2, the next one is Postpone #3.
        // The spec says "The #3 choice sheet: it appears when he attempts a 3rd postpone."
        task.postponeCount = 2; 
        
        // Wait, my logic in postponeGate checked >= 3. If postponeCount is 2, the attempt is the 3rd postpone.
        // Let's adjust logic.
    });
});

    it('6 part 2. Postpone #3 returns choice sheet, reason required', () => {
        const task = createTask('1', 0, 'S', 10);
        task.postponeCount = 2; 

        let result = postponeGate({ task, newStart: 1000 }, 0);
        expect(result.ok).toBe(false);
        expect(result.error).toBe('choice_sheet_required');

        result = postponeGate({ task, newStart: 1000, reason: 'avoided it' }, 0);
        expect(result.ok).toBe(true);
    });

    it('7. Postpone #4 sets someday', () => {
        const task = createTask('1', 0, 'S', 10);
        task.postponeCount = 3; 

        const result = postponeGate({ task, newStart: 1000 }, 0);
        expect(result.ok).toBe(true);
        expect(result.action).toBe('someday');
    });

    it('9. Budget: the 6th counted postpone in a week requires a reason', () => {
        const task = createTask('1', 0, 'S', 10, { firstStep: 'Ready' }); // Add firstStep to bypass shrink check
        
        let result = postponeGate({ task, newStart: 1000 }, 5); // 6th postpone
        expect(result.ok).toBe(false);
        expect(result.error).toBe('reason_required');

        result = postponeGate({ task, newStart: 1000, reason: 'low energy' }, 5);
        expect(result.ok).toBe(true);
    });

