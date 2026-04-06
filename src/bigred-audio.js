// bigred-audio.js - v 1.3.0

/* Synthesized sound effects via Web Audio API.
   Sampled buffers are loaded asynchronously from bigred-sounds.js;
   synthesized fallbacks play immediately while they arrive.

   Safari fix: noise buffers for the two high-frequency sounds (ground impact,
   ball struck) are pre-baked once at init() and reused via cheap
   BufferSourceNode re-creation each hit. The downstream filter/distortion/gain
   graph is built once per voice slot and kept alive for the session — Safari's
   audio graph GC is slow, so we never tear down nodes during gameplay.

   Voice release uses setTimeout only (not onended) because Safari's onended
   is unreliable on OscillatorNodes and inconsistent on BufferSourceNodes when
   the context has been through a suspend/resume cycle. The fallback setTimeout
   from v1.2 is now the primary mechanism; a small buffer is added to each
   duration so the slot is never released before the sound actually ends. */

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

/* Build a mono white-noise AudioBuffer of the given duration.
   Called once per sound type at init() — not per-frame. */
const _bakeNoise = (ac, duration) => {
  const size = Math.ceil(ac.sampleRate * duration);
  const buf = ac.createBuffer(1, size, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
  return buf;
};

export class AudioEngine {
  constructor() {
    this.ac = null;
    this.wailBuffer = null;
    this.winBuffer = null;
    this.loseBuffer = null;
    this._activeVoices = 0;
    this._lastImpactTime = 0;

    /* Pre-baked noise buffers — populated in _buildGraphs() */
    this._impactNoiseBuf = null;
    this._struckNoiseBuf = null;

    /* Persistent downstream graphs — built once, reused every hit.
       Each entry: { lpf/bpf, dist, gain }
       We swap in a fresh BufferSourceNode each play by connecting to the
       first node in the chain (lpf or bpf). The gain envelope is re-triggered
       each play via cancelScheduledValues + setValueAtTime. */
    this._impactGraph = null; // { lpf, dist, gain }
    this._struckGraph = null; // { bpf, dist, gain }

    /* Cached b64 strings so a future reset+init can re-decode on a fresh context */
    this._wailB64 = null;
    this._winB64 = null;
    this._loseB64 = null;
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
      this._impactNoiseBuf = null;
      this._struckNoiseBuf = null;
      this._impactGraph = null;
      this._struckGraph = null;
    }
  }

  /* Call once from a user-gesture handler (Start button) to unlock AudioContext.
     Pass useSampled=1 to load base64 samples from bigred-sounds.js; 0 for synth-only. */
  init(useSampled = 1) {
    this.ac = new (window.AudioContext || window.webkitAudioContext)();
    this._buildGraphs();
    if (useSampled) this._loadSamples();
  }

  /* Pre-bake noise buffers and build the persistent downstream graphs.
     Must be called immediately after this.ac is created. */
  _buildGraphs() {
    const ac = this.ac;

    // ── Ground impact: noise → lpf → dist → gain ──────────────────────────
    this._impactNoiseBuf = _bakeNoise(ac, 0.5); // slightly longer than dur so stop() always lands inside

    const impactLpf = ac.createBiquadFilter();
    impactLpf.type = "lowpass";
    impactLpf.frequency.value = 55;
    impactLpf.Q.value = 4;

    const impactDist = ac.createWaveShaper();
    impactDist.oversample = "4x";
    impactDist.curve = makeDistortionCurve(400); // placeholder; overwritten per-play

    const impactGain = ac.createGain();
    impactGain.gain.value = 0;

    impactLpf.connect(impactDist);
    impactDist.connect(impactGain);
    impactGain.connect(ac.destination);

    this._impactGraph = { lpf: impactLpf, dist: impactDist, gain: impactGain };

    // ── Ball struck: noise → bpf → dist → gain ────────────────────────────
    this._struckNoiseBuf = _bakeNoise(ac, 0.18);

    const struckBpf = ac.createBiquadFilter();
    struckBpf.type = "bandpass";
    struckBpf.frequency.value = 1400;
    struckBpf.Q.value = 0.25;

    const struckDist = ac.createWaveShaper();
    struckDist.curve = makeDistortionCurve(950);
    struckDist.oversample = "4x";

    const struckGain = ac.createGain();
    struckGain.gain.value = 0;

    struckBpf.connect(struckDist);
    struckDist.connect(struckGain);
    struckGain.connect(ac.destination);

    this._struckGraph = { bpf: struckBpf, dist: struckDist, gain: struckGain };
  }

  _decodeBuffer(b64, key) {
    this.ac
      .decodeAudioData(_b64ToBuffer(b64))
      .then((buf) => {
        this[key] = buf;
      })
      .catch((e) => console.warn(`[audio] failed to decode ${key}:`, e));
  }

  _loadSamples() {
    import("./bigred-sounds.js")
      .then(({ WAIL_B64, WIN_B64, LOSE_B64 }) => {
        this._wailB64 = WAIL_B64;
        this._winB64 = WIN_B64;
        this._loseB64 = LOSE_B64;
        this._decodeBuffer(WAIL_B64, "wailBuffer");
        this._decodeBuffer(WIN_B64, "winBuffer");
        this._decodeBuffer(LOSE_B64, "loseBuffer");
      })
      .catch((e) =>
        console.warn("[audio] failed to load bigred-sounds.js:", e),
      );
  }

  /* Resume a suspended context then invoke fn(ac) with a snapshotted reference.
     Snapshot prevents a concurrent reset() from handing a closed context to fn. */
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
     durationMs is the expected sound length; the slot is released after
     durationMs + 150 ms to ensure the sound has genuinely finished.
     onended is intentionally not used — unreliable on Safari OscillatorNodes
     and inconsistent on BufferSourceNodes after context suspend/resume. */
  _tryPlay(fn, durationMs = 500) {
    if (!this.ac) return;
    if (this._activeVoices >= 8) return;
    this._activeVoices++;
    const release = () => {
      this._activeVoices = Math.max(0, this._activeVoices - 1);
    };
    this._resume((ac) => {
      fn(ac);
      setTimeout(release, durationMs + 150);
    });
  }

  // ─── Public sound triggers ───────────────────────────────────────────────────

  /* Big Red hits the ground — low rumble + sine sweep, intensity 0..1.
     Uses the persistent _impactGraph; only a BufferSourceNode + OscillatorNode
     are created per call. The distortion curve is updated in-place for intensity. */
  playGroundImpact(intensity) {
    if (!this.ac || !this._impactGraph) return;
    const now = this.ac.currentTime;
    if (now - this._lastImpactTime < 0.08) return;
    this._lastImpactTime = now;

    this._tryPlay((ac) => {
      const g = this._impactGraph;
      const t = ac.currentTime;
      const dur = 0.45;

      // Update distortion curve in-place for this hit's intensity
      g.dist.curve = makeDistortionCurve(200 + intensity * 400);

      // Re-trigger the persistent gain envelope
      g.gain.gain.cancelScheduledValues(t);
      g.gain.gain.setValueAtTime(intensity * 0.85, t);
      g.gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      // Fresh noise source connected to the persistent lpf
      const noise = ac.createBufferSource();
      noise.buffer = this._impactNoiseBuf;
      noise.connect(g.lpf);
      noise.start(t);
      noise.stop(t + dur);

      // Fresh oscillator for the sub-bass sweep
      const osc = ac.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(45, t);
      osc.frequency.exponentialRampToValueAtTime(18, t + dur);
      osc.connect(g.lpf);
      osc.start(t);
      osc.stop(t + dur);
    }, 450);
  }

  /* Small ball struck — short tearing noise burst.
     Uses the persistent _struckGraph; only a BufferSourceNode per call. */
  playBallStruck() {
    if (!this.ac || !this._struckGraph) return;

    this._tryPlay((ac) => {
      const g = this._struckGraph;
      const t = ac.currentTime;
      const dur = 0.13;

      g.gain.gain.cancelScheduledValues(t);
      g.gain.gain.setValueAtTime(0.38, t);
      g.gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      const noise = ac.createBufferSource();
      noise.buffer = this._struckNoiseBuf;
      noise.connect(g.bpf);
      noise.start(t);
      noise.stop(t + dur);
    }, 130);
  }

  /* Health pickup collected — soft ascending chime.
     Low frequency event, so full node creation per call is fine. */
  playHealthPickup() {
    if (!this.ac) return;

    this._tryPlay((ac) => {
      const t = ac.currentTime;
      const dur = 0.55;
      const freqs = [523, 784]; // C5, G5

      freqs.forEach((freq) => {
        const osc = ac.createOscillator();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq * 0.85, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.08, t + dur * 0.4);
        osc.frequency.exponentialRampToValueAtTime(freq, t + dur);

        const gain = ac.createGain();
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.18, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(t);
        osc.stop(t + dur);
      });
    }, 600);
  }

  /* Small ball eliminated — sampled wail if loaded, synthesized fallback otherwise */
  playBallEliminated() {
    if (!this.ac) return;

    this._tryPlay((ac) => {
      if (this.wailBuffer) {
        this._playWailSample(ac);
      } else {
        this._playWailSynth(ac);
      }
    }, 900);
  }

  /* End-screen stings */
  playEscaped() {
    if (!this.ac) return;
    this._tryPlay((ac) => {
      if (this.winBuffer) {
        this._playSample(ac, this.winBuffer, 0.5);
      } else {
        this._playEscapedSynth(ac);
      }
    }, 1000);
  }

  playBigRedWins() {
    if (!this.ac) return;
    this._tryPlay((ac) => {
      if (this.loseBuffer) {
        this._playSample(ac, this.loseBuffer, 0.5);
      } else {
        this._playBigRedWinsSynth(ac);
      }
    }, 1000);
  }

  // ─── Private playback implementations ───────────────────────────────────────

  _playSample(ac, buffer, gainValue) {
    const t = ac.currentTime;
    const src = ac.createBufferSource();
    src.buffer = buffer;
    const gainNode = ac.createGain();
    gainNode.gain.setValueAtTime(gainValue, t);
    src.connect(gainNode);
    gainNode.connect(ac.destination);
    src.start(t);
  }

  _playWailSample(ac) {
    const t = ac.currentTime;
    const src = ac.createBufferSource();
    src.buffer = this.wailBuffer;

    const dist = ac.createWaveShaper();
    dist.curve = makeDistortionCurve(400);
    dist.oversample = "4x";

    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.09, t);

    src.connect(dist);
    dist.connect(gain);
    gain.connect(ac.destination);
    src.start(t);
  }

  _playWailSynth(ac) {
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

    const dist = ac.createWaveShaper();
    dist.curve = makeDistortionCurve(750);
    dist.oversample = "4x";

    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.0, t);
    gain.gain.linearRampToValueAtTime(0.28, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    osc1.connect(dist);
    osc2.connect(dist);
    dist.connect(gain);
    gain.connect(ac.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + dur);
    osc2.stop(t + dur);
    /* No onended — unreliable on Safari OscillatorNodes.
       Voice slot released by _tryPlay's setTimeout. */
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

    const dist = ac.createWaveShaper();
    dist.curve = makeDistortionCurve(300);
    dist.oversample = "4x";

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
