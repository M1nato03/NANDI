import { generateCheck } from './generator';

self.onmessage = (event: MessageEvent<string>) => {
  try {
    const start = performance.now();
    const result = generateCheck(event.data);
    self.postMessage({ result, ms: performance.now() - start });
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : String(error) });
  }
};
