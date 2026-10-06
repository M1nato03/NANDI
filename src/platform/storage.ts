/** Browsers without the Storage API return false instead of blocking first run. */
export async function requestPersist(): Promise<boolean> {
  try { return await navigator.storage?.persist?.() ?? false; }
  catch { return false; }
}

export async function estimate(): Promise<StorageEstimate | null> {
  try { return await navigator.storage?.estimate?.() ?? null; }
  catch { return null; }
}
