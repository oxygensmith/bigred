// Synthesized sound effects via Web Audio API.
// Sampled buffers are loaded asynchronously from bigred-sounds.js;
// synthesized fallbacks play immediately while they arrive.

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
    this.winBuffer  = null;
    this.loseBuffer = null;
    this._activeVoices = 0;
    this._lastImpactTime = 0;
  }

  // Close the old context and release all scheduled nodes (call before each new game)
  reset() {
    if (this.ac) {
      this.ac.close();
      this.ac = null;
      this.wailBuffer = null;
      this.winBuffer  = null;
      this.loseBuffer = null;
      this._activeVoices = 0;
      this._lastImpactTime = 0;
    }
  }

  // Call once from a user-gesture handler (Start button) to unlock AudioContext.
  // Pass useSampled=1 to load base64 samples from bigred-sounds.js; 0 for synth-only.
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

  // Resume context if the browser suspended it, then call fn
  _resume(fn) {
    if (!this.ac) return;
    if (this.ac.state === "suspended") {
      this.ac.resume().then(fn);
    } else {
      fn();
    }
  }

  // Voice-limited wrapper: drop the sound if too many voices are active
  _tryPlay(fn, durationMs = 500) {
    if (!this.ac) return;
    if (this._activeVoices >= 6) return;
    this._activeVoices++;
    this._resume(() => {
      fn();
      setTimeout(() => { this._activeVoices = Math.max(0, this._activeVoices - 1); }, durationMs);
    });
  }

  _playSample(buffer, gain, fallback) {
    if (!this.ac) return;
    this._resume(() => {
      if (buffer) {
        const ac = this.ac;
        const now = ac.currentTime;
        const src = ac.createBufferSource();
        src.buffer = buffer;
        const gainNode = ac.createGain();
        gainNode.gain.setValueAtTime(gain, now);
        src.connect(gainNode);
        gainNode.connect(ac.destination);
        src.start(now);
      } else if (fallback) {
        fallback();
      }
    });
  }

  _noise(duration) {
    const size = Math.ceil(this.ac.sampleRate * duration);
    const buf = this.ac.createBuffer(1, size, this.ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ac.createBufferSource();
    src.buffer = buf;
    return src;
  }

  _distort(amount) {
    const node = this.ac.createWaveShaper();
    node.curve = makeDistortionCurve(amount);
    node.oversample = "4x";
    return node;
  }

  // Big Red hits the ground — low rumble, intensity 0..1
  playGroundImpact(intensity) {
    if (!this.ac) return;
    const now = this.ac.currentTime;
    if (now - this._lastImpactTime < 0.08) return;
    this._lastImpactTime = now;
    this._tryPlay(() => {
      const ac = this.ac;
      const now = ac.currentTime;
      const dur = 0.45;

      const noise = this._noise(dur);
      const lpf = ac.createBiquadFilter();
      lpf.type = "lowpass";
      lpf.frequency.value = 55;
      lpf.Q.value = 4;

      const osc = ac.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(45, now);
      osc.frequency.exponentialRampToValueAtTime(18, now + dur);

      const dist = this._distort(200 + intensity * 400);

      const gain = ac.createGain();
      gain.gain.setValueAtTime(intensity * 0.85, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      noise.connect(lpf);
      lpf.connect(dist);
      osc.connect(dist);
      dist.connect(gain);
      gain.connect(ac.destination);

      noise.start(now);
      osc.start(now);
      noise.stop(now + dur);
      osc.stop(now + dur);
    }, 450);
  }

  // Small ball struck — short tearing noise burst
  playBallStruck() {
    if (!this.ac) return;
    this._tryPlay(() => {
      const ac = this.ac;
      const now = ac.currentTime;
      const dur = 0.13;

      const noise = this._noise(dur);
      const bpf = ac.createBiquadFilter();
      bpf.type = "bandpass";
      bpf.frequency.value = 1400;
      bpf.Q.value = 0.25;

      const dist = this._distort(950);

      const gain = ac.createGain();
      gain.gain.setValueAtTime(0.38, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

      noise.connect(bpf);
      bpf.connect(dist);
      dist.connect(gain);
      gain.connect(ac.destination);

      noise.start(now);
      noise.stop(now + dur);
    }, 130);
  }

  // Small ball eliminated — sampled wail if loaded, synthesized fallback otherwise
  playBallEliminated() {
    if (!this.ac) return;
    if (this.wailBuffer) {
      this._resume(() => this._playWailSample());
    } else {
      this._resume(() => this._playWailSynth());
    }
  }

  // End screen stings — sampled if loaded, synthesized fallback otherwise
  playEscaped() {
    this._playSample(this.winBuffer, 0.5, () => this._playEscapedSynth());
  }
  playBigRedWins() {
    this._playSample(this.loseBuffer, 0.5, () => this._playBigRedWinsSynth());
  }

  _playWailSample() {
    const ac = this.ac;
    const now = ac.currentTime;

    const src = ac.createBufferSource();
    src.buffer = this.wailBuffer;

    const dist = this._distort(400);

    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.09, now);

    src.connect(dist);
    dist.connect(gain);
    gain.connect(ac.destination);

    src.start(now);
  }

  _playWailSynth() {
    const ac = this.ac;
    const now = ac.currentTime;
    const dur = 0.85;

    const osc1 = ac.createOscillator();
    const osc2 = ac.createOscillator();
    osc1.type = "sawtooth";
    osc2.type = "square";

    osc1.frequency.setValueAtTime(520, now);
    osc1.frequency.linearRampToValueAtTime(780, now + 0.04);
    osc1.frequency.exponentialRampToValueAtTime(80, now + dur);

    osc2.frequency.setValueAtTime(480, now);
    osc2.frequency.linearRampToValueAtTime(720, now + 0.04);
    osc2.frequency.exponentialRampToValueAtTime(60, now + dur);

    const dist = this._distort(750);

    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.0, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc1.connect(dist);
    osc2.connect(dist);
    dist.connect(gain);
    gain.connect(ac.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + dur);
    osc2.stop(now + dur);
  }

  // Synthesized "you escaped" fanfare — ascending major arpeggio
  _playEscapedSynth() {
    const ac = this.ac;
    const now = ac.currentTime;
    const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
    notes.forEach((freq, i) => {
      const osc = ac.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = freq;
      const gain = ac.createGain();
      const t = now + i * 0.1;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(t);
      osc.stop(t + 0.35);
    });
  }

  // Synthesized "Big Red wins" sting — descending fall
  _playBigRedWinsSynth() {
    const ac = this.ac;
    const now = ac.currentTime;
    const dur = 0.9;

    const osc = ac.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + dur);

    const dist = this._distort(300);

    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(dist);
    dist.connect(gain);
    gain.connect(ac.destination);

    osc.start(now);
    osc.stop(now + dur);
  }
}
