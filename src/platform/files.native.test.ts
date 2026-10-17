// @vitest-environment jsdom
import { expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({ writeFile: vi.fn().mockResolvedValue({ uri: 'file:///backup.json' }), share: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => true } }));
vi.mock('@capacitor/filesystem', () => ({ Directory: { Documents: 'DOCUMENTS' }, Encoding: { UTF8: 'utf8' }, Filesystem: { writeFile: mock.writeFile } }));
vi.mock('@capacitor/share', () => ({ Share: { share: mock.share } }));

import { saveBackupToDocuments, shareOrDownload } from './files';

it('writes a backup to Android Documents and shares its URI', async () => {
  const file = Object.assign(new File(['{}'], 'nandi-backup.json', { type: 'application/json' }), { text: async () => '{}' });
  expect(await shareOrDownload(file)).toBe('shared');
  expect(mock.writeFile).toHaveBeenCalledWith({ path: 'nandi-backup.json', data: '{}', directory: 'DOCUMENTS', encoding: 'utf8' });
  expect(mock.share).toHaveBeenCalledWith(expect.objectContaining({ files: ['file:///backup.json'] }));
});

it('writes a PNG as base64 bytes for Android sharing', async () => {
  mock.writeFile.mockClear(); mock.share.mockClear();
  const file = new File([new Uint8Array([137, 80, 78, 71])], 'nandi-week.png', { type: 'image/png' });
  expect(await shareOrDownload(file)).toBe('shared');
  expect(mock.writeFile).toHaveBeenCalledWith({ path: 'nandi-week.png', data: 'iVBORw==', directory: 'DOCUMENTS' });
  expect(mock.share).toHaveBeenCalledWith(expect.objectContaining({ title: 'What my week became', files: ['file:///backup.json'] }));
});

it('saves an update backup to Documents without a share sheet', async () => {
  mock.writeFile.mockClear(); mock.share.mockClear();
  const file = Object.assign(new File(['{}'], 'nandi-update-backup.json', { type: 'application/json' }), { text: async () => '{}' });
  expect(await saveBackupToDocuments(file)).toBe('Documents/nandi-update-backup.json');
  expect(mock.writeFile).toHaveBeenCalledWith({ path: file.name, data: '{}', directory: 'DOCUMENTS', encoding: 'utf8' });
  expect(mock.share).not.toHaveBeenCalled();
});
