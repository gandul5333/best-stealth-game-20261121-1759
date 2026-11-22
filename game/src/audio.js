// audio.js — every sound is synthesized with WebAudio: no audio files,
// no network, just oscillators and filtered noise. Created lazily on the
// first user gesture, so the browser's autoplay rules stay happy.
let ctx = null;
let master = null;

function ensureContext() {
  if (ctx) return ctx;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;
  ctx = new AudioContext();
  master = ctx.createGain();
  master.gain.value = 0.22;
  master.connect(ctx.destination);
  return ctx;
}

// Call from a click/keydown handler before any other sound.
export function unlockAudio() {
  const c = ensureContext();
  if (c && c.state === 'suspended') c.resume();
}

function tone(freq, dur, type, vol, slideTo) {
  const c = ensureContext();
  if (!c) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, c.currentTime + dur);
  gain.gain.setValueAtTime(vol, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
  osc.connect(gain);
  gain.connect(master);
  osc.start();
  osc.stop(c.currentTime + dur);
}

function noiseBurst(dur, filterFreq, vol) {
  const c = ensureContext();
  if (!c) return;
  const len = Math.floor(c.sampleRate * dur);
  const buffer = c.createBuffer(1, len, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  const gain = c.createGain();
  gain.gain.value = vol;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  src.start();
}

// A soft carpet step: quiet when sneaking, a clear tap when running.
export function playStep(sneaking) {
  if (sneaking) noiseBurst(0.06, 500, 0.10);
  else noiseBurst(0.09, 900, 0.28);
}

// The alarm sting: two rising notes when a guard's meter fills.
export function playAlarm() {
  tone(220, 0.16, 'square', 0.30);
  setTimeout(() => tone(330, 0.22, 'square', 0.30), 140);
}

// A caught thud.
export function playCaught() {
  tone(160, 0.35, 'sawtooth', 0.35, 60);
  noiseBurst(0.2, 300, 0.3);
}

// A bright chime when a relic is lifted.
export function playPickup() {
  tone(880, 0.12, 'sine', 0.30);
  setTimeout(() => tone(1318, 0.2, 'sine', 0.28), 90);
}

// The pebble's clatter on the marble floor.
export function playPebble() {
  noiseBurst(0.12, 2400, 0.35);
  setTimeout(() => noiseBurst(0.08, 1800, 0.2), 90);
}

// A short victory arpeggio.
export function playWin() {
  [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.25, 'triangle', 0.30), i * 110));
}
