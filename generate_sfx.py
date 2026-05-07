#!/usr/bin/env python3
import wave
import struct
import math
import os

OUT_SFX = "assets/audio/sfx"
OUT_BGM = "assets/audio/bgm"
SAMPLE_RATE = 44100

def ensure_dirs():
    os.makedirs(OUT_SFX, exist_ok=True)
    os.makedirs(OUT_BGM, exist_ok=True)

def write_wav(path, samples, amp=0.3):
    n = len(samples)
    with wave.open(path, 'w') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SAMPLE_RATE)
        frames = b''
        for s in samples:
            v = max(-1, min(1, s * amp))
            frames += struct.pack('<h', int(v * 32767))
        w.writeframes(frames)

def tone(freq, duration, shape='sine', volume=0.3):
    n = int(SAMPLE_RATE * duration)
    samples = []
    for i in range(n):
        t = i / SAMPLE_RATE
        if shape == 'sine':
            v = math.sin(2 * math.pi * freq * t)
        elif shape == 'square':
            v = 1 if math.sin(2 * math.pi * freq * t) > 0 else -1
        else:
            v = math.sin(2 * math.pi * freq * t)
        fade_in = min(1, i / (SAMPLE_RATE * 0.02))
        fade_out = min(1, (n - i) / (SAMPLE_RATE * 0.02))
        fade = fade_in * fade_out
        samples.append(v * fade * volume)
    return samples

def sweep(start_f, end_f, duration, volume=0.3):
    n = int(SAMPLE_RATE * duration)
    samples = []
    for i in range(n):
        t = i / SAMPLE_RATE
        freq = start_f + (end_f - start_f) * (i / n)
        v = math.sin(2 * math.pi * freq * t)
        fade_in = min(1, i / (SAMPLE_RATE * 0.02))
        fade_out = min(1, (n - i) / (SAMPLE_RATE * 0.02))
        fade = fade_in * fade_out
        samples.append(v * fade * volume)
    return samples

def gen_hit():
    """受伤：低沉短促的咚声"""
    samples = []
    for i in range(int(SAMPLE_RATE * 0.25)):
        t = i / SAMPLE_RATE
        freq = 180 * math.exp(-t * 8)
        v = math.sin(2 * math.pi * freq * t)
        envelope = math.exp(-t * 6)
        samples.append(v * envelope)
    return samples

def gen_victory():
    """胜利：上升和弦 C-E-G"""
    samples = []
    total_len = int(SAMPLE_RATE * 0.8)
    for i in range(total_len):
        t = i / SAMPLE_RATE
        v = 0
        # C5
        v += math.sin(2 * math.pi * 523 * t) * (1 if t > 0.1 else t/0.1)
        # E5
        v += math.sin(2 * math.pi * 659 * t) * (1 if t > 0.2 else 0)
        # G5
        v += math.sin(2 * math.pi * 784 * t) * (1 if t > 0.35 else 0)
        envelope = math.exp(-t * 2)
        samples.append(v * envelope * 0.3)
    return samples

def gen_defeat():
    """失败：下降低音"""
    samples = []
    for i in range(int(SAMPLE_RATE * 0.6)):
        t = i / SAMPLE_RATE
        freq = 440 * math.exp(-t * 2)
        v = math.sin(2 * math.pi * freq * t)
        envelope = math.exp(-t * 2)
        samples.append(v * envelope * 0.4)
    return samples

def gen_button():
    """按钮：轻柔触碰"""
    return tone(1000, 0.05, 'sine', 0.2)

def gen_combo():
    """连击：快速上升"""
    return sweep(800, 2000, 0.2, 0.3)

def gen_pressure():
    """压力：低沉不安"""
    samples = []
    for i in range(int(SAMPLE_RATE * 0.5)):
        t = i / SAMPLE_RATE
        v = math.sin(2 * math.pi * 110 * t) * 0.5
        v += math.sin(2 * math.pi * 113 * t) * 0.3
        envelope = min(1, i / (SAMPLE_RATE * 0.1))
        samples.append(v * envelope * 0.35)
    return samples

def gen_rule_change():
    """规则变化：科幻扫描"""
    return sweep(2000, 200, 0.4, 0.25)

def gen_phase_shift():
    """Boss阶段：戏剧性"""
    samples = []
    for i in range(int(SAMPLE_RATE * 0.6)):
        t = i / SAMPLE_RATE
        freq = 150 + 100 * math.sin(t * 8)
        v = math.sin(2 * math.pi * freq * t)
        envelope = math.sin(math.pi * t / 0.6)
        samples.append(v * envelope * 0.4)
    return samples

