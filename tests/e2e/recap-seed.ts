import type { Page } from '@playwright/test';

/** Seed two aggregate categories in the week containing the given local date. */
export async function seedRecapWeek(page: Page, day: string): Promise<void> {
  await page.evaluate(async (date) => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = window.indexedDB.open('nandi');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const at = new Date(`${date}T12:00:00`).getTime();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(['tasks', 'sessions'], 'readwrite');
      transaction.objectStore('tasks').put({ id: `recap-task-${date}`, title: 'Private title', status: 'done', dayKey: date, doneAt: at, updatedAt: at, deleted: 0, deviceId: 'recap-test' });
      transaction.objectStore('sessions').put({ id: `recap-workout-${date}`, dayKey: date, status: 'completed', workingSets: 6, xp: 72, endedAt: at, updatedAt: at, deleted: 0, deviceId: 'recap-test' });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    database.close();
  }, day);
  // IndexedDB writes made outside Dexie do not emit its live-query change event.
  await page.reload();
}
