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

interface Track {
  name: string;
  barDur: number;
  build: (t: number, bar: number) => void;
}

/** 第一首「星光散步」：明亮慢速琶音，適合開局探索 */
function trackStarlight(t: number, bar: number) {
  const roots = [130.81, 164.81, 196, 174.61];
  const root = roots[bar % roots.length];
  const B = 0.5;
  musicNote(root * 2, 'triangle', t, 2, 0.1);
  musicNote(root * 3, 'sine', t, 2, 0.06);
  const mel = [2, 3, 5, 4];
  for (let b = 0; b < 4; b++) {
    musicNote(root, 'triangle', t + b * B, 0.36, 0.12, 1200);
    musicNote(root * mel[b], 'sine', t + b * B, 0.42, 0.08);
  }
}

/** 第二首「糖果追逐」：速度提高，但保留輕快感 */
function trackCandyChase(t: number, bar: number) {
  const roots = [146.83, 146.83, 196, 174.61];
  const root = roots[bar % roots.length];
  const S = 0.15;
  musicNote(root * 2, 'triangle', t, 1.2, 0.06, 1600);
  const mel = [4, 0, 5, 0, 4, 6, 0, 5];
  for (let s = 0; s < 8; s++) {
    musicNote(root, 'triangle', t + s * S, 0.13, 0.1, 900);
    if (mel[s]) musicNote(root * mel[s], 'sine', t + s * S, 0.16, 0.08);
  }
}

/** 「彩虹急行」：後段高能量音型 */
function trackRainbowRush(t: number, bar: number) {
  const roots = [174.61, 146.83, 196, 164.81];
  const root = roots[bar % roots.length];
  const S = 0.1;
  musicNote(root, 'triangle', t, 1.6, 0.06, 1400);
  const mel = [4, 5, 4, 6, 4, 5, 8, 6, 5, 6, 5, 8, 9, 10, 9, 8];
  for (let s = 0; s < 16; s++) {
    if (s % 2 === 0) musicNote(root, 'triangle', t + s * S, 0.09, 0.08, 950);
    musicNote(root * mel[s], 'sine', t + s * S, 0.11, 0.06);
  }
}

/** 「月光鼓隊」：王戰中速節奏，明確但不恐怖 */
function trackMoonParade(t: number, bar: number) {
  const roots = [98, 98, 130.81, 116.54];
  const root = roots[bar % roots.length];
  const B = 0.4;
  const mel = [4, 5, 6, 5];
  for (let b = 0; b < 4; b++) {
    musicNote(root, 'triangle', t + b * B, 0.18, 0.11, 720);
    musicNote(root * mel[b], 'sine', t + b * B, 0.34, 0.08, 1200);
  }
  if (bar % 2 === 1) musicNote(root * 8, 'sine', t + 1.2, 0.45, 0.05);
}

const TRACKS: Track[] = [
  { name: '星光散步', barDur: 2, build: trackStarlight },
  { name: '糖果追逐', barDur: 1.2, build: trackCandyChase },
  { name: '彩虹急行', barDur: 1.6, build: trackRainbowRush },
  { name: '月光鼓隊', barDur: 1.6, build: trackMoonParade },
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
      musicGain.gain.value = 0.7;
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
