import type { ClickStyle, SoundSettings, TrackId } from "./types";

/**
 * Bộ âm thanh tổng hợp bằng Web Audio — không cần file mp3.
 * Nhạc nền là các giai điệu gốc, viết dưới dạng chuỗi nốt.
 * Sau này có thể thêm nhạc tải lên (mp3) qua Settings.
 */

type Track = { name: string; emoji: string; bpm: number; melody: string; bass: string; wave: OscillatorType };

export const TRACKS: Record<Exclude<TrackId, "none">, Track> = {
  sunny: {
    name: "Đảo nắng",
    emoji: "☀️",
    bpm: 116,
    wave: "triangle",
    melody:
      "C5/2 E5/2 G5 E5 C5 | D5/2 F5/2 A5 G5*2 | E5/2 G5/2 C6 B5 A5 | G5*2 E5 - | F5/2 A5/2 C6 A5 F5 | E5/2 G5/2 C6 G5*2 | D5 E5 F5 B4 | C5*3 -",
    bass: "C3*2 G2*2 | F2*2 C3*2 | C3*2 E3*2 | G2*2 G2*2 | F2*2 A2*2 | C3*2 E3*2 | G2*2 G2*2 | C3*2 C3*2",
  },
  breeze: {
    name: "Gió nhẹ",
    emoji: "🍃",
    bpm: 76,
    wave: "sine",
    melody: "A4*2 C5 A4 | G4*2 F4*2 | A4 C5 F5 E5 | D5*3 - | C5*2 D5 C5 | A4*2 G4*2 | F4 G4 A4 G4 | F4*3 -",
    bass: "F2*4 | C3*4 | F2*4 | Bb2*4 | A2*4 | D3*4 | C3*4 | F2*4",
  },
  adventure: {
    name: "Phiêu lưu",
    emoji: "🗺️",
    bpm: 138,
    wave: "square",
    melody:
      "A4/2 C5/2 E5 D5/2 C5/2 A4 | G4/2 A4/2 C5 D5*2 | E5/2 G5/2 A5 G5/2 E5/2 D5 | E5*2 - - | A5/2 G5/2 E5 D5/2 E5/2 G5 | E5/2 D5/2 C5 A4*2 | C5 D5 E5 G5 | A5*3 -",
    bass: "A2 A2 E3 A2 | F2 F2 C3 F2 | C3 C3 G3 C3 | E2 E2 B2 E2 | A2 A2 E3 A2 | F2 F2 C3 F2 | G2 G2 D3 G2 | A2 E3 A2 -",
  },
};

export const CLICK_STYLES: { id: ClickStyle; name: string; emoji: string }[] = [
  { id: "pop", name: "Bóp bụp", emoji: "🫧" },
  { id: "bubble", name: "Bong bóng", emoji: "🎈" },
  { id: "ting", name: "Leng keng", emoji: "🔔" },
  { id: "wood", name: "Gõ gỗ", emoji: "🪵" },
];

