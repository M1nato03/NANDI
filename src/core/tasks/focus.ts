import { RULES, Rules } from '../rules.config';
import { FocusRow } from '../../data/types';

export function startFocus(taskId: string, now: number, activeFocus?: FocusRow): { newFocus: FocusRow, pausedFocus?: FocusRow } {
    const newFocus: FocusRow = {
        id: `${taskId}-${now}`, // ULID typically, simplified for pure function
        taskId,
        startedAt: now,
        updatedAt: now,
        deleted: 0,
        deviceId: 'device-id-placeholder'
    };

    let pausedFocus: FocusRow | undefined;
    if (activeFocus && activeFocus.taskId !== taskId && !activeFocus.endedAt) {
        pausedFocus = pauseFocus(activeFocus, now);
        pausedFocus.switches = (pausedFocus.switches || 0) + 1;
    }

    return { newFocus, pausedFocus };
}

export function pauseFocus(focus: FocusRow, now: number): FocusRow {
    const pauses = focus.pauses || [];
    return {
        ...focus,
        pauses: [...pauses, { at: now }],
        updatedAt: now
    };
}

export function resumeFocus(focus: FocusRow, now: number): FocusRow {
    const pauses = focus.pauses || [];
    if (pauses.length > 0 && !pauses[pauses.length - 1].resumeAt) {
        const lastPause = pauses[pauses.length - 1];
        lastPause.resumeAt = now;
    }
    return { ...focus, pauses, updatedAt: now };
}

export function finishFocus(focus: FocusRow, now: number): FocusRow {
    return {
        ...focus,
        endedAt: now,
        updatedAt: now
    };
}
