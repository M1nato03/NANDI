import { describe, expect, it } from 'vitest';
import FORM_CUES from './form-cues.json';
import { formCues } from './cues';
import { EXERCISE_LIBRARY } from './library';

describe('form cues', () => {
  it('gives every exercise three short cues', () => {
    expect(Object.keys(FORM_CUES).sort()).toEqual(Object.keys(EXERCISE_LIBRARY).sort());
    for (const id of Object.keys(EXERCISE_LIBRARY)) {
      const cues = formCues(id);
      expect(cues, id).toHaveLength(3);
      for (const cue of cues) expect(cue.length, `${id}: ${cue}`).toBeLessThan(60);
    }
  });
});
