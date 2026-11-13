// ============================================================
// 🔥 COMBO.JS — multiplier skor & efek shake. Logic tidak berubah,
// murni dipindah lokasi filenya dari file monolitik sebelumnya.
// ============================================================

function getComboMultiplier(comboValue) {
  const tierIndex = Math.min(3, Math.floor(comboValue / 10));
  return [1, 2, 3, 4][tierIndex];
}

function checkComboMilestone() {
  if (combo > 0 && combo % 10 === 0) {
    const reachedTier = Math.min(4, combo / 10);
    const magIndex = Math.min(COMBO_SHAKE_MAGNITUDE.length - 1, reachedTier - 1);
    triggerShake(COMBO_SHAKE_MAGNITUDE[magIndex]);

    floatingTexts.push({
      text: `🔥 COMBO x${getComboMultiplier(combo)}!`,
      x: gameCanvas.width / 2,
      y: gameCanvas.height / 2,
      opacity: 1,
      big: true,
    });
  }
}

function checkGameOverByMisses() {
  if (totalMisses >= maxMisses) {
    endGame();
  }
}

function triggerShake(magnitude) {
  shakeMagnitude = magnitude;
  shakeEndTime = performance.now() + SHAKE_DURATION_MS;
}
