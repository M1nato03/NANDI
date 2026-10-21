export type SoundCue = 'tick' | 'correct' | 'idea' | 'combo' | 'finish' | 'chest' | 'level-up';
// Our own synthesized set (spec 13 H): a very quiet tick on press, a soft low note on "here is the idea".
const notes: Record<SoundCue, number[]> = {
  tick: [1175], correct: [523, 659], idea: [349, 294], combo: [587, 740, 880], finish: [392, 523, 659],
  chest: [440, 554, 740], 'level-up': [523, 659, 784, 1047],
};
const shape: Partial<Record<SoundCue, { peak: number; length: number; gap: number }>> = {
  tick: { peak: 0.006, length: 0.05, gap: 0 },
  idea: { peak: 0.012, length: 0.28, gap: 0.16 },
};
export function playCastSound(cue: SoundCue, enabled: boolean): void {
  if (!enabled || matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduce' || document.querySelector('.deck-night')) return;
  const AudioContextType = window.AudioContext;
  if (!AudioContextType) return;
  const context = new AudioContextType();
  const { peak, length, gap } = shape[cue] ?? { peak: 0.018, length: 0.19, gap: 0.085 };
  notes[cue].forEach((frequency, index) => {
    const start = context.currentTime + index * gap;
    const tone = context.createOscillator(), gain = context.createGain();
    tone.type = 'sine'; tone.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
    tone.connect(gain); gain.connect(context.destination); tone.start(start); tone.stop(start + length + 0.01);
  });
  window.setTimeout(() => { void context.close(); }, 800);
}