def gen_card_play():
    """出牌：干脆咔嗒"""
    s1 = tone(800, 0.06, 'square', 0.4)
    s2 = tone(1200, 0.08, 'sine', 0.3)
    n = max(len(s1), len(s2))
    out = [0] * n
    for i, v in enumerate(s1):
        out[i] += v
    for i, v in enumerate(s2):
        out[i] += v * 0.5
    return out

def gen_card_flip():
    """翻牌：柔和上扫"""
    return sweep(400, 1600, 0.15, 0.25)

def gen_counter():
    """克制：清脆叮"""
    s1 = tone(1200, 0.15, 'sine', 0.35)
    s2 = tone(1800, 0.1, 'sine', 0.2)
    n = max(len(s1), len(s2))
    out = [0] * n
    for i, v in enumerate(s1):
        out[i] += v
    for i, v in enumerate(s2):
        out[i] += v * 0.6
    return out

def gen_mindread():
    """读心：神秘上升"""
    return sweep(600, 2000, 0.3, 0.2)

def gen_trap():
    """陷阱：低沉警告"""
    samples = []
    for i in range(int(SAMPLE_RATE * 0.4)):
        t = i / SAMPLE_RATE
        v = math.sin(2 * math.pi * 220 * t) * math.exp(-t * 3)
        v += math.sin(2 * math.pi * 330 * t) * math.exp(-t * 3) * 0.5
        samples.append(v * 0.4)
    return samples

# BGM generators (simple loops)

def gen_bgm_menu():
    """菜单：轻松节奏"""
    samples = []
    beat_len = int(SAMPLE_RATE * 0.5)
    notes = [262, 330, 392, 330, 262, 196, 220, 262]
    for _ in range(4):
        for note in notes:
            for i in range(beat_len):
                t = i / SAMPLE_RATE
                v = math.sin(2 * math.pi * note * t) * 0.15
                fade_in = min(1, i / (SAMPLE_RATE * 0.05))
                fade_out = min(1, (beat_len - i) / (SAMPLE_RATE * 0.05))
                samples.append(v * fade_in * fade_out)
    return samples

def gen_bgm_battle():
    """战斗：节奏感"""
    samples = []
    beat = int(SAMPLE_RATE * 0.25)
    bass_notes = [110, 110, 147, 110, 131, 131, 165, 110]
    for _ in range(4):
        for note in bass_notes:
            for i in range(beat):
                t = i / SAMPLE_RATE
                v = math.sin(2 * math.pi * note * t) * 0.2
                v += math.sin(2 * math.pi * note * 2 * t) * 0.05
                fade_in = min(1, i / (SAMPLE_RATE * 0.02))
                fade_out = min(1, (beat - i) / (SAMPLE_RATE * 0.05))
                samples.append(v * fade_in * fade_out)
    return samples

def gen_bgm_boss():
    """Boss：紧张低沉"""
    samples = []
    beat = int(SAMPLE_RATE * 0.3)
    notes = [82, 82, 110, 82, 98, 98, 110, 82]
    for _ in range(4):
        for note in notes:
            for i in range(beat):
                t = i / SAMPLE_RATE
                v = math.sin(2 * math.pi * note * t) * 0.25
                v += math.sin(2 * math.pi * (note + 3) * t) * 0.1
                fade_in = min(1, i / (SAMPLE_RATE * 0.03))
                fade_out = min(1, (beat - i) / (SAMPLE_RATE * 0.08))
                samples.append(v * fade_in * fade_out)
    return samples

def main():
    ensure_dirs()

    sfx_gens = {
        'card_play': gen_card_play,
        'card_flip': gen_card_flip,
        'hit': gen_hit,
        'counter': gen_counter,
        'mindread': gen_mindread,
        'trap': gen_trap,
        'victory': gen_victory,
        'defeat': gen_defeat,
        'button': gen_button,
        'combo': gen_combo,
        'pressure': gen_pressure,
        'rule_change': gen_rule_change,
        'phase_shift': gen_phase_shift,
    }

    bgm_gens = {
        'menu': gen_bgm_menu,
        'battle': gen_bgm_battle,
        'boss': gen_bgm_boss,
    }

    print("Generating SFX...")
    for name, gen in sfx_gens.items():
        path = os.path.join(OUT_SFX, name + '.wav')
        samples = gen()
        write_wav(path, samples)
        print("  OK " + name + ".wav")

    print("Generating BGM...")
    for name, gen in bgm_gens.items():
        path = os.path.join(OUT_BGM, name + '.wav')
        samples = gen()
        write_wav(path, samples, amp=0.5)
        print("  OK " + name + ".wav")

    print("Done!")

if __name__ == '__main__':
    main()
