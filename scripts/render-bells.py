"""Spec 38: renders Calm's bells to WAV for the native player, from the same partials and envelopes as
src/platform/calmSound.ts (strike, softStrike, endBell, tick). Run: python scripts/render-bells.py"""
import math, struct, wave, os

RATE = 44100
OUT = os.path.join(os.path.dirname(__file__), '..', 'android', 'app', 'src', 'main', 'res', 'raw')

def env_value(t, peak, attack, decay_to):
    """A linear rise to `peak` over `attack`, then an exponential fall to 0.0001 by `decay_to` (WebAudio ramps)."""
    if t < 0: return 0.0
    if t < attack: return 0.0001 + (peak - 0.0001) * t / attack
    if t >= decay_to: return 0.0
    span = decay_to - attack
    return peak * (0.0001 / peak) ** ((t - attack) / span)

def strike(buf, at, base, level, decay):
    for ratio, weight in [(1, 1), (2.0, 0.5), (2.76, 0.32), (5.4, 0.16), (8.93, 0.08)]:
        freq, peak, end = base * ratio, level * weight, decay / math.sqrt(ratio)
        for i in range(len(buf)):
            t = i / RATE - at
            if 0 <= t < end: buf[i] += math.sin(2 * math.pi * freq * t) * env_value(t, peak, 0.01, end)

def end_bell(buf, at):
    for index, freq in enumerate([523.25, 783.99, 1046.5]):
        when = at + index * 0.11
        for i in range(len(buf)):
            t = i / RATE - when
            if 0 <= t < 1.4: buf[i] += math.sin(2 * math.pi * freq * t) * env_value(t, 0.26 / (index + 1), 0.025, 1.4)

def tick(buf, at):
    for i in range(len(buf)):
        t = i / RATE - at
        if 0 <= t < 0.12: buf[i] += math.sin(2 * math.pi * 1320 * t) * env_value(t, 0.05, 0.005, 0.12)

def write(name, seconds, draw):
    buf = [0.0] * int(RATE * seconds)
    draw(buf)
    # The web mixer doubles the bell gain at the default volume; match its loudness, with headroom.
    peak = max(abs(x) for x in buf) or 1
    scale = min(2.0, 0.9 / peak)
    with wave.open(os.path.join(OUT, name), 'wb') as file:
        file.setnchannels(1); file.setsampwidth(2); file.setframerate(RATE)
        file.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, x * scale)) * 32767)) for x in buf))

os.makedirs(OUT, exist_ok=True)
write('calm_bell_start.wav', 4.2, lambda b: strike(b, 0.02, 523.25, 0.2, 4))
write('calm_bell_interval.wav', 4.2, lambda b: strike(b, 0.02, 523.25, 0.12, 4))
write('calm_bell_end.wav', 1.8, lambda b: end_bell(b, 0.02))
write('calm_tick.wav', 0.2, lambda b: tick(b, 0.02))
print('ok')
