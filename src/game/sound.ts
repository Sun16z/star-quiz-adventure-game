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

export const sound = {
  setMuted(v: boolean) {
    muted = v;
  },
  /** 解鎖音訊（於使用者互動時呼叫） */
  enable() {
    ensure();
  },
  /** 開槍 */
  shoot() {
    tone({ freq: 880, freqTo: 280, type: 'square', dur: 0.08, gain: 0.12 });
    noise(0.05, 0.08, 'highpass', 2000);
  },
  /** 命中／擊殺殭屍 */
  hit() {
    tone({ freq: 200, freqTo: 70, type: 'square', dur: 0.1, gain: 0.16 });
    noise(0.08, 0.12, 'lowpass', 600);
  },
  /** 升級 */
  levelUp() {
    [523, 659, 784, 1046].forEach((f, i) => tone({ freq: f, type: 'triangle', dur: 0.16, gain: 0.22, delay: i * 0.09 }));
  },
  /** 玩家受擊 */
  hurt() {
    tone({ freq: 300, freqTo: 90, type: 'sawtooth', dur: 0.18, gain: 0.22 });
  },
  /** 王被擊敗 */
  bossDown() {
    tone({ freq: 160, freqTo: 40, type: 'sawtooth', dur: 0.6, gain: 0.32 });
    noise(0.5, 0.3, 'lowpass', 800);
  },
  /** 玩家死亡 */
  playerDeath() {
    tone({ freq: 420, freqTo: 60, type: 'sawtooth', dur: 0.7, gain: 0.28 });
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
