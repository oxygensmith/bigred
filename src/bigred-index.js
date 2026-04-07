// bigred-index.js - v 1.2.0

import "./styles/main.scss";
import { Game, VERSION } from "./bigred-game.js";

// Prevent scroll/pinch on the document but leave buttons and inputs alone
// passive: false is required so preventDefault() is honoured on iOS Safari
document.addEventListener("touchmove", (e) => {
  if (!e.target.closest("button, a, input, select, textarea")) {
    e.preventDefault();
  }
}, { passive: false });
document.addEventListener("touchstart", (e) => {
  if (e.touches.length > 1) e.preventDefault(); // block pinch-zoom
}, { passive: false });
// Suppress context menu on touch devices only (right-click is useful on desktop)
if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
  document.addEventListener("contextmenu", (e) => e.preventDefault());
}

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("version-text").textContent = `Version ${VERSION}`;

  const canvas = document.getElementById("game-canvas");
  const ui = {
    timer: document.getElementById("timer"),
    aliveSummary: document.getElementById("alive-summary"),
    healthGrid: document.getElementById("health-grid"),
    diagnostics: document.getElementById("diagnostics"),
    endOverlay: document.getElementById("end-overlay"),
    endHeadline: document.getElementById("end-headline"),
    endSubline: document.getElementById("end-subline"),
    startOverlay: document.getElementById("start-overlay"),
    pauseOverlay: document.getElementById("pause-overlay"),
    leaderboardOverlay: document.getElementById("leaderboard-overlay"),
    leaderboardBody: document.getElementById("leaderboard-body"),
    leaderboardPodium: document.getElementById("leaderboard-podium"),
  };

  const game = new Game(canvas, ui);
  game.startDemo();

  let selectedDuration = 300000;
  let selectedTiebreaker = "health";
  let selectedSmoothness = 80;

  // ── Start screen tabs ─────────────────────────────────────────────────────
  const startTabs = document.querySelectorAll(".start-tab");
  startTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      startTabs.forEach((t) => t.classList.remove("start-tab--active"));
      tab.classList.add("start-tab--active");
      document.querySelectorAll(".start-panel").forEach((p) => p.classList.remove("start-panel--active"));
      document.getElementById(`panel-${tab.dataset.panel}`).classList.add("start-panel--active");
    });
  });

  const durationSpeeds = {
    120000: 300,   // 2 min  → 250% of 120
    180000: 180,   // 3 min  → 150% of 120
    300000: 120,   // 5 min  → base speed
    600000: 60,    // 10 min → 50% of 120
    1200000: 30,   // 20 min → 25% of 120
  };

  const durationBtns = document.querySelectorAll(".duration-btn");
  durationBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("duration-btn--selected")) return;
      durationBtns.forEach((b) => b.classList.remove("duration-btn--selected"));
      btn.classList.add("duration-btn--selected");
      selectedDuration = parseInt(btn.dataset.ms, 10);
      game.demoSpeed = durationSpeeds[selectedDuration] ?? 120;
    });
  });

  const landscapeBtns = document.querySelectorAll(".landscape-btn");
  landscapeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("landscape-btn--selected")) return;
      landscapeBtns.forEach((b) => b.classList.remove("landscape-btn--selected"));
      btn.classList.add("landscape-btn--selected");
      selectedSmoothness = parseInt(btn.dataset.smoothness, 10);
      game.startDemo(selectedSmoothness);
    });
  });

  const tiebreakerBtns = document.querySelectorAll(".tiebreaker-btn");
  tiebreakerBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tiebreakerBtns.forEach((b) => b.classList.remove("tiebreaker-btn--selected"));
      btn.classList.add("tiebreaker-btn--selected");
      selectedTiebreaker = btn.dataset.tb;
    });
  });

  // ── Physics sub-tabs ────────────────────────────────────────────────────────
  const physicsTabs = document.querySelectorAll(".physics-tab");
  const physicsPanels = document.querySelectorAll(".physics-panel");
  physicsTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      physicsTabs.forEach((t) => t.classList.remove("physics-tab--active"));
      physicsPanels.forEach((p) => p.classList.remove("physics-panel--active"));
      tab.classList.add("physics-tab--active");
      document.getElementById(`physics-${tab.dataset.physics}`).classList.add("physics-panel--active");
    });
  });

  // ── Physics option buttons ───────────────────────────────────────────────────
  const physicsBtns = document.querySelectorAll(".physics-btn");
  physicsBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.classList.contains("physics-btn--selected")) return;
      const key = btn.dataset.config;
      physicsBtns.forEach((b) => {
        if (b.dataset.config === key) b.classList.remove("physics-btn--selected");
      });
      btn.classList.add("physics-btn--selected");
      const raw = btn.dataset.value;
      game.setConfig(key, isNaN(Number(raw)) ? raw : parseFloat(raw));
    });
  });

  document.getElementById("start-btn").addEventListener("click", () => {
    game.begin(selectedDuration, selectedTiebreaker, selectedSmoothness);
  });

  document.getElementById("resume-btn").addEventListener("click", () => {
    game.togglePause();
  });

  document.getElementById("close-leaderboard-btn").addEventListener("click", () => {
    game.hideLeaderboard();
  });

  document.getElementById("restart-btn").addEventListener("click", () => {
    game.showStartScreen();
    syncControlButtons();
  });

  document.getElementById("ctrl-restart").addEventListener("click", () => {
    game.terminate();
    syncControlButtons();
  });

  // ── In-game control buttons ───────────────────────────────────────────────
  const TIME_STEPS = [0.25, 0.5, 1, 2, 4, 8, 16];

  const btnPauseGame    = document.getElementById("ctrl-pause-game");
  const btnPauseBigRed  = document.getElementById("ctrl-pause-bigred");
  const btnPauseMarbles = document.getElementById("ctrl-pause-marbles");
  const btnSpeedDown    = document.getElementById("ctrl-speed-down");
  const btnSpeedUp      = document.getElementById("ctrl-speed-up");
  const speedDisplay    = document.getElementById("ctrl-speed-display");
  const iconPause       = document.getElementById("icon-pause");
  const iconPlay        = document.getElementById("icon-play");

  const syncControlButtons = () => {
    // Swap pause/play icon based on game state
    const isPaused = game.paused;
    iconPause.style.display = isPaused ? "none"  : "";
    iconPlay.style.display  = isPaused ? ""      : "none";
    btnPauseGame.classList.toggle("ctrl-btn--active", isPaused);

    btnPauseBigRed.classList.toggle("ctrl-btn--active", game.largeBallPaused);
    btnPauseMarbles.classList.toggle("ctrl-btn--active", game.allBallsPaused);
    speedDisplay.textContent = `${game.timeScale}×`;
    btnSpeedDown.disabled = TIME_STEPS.indexOf(game.timeScale) === 0;
    btnSpeedUp.disabled   = TIME_STEPS.indexOf(game.timeScale) === TIME_STEPS.length - 1;
  };

  btnPauseGame.addEventListener("click", () => {
    if (!game.gameOver) { game.togglePause(); syncControlButtons(); }
  });

  btnPauseBigRed.addEventListener("click", () => {
    game.largeBallPaused = !game.largeBallPaused;
    if (!game.largeBallPaused) game.largeBallSpeedScale = 1;
    syncControlButtons();
  });

  btnPauseMarbles.addEventListener("click", () => {
    game.allBallsPaused = !game.allBallsPaused;
    syncControlButtons();
  });

  btnSpeedDown.addEventListener("click", () => {
    const idx = TIME_STEPS.indexOf(game.timeScale);
    if (idx > 0) { game.timeScale = TIME_STEPS[idx - 1]; syncControlButtons(); }
  });

  btnSpeedUp.addEventListener("click", () => {
    const idx = TIME_STEPS.indexOf(game.timeScale);
    if (idx < TIME_STEPS.length - 1) { game.timeScale = TIME_STEPS[idx + 1]; syncControlButtons(); }
  });

  // Keep buttons in sync when keyboard shortcuts are used
  const _origTogglePause = game.togglePause.bind(game);
  game.togglePause = () => { _origTogglePause(); syncControlButtons(); };

  syncControlButtons();

  // Auto-pause when the tab/window loses focus; resume only if we caused the pause
  let autoPaused = false;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (!game.paused && !game.gameOver) {
        game.togglePause();
        autoPaused = true;
      }
    } else {
      if (autoPaused && game.paused) {
        game.togglePause();
      }
      autoPaused = false;
    }
  });

  // ── Stats panel (S key + button toggle) ──────────────────────────────────
  const statsPanel  = document.getElementById("stats-panel");
  const btnStats    = document.getElementById("ctrl-stats");

  const syncStatsButton = () => {
    btnStats.classList.toggle("ctrl-btn--active", !statsPanel.classList.contains("stats-panel--hidden"));
  };

  const toggleStats = () => {
    statsPanel.classList.toggle("stats-panel--hidden");
    syncStatsButton();
  };

  btnStats.addEventListener("click", toggleStats);

  document.addEventListener("keydown", (e) => {
    if (e.code === "KeyS" && !e.metaKey && !e.ctrlKey) toggleStats();
  });

  // ── Credits ───────────────────────────────────────────────────────────────
  const creditsModal = document.getElementById("credits-modal");
  const creditsBtn   = document.getElementById("credits-btn");
  const creditsClose = document.getElementById("credits-close");

  creditsBtn.addEventListener("click", () => {
    if (!game.paused && !game.gameOver) game.togglePause();
    creditsModal.classList.remove("credits-modal--hidden");
  });

  const closeCredits = () => {
    creditsModal.classList.add("credits-modal--hidden");
    if (game.paused && !game.gameOver) game.togglePause();
  };

  creditsClose.addEventListener("click", closeCredits);
  creditsModal.addEventListener("click", (e) => {
    if (e.target === creditsModal) closeCredits();
  });

  game.showStartScreen();
});