const NOTE_IDX: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function noteFreq(n: string): number | null {
  const m = /^([A-G])([#b]?)(\d)$/.exec(n);
  if (!m) return null;
  const midi = 12 * (Number(m[3]) + 1) + NOTE_IDX[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
  return 440 * Math.pow(2, (midi - 69) / 12);
}
const midiFreq = (name: string) => noteFreq(name) ?? 440;

type Ev = { t: number; dur: number; freq: number | null };
function parseSeq(seq: string): { events: Ev[]; beats: number } {
  const events: Ev[] = [];
  let t = 0;
  for (const tok of seq.split(/\s+/).filter((x) => x && x !== "|")) {
    const [note, mod] = tok.split(/(?=[*/])/);
    let dur = 1;
    if (mod?.startsWith("*")) dur = Number(mod.slice(1));
    if (mod?.startsWith("/")) dur = 1 / Number(mod.slice(1));
    events.push({ t, dur, freq: note === "-" ? null : noteFreq(note) });
    t += dur;
  }
  return { events, beats: t };
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private musicBus!: GainNode;
  private sfxBus!: GainNode;
  private settings: SoundSettings | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private playingTrack: TrackId = "none";
  private loopStart = 0;
  private nextIdx = { m: 0, b: 0 };
  private loopCount = { m: 0, b: 0 };
  private parsed: { melody: ReturnType<typeof parseSeq>; bass: ReturnType<typeof parseSeq>; spb: number; wave: OscillatorType } | null = null;

  get unlocked() {
    return !!this.ctx && this.ctx.state === "running";
  }

  /** Gọi trong sự kiện chạm/nhấn đầu tiên (bắt buộc trên iPad) */
  unlock() {
    if (typeof window === "undefined") return;
    if (!this.ctx) {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      this.musicBus = this.ctx.createGain();
      this.sfxBus = this.ctx.createGain();
      this.musicBus.connect(this.master);
      this.sfxBus.connect(this.master);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    if (this.settings) this.apply(this.settings);
  }

  apply(s: SoundSettings) {
    this.settings = s;
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.musicBus.gain.setTargetAtTime(s.music ? s.musicVolume * 0.5 : 0, now, 0.15);
    this.sfxBus.gain.setTargetAtTime(s.sfx ? s.sfxVolume : 0, now, 0.05);
    const want: TrackId = s.music ? s.musicTrack : "none";
    if (want !== this.playingTrack) this.startTrack(want);
  }

  /** Nghe thử một bài (dùng trong Settings) */
  preview(track: TrackId) {
    this.unlock();
    this.startTrack(track);
  }

  private startTrack(id: TrackId) {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.playingTrack = id;
    if (id === "none" || !this.ctx) return;
    const tr = TRACKS[id];
    this.parsed = { melody: parseSeq(tr.melody), bass: parseSeq(tr.bass), spb: 60 / tr.bpm, wave: tr.wave };
    this.loopStart = this.ctx.currentTime + 0.1;
    this.nextIdx = { m: 0, b: 0 };
    this.loopCount = { m: 0, b: 0 };
    this.timer = setInterval(() => this.schedule(), 60);
  }

  private schedule() {
    const ctx = this.ctx;
    const p = this.parsed;
    if (!ctx || !p) return;
    const horizon = ctx.currentTime + 0.25;
    const run = (seq: ReturnType<typeof parseSeq>, key: "m" | "b", play: (t: number, f: number, d: number) => void) => {
      for (;;) {
        const ev = seq.events[this.nextIdx[key]];
        const t = this.loopStart + (this.loopCount[key] * seq.beats + ev.t) * p.spb;
        if (t > horizon) break;
        if (ev.freq && t >= ctx.currentTime - 0.05) play(t, ev.freq, ev.dur * p.spb);
        this.nextIdx[key]++;
        if (this.nextIdx[key] >= seq.events.length) {
          this.nextIdx[key] = 0;
          this.loopCount[key]++;
        }
      }
    };
    run(p.melody, "m", (t, f, d) => this.tone(this.musicBus, f, t, d * 0.9, p.wave, p.wave === "square" ? 0.05 : 0.14));
    run(p.bass, "b", (t, f, d) => this.tone(this.musicBus, f, t, d * 0.8, "sine", 0.2));
  }

  private tone(bus: GainNode, freq: number, t: number, dur: number, type: OscillatorType, vol: number, freqEnd?: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(bus);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  private get t0() {
    return this.ctx ? this.ctx.currentTime + 0.005 : 0;
  }

  click(style?: ClickStyle) {
    if (!this.ctx || !this.settings?.sfx) return;
    const t = this.t0;
    switch (style ?? this.settings.clickStyle) {
      case "pop":
        this.tone(this.sfxBus, 720, t, 0.09, "sine", 0.5, 180);
        break;
      case "bubble":
        this.tone(this.sfxBus, 260, t, 0.12, "sine", 0.45, 980);
        break;
      case "ting":
        this.tone(this.sfxBus, 1568, t, 0.3, "sine", 0.25);
        this.tone(this.sfxBus, 2349, t, 0.22, "sine", 0.12);
        break;
      case "wood":
        this.tone(this.sfxBus, 420, t, 0.06, "triangle", 0.5, 300);
        break;
    }
  }

  whoosh() {
    if (!this.ctx || !this.settings?.sfx) return;
    const ctx = this.ctx;
    const t = this.t0;
    const len = 0.35;
    const buf = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = "bandpass";
    f.frequency.setValueAtTime(400, t);
    f.frequency.exponentialRampToValueAtTime(2400, t + len);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.25, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + len);
    src.connect(f).connect(g).connect(this.sfxBus);
    src.start(t);
  }

  fanfare() {
    if (!this.ctx || !this.settings?.sfx) return;
    const t = this.t0;
    ["C5", "E5", "G5", "C6"].forEach((n, i) => this.tone(this.sfxBus, midiFreq(n), t + i * 0.11, 0.25, "triangle", 0.35));
    ["C5", "E5", "G5", "C6"].forEach((n) => this.tone(this.sfxBus, midiFreq(n), t + 0.5, 0.9, "triangle", 0.18));
    this.sparkle(0.6);
  }

  sparkle(delay = 0) {
    if (!this.ctx || !this.settings?.sfx) return;
    const t = this.t0 + delay;
    for (let i = 0; i < 8; i++) this.tone(this.sfxBus, 1800 + Math.random() * 1800, t + i * 0.06, 0.15, "sine", 0.08);
  }

  wahwah() {
    if (!this.ctx || !this.settings?.sfx) return;
    const t = this.t0;
    ["G4", "F#4", "F4"].forEach((n, i) => this.tone(this.sfxBus, midiFreq(n), t + i * 0.32, 0.3, "triangle", 0.25));
    this.tone(this.sfxBus, midiFreq("E4"), t + 0.96, 0.8, "triangle", 0.25, midiFreq("D4"));
  }

  /** Còi xe "bíp bíp", mỗi xe một tông */
  honk(variant = 0) {
    if (!this.ctx || !this.settings?.sfx) return;
    const t = this.t0;
    const base = [440, 523, 392, 587][variant % 4];
    for (const dt of [0, 0.18]) {
      this.tone(this.sfxBus, base, t + dt, 0.14, "square", 0.12);
      this.tone(this.sfxBus, base * 1.26, t + dt, 0.14, "square", 0.08);
    }
  }

  tada() {
    if (!this.ctx || !this.settings?.sfx) return;
    const t = this.t0;
    this.tone(this.sfxBus, midiFreq("G5"), t, 0.15, "sine", 0.3);
    this.tone(this.sfxBus, midiFreq("G5"), t + 0.18, 0.4, "sine", 0.3);
  }
}

export const sound = new SoundEngine();
