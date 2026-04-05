const CONFIG = {
  // ─── World ────────────────────────────────────────────────────────────────
  // SCENE_WIDTH is not fixed — calculated at game start as terrainChunks × LANDSCAPE_SMOOTHNESS
  SCENE_HEIGHT: 640, // World height in px (also canvas height)
  LANDSCAPE_SMOOTHNESS: 58, // Pixel width per terrain segment. Lower = rockier (~20), higher = smoother rolling hills (~360)
  GAME_DURATION_MS: 300000, // Default time until the finish gate opens (ms) — overridden by start screen selection
  // FINISH_LINE_X is not fixed —  it is set dynamically when the timer hits zero
  FINISH_GATE_CLOSE_SECS: 12, // Seconds for the doors to fully close after the gate appears
  FINISH_GATE_WIDTH: 18, // Visual thickness of each door panel (px)
  GRAVITY: 360, // Downward acceleration (px/s²)

  // ─── Balls ────────────────────────────────────────────────────────────────
  BALL_COUNT: 21, // Number of small balls (max = BALL_ROSTER.length)
  LARGE_BALL_RADIUS: 96, // Big Red's radius in px
  SMALL_BALL_RADIUS: 20, // Small ball radius in px
  SMALL_BALL_HEALTH: 64, // HP each small ball starts with

  // ─── Per-ball variance ────────────────────────────────────────────────────
  // Each stat is multiplied by (1 + rand(-VAR, +VAR)) at spawn.
  // All variance is seeded so the same seed always gives the same ball stats.
  VARIANCE_TYPE: "team", // "individual" = each ball rolls its own stats; "team" = all balls on a team share the same stats
  SPIN_DRIVE_VARIANCE: 0.15, // ±15% on spinDrive
  ROLLING_GRIP_VARIANCE: 0.15, // ±15% on rollingGrip
  AIR_DECAY_VARIANCE: 0.004, // ±0.004 on spinAirDecay (absolute, not relative)
  BOUNCE_VARIANCE: 0.1, // ±10% on bounciness
  RADIUS_VARIANCE: 2, // ±2px on radius (absolute)

  // ─── Rotation / rolling (the "bicycle engine") ────────────────────────────
  // Each ball has an angular velocity (omega, rad/s). Self-torque spins them
  // up; rolling grip on the ground converts omega → vx (and vice-versa).
  SMALL_SPIN_DRIVE: 48, // Angular acceleration from self-propulsion (rad/s²), small balls
  LARGE_SPIN_DRIVE: 8, // Angular acceleration from self-propulsion (rad/s²), Big Red
  ROLLING_GRIP: 20, // Coupling strength between omega and vx (per second)
  SPIN_AIR_DECAY: 0.9, // was 0.996, // Omega multiplier applied per frame while airborne
  MIN_OMEGA_SMALL: 1.5, // Minimum omega for small balls (rad/s) — the "lowest gear"
  MIN_OMEGA_LARGE: 0.25, // Minimum omega for Big Red (rad/s)
  SPIN_TRANSFER: 0.72, // Fraction of Big Red's surface speed transferred to a small ball on contact

  // ─── Speed limits ─────────────────────────────────────────────────────────
  SMALL_MAX_SPEED: 300, // Max vx for small balls (px/s)
  LARGE_MAX_SPEED: 520, // Max vx for Big Red (px/s)

  // ─── Spawn ────────────────────────────────────────────────────────────────
  SPAWN_X_START: 300, // World x of the leftmost spawn slot
  SPAWN_X_SPACING: 22, // px between each spawn slot
  SPAWN_Y_BASE: 80, // Canvas y of the spawn drop point
  SPAWN_Y_JITTER: 40, // Max random y offset per ball
  SPAWN_VX_BASE: 40, // Initial rightward speed (px/s)
  SPAWN_VX_JITTER: 30, // Max random addition to starting vx

  // ─── Ground physics ───────────────────────────────────────────────────────
  GROUND_BOUNCE_LARGE: 0.48, // Normal-velocity restitution for Big Red on ground impact
  GROUND_BOUNCE_SMALL: 0.78, // Normal-velocity restitution for small balls on ground impact
  GROUND_FRICTION: 0.998, // Rolling-resistance multiplier on vx per frame, Big Red
  SMALL_GROUND_FRICTION: 0.999, // Rolling-resistance multiplier on vx per frame, small balls
  AIR_DRAG: 0.9993, // vx multiplier per frame while airborne (both ball types)
  STUCK_SLOPE_THRESHOLD: 0.8, // Uphill slope magnitude at which a slow small ball is considered stuck

  // ─── Big Red catchup ──────────────────────────────────────────────────────
  // When the rearmost small ball is far ahead, Big Red gets an omega boost.
  LARGE_CATCHUP_DISTANCE: 500, // Gap (px) before catchup kicks in
  LARGE_CATCHUP_ACCELERATION: 180, // Extra angular acceleration added during catchup (px/s² ÷ radius)

  // ─── Back wall ────────────────────────────────────────────────────────────
  // A visible 20 px-wide wall that drifts just behind the camera's left edge.
  // Its right edge oscillates between cameraX+25 and cameraX+125 on a sine wave.
  BACKWALL_OMEGA_LARGE: 8, // Omega added to Big Red on wall contact (rad/s)
  BACKWALL_OMEGA_SMALL: 240, // Omega added to small balls on wall contact (rad/s) — big zap
  BACKWALL_VX_SMALL: 800, // vx set on small balls on wall contact (px/s) — instant lurch

  // ─── Combat ───────────────────────────────────────────────────────────────
  LARGE_BALL_MASS_RATIO: 12, // Big Red's mass relative to a small ball. Higher = less recoil on Big Red, harder impact on small balls.
  /* Tuning guide:
     6 — noticeable, but Big Red still wobbles a bit on direct hits
     12 — (default) Big Red rolls through with authority, small balls scatter
     20+ — Big Red is essentially immovable; feels more like a wall than a ball */
  DAMAGE_PER_SECOND: 32, // HP/s drained from a small ball while touching Big Red

  // ─── Terrain generation ───────────────────────────────────────────────────
  TERRAIN_CHUNKS: 750, // Not used at runtime — chunk count is auto-calculated as 10 segments/sec of game duration
  TERRAIN_BASE_Y: 420, // Baseline y around which the sine envelope is centred
  TERRAIN_PEAK_AMPLITUDE: 250, // Amplitude of the large-scale sine envelope (px)
  TERRAIN_RANDOM_DELTA: 160, // Max random y-jitter added per chunk (px)
  TERRAIN_SMOOTHING: 0.5, // How strongly each chunk pulls toward the envelope (0=none, 1=full)
  TERRAIN_MIN_Y: 260, // Highest point terrain can reach (px from top)
  TERRAIN_MAX_Y_OFFSET: 80, // Minimum distance from the bottom of the canvas (px)

  // ─── Camera ───────────────────────────────────────────────────────────────
  CAMERA_OFFSET_X: 180, // How far from the left edge Big Red is kept (px)
  CAMERA_LERP: 0.1, // Camera smoothing factor (0=frozen, 1=instant snap)
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const lerp = (a, b, t) => a + (b - a) * t;

// Mulberry32 — a fast, seedable PRNG. Returns a function that yields [0, 1).
// Pass a seed to get a fully reproducible sequence; the same seed always
// produces the same ball stats and spawn positions.
const mulberry32 = (seed) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const formatTime = (ms) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
};

