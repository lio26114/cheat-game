"""
Generate simple synthesized sound effects for the card game "欺局".
Uses only Python stdlib (wave + struct + math).
Outputs short .wav files suitable for mobile game SFX.
"""
import wave
import struct
import math
import os

OUTPUT_DIR_SFX = os.path.join(os.path.dirname(__file__), '..', 'assets', 'audio', 'sfx')
OUTPUT_DIR_BGM = os.path.join(os.path.dirname(__file__), '..', 'assets', 'audio', 'bgm')

SAMPLE_RATE = 44100

def write_wav(filename, samples, sample_rate=SAMPLE_RATE):
    """Write mono 16-bit WAV file."""
    filepath = os.path.join(OUTPUT_DIR_SFX, filename) if 'bgm' not in filename else os.path.join(OUTPUT_DIR_BGM, filename)
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with wave.open(filepath, 'w') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        for s in samples:
            clamped = max(-1.0, min(1.0, s))
            wf.writeframes(struct.pack('<h', int(clamped * 32767)))

def sine(freq, duration, volume=0.5):
    """Generate sine wave samples."""
    n = int(SAMPLE_RATE * duration)
    return [volume * math.sin(2 * math.pi * freq * i / SAMPLE_RATE) for i in range(n)]

def envelope(samples, attack=0.01, decay=0.05, sustain_level=0.7, release=0.1):
    """Apply ADSR envelope."""
    n = len(samples)
    attack_n = int(SAMPLE_RATE * attack)
    decay_n = int(SAMPLE_RATE * decay)
    release_n = int(SAMPLE_RATE * release)
    result = []
    for i in range(n):
        if i < attack_n:
            gain = i / attack_n if attack_n > 0 else 1.0
        elif i < attack_n + decay_n:
            gain = 1.0 - (1.0 - sustain_level) * (i - attack_n) / decay_n if decay_n > 0 else sustain_level
        elif i < n - release_n:
            gain = sustain_level
        else:
            gain = sustain_level * (n - i) / release_n if release_n > 0 else 0
        result.append(samples[i] * gain)
    return result

def mix(*sample_lists):
    """Mix multiple sample lists."""
    max_len = max(len(s) for s in sample_lists)
    result = [0.0] * max_len
    for s in sample_lists:
        for i in range(len(s)):
            result[i] += s[i]
    return result

def noise(duration, volume=0.3):
    """Generate white noise."""
    import random
    n = int(SAMPLE_RATE * duration)
    return [volume * (random.random() * 2 - 1) for _ in range(n)]

# ===== SFX Generation =====

def make_card_play():
    """Short card flip sound - quick high tick."""
    return envelope(sine(1200, 0.08, 0.6) + sine(800, 0.08, 0.3), attack=0.002, decay=0.03, sustain_level=0.3, release=0.04)

def make_card_flip():
    """Card reveal sound - quick swoosh."""
    n = int(SAMPLE_RATE * 0.15)
    samples = []
    for i in range(n):
        freq = 400 + 800 * (i / n)
        samples.append(0.4 * math.sin(2 * math.pi * freq * i / SAMPLE_RATE))
    return envelope(samples, attack=0.01, decay=0.05, sustain_level=0.5, release=0.05)

def make_hit():
    """Damage taken - low thud."""
    return envelope(mix(sine(150, 0.2, 0.7), sine(80, 0.2, 0.5), noise(0.05, 0.3)), attack=0.005, decay=0.08, sustain_level=0.3, release=0.1)

def make_counter():
    """Counter/suppress hit - sharp impact."""
    return envelope(mix(sine(600, 0.12, 0.5), sine(900, 0.12, 0.3), noise(0.03, 0.2)), attack=0.002, decay=0.04, sustain_level=0.4, release=0.06)

def make_mindread():
    """Mind read success - mystical chime."""
    return envelope(mix(sine(523, 0.3, 0.4), sine(659, 0.3, 0.3), sine(784, 0.3, 0.2)), attack=0.02, decay=0.1, sustain_level=0.5, release=0.15)

def make_trap():
    """Trap triggered - sharp metallic."""
    return envelope(mix(sine(200, 0.15, 0.5), sine(1500, 0.1, 0.3), noise(0.08, 0.4)), attack=0.002, decay=0.05, sustain_level=0.3, release=0.08)

