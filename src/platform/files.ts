/** Shares a backup from a user gesture, downloading it when file sharing is unavailable. */
export async function shareOrDownload(file: File): Promise<void> {
  // Capacitor branch: Phase 2
  if (typeof navigator !== 'undefined' && typeof navigator.canShare === 'function'
    && navigator.canShare({ files: [file] }) && typeof navigator.share === 'function') {
    await navigator.share({ files: [file] });
    return;
  }
  const url = URL.createObjectURL(file);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    link.style.display = 'none';
    document.body.append(link);
    link.click();
    link.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

/** Returns null when the user closes the picker without selecting a file. */
export function pickFile(): Promise<File | null> {
  // Capacitor branch: Phase 2
  return new Promise(resolve => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.style.display = 'none';
    document.body.append(input);
    let settled = false;
    const finish = (file: File | null) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(file);
    };
    input.addEventListener('change', () => finish(input.files?.[0] ?? null), { once: true });
    input.addEventListener('cancel', () => finish(null), { once: true });
    input.click();
  });
}
