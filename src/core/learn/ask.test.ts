import { describe, expect, it } from 'vitest';
import { bundledTopicPacks } from '../../data/packs/seed';
import { askFor } from './ask';

describe('question labels', () => {
  it('gives every bundled question a plain instruction, never the raw type', () => {
    const items = bundledTopicPacks.flatMap(pack => pack.body.modules.flatMap(module => module.concepts.flatMap(concept => concept.items)));
    // Spec 16 §5: 6 practice items per idea (54 ideas), so the bank is about 324 items.
    expect(items.length).toBeGreaterThan(300);
    for (const item of items) {
      const label = askFor(item.type);
      expect(label, item.id).toBeTruthy();
      if (item.type.includes('-')) expect(label.toLowerCase()).not.toContain(item.type.replaceAll('-', ' '));
    }
  });
});
