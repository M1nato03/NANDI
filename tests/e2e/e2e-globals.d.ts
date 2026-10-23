declare global {
  const window: Window;
  const caches: {
    keys(): Promise<string[]>;
    delete(key: string): Promise<boolean>;
  };
  const indexedDB: {
    databases(): Promise<Array<{ name?: string }>>;
    deleteDatabase(name: string): {
      onsuccess: (() => void) | null;
      onerror: (() => void) | null;
      onblocked: (() => void) | null;
      error: Error | null;
    };
  };
  interface Navigator {
    serviceWorker: {
      ready: Promise<unknown>;
      controller: unknown;
      getRegistrations(): Promise<Array<{ unregister(): Promise<boolean> }>>;
    };
  }
  interface Window {
    __nandiCaseTest?: {
      solveKnownSolution(): void;
      solveTodaysCase(): void;
    };
    __nandiTest?: {
      seedShell(): Promise<void>;
      removeShellTask(): Promise<void>;
      shellCounts(): Promise<Record<string, number>>;
      wipeData(): Promise<void>;
      seedLearnNight(conceptId: string, dueAt: number, selectedTopic?: string): Promise<void>;
      seedTaughtSteps(stepIds: string[]): Promise<void>;
      learnConfidence(): Promise<string | undefined>;
      seedNordicSlow(): Promise<void>;
      backupRoundTrip(): Promise<{
        exportedJson: string;
        beforeCounts: Record<string, number>;
        afterCounts: Record<string, number>;
      }>;
    };
  }
}
export {};
