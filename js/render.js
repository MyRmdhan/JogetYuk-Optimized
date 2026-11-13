// ============================================================
// 🎨 RENDER.JS — semua fungsi yang menggambar ke canvas (game & skeleton
// overlay di webcam). Logic tidak berubah dari versi sebelumnya.
// ============================================================

function drawSkeletonOverlay() {
  if (!currentPoseDataForSkeleton) return;
  const ctx = webcam.canvas.getContext("2d");
  const minConfidence = 0.5;

  let keypointsToDraw = currentPoseDataForSkeleton.keypoints;

  if (previousPoseData && previousPoseData.keypoints) {
    const t = Math.min(1, (performance.now() - lastPoseUpdateTime) / PREDICT_INTERVAL_MS);
    keypointsToDraw = currentPoseDataForSkeleton.keypoints.map((kp, i) => {
      const prevKp = previousPoseData.keypoints[i];
      if (!prevKp) return kp;
      return {
        part: kp.part,
        score: kp.score,
        position: {
          x: prevKp.position.x + (kp.position.x - prevKp.position.x) * t,
          y: prevKp.position.y + (kp.position.y - prevKp.position.y) * t,
        },
      };
    });
  }

  tmPose.drawKeypoints(keypointsToDraw, minConfidence, ctx);
  tmPose.drawSkeleton(keypointsToDraw, minConfidence, ctx);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function drawGameCanvas(deltaTimeSec) {
  ctxGame.save();
  ctxGame.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

  const now = performance.now();
  if (now < shakeEndTime) {
    const remaining = (shakeEndTime - now) / SHAKE_DURATION_MS;
    const mag = shakeMagnitude * remaining;
    ctxGame.translate((Math.random() * 2 - 1) * mag, (Math.random() * 2 - 1) * mag);
  }

  function drawFuturisticText(
    text, x, y, size = 20, color = "#00fff7", glow = true, align = "center",
    font = "Orbitron, Arial, sans-serif"
  ) {
    ctxGame.save();
    ctxGame.font = `bold ${size}px ${font}`;
    ctxGame.textAlign = align;
    ctxGame.fillStyle = color;
    if (glow) {
      ctxGame.shadowColor = color;
      ctxGame.shadowBlur = 20;
    }
    ctxGame.fillText(text, x, y);
    ctxGame.restore();
  }

  if (!gameStarted && countdownValue === 3 && !gameEnded) {
    if (songUnavailable) {
      drawFuturisticText("🎵 Lagu ini belum tersedia", 200, 165, 20, "#ff4d6d", true);
      drawFuturisticText("untuk mode ritme.", 200, 192, 20, "#ff4d6d", true);
      drawFuturisticText("Yuk pilih lagu lain dulu!", 200, 219, 18, "#ff4d6d", true);
    } else {
      drawFuturisticText('Klik "Mulai Bermain"', 200, 170, 22, "#00fff7", true);
      drawFuturisticText("untuk mulai", 200, 200, 22, "#00fff7", true);
    }
    ctxGame.restore();
    return;
  }

  if (!gameStarted && countdownValue > 0 && !gameEnded) {
    drawFuturisticText(countdownValue, 200, 200, 90, "#00fff7", true);
    ctxGame.restore();
    return;
  }

  if (gameEnded) {
    soundEffects.finish.play();
    const reason = totalMisses >= maxMisses ? "Game Over!" : "Waktu Habis!";
    drawFuturisticText(reason, 200, 190, 30, "#ff00c8", true);
    drawFuturisticText("Skor Akhir: " + score, 200, 235, 26, "#00fff7", true);
    drawFuturisticText("Skor otomatis tersimpan ke leaderboard", 200, 270, 11, "#aaaaaa", false);
    ctxGame.restore();
    return;
  }

  ctxGame.save();
  ctxGame.strokeStyle = "#00fff7";
  ctxGame.shadowColor = "#00fff7";
  ctxGame.shadowBlur = 10;
  ctxGame.lineWidth = 2;
  ctxGame.beginPath();
  ctxGame.moveTo(0, targetY + 28);
  ctxGame.lineTo(gameCanvas.width, targetY + 28);
  ctxGame.stroke();
  ctxGame.restore();

  const shadowZoneY = targetY + JUDGE_ZONE_LEAD_SEC * ARROW_SPEED_PX_PER_SEC;
  ctxGame.save();
  ctxGame.setLineDash([6, 6]);
  ctxGame.strokeStyle = "rgba(0,255,247,0.35)";
  ctxGame.lineWidth = 1;
  ctxGame.beginPath();
  ctxGame.moveTo(0, shadowZoneY);
  ctxGame.lineTo(gameCanvas.width, shadowZoneY);
  ctxGame.stroke();
  ctxGame.restore();

  directions.forEach((symbol) => {
    const x = directionX[symbol];
    const pulse = targetPulses[symbol];

    if (pulse) {
      const elapsed = performance.now() - pulse.startedAt;
      if (elapsed < PULSE_DURATION_MS) {
        const alpha = 1 - elapsed / PULSE_DURATION_MS;
        const colorInfo = getPulseColor(pulse.type);

        ctxGame.save();
        ctxGame.globalAlpha = alpha;
        ctxGame.beginPath();
        ctxGame.arc(x, targetY, 34, 0, 2 * Math.PI);
        ctxGame.fillStyle = colorInfo.fill;
        ctxGame.shadowColor = colorInfo.glow;
        ctxGame.shadowBlur = 25;
        ctxGame.fill();
        ctxGame.restore();

        ctxGame.save();
        ctxGame.globalAlpha = alpha;
        ctxGame.font = "bold 15px Orbitron, Arial, sans-serif";
        ctxGame.textAlign = "center";
        ctxGame.fillStyle = colorInfo.glow;
        ctxGame.shadowColor = colorInfo.glow;
        ctxGame.shadowBlur = 10;
        ctxGame.fillText(pulse.message, x, targetY + 70);
        ctxGame.restore();
      } else {
        delete targetPulses[symbol];
      }
    }

    ctxGame.drawImage(arrowImages[symbol], Math.floor(x - 25), Math.floor(targetY - 25), 50, 50);
  });

  arrows = arrows.filter((arrow) => {
    if (arrow.judged) return false;
    arrow.y -= ARROW_SPEED_PX_PER_SEC * deltaTimeSec;

    ctxGame.drawImage(
      arrowImages[arrow.symbol],
      Math.floor(arrow.x - 25),
      Math.floor(arrow.y - 25),
      50,
      50
    );

    if (arrow.y <= -50) {
      // FIX BUG: sebelumnya arrow yang keluar layar langsung dibuang tanpa
      // dinilai sama sekali. Karena jarak target->keluar-layar (targetY=32
      // sampai y=-50) bisa ditempuh LEBIH CEPAT dari GOOD_WINDOW_SEC yang jadi
      // patokan checkHits() buat vonis Miss, arrow bisa "kabur" duluan sebelum
      // sempat dihakimi checkHits() - persis saat player diam tidak bergerak
      // sama sekali. Sekarang dipaksa jadi Miss di sini juga sebagai jaminan:
      // TIDAK ADA arrow yang boleh hilang tanpa penilaian, apapun skenarionya.
      judgeArrow(arrow, "miss");
      return false;
    }

    return true;
  });

  // --- HUD bawah: skor, combo, waktu ---
  drawFuturisticText("Skor: " + score, 20, 355, 18, "#00fff7", true, "left");
  drawFuturisticText(
    `Combo x${getComboMultiplier(combo)} (${combo})`,
    20, 375, 13, "#ffd54a", true, "left"
  );
  drawFuturisticText("Waktu: " + formatTime(timerValue), 380, 355, 18, "#ff0033", true, "right");

  // Health Bar visual gantiin teks "Miss: x/y", sumber datanya tetap
  // totalMisses/maxMisses yang sama, cuma cara gambarnya beda.
  drawHealthBar();

  floatingTexts.forEach((ft) => {
    ctxGame.save();
    ctxGame.globalAlpha = ft.opacity;
    ctxGame.font = `bold ${ft.big ? 32 : 24}px Orbitron, Arial, sans-serif`;
    ctxGame.textAlign = "center";
    ctxGame.fillStyle = "#ffd54a";
    ctxGame.shadowColor = "#ffd54a";
    ctxGame.shadowBlur = 20;
    ctxGame.fillText(ft.text, ft.x, ft.y);
    ctxGame.restore();
    ft.y -= 60 * deltaTimeSec;
    ft.opacity -= 3 * deltaTimeSec;
  });
  floatingTexts = floatingTexts.filter((ft) => ft.opacity > 0);

  ctxGame.restore();
}

function drawHealthBar() {
  const barWidth = 200;
  const barHeight = 14;
  const x = (gameCanvas.width - barWidth) / 2;
  const y = gameCanvas.height - 22;

  const healthPercent = Math.max(0, 1 - totalMisses / maxMisses);

  let barColor;
  if (healthPercent > 0.6) barColor = "#00f7ff";
  else if (healthPercent > 0.3) barColor = "#ffeb3b";
  else barColor = "#ff0000";

  ctxGame.save();
  ctxGame.strokeStyle = "white";
  ctxGame.lineWidth = 1.5;
  ctxGame.strokeRect(x, y, barWidth, barHeight);
  ctxGame.restore();

  ctxGame.save();
  ctxGame.fillStyle = "rgba(20, 20, 20, 0.7)";
  ctxGame.fillRect(x + 1, y + 1, barWidth - 2, barHeight - 2);
  ctxGame.restore();

  if (healthPercent > 0) {
    ctxGame.save();
    ctxGame.fillStyle = barColor;
    ctxGame.shadowColor = barColor;
    ctxGame.shadowBlur = 8;
    ctxGame.fillRect(x + 2, y + 2, (barWidth - 4) * healthPercent, barHeight - 4);
    ctxGame.restore();
  }

  ctxGame.save();
  ctxGame.font = "bold 11px Orbitron, Arial, sans-serif";
  ctxGame.textAlign = "right";
  ctxGame.fillStyle = "#ffffff";
  ctxGame.fillText("HP", x - 8, y + 11);
  ctxGame.restore();
}
