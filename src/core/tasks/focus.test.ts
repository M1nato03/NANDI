import { describe, it, expect } from 'vitest';
import { startFocus, pauseFocus, resumeFocus, finishFocus } from './focus';
import { FocusRow } from '../../data/types';

describe('Focus Logic', () => {
    it('13. Starting focus on B while A runs pauses A and increments switches', () => {
        const focusA: FocusRow = {
            id: 'A-1', taskId: 'A', startedAt: 1000,
            updatedAt: 1000, deleted: 0, deviceId: 'test'
        };

        const result = startFocus('B', 2000, focusA);
        
        expect(result.newFocus.taskId).toBe('B');
        expect(result.pausedFocus).toBeDefined();
        expect(result.pausedFocus?.switches).toBe(1);
        expect(result.pausedFocus?.pauses?.[0].at).toBe(2000);
    });
});
