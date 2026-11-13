// ============================================================
// 🚀 MAIN.JS — entry point aplikasi: setup awal (model, webcam, canvas),
// render loop, predict loop, dan kontrol alur permainan
// (start/reset/end game, timer). File ini dimuat PALING TERAKHIR karena
// memanggil fungsi-fungsi dari semua modul lain.
// ============================================================

async function init() {
  document.getElementById("start-btn").disabled = true;

  try {
    await tf.setBackend("webgl");
    await tf.ready();
  } catch (e) {
    console.warn("WebGL backend gagal diaktifkan, performa mungkin turun:", e);
  }
  debugLog("TF.js backend aktif:", tf.getBackend());

  const modelURL = URL + "model.json";
  const metadataURL = URL + "metadata.json";
  model = await tmPose.load(modelURL, metadataURL);

  webcam = new tmPose.Webcam(400, 400, true);
  await webcam.setup();
  await webcam.play();

  document.getElementById("webcam-container").appendChild(webcam.canvas);

  gameCanvas = document.getElementById("game-canvas");
  ctxGame = gameCanvas.getContext("2d");
  ctxGame.imageSmoothingEnabled = true;

  setInterval(() => checkHits(), 50);

  requestAnimationFrame(renderLoop);
  predictIntervalId = setInterval(runPredictSafely, PREDICT_INTERVAL_MS);

  await loadSongList();
  checkAllSongAvailability();

  document.getElementById("music-select").addEventListener("change", updateSongAvailabilityUI);

  setupNavigation();
}

// Cek apakah kita lagi di halaman yang beneran butuh kamera+ML aktif.
// Dipakai buat "mengistirahatkan" inferensi PoseNet & render loop saat user
// cuma lagi navigasi menu (welcome/howto/pilih level/leaderboard) - soalnya
// sebelumnya loop ini jalan TERUS dari awal buka app, buang-buang GPU/CPU
// yang harusnya nganggur pas belum masuk ke game.
function isGameplayPageActive() {
  const gamePage = document.getElementById("game-page");
  const calibPage = document.getElementById("calibration-page");
  return (
    (gamePage && gamePage.classList.contains("active")) ||
    (calibPage && calibPage.classList.contains("active"))
  );
}

function renderLoop(timestamp) {
  if (lastFrameTimestamp === null) lastFrameTimestamp = timestamp;
  const deltaTimeSec = Math.min((timestamp - lastFrameTimestamp) / 1000, 0.05);
  lastFrameTimestamp = timestamp;

  if (isGameplayPageActive()) {
    webcam.update();
    drawSkeletonOverlay();
    updateBeatSpawner();
    drawGameCanvas(deltaTimeSec);
  }

  requestAnimationFrame(renderLoop);
}

async function runPredictSafely() {
  if (predictBusy) return;
  if (!isGameplayPageActive()) return;
  predictBusy = true;
  try {
    await predict();
  } catch (e) {
    console.warn("Predict error:", e);
  } finally {
    predictBusy = false;
  }
}

async function predict() {
  const { pose, posenetOutput } = await model.estimatePose(webcam.canvas);
  previousPoseData = currentPoseDataForSkeleton || pose;
  currentPoseDataForSkeleton = pose;
  lastPoseUpdateTime = performance.now();

  const prediction = await model.predict(posenetOutput);

  let highest = prediction[0];
  for (let i = 1; i < prediction.length; i++) {
    if (prediction[i].probability > highest.probability) highest = prediction[i];
  }

  currentPose = highest.probability > 0.75 ? highest.className : "normal";
  document.getElementById("pose-result").textContent = currentPose;
  updateCalibrationUI(highest);

  if (currentPose !== previousPoseForTransition && POSE_DIRECTIONS.includes(currentPose)) {
    if (gameStarted && currentAudio) {
      lastTransitionTime[currentPose] = currentAudio.currentTime;
      transitionConsumed[currentPose] = false;
    }
  }
  previousPoseForTransition = currentPose;
}

function startGame() {
  if (songUnavailable) return;

  document.getElementById("start-btn").style.display = "none";
  const musicSelector = document.querySelector(".music-selector");
  if (musicSelector) musicSelector.style.display = "none";

  if (backsound && !backsound.paused) {
    backsound.pause();
    backsound.currentTime = 0;
  }

  totalMisses = 0;
  countdownValue = 3;
  score = 0;
  combo = 0;
  arrows = [];
  floatingTexts = [];
  gameEnded = false;
  resetJudgementState();

  const selectedMusic = document.getElementById("music-select").value;

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  currentAudio = new Audio(selectedMusic);
  soundEffects.countdown.play();

  currentAudio.addEventListener("loadedmetadata", () => {
    timerValue = Math.floor(currentAudio.duration) || 120;
  });
  currentAudio.load();

  buildBeatSchedule(selectedMusic);

  countdownInterval = setInterval(() => {
    countdownValue--;

    if (countdownValue <= 0) {
      clearInterval(countdownInterval);
      gameStarted = true;

      currentAudio.play();
      startTimer();
    }
  }, 1000);
}

// Skor otomatis tersimpan pakai nama yg direkam di awal, tidak nanya lagi
function endGame() {
  if (gameEnded) return;
  gameEnded = true;
  gameStarted = false;

  if (currentAudio) currentAudio.pause();
  document.getElementById("restart-btn").style.display = "inline-block";

  const song = document.getElementById("music-select").value;
  if (score > 0) {
    saveScoreToLeaderboard(song, currentDifficulty, playerName, score);
  }
}

function resetGame() {
  soundEffects.button.play();
  gameStarted = false;
  gameEnded = false;

  totalMisses = 0;
  score = 0;
  combo = 0;
  arrows = [];
  floatingTexts = [];
  timerValue = 120;
  countdownValue = 3;

  beatSchedule = [];
  nextBeatIndex = 0;
  resetJudgementState();
  shakeMagnitude = 0;
  shakeEndTime = 0;

  clearInterval(timerInterval);
  clearInterval(countdownInterval);

  document.getElementById("restart-btn").style.display = "none";
  document.getElementById("start-btn").style.display = "inline-block";
  const musicSelector = document.querySelector(".music-selector");
  if (musicSelector) musicSelector.style.display = "flex";

  updateSongAvailabilityUI();

  if (backsound.paused) {
    backsound.currentTime = 0;
    backsound.play().catch((e) => console.warn("Gagal memutar backsound:", e));
  }

  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }

  if (ctxGame) ctxGame.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
  document.getElementById("pose-result").textContent = "-";
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    timerValue--;

    if (timerValue <= 0) {
      clearInterval(timerInterval);
      endGame();
    }
  }, 1000);
}

function selectDifficulty(level) {
  currentDifficulty = level;
  maxMisses = DIFFICULTY_MISSES[level] ?? 20;
}

window.addEventListener("load", () => {
  init();
  backsound.play().catch((err) => console.warn("Autoplay ditolak oleh browser:", err));

  document.getElementById("start-btn").addEventListener("click", startGame);
  document.getElementById("restart-btn").addEventListener("click", resetGame);

  // Fallback: kalau autoplay musik menu diblokir browser, coba lagi begitu
  // user pertama kali klik tombol "Mulai" di welcome page.
  const welcomeStartBtn = document.getElementById("welcome-start-btn");
  if (welcomeStartBtn) {
    welcomeStartBtn.addEventListener(
      "click",
      () => {
        if (backsound.paused) {
          backsound.play().catch((e) => console.warn("Musik menu tetap diblokir:", e));
        }
      },
      { once: true }
    );
  }
});