def make_victory():
    """Victory fanfare - ascending arpeggio."""
    notes = [523, 659, 784, 1047]  # C5, E5, G5, C6
    samples = []
    for j, freq in enumerate(notes):
        note = sine(freq, 0.25, 0.5)
        start = int(j * SAMPLE_RATE * 0.15)
        padded = [0.0] * start + note
        if len(padded) > len(samples):
            samples.extend([0.0] * (len(padded) - len(samples)))
        for i in range(len(padded)):
            if i < len(samples):
                samples[i] += padded[i]
            else:
                samples.append(padded[i])
    return envelope(samples, attack=0.01, decay=0.1, sustain_level=0.6, release=0.2)

def make_defeat():
    """Defeat - descending tone."""
    n = int(SAMPLE_RATE * 0.6)
    samples = []
    for i in range(n):
        freq = 400 - 200 * (i / n)
        samples.append(0.5 * math.sin(2 * math.pi * freq * i / SAMPLE_RATE))
    return envelope(samples, attack=0.01, decay=0.1, sustain_level=0.5, release=0.3)

def make_button():
    """UI button click - soft tick."""
    return envelope(sine(1000, 0.04, 0.3), attack=0.002, decay=0.01, sustain_level=0.2, release=0.02)

def make_combo():
    """Combo hit - double tap."""
    tap = sine(800, 0.06, 0.5)
    gap = [0.0] * int(SAMPLE_RATE * 0.04)
    return envelope(tap + gap + tap, attack=0.002, decay=0.03, sustain_level=0.5, release=0.04)

def make_pressure():
    """Pressure rising - tense low hum."""
    n = int(SAMPLE_RATE * 0.3)
    samples = []
    for i in range(n):
        freq = 100 + 50 * (i / n)
        samples.append(0.4 * math.sin(2 * math.pi * freq * i / SAMPLE_RATE) + 0.2 * math.sin(2 * math.pi * freq * 1.5 * i / SAMPLE_RATE))
    return envelope(samples, attack=0.05, decay=0.1, sustain_level=0.6, release=0.15)

def make_rule_change():
    """Rule change - distortion/shift sound."""
    n = int(SAMPLE_RATE * 0.4)
    samples = []
    for i in range(n):
        freq = 300 + 400 * math.sin(2 * math.pi * 3 * i / SAMPLE_RATE)
        samples.append(0.4 * math.sin(2 * math.pi * freq * i / SAMPLE_RATE))
    return envelope(samples, attack=0.01, decay=0.1, sustain_level=0.4, release=0.2)

def make_phase_shift():
    """Boss phase shift - dramatic rising tone."""
    n = int(SAMPLE_RATE * 0.8)
    samples = []
    for i in range(n):
        t = i / n
        freq = 200 + 600 * t
        amp = 0.5 * (1 - t * 0.5)
        samples.append(amp * math.sin(2 * math.pi * freq * i / SAMPLE_RATE) + 0.2 * math.sin(2 * math.pi * freq * 0.5 * i / SAMPLE_RATE))
    return envelope(samples, attack=0.02, decay=0.15, sustain_level=0.6, release=0.3)

# ===== BGM Generation (lighter, mid-high frequency focus) =====

def make_menu_bgm():
    """Menu BGM - gentle ambient, 8 seconds loop. Mid-frequency focus."""
    duration = 8.0
    n = int(SAMPLE_RATE * duration)
    samples = []
    for i in range(n):
        t = i / SAMPLE_RATE
        # Mid-frequency pad (A3, C#4, E4 — A major chord, no bass)
        s = (0.08 * math.sin(2 * math.pi * 220 * t) +       # A3
             0.06 * math.sin(2 * math.pi * 277.2 * t) +      # C#4
             0.05 * math.sin(2 * math.pi * 329.6 * t) +      # E4
             0.03 * math.sin(2 * math.pi * 440 * t))          # A4 shimmer
        # Slow amplitude modulation for breathing feel
        s *= 0.5 + 0.5 * math.sin(2 * math.pi * 0.25 * t)
        # Very soft high sparkle
        s += 0.015 * math.sin(2 * math.pi * 880 * t) * (0.5 + 0.5 * math.sin(2 * math.pi * 0.1 * t))
        samples.append(s * 0.7)
    # Crossfade for seamless loop
    fade = int(SAMPLE_RATE * 0.5)
    for i in range(fade):
        samples[i] = samples[i] * (i / fade) + samples[-(fade-i)] * (1 - i / fade)
    filepath = os.path.join(OUTPUT_DIR_BGM, 'menu.wav')
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with wave.open(filepath, 'w') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        for s in samples:
            clamped = max(-1.0, min(1.0, s))
            wf.writeframes(struct.pack('<h', int(clamped * 32767)))