// Full roster — BALL_COUNT controls how many are used, taken in order from the top.
// 7 teams × 3 balls each = 21. Each team has a pure-colour centre ball flanked
// by two transition balls blending toward the neighbouring team's hue.
const BALL_ROSTER = [
  // ── Orange ──────────────────────────────────────────────────────────────
  { color: "#ff3d00", name: "Red-Orange", team: "Orange" },
  { color: "#ff7700", name: "Orange", team: "Orange" },
  { color: "#ffaa00", name: "Yellow-Orange", team: "Orange" },
  // ── Yellow ──────────────────────────────────────────────────────────────
  { color: "#ffcc00", name: "Orange-Yellow", team: "Yellow" },
  { color: "#ffee00", name: "Yellow", team: "Yellow" },
  { color: "#aaee00", name: "Green-Yellow", team: "Yellow" },
  // ── Green ───────────────────────────────────────────────────────────────
  { color: "#66dd00", name: "Yellow-Green", team: "Green" },
  { color: "#00cc44", name: "Green", team: "Green" },
  { color: "#00ccaa", name: "Blue-Green", team: "Green" },
  // ── Blue ────────────────────────────────────────────────────────────────
  { color: "#00bbdd", name: "Green-Blue", team: "Blue" },
  { color: "#0088ff", name: "Blue", team: "Blue" },
  { color: "#2255ff", name: "Indigo-Blue", team: "Blue" },
  // ── Indigo ──────────────────────────────────────────────────────────────
  { color: "#3333ff", name: "Blue-Indigo", team: "Indigo" },
  { color: "#4400ee", name: "Indigo", team: "Indigo" },
  { color: "#7700dd", name: "Violet-Indigo", team: "Indigo" },
  // ── Violet ──────────────────────────────────────────────────────────────
  { color: "#9900cc", name: "Indigo-Violet", team: "Violet" },
  { color: "#cc00ff", name: "Violet", team: "Violet" },
  { color: "#ee44ff", name: "Grey-Violet", team: "Violet" },
  // ── Grey ────────────────────────────────────────────────────────────────
  { color: "#aa88bb", name: "Violet-Grey", team: "Grey" },
  { color: "#888888", name: "Grey", team: "Grey" },
  { color: "#aaaaaa", name: "Cool Grey", team: "Grey" },
];

const BIG_RED_SVG = `<svg id="big-red" data-name="big-red" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <path fill="#e8493f" d="M469.63,256l42.37-13.42-43.54-8.91,40.74-17.77-44.24-4.31,38.66-21.93-44.45.33,36.15-25.85-44.17,4.98,33.25-29.49-43.41,9.57,29.99-32.81-42.17,14.05,26.4-35.76-40.47,18.38,22.51-38.32-38.32,22.51,18.38-40.47-35.76,26.4,14.05-42.17-32.81,29.99,9.57-43.41-29.49,33.25,4.98-44.17-25.85,36.15.33-44.45-21.93,38.66-4.31-44.24-17.77,40.74L269.42,0l-13.42,42.37L242.58,0l-8.91,43.54L215.9,2.8l-4.31,44.24-21.93-38.66.33,44.45-25.85-36.15,4.98,44.17-29.49-33.25,9.57,43.41-32.81-29.99,14.05,42.17-35.76-26.4,18.38,40.47-38.32-22.51,22.51,38.32-40.47-18.38,26.4,35.76-42.17-14.05,29.99,32.81-43.41-9.57,33.25,29.49-44.17-4.98,36.15,25.85-44.45-.33,38.66,21.93-44.24,4.31,40.74,17.77L0,242.58l42.37,13.42L0,269.42l43.54,8.91-40.74,17.77,44.24,4.31-38.66,21.93,44.45-.33-36.15,25.85,44.17-4.98-33.25,29.49,43.41-9.57-29.99,32.81,42.17-14.05-26.4,35.76,40.47-18.38-22.51,38.32,38.32-22.51-18.38,40.47,35.76-26.4-14.05,42.17,32.81-29.99-9.57,43.41,29.49-33.25-4.98,44.17,25.85-36.15-.33,44.45,21.93-38.66,4.31,44.24,17.77-40.74,8.91,43.54,13.42-42.37,13.42,42.37,8.91-43.54,17.77,40.74,4.31-44.24,21.93,38.66-.33-44.45,25.85,36.15-4.98-44.17,29.49,33.25-9.57-43.41,32.81,29.99-14.05-42.17,35.76,26.4-18.38-40.47,38.32,22.51-22.51-38.32,40.47,18.38-26.4-35.76,42.17,14.05-29.99-32.81,43.41,9.57-33.25-29.49,44.17,4.98-36.15-25.85,44.45.33-38.66-21.93,44.24-4.31-40.74-17.77,43.54-8.91-42.37-13.42ZM429.25,269.77h-166.23v166.23h-19.21v-166.23H77.59v-19.21h166.23V84.34h19.21v166.23h166.23v19.21Z"/>
</svg>`;

