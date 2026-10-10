declare global {
  const window: Window;
  interface Navigator {
    serviceWorker: { ready: Promise<unknown>; controller: unknown };
  }
  interface Window {
    __nandiTest?: {
      seedShell(): Promise<void>;
      removeShellTask(): Promise<void>;
      shellCounts(): Promise<Record<string, number>>;
      wipeData(): Promise<void>;
      backupRoundTrip(): Promise<{
        exportedJson: string;
        beforeCounts: Record<string, number>;
        afterCounts: Record<string, number>;
      }>;
    };
  }
}
export {};
