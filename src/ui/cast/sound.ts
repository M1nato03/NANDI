export type SoundCue = 'correct' | 'combo' | 'finish' | 'chest' | 'level-up';
const notes: Record<SoundCue, number[]> = {
  correct: [523, 659], combo: [587, 740, 880], finish: [392, 523, 659],
  chest: [440, 554, 740], 'level-up': [523, 659, 784, 1047],
};
export function playCastSound(cue: SoundCue, enabled: boolean): void {
  if (!enabled || matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'reduce' || document.querySelector('.deck-night')) return;
  const AudioContextType = window.AudioContext;
  if (!AudioContextType) return;
  const context = new AudioContextType();
  notes[cue].forEach((frequency, index) => {
    const start = context.currentTime + index * 0.085;
    const tone = context.createOscillator(), gain = context.createGain();
    tone.type = 'sine'; tone.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.018, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.19);
    tone.connect(gain); gain.connect(context.destination); tone.start(start); tone.stop(start + 0.2);
  });
  window.setTimeout(() => { void context.close(); }, 800);
}