def make_battle_bgm():
    """Battle BGM - tense but mid-focused, 8 seconds. No heavy bass."""
    duration = 8.0
    n = int(SAMPLE_RATE * duration)
    samples = []
    bpm = 120
    beat_samples = int(SAMPLE_RATE * 60 / bpm)
    for i in range(n):
        t = i / SAMPLE_RATE
        beat_pos = i % beat_samples
        # Mid-frequency pulse on each beat (D3 = 146.8Hz, not sub-bass)
        beat_env = max(0, 1 - beat_pos / (beat_samples * 0.3))
        pulse = 0.08 * beat_env * math.sin(2 * math.pi * 146.8 * t)
        # Tense pad — minor chord (D4, F4, A4) — all mid range
        pad = (0.07 * math.sin(2 * math.pi * 293.7 * t) +    # D4
               0.05 * math.sin(2 * math.pi * 349.2 * t) +    # F4
               0.04 * math.sin(2 * math.pi * 440 * t))        # A4
        pad *= 0.5 + 0.5 * math.sin(2 * math.pi * 0.5 * t)
        # Light rhythmic tick (high freq, very quiet)
        tick = 0.02 * beat_env * (1 if beat_pos < 150 else 0) * math.sin(2 * math.pi * 3000 * i / SAMPLE_RATE)
        samples.append(pulse + pad + tick)
    # Crossfade for loop
    fade = int(SAMPLE_RATE * 0.3)
    for i in range(fade):
        samples[i] = samples[i] * (i / fade) + samples[-(fade-i)] * (1 - i / fade)
    filepath = os.path.join(OUTPUT_DIR_BGM, 'battle.wav')
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with wave.open(filepath, 'w') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        for s in samples:
            clamped = max(-1.0, min(1.0, s))
            wf.writeframes(struct.pack('<h', int(clamped * 32767)))

def make_boss_bgm():
    """Boss BGM - dark but mid-range, 8 seconds. No sub-bass rumble."""
    duration = 8.0
    n = int(SAMPLE_RATE * duration)
    samples = []
    bpm = 140
    beat_samples = int(SAMPLE_RATE * 60 / bpm)
    for i in range(n):
        t = i / SAMPLE_RATE
        beat_pos = i % beat_samples
        # Mid pulse (C3 = 130.8Hz, not sub-bass)
        beat_env = max(0, 1 - beat_pos / (beat_samples * 0.2))
        pulse = 0.10 * beat_env * math.sin(2 * math.pi * 130.8 * t)
        # Dissonant pad — tritone (C4, F#4, G4) — mid range only
        pad = (0.07 * math.sin(2 * math.pi * 261.6 * t) +    # C4
               0.05 * math.sin(2 * math.pi * 370 * t) +      # F#4 (tritone)
               0.04 * math.sin(2 * math.pi * 392 * t))        # G4
        pad *= 0.4 + 0.6 * math.sin(2 * math.pi * 0.75 * t)
        # High tension shimmer
        shimmer = 0.02 * math.sin(2 * math.pi * 784 * t) * (0.5 + 0.5 * math.sin(2 * math.pi * 2 * t))
        samples.append(pulse + pad + shimmer)
    # Crossfade
    fade = int(SAMPLE_RATE * 0.3)
    for i in range(fade):
        samples[i] = samples[i] * (i / fade) + samples[-(fade-i)] * (1 - i / fade)
    filepath = os.path.join(OUTPUT_DIR_BGM, 'boss.wav')
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with wave.open(filepath, 'w') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SAMPLE_RATE)
        for s in samples:
            clamped = max(-1.0, min(1.0, s))
            wf.writeframes(struct.pack('<h', int(clamped * 32767)))

# ===== Generate all =====

if __name__ == '__main__':
    print('Generating SFX...')
    sfx_map = {
        'card_play': make_card_play,
        'card_flip': make_card_flip,
        'hit': make_hit,
        'counter': make_counter,
        'mindread': make_mindread,
        'trap': make_trap,
        'victory': make_victory,
        'defeat': make_defeat,
        'button': make_button,
        'combo': make_combo,
        'pressure': make_pressure,
        'rule_change': make_rule_change,
        'phase_shift': make_phase_shift,
    }
    for name, gen_func in sfx_map.items():
        samples = gen_func()
        write_wav(f'{name}.wav', samples)
        print(f'  OK {name}.wav ({len(samples)/SAMPLE_RATE:.2f}s)')

    print('\nGenerating BGM...')
    make_menu_bgm()
    print('  OK menu.wav')
    make_battle_bgm()
    print('  OK battle.wav')
    make_boss_bgm()
    print('  OK boss.wav')

    print('\nDone! All audio files generated.')
