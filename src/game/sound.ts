/** Web Audio 程式合成音效（零音檔）。模組層級單例，由遊戲事件呼叫。 */

let ctx: AudioContext | undefined;
let master: GainNode | undefined;
let muted = false;

function ensure(): AudioContext | undefined {
  if (typeof window === 'undefined' || !window.AudioContext) return undefined;
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.35;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

interface ToneOpts {
  freq: number;
  freqTo?: number;
  type?: OscillatorType;
  dur: number;
  gain?: number;
  delay?: number;
}

function tone(o: ToneOpts) {
  const c = ensure();
  if (!c || !master || muted) return;
  const t = c.currentTime + (o.delay ?? 0);
  const osc = c.createOscillator();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(o.freq, t);
  if (o.freqTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.freqTo), t + o.dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(o.gain ?? 0.25, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dur);
  osc.connect(g);
  g.connect(master);
  osc.start(t);
  osc.stop(t + o.dur + 0.02);
}

function noise(dur: number, gain: number, type: BiquadFilterType, freq: number) {
  const c = ensure();
  if (!c || !master || muted) return;
  const t = c.currentTime;
  const len = Math.floor(c.sampleRate * dur);
  const buffer = c.createBuffer(1, len, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter);
  filter.connect(g);
  g.connect(master);
  src.start(t);
  src.stop(t + dur);
}

/** ===== 背景音樂（程序合成，三首可切換） ===== */
let musicGain: GainNode | undefined;
let musicTimer: ReturnType<typeof setTimeout> | undefined;
let nextBarTime = 0;
let bar = 0;
/** 預設曲目：星光散步（隨擊敗王數自動切換） */
let currentTrack = 0;

function musicNote(freq: number, type: OscillatorType, t: number, dur: number, gain: number, filterFreq?: number) {
  const c = ensure();
  if (!c || !musicGain) return;
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(gain, t + dur * 0.25);
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  if (filterFreq) {
    const f = c.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = filterFreq;
    osc.connect(f);
    f.connect(g);
  } else {
    osc.connect(g);
  }
  g.connect(musicGain);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function musicBell(freq: number, t: number, dur = 0.28, gain = 0.055) {
  musicNote(freq, 'sine', t, dur, gain, 5600);
  musicNote(freq * 2, 'triangle', t + 0.01, dur * 0.55, gain * 0.28, 6400);
}

function musicPluck(freq: number, t: number, dur = 0.18, gain = 0.07) {
  musicNote(freq, 'triangle', t, dur, gain, 1800);
}

function musicChord(notes: readonly number[], t: number, dur: number, gain = 0.032) {
  notes.forEach((note, index) => musicNote(note, 'triangle', t + index * 0.015, dur, gain, 2400));
}

interface Track {
  name: string;
  barDur: number;
  build: (t: number, bar: number) => void;
}

/** 第一首「星糖散步」：亮晶晶鈴鐺與木琴感，適合開局探索 */
function trackStarlight(t: number, bar: number) {
  const chords = [
    [261.63, 329.63, 392],
    [196, 246.94, 293.66],
    [220, 261.63, 329.63],
    [174.61, 220, 261.63],
  ];
  const melody = [
    [523.25, 659.25, 783.99, 659.25],
    [493.88, 587.33, 659.25, 587.33],
    [440, 523.25, 659.25, 783.99],
    [392, 523.25, 587.33, 523.25],
  ];
  const chord = chords[bar % chords.length];
  const line = melody[bar % melody.length];
  const B = 0.42;
  musicChord(chord, t, 1.65, 0.028);
  for (let i = 0; i < 4; i++) {
    musicPluck(chord[0] / 2, t + i * B, 0.16, 0.055);
    musicBell(line[i], t + i * B, 0.24, 0.052);
  }
}

/** 第二首「糖果跳跳」：速度提高，但像跳格子一樣可愛 */
function trackCandyChase(t: number, bar: number) {
  const bass = [196, 220, 261.63, 246.94][bar % 4];
  const notes = [
    [587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 659.25, 783.99],
    [659.25, 783.99, 880, 783.99, 659.25, 587.33, 659.25, 880],
    [523.25, 659.25, 783.99, 987.77, 783.99, 659.25, 587.33, 659.25],
    [493.88, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 659.25],
  ][bar % 4];
  const S = 0.145;
  musicChord([bass, bass * 1.25, bass * 1.5], t, 1.15, 0.023);
  for (let s = 0; s < notes.length; s++) {
    if (s % 2 === 0) musicPluck(bass / 2, t + s * S, 0.1, 0.055);
    musicBell(notes[s], t + s * S, 0.12, 0.045);
  }
}

/** 「彩虹泡泡」：後段高能量，但用上行泡泡音維持輕快 */
function trackRainbowRush(t: number, bar: number) {
  const bass = [220, 196, 261.63, 293.66][bar % 4];
  const sparkle = [659.25, 783.99, 880, 987.77, 880, 783.99, 659.25, 587.33];
  const S = 0.095;
  musicChord([bass, bass * 1.5, bass * 2], t, 1.45, 0.022);
  for (let s = 0; s < 16; s++) {
    if (s % 4 === 0) musicPluck(bass / 2, t + s * S, 0.08, 0.052);
    musicBell(sparkle[(s + bar) % sparkle.length], t + s * S, 0.09, 0.038);
  }
}

/** 「棉花糖遊行」：王戰仍有節奏，但改成可愛遊行感 */
function trackMoonParade(t: number, bar: number) {
  const bass = [174.61, 196, 220, 196][bar % 4];
  const parade = [
    [523.25, 659.25, 587.33, 783.99],
    [493.88, 587.33, 659.25, 587.33],
    [440, 523.25, 659.25, 523.25],
    [392, 493.88, 587.33, 659.25],
  ][bar % 4];
  const B = 0.36;
  musicChord([bass, bass * 1.5, bass * 2], t, 1.4, 0.026);
  for (let i = 0; i < 4; i++) {
    musicPluck(bass, t + i * B, 0.12, i % 2 === 0 ? 0.075 : 0.045);
    musicBell(parade[i], t + i * B + 0.045, 0.2, 0.05);
  }
  if (bar % 2 === 1) musicBell(1046.5, t + 1.18, 0.28, 0.04);
}

const TRACKS: Track[] = [
  { name: '星糖散步', barDur: 1.68, build: trackStarlight },
  { name: '糖果跳跳', barDur: 1.16, build: trackCandyChase },
  { name: '彩虹泡泡', barDur: 1.52, build: trackRainbowRush },
  { name: '棉花糖遊行', barDur: 1.44, build: trackMoonParade },
];

function scheduler() {
  const c = ensure();
  if (!c) return;
  const track = TRACKS[currentTrack];
  while (nextBarTime < c.currentTime + 0.3) {
    if (!muted) track.build(nextBarTime, bar);
    nextBarTime += track.barDur;
    bar++;
  }
  musicTimer = setTimeout(scheduler, 120);
}

export const sound = {
  setMuted(v: boolean) {
    muted = v;
  },
  /** 解鎖音訊（於使用者互動時呼叫） */
  enable() {
    ensure();
  },
  /** 開始背景音樂迴圈 */
  startMusic() {
    const c = ensure();
    if (!c || musicTimer) return;
    if (!musicGain) {
      musicGain = c.createGain();
      musicGain.gain.value = 0.62;
      if (master) musicGain.connect(master);
    }
    bar = 0;
    nextBarTime = c.currentTime + 0.1;
    scheduler();
  },
  /** 停止背景音樂 */
  stopMusic() {
    if (musicTimer) {
      clearTimeout(musicTimer);
      musicTimer = undefined;
    }
  },
  /** 可選曲目名稱 */
  musicTrackNames: TRACKS.map((t) => t.name),
  /** 切換曲目（下一小節生效） */
  setMusicTrack(i: number) {
    if (i >= 0 && i < TRACKS.length) currentTrack = i;
  },
  uiTap() {
    tone({ freq: 660, freqTo: 880, type: 'sine', dur: 0.06, gain: 0.08 });
  },
  quizCorrect() {
    [659, 880, 1318].forEach((f, i) => tone({ freq: f, type: 'sine', dur: 0.14, gain: 0.16, delay: i * 0.07 }));
  },
  quizWrong() {
    tone({ freq: 392, freqTo: 330, type: 'triangle', dur: 0.18, gain: 0.12 });
    tone({ freq: 330, freqTo: 294, type: 'sine', dur: 0.18, gain: 0.08, delay: 0.08 });
  },
  treasure() {
    [784, 988, 1175, 1568].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.16, gain: 0.18, delay: i * 0.055 }));
    noise(0.18, 0.045, 'highpass', 3200);
  },
  /** 開槍 */
  shoot() {
    tone({ freq: 1046, freqTo: 620, type: 'triangle', dur: 0.07, gain: 0.08 });
  },
  /** 命中／擊退小夥伴 */
  hit() {
    tone({ freq: 392, freqTo: 220, type: 'triangle', dur: 0.08, gain: 0.1 });
  },
  /** 升級 */
  levelUp() {
    [523, 659, 784, 1046].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.16, gain: 0.22, delay: i * 0.09 }));
  },
  /** 玩家受擊 */
  hurt() {
    tone({ freq: 300, freqTo: 90, type: 'sawtooth', dur: 0.18, gain: 0.22 });
  },
  /** 王登場：星光提醒音（小喇叭也聽得到） */
  bossSpawn() {
    tone({ freq: 196, freqTo: 262, type: 'triangle', dur: 0.55, gain: 0.2 });
    tone({ freq: 392, freqTo: 523, type: 'sine', dur: 0.45, gain: 0.12, delay: 0.08 });
    tone({ freq: 784, type: 'sine', dur: 0.2, gain: 0.12, delay: 0.02 });
    noise(0.35, 0.08, 'lowpass', 1200);
  },
  /** 王施放招式：泡泡提醒音（彈幕／衝撞／震波） */
  bossSkill() {
    tone({ freq: 740, freqTo: 370, type: 'triangle', dur: 0.22, gain: 0.16 });
    noise(0.16, 0.08, 'bandpass', 1600);
  },
  /** 王被擊敗 */
  bossDown() {
    [523, 659, 784, 1046].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.18, gain: 0.16, delay: i * 0.06 }));
    noise(0.22, 0.07, 'highpass', 2600);
  },
  /** 玩家失敗 */
  playerDeath() {
    tone({ freq: 440, freqTo: 220, type: 'triangle', dur: 0.38, gain: 0.18 });
  },
  /** 開寶箱獲得增益 */
  buff() {
    [659, 880, 1175].forEach((f, i) => tone({ freq: f, type: 'square', dur: 0.12, gain: 0.18, delay: i * 0.07 }));
  },
  /** 回血 */
  heal() {
    tone({ freq: 784, type: 'sine', dur: 0.14, gain: 0.18 });
    tone({ freq: 1046, type: 'sine', dur: 0.16, gain: 0.18, delay: 0.1 });
  },
};
