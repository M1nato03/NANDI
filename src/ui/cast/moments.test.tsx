// @vitest-environment jsdom
import { describe, expect, it, vi, afterEach } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { Cast, castNames, useFriendMoment } from './Cast';

afterEach(cleanup);
const moment = (container: HTMLElement) => container.querySelector('svg')!.getAttribute('data-moment');
const moveNode = (container: HTMLElement) => container.querySelector('.cast-move');

function Harness({ trigger, other }: { trigger: string; other: number }) {
  const at = useFriendMoment(trigger);
  return <div data-other={other}><Cast name="Kapi" pose="cheer" moment="hop" at={at} /></div>;
}

describe('spec 31 living friends', () => {
  it('plays a moment once per trigger change, never on a plain re-render', () => {
    const view = render(<Harness trigger="a" other={0} />);
    expect(moment(view.container)).toBe('');
    view.rerender(<Harness trigger="b" other={0} />);
    expect(moment(view.container)).toBe('hop');
    const playing = moveNode(view.container);
    view.rerender(<Harness trigger="b" other={1} />);
    // Same node: the animation is not restarted by an unrelated re-render.
    expect(moveNode(view.container)).toBe(playing);
    view.rerender(<Harness trigger="c" other={1} />);
    expect(moveNode(view.container)).not.toBe(playing);
  });
  it('a moment on mount plays from at={1}', () => {
    const view = render(<Cast name="Nandi" pose="cheer" moment="wave" at={1} />);
    expect(moment(view.container)).toBe('wave');
    expect(view.container.querySelectorAll('.cast-limb')).toHaveLength(1);
  });
  it('every friend has exactly one front limb group to wave', () => {
    for (const name of castNames) {
      const view = render(<Cast name={name} pose="idle" />);
      expect(view.container.querySelectorAll('.cast-limb'), name).toHaveLength(1);
      view.unmount();
    }
  });
  it('breathe loops only on a rest pose', () => {
    expect(render(<Cast name="Kachhua" pose="rest" moment="settle" at={1} breathe />).container.querySelector('svg')!.classList.contains('cast-breathe')).toBe(true);
    cleanup();
    expect(render(<Cast name="Kachhua" pose="cheer" moment="settle" at={1} breathe />).container.querySelector('svg')!.classList.contains('cast-breathe')).toBe(false);
  });
  it('an idle friend blinks only while it is on screen, every 5-7 s (spec 45a)', () => {
    vi.useFakeTimers();
    let callback: (entries: { isIntersecting: boolean }[]) => void = () => {};
    const observe = vi.fn();
    vi.stubGlobal('IntersectionObserver', class { constructor(cb: typeof callback) { callback = cb; } observe = observe; disconnect() {} });
    const view = render(<Cast name="Moti" pose="idle" />);
    expect(observe).toHaveBeenCalledTimes(1);
    act(() => { vi.advanceTimersByTime(20_000); });
    expect(moment(view.container)).toBe('');
    act(() => { callback([{ isIntersecting: true }]); });
    act(() => { vi.advanceTimersByTime(4_999); });
    expect(moment(view.container)).toBe('');
    act(() => { vi.advanceTimersByTime(2_001); });
    expect(moment(view.container)).toBe('blink');
    act(() => { callback([{ isIntersecting: false }]); });
    const blinked = moveNode(view.container);
    act(() => { vi.advanceTimersByTime(30_000); });
    expect(moveNode(view.container)).toBe(blinked);
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });
  it('the idle blink comes back after a triggered moment, and waits while the page is hidden (Codex A item 128)', () => {
    vi.useFakeTimers();
    let callback: (entries: { isIntersecting: boolean }[]) => void = () => {};
    vi.stubGlobal('IntersectionObserver', class { constructor(cb: typeof callback) { callback = cb; } observe() {} disconnect() {} });
    const view = render(<Cast name="Chiku" pose="idle" moment="nod" at={1} />);
    expect(moment(view.container)).toBe('nod');
    act(() => { callback([{ isIntersecting: true }]); });
    act(() => { vi.advanceTimersByTime(14_000); });
    expect(moment(view.container)).toBe('blink');
    const hidden = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    const shown = moveNode(view.container);
    act(() => { vi.advanceTimersByTime(30_000); });
    expect(moveNode(view.container)).toBe(shown);
    hidden.mockRestore();
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
    act(() => { vi.advanceTimersByTime(14_000); });
    expect(moveNode(view.container)).not.toBe(shown);
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });
  it('each friend blinks at its own steady 5-7 s gap, and a tap is the short squash (spec 45a)', () => {
    vi.useFakeTimers();
    const callbacks: ((entries: { isIntersecting: boolean }[]) => void)[] = [];
    vi.stubGlobal('IntersectionObserver', class { constructor(cb: (entries: { isIntersecting: boolean }[]) => void) { callbacks.push(cb); } observe() {} disconnect() {} });
    const view = render(<><Cast name="Moti" pose="idle" /><Cast name="Mor" pose="idle" /></>);
    act(() => { for (const callback of callbacks) callback([{ isIntersecting: true }]); });
    const svgs = [...view.container.querySelectorAll('svg')];
    const blinks: number[][] = [[], []];
    for (let at = 100; at <= 15_000; at += 100) {
      const before = svgs.map(svg => svg.querySelector('.cast-move'));
      act(() => { vi.advanceTimersByTime(100); });
      svgs.forEach((svg, index) => { if (svg.getAttribute('data-moment') === 'blink' && svg.querySelector('.cast-move') !== before[index]) blinks[index]!.push(at); });
    }
    for (const times of blinks) {
      expect(times.length).toBeGreaterThanOrEqual(2);
      expect(times[0]).toBeGreaterThanOrEqual(5_000);
      expect(times[0]).toBeLessThan(7_100);
      expect(Math.abs(times[1]! - times[0]! - times[0]!)).toBeLessThanOrEqual(100); // steady: the same gap again (100 ms steps)
    }
    vi.unstubAllGlobals();
    vi.useRealTimers();
    cleanup();
    expect(moment(render(<Cast name="Chiku" moment="tap" at={1} />).container)).toBe('tap');
  });
  it('a resting friend can blink: its closed eyes carry the eye class', () => {
    const view = render(<Cast name="Kachhua" pose="rest" moment="blink" at={1} />);
    expect(view.container.querySelectorAll('.cast-eye-closed').length).toBe(2);
    expect(moment(view.container)).toBe('blink');
  });
});
