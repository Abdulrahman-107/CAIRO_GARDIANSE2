// ============================================================
// sound.js — Procedural Web Audio SFX (no audio files needed)
// All sounds generated via oscillators + noise
// ============================================================

let ctx = null;
let masterGain = null;
let muted = false;

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.value = 0.4;
    masterGain.connect(ctx.destination);
  }
  // Resume if suspended (browser autoplay policy)
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function toggleMute() {
  muted = !muted;
  if (masterGain) masterGain.gain.value = muted ? 0 : 0.4;
  return muted;
}
export function isMuted() { return muted; }

// ---- LOW-LEVEL HELPERS ----
function osc(type, freq, start, dur, gainVal = 0.3, destNode = null) {
  const c = getCtx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(gainVal, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);
  o.connect(g);
  g.connect(destNode || masterGain);
  o.start(start);
  o.stop(start + dur);
  return { o, g };
}

function sweep(type, freqStart, freqEnd, start, dur, gainVal = 0.3) {
  const c = getCtx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freqStart, start);
  o.frequency.exponentialRampToValueAtTime(freqEnd, start + dur);
  g.gain.setValueAtTime(gainVal, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);
  o.connect(g);
  g.connect(masterGain);
  o.start(start);
  o.stop(start + dur);
}

function noise(start, dur, gainVal = 0.2, hiCut = 4000) {
  const c = getCtx();
  const bufSize = c.sampleRate * dur;
  const buf = c.createBuffer(1, bufSize, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const filt = c.createBiquadFilter();
  filt.type = 'lowpass';
  filt.frequency.value = hiCut;
  const g = c.createGain();
  g.gain.setValueAtTime(gainVal, start);
  g.gain.exponentialRampToValueAtTime(0.001, start + dur);
  src.connect(filt); filt.connect(g); g.connect(masterGain);
  src.start(start); src.stop(start + dur);
}

// ---- SFX ----

export function sfxPunch(comboHit = 1) {
  if (muted) return;
  const c = getCtx(), t = c.currentTime;
  const pitches = [180, 220, 260];
  const freq = pitches[Math.min(comboHit - 1, 2)];
  noise(t, 0.06, 0.25, 3000 + comboHit * 1000);
  sweep('square', freq * 2, freq, t, 0.07, 0.15);
}

export function sfxSpecial() {
  if (muted) return;
  const c = getCtx(), t = c.currentTime;
  sweep('sawtooth', 80, 400, t, 0.12, 0.2);
  sweep('sine', 600, 1200, t + 0.05, 0.2, 0.15);
  noise(t, 0.15, 0.15, 5000);
}

export function sfxUltimate() {
  if (muted) return;
  const c = getCtx(), t = c.currentTime;
  // Big boom + rising chord
  noise(t, 0.4, 0.35, 800);
  sweep('sawtooth', 60, 200, t, 0.3, 0.3);
  osc('sine', 440, t + 0.1, 0.5, 0.2);
  osc('sine', 550, t + 0.15, 0.45, 0.15);
  osc('sine', 660, t + 0.2, 0.4, 0.12);
}

export function sfxEnemyHit() {
  if (muted) return;
  const c = getCtx(), t = c.currentTime;
  noise(t, 0.05, 0.12, 2000);
  sweep('square', 300, 150, t, 0.06, 0.08);
}

export function sfxEnemyDeath() {
  if (muted) return;
  const c = getCtx(), t = c.currentTime;
  noise(t, 0.15, 0.2, 1500);
  sweep('sawtooth', 200, 60, t, 0.2, 0.15);
}

export function sfxHeroDamage() {
  if (muted) return;
  const c = getCtx(), t = c.currentTime;
  noise(t, 0.12, 0.3, 1200);
  osc('sawtooth', 120, t, 0.12, 0.2);
}

export function sfxJump() {
  if (muted) return;
  const c = getCtx(), t = c.currentTime;
  sweep('sine', 220, 440, t, 0.12, 0.15);
}

export function sfxLand() {
  if (muted) return;
  const c = getCtx(), t = c.currentTime;
  noise(t, 0.08, 0.18, 800);
}

export function sfxProjectile() {
  if (muted) return;
  const c = getCtx(), t = c.currentTime;
  sweep('sawtooth', 800, 200, t, 0.15, 0.08);
}

export function sfxWaveClear() {
  if (muted) return;
  const c = getCtx(), t = c.currentTime;
  // Ascending fanfare
  [[261, 0], [329, 0.1], [392, 0.2], [523, 0.32]].forEach(([f, dt]) => {
    osc('sine', f, t + dt, 0.35, 0.25);
    osc('triangle', f * 2, t + dt, 0.3, 0.08);
  });
}

export function sfxBossAppear() {
  if (muted) return;
  const c = getCtx(), t = c.currentTime;
  noise(t, 0.6, 0.4, 600);
  sweep('sawtooth', 55, 110, t, 0.5, 0.35);
  sweep('sawtooth', 55, 110, t + 0.03, 0.5, 0.3);
  osc('sine', 220, t + 0.3, 0.5, 0.2);
}

export function sfxVictory() {
  if (muted) return;
  const c = getCtx(), t = c.currentTime;
  const melody = [523, 659, 784, 1047, 784, 1047];
  melody.forEach((f, i) => {
    osc('sine', f, t + i * 0.15, 0.3, 0.25);
    osc('triangle', f, t + i * 0.15, 0.28, 0.08);
  });
}

export function sfxGameOver() {
  if (muted) return;
  const c = getCtx(), t = c.currentTime;
  sweep('sawtooth', 220, 55, t, 0.8, 0.3);
  osc('sine', 110, t + 0.4, 0.6, 0.2);
}

export function sfxBossHit() {
  if (muted) return;
  const c = getCtx(), t = c.currentTime;
  noise(t, 0.1, 0.25, 2500);
  sweep('square', 400, 200, t, 0.12, 0.15);
}

export function sfxLaser() {
  if (muted) return;
  const c = getCtx(), t = c.currentTime;
  sweep('sawtooth', 1200, 400, t, 0.5, 0.2);
  sweep('sine', 600, 200, t, 0.5, 0.15);
  noise(t, 0.5, 0.1, 6000);
}

export function sfxComboMilestone(count) {
  if (muted) return;
  const c = getCtx(), t = c.currentTime;
  const freq = 440 + count * 40;
  osc('sine', freq, t, 0.12, 0.2);
  osc('sine', freq * 1.5, t + 0.05, 0.1, 0.12);
}

export function sfxHighScore() {
  if (muted) return;
  const c = getCtx(), t = c.currentTime;
  [523, 659, 784, 1047, 1319].forEach((f, i) => {
    osc('sine', f, t + i * 0.1, 0.25, 0.2);
  });
}
