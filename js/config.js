// ============================================================
// ⚙️ CONFIG.JS — semua konstanta & flag kalibrasi ada di sini.
// Ini file PERTAMA yang harus di-load (lihat urutan <script> di index.html)
// karena modul lain membaca nilai-nilai ini.
// ============================================================

// Set true kalau lagi development dan mau lihat log informasional di console
// (misal backend TF.js yang aktif). Untuk build "rilis", biarkan false biar
// console tetap bersih untuk end-user - console.warn di tempat lain TETAP
// selalu tampil kapanpun karena itu representasi kondisi error asli, bukan
// info debug biasa.
const DEBUG_MODE = false;

function debugLog(...args) {
  if (DEBUG_MODE) console.log(...args);
}

const URL = "model/";

// --- Kecepatan & kepadatan gameplay ---
const ARROW_SPEED_PX_PER_SEC = 320; // px/detik, kecepatan scroll arrow (sama semua difficulty)

const DIFFICULTY_MISSES = { easy: 30, normal: 22, hard: 15 };
const DIFFICULTY_THINNING = { easy: 6, normal: 4, hard: 2 }; // ambil 1 dari tiap N beat

// --- Sistem Judgement (zona bayangan + presisi waktu) ---
const JUDGE_ZONE_LEAD_SEC = 0.35;
const PERFECT_WINDOW_SEC = 0.08;
const GOOD_WINDOW_SEC = 0.2;

// --- Combo & efek visual ---
const COMBO_SHAKE_MAGNITUDE = [3, 6, 10, 14];
const PULSE_DURATION_MS = 350;
const SHAKE_DURATION_MS = 300;

// --- Pose & arah ---
const POSE_DIRECTIONS = ["kiri", "atas", "kanan"];
const directions = ["⬅️", "⬆️", "➡️"];
const directionMap = { "⬅️": "kiri", "⬆️": "atas", "➡️": "kanan" };
const directionX = { "⬅️": 80, "⬆️": 180, "➡️": 280 };
const targetY = 32;

// Peta nama arah (dari file JSON beatmap) -> simbol emoji internal kita
const DIRECTION_TO_SYMBOL = { kiri: "⬅️", atas: "⬆️", kanan: "➡️" };

// --- Interval deteksi pose ---
const PREDICT_INTERVAL_MS = 120;
