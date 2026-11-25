// All sound is synthesized with WebAudio: short blips, a coin arpeggio, a hot-pan
// sizzle and a sad slide when a customer gives up. No audio files, no network.
// The context is created lazily on the first user gesture; every call is safe
// before that and in the screenshot scenes (which never call these).

let ctx = null;
let master = null;

export function initAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.16;
    master.connect(ctx.destination);
  } catch {
    ctx = null;
  }
}

function tone(freqFrom, freqTo, seconds, type = 'sine', delay = 0, gain = 1) {
  if (!ctx || !master) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freqFrom, t0);
  osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqTo), t0 + seconds);
  amp.gain.setValueAtTime(gain, t0);
  amp.gain.exponentialRampToValueAtTime(0.001, t0 + seconds);
  osc.connect(amp).connect(master);
  osc.start(t0);
  osc.stop(t0 + seconds + 0.02);
}

function noise(seconds, delay = 0, gain = 0.5, freq = 3200) {
  if (!ctx || !master) return;
  const t0 = ctx.currentTime + delay;
  const len = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = freq;
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(gain, t0);
  amp.gain.exponentialRampToValueAtTime(0.001, t0 + seconds);
  src.connect(filter).connect(amp).connect(master);
  src.start(t0);
}

export const sfx = {
  click() { tone(660, 520, 0.06, 'triangle', 0, 0.7); },
  add() { noise(0.16, 0, 0.35, 2600); tone(300, 210, 0.08, 'sine', 0, 0.4); },
  ding() { tone(1318, 1318, 0.22, 'sine', 0, 0.8); tone(1760, 1760, 0.3, 'sine', 0.07, 0.6); },
  smash() { noise(0.12, 0, 0.9, 700); tone(160, 70, 0.14, 'square', 0, 0.5); },
  serve() { tone(784, 784, 0.09, 'triangle', 0, 0.8); tone(988, 988, 0.09, 'triangle', 0.08, 0.8); tone(1319, 1319, 0.16, 'triangle', 0.16, 0.9); },
  trash() { noise(0.2, 0, 0.5, 500); tone(220, 110, 0.16, 'sawtooth', 0, 0.3); },
  sad() { tone(392, 392, 0.16, 'sine', 0, 0.7); tone(330, 262, 0.3, 'sine', 0.14, 0.7); },
  tick() { tone(1050, 1050, 0.04, 'square', 0, 0.25); },
  fanfare() { tone(523, 523, 0.12, 'triangle', 0, 0.8); tone(659, 659, 0.12, 'triangle', 0.12, 0.8); tone(784, 784, 0.12, 'triangle', 0.24, 0.8); tone(1047, 1047, 0.3, 'triangle', 0.36, 0.9); },
};
