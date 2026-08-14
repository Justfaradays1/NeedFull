// WHAT: Generates ALL Studio audio assets procedurally as WAV files.
// WHY:  The Studio must be fully self-contained — no licensed/copyrighted
//       audio. Every sound is synthesized from oscillators + envelopes so the
//       output is reproducible and legal to ship in marketing videos.
// RUN:  node scripts/generate-audio.mjs
// OUT:  public/audio/*.wav

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "audio");
mkdirSync(root, { recursive: true });

const SR = 44100;

function writeWav(name, samples, channels = 1) {
  const n = samples.length;
  const bytesPerSample = 2;
  const dataSize = n * channels * bytesPerSample;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(channels, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * channels * bytesPerSample, 28);
  buf.writeUInt16LE(channels * bytesPerSample, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(dataSize, 40);
  let off = 44;
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(v * 32767), off);
    off += 2;
  }
  writeFileSync(join(root, name), buf);
  console.log(`  ✓ ${name} (${(n / SR / channels).toFixed(2)}s)`);
}

// WHAT: Helper — render a mono sound from per-sample callback
function synth(duration, fn) {
  const n = Math.floor(duration * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = fn(i / SR, i);
  return out;
}

// WHAT: Exponential-decay envelope
const expDecay = (t, t0, tau) => (t < t0 ? 0 : Math.exp(-(t - t0) / tau));

// WHAT: Simple one-pole low-pass filter applied in place (softness)
function lowpass(samples, cutoff = 1200) {
  const rc = 1 / (2 * Math.PI * cutoff);
  const dt = 1 / SR;
  const alpha = dt / (rc + dt);
  const out = new Float32Array(samples.length);
  let prev = 0;
  for (let i = 0; i < samples.length; i++) {
    prev = prev + alpha * (samples[i] - prev);
    out[i] = prev;
  }
  return out;
}

// WHAT: A bell-ish tone: sine + soft harmonics, exponential decay
function bell(freq, t, t0, tau, level = 1) {
  const d = expDecay(t, t0, tau);
  if (d === 0) return 0;
  return (
    d *
    (Math.sin(2 * Math.PI * freq * (t - t0)) * level +
      Math.sin(2 * Math.PI * freq * 2 * (t - t0)) * level * 0.35 +
      Math.sin(2 * Math.PI * freq * 3 * (t - t0)) * level * 0.12)
  );
}

// ─── SFX ────────────────────────────────────────────────────────────────

// click: soft UI click — quick falling sine + faint noise tick
writeWav(
  "click.wav",
  synth(0.07, (t) => {
    const a = expDecay(t, 0, 0.018);
    const s = Math.sin(2 * Math.PI * (960 - 460 * Math.min(1, t / 0.05)) * t);
    const noise = (Math.random() * 2 - 1) * expDecay(t, 0.001, 0.006);
    return (a * 0.5 * s + 0.12 * noise) * 0.8;
  }),
);

// tap: deeper press sound — thump body + falling tone
writeWav(
  "tap.wav",
  synth(0.1, (t) => {
    const a = expDecay(t, 0, 0.03);
    const thump = Math.sin(2 * Math.PI * 170 * t) * expDecay(t, 0, 0.045) * 0.6;
    const tone = Math.sin(2 * Math.PI * 620 * t) * a * 0.4;
    return (thump + tone) * 0.7;
  }),
);

// hover: ultra-soft tick for hover interactions
writeWav(
  "hover.wav",
  synth(0.04, (t) => Math.sin(2 * Math.PI * 2350 * t) * expDecay(t, 0, 0.008) * 0.14),
);

// notification: two-tone ding (jingle)
writeWav(
  "notification.wav",
  synth(0.6, (t) => bell(880, t, 0, 0.16, 0.7) + bell(1174.66, t, 0.13, 0.18, 0.7)),
);

// success: bright ascending chime C5-E5-G5-C6
writeWav(
  "success.wav",
  synth(0.9, (t) => {
    const notes = [
      [523.25, 0, 0.22],
      [659.25, 0.09, 0.22],
      [783.99, 0.18, 0.22],
      [1046.5, 0.27, 0.34],
    ];
    let s = 0;
    for (const [f, t0, tau] of notes) s += bell(f, t, t0, tau, 0.75);
    // sparkle octave
    s += bell(2093, t, 0.27, 0.2, 0.25);
    return s;
  }),
);

// coin: wallet credit — quick double 'tick-tick'
writeWav(
  "coin.wav",
  synth(0.3, (t) => {
    const t1 = Math.sin(2 * Math.PI * 2260 * t) * expDecay(t, 0, 0.05) * 0.6;
    const t2 = Math.sin(2 * Math.PI * 2840 * t) * expDecay(t, 0.09, 0.06) * 0.6;
    return t1 + t2;
  }),
);

// whoosh: soft transition sweep — filtered noise swell
writeWav(
  "whoosh.wav",
  lowpass(
    synth(0.4, (t) => {
      const env =
        Math.min(1, t / 0.09) * Math.exp(-Math.max(0, t - 0.09) / 0.14);
      const noise = Math.random() * 2 - 1;
      return noise * env;
    }),
    900,
  ),
);

// typing: delicate two-phase tick (message send + reply)
writeWav(
  "typing.wav",
  synth(0.12, (t) => {
    const t1 = Math.sin(2 * Math.PI * 1420 * t) * expDecay(t, 0, 0.03) * 0.4;
    const t2 = Math.sin(2 * Math.PI * 1700 * t) * expDecay(t, 0.05, 0.03) * 0.4;
    return t1 + t2;
  }),
);

// confetti: tiny pop-click cloud (layered short noise ticks)
writeWav(
  "confetti.wav",
  synth(0.25, (t) => {
    let s = 0;
    for (let k = 0; k < 14; k++) {
      const t0 = k * 0.012;
      s += (Math.random() * 2 - 1) * expDecay(t, t0, 0.008) * 0.35;
    }
    return lowpass(new Float32Array([s]), 2400)[0];
  }),
);

// ─── AMBIENT MUSIC ──────────────────────────────────────────────────────
// A subtle, generative ambient pad: I–V–vi–IV (C – G – Am – F) sustained
// chords with slow attack/release, gentle detune for stereo width, and a
// quiet bass root. Deliberately understated — music supports, never fights,
// the story. Baked at low gain.

const CHORDS = [
  // [root, [intervals in semitones]]
  [48, [0, 4, 7, 12]], // C  – C3 E3 G3 C4
  [43, [0, 4, 7, 12]], // G  – G2 B2 D3 G3
  [45, [0, 3, 7, 12]], // Am – A2 C3 E3 A3
  [41, [0, 4, 7, 12]], // F  – F2 A2 C3 F3
];

const CHORD_SEC = 12;
const AMBIENT_SEC = CHORD_SEC * CHORDS.length; // 48s loop
const midiToFreq = (m) => 440 * Math.pow(2, (m - 69) / 12);

function padNote(freq, t, t0, dur) {
  // slow attack ~2.5s, release ~3s overlapping the next chord
  const attack = Math.min(1, (t - t0) / 2.5);
  const release = Math.min(1, (t0 + dur - t) / 3);
  const env = Math.max(0, Math.min(attack, release));
  if (env <= 0) return 0;
  // detuned pair per channel handled by caller; here: sine + soft 2nd harmonic
  const s = Math.sin(2 * Math.PI * freq * (t - t0)) + 0.25 * Math.sin(2 * Math.PI * freq * 2 * (t - t0));
  // slow tremolo for movement
  const trem = 0.85 + 0.15 * Math.sin(2 * Math.PI * 0.15 * (t - t0));
  return s * env * trem;
}

const L = new Float32Array(AMBIENT_SEC * SR);
const R = new Float32Array(AMBIENT_SEC * SR);

for (let c = 0; c < CHORDS.length; c++) {
  const [root, intervals] = CHORDS[c];
  const t0 = c * CHORD_SEC;
  for (const iv of intervals) {
    const f = midiToFreq(root + iv);
    const detune = iv === 0 ? 0 : (iv % 2 === 0 ? 1.5 : -1.5); // cents
    for (let i = 0; i < CHORD_SEC * SR; i++) {
      const t = i / SR;
      const left = padNote(f * Math.pow(2, detune / 1200), t, 0, CHORD_SEC);
      const right = padNote(f * Math.pow(2, -detune / 1200), t, 0, CHORD_SEC);
      L[Math.floor(t0 * SR) + i] += left * 0.14;
      R[Math.floor(t0 * SR) + i] += right * 0.14;
    }
  }
  // bass root one octave lower, centered
  const fb = midiToFreq(root - 12);
  for (let i = 0; i < CHORD_SEC * SR; i++) {
    const t = i / SR;
    const b = Math.sin(2 * Math.PI * fb * t) * Math.max(0, Math.min((t) / 3, (CHORD_SEC - t) / 3.5)) * 0.09;
    L[Math.floor(t0 * SR) + i] += b;
    R[Math.floor(t0 * SR) + i] += b;
  }
}

// gentle master fade in/out at loop edges
for (let i = 0; i < SR * 1.5; i++) {
  L[i] *= i / (SR * 1.5);
  R[i] *= i / (SR * 1.5);
  L[L.length - 1 - i] *= i / (SR * 1.5);
  R[R.length - 1 - i] *= i / (SR * 1.5);
}

// WHAT: interleave stereo
const ambient = new Float32Array(L.length * 2);
for (let i = 0; i < L.length; i++) {
  ambient[i * 2] = L[i];
  ambient[i * 2 + 1] = R[i];
}
writeWav("ambient.wav", ambient, 2);

console.log("\nAudio assets generated → public/audio/");