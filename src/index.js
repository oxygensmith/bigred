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
  };

  const game = new Game(canvas, ui);
  game.start();
});
