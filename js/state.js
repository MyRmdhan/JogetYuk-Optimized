// ============================================================
// 🗃️ STATE.JS — semua variabel state game yang berubah selama app jalan.
// Dipisah dari config.js (yang isinya nilai tetap) supaya jelas mana yang
// "boleh diubah runtime" vs "cuma buat di-tuning developer".
// ============================================================

let model, webcam;
let gameCanvas, ctxGame;

let arrows = [];
let floatingTexts = [];

let score = 0;
let combo = 0;
let currentPose = "";
let currentDifficulty = "normal";
let playerName = "Player 1"; // direkam dari halaman "Masukkan Nama"

let gameStarted = false;
let gameEnded = false;
let countdownValue = 3;
let timerValue = 120;
let countdownInterval, timerInterval;

let totalMisses = 0;
let maxMisses = 20;

let currentAudio = null;

let predictBusy = false;
let predictIntervalId = null;

// --- Beat-sync ---
let songAvailability = {};
let songBeatmapTextCache = {};
let songUnavailable = true;
let beatSchedule = [];
let nextBeatIndex = 0;

// --- Judgement (deteksi transisi pose) ---
let previousPoseForTransition = null;
let lastTransitionTime = {};
let transitionConsumed = {};
let targetPulses = {};

// --- Combo & shake ---
let shakeMagnitude = 0;
let shakeEndTime = 0;

// --- Skeleton overlay (interpolasi) ---
let previousPoseData = null;
let currentPoseDataForSkeleton = null;
let lastPoseUpdateTime = 0;

// --- Render loop ---
let lastFrameTimestamp = null;