const createTerrain = (width, height, chunks) => {
  const points = [];
  const chunkWidth = width / chunks;
  let y = height - 100;

  for (let i = 0; i <= chunks; i += 1) {
    const target =
      CONFIG.TERRAIN_BASE_Y +
      Math.sin((i / chunks) * Math.PI * 2) * CONFIG.TERRAIN_PEAK_AMPLITUDE;
    y +=
      (target - y) * CONFIG.TERRAIN_SMOOTHING +
      (Math.random() - 0.5) * CONFIG.TERRAIN_RANDOM_DELTA;
    y = clamp(y, CONFIG.TERRAIN_MIN_Y, height - CONFIG.TERRAIN_MAX_Y_OFFSET);
    points.push({ x: i * chunkWidth, y });
  }

  return {
    points,
    getY(x) {
      const cappedX = clamp(x, 0, width);
      let index = points.findIndex((point) => point.x >= cappedX);
      if (index === 0) return points[0].y;
      if (index === -1) index = points.length - 1;
      const left = points[index - 1];
      const right = points[index];
      const ratio = (cappedX - left.x) / (right.x - left.x);
      return left.y + (right.y - left.y) * ratio;
    },
    getSlope(x) {
      const cappedX = clamp(x, 0, width);
      let index = points.findIndex((point) => point.x >= cappedX);
      if (index === 0) return 0;
      if (index === -1) index = points.length - 1;
      const left = points[index - 1];
      const right = points[index];
      return (right.y - left.y) / (right.x - left.x);
    },
  };
};

export class Game {
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.ui = ui;
    this.paused = false;
    this.lastTimestamp = 0;
    this.elapsedMs = 0;
    this.cameraX = 0;
    this.finishActive = false;

