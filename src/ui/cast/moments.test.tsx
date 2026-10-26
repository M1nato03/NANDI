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
  it('an idle friend blinks only while it is on screen, every 8-14 s', () => {
    vi.useFakeTimers();
    let callback: (entries: { isIntersecting: boolean }[]) => void = () => {};
    const observe = vi.fn();
    vi.stubGlobal('IntersectionObserver', class { constructor(cb: typeof callback) { callback = cb; } observe = observe; disconnect() {} });
    const view = render(<Cast name="Moti" pose="idle" />);
    expect(observe).toHaveBeenCalledTimes(1);
    act(() => { vi.advanceTimersByTime(20_000); });
    expect(moment(view.container)).toBe('');
    act(() => { callback([{ isIntersecting: true }]); });
    act(() => { vi.advanceTimersByTime(14_000); });
    expect(moment(view.container)).toBe('blink');
    act(() => { callback([{ isIntersecting: false }]); });
    const blinked = moveNode(view.container);
    act(() => { vi.advanceTimersByTime(30_000); });
    expect(moveNode(view.container)).toBe(blinked);
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });
});
