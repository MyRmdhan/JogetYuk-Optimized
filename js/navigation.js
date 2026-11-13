// ============================================================
// 🧭 NAVIGATION.JS — navigasi SPA antar "halaman". Logic tidak berubah,
// murni dipindah lokasi filenya dari file monolitik sebelumnya.
// ============================================================

function showPage(pageId) {
  soundEffects.button.play();
  document.querySelectorAll(".page").forEach((p) => p.classList.remove("active"));

  const target = document.getElementById(pageId);
  if (target) target.classList.add("active");

  const globalNav = document.getElementById("global-nav-buttons");
  if (globalNav) {
    globalNav.style.display = pageId === "welcome-page" ? "flex" : "none";
  }
}

function setupNavigation() {
  document.querySelectorAll("[data-target]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.target;

      if (target === "select-level-page") {
        const nameInput = document.getElementById("player-name-input");
        const newName = nameInput.value.trim();
        if (newName) playerName = newName;
      }

      if (target === "leaderboard-page") {
        populateLeaderboardSongSelect();
        renderLeaderboardPage();
      }

      showPage(target);
    });
  });

  document.querySelectorAll("[data-difficulty]").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectDifficulty(btn.dataset.difficulty);
      if (ctxGame) ctxGame.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
      document.getElementById("pose-result").textContent = "-";
      showPage("game-page");
    });
  });

  document.getElementById("back-to-menu").addEventListener("click", () => {
    const doExit = () => {
      resetGame();
      showPage("enter-name-page");
    };
    if (gameStarted) {
      if (confirm("Keluar dari permainan? Progres tidak akan disimpan.")) doExit();
    } else {
      doExit();
    }
  });

  document.getElementById("howto-calibrate-btn").addEventListener("click", openCalibration);
  document.getElementById("calibration-done-btn").addEventListener("click", closeCalibration);

  document
    .getElementById("leaderboard-song-select")
    .addEventListener("change", renderLeaderboardPage);
  document
    .getElementById("leaderboard-difficulty-select")
    .addEventListener("change", renderLeaderboardPage);
}
