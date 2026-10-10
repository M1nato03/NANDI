import { ulid } from 'ulidx';
import type { Table } from 'dexie';
import type { EntityRow, RowMeta } from '../types';
import { trackWrite } from '../../core/pendingWrites';

export type EntityInput<T extends EntityRow> = Omit<T, keyof RowMeta | 'id'> & { id?: string };
export type NaturalInput<T extends RowMeta> = Omit<T, keyof RowMeta>;

function readMethods<T extends RowMeta>(table: Table<T, string>) {
  return {
    get: (key: string) => table.get(key),
    list: () => table.filter((row) => row.deleted === 0).toArray(),
  };
}

function softDelete<T extends RowMeta>(table: Table<T, string>, deviceId: string) {
  return async (key: string, now: number): Promise<T | undefined> => {
    const existing = await table.get(key);
    if (!existing) return undefined;
    const row = { ...existing, updatedAt: now, deleted: 1 as const, deviceId };
    await trackWrite(() => table.put(row as T));
    return row as T;
  };
}

export function entityRepo<T extends EntityRow>(table: Table<T, string>, deviceId: string) {
  return {
    ...readMethods(table),
    async put(input: EntityInput<T>, now: number): Promise<T> {
      const row = { ...input, id: input.id ?? ulid(now), updatedAt: now, deleted: 0 as const, deviceId } as T;
      await trackWrite(() => table.put(row));
      return row;
    },
    softDelete: softDelete(table, deviceId),
  };
}

export function naturalRepo<T extends RowMeta>(table: Table<T, string>, deviceId: string) {
  return {
    ...readMethods(table),
    async put(input: NaturalInput<T>, now: number): Promise<T> {
      const row = { ...input, updatedAt: now, deleted: 0 as const, deviceId } as T;
      await trackWrite(() => table.put(row));
      return row;
    },
    softDelete: softDelete(table, deviceId),
  };
}
