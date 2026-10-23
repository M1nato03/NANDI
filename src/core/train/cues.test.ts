import { describe, expect, it } from 'vitest';
import FORM_CUES from './form-cues.json';
import { formCues } from './cues';
import { EXERCISE_LIBRARY } from './library';

describe('form cues', () => {
  it('gives every exercise three short cues', () => {
    expect(Object.keys(FORM_CUES).filter(key => !key.includes(':')).sort()).toEqual(Object.keys(EXERCISE_LIBRARY).sort());
    for (const id of Object.keys(FORM_CUES)) {
      const cues = (FORM_CUES as Record<string, string[]>)[id]!;
      expect(cues, id).toHaveLength(3);
      for (const cue of cues) expect(cue.length, `${id}: ${cue}`).toBeLessThan(60);
    }
  });

  it('gives slow SL-RDL its own three cues and leaves every other exercise as it was (spec 17)', () => {
    expect(formCues('sl-rdl', 'slow')).toEqual(['Lower for a slow count of 3.', 'Pause for 1 at the bottom, hips level.', 'Stand up smoothly; hold the wall if you wobble.']);
    expect(formCues('sl-rdl')).toEqual(['Stand on one leg, hold a wall if needed.', 'Tip forward as the free leg goes back.', 'Keep hips level; return to standing slowly.']);
    expect(formCues('banded-nordic', 'nordic-intro')).toEqual(formCues('banded-nordic'));
  });
});
