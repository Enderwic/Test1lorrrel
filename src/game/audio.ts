/* Крошечный WebAudio-синтезатор: никаких файлов, только осцилляторы. */

let ctx: AudioContext | null = null;
let muted = false;

export function initSfx() {
  if (typeof window === "undefined") return;
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === "suspended") void ctx.resume();
  } catch {
    ctx = null;
  }
}

export function setSfxMuted(m: boolean) {
  muted = m;
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType = "square",
  vol = 0.045,
  delay = 0,
  slideTo?: number
) {
  if (muted || !ctx || ctx.state !== "running") return;
  try {
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(30, slideTo), t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.03);
  } catch {
    /* звук — не повод падать */
  }
}

export const sfx = {
  click() {
    tone(680, 0.05, "square", 0.028);
  },
  count(final = false) {
    if (final) tone(880, 0.14, "square", 0.06);
    else tone(440, 0.07, "square", 0.042);
  },
  start() {
    [392, 523, 659].forEach((f, i) => tone(f, 0.09, "square", 0.05, i * 0.07));
  },
  eat() {
    tone(520, 0.08, "square", 0.05);
    tone(784, 0.1, "square", 0.045, 0.055);
  },
  bonus() {
    [660, 880, 1318].forEach((f, i) => tone(f, 0.1, "triangle", 0.06, i * 0.06));
  },
  bonusSpawn() {
    tone(1174, 0.12, "triangle", 0.04);
    tone(1568, 0.14, "triangle", 0.035, 0.08);
  },
  die() {
    tone(300, 0.5, "sawtooth", 0.06, 0, 55);
    tone(160, 0.6, "square", 0.04, 0.06, 40);
  },
  over() {
    [392, 330, 262, 196].forEach((f, i) => tone(f, 0.15, "triangle", 0.05, i * 0.12));
  },
  record() {
    [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.12, "square", 0.05, i * 0.08));
  },
};
