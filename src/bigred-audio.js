// bigred-audio.js - v 1.2.0

/* Synthesized sound effects via Web Audio API.
   Sampled buffers are loaded asynchronously from bigred-sounds.js;
   synthesized fallbacks play immediately while they arrive. */

const _b64ToBuffer = (b64) => {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
};

const makeDistortionCurve = (amount) => {
  const n = 512;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((Math.PI + amount) * x) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
};

export class AudioEngine {
  constructor() {
    this.ac = null;
    this.wailBuffer = null;
    this.winBuffer = null;
    this.loseBuffer = null;
    this._activeVoices = 0;
    this._lastImpactTime = 0;
  }

  /* Close the old context and release all scheduled nodes (call before each new game) */
  reset() {
    if (this.ac) {
      this.ac.close();
      this.ac = null;
      this.wailBuffer = null;
      this.winBuffer = null;
      this.loseBuffer = null;
      this._activeVoices = 0;
      this._lastImpactTime = 0;
    }
  }

  /* Call once from a user-gesture handler (Start button) to unlock AudioContext.
     Pass useSampled=1 to load base64 samples from bigred-sounds.js; 0 for synth-only. */
  init(useSampled = 1) {
    this.ac = new (window.AudioContext || window.webkitAudioContext)();
    if (useSampled) this._loadSamples();
  }

  _loadSamples() {
    import("./bigred-sounds.js")
      .then(({ WAIL_B64, WIN_B64, LOSE_B64 }) => {
        const decode = (b64, key) =>
          this.ac
            .decodeAudioData(_b64ToBuffer(b64))
            .then((buf) => {
              this[key] = buf;
            })
            .catch((e) => console.warn(`[audio] failed to decode ${key}:`, e));
        decode(WAIL_B64, "wailBuffer");
        decode(WIN_B64, "winBuffer");
        decode(LOSE_B64, "loseBuffer");
      })
      .catch((e) =>
        console.warn("[audio] failed to load bigred-sounds.js:", e),
      );
  }

  /* Resume a suspended context, then invoke fn(ac) with a snapshotted reference.
     Snapshotting ac here prevents a concurrent reset() from causing node
     creation on an already-closed context. */
  _resume(fn) {
    if (!this.ac) return;
    const ac = this.ac;
    if (ac.state === "suspended") {
      ac.resume().then(() => {
        if (ac === this.ac) fn(ac);
      });
    } else {
      fn(ac);
    }
  }

  /* Voice-limited wrapper — all playback routes through here.
     Increments _activeVoices before the async resume; the caller
     supplies a release() callback to decrement when the sound ends.
     Using onended (where available) is more accurate than setTimeout,
     but setTimeout is kept as a fallback for nodes without onended. */
  _tryPlay(fn, fallbackDurationMs = 500) {
    if (!this.ac) return;
    if (this._activeVoices >= 6) return;
    this._activeVoices++;

    const release = () => {
      this._activeVoices = Math.max(0, this._activeVoices - 1);
    };

    this._resume((ac) => {
      fn(ac, release);
      // Fallback: release the voice slot even if onended never fires
      setTimeout(release, fallbackDurationMs + 200);
    });
  }

  // ─── Noise / distortion helpers (operate on a passed-in ac snapshot) ────────

