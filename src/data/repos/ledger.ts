import type { NandiDb } from '../db';
import type { LedgerRow, RowMeta } from '../types';

type LedgerInput = Omit<LedgerRow, keyof RowMeta | 'id'> & { id?: string };

export function createLedgerRepos(db: NandiDb, deviceId: string) {
  return {
    ledger: {
      get: (id: string) => db.ledger.get(id),
      list: () => db.ledger.filter((row) => row.deleted === 0).toArray(),
      put(input: LedgerInput, now: number): Promise<LedgerRow> {
        const id = `${input.kind}:${input.refId}`;
        if (input.id !== undefined && input.id !== id) {
          throw new Error('Ledger id must be kind:refId');
        }
        return db.transaction('rw', db.ledger, async () => {
          const existing = await db.ledger.get(id);
          if (existing) return existing;
          const row: LedgerRow = { ...input, id, updatedAt: now, deleted: 0, deviceId };
          await db.ledger.add(row);
          return row;
        });
      },
      softDelete(id: string, now: number): never {
        throw new Error(`Cannot delete ledger fact ${id} at ${now}: ledger facts are append-only`);
      },
    },
  };
}
