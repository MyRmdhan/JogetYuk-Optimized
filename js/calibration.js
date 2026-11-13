// ============================================================
// 🧘 CALIBRATION.JS — halaman kalibrasi pose (full-page SPA,
// diakses dari howto-page). Logic tidak berubah.
// ============================================================

function openCalibration() {
  document.getElementById("calibration-webcam-container").appendChild(webcam.canvas);
  showPage("calibration-page");
}

function closeCalibration() {
  document.getElementById("webcam-container").appendChild(webcam.canvas);
  showPage("howto-page");
}

function updateCalibrationUI(highest) {
  const calibPage = document.getElementById("calibration-page");
  if (!calibPage || !calibPage.classList.contains("active")) return;
  document.getElementById("calibration-pose-text").textContent = currentPose;
  document.getElementById("calibration-confidence").textContent = Math.round(
    (highest?.probability || 0) * 100
  );
}
