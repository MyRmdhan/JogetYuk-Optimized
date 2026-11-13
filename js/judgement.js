// ============================================================
// 🎯 JUDGEMENT.JS — sistem penilaian arrow: zona bayangan + deteksi
// transisi pose. LOGIC DI FILE INI TIDAK BERUBAH SAMA SEKALI dari
// versi sebelum modularisasi - murni dipindah lokasi filenya saja.
// ============================================================

function resetJudgementState() {
  previousPoseForTransition = null;
  lastTransitionTime = {};
  transitionConsumed = {};
  targetPulses = {};
}

function judgeArrow(arrow, type, tier) {
  arrow.judged = true;

  if (type === "hit") {
    combo++;
    const basePoints = tier === "perfect" ? 100 : 50;
    const multiplier = getComboMultiplier(combo);
    score += basePoints * multiplier;

    playSoundEffect(soundEffects.hit);
    triggerTargetPulse(
      arrow.symbol,
      tier === "perfect" ? "perfect" : "good",
      tier === "perfect" ? "Perfect!" : "Good!"
    );
    checkComboMilestone();
  } else if (type === "too_early") {
    combo = 0;
    totalMisses++;
    playSoundEffect(soundEffects.miss);
    triggerTargetPulse(arrow.symbol, "too_early", "Too Early!");
    checkGameOverByMisses();
  } else {
    combo = 0;
    totalMisses++;
    playSoundEffect(soundEffects.miss);
    triggerTargetPulse(arrow.symbol, "miss", "Miss");
    checkGameOverByMisses();
  }
}

function triggerTargetPulse(symbol, type, message) {
  targetPulses[symbol] = { type, message, startedAt: performance.now() };
}

function getPulseColor(type) {
  switch (type) {
    case "perfect":
      return { fill: "rgba(255,215,0,0.45)", glow: "#ffd700" };
    case "good":
      return { fill: "rgba(0,255,89,0.4)", glow: "#00fff7" };
    case "too_early":
      return { fill: "rgba(255,136,0,0.45)", glow: "#ff8800" };
    default:
      return { fill: "rgba(255,0,17,0.5)", glow: "#ff00c8" };
  }
}

function checkHits() {
  if (!gameStarted || gameEnded || !currentAudio) return;
  const t = currentAudio.currentTime;

  arrows.forEach((arrow) => {
    if (arrow.judged) return;

    const expected = directionMap[arrow.symbol];
    const judgeZoneStart = arrow.beatTime - JUDGE_ZONE_LEAD_SEC;
    const missCutoff = arrow.beatTime + GOOD_WINDOW_SEC;

    if (t < judgeZoneStart) return;

    if (currentPose === expected) {
      const transitionTime = lastTransitionTime[expected];
      const isFresh =
        transitionTime !== undefined &&
        transitionTime >= judgeZoneStart &&
        !transitionConsumed[expected];

      if (isFresh) {
        transitionConsumed[expected] = true;
        const diff = Math.abs(transitionTime - arrow.beatTime);
        const tier = diff <= PERFECT_WINDOW_SEC ? "perfect" : "good";
        judgeArrow(arrow, "hit", tier);
      } else {
        judgeArrow(arrow, "too_early");
      }
      return;
    }

    if (t > missCutoff) {
      judgeArrow(arrow, "miss");
    }
  });

  arrows = arrows.filter((a) => !a.judged);
}
