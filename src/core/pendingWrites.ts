let count = 0;
const listeners = new Set<(count: number) => void>();

export const pendingWrites = {
  get count() { return count; },
  increment() { 
    count++; 
    listeners.forEach(l => l(count));
  },
  decrement() { 
    count--; 
    listeners.forEach(l => l(count));
  },
  subscribe(listener: (count: number) => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }
};
