// bigred-index.js - v 1.1.01

import "./styles/main.scss";
import { Game } from "./bigred-game.js";

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
document.addEventListener("contextmenu", (e) => e.preventDefault());

window.addEventListener("DOMContentLoaded", () => {
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
  };

  const game = new Game(canvas, ui);

  let selectedDuration = 300000;
  let selectedTiebreaker = "health";
  let selectedSmoothness = 80;

  const durationBtns = document.querySelectorAll(".duration-btn");
  durationBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      durationBtns.forEach((b) => b.classList.remove("duration-btn--selected"));
      btn.classList.add("duration-btn--selected");
      selectedDuration = parseInt(btn.dataset.ms, 10);
    });
  });

  const landscapeBtns = document.querySelectorAll(".landscape-btn");
  landscapeBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      landscapeBtns.forEach((b) =>
        b.classList.remove("landscape-btn--selected"),
      );
      btn.classList.add("landscape-btn--selected");
      selectedSmoothness = parseInt(btn.dataset.smoothness, 10);
    });
  });

  const tiebreakerBtns = document.querySelectorAll(".tiebreaker-btn");
  tiebreakerBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tiebreakerBtns.forEach((b) =>
        b.classList.remove("tiebreaker-btn--selected"),
      );
      btn.classList.add("tiebreaker-btn--selected");
      selectedTiebreaker = btn.dataset.tb;
    });
  });

  document.getElementById("start-btn").addEventListener("click", () => {
    game.begin(selectedDuration, selectedTiebreaker, selectedSmoothness);
  });

  document.getElementById("restart-btn").addEventListener("click", () => {
    game.showStartScreen();
  });

  // ── In-game control buttons ───────────────────────────────────────────────
  const TIME_STEPS = [0.25, 0.5, 1, 2, 4, 8, 16];

  const btnPauseGame    = document.getElementById("ctrl-pause-game");
  const btnPauseBigRed  = document.getElementById("ctrl-pause-bigred");
  const btnPauseMarbles = document.getElementById("ctrl-pause-marbles");
  const btnSpeedDown    = document.getElementById("ctrl-speed-down");
  const btnSpeedUp      = document.getElementById("ctrl-speed-up");
  const speedDisplay    = document.getElementById("ctrl-speed-display");

  const syncControlButtons = () => {
    btnPauseGame.classList.toggle("ctrl-btn--active", game.paused);
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

  const creditsModal = document.getElementById("credits-modal");
  const creditsBtn = document.getElementById("credits-btn");
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