  _noise(ac, duration) {
    const size = Math.ceil(ac.sampleRate * duration);
    const buf = ac.createBuffer(1, size, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buf;
    return src;
  }

  _distort(ac, amount) {
    const node = ac.createWaveShaper();
    node.curve = makeDistortionCurve(amount);
    node.oversample = "4x";
    return node;
  }

  // ─── Public sound triggers ───────────────────────────────────────────────────

  /* Big Red hits the ground — low rumble, intensity 0..1 */
  playGroundImpact(intensity) {
    if (!this.ac) return;
    const now = this.ac.currentTime;
    if (now - this._lastImpactTime < 0.08) return;
    this._lastImpactTime = now;

    this._tryPlay((ac, release) => {
      const t = ac.currentTime;
      const dur = 0.45;

      const noise = this._noise(ac, dur);
      const lpf = ac.createBiquadFilter();
      lpf.type = "lowpass";
      lpf.frequency.value = 55;
      lpf.Q.value = 4;

      const osc = ac.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(45, t);
      osc.frequency.exponentialRampToValueAtTime(18, t + dur);

      const dist = this._distort(ac, 200 + intensity * 400);

      const gain = ac.createGain();
      gain.gain.setValueAtTime(intensity * 0.85, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      noise.connect(lpf);
      lpf.connect(dist);
      osc.connect(dist);
      dist.connect(gain);
      gain.connect(ac.destination);

      noise.onended = release;
      noise.start(t);
      osc.start(t);
      noise.stop(t + dur);
      osc.stop(t + dur);
    }, 450);
  }

  /* Small ball struck — short tearing noise burst */
  playBallStruck() {
    if (!this.ac) return;

    this._tryPlay((ac, release) => {
      const t = ac.currentTime;
      const dur = 0.13;

      const noise = this._noise(ac, dur);
      const bpf = ac.createBiquadFilter();
      bpf.type = "bandpass";
      bpf.frequency.value = 1400;
      bpf.Q.value = 0.25;

      const dist = this._distort(ac, 950);

      const gain = ac.createGain();
      gain.gain.setValueAtTime(0.38, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      noise.connect(bpf);
      bpf.connect(dist);
      dist.connect(gain);
      gain.connect(ac.destination);

      noise.onended = release;
      noise.start(t);
      noise.stop(t + dur);
    }, 130);
  }

  /* Small ball eliminated — sampled wail if loaded, synthesized fallback otherwise */
  playBallEliminated() {
    if (!this.ac) return;

    this._tryPlay((ac, release) => {
      if (this.wailBuffer) {
        this._playWailSample(ac, release);
      } else {
        this._playWailSynth(ac, release);
      }
    }, 850);
  }

  /* End-screen stings — sampled if loaded, synthesized fallback otherwise */
  playEscaped() {
    if (!this.ac) return;
    this._tryPlay((ac, release) => {
      if (this.winBuffer) {
        this._playSample(ac, this.winBuffer, 0.5, release);
      } else {
        this._playEscapedSynth(ac);
        setTimeout(release, 600);
      }
    }, 1000);
  }

  playBigRedWins() {
    if (!this.ac) return;
    this._tryPlay((ac, release) => {
      if (this.loseBuffer) {
        this._playSample(ac, this.loseBuffer, 0.5, release);
      } else {
        this._playBigRedWinsSynth(ac);
        setTimeout(release, 900);
      }
    }, 1000);
  }

  // ─── Private playback implementations ───────────────────────────────────────

  _playSample(ac, buffer, gainValue, release) {
    const t = ac.currentTime;
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const gainNode = ac.createGain();
    gainNode.gain.setValueAtTime(gainValue, t);
    src.connect(gainNode);
    gainNode.connect(ac.destination);
    src.onended = release;
    src.start(t);
  }

  _playWailSample(ac, release) {
    const t = ac.currentTime;
    const src = ac.createBufferSource();
    src.buffer = this.wailBuffer;

    const dist = this._distort(ac, 400);
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.09, t);

    src.connect(dist);
    dist.connect(gain);
    gain.connect(ac.destination);

    src.onended = release;
    src.start(t);
  }

  _playWailSynth(ac, release) {
    const t = ac.currentTime;
    const dur = 0.85;

    const osc1 = ac.createOscillator();
    const osc2 = ac.createOscillator();
    osc1.type = "sawtooth";
    osc2.type = "square";

    osc1.frequency.setValueAtTime(520, t);
    osc1.frequency.linearRampToValueAtTime(780, t + 0.04);
    osc1.frequency.exponentialRampToValueAtTime(80, t + dur);

    osc2.frequency.setValueAtTime(480, t);
    osc2.frequency.linearRampToValueAtTime(720, t + 0.04);
    osc2.frequency.exponentialRampToValueAtTime(60, t + dur);

    const dist = this._distort(ac, 750);
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.0, t);
    gain.gain.linearRampToValueAtTime(0.28, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc1.connect(dist);
    osc2.connect(dist);
    dist.connect(gain);
    gain.connect(ac.destination);

    osc1.onended = release;
    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + dur);
    osc2.stop(t + dur);
  }

  /* Synthesized "you escaped" fanfare — ascending major arpeggio */
  _playEscapedSynth(ac) {
    const t = ac.currentTime;
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc = ac.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = freq;
      const gain = ac.createGain();
      const st = t + i * 0.1;
      gain.gain.setValueAtTime(0, st);
      gain.gain.linearRampToValueAtTime(0.22, st + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, st + 0.35);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(st);
      osc.stop(st + 0.35);
    });
  }

  /* Synthesized "Big Red wins" sting — descending fall */
  _playBigRedWinsSynth(ac) {
    const t = ac.currentTime;
    const dur = 0.9;

    const osc = ac.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + dur);

    const dist = this._distort(ac, 300);
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc.connect(dist);
    dist.connect(gain);
    gain.connect(ac.destination);

    osc.start(t);
    osc.stop(t + dur);
  }
}
