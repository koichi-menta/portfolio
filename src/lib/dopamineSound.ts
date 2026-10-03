// ドーパミンモードの効果音。音源ファイルを持たず Web Audio API で合成する。
// ブラウザは操作なしの音声再生を止めるので、AudioContext はクリック時に unlock() で作る。

let context: AudioContext | null = null;
let master: GainNode | null = null;

const MASTER_VOLUME = 0.35;

export const unlock = (): void => {
  if (typeof window === "undefined") return;
  if (!context) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;
    context = new AudioContextClass();
    master = context.createGain();
    master.gain.value = MASTER_VOLUME;
    master.connect(context.destination);
  }
  if (context.state === "suspended") context.resume();
};

const getNodes = (): { ctx: AudioContext; out: GainNode } | null =>
  context && master && context.state === "running"
    ? { ctx: context, out: master }
    : null;

const noiseBuffer = (ctx: AudioContext, seconds: number): AudioBuffer => {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
};

// 低音が「ズン」と沈むキック
export const playKick = (): void => {
  const nodes = getNodes();
  if (!nodes) return;
  const { ctx, out } = nodes;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.setValueAtTime(150, now);
  osc.frequency.exponentialRampToValueAtTime(45, now + 0.25);
  gain.gain.setValueAtTime(1, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
  osc.connect(gain).connect(out);
  osc.start(now);
  osc.stop(now + 0.3);
};

// 裏拍のハイハット
export const playHat = (): void => {
  const nodes = getNodes();
  if (!nodes) return;
  const { ctx, out } = nodes;
  const now = ctx.currentTime;
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer(ctx, 0.05);
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 7000;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
  source.connect(filter).connect(gain).connect(out);
  source.start(now);
};

// 発動の瞬間: 吸い込むようなノイズの後に、きらきらしたアルペジオ
export const playBurst = (): void => {
  const nodes = getNodes();
  if (!nodes) return;
  const { ctx, out } = nodes;
  const now = ctx.currentTime;

  const whoosh = ctx.createBufferSource();
  whoosh.buffer = noiseBuffer(ctx, 0.6);
  const sweep = ctx.createBiquadFilter();
  sweep.type = "bandpass";
  sweep.frequency.setValueAtTime(300, now);
  sweep.frequency.exponentialRampToValueAtTime(6000, now + 0.5);
  const whooshGain = ctx.createGain();
  whooshGain.gain.setValueAtTime(0.001, now);
  whooshGain.gain.exponentialRampToValueAtTime(0.6, now + 0.4);
  whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
  whoosh.connect(sweep).connect(whooshGain).connect(out);
  whoosh.start(now);

  // C メジャーを駆け上がる
  [523.25, 659.25, 783.99, 1046.5, 1318.5, 1568].forEach((freq, i) => {
    const start = now + 0.35 + i * 0.06;
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.exponentialRampToValueAtTime(0.3, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
    osc.connect(gain).connect(out);
    osc.start(start);
    osc.stop(start + 0.5);
  });
};

// ガチャの溜め: うなりながら音程が上がっていく
export const playCharge = (seconds: number): void => {
  const nodes = getNodes();
  if (!nodes) return;
  const { ctx, out } = nodes;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(110, now);
  osc.frequency.exponentialRampToValueAtTime(880, now + seconds);
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(400, now);
  filter.frequency.exponentialRampToValueAtTime(5000, now + seconds);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(0.25, now + seconds * 0.9);
  gain.gain.exponentialRampToValueAtTime(0.001, now + seconds);
  osc.connect(filter).connect(gain).connect(out);
  osc.start(now);
  osc.stop(now + seconds);
};

// 1枚登場するたびの「ドン！キラーン」
export const playReveal = (): void => {
  const nodes = getNodes();
  if (!nodes) return;
  const { ctx, out } = nodes;
  const now = ctx.currentTime;
  playKick();

  const shimmer = ctx.createBufferSource();
  shimmer.buffer = noiseBuffer(ctx, 0.4);
  const filter = ctx.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = 6000;
  const shimmerGain = ctx.createGain();
  shimmerGain.gain.setValueAtTime(0.3, now);
  shimmerGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
  shimmer.connect(filter).connect(shimmerGain).connect(out);
  shimmer.start(now);

  [1046.5, 1318.5, 1568, 2093].forEach((freq) => {
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc.connect(gain).connect(out);
    osc.start(now);
    osc.stop(now + 0.6);
  });
};

// 「質問きてた！」が飛び出すときのポップ音
export const playPop = (): void => {
  const nodes = getNodes();
  if (!nodes) return;
  const { ctx, out } = nodes;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(400, now);
  osc.frequency.exponentialRampToValueAtTime(1200, now + 0.08);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.4, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
  osc.connect(gain).connect(out);
  osc.start(now);
  osc.stop(now + 0.15);
};

// 文字送りの小さな「ピッ」
export const playTick = (): void => {
  const nodes = getNodes();
  if (!nodes) return;
  const { ctx, out } = nodes;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = "square";
  osc.frequency.value = 1800 + Math.random() * 400;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.04, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
  osc.connect(gain).connect(out);
  osc.start(now);
  osc.stop(now + 0.03);
};
