import "./styles/main.scss";
import { Game } from "./game.js";

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
  };

  const game = new Game(canvas, ui);

  let selectedDuration = 300000; // default 5 min

  const durationBtns = document.querySelectorAll(".duration-btn");
  durationBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      durationBtns.forEach((b) => b.classList.remove("duration-btn--selected"));
      btn.classList.add("duration-btn--selected");
      selectedDuration = parseInt(btn.dataset.ms, 10);
    });
  });

  document.getElementById("start-btn").addEventListener("click", () => {
    game.begin(selectedDuration);
  });

  game.showStartScreen();
});
