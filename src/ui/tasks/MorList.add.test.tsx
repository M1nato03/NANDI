// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MorList } from './MorList';

afterEach(cleanup);

describe("Mor's list add field", () => {
  it('keeps a next task typed while the save is running, and clears only what was added (CI race, 26 Oct)', async () => {
    let finish: (ok: boolean) => void = () => {};
    const board = { now: new Date('2026-10-19T10:00:00').getTime(), tasks: [], focus: [], busy: false, message: '', writes: 0, writesRef: { current: 0 },
      act: vi.fn(() => new Promise<boolean>(resolve => { finish = resolve; })) };
    render(<MorList board={board as never} onDetail={() => {}} avgHidden hideAverage={() => {}} />);
    const field = screen.getByPlaceholderText('Add a task') as HTMLInputElement;
    fireEvent.change(field, { target: { value: 'First block' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    // The save is still running; the next task is typed straight away.
    fireEvent.change(field, { target: { value: 'Second block' } });
    await act(async () => { finish(true); });
    expect(field.value).toBe('Second block');
    expect(board.act).toHaveBeenCalledTimes(1);
  });
  it('clears the field after a save when nothing new was typed', async () => {
    const board = { now: new Date('2026-10-19T10:00:00').getTime(), tasks: [], focus: [], busy: false, message: '', writes: 0, writesRef: { current: 0 }, act: vi.fn(async () => true) };
    render(<MorList board={board as never} onDetail={() => {}} avgHidden hideAverage={() => {}} />);
    const field = screen.getByPlaceholderText('Add a task') as HTMLInputElement;
    fireEvent.change(field, { target: { value: 'Only block' } });
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Add' })); });
    expect(field.value).toBe('');
  });
});