    this.bigRedImage = new Image();
    this.bigRedImage.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(BIG_RED_SVG)}`;

    this.resize();
    window.addEventListener("resize", () => this.resize());
    this.gameDurationMs = CONFIG.GAME_DURATION_MS;
    this.tiebreaker = "health";
    this.loopRunning = false;

    window.addEventListener("keydown", (event) => {
      if (event.code === "Space") {
        event.preventDefault();
        if (this.gameOver) this.showStartScreen();
        else this.togglePause();
      }
      if (event.code === "KeyP") {
        event.preventDefault();
        this.largeBallPaused = !this.largeBallPaused;
        if (!this.largeBallPaused) {
          this.largeBallSpeedScale = 1;
          this.largeBall.vx = Math.max(this.largeBall.vx, 220);
        }
      }
      if (event.code === "KeyO") {
        event.preventDefault();
        this.allBallsPaused = !this.allBallsPaused;
      }
    });
  }

  reset() {
    // New seed each game — shown in diagnostics so a run is fully reproducible
    this.seed = Math.floor(Math.random() * 0xffffffff);
    const rng = mulberry32(this.seed);

    this.terrainChunks = Math.round((this.gameDurationMs / 1000) * 10);
    this.sceneWidth = this.terrainChunks * CONFIG.LANDSCAPE_SMOOTHNESS;
    this.terrain = createTerrain(
      this.sceneWidth,
      CONFIG.SCENE_HEIGHT,
      this.terrainChunks,
    );
    this.largeBall = {
      type: "large",
      x: 120,
      y: 120,
      vx: 260,
      vy: 0,
      omega: 260 / CONFIG.LARGE_BALL_RADIUS,
      angle: 0,
      radius: CONFIG.LARGE_BALL_RADIUS,
      color: "#e8493f",
    };

    // Build shuffled spawn slots using seeded RNG
    const spawnSlots = Array.from(
      { length: CONFIG.BALL_COUNT },
      (_, i) => CONFIG.SPAWN_X_START + i * CONFIG.SPAWN_X_SPACING,
    );
    for (let i = spawnSlots.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [spawnSlots[i], spawnSlots[j]] = [spawnSlots[j], spawnSlots[i]];
    }

    // Pre-generate one variance set per team when VARIANCE_TYPE is "team"
    const teamVariances = {};
    if (CONFIG.VARIANCE_TYPE === "team") {
      const teams = [...new Set(BALL_ROSTER.map((b) => b.team))];
      teams.forEach((team) => {
        const tv = (variance) => 1 + (rng() * 2 - 1) * variance;
        teamVariances[team] = {
          spinDrive: tv(CONFIG.SPIN_DRIVE_VARIANCE),
          rollingGrip: tv(CONFIG.ROLLING_GRIP_VARIANCE),
          airDecay: (rng() * 2 - 1) * CONFIG.AIR_DECAY_VARIANCE,
          bounciness: tv(CONFIG.BOUNCE_VARIANCE),
          radius: (rng() * 2 - 1) * CONFIG.RADIUS_VARIANCE,
        };
      });
    }

    this.smallBalls = BALL_ROSTER.slice(0, CONFIG.BALL_COUNT).map(
      (entry, index) => {
        const teamV = teamVariances[entry.team];
        const iv = (variance) => 1 + (rng() * 2 - 1) * variance; // individual draw
        const radiusDelta = teamV
          ? teamV.radius
          : (rng() * 2 - 1) * CONFIG.RADIUS_VARIANCE;
        const radius = CONFIG.SMALL_BALL_RADIUS + radiusDelta;
        return {
          id: index + 1,
          type: "small",
          name: entry.name,
          team: entry.team,
          color: entry.color,
          x: spawnSlots[index],
          y: CONFIG.SPAWN_Y_BASE + rng() * CONFIG.SPAWN_Y_JITTER,
          vx: CONFIG.SPAWN_VX_BASE + rng() * CONFIG.SPAWN_VX_JITTER,
          vy: 0,
          omega: 6 + rng() * 4,
          angle: rng() * Math.PI * 2,
          radius,
          spinDrive:
            CONFIG.SMALL_SPIN_DRIVE *
            (teamV ? teamV.spinDrive : iv(CONFIG.SPIN_DRIVE_VARIANCE)),
          rollingGrip:
            CONFIG.ROLLING_GRIP *
            (teamV ? teamV.rollingGrip : iv(CONFIG.ROLLING_GRIP_VARIANCE)),
          airDecay:
            CONFIG.SPIN_AIR_DECAY +
            (teamV
              ? teamV.airDecay
              : (rng() * 2 - 1) * CONFIG.AIR_DECAY_VARIANCE),
          bounciness:
            CONFIG.GROUND_BOUNCE_SMALL *
            (teamV ? teamV.bounciness : iv(CONFIG.BOUNCE_VARIANCE)),
          health: CONFIG.SMALL_BALL_HEALTH,
          alive: true,
          finished: false,
          finishedAt: null,
          healthAtFinish: 0,
          stuck: false,
        };
      },
    );

    this.backWallRightX = 0;
    this.backWallFlash = 0;
    this.particles = [];
    this.paused = false;
    this.largeBallPaused = false;
    this.allBallsPaused = false;
    this.largeBallSpeedScale = 1;
    this.allBallsSpeedScale = 1;
    this.gameOver = null;
    this.escapedTeam = null;
    this.ui.endOverlay.classList.add("end-overlay--hidden");
    this.finishLineX = 0;
    this.finishGateAge = 0;
    this.lastTimestamp = 0;
    this.elapsedMs = 0;
    this.finishActive = false;
    this.cameraX = 0;
    this.updateScoreboard();
  }

  showStartScreen() {
    this.ui.endOverlay.classList.add("end-overlay--hidden");
    this.ui.startOverlay.classList.remove("start-overlay--hidden");
  }

  begin(durationMs, tiebreaker, landscapeSmoothness) {
    this.gameDurationMs = durationMs;
    this.tiebreaker = tiebreaker;
    CONFIG.LANDSCAPE_SMOOTHNESS = landscapeSmoothness;
    this.ui.startOverlay.classList.add("start-overlay--hidden");
    this.reset();
    if (!this.loopRunning) {
      this.loopRunning = true;
      requestAnimationFrame((timestamp) => this.frame(timestamp));
    }
  }

  togglePause() {
    this.paused = !this.paused;
  }

  showEndOverlay() {
    const o = this.ui.endOverlay;
    const isEscaped = this.gameOver === "ESCAPED";
    const color = isEscaped ? this.escapedTeam.color : "#e8493f";

    this.ui.endHeadline.textContent = isEscaped ? "ESCAPED!!!" : "BIG RED WINS";
    this.ui.endHeadline.style.color = color;
    this.ui.endHeadline.style.textShadow = `0 0 32px ${color}`;
    o.style.borderColor = color;

    if (isEscaped) {
      const t = this.escapedTeam;
      const s = t.through === 1 ? "survivor" : "survivors";
      const tiebreakerStr =
        this.tiebreaker === "health"
          ? `${t.totalHealth.toFixed(1)} total health`
          : `last through at ${formatTime(t.lastThrough)}`;
      this.ui.endSubline.textContent = `${t.name} team — ${t.through} ${s} through · ${tiebreakerStr}`;
      this.ui.endSubline.style.color = color;
    } else {
      this.ui.endSubline.textContent = "";
    }

    o.classList.remove("end-overlay--hidden");
  }

  resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = this.canvas.clientWidth || 1200;
    const height = this.canvas.clientHeight || 640;
    this.canvas.width = width * ratio;
    this.canvas.height = height * ratio;
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  frame(timestamp) {
    if (!this.lastTimestamp) this.lastTimestamp = timestamp;
    const deltaMs = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    if (!this.paused) {
      this.update(deltaMs / 1000);
    }

    this.draw();
    requestAnimationFrame((nextStamp) => this.frame(nextStamp));
  }

  update(dt) {
    if (!this.gameOver) {
      this.elapsedMs += dt * 1000;
      if (!this.finishActive && this.elapsedMs >= this.gameDurationMs) {
        this.finishActive = true;
        this.finishLineX = this.cameraX + this.canvas.clientWidth;
        // Flatten all terrain points beyond the finish line
        const flatY = this.terrain.getY(this.finishLineX);
        this.terrain.points.forEach((p) => {
          if (p.x > this.finishLineX) p.y = flatY;
        });
      }
      const allDead =
        this.smallBalls.length > 0 && this.smallBalls.every((b) => !b.alive);
      const gateClosed =
        this.finishActive &&
        this.finishGateAge >= CONFIG.FINISH_GATE_CLOSE_SECS;

      if (allDead) {
        this.gameOver = "BIG_RED_WINS";
        this.showEndOverlay();
      } else if (gateClosed) {
        // Gate closed — decide winner now.
        const teamNames = [...new Set(this.smallBalls.map((b) => b.team))];
        const teamStats = teamNames.map((team) => {
          const finished = this.smallBalls.filter(
            (b) => b.team === team && b.finished,
          );
          return {
            name: team,
            through: finished.length,
            totalHealth: finished.reduce((s, b) => s + b.healthAtFinish, 0),
            lastThrough:
              finished.length > 0
                ? Math.max(...finished.map((b) => b.finishedAt))
                : Infinity,
            color: BALL_ROSTER.filter((b) => b.team === team)[1].color,
          };
        });
        teamStats.sort((a, b) => {
          if (b.through !== a.through) return b.through - a.through;
          if (this.tiebreaker === "health")
            return b.totalHealth - a.totalHealth;
          return a.lastThrough - b.lastThrough; // lower = earlier = faster
        });
        const best = teamStats[0];
        if (best.through === 0) {
          this.gameOver = "BIG_RED_WINS";
          this.showEndOverlay();
        } else {
          this.gameOver = "ESCAPED";
          this.escapedTeam = {
            name: best.name,
            color: best.color,
            through: best.through,
            totalHealth: best.totalHealth,
            lastThrough: best.lastThrough,
          };
          this.showEndOverlay();
        }
      }
    }

    // Gate ticking — always runs so the gate continues closing after ESCAPED
    if (this.finishActive) {
      if (this.gameOver === "BIG_RED_WINS") {
        this.finishGateAge = Math.max(0, this.finishGateAge - dt * 2);
      } else {
        this.finishGateAge = Math.min(
          this.finishGateAge + dt,
          CONFIG.FINISH_GATE_CLOSE_SECS,
        );
      }
    }

    // Back wall: right edge oscillates between cameraX+25 and cameraX+125 on a slow sine
    this.backWallRightX =
      this.cameraX + 75 + 50 * Math.sin((this.elapsedMs / 1000) * 0.4);
    this.backWallFlash = Math.max(0, this.backWallFlash - dt * 3);

    const lerpRate = 1 - Math.pow(0.001, dt * 4);
    this.largeBallSpeedScale = lerp(
      this.largeBallSpeedScale,
      this.largeBallPaused ? 0 : 1,
      lerpRate,
    );
    this.allBallsSpeedScale = lerp(
      this.allBallsSpeedScale,
      this.allBallsPaused ? 0 : 1,
      lerpRate,
    );

    this.updateBall(this.largeBall, dt);
    this.smallBalls.forEach((ball) => this.updateBall(ball, dt));

    const laggingBall = this.smallBalls
      .filter((ball) => ball.alive && !ball.finished)
      .reduce((leftMost, ball) => (ball.x < leftMost.x ? ball : leftMost), {
        x: Infinity,
      });

    if (laggingBall.x < Infinity) {
      const lag = laggingBall.x - this.largeBall.x;
      if (lag > CONFIG.LARGE_CATCHUP_DISTANCE) {
        const boostFactor = clamp(
          (lag - CONFIG.LARGE_CATCHUP_DISTANCE) / 600,
          0,
          1,
        );
        this.largeBall.omega +=
          ((CONFIG.LARGE_CATCHUP_ACCELERATION * boostFactor * dt) /
            this.largeBall.radius) *
          this.largeBallSpeedScale *
          this.allBallsSpeedScale;
      }
    }

    this.particles = this.particles.filter((p) => p.alpha > 0);
    this.particles.forEach((p) => {
      p.vy += CONFIG.GRAVITY * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= dt * 1.4;
    });

    this.resolveCollisions(dt);
    this.updateCamera(dt);
    this.updateScoreboard();
  }

  updateBall(ball, dt) {
    if (ball.type === "small" && !ball.alive) return;
    if (ball.type === "small" && ball.finished) {
      // Finished balls still run physics so they coast to a stop naturally —
      // only skip the spin drive and gate-crossing logic handled elsewhere.
      ball.vy += CONFIG.GRAVITY * dt;
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;

      const groundY = this.terrain.getY(ball.x);
      const slope = this.terrain.getSlope(ball.x);
      const len = Math.sqrt(1 + slope * slope);
      const belowGround = ball.y + ball.radius > groundY;
      if (belowGround) {
        ball.y = groundY - ball.radius;
        const nx = slope / len;
        const ny = -1 / len;
        const vn = ball.vx * nx + ball.vy * ny;
        if (vn < 0) {
          const vtx = ball.vx - vn * nx;
          const vty = ball.vy - vn * ny;
          ball.vx = vtx + -ball.bounciness * vn * nx;
          ball.vy = vty + -ball.bounciness * vn * ny;
        }
        const slip = ball.omega * ball.radius - ball.vx;
        ball.vx += slip * ball.rollingGrip * dt;
        ball.omega -= (slip * ball.rollingGrip * dt) / ball.radius;
        ball.vx *= Math.pow(CONFIG.SMALL_GROUND_FRICTION, dt * 60);
      }
      ball.vx *= Math.pow(CONFIG.AIR_DRAG, dt * 60);
      ball.omega *= Math.pow(ball.airDecay, dt * 60);
      ball.angle += ball.omega * dt;

      // One-way gate: prevent drifting back through
      if (ball.x - ball.radius <= this.finishLineX) {
        ball.x = this.finishLineX + ball.radius + 1;
        ball.vx = Math.abs(ball.vx) * 0.4;
      }
      // Invisible right wall: half canvas-width beyond the gate
      const rightWall = this.finishLineX + this.canvas.clientWidth / 2;
      if (ball.x + ball.radius >= rightWall) {
        ball.x = rightWall - ball.radius - 1;
        ball.vx = -Math.abs(ball.vx) * ball.bounciness;
      }
      return;
    }
    if (this.finishActive && ball.x + ball.radius >= this.finishLineX) {
      // Big Red is always blocked
      if (ball.type === "large") {
        if (this.gameOver !== "BIG_RED_WINS") {
          ball.x = this.finishLineX - ball.radius - 1;
          ball.vx = 0;
          ball.vy = 0;
          return;
        }
        // Big Red wins — let it roll through; right wall is half-canvas beyond the gate
        const rightWall = this.finishLineX + this.canvas.clientWidth / 2;
        if (ball.x + ball.radius >= rightWall) {
          ball.x = rightWall - ball.radius - 1;
          ball.vx = -Math.abs(ball.vx);
        }
      }
      // Small balls are blocked if the door has closed over their y position
      if (ball.type === "small") {
        const closeFrac = clamp(
          this.finishGateAge / CONFIG.FINISH_GATE_CLOSE_SECS,
          0,
          1,
        );
        const doorReach = closeFrac * (CONFIG.SCENE_HEIGHT / 2);
        const blockedByTop = ball.y - ball.radius < doorReach;
        const blockedByBottom =
          ball.y + ball.radius > CONFIG.SCENE_HEIGHT - doorReach;
        if (blockedByTop || blockedByBottom) {
          ball.x = this.finishLineX - ball.radius - 1;
          ball.vx = Math.abs(ball.vx) * -0.5;
        }
      }
    }

    ball.vy += CONFIG.GRAVITY * dt;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    if (ball.x - ball.radius < this.backWallRightX) {
      ball.x = this.backWallRightX + ball.radius;
      ball.vx =
        ball.type === "small" ? CONFIG.BACKWALL_VX_SMALL : Math.abs(ball.vx);
      ball.omega +=
        ball.type === "large"
          ? CONFIG.BACKWALL_OMEGA_LARGE
          : CONFIG.BACKWALL_OMEGA_SMALL;
      this.backWallFlash = 1;
    }

    const groundY = this.terrain.getY(ball.x);
    const slope = this.terrain.getSlope(ball.x);
    const belowGround = ball.y + ball.radius > groundY;

    if (belowGround) {
      ball.y = groundY - ball.radius;

      // Outward surface normal in canvas coords (y increases downward):
      // tangent along surface = (1, slope), so normal = (slope, -1) / len
      const len = Math.sqrt(1 + slope * slope);
      const nx = slope / len;
      const ny = -1 / len;

      // Velocity along normal (negative = moving into surface)
      const vn = ball.vx * nx + ball.vy * ny;

      if (vn < 0) {
        const baseBounce =
          ball.type === "small" ? ball.bounciness : CONFIG.GROUND_BOUNCE_LARGE;

        // Tangential velocity (along surface) is preserved; normal is reflected
        const vtx = ball.vx - vn * nx;
        const vty = ball.vy - vn * ny;
        ball.vx = vtx + -baseBounce * vn * nx;
        ball.vy = vty + -baseBounce * vn * ny;
      }

      // Rolling grip: omega drives vx; excess slip exchanges energy between them
      const grip =
        ball.type === "small" ? ball.rollingGrip : CONFIG.ROLLING_GRIP;
      const contactSpeed = ball.omega * ball.radius;
      const slip = contactSpeed - ball.vx;
      ball.vx += slip * grip * dt;
      ball.omega -= (slip * grip * dt) / ball.radius;

      // Slope accelerates spin downhill (positive canvas slope = terrain drops right)
      // and decelerates it uphill — gravity component along surface
      ball.omega += ((CONFIG.GRAVITY * slope) / (len * ball.radius)) * dt;

      // On steep uphills, nudge the ball over the crest rather than damping it further
      if (ball.type === "small") {
        const uphill = Math.max(0, -slope);
        if (uphill > CONFIG.STUCK_SLOPE_THRESHOLD && ball.vx < 30) {
          ball.stuck = true;
          // Kick forward and upward along the slope so it crests instead of stalling
          ball.vx += uphill * 60 * dt;
          ball.vy -= uphill * 40 * dt;
        } else {
          ball.stuck = false;
        }
      }

      // Light rolling resistance (replaces old heavy ground friction)
      const groundFriction =
        ball.type === "small"
          ? CONFIG.SMALL_GROUND_FRICTION
          : CONFIG.GROUND_FRICTION;
      ball.vx *= Math.pow(groundFriction, dt * 60);
    }

    ball.vx *= Math.pow(CONFIG.AIR_DRAG, dt * 60);
    const maxSpeed =
      ball.type === "large" ? CONFIG.LARGE_MAX_SPEED : CONFIG.SMALL_MAX_SPEED;
    ball.vx = clamp(ball.vx, -maxSpeed, maxSpeed);

    // Self-propulsion: spin drive torque (the "bicycle engine")
    const speedScale =
      ball.type === "large"
        ? this.largeBallSpeedScale * this.allBallsSpeedScale
        : this.allBallsSpeedScale;
    const spinDrive =
      ball.type === "large"
        ? this.gameOver === "ESCAPED"
          ? 0
          : CONFIG.LARGE_SPIN_DRIVE
        : this.gameOver === "ESCAPED"
          ? 0
          : ball.spinDrive;
    ball.omega += spinDrive * speedScale * dt;

    // Cap omega at the equivalent of max linear speed
    const maxOmega = maxSpeed / ball.radius;
    ball.omega = Math.min(ball.omega, maxOmega);

    // Gentle spin decay (air resistance on rotation)
    const airDecay =
      ball.type === "small" ? ball.airDecay : CONFIG.SPIN_AIR_DECAY;
    ball.omega *= Math.pow(airDecay, dt * 60);

    // Minimum spin scales with speedScale: zero when paused, full minimum when running
    const minOmega =
      (ball.type === "large"
        ? this.gameOver === "ESCAPED"
          ? 0
          : CONFIG.MIN_OMEGA_LARGE
        : ball.finished || this.gameOver === "ESCAPED"
          ? 0
          : CONFIG.MIN_OMEGA_SMALL) * speedScale;
    ball.omega = Math.max(ball.omega, minOmega);

    // Accumulate visual rotation angle
    ball.angle += ball.omega * dt;

    if (
      ball.type === "small" &&
      this.finishActive &&
      ball.x - ball.radius > this.finishLineX
    ) {
      // Confirm the door hasn't closed over this ball's y position
      const closeFrac = clamp(
        this.finishGateAge / CONFIG.FINISH_GATE_CLOSE_SECS,
        0,
        1,
      );
      const doorReach = closeFrac * (CONFIG.SCENE_HEIGHT / 2);
      const blockedByTop = ball.y - ball.radius < doorReach;
      const blockedByBottom =
        ball.y + ball.radius > CONFIG.SCENE_HEIGHT - doorReach;
      if (!blockedByTop && !blockedByBottom) {
        ball.finished = true;
        ball.finishedAt = this.elapsedMs;
        ball.healthAtFinish = ball.health;
        ball.spinDrive = 0;
        ball.omega = Math.min(ball.omega, ball.vx / ball.radius);
      }
    }
  }

  resolveCollisions(dt) {
    this.smallBalls.forEach((small) => {
      if (!small.alive || small.finished) return;

      const dx = small.x - this.largeBall.x;
      const dy = small.y - this.largeBall.y;
      const distance = Math.hypot(dx, dy);
      const minDist = small.radius + this.largeBall.radius;

      if (distance < minDist) {
        const normalX = dx / (distance || 1);
        const normalY = dy / (distance || 1);
        const overlap = minDist - distance;
        const massRatio = CONFIG.LARGE_BALL_MASS_RATIO;
        const smallShare = massRatio / (massRatio + 1); // fraction of overlap pushed onto small ball
        small.x += normalX * overlap * smallShare;
        small.y += normalY * overlap * smallShare;
        this.largeBall.x -= normalX * overlap * (1 - smallShare);
        this.largeBall.y -= normalY * overlap * (1 - smallShare);

        const relVel =
          (this.largeBall.vx - small.vx) * normalX +
          (this.largeBall.vy - small.vy) * normalY;
        if (relVel > 0) {
          const impulse = relVel * 0.6;
          this.largeBall.vx -= (impulse / massRatio) * normalX;
          this.largeBall.vy -= (impulse / massRatio) * normalY;
          small.vx += impulse * smallShare * normalX;
          small.vy += impulse * smallShare * normalY;
        }

        // Spin transfer: Big Red rotates clockwise (omega = vx / radius).
        // Surface velocity at contact point = omega * R * (-normalY, normalX).
        // omega * R simplifies to vx, so the tangential kick scales directly with Big Red's speed.
        const spinImpulse = this.largeBall.vx * CONFIG.SPIN_TRANSFER;
        small.vx += spinImpulse * -normalY;
        small.vy += spinImpulse * normalX;
        // Also spin up the small ball — tangential impulse becomes angular momentum
        small.omega += spinImpulse / small.radius;

        small.health -= CONFIG.DAMAGE_PER_SECOND * dt;
        if (small.health <= 0) {
          small.health = 0;
          small.alive = false;
          small.vx = 0;
          small.vy = 0;
          for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
            const speed = 60 + Math.random() * 140;
            this.particles.push({
              x: small.x,
              y: small.y,
              vx: Math.cos(angle) * speed,
              vy: Math.sin(angle) * speed - 60,
              radius: 2 + Math.random() * 2,
              alpha: 1,
            });
          }
        }
      }
    });
  }

  updateCamera(dt) {
    let targetX;
    if (this.finishActive) {
      // Drift so the gate sits at the horizontal centre of the canvas
      const gateCentreTarget = this.finishLineX - this.canvas.clientWidth / 2;
      targetX = clamp(
        gateCentreTarget,
        0,
        this.sceneWidth - this.canvas.clientWidth,
      );
      // Stop scrolling once the gate is already centred
      if (Math.abs(this.cameraX - targetX) < 1) return;
    } else {
      targetX = clamp(
        this.largeBall.x - CONFIG.CAMERA_OFFSET_X,
        0,
        this.sceneWidth - this.canvas.clientWidth,
      );
    }
    this.cameraX = lerp(this.cameraX, targetX, CONFIG.CAMERA_LERP);
  }

  updateScoreboard() {
    const aliveBalls = this.smallBalls.filter((ball) => ball.alive).length;

    this.ui.timer.innerText = this.finishActive
      ? "FINISH GATE OPEN"
      : `Time ${formatTime(this.gameDurationMs - this.elapsedMs)}`;
    this.ui.aliveSummary.innerText = `Alive ${aliveBalls} / ${CONFIG.BALL_COUNT}`;

    const chunkWidth = this.sceneWidth / this.terrainChunks;
    const segmentsSeen = Math.min(
      Math.floor((this.cameraX + this.canvas.clientWidth) / chunkWidth),
      this.terrainChunks,
    );
    this.ui.diagnostics.innerHTML = `
      <div class="diagnostics__row"><span>Seed</span><span class="diagnostics__value">${this.seed.toString(16).toUpperCase()}</span></div>
      <div class="diagnostics__row"><span>Segments</span><span class="diagnostics__value">${segmentsSeen} / ${this.terrainChunks}</span></div>
      <div class="diagnostics__row"><span>Big Red vx</span><span class="diagnostics__value">${Math.round(this.largeBall.vx)}</span></div>
      <div class="diagnostics__row"><span>Big Red vy</span><span class="diagnostics__value">${Math.round(this.largeBall.vy)}</span></div>
      <div class="diagnostics__row"><span>Speed scale</span><span class="diagnostics__value">${(this.largeBallSpeedScale * this.allBallsSpeedScale).toFixed(2)}</span></div>
      <div class="diagnostics__row"><span>P (Big Red)</span><span class="diagnostics__value">${this.largeBallPaused ? "paused" : "running"}</span></div>
      <div class="diagnostics__row"><span>O (all balls)</span><span class="diagnostics__value">${this.allBallsPaused ? "paused" : "running"}</span></div>
    `;

    // Build team groups once per game
    if (!this.ui.healthGrid.querySelector(".team-group")) {
      this.ui.healthGrid.innerHTML = "";
      const teamOrder = [...new Set(BALL_ROSTER.map((b) => b.team))];
      teamOrder.forEach((team) => {
        const group = document.createElement("div");
        group.className = "team-group";
        group.dataset.team = team;

        const label = document.createElement("div");
        label.className = "team-label";
        label.textContent = team;
        group.appendChild(label);

        this.smallBalls
          .filter((b) => b.team === team)
          .forEach((ball) => {
            const track = document.createElement("div");
            track.className = "team-track";
            track.dataset.id = String(ball.id);
            track.title = ball.name;
            const fill = document.createElement("div");
            fill.className = "team-bar-fill";
            fill.style.backgroundColor = ball.color;
            track.appendChild(fill);
            group.appendChild(track);
          });

        this.ui.healthGrid.appendChild(group);
      });
    }

    // Update bars each frame
    this.smallBalls.forEach((ball) => {
      const track = this.ui.healthGrid.querySelector(
        `.team-track[data-id="${ball.id}"]`,
      );
      if (!track) return;
      const fill = track.querySelector(".team-bar-fill");
      if (!fill) return;
      if (!ball.alive) {
        fill.style.width = "0%";
        track.classList.add("team-track--dead");
        track.classList.remove("team-track--finished");
      } else if (ball.finished) {
        // Keep health bar at whatever level it was; just add the checkmark class
        fill.style.width = `${clamp(ball.health / CONFIG.SMALL_BALL_HEALTH, 0, 1) * 100}%`;
        track.classList.add("team-track--finished");
        track.classList.remove("team-track--dead");
        if (!track.querySelector(".team-check")) {
          const check = document.createElement("span");
          check.className = "team-check";
          check.textContent = "✓";
          check.style.color = ball.color;
          track.appendChild(check);
        }
      } else {
        fill.style.width = `${clamp(ball.health / CONFIG.SMALL_BALL_HEALTH, 0, 1) * 100}%`;
        track.classList.remove("team-track--dead", "team-track--finished");
        const staleCheck = track.querySelector(".team-check");
        if (staleCheck) staleCheck.remove();
      }
    });
  }

  draw() {
    const ctx = this.ctx;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = "#131523";
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.translate(-this.cameraX, 0);
    this.drawTerrain(ctx);
    this.drawBackWall(ctx);
    this.drawFinishLine(ctx);
    this.drawBalls(ctx);
    this.drawParticles(ctx);
    ctx.restore();

    if (this.paused && !this.gameOver) {
      ctx.fillStyle = "rgba(12, 14, 27, 0.74)";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#eef3ff";
      ctx.font = "bold 36px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Paused — press Space to resume", width / 2, height / 2);
    }
  }

  drawParticles(ctx) {
    this.particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = "#999";
      ctx.fill();
      ctx.restore();
    });
  }

  drawBackWall(ctx) {
    const x = this.backWallRightX - 20;
    const grey = 90;
    const white = 255;
    const c = Math.round(grey + (white - grey) * this.backWallFlash);
    ctx.save();
    ctx.fillStyle = `rgb(${c},${c},${c})`;
    ctx.shadowColor = `rgba(255,255,255,${this.backWallFlash * 0.7})`;
    ctx.shadowBlur = 24 * this.backWallFlash;
    ctx.fillRect(x, 0, 20, CONFIG.SCENE_HEIGHT);
    ctx.restore();
  }

  drawTerrain(ctx) {
    ctx.save();
    ctx.beginPath();
    const points = this.terrain.points;
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.lineTo(points[points.length - 1].x, CONFIG.SCENE_HEIGHT);
    ctx.lineTo(points[0].x, CONFIG.SCENE_HEIGHT);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.SCENE_HEIGHT);
    gradient.addColorStop(0, "#2f2e40");
    gradient.addColorStop(1, "#0f1124");
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = "#6f7ac1";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.forEach((point) => ctx.lineTo(point.x, point.y));
    ctx.stroke();
    ctx.restore();
  }

  drawFinishLine(ctx) {
    if (!this.finishActive) return;
    ctx.save();

    const x = this.finishLineX;
    const h = CONFIG.SCENE_HEIGHT;
    const w = CONFIG.FINISH_GATE_WIDTH;
    const t = this.elapsedMs / 1000;
    const closeFrac = clamp(
      this.finishGateAge / CONFIG.FINISH_GATE_CLOSE_SECS,
      0,
      1,
    );
    const doorReach = closeFrac * (h / 2);
    const isStopped =
      this.gameOver !== null ||
      this.finishGateAge >= CONFIG.FINISH_GATE_CLOSE_SECS;

    let r, g, b, glowR, glowG, glowB, glowAlpha;

    if (isStopped) {
      // Doors have settled — white with a slow breathing glow
      const breathe = 0.5 + 0.5 * Math.sin(t * 1.4);
      r = g = b = 255;
      glowR = 255;
      glowG = 255;
      glowB = 255;
      glowAlpha = 0.15 + breathe * 0.45;
    } else {
      // Closing — cycle between red and white, faster as it closes
      const cycleSpeed = 2 + closeFrac * 4;
      const cycle = 0.5 + 0.5 * Math.sin(t * cycleSpeed * Math.PI);
      // red = (255,50,50), white = (255,255,255)
      r = 255;
      g = Math.round(50 + cycle * 205);
      b = Math.round(50 + cycle * 205);
      glowR = 255;
      glowG = Math.round(g * 0.4);
      glowB = Math.round(b * 0.4);
      glowAlpha = 0.2 + closeFrac * 0.5;
    }

    const doorColor = `rgb(${r},${g},${b})`;
    const glowColor = `rgba(${glowR},${glowG},${glowB},${glowAlpha.toFixed(2)})`;

    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 18 + closeFrac * 14;

    // Top door
    ctx.fillStyle = doorColor;
    ctx.fillRect(x - w / 2, 0, w, doorReach);

    // Bottom door
    ctx.fillRect(x - w / 2, h - doorReach, w, doorReach);

    ctx.shadowBlur = 0;

    // Dashed gap line in the open section
    const gapTop = doorReach;
    const gapBottom = h - doorReach;
    if (gapBottom > gapTop) {
      ctx.strokeStyle = doorColor;
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(x, gapTop);
      ctx.lineTo(x, gapBottom);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  drawBalls(ctx) {
    const drawBall = (ball) => {
      if (ball.type === "small" && !ball.alive) return;
      ctx.save();

      if (ball.type === "large") {
        // Draw Big Red as a rotating SVG
        const size = ball.radius * 2;
        ctx.translate(ball.x, ball.y);
        ctx.rotate(ball.angle);
        ctx.shadowColor = "rgba(232, 73, 63, 0.5)";
        ctx.shadowBlur = 28;
        ctx.drawImage(this.bigRedImage, -size / 2, -size / 2, size, size);
      } else {
        // Small balls: filled circle
        ctx.beginPath();
        ctx.fillStyle = ball.color;
        ctx.shadowColor = "rgba(0, 0, 0, 0.35)";
        ctx.shadowBlur = 12;
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        if (ball.alive) {
          ctx.strokeStyle = "rgba(255,255,255,0.35)";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // Rotation pip for small balls
      if (ball.type === "small" && ball.alive) {
        ctx.beginPath();
        ctx.arc(
          ball.x + Math.cos(ball.angle) * ball.radius * 0.52,
          ball.y + Math.sin(ball.angle) * ball.radius * 0.52,
          ball.radius * 0.28,
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = "rgba(255,255,255,0.55)";
        ctx.fill();
      }

      ctx.restore();

      if (ball.type === "small" && ball.alive) {
        const barWidth = ball.radius * 1.8;
        const healthRatio = clamp(ball.health / CONFIG.SMALL_BALL_HEALTH, 0, 1);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(
          ball.x - barWidth / 2,
          ball.y + ball.radius + 10,
          barWidth,
          6,
        );
        ctx.fillStyle = healthRatio > 0.4 ? "#9eed74" : "#ef6f6f";
        ctx.fillRect(
          ball.x - barWidth / 2,
          ball.y + ball.radius + 10,
          barWidth * healthRatio,
          6,
        );
      }
    };

    drawBall(this.largeBall);
    this.smallBalls.forEach(drawBall);
  }
}
