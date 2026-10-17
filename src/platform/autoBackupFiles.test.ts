// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Capacitor } from '@capacitor/core';
import { Filesystem } from '@capacitor/filesystem';
import { saveAutoBackup } from './files';

vi.mock('@capacitor/filesystem', () => ({
  Directory: { Documents: 'DOCUMENTS' }, Encoding: { UTF8: 'utf8' },
  Filesystem: { mkdir: vi.fn(), writeFile: vi.fn(), readdir: vi.fn(), deleteFile: vi.fn() },
}));

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(Capacitor, 'isNativePlatform').mockReturnValue(true);
});

describe('Capacitor automatic backup files', () => {
  it('writes under Documents/NANDI/auto and deletes only the two oldest automatic files', async () => {
    const names = Array.from({ length: 9 }, (_, i) => `nandi-auto-2026-10-${String(i + 1).padStart(2, '0')}.json`);
    vi.mocked(Filesystem.readdir).mockResolvedValue({ files: [...names, 'nandi-backup-2026-10-01.json', 'other.json']
      .map(name => ({ name, type: 'file' as const, uri: name, size: 10, mtime: 0 })) });
    const kept = await saveAutoBackup(new File(['{}'], names[8]!, { type: 'application/json' }));
    expect(Filesystem.writeFile).toHaveBeenCalledWith(expect.objectContaining({ path: `NANDI/auto/${names[8]}`, data: '{}' }));
    expect(vi.mocked(Filesystem.deleteFile).mock.calls.map(([options]) => options.path)).toEqual([
      `NANDI/auto/${names[1]}`, `NANDI/auto/${names[0]}`,
    ]);
    expect(kept).toBe(7);
  });
});
