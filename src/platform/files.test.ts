// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { shareOrDownload } from './files';

const createObjectURL = vi.fn(() => 'blob:backup');
const revokeObjectURL = vi.fn();
const clickAnchor = vi.fn();
const file = () => new File(['{}'], 'nandi-backup.json', { type: 'application/json' });

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  vi.stubGlobal('URL', { createObjectURL, revokeObjectURL });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(clickAnchor);
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('shareOrDownload', () => {
  it('reports a successful share without starting a download', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const canShare = vi.fn().mockReturnValue(true);
    vi.stubGlobal('navigator', { canShare, share });

    expect(await shareOrDownload(file())).toBe('shared');
    expect(canShare).toHaveBeenCalledOnce();
    expect(share).toHaveBeenCalledOnce();
    expect(createObjectURL).not.toHaveBeenCalled();
    expect(clickAnchor).not.toHaveBeenCalled();
  });

  it('downloads when sharing rejects with NotAllowedError', async () => {
    const share = vi.fn().mockRejectedValue(new DOMException('Not allowed', 'NotAllowedError'));
    vi.stubGlobal('navigator', { canShare: () => true, share });

    expect(await shareOrDownload(file())).toBe('downloaded');
    expect(share).toHaveBeenCalledOnce();
    expect(clickAnchor).toHaveBeenCalledOnce();
  });

  it('reports cancellation without downloading on AbortError', async () => {
    vi.stubGlobal('navigator', {
      canShare: () => true,
      share: vi.fn().mockRejectedValue(new DOMException('Cancelled', 'AbortError')),
    });

    expect(await shareOrDownload(file())).toBe('cancelled');
    expect(createObjectURL).not.toHaveBeenCalled();
    expect(clickAnchor).not.toHaveBeenCalled();
  });

  it('downloads when canShare is unavailable', async () => {
    const share = vi.fn();
    vi.stubGlobal('navigator', { share });

    expect(await shareOrDownload(file())).toBe('downloaded');
    expect(share).not.toHaveBeenCalled();
    expect(clickAnchor).toHaveBeenCalledOnce();
  });

  it('downloads when canShare returns false', async () => {
    const share = vi.fn();
    vi.stubGlobal('navigator', { canShare: () => false, share });

    expect(await shareOrDownload(file())).toBe('downloaded');
    expect(share).not.toHaveBeenCalled();
    expect(clickAnchor).toHaveBeenCalledOnce();
  });

  it('keeps the download URL for 60 seconds before revoking it', async () => {
    vi.stubGlobal('navigator', {});

    expect(await shareOrDownload(file())).toBe('downloaded');
    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(59_999);
    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:backup');
  });
});
